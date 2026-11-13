"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Upload, Download, ClipboardList, CheckCircle2, X } from "lucide-react";
import { parseGenericCSV, validateMarksBatch, getMarksSampleCSV, sortStudentsByRoll } from "@/lib/domainParsers";
import UniversalImportModal from "@/components/UniversalImportModal";

// GP calculation (4.0 scale) based on linear grading policy:
// 50% = 1.0, 51% = 1.1, ..., 79% = 3.9, 80%+ = 4.0
function getGP(obtained: number, total: number): number {
  if (total <= 0) return 0.00;
  const pct = (obtained / total) * 100;
  const rounded = Math.round(pct);

  if (rounded < 50) return 0.00; // Fail
  if (rounded >= 80) return 4.00; // Max GP is 4.0 

  return parseFloat((1.00 + (rounded - 50) * 0.10).toFixed(2));
}

// Grade letter calculation based on HEC scale
function getGrade(obtained: number, total: number): string {
  if (total <= 0) return "F";
  const pct = (obtained / total) * 100;
  const rounded = Math.round(pct);

  if (rounded >= 85) return "A+";
  if (rounded >= 80) return "A";
  if (rounded >= 75) return "B+";
  if (rounded >= 65) return "B";
  if (rounded >= 61) return "C+";
  if (rounded >= 55) return "C";
  if (rounded >= 50) return "D";
  return "F";
}

export default function AddResultPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"editor" | "history" | "unlocks">("editor");
  const [entryType, setEntryType] = useState<"detailed" | "total">("detailed");

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [programs, setPrograms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<string[]>([
    "2024-2028", "2025-2029", "2026-2030", "2023-2027", "2022-2026",
    "2024-2026", "2025-2027", "2026-2028", "2023-2025", "2022-2024"
  ]);
  const [selectedProgType, setSelectedProgType] = useState("ALL");
  const [selectedSession, setSelectedSession] = useState("2024-2028");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [selectedCourse, setSelectedCourse] = useState("");

  const [courseTotalMarks, setCourseTotalMarks] = useState(100);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingCourses, setFetchingCourses] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Approval & Lock Lifecycle state
  const [resultStatus, setResultStatus] = useState<"SAVED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "UNLOCK_REQUESTED" | "UNLOCKED_FOR_EDIT">("SAVED");
  const [isLocked, setIsLocked] = useState(false);

  // Date-gate state (result entry locked until 1 day after exam)
  const [examDateLock, setExamDateLock] = useState<{ locked: boolean; unlockDate?: string; examDate?: string } | null>(null);

  // Live Metrics & Unlock Request State
  const [metricCounts, setMetricCounts] = useState({ saved: 0, pending: 0, unlockRequested: 0, approved: 0 });
  const [allCoursesStatusList, setAllCoursesStatusList] = useState<any[]>([]);
  const [unlockRequestsList, setUnlockRequestsList] = useState<any[]>([]);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [targetUnlockCourseId, setTargetUnlockCourseId] = useState("");
  const [unlockReason, setUnlockReason] = useState("");
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [submittingUnlockReq, setSubmittingUnlockReq] = useState(false);

  // Universal Import states for Marks
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationData, setValidationData] = useState<any>(null);
  const [importSourceName, setImportSourceName] = useState("");
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);

  const userRole = (session?.user as any)?.role || "";
  const userEmail = session?.user?.email || "";
  const userName = session?.user?.name || "";
  const userId = (session?.user as any)?.id || "";

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "BS_CONTROLLER"].includes(userRole);
  const isFaculty = ["FACULTY", "BS_FACULTY", "INTER_FACULTY", "TEACHER", "PRINCIPAL"].includes(userRole);
  const isFacultyLocked = isLocked && !isAdmin && resultStatus !== "UNLOCKED_FOR_EDIT";

  // Check if a course is assigned to the current faculty member
  const isAssignedToCurrentFaculty = (c: any) => {
    if (isAdmin) return true;
    if (!session?.user) return false;

    const uEmail = userEmail.toLowerCase().trim();
    const uName = userName.toLowerCase().trim();
    const uId = userId.trim();

    const fUser = c.faculty?.user;
    const fEmail = fUser?.email?.toLowerCase().trim() || "";
    const fName = fUser?.name?.toLowerCase().trim() || "";
    const fUserId = c.faculty?.userId || fUser?.id || "";

    if (uEmail && fEmail && uEmail === fEmail) return true;
    if (uId && fUserId && uId === fUserId) return true;
    if (uName && fName && uName === fName) return true;

    return false;
  };

  const loadMetrics = () => {
    fetch("/api/marks/unlock-request", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setMetricCounts(data.counts || { saved: 0, pending: 0, unlockRequested: 0, approved: 0 });
          setUnlockRequestsList(data.summaryList || []);
          setAllCoursesStatusList(data.allCoursesList || []);
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // Fetch all programs and courses (with no-store cache to get latest DB changes)
  const fetchProgramsAndCourses = () => {
    setFetchingCourses(true);
    Promise.all([
      fetch("/api/programs", { cache: "no-store" }).then(r => r.ok ? r.json() : []),
      fetch("/api/courses", { cache: "no-store" }).then(r => r.ok ? r.json() : []),
      fetch("/api/settings", { cache: "no-store" }).then(r => r.ok ? r.json() : {})
    ]).then(async ([pData, cData, sData]) => {
      const validProgs = Array.isArray(pData) ? pData.filter((p: any) => p.educationLevel === "BS" || !p.educationLevel) : [];
      const validCourses = Array.isArray(cData) ? cData : [];

      const settingsObj = (sData as any) || {};
      if (settingsObj.ACADEMIC_SESSIONS) {
        const { filterValidSessions } = await import("@/lib/sessionHelper");
        setSessions(filterValidSessions(settingsObj.ACADEMIC_SESSIONS));
      }

      setPrograms(validProgs);
      setCourses(validCourses);
      setFetchingCourses(false);

      // Check if URL parameters request a specific course or program/semester
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const paramCourseId = urlParams.get("courseId");
        const paramCourseTitle = urlParams.get("courseTitle");
        const paramProgramId = urlParams.get("programId");
        const paramSemester = urlParams.get("semester");
        const paramSession = urlParams.get("session");

        let targetC = null;
        if (paramCourseId) {
          targetC = validCourses.find((c: any) => c.id === paramCourseId);
        } else if (paramCourseTitle) {
          targetC = validCourses.find((c: any) => c.title?.toLowerCase() === paramCourseTitle.toLowerCase());
        }

        if (targetC) {
          if (targetC.programId) setSelectedProgram(targetC.programId);
          if (targetC.semester) setSelectedSemester(targetC.semester.toString());
          if (targetC.session) setSelectedSession(targetC.session);
          setSelectedCourse(targetC.id);
          const totals: Record<number, number> = { 1: 33, 2: 67, 3: 100, 4: 100 };
          setCourseTotalMarks(totals[targetC.creditHours] ?? 100);
          return;
        } else if (paramProgramId || paramSemester || paramSession) {
          if (paramProgramId) setSelectedProgram(paramProgramId);
          if (paramSemester) setSelectedSemester(paramSemester);
          if (paramSession) setSelectedSession(paramSession);
        }
      }

      // Auto-select faculty's first assigned course on load
      const facultyAssignedCourses = validCourses.filter(c => {
        if (isAdmin) return true;
        if (!userEmail) return false;
        const fUser = c.faculty?.user;
        const fEmail = fUser?.email?.toLowerCase().trim() || "";
        const fName = fUser?.name?.toLowerCase().trim() || "";
        const uEmail = userEmail.toLowerCase().trim();
        const uName = userName.toLowerCase().trim();
        return (uEmail && fEmail && uEmail === fEmail) || (uName && fName && uName === fName);
      });

      if (isFaculty && !isAdmin && facultyAssignedCourses.length > 0) {
        const firstAssigned = facultyAssignedCourses[0];
        setSelectedProgram(firstAssigned.programId);
        setSelectedSemester(firstAssigned.semester?.toString() || "1");
        if (firstAssigned.session) setSelectedSession(firstAssigned.session);
        setSelectedCourse(firstAssigned.id);
        const totals: Record<number, number> = { 1: 33, 2: 67, 3: 100, 4: 100 };
        setCourseTotalMarks(totals[firstAssigned.creditHours] ?? 100);
      } else if (validProgs.length > 0) {
        const firstProgId = validProgs[0].id;
        setSelectedProgram(firstProgId);
        const firstProgCourses = validCourses.filter((c: any) => c.programId === firstProgId);
        if (firstProgCourses.length > 0) {
          setSelectedSemester(firstProgCourses[0].semester?.toString() || "1");
          setSelectedCourse(firstProgCourses[0].id);
        }
      }
    }).catch(() => setFetchingCourses(false));
  };

  useEffect(() => {
    fetchProgramsAndCourses();
  }, [userEmail, userName, isFaculty]);

  // Identify all assigned courses for the logged-in faculty
  const myAssignedCourses = courses.filter(isAssignedToCurrentFaculty);

  // Available courses for dropdown (for Faculty, show all assigned courses regardless of program/semester filter)
  const dropdownCourses = isFaculty && !isAdmin ? myAssignedCourses : courses;

  // Handler when user selects a course from dropdown or quick bar
  const handleCourseChange = (courseId: string) => {
    if (!courseId) return;
    setSelectedCourse(courseId);
    setSuccessMsg("");
    setErrorMsg("");

    const targetCourse = courses.find(c => c.id === courseId);
    if (targetCourse) {
      // Auto-sync Program, Semester & Session to match the selected course
      if (targetCourse.programId) setSelectedProgram(targetCourse.programId);
      if (targetCourse.semester) setSelectedSemester(targetCourse.semester.toString());
      if (targetCourse.session) setSelectedSession(targetCourse.session);

      const totals: Record<number, number> = { 1: 33, 2: 67, 3: 100, 4: 100 };
      setCourseTotalMarks(totals[targetCourse.creditHours] ?? 100);
    }
  };

  // Datesheet Exam Scheme state (MID_FINAL vs TERMINAL scheme)
  const [datesheetInfo, setDatesheetInfo] = useState<any>(null);
  const [examScheme, setExamScheme] = useState<"MID_FINAL" | "TERMINAL">("MID_FINAL");

  // Fetch real students & existing marks whenever selectedCourse updates
  // Students are fetched via Enrollment for the specific course (not all program students)
  const loadCourseMarks = () => {
    if (!selectedCourse) {
      setStudents([]);
      setResultStatus("SAVED");
      setIsLocked(false);
      setExamDateLock(null);
      setDatesheetInfo(null);
      return;
    }

    setLoading(true);
    setExamDateLock(null);

    const queryParams = new URLSearchParams();
    queryParams.set("courseId", selectedCourse);
    if (selectedProgram) queryParams.set("programId", selectedProgram);
    if (selectedSession && selectedSession !== "ALL") queryParams.set("session", selectedSession);
    if (selectedSemester) queryParams.set("currentSemester", selectedSemester);

    Promise.all([
      // Fetch students enrolled in this specific course (via Enrollment table)
      fetch(`/api/students?${queryParams}`, { cache: "no-store" }).then(r => r.ok ? r.json() : []),
      fetch(`/api/marks?courseId=${selectedCourse}`, { cache: "no-store" }).then(r => r.json()),
      fetch(`/api/datesheet?courseId=${selectedCourse}`, { cache: "no-store" }).then(r => r.ok ? r.json() : [])
    ]).then(([sData, mData, dsData]) => {
      const studentList = Array.isArray(sData) ? sData : [];

      // Auto-detect exam scheme from Datesheet if available
      const dsArr = Array.isArray(dsData) ? dsData : [];
      if (dsArr.length > 0) {
        const latestDs = dsArr[0];
        setDatesheetInfo(latestDs);
        if (latestDs.examType === "TERMINAL" || latestDs.examType === "TERMINAL_EXAM") {
          setExamScheme("TERMINAL");
        } else if (latestDs.examType === "MID_TERM" || latestDs.examType === "FINAL_TERM") {
          setExamScheme("MID_FINAL");
        }
      } else {
        setDatesheetInfo(null);
      }

      // Handle date-gate error from marks API
      if (mData && !Array.isArray(mData) && mData.locked === true) {
        setExamDateLock({ locked: true, unlockDate: mData.unlockDate, examDate: mData.examDate });
        setStudents([]);
        setLoading(false);
        return;
      }

      const marksArr = Array.isArray(mData) ? mData : [];

      if (marksArr.length > 0) {
        setResultStatus((marksArr[0].status as any) || "SAVED");
        setIsLocked(Boolean(marksArr[0].isLocked));
      } else {
        setResultStatus("SAVED");
        setIsLocked(false);
      }

      const mapped = studentList.map((st: any) => {
        const existing = marksArr.find((m: any) => m.studentId === st.id);
        const isAbsent = existing?.status === "ABSENT" || existing?.status === "A";
        const rawName = st.user?.name || st.name || "Student";

        // Clean name so "(Dropout)" is never shown with the name
        const cleanName = rawName.replace(/\s*\(\s*dropout\s*\)/gi, "").replace(/\s*dropout\s*/gi, "").trim();

        // Dropout policy rule:
        // Dropout status is ONLY calculated AFTER at least 1 full semester is completed (Semester >= 2).
        // During 1st semester marks entry, students cannot have dropout status because SGPA is not yet finalized.
        const isFirstSemester = selectedSemester === "1" || st.currentSemester === 1;

        let isDropout = false;
        if (!isFirstSemester) {
          const hasDropoutStatus =
            st.statuses?.some((s: any) => s.statusType?.toUpperCase() === "DROPOUT" && s.isActive !== false) ||
            st.promotions?.some((p: any) => p.status?.toUpperCase() === "DROPOUT" && p.isActive !== false) ||
            st.status === "DROPOUT" ||
            existing?.status === "DROPOUT";
          isDropout = Boolean(hasDropoutStatus);
        }

        return {
          id: st.id,
          name: cleanName,
          fatherName: st.fatherName || st.user?.fatherName || "",
          roll: st.rollNumber || st.roll || "N/A",
          session: st.session || "",
          currentSemester: st.currentSemester || 1,
          bsAdmissionType: st.bsAdmissionType || "REGULAR",
          isDropout,
          attendance: isAbsent ? "ABSENT" : "PRESENT",
          assignment: (isAbsent || isDropout) ? 0 : (existing?.assignmentMarks || 0),
          quiz: (isAbsent || isDropout) ? 0 : (existing?.quizMarks || 0),
          practical: (isAbsent || isDropout) ? 0 : (existing?.practicalMarks || 0),
          mid: (isAbsent || isDropout) ? 0 : (existing?.midtermMarks || 0),
          final: (isAbsent || isDropout) ? 0 : (existing?.finalMarks || 0),
          totalOnly: (isAbsent || isDropout) ? 0 : (existing?.obtainedMarks || 0),
        };
      });

      setStudents(sortStudentsByRoll(mapped));
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadCourseMarks();
  }, [selectedCourse, selectedProgram, selectedSession, selectedSemester]);

  const handleImportMarksCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedCourse) {
      alert("Please select a Course first before importing marks.");
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseGenericCSV(text);
      if (parsed.length === 0) {
        setErrorMsg("Invalid or empty CSV file. Ensure headers like Roll Number, Midterm, Final exist.");
        return;
      }
      const validation = validateMarksBatch(parsed, courseTotalMarks, students);
      setValidationData(validation);
      setImportSourceName(file.name);
      setValidationModalOpen(true);
    } catch {
      setErrorMsg("Failed to read marks CSV file.");
    } finally {
      e.target.value = "";
    }
  };

  const handleProcessPastedText = () => {
    if (!pasteText.trim()) return;
    if (!selectedCourse) {
      alert("Please select a Course first before importing marks.");
      return;
    }

    try {
      const parsed = parseGenericCSV(pasteText);
      if (parsed.length === 0) {
        setErrorMsg("Could not parse records from pasted marks data.");
        return;
      }
      const validation = validateMarksBatch(parsed, courseTotalMarks, students);
      setValidationData(validation);
      setImportSourceName("Pasted Data");
      setPasteModalOpen(false);
      setValidationModalOpen(true);
    } catch {
      setErrorMsg("Failed to parse pasted text.");
    }
  };

  const handleConfirmMarksImport = async (validRows: Record<string, string>[]) => {
    if (validRows.length === 0) return;
    setIsImporting(true);

    try {
      const res = await fetch("/api/marks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: validRows,
          courseId: selectedCourse
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setValidationModalOpen(false);
        setPasteText("");
        setImportSummary(data);
        setSuccessMsg(`Marks imported successfully: ${data.imported} new scores, ${data.updated} updated.`);
        loadCourseMarks();
      } else {
        setErrorMsg(data.error || "Failed to import marks.");
      }
    } catch {
      setErrorMsg("Communication error while importing marks.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadMarksTemplate = () => {
    let csvContent = "";
    if (students.length > 0) {
      const headers = ["Roll Number", "Student Name", "Midterm", "Final", "Assignment", "Quiz", "Total"];
      const rows = students.map(s => [
        `"${s.roll || ""}"`,
        `"${s.name || ""}"`,
        s.mid || 0,
        s.final || 0,
        s.assignment || 0,
        s.quiz || 0,
        courseTotalMarks
      ]);
      csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    } else {
      csvContent = "\uFEFF" + getMarksSampleCSV();
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Marks_Grade_Sheet_${selectedCourse || "Template"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleStudentAttendance = (id: string, newStatus: "PRESENT" | "ABSENT") => {
    if (isFacultyLocked) return;
    setStudents(students.map(s => {
      if (s.id !== id || s.isDropout) return s;
      if (newStatus === "ABSENT") {
        return {
          ...s,
          attendance: "ABSENT",
          assignment: 0,
          quiz: 0,
          practical: 0,
          mid: 0,
          final: 0,
          totalOnly: 0
        };
      }
      return { ...s, attendance: "PRESENT" };
    }));
  };

  const markAllAttendance = (status: "PRESENT" | "ABSENT") => {
    if (isFacultyLocked) return;
    setStudents(students.map(s => {
      if (s.isDropout) return s;
      if (status === "ABSENT") {
        return {
          ...s,
          attendance: "ABSENT",
          assignment: 0,
          quiz: 0,
          practical: 0,
          mid: 0,
          final: 0,
          totalOnly: 0
        };
      }
      return { ...s, attendance: "PRESENT" };
    }));
  };

  const currentSelectedCourse = courses.find(c => c.id === selectedCourse);
  const isPracticalCourse = Boolean(
    currentSelectedCourse && (
      (currentSelectedCourse.creditHoursFormat && currentSelectedCourse.creditHoursFormat.includes("-1")) ||
      (currentSelectedCourse.labHours && currentSelectedCourse.labHours > 0) ||
      currentSelectedCourse.courseType === "LAB_PRACTICAL" ||
      currentSelectedCourse.courseType === "PRACTICAL" ||
      (currentSelectedCourse.code && currentSelectedCourse.code.toLowerCase().includes("lab"))
    )
  );

  const handleMarkChange = (id: string, field: string, value: string) => {
    if (isFacultyLocked) return;
    const numValue = parseFloat(value) || 0;
    const student = students.find(s => s.id === id);
    if (!student || student.attendance === "ABSENT" || student.isDropout) return;

    const totalQuizAssignLimit = examScheme === "TERMINAL"
      ? (isPracticalCourse ? 5 : 30)
      : (isPracticalCourse ? 15 : 30);

    if (field === "assignment") {
      const remainingForAssign = Math.max(0, totalQuizAssignLimit - student.quiz);
      if (student.quiz >= totalQuizAssignLimit && numValue > 0) {
        alert(`Quiz already has ${student.quiz}/${totalQuizAssignLimit} marks! Assignment is auto-blocked.`);
        return;
      }
      if (numValue > remainingForAssign) {
        alert(`Combined Assignment + Quiz marks cannot exceed ${totalQuizAssignLimit}! Current Quiz is ${student.quiz}, so Assignment max allowed is ${remainingForAssign}.`);
        return;
      }
    }

    if (field === "quiz") {
      const remainingForQuiz = Math.max(0, totalQuizAssignLimit - student.assignment);
      if (student.assignment >= totalQuizAssignLimit && numValue > 0) {
        alert(`Assignment already has ${student.assignment}/${totalQuizAssignLimit} marks! Quiz is auto-blocked.`);
        return;
      }
      if (numValue > remainingForQuiz) {
        alert(`Combined Assignment + Quiz marks cannot exceed ${totalQuizAssignLimit}! Current Assignment is ${student.assignment}, so Quiz max allowed is ${remainingForQuiz}.`);
        return;
      }
    }

    if (examScheme === "TERMINAL") {
      // ── TERMINAL EXAM SCHEME (Datesheet Decided: Single 70 Terminal Paper) ──
      if (isPracticalCourse) {
        if (field === "practical" && numValue > 25) {
          alert("Practical marks cannot exceed 25!");
          return;
        }
        if (field === "final" && numValue > 70) {
          alert("Terminal Exam marks cannot exceed 70!");
          return;
        }
      } else {
        if (field === "final" && numValue > 70) {
          alert("Terminal Exam marks cannot exceed 70!");
          return;
        }
      }
    } else {
      // ── MID + FINAL SCHEME (Mid 30/20 + Final 40) ──
      if (isPracticalCourse) {
        if (field === "practical" && numValue > 25) {
          alert("Practical marks cannot exceed 25 for 4(3-1) credit course!");
          return;
        }
        if (field === "mid" && numValue > 20) {
          alert("Midterm marks cannot exceed 20 for 4(3-1) credit course!");
          return;
        }
        if (field === "final" && numValue > 40) {
          alert("Final Term marks cannot exceed 40!");
          return;
        }
      } else {
        if (field === "mid" && numValue > 30) {
          alert("Midterm marks cannot exceed 30!");
          return;
        }
        if (field === "final" && numValue > 40) {
          alert("Final Term marks cannot exceed 40!");
          return;
        }
      }
    }

    setStudents(students.map(s => s.id === id ? { ...s, [field]: numValue } : s));
  };

  const handleTotalOnlyChange = (id: string, value: string) => {
    if (isFacultyLocked) return;
    const student = students.find(s => s.id === id);
    if (!student || student.attendance === "ABSENT" || student.isDropout) return;
    const numValue = parseFloat(value) || 0;
    if (numValue > courseTotalMarks) {
      alert(`Total marks cannot exceed ${courseTotalMarks}!`);
      return;
    }
    setStudents(students.map(s => s.id === id ? { ...s, totalOnly: numValue } : s));
  };

  const handleUpdateStatus = async (
    targetStatus: "SAVED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED",
    lockTarget?: boolean
  ) => {
    if (!selectedCourse) return alert("Please select a course first.");
    if (students.length === 0) return alert("No students found to save marks.");

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const lockVal = lockTarget !== undefined ? lockTarget : (targetStatus === "APPROVED");

    let successCount = 0;
    let lastError = "";
    for (const s of students) {
      const isStudentAbsent = s.attendance === "ABSENT";
      const isStudentDropout = Boolean(s.isDropout);
      const studentStatus = isStudentDropout ? "DROPOUT" : isStudentAbsent ? "ABSENT" : targetStatus;
      try {
        const res = await fetch("/api/marks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: s.id,
            courseId: selectedCourse,
            assignmentMarks: (isStudentAbsent || isStudentDropout) ? 0 : s.assignment,
            quizMarks: (isStudentAbsent || isStudentDropout) ? 0 : s.quiz,
            practicalMarks: (isStudentAbsent || isStudentDropout) ? 0 : (isPracticalCourse ? s.practical : 0),
            midtermMarks: (isStudentAbsent || isStudentDropout) ? 0 : s.mid,
            finalMarks: (isStudentAbsent || isStudentDropout) ? 0 : s.final,
            totalMarks: courseTotalMarks,
            status: studentStatus,
            isLocked: lockVal,
          })
        });
        if (res.ok) {
          successCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = errData.error || "Server error";
        }
      } catch (e: any) {
        lastError = e.message;
      }
    }

    setSaving(false);
    if (successCount > 0) {
      setResultStatus(targetStatus);
      setIsLocked(lockVal);
      loadMetrics();
      if (targetStatus === "SAVED") {
        setSuccessMsg("💾 Marks saved as Draft!");
      } else if (targetStatus === "PENDING_APPROVAL") {
        setSuccessMsg("🚀 Result published & submitted for Admin Approval!");
      } else if (targetStatus === "APPROVED") {
        setSuccessMsg("✅ Result approved & locked for Faculty!");
      } else if (targetStatus === "REJECTED") {
        setSuccessMsg("🔓 Result unlocked & returned to Faculty for editing.");
      }
    } else {
      setErrorMsg(lastError ? `Failed to save marks: ${lastError}` : "Failed to update result status. Please try again.");
    }
  };

  // Submit Unlock Request (Faculty)
  const openUnlockRequestForCourse = (cId?: string) => {
    const idToUse = cId || selectedCourse;
    setTargetUnlockCourseId(idToUse);
    setUnlockModalOpen(true);
  };

  const handleRequestUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockReason.trim()) return alert("Please specify the reason for edit request.");
    setSubmittingUnlockReq(true);
    const cId = targetUnlockCourseId || selectedCourse;

    try {
      const res = await fetch("/api/marks/unlock-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: cId, reason: unlockReason })
      });
      const data = await res.json();
      if (res.ok) {
        setResultStatus("UNLOCK_REQUESTED");
        if (typeof window !== "undefined") sessionStorage.setItem("req_sent_" + cId, "true");
        setSuccessMsg("📩 Edit Request sent to Admin! Reason: " + unlockReason);
        setUnlockModalOpen(false);
        setUnlockReason("");
        loadMetrics();
      } else {
        setErrorMsg(data.error || "Failed to submit unlock request");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
    setSubmittingUnlockReq(false);
  };

  // Admin Approve / Reject Unlock Request
  const handleAdminProcessUnlock = async (cId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/marks/unlock-request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: cId, action })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        loadMetrics();
        if (cId === selectedCourse) {
          if (action === "APPROVE") {
            setIsLocked(false);
            setResultStatus("UNLOCKED_FOR_EDIT");
          } else {
            setResultStatus("APPROVED");
            setIsLocked(true);
          }
        }
      } else {
        setErrorMsg(data.error || "Failed to process request");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Load course into editor
  const handleLoadCourseIntoEditor = (courseId: string) => {
    handleCourseChange(courseId);
    setActiveTab("editor");
  };

  const filteredStudentsList = sortStudentsByRoll(
    students.filter(st => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = st.name.toLowerCase().includes(q);
        const matchRoll = st.roll.toLowerCase().includes(q);
        if (!matchName && !matchRoll) return false;
      }
      if (selectedSession && selectedSession !== "ALL" && st.session && st.session !== selectedSession) {
        return false;
      }
      if (selectedProgType === "ALL") return true;
      if (selectedProgType === "REGULAR") return st.bsAdmissionType === "REGULAR" || !st.bsAdmissionType;
      if (selectedProgType === "BRIDGING") return st.bsAdmissionType === "BRIDGING_5TH";
      if (selectedProgType === "MIGRATION") return st.bsAdmissionType === "MIGRATION";
      return true;
    })
  );

  // Filter history lists for Faculty
  const facultyHistoryCourses = allCoursesStatusList.filter((c: any) =>
    !isFaculty || (c.facultyEmail && userEmail && c.facultyEmail.toLowerCase() === userEmail.toLowerCase()) || isAssignedToCurrentFaculty(c)
  );

  const facultyUnlockRequests = allCoursesStatusList.filter((c: any) =>
    c.status === "UNLOCK_REQUESTED" || c.status === "UNLOCKED_FOR_EDIT" || (c.status === "APPROVED" && typeof window !== "undefined" && sessionStorage.getItem("alert_shown_" + c.courseId + "_APPROVED"))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add & Manage Student Results</h1>
          <p className="text-gray-500 mt-1">Enter marks, calculate GPA & grades, and manage result lock approvals.</p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          {resultStatus === "APPROVED" && (
            <span className="px-3.5 py-1.5 bg-green-100 text-green-800 border border-green-300 font-extrabold text-xs rounded-full flex items-center gap-1.5 shadow-sm">
              <span>🔒 Approved & Locked</span>
            </span>
          )}
          {resultStatus === "PENDING_APPROVAL" && (
            <span className="px-3.5 py-1.5 bg-blue-100 text-blue-800 border border-blue-300 font-extrabold text-xs rounded-full flex items-center gap-1.5 shadow-sm">
              <span>⏳ Pending Admin Approval</span>
            </span>
          )}
          {resultStatus === "UNLOCK_REQUESTED" && (
            <span className="px-3.5 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs rounded-full flex items-center gap-1.5 shadow-sm animate-pulse">
              <span>📩 Unlock Requested</span>
            </span>
          )}
          {resultStatus === "UNLOCKED_FOR_EDIT" && (
            <span className="px-3.5 py-1.5 bg-purple-100 text-purple-900 border border-purple-300 font-extrabold text-xs rounded-full flex items-center gap-1.5 shadow-sm">
              <span>🔓 Unlocked for Edit</span>
            </span>
          )}
          {resultStatus === "SAVED" && (
            <span className="px-3.5 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 font-bold text-xs rounded-full">
              <span>💾 Draft Saved</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => setActiveTab("editor")}
          className={`px-5 py-3 text-xs font-bold rounded-t-2xl border-t border-l border-r transition-all flex items-center gap-2 ${activeTab === "editor"
            ? "bg-white text-blue-600 border-gray-200 shadow-sm"
            : "bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent"
            }`}
        >
          <span>✏️ Marks Entry & Calculator</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 text-xs font-bold rounded-t-2xl border-t border-l border-r transition-all flex items-center gap-2 ${activeTab === "history"
            ? "bg-white text-blue-600 border-gray-200 shadow-sm"
            : "bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent"
            }`}
        >
          <span>📋 My Saved & Published Results List</span>
          <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-800 font-black rounded-full">
            {facultyHistoryCourses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("unlocks")}
          className={`px-5 py-3 text-xs font-bold rounded-t-2xl border-t border-l border-r transition-all flex items-center gap-2 ${activeTab === "unlocks"
            ? "bg-white text-amber-700 border-gray-200 shadow-sm"
            : "bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent"
            }`}
        >
          <span>📩 Unlock Requests Status</span>
          {metricCounts.unlockRequested > 0 && (
            <span className="px-2 py-0.5 text-[10px] bg-red-600 text-white font-black rounded-full animate-pulse">
              {metricCounts.unlockRequested}
            </span>
          )}
        </button>
      </div>

      {/* Live Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Draft Results</p>
            <p className="text-2xl font-black text-gray-800">{metricCounts.saved}</p>
          </div>
          <span className="text-2xl p-2 bg-gray-100 rounded-xl">💾</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase">Pending Approval</p>
            <p className="text-2xl font-black text-blue-900">{metricCounts.pending}</p>
          </div>
          <span className="text-2xl p-2 bg-blue-50 rounded-xl">⏳</span>
        </div>

        <div
          className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${metricCounts.unlockRequested > 0 ? "border-amber-400 bg-amber-50/40 ring-2 ring-amber-300" : "border-gray-100"
            }`}
          onClick={() => isAdmin ? setAdminModalOpen(true) : setActiveTab("unlocks")}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-amber-700 uppercase">Unlock Requests</p>
              {metricCounts.unlockRequested > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-red-600 text-white font-extrabold rounded-full animate-pulse">
                  {metricCounts.unlockRequested}
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-amber-900">{metricCounts.unlockRequested}</p>
          </div>
          <span className="text-2xl p-2 bg-amber-100 rounded-xl">📩</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-green-700 uppercase">Approved & Locked</p>
            <p className="text-2xl font-black text-green-900">{metricCounts.approved}</p>
          </div>
          <span className="text-2xl p-2 bg-green-50 rounded-xl">🔒</span>
        </div>
      </div>

      {successMsg && <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-bold">{successMsg}</div>}
      {errorMsg && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm font-bold">{errorMsg}</div>}

      {/* ────────────────── TAB 1: MARKS EDITOR ────────────────── */}
      {activeTab === "editor" && (
        <div className="space-y-6">
          {/* FACULTY QUICK ASSIGNED COURSES BAR */}
          {isFaculty && myAssignedCourses.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-2xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs font-black uppercase text-blue-900 tracking-wider flex items-center gap-1.5">
                  <span>🎯 Your Allocated Courses ({myAssignedCourses.length}) — Click to Auto-Load Marks:</span>
                </span>
                <button
                  onClick={fetchProgramsAndCourses}
                  disabled={fetchingCourses}
                  className="text-xs font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all flex items-center gap-1"
                >
                  <span>{fetchingCourses ? "🔄 Refreshing..." : "🔄 Refresh Allocated Courses"}</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {myAssignedCourses.map((ac: any) => {
                  const isSelected = ac.id === selectedCourse;
                  const progName = ac.program?.name || "BS";
                  return (
                    <button
                      key={ac.id}
                      onClick={() => handleCourseChange(ac.id)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 shadow-sm ${isSelected
                        ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 scale-[1.02]"
                        : "bg-white text-gray-800 border-blue-200 hover:bg-blue-100 hover:text-blue-900"
                        }`}
                    >
                      <span>📚 {ac.title} ({ac.code})</span>
                      <span className={`px-2 py-0.5 text-[10px] rounded-md font-semibold ${isSelected ? "bg-blue-800 text-white" : "bg-blue-100 text-blue-800"}`}>
                        {progName} | Sem {ac.semester} | {ac.session || '2025'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date-Gate: Result entry locked until 1 day after exam */}
          {examDateLock?.locked && (
            <div className="p-5 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-4 shadow-sm">
              <span className="text-4xl">🔐</span>
              <div className="flex-1">
                <h4 className="text-sm font-black text-red-900">Result Entry Locked — Exam Not Yet Finished</h4>
                <p className="text-xs text-red-700 mt-1 font-semibold">
                  Result entry for this course opens <strong>1 day after the exam date</strong>.
                </p>
                {examDateLock.examDate && (
                  <p className="text-xs text-red-600 mt-1">
                    📅 Exam Date: <strong>{new Date(examDateLock.examDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</strong>
                  </p>
                )}
                {examDateLock.unlockDate && (
                  <p className="text-xs text-green-700 mt-1 font-bold">
                    ✅ Unlocks on: {new Date(examDateLock.unlockDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Lock Warning & Unlock Request Card for Faculty */}
          {isFacultyLocked && (

            <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔒</span>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">Result is Approved & Locked by Admin</h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Marks are locked and cannot be edited directly by Faculty. If you need to make changes, send an unlock request to Admin with your reason.
                  </p>
                </div>
              </div>
              <button
                onClick={() => openUnlockRequestForCourse(selectedCourse)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>📩 Request Unlock / Edit Permission</span>
              </button>
            </div>
          )}

          {resultStatus === "UNLOCK_REQUESTED" && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-xs text-blue-900 font-semibold shadow-sm">
              <span className="text-2xl">⏳</span>
              <div>
                <strong className="block font-extrabold text-blue-950 text-sm">Unlock Request Submitted</strong>
                Your request to edit marks is pending Admin approval. As soon as Admin approves, marks will unlock automatically.
              </div>
            </div>
          )}

          {/* Filters Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Class & Course</h2>
              <button
                onClick={fetchProgramsAndCourses}
                disabled={fetchingCourses}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>{fetchingCourses ? "🔄 Refreshing..." : "🔄 Reload Latest Courses"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Academic Session</label>
                <select
                  className="w-full px-3 py-2 border rounded-xl text-sm font-bold bg-white text-gray-900"
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  {sessions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Degree Program</label>
                <select
                  className="w-full px-3 py-2 border rounded-xl text-sm font-bold bg-white text-gray-900"
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Semester</label>
                <select
                  className="w-full px-3 py-2 border rounded-xl text-sm font-bold bg-white text-gray-900"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s.toString()}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Course / Subject</label>
                <select
                  className="w-full px-3 py-2 border rounded-xl text-sm font-bold bg-white text-gray-900"
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                >
                  {dropdownCourses.length > 0 ? (
                    dropdownCourses.map((c) => {
                      const progName = c.program?.name || "BS";
                      const creditFmt = c.creditHoursFormat || (c.labHours && c.labHours > 0 ? `${c.creditHours}(${c.theoryHours || c.creditHours - c.labHours}-${c.labHours})` : `${c.creditHours}(${c.creditHours}-0)`);
                      return (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.code}) — {creditFmt} Cr | {progName} | Sem {c.semester} | Session {c.session || '2025'}
                        </option>
                      );
                    })
                  ) : (
                    <option value="">No courses available</option>
                  )}
                </select>
              </div>
            </div>

            {/* Student Category Filter, Exam Scheme & Entry Mode */}
            <div className="pt-3 border-t space-y-3">
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-3.5 rounded-xl border border-purple-200/80 flex items-center justify-between flex-wrap gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <span className="text-[11px] font-black uppercase text-purple-900 tracking-wider">Exam Scheme Mode (Decided by Datesheet):</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <strong className="text-xs font-black text-gray-900">
                        {examScheme === "TERMINAL"
                          ? `🎓 Single Terminal Exam Scheme — ${isPracticalCourse ? 'Quiz+Assign (5) + Practical (25) + Terminal (70) = 100' : 'Quiz+Assign (30) + Terminal Exam (70) = 100'}`
                          : `📑 Mid + Final Scheme — ${isPracticalCourse ? 'Quiz+Assign (15) + Practical (25) + Mid (20) + Final (40) = 100' : 'Quiz+Assign (30) + Mid (30) + Final (40) = 100'}`}
                      </strong>
                      {datesheetInfo && (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-purple-200 text-purple-950 rounded-full border border-purple-300">
                          Datesheet ({datesheetInfo.examType})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-purple-200 shadow-sm">
                  <button
                    onClick={() => setExamScheme("MID_FINAL")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${examScheme === "MID_FINAL" ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    Mid (30/20) + Final (40)
                  </button>
                  <button
                    onClick={() => setExamScheme("TERMINAL")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${examScheme === "TERMINAL" ? "bg-purple-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    Single Terminal Exam (70)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 uppercase">Student Type:</span>
                  <div className="flex gap-2">
                    {[
                      { id: "ALL", label: "All Students" },
                      { id: "REGULAR", label: "Regular 4-Year" },
                      { id: "BRIDGING", label: "Bridging 5th Sem" },
                      { id: "MIGRATION", label: "Migration" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedProgType(t.id)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${selectedProgType === t.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 uppercase">Entry Mode:</span>
                  <div className="flex bg-gray-100 p-1 rounded-xl border">
                    <button
                      onClick={() => setEntryType("detailed")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${entryType === "detailed" ? "bg-white text-blue-600 shadow" : "text-gray-600"
                        }`}
                    >
                      Detailed Split ({examScheme === "TERMINAL" ? (isPracticalCourse ? "Quiz+Assign 5 / Prac 25 / Terminal 70" : "Quiz+Assign 30 / Terminal 70") : (isPracticalCourse ? "Quiz+Assign 15 / Prac 25 / Mid 20 / Final 40" : "Mid 30 / Final 40 / Quiz+Assign 30")})
                    </button>
                    <button
                      onClick={() => setEntryType("total")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${entryType === "total" ? "bg-white text-blue-600 shadow" : "text-gray-600"
                        }`}
                    >
                      Direct Total Marks
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exam Paper Attendance Summary Bar */}
          <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider flex items-center gap-2">
                  <span>Exam Paper Attendance Status</span>
                </h4>
                <p className="text-xs text-blue-800 font-semibold mt-0.5">
                  Students marked as <strong>Absent (A)</strong> are automatically locked from mark entry and marked with <strong>'A'</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-700 shadow-sm">
                Total: <strong>{students.length}</strong>
              </span>
              <span className="px-3 py-1.5 bg-green-100 border border-green-300 rounded-xl text-green-800 shadow-sm font-extrabold">
                Present: <strong>{students.filter(s => s.attendance !== "ABSENT").length}</strong>
              </span>
              <span className="px-3 py-1.5 bg-red-100 border border-red-300 rounded-xl text-red-800 shadow-sm font-black">
                Absent (A): <strong>{students.filter(s => s.attendance === "ABSENT").length}</strong>
              </span>
            </div>
          </div>

          {/* Marks Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700">📊 Total Marks (out of):</span>
                <input
                  type="number"
                  value={courseTotalMarks}
                  onChange={(e) => setCourseTotalMarks(parseInt(e.target.value) || 100)}
                  disabled={isFacultyLocked}
                  className="w-20 px-3 py-1 border rounded-lg text-xs font-bold bg-white text-center"
                />
                {isPracticalCourse ? (
                  <span className="px-2.5 py-1 text-xs font-extrabold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                    🔬 Practical Included — {examScheme === "TERMINAL" ? "Quiz+Assign: 5, Prac: 25, Terminal: 70" : "Quiz+Assign: 15, Prac: 25, Mid: 20, Final: 40"}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-extrabold bg-purple-100 text-purple-900 rounded-full border border-purple-200">
                    📖 Theory Course — {examScheme === "TERMINAL" ? "Quiz+Assign: 30, Terminal Exam: 70" : "Quiz+Assign: 30, Mid: 30, Final: 40"}
                  </span>
                )}
              </div>

              <div className="flex gap-2 items-center flex-wrap">
                <input
                  type="text"
                  placeholder="Search by student name or roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 border rounded-xl text-xs font-bold w-52 bg-white"
                />

                <label className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Import Marks</span>
                  <input type="file" accept=".csv, .tsv, .txt" onChange={handleImportMarksCSV} className="hidden" />
                </label>

                <button
                  onClick={() => setPasteModalOpen(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Paste copied scores from Excel"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Paste Excel</span>
                </button>

                <button
                  onClick={handleDownloadMarksTemplate}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Download marks entry template CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Template</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <p className="text-center py-12 text-gray-400">Loading student records & marks...</p>
              ) : filteredStudentsList.length > 0 ? (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-xs font-bold text-gray-600 uppercase">
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Student & Father Name</th>
                      {entryType === "detailed" ? (
                        <>
                          <th className="p-3">Assign (Limit {examScheme === "TERMINAL" ? (isPracticalCourse ? '5' : '30') : (isPracticalCourse ? '15' : '30')})</th>
                          <th className="p-3">Quiz (Limit {examScheme === "TERMINAL" ? (isPracticalCourse ? '5' : '30') : (isPracticalCourse ? '15' : '30')})</th>
                          {isPracticalCourse && (
                            <th className="p-3 bg-blue-100/70 text-blue-900 border-x border-blue-200">Practical (25)</th>
                          )}
                          {examScheme === "TERMINAL" ? (
                            <th className="p-3 text-gray-400 bg-gray-100/80">Mid Term (Disabled)</th>
                          ) : (
                            <th className="p-3">Mid Term ({isPracticalCourse ? '20' : '30'})</th>
                          )}
                          {examScheme === "TERMINAL" ? (
                            <th className="p-3 bg-purple-100/80 text-purple-950 font-black border-x border-purple-300">Terminal Exam (70)</th>
                          ) : (
                            <th className="p-3">Final Term (40)</th>
                          )}
                          <th className="p-3">Obtained Total</th>
                        </>
                      ) : (
                        <th className="p-3">Total Obtained Marks</th>
                      )}
                      <th className="p-3">Grade</th>
                      <th className="p-3">GP Value</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentsList.map((st, idx) => {
                      const isAbsent = st.attendance === "ABSENT";
                      const isDropout = Boolean(st.isDropout);
                      const isBlocked = isAbsent || isDropout;

                      const totalQuizAssignLimit = examScheme === "TERMINAL"
                        ? (isPracticalCourse ? 5 : 30)
                        : (isPracticalCourse ? 15 : 30);
                      const quizHasFullMarks = (st.quiz || 0) >= totalQuizAssignLimit;
                      const assignHasFullMarks = (st.assignment || 0) >= totalQuizAssignLimit;

                      const calculatedObtained = isBlocked
                        ? 0
                        : (entryType === "detailed"
                          ? (st.assignment + st.quiz + (isPracticalCourse ? (st.practical || 0) : 0) + (examScheme === "TERMINAL" ? 0 : st.mid) + st.final)
                          : st.totalOnly);
                      const gp = isBlocked ? 0.0 : getGP(calculatedObtained, courseTotalMarks);
                      const grade = isDropout ? "-" : isAbsent ? "F (A)" : getGrade(calculatedObtained, courseTotalMarks);
                      const isPass = !isBlocked && gp >= 1.0;

                      return (
                        <tr key={st.id} className={`border-b transition-colors ${isDropout ? "bg-gray-50/80" : isAbsent ? "bg-red-50/20" : "hover:bg-gray-50/50"}`}>
                          <td className="p-3 text-center text-xs font-bold text-gray-400">
                            {idx + 1}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="text-xs font-mono font-semibold text-gray-800 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md">
                              {st.roll}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-gray-900 font-bold">{st.name}</strong>
                              {isAbsent && !isDropout && (
                                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-red-100 text-red-700 border border-red-200">
                                  ❌ ABSENT (A)
                                </span>
                              )}
                            </div>
                            {st.fatherName && (
                              <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">
                                S/D of: {st.fatherName}
                              </p>
                            )}
                            {st.bsAdmissionType === "BRIDGING_5TH" && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] bg-purple-100 text-purple-700 font-bold rounded-full">Bridging 5th</span>
                            )}
                          </td>

                          {entryType === "detailed" ? (
                            <>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  max={totalQuizAssignLimit}
                                  value={isBlocked ? (isDropout ? "" : 0) : (quizHasFullMarks ? 0 : (st.assignment || ""))}
                                  onChange={(e) => handleMarkChange(st.id, "assignment", e.target.value)}
                                  disabled={isFacultyLocked || quizHasFullMarks || isBlocked}
                                  placeholder={isDropout ? "-" : undefined}
                                  title={isDropout ? "Student is Dropout. Marks Entry Blocked!" : isAbsent ? "Student is Absent. Cells locked!" : (quizHasFullMarks ? `Quiz has taken full ${totalQuizAssignLimit} marks. Assignment auto-blocked!` : `Max allowed: ${Math.max(0, totalQuizAssignLimit - (st.quiz || 0))}`)}
                                  className={`w-16 px-2.5 py-1 border rounded-lg text-xs font-bold text-center ${isDropout
                                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                      : isAbsent
                                        ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed"
                                        : quizHasFullMarks
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                                          : "bg-white"
                                    }`}
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  max={totalQuizAssignLimit}
                                  value={isBlocked ? (isDropout ? "" : 0) : (assignHasFullMarks ? 0 : (st.quiz || ""))}
                                  onChange={(e) => handleMarkChange(st.id, "quiz", e.target.value)}
                                  disabled={isFacultyLocked || assignHasFullMarks || isBlocked}
                                  placeholder={isDropout ? "-" : undefined}
                                  title={isDropout ? "Student is Dropout. Marks Entry Blocked!" : isAbsent ? "Student is Absent. Cells locked!" : (assignHasFullMarks ? `Assignment has taken full ${totalQuizAssignLimit} marks. Quiz auto-blocked!` : `Max allowed: ${Math.max(0, totalQuizAssignLimit - (st.assignment || 0))}`)}
                                  className={`w-16 px-2.5 py-1 border rounded-lg text-xs font-bold text-center ${isDropout
                                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                      : isAbsent
                                        ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed"
                                        : assignHasFullMarks
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                                          : "bg-white"
                                    }`}
                                />
                              </td>
                              {isPracticalCourse && (
                                <td className="p-3 bg-blue-50/70 border-x border-blue-200">
                                  <input
                                    type="number"
                                    placeholder={isDropout ? "-" : "0"}
                                    value={isBlocked ? (isDropout ? "" : 0) : (st.practical || "")}
                                    onChange={(e) => handleMarkChange(st.id, "practical", e.target.value)}
                                    disabled={isFacultyLocked || isBlocked}
                                    title={isDropout ? "Student is Dropout. Marks Entry Blocked!" : isAbsent ? "Student is Absent. Cells locked!" : ""}
                                    className={`w-16 px-2.5 py-1 border rounded-lg text-xs font-black text-center ${isDropout
                                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                        : isAbsent
                                          ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed"
                                          : "border-blue-400 bg-white text-blue-900 focus:ring-2 focus:ring-blue-500 shadow-sm"
                                      }`}
                                  />
                                </td>
                              )}
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={isBlocked || examScheme === "TERMINAL" ? (isDropout ? "" : 0) : (st.mid || "")}
                                  onChange={(e) => handleMarkChange(st.id, "mid", e.target.value)}
                                  disabled={isFacultyLocked || examScheme === "TERMINAL" || isBlocked}
                                  placeholder={isDropout ? "-" : undefined}
                                  title={isDropout ? "Student is Dropout. Marks Entry Blocked!" : isAbsent ? "Student is Absent. Cells locked!" : ""}
                                  className={`w-16 px-2.5 py-1 border rounded-lg text-xs font-bold text-center ${isDropout
                                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                      : isAbsent
                                        ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed"
                                        : examScheme === "TERMINAL"
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                          : "bg-white"
                                    }`}
                                />
                              </td>
                              <td className={`p-3 ${examScheme === "TERMINAL" ? "bg-purple-50/70 border-x border-purple-200" : ""}`}>
                                <input
                                  type="number"
                                  value={isBlocked ? (isDropout ? "" : 0) : (st.final || "")}
                                  onChange={(e) => handleMarkChange(st.id, "final", e.target.value)}
                                  disabled={isFacultyLocked || isBlocked}
                                  placeholder={isDropout ? "-" : undefined}
                                  title={isDropout ? "Student is Dropout. Marks Entry Blocked!" : isAbsent ? "Student is Absent. Cells locked!" : ""}
                                  className={`w-16 px-2.5 py-1 border rounded-lg text-xs font-bold text-center ${isDropout
                                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                      : isAbsent
                                        ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed"
                                        : examScheme === "TERMINAL"
                                          ? "bg-white border-purple-400 font-black text-purple-950 focus:ring-2 focus:ring-purple-500 shadow-sm"
                                          : "bg-white"
                                    }`}
                                />
                              </td>
                              <td className="p-3 font-black">
                                {isDropout ? (
                                  <span className="text-gray-400 font-bold">-</span>
                                ) : isAbsent ? (
                                  <span className="px-2.5 py-1 bg-red-100 text-red-700 font-black rounded-lg text-xs border border-red-200 shadow-sm">
                                    A (ABSENT)
                                  </span>
                                ) : (
                                  <span className="text-gray-900">{calculatedObtained} / {courseTotalMarks}</span>
                                )}
                              </td>
                            </>
                          ) : (
                            <td className="p-3">
                              {isDropout ? (
                                <span className="text-gray-400 font-bold">-</span>
                              ) : isAbsent ? (
                                <span className="px-2.5 py-1 bg-red-100 text-red-700 font-black rounded-lg text-xs border border-red-200 shadow-sm">
                                  A (ABSENT)
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  value={st.totalOnly || ""}
                                  onChange={(e) => handleTotalOnlyChange(st.id, e.target.value)}
                                  disabled={isFacultyLocked || isBlocked}
                                  className="w-24 px-2.5 py-1 border rounded-lg text-xs font-bold text-center bg-white"
                                />
                              )}
                            </td>
                          )}

                          <td className={`p-3 font-extrabold ${isDropout ? "text-gray-400 font-bold" : isAbsent ? "text-red-600 font-black" : "text-blue-900"}`}>{grade}</td>
                          <td className={`p-3 font-mono font-bold ${isDropout ? "text-gray-400 font-semibold" : isAbsent ? "text-red-600" : "text-indigo-900"}`}>{isDropout ? "-" : gp.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 text-xs rounded-full font-black ${isDropout
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm'
                                : isAbsent
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : isPass
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                              }`}>
                              {isDropout ? '🚫 Dropout' : isAbsent ? '❌ ABSENT (A)' : isPass ? '✅ Pass' : '❌ Fail'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-12 text-gray-400">No student records found for this course selection.</p>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-gray-50 border-t flex justify-between items-center flex-wrap gap-4">
              <span className="text-xs text-gray-500 font-bold">
                Showing {filteredStudentsList.length} of {students.length} student records.
              </span>

              <div className="flex gap-3">
                {!isFacultyLocked && (
                  <button
                    onClick={() => handleUpdateStatus("SAVED", false)}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all shadow"
                  >
                    💾 Save Draft
                  </button>
                )}

                {!isFacultyLocked && (
                  <button
                    onClick={() => handleUpdateStatus("PENDING_APPROVAL", false)}
                    disabled={saving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
                  >
                    <span>🚀 Publish / Submit for Approval</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => handleUpdateStatus("APPROVED", true)}
                    disabled={saving}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
                  >
                    <span>✅ Approve & Lock Result</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── TAB 2: MY SAVED & PUBLISHED RESULTS LIST ────────────────── */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden space-y-4 p-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">📋 My Saved & Published Results List</h3>
              <p className="text-xs text-gray-500">History of all courses with saved drafts, published results, or approved locks.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {facultyHistoryCourses.length > 0 ? (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-xs font-bold text-gray-600 uppercase">
                    <th className="p-3">Course / Subject</th>
                    <th className="p-3">Program & Semester</th>
                    <th className="p-3">Faculty / Teacher</th>
                    <th className="p-3">Students Evaluated</th>
                    <th className="p-3">Current Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyHistoryCourses.map((item: any) => (
                    <tr key={item.courseId} className="border-b hover:bg-gray-50/60 transition-all">
                      <td className="p-3">
                        <strong className="block text-gray-900 font-bold">{item.courseTitle}</strong>
                        <span className="text-xs font-mono text-gray-500">({item.courseCode})</span>
                      </td>
                      <td className="p-3 font-semibold text-blue-900 text-xs">
                        {item.programName}
                      </td>
                      <td className="p-3 text-xs text-gray-700 font-medium">
                        {item.facultyName}
                      </td>
                      <td className="p-3 text-xs font-mono font-bold text-gray-800">
                        👥 {item.totalStudents}
                      </td>
                      <td className="p-3">
                        {item.status === "APPROVED" && (
                          <span className="px-2.5 py-1 text-xs rounded-full font-extrabold bg-green-100 text-green-800 border border-green-300">
                            🔒 Approved & Locked
                          </span>
                        )}
                        {item.status === "PENDING_APPROVAL" && (
                          <span className="px-2.5 py-1 text-xs rounded-full font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                            ⏳ Pending Admin Approval
                          </span>
                        )}
                        {item.status === "UNLOCK_REQUESTED" && (
                          <span className="px-2.5 py-1 text-xs rounded-full font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            📩 Unlock Requested
                          </span>
                        )}
                        {item.status === "UNLOCKED_FOR_EDIT" && (
                          <span className="px-2.5 py-1 text-xs rounded-full font-extrabold bg-purple-100 text-purple-900 border border-purple-300">
                            🔓 Unlocked for Edit
                          </span>
                        )}
                        {item.status === "SAVED" && (
                          <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-gray-100 text-gray-700 border border-gray-300">
                            💾 Draft Saved
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleLoadCourseIntoEditor(item.courseId)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                          >
                            ✏️ Load into Editor
                          </button>

                          {item.status === "APPROVED" && isFaculty && (
                            <button
                              onClick={() => openUnlockRequestForCourse(item.courseId)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                            >
                              📩 Request Unlock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center py-12 text-gray-400">No evaluated result records found for your account.</p>
            )}
          </div>
        </div>
      )}

      {/* ────────────────── TAB 3: UNLOCK REQUESTS & ADMIN STATUS ────────────────── */}
      {activeTab === "unlocks" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden space-y-4 p-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">📩 Result Unlock Requests & Status</h3>
              <p className="text-xs text-gray-500">Track edit requests submitted to Admin and their current approval state.</p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setAdminModalOpen(true)}
                className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl shadow"
              >
                🛡️ Open Admin Approval Manager
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            {facultyUnlockRequests.length > 0 ? (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-xs font-bold text-gray-600 uppercase">
                    <th className="p-3">Course / Subject</th>
                    <th className="p-3">Program Name</th>
                    <th className="p-3">Faculty / Teacher</th>
                    <th className="p-3">Admin Response Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyUnlockRequests.map((item: any) => (
                    <tr key={item.courseId} className="border-b hover:bg-gray-50/60 transition-all">
                      <td className="p-3">
                        <strong className="block text-gray-900 font-bold">{item.courseTitle}</strong>
                        <span className="text-xs font-mono text-gray-500">({item.courseCode})</span>
                      </td>
                      <td className="p-3 font-semibold text-blue-900 text-xs">
                        {item.programName}
                      </td>
                      <td className="p-3 text-xs text-gray-700 font-medium">
                        {item.facultyName}
                      </td>
                      <td className="p-3">
                        {item.status === "UNLOCKED_FOR_EDIT" && (
                          <span className="px-3 py-1 text-xs rounded-full font-black bg-green-100 text-green-900 border border-green-300 shadow-sm animate-pulse">
                            ✅ Approved by Admin (Unlocked)
                          </span>
                        )}
                        {item.status === "UNLOCK_REQUESTED" && (
                          <span className="px-3 py-1 text-xs rounded-full font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-sm animate-pulse">
                            ⏳ Pending Admin Review
                          </span>
                        )}
                        {item.status === "APPROVED" && (
                          <span className="px-3 py-1 text-xs rounded-full font-bold bg-red-100 text-red-900 border border-red-300">
                            ❌ Declined by Admin (Remains Locked)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {item.status === "UNLOCKED_FOR_EDIT" ? (
                          <button
                            onClick={() => handleLoadCourseIntoEditor(item.courseId)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl shadow transition-all"
                          >
                            ✏️ Edit Marks Now
                          </button>
                        ) : item.status === "APPROVED" && isFaculty ? (
                          <button
                            onClick={() => openUnlockRequestForCourse(item.courseId)}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm"
                          >
                            📩 Request Again
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-semibold">Under Review</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center py-12 text-gray-400">No unlock requests found.</p>
            )}
          </div>
        </div>
      )}

      {/* ---------------- MODAL 1: FACULTY UNLOCK REQUEST MODAL ---------------- */}
      {unlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl max-w-md w-full mx-4 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>📩 Request Result Edit Permission</span>
              </h3>
              <button
                onClick={() => setUnlockModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRequestUnlockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Reason for Result Edit / Unlock Request
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Calculation error in final term marks, or typo during entry..."
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-gray-900 bg-white"
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  This request will be sent to Admin/Super Admin for review and recorded in Audit Logs.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setUnlockModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUnlockReq}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 2: ADMIN UNLOCK REQUESTS MANAGER ---------------- */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl max-w-2xl w-full mx-4 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>🛡️ Admin Unlock Requests & Result Permissions Manager</span>
              </h3>
              <button
                onClick={() => setAdminModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              {unlockRequestsList.length > 0 ? (
                unlockRequestsList.map((req, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-gray-50 space-y-2">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <strong className="block text-sm text-gray-900">{req.courseTitle} ({req.courseCode})</strong>
                        <span className="text-xs text-blue-700 font-bold">{req.programName} — Faculty: {req.facultyName}</span>
                      </div>
                      <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${req.status === 'UNLOCK_REQUESTED' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-gray-200 text-gray-700'
                        }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t flex-wrap gap-2">
                      <span className="text-xs text-gray-500 font-semibold">{req.totalStudents} enrolled students</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAdminProcessUnlock(req.courseId, "APPROVE")}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg shadow"
                        >
                          ✅ Approve Unlock
                        </button>
                        <button
                          onClick={() => handleAdminProcessUnlock(req.courseId, "REJECT")}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow"
                        >
                          ❌ Reject Request
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-gray-400">No pending unlock requests found.</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setAdminModalOpen(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Paste Excel Data Modal */}
      {pasteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  Paste Student Marks Data
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Copy marks table rows from Excel or Google Sheets (Ctrl+C) and paste below (Ctrl+V).
                </p>
              </div>
              <button
                onClick={() => setPasteModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={9}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Roll Number\tStudent Name\tMidterm\tFinal\tAssignment\tQuiz\tTotal\nS17/Zoo-13\tMuhammad Akber\t18\t52\t17\t10\t100\nS17/Zoo-14\tAbdul Baseer\t16\t48\t15\t10\t100"}
              className="w-full p-3 font-mono text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 resize-y text-gray-900"
            />

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!pasteText.trim()}
                onClick={handleProcessPastedText}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Review & Validate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Check Diagnostics Modal */}
      <UniversalImportModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        onConfirmImport={handleConfirmMarksImport}
        validationData={validationData}
        isImporting={isImporting}
        entityName="Marks"
        sourceName={importSourceName}
        extraNotice={
          selectedCourse
            ? `Target Course ID: ${selectedCourse} • Total Marks Base: ${courseTotalMarks}`
            : undefined
        }
      />

      {/* Import Summary Modal */}
      {importSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Marks Import Summary
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Results of exam marks batch upload</p>
              </div>
              <button
                onClick={() => setImportSummary(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-lg font-bold text-emerald-700">{importSummary.imported || 0}</div>
                <div className="text-[11px] text-emerald-600 font-medium">New Added</div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-lg font-bold text-blue-700">{importSummary.updated || 0}</div>
                <div className="text-[11px] text-blue-600 font-medium">Updated</div>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                <div className="text-lg font-bold text-rose-700">{importSummary.failed || 0}</div>
                <div className="text-[11px] text-rose-600 font-medium">Failed</div>
              </div>
            </div>

            {importSummary.errors && importSummary.errors.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-gray-700">Notice / Errors Log:</div>
                <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-1.5 font-mono">
                  {importSummary.errors.map((e: any, idx: number) => (
                    <div key={idx} className="flex gap-2 text-gray-700">
                      <span className="font-bold text-gray-900">Row {e.row}:</span>
                      <span className="font-semibold text-blue-700">{e.item}</span> —
                      <span className="text-rose-600">{e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setImportSummary(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
