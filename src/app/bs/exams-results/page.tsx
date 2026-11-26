"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { sortStudentsByRoll, distributeTotalMarks, parsePastedMarksText } from "@/lib/domainParsers";
import ResultsPromotionTab from "./ResultsPromotionTab";
import OfficialTranscriptDocument from "@/components/OfficialTranscriptDocument";
import { useSettings } from "@/lib/useSettings";
import { getGPValue } from "@/lib/cgpa";
import {
  Bell,
  FileText,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Users,
  Award,
  Layers,
  ClipboardList,
  Edit3,
  GraduationCap,
  ShieldCheck,
  Search,
  BookOpen
} from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

export default function ExamsResultsPage() {
  const [activeTab, setActiveTab] = useState("paper_attendance");
  const [sharedFilters, setSharedFilters] = useState({
    session: "2024-2028",
    programId: "",
    semester: "1",
    courseId: "",
    progType: "ALL",
  });
  const [sharedAttendance, setSharedAttendance] = useState<Record<string, "PRESENT" | "ABSENT">>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      const sessionParam = urlParams.get("session");
      const programIdParam = urlParams.get("programId");
      const semesterParam = urlParams.get("semester");
      const courseIdParam = urlParams.get("courseId");

      if (tabParam && ["paper_attendance", "marks", "results", "academic_actions", "merit"].includes(tabParam)) {
        setActiveTab(tabParam);
      } else if (courseIdParam || (sessionParam && semesterParam)) {
        setActiveTab("marks");
      }

      if (sessionParam || programIdParam || semesterParam || courseIdParam) {
        setSharedFilters(prev => ({
          ...prev,
          ...(sessionParam ? { session: sessionParam } : {}),
          ...(programIdParam ? { programId: programIdParam } : {}),
          ...(semesterParam ? { semester: semesterParam } : {}),
          ...(courseIdParam ? { courseId: courseIdParam } : {}),
        }));
      }
    }
  }, []);

  return (
    <div className="space-y-5">
      {/* ── PANORAMIC COLLEGE BUILDING BANNER WITH ORGANIC GREEN WAVES ── */}
      <PortalPageHeader
        title="Examinations & Results"
        subtitle="Manage Exam Paper Attendance, Student Marks Entry, Result Compilation, and Promotions."
        showAccentBar={true}
        accentBarColor="#047857"
        heightClass="min-h-[160px] md:min-h-[185px]"
      />

      {/* ── STEP NAVIGATION PILLS BAR (MATCHING USER SCREENSHOT) ── */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 overflow-x-auto print:hidden custom-scrollbar">
        <button
          onClick={() => setActiveTab('paper_attendance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${activeTab === 'paper_attendance'
            ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-800 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
            }`}
        >
          <ClipboardList className="w-4 h-4 text-emerald-700" />
          <span>Paper Attendance</span>
          <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${activeTab === 'paper_attendance' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
            }`}>
            Step 1
          </span>
        </button>

        <button
          onClick={() => setActiveTab('marks')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${activeTab === 'marks'
            ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-800 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
            }`}
        >
          <Edit3 className="w-4 h-4 text-emerald-700" />
          <span>Marks Entry</span>
          <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${activeTab === 'marks' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
            }`}>
            Step 2
          </span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${activeTab === 'results'
            ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-800 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
            }`}
        >
          <GraduationCap className="w-4 h-4 text-emerald-700" />
          <span>Results & Promotion</span>
          <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${activeTab === 'results' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
            }`}>
            Step 3
          </span>
        </button>

        <button
          onClick={() => setActiveTab('academic_actions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${activeTab === 'academic_actions'
            ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-800 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
            }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Status & Academic Actions</span>
        </button>

        <button
          onClick={() => setActiveTab('merit')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${activeTab === 'merit'
            ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-800 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
            }`}
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>Merit & Reports</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none">
        <div className="p-6">
          {activeTab === 'paper_attendance' && (
            <PaperAttendanceModule
              sharedFilters={sharedFilters}
              setSharedFilters={setSharedFilters}
              sharedAttendance={sharedAttendance}
              setSharedAttendance={setSharedAttendance}
              onProceedToMarks={() => setActiveTab('marks')}
            />
          )}

          {activeTab === 'marks' && (
            <MarksEntryTable
              sharedFilters={sharedFilters}
              setSharedFilters={setSharedFilters}
              sharedAttendance={sharedAttendance}
              setSharedAttendance={setSharedAttendance}
              onEditAttendance={() => setActiveTab('paper_attendance')}
            />
          )}

          {activeTab === 'results' && (
            <ResultsPromotionTab
              sharedFilters={sharedFilters}
              setSharedFilters={setSharedFilters}
              onNavigateToMarks={(nextSem) => {
                setSharedFilters((prev: any) => ({ ...prev, semester: String(nextSem) }));
                setActiveTab('marks');
              }}
              onNavigateToAttendance={(nextSem) => {
                setSharedFilters((prev: any) => ({ ...prev, semester: String(nextSem) }));
                setActiveTab('paper_attendance');
              }}
            />
          )}

          {activeTab === 'academic_actions' && (
            <StatusAcademicActionsTab />
          )}

          {activeTab === 'merit' && (
            <MeritScholarshipsTab />
          )}
        </div>
      </div>
    </div>
  );
}

// GP calculation (4.0 scale) based on linear grading policy:
// Linear HEC GP scale with Project / Thesis 200-marks rule (6 Credit Hours = 3+3 Cr)
function getGP(obtained: number, total: number): number {
  if (total <= 0) return 0.00;
  // Project / Thesis 200-marks rule: Strict Fail if less than 100 marks
  if (total === 200 && obtained < 100) return 0.00;
  if (obtained < total * 0.5) return 0.00;

  // For 200-mark courses, score is evaluated by dividing by 2 (3+3 credits scheme)
  const pct = total === 200 ? (obtained / 2) : ((obtained / total) * 100);
  const rounded = Math.round(pct);

  if (rounded < 50) return 0.00; // Fail
  if (rounded >= 80) return 4.00; // Max GP is 4.0 (starts at 80%)

  // Formula: 1.00 + (rounded - 50) * 0.10
  return parseFloat((1.00 + (rounded - 50) * 0.10).toFixed(2));
}

// Grade letter calculation based on HEC range table from user screenshot
function getGrade(obtained: number, total: number): string {
  if (total <= 0) return "F";
  // Project / Thesis 200-marks rule: Strict Fail if less than 100 marks
  if (total === 200 && obtained < 100) return "F";
  if (obtained < total * 0.5) return "F";
  const pct = total === 200 ? (obtained / 2) : ((obtained / total) * 100);
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

function PaperAttendanceModule({
  sharedFilters,
  setSharedFilters,
  sharedAttendance,
  setSharedAttendance,
  onProceedToMarks,
}: {
  sharedFilters: { session: string; programId: string; semester: string; courseId: string; progType: string };
  setSharedFilters: React.Dispatch<React.SetStateAction<{ session: string; programId: string; semester: string; courseId: string; progType: string }>>;
  sharedAttendance: Record<string, "PRESENT" | "ABSENT">;
  setSharedAttendance: React.Dispatch<React.SetStateAction<Record<string, "PRESENT" | "ABSENT">>>;
  onProceedToMarks: () => void;
}) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [programs, setPrograms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<string[]>([
    "2024-2028", "2025-2029", "2026-2030", "2023-2027", "2022-2026",
    "2024-2026", "2025-2027", "2026-2028", "2023-2025", "2022-2024"
  ]);

  const [selectedProgType, setSelectedProgType] = useState(sharedFilters.progType || "ALL");
  const [selectedSession, setSelectedSession] = useState(sharedFilters.session || "2024-2028");
  const [selectedProgram, setSelectedProgram] = useState(sharedFilters.programId || "");
  const [selectedSemester, setSelectedSemester] = useState(sharedFilters.semester || "1");
  const [selectedCourse, setSelectedCourse] = useState(sharedFilters.courseId || "");

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const userRole = (session?.user as any)?.role || "";
  const isAdmin = ["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL", "HOD"].includes(userRole);

  // Sync to parent sharedFilters whenever filter changes
  useEffect(() => {
    setSharedFilters({
      session: selectedSession,
      programId: selectedProgram,
      semester: selectedSemester,
      courseId: selectedCourse,
      progType: selectedProgType,
    });
  }, [selectedSession, selectedProgram, selectedSemester, selectedCourse, selectedProgType]);

  // Load programs, courses & sessions from API
  useEffect(() => {
    Promise.all([
      fetch("/api/programs").then(r => r.ok ? r.json() : []),
      fetch("/api/courses").then(r => r.ok ? r.json() : []),
      fetch("/api/settings").then(r => r.ok ? r.json() : {})
    ]).then(async ([pData, cData, sData]) => {
      const validProgs = Array.isArray(pData) ? pData.filter((p: any) => p.educationLevel === "BS" || !p.educationLevel) : [];
      const validCourses = Array.isArray(cData) ? cData : [];

      const settingsObj = (sData as any) || {};
      if (settingsObj.ACADEMIC_SESSIONS) {
        const { filterValidSessions } = await import("@/lib/sessionHelper");
        const validList = filterValidSessions(settingsObj.ACADEMIC_SESSIONS);
        setSessions(validList);
        if (validList.length > 0 && !validList.includes(selectedSession)) {
          setSelectedSession(validList[0]);
        }
      }

      setPrograms(validProgs);
      setCourses(validCourses);

      // Prioritize sharedFilters or query parameters if passed
      const targetCourseId = sharedFilters.courseId;
      const targetProgId = sharedFilters.programId;
      const targetSem = sharedFilters.semester;
      const targetSession = sharedFilters.session;

      if (targetSession) {
        setSessions(prev => prev.includes(targetSession) ? prev : [targetSession, ...prev]);
        setSelectedSession(targetSession);
      }

      if (targetCourseId && validCourses.some((c: any) => c.id === targetCourseId)) {
        const found = validCourses.find((c: any) => c.id === targetCourseId);
        if (found) {
          if (targetProgId || found.programId) setSelectedProgram(targetProgId || found.programId);
          if (targetSem || found.semester) setSelectedSemester((targetSem || found.semester).toString());
          setSelectedCourse(found.id);
          return;
        }
      }

      const userEmail = session?.user?.email;
      const facultyAssignedCourse = validCourses.find((c: any) =>
        c.faculty?.user?.email && userEmail && c.faculty.user.email.toLowerCase() === userEmail.toLowerCase()
      );

      if (facultyAssignedCourse) {
        setSelectedProgram(facultyAssignedCourse.programId);
        setSelectedSemester(facultyAssignedCourse.semester?.toString() || "1");
        setSelectedCourse(facultyAssignedCourse.id);
      } else if (validProgs.length > 0 && !selectedProgram) {
        const firstProgId = validProgs[0].id;
        setSelectedProgram(firstProgId);
        const firstProgCourses = validCourses.filter((c: any) => c.programId === firstProgId);
        if (firstProgCourses.length > 0) {
          setSelectedSemester(firstProgCourses[0].semester?.toString() || "1");
          setSelectedCourse(firstProgCourses[0].id);
        }
      }
    }).catch(() => { });
  }, [session?.user?.email]);

  // Available courses filtered by program and semester
  const filteredCourses = courses.filter(c => {
    if (selectedProgram && c.programId !== selectedProgram) return false;
    if (selectedSemester && c.semester !== parseInt(selectedSemester)) return false;
    return true;
  });

  // Auto-switch course if selectedProgram / selectedSemester changes and current course is invalid
  useEffect(() => {
    if (filteredCourses.length > 0 && !filteredCourses.some(c => c.id === selectedCourse)) {
      setSelectedCourse(filteredCourses[0].id);
    }
  }, [selectedProgram, selectedSemester, courses]);

  // Fetch students & their attendance/marks for the selected course & session
  useEffect(() => {
    if (!selectedCourse) {
      setStudents([]);
      return;
    }

    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    const queryParams = new URLSearchParams();
    queryParams.set("educationLevel", "BS");
    if (selectedProgram) queryParams.set("programId", selectedProgram);
    if (selectedSession && selectedSession !== "ALL") queryParams.set("session", selectedSession);
    if (selectedSemester) queryParams.set("currentSemester", selectedSemester);

    Promise.all([
      fetch(`/api/students?${queryParams}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/marks?courseId=${selectedCourse}`).then(r => r.ok ? r.json() : [])
    ]).then(([sData, mData]) => {
      const rawList = Array.isArray(sData) ? sData : [];
      const studentList = rawList.filter((st: any) => {
        // Exclude deactivated students
        if (st.isActive === false) return false;
        if (st.user && st.user.isActive === false && st.isActive !== true) return false;
        // Reactivated students (isActive === true) are always allowed
        if (st.isActive === true) return true;
        if (st.statuses && st.statuses.length > 0) {
          const activeStatuses = st.statuses.filter((s: any) => s.isActive !== false);
          const latest = activeStatuses[activeStatuses.length - 1];
          if (latest) {
            const type = latest.statusType?.toUpperCase();
            if (["FREEZE", "DROPOUT", "QUIT", "ADP", "MIGRATION_OUT"].includes(type)) return false;
          }
        }
        return true;
      });
      const marksArr = Array.isArray(mData) ? mData : [];

      const mapped = studentList.map((st: any) => {
        const existing = marksArr.find((m: any) => m.studentId === st.id);
        const inMemory = sharedAttendance[st.id];
        const isAbsent = inMemory !== undefined
          ? inMemory === "ABSENT"
          : (existing?.status === "ABSENT" || existing?.status === "A");
        return {
          id: st.id,
          name: st.user?.name || st.name || "Student",
          roll: st.rollNumber || st.roll || "N/A",
          session: st.session || "",
          currentSemester: st.currentSemester || 1,
          bsAdmissionType: st.bsAdmissionType || "REGULAR",
          attendance: isAbsent ? "ABSENT" : "PRESENT",
          marksRecord: existing || null,
        };
      });

      setStudents(sortStudentsByRoll(mapped));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedCourse, selectedProgram, selectedSession, selectedSemester]);

  const toggleStudentAttendance = (id: string, newStatus: "PRESENT" | "ABSENT") => {
    setStudents(prev => prev.map(s => (s.id === id ? { ...s, attendance: newStatus } : s)));
    setSharedAttendance(prev => ({ ...prev, [id]: newStatus }));
  };

  const markAllAttendance = (status: "PRESENT" | "ABSENT") => {
    setStudents(prev => prev.map(s => ({ ...s, attendance: status })));
    setSharedAttendance(prev => {
      const copy = { ...prev };
      students.forEach(s => {
        copy[s.id] = status;
      });
      return copy;
    });
  };

  // Save Attendance & Sync Absent status to Marks table
  const handleSaveAttendance = async (silent = false): Promise<boolean> => {
    if (!selectedCourse) {
      if (!silent) alert("Please select a course first.");
      return false;
    }
    if (students.length === 0) {
      if (!silent) alert("No students found to save attendance.");
      return false;
    }

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    let successCount = 0;
    let lastError = "";

    for (const s of students) {
      const isAbsent = s.attendance === "ABSENT";
      const targetStatus = isAbsent
        ? "ABSENT"
        : (s.marksRecord?.status === "ABSENT" || s.marksRecord?.status === "A" ? "SAVED" : (s.marksRecord?.status || "SAVED"));

      try {
        const res = await fetch("/api/marks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: s.id,
            courseId: selectedCourse,
            assignmentMarks: isAbsent ? 0 : (s.marksRecord?.assignmentMarks || 0),
            quizMarks: isAbsent ? 0 : (s.marksRecord?.quizMarks || 0),
            practicalMarks: isAbsent ? 0 : (s.marksRecord?.practicalMarks || 0),
            midtermMarks: isAbsent ? 0 : (s.marksRecord?.midtermMarks || 0),
            finalMarks: isAbsent ? 0 : (s.marksRecord?.finalMarks || 0),
            totalMarks: s.marksRecord?.totalMarks || 100,
            status: targetStatus,
          })
        });
        if (res.ok) {
          successCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = errData.error || "Failed to save";
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    setSaving(false);
    if (successCount > 0) {
      if (!silent) {
        setSuccessMsg(`✅ Exam Paper Attendance saved successfully (${students.filter(s => s.attendance === "ABSENT").length} Absent, ${students.filter(s => s.attendance !== "ABSENT").length} Present)!`);
      }
      return true;
    } else {
      if (!silent) {
        setErrorMsg(lastError ? `Failed to save attendance: ${lastError}` : "Error saving attendance.");
      }
      return false;
    }
  };

  const handleProceedToMarksEntry = async () => {
    if (selectedCourse && students.length > 0) {
      await handleSaveAttendance(true);
    }
    onProceedToMarks();
  };

  // Filter student list by search & type & session
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

  const presentCount = students.filter(s => s.attendance !== "ABSENT").length;
  const absentCount = students.filter(s => s.attendance === "ABSENT").length;
  const currentSelectedCourse = courses.find(c => c.id === selectedCourse);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span>📋 Step 1: Exam Paper Attendance</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">Mandatory</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Mark student exam paper presence before entering marks. Absent students will be locked in Marks Entry and displayed as <strong>'A'</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleProceedToMarksEntry}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <span>{saving ? "⏳ Saving..." : "📝 Proceed to Marks Entry (Step 2)"}</span>
            <span>➡️</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Search Student</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-blue-400"
              placeholder="🔍 Search name or roll number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Program Type</label>
            <select
              className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-blue-400"
              value={selectedProgType}
              onChange={e => setSelectedProgType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="REGULAR">BS Regular</option>
              <option value="BRIDGING">BS 5th / Bridging</option>
              <option value="MIGRATION">Migration</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Academic Session</label>
            <select
              className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-blue-400 text-blue-900"
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
            >
              <option value="ALL">All Sessions</option>
              {sessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Degree Program</label>
            <select
              className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-blue-400"
              value={selectedProgram}
              onChange={e => {
                setSelectedProgram(e.target.value);
                setSelectedCourse("");
              }}
            >
              <option value="">-- Select Program --</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Semester</label>
            <select
              className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-blue-400"
              value={selectedSemester}
              onChange={e => {
                setSelectedSemester(e.target.value);
                setSelectedCourse("");
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Select Exam Course *</label>
          <select
            className={`w-full px-3 py-2 border rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-blue-400 ${!selectedProgram ? 'opacity-60 cursor-not-allowed' : ''}`}
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
          >
            <option value="">-- Select Course --</option>
            {filteredCourses.map(c => {
              const creditFmt = c.creditHoursFormat || `${c.creditHours}(${c.creditHours}-0)`;
              return (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.code}) — {creditFmt} Cr
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {successMsg && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-xs font-bold border border-green-200">{successMsg}</div>}
      {errorMsg && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-xs font-bold border border-red-200">{errorMsg}</div>}

      {/* Attendance Stats & Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📋</span>
          <div>
            <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
              Exam Attendance Sheet {currentSelectedCourse ? `— ${currentSelectedCourse.title} (${currentSelectedCourse.code})` : ""}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700">
                Total: <strong>{students.length}</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-green-100 border border-green-300 text-xs font-black text-green-800">
                Present: <strong>{presentCount}</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-red-100 border border-red-300 text-xs font-black text-red-800">
                Absent (A): <strong>{absentCount}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => markAllAttendance("PRESENT")}
            className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>✅ Mark All Present</span>
          </button>
          <button
            type="button"
            onClick={() => markAllAttendance("ABSENT")}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>❌ Mark All Absent (A)</span>
          </button>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-400 font-bold">⏳ Loading enrolled students...</div>
          ) : filteredStudentsList.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-medium">
              <div className="text-3xl mb-2">🚫</div>
              <p className="font-bold">No students found matching current filters.</p>
              <p className="text-xs text-gray-400 mt-1">Please select Program, Semester, Session, and Course above.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-100/80 border-b text-gray-700 font-black uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 text-center w-12">#</th>
                  <th className="p-3.5">Student Roll & Name</th>
                  <th className="p-3.5">Session & Admission Mode</th>
                  <th className="p-3.5 text-center">Paper Attendance Status</th>
                  <th className="p-3.5 text-center">Marks Entry Lock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudentsList.map((st, idx) => {
                  const isAbsent = st.attendance === "ABSENT";
                  return (
                    <tr key={st.id} className={`transition-colors ${isAbsent ? "bg-red-50/30" : "hover:bg-gray-50/60"}`}>
                      <td className="p-3.5 text-center font-bold text-gray-400">{idx + 1}</td>
                      <td className="p-3.5">
                        <strong className="block text-gray-900 font-extrabold text-sm">{st.name}</strong>
                        <span className="font-mono text-gray-500 text-xs">{st.roll}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-700">{st.session || selectedSession}</span>
                        {st.bsAdmissionType === "BRIDGING_5TH" && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] bg-purple-100 text-purple-700 font-bold rounded-full">Bridging 5th</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="inline-flex rounded-xl border border-gray-300 p-1 bg-gray-100 shadow-sm">
                          <button
                            type="button"
                            onClick={() => toggleStudentAttendance(st.id, "PRESENT")}
                            className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all ${!isAbsent
                              ? "bg-green-600 text-white shadow-md scale-[1.02]"
                              : "text-gray-600 hover:text-gray-900"
                              }`}
                          >
                            🟢 Present (P)
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStudentAttendance(st.id, "ABSENT")}
                            className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${isAbsent
                              ? "bg-red-600 text-white shadow-md scale-[1.02]"
                              : "text-gray-600 hover:text-gray-900"
                              }`}
                          >
                            🔴 Absent (A)
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        {isAbsent ? (
                          <span className="px-3 py-1 text-xs rounded-full font-black bg-red-100 text-red-800 border border-red-200">
                            🔒 Locked (Marked 'A' / 0 Marks)
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs rounded-full font-bold bg-green-100 text-green-800 border border-green-200">
                            🟢 Marks Entry Open
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center flex-wrap gap-4">
          <span className="text-xs text-gray-500 font-bold">
            Showing {filteredStudentsList.length} of {students.length} student records.
          </span>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleSaveAttendance(false)}
              disabled={saving || students.length === 0}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span>{saving ? "⏳ Saving..." : "💾 Save & Finalize Exam Paper Attendance"}</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleProceedToMarksEntry}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <span>{saving ? "⏳ Saving..." : "➡️ Proceed to Marks Entry"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarksEntryTable({
  sharedFilters,
  setSharedFilters,
  sharedAttendance,
  setSharedAttendance,
  onEditAttendance,
}: {
  sharedFilters: { session: string; programId: string; semester: string; courseId: string; progType: string };
  setSharedFilters: React.Dispatch<React.SetStateAction<{ session: string; programId: string; semester: string; courseId: string; progType: string }>>;
  sharedAttendance: Record<string, "PRESENT" | "ABSENT">;
  setSharedAttendance: React.Dispatch<React.SetStateAction<Record<string, "PRESENT" | "ABSENT">>>;
  onEditAttendance: () => void;
}) {
  const { data: session } = useSession();
  const [entryType, setEntryType] = useState<"detailed" | "total">("detailed");

  // Search & Filter states synced with sharedFilters
  const [searchQuery, setSearchQuery] = useState("");
  const [programs, setPrograms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<string[]>([
    "2024-2028", "2025-2029", "2026-2030", "2023-2027", "2022-2026",
    "2024-2026", "2025-2027", "2026-2028", "2023-2025", "2022-2024"
  ]);
  const [selectedProgType, setSelectedProgType] = useState(sharedFilters.progType || "ALL");
  const [selectedSession, setSelectedSession] = useState(sharedFilters.session || "2024-2028");
  const [selectedProgram, setSelectedProgram] = useState(sharedFilters.programId || "");
  const [selectedSemester, setSelectedSemester] = useState(sharedFilters.semester || "1");
  const [selectedCourse, setSelectedCourse] = useState(sharedFilters.courseId || "");

  const [courseTotalMarks, setCourseTotalMarks] = useState(100);

  // Helper to determine default total marks based on course (Project / Thesis = 200, 6 cr = 200)
  const getCourseDefaultTotalMarks = (c?: any): number => {
    if (!c) return 100;
    if (c.creditHours === 6) return 200;
    if (c.courseType === "CAPSTONE_THESIS") return 200;
    const t = (c.title || "").toLowerCase();
    if (t.includes("project") || t.includes("thesis") || t.includes("dissertation") || t.includes("capstone")) {
      return 200;
    }
    const totals: Record<number, number> = { 1: 33, 2: 67, 3: 100, 4: 100, 6: 200 };
    return totals[c.creditHours] ?? 100;
  };
  const [students, setStudents] = useState<any[]>([]);
  const [targetStudentId, setTargetStudentId] = useState("");
  const [targetRollNumber, setTargetRollNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const sId = urlParams.get("studentId");
      const rNum = urlParams.get("rollNumber");
      if (sId) setTargetStudentId(sId);
      if (rNum) setTargetRollNumber(rNum);
    }
  }, []);

  // When students table is populated, auto-scroll and highlight the targeted student's fail cell & focus mark input
  useEffect(() => {
    if ((targetStudentId || targetRollNumber) && students.length > 0) {
      const matched = students.find(
        (s) =>
          (targetStudentId && s.id === targetStudentId) ||
          (targetRollNumber && s.roll?.toLowerCase().trim() === targetRollNumber.toLowerCase().trim())
      );
      if (matched) {
        const timer = setTimeout(() => {
          const cellEl =
            document.getElementById(`fail-cell-${matched.id}`) ||
            document.getElementById(`exam-student-row-${matched.id}`);
          if (cellEl) {
            cellEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          }
          const inputEl =
            (document.getElementById(`exam-input-final-${matched.id}`) as HTMLInputElement) ||
            (document.getElementById(`exam-input-assignment-${matched.id}`) as HTMLInputElement);
          if (inputEl && !inputEl.disabled) {
            inputEl.focus();
            inputEl.select?.();
          }
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [students, targetStudentId, targetRollNumber]);

  // Sync to parent sharedFilters
  useEffect(() => {
    setSharedFilters({
      session: selectedSession,
      programId: selectedProgram,
      semester: selectedSemester,
      courseId: selectedCourse,
      progType: selectedProgType,
    });
  }, [selectedSession, selectedProgram, selectedSemester, selectedCourse, selectedProgType]);

  // Approval & Lock Lifecycle state
  const [resultStatus, setResultStatus] = useState<"SAVED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "UNLOCK_REQUESTED" | "UNLOCKED_FOR_EDIT">("SAVED");
  const [isLocked, setIsLocked] = useState(false);

  // Live Metrics & Unlock Request State
  const [metricCounts, setMetricCounts] = useState({ saved: 0, pending: 0, unlockRequested: 0, approved: 0 });
  const [unlockRequestsList, setUnlockRequestsList] = useState<any[]>([]);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [submittingUnlockReq, setSubmittingUnlockReq] = useState(false);

  // Bulk Paste & Auto-Distribute States
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedMarksInput, setPastedMarksInput] = useState("");
  const [pasteTargetCol, setPasteTargetCol] = useState<"total" | "final" | "mid" | "assignment" | "quiz">("total");
  const [autoDistributeOnPaste, setAutoDistributeOnPaste] = useState(true);

  const userRole = (session?.user as any)?.role || "";
  const isAdmin = ["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL", "HOD"].includes(userRole);
  const isFacultyLocked = isLocked && !isAdmin && resultStatus !== "UNLOCKED_FOR_EDIT";

  const loadMetrics = () => {
    fetch("/api/marks/unlock-request")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setMetricCounts(data.counts || { saved: 0, pending: 0, unlockRequested: 0, approved: 0 });
          setUnlockRequestsList(data.summaryList || []);
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // Load programs & courses & settings from API with smart auto-selection for Faculty
  useEffect(() => {
    Promise.all([
      fetch("/api/programs").then(r => r.ok ? r.json() : []),
      fetch("/api/courses").then(r => r.ok ? r.json() : []),
      fetch("/api/settings").then(r => r.ok ? r.json() : {})
    ]).then(async ([pData, cData, sData]) => {
      const validProgs = Array.isArray(pData) ? pData.filter((p: any) => p.educationLevel === "BS" || !p.educationLevel) : [];
      const validCourses = Array.isArray(cData) ? cData : [];

      const settingsObj = (sData as any) || {};
      if (settingsObj.ACADEMIC_SESSIONS) {
        const { filterValidSessions } = await import("@/lib/sessionHelper");
        const validList = filterValidSessions(settingsObj.ACADEMIC_SESSIONS);
        setSessions(validList);
        if (validList.length > 0 && !validList.includes(selectedSession)) {
          setSelectedSession(validList[0]);
        }
      }

      setPrograms(validProgs);
      setCourses(validCourses);

      // Prioritize sharedFilters or query parameters if passed
      const targetCourseId = sharedFilters.courseId;
      const targetProgId = sharedFilters.programId;
      const targetSem = sharedFilters.semester;
      const targetSession = sharedFilters.session;

      if (targetSession) {
        setSessions(prev => prev.includes(targetSession) ? prev : [targetSession, ...prev]);
        setSelectedSession(targetSession);
      }

      if (targetCourseId && validCourses.some((c: any) => c.id === targetCourseId)) {
        const found = validCourses.find((c: any) => c.id === targetCourseId);
        if (found) {
          if (targetProgId || found.programId) setSelectedProgram(targetProgId || found.programId);
          if (targetSem || found.semester) setSelectedSemester((targetSem || found.semester).toString());
          setSelectedCourse(found.id);
          setCourseTotalMarks(getCourseDefaultTotalMarks(found));
          return;
        }
      }

      const userEmail = session?.user?.email;
      const facultyAssignedCourse = validCourses.find((c: any) =>
        c.faculty?.user?.email && userEmail && c.faculty.user.email.toLowerCase() === userEmail.toLowerCase()
      );

      if (facultyAssignedCourse) {
        setSelectedProgram(facultyAssignedCourse.programId);
        setSelectedSemester(facultyAssignedCourse.semester?.toString() || "1");
        setSelectedCourse(facultyAssignedCourse.id);
        setCourseTotalMarks(getCourseDefaultTotalMarks(facultyAssignedCourse));
      } else if (validProgs.length > 0 && !selectedProgram) {
        const firstProgId = validProgs[0].id;
        setSelectedProgram(firstProgId);
        const firstProgCourses = validCourses.filter((c: any) => c.programId === firstProgId);
        if (firstProgCourses.length > 0) {
          setSelectedSemester(firstProgCourses[0].semester?.toString() || "1");
          setSelectedCourse(firstProgCourses[0].id);
        }
      }
    }).catch(() => { });
  }, [session?.user?.email]);

  // Available courses filtered by program and semester
  const filteredCourses = courses.filter(c => {
    if (selectedProgram && c.programId !== selectedProgram) return false;
    if (selectedSemester && c.semester !== parseInt(selectedSemester)) return false;
    return true;
  });

  // Auto-switch course if selectedProgram / selectedSemester changes and current course is invalid
  useEffect(() => {
    if (filteredCourses.length > 0 && !filteredCourses.some(c => c.id === selectedCourse)) {
      handleCourseChange(filteredCourses[0].id);
    }
  }, [selectedProgram, selectedSemester, courses]);

  // When course changes → auto-fill total marks from course creditHours
  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    setSuccessMsg("");
    setErrorMsg("");
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setCourseTotalMarks(getCourseDefaultTotalMarks(course));
    }
  };

  // Datesheet Exam Scheme state (MID_FINAL vs TERMINAL scheme)
  const [datesheetInfo, setDatesheetInfo] = useState<any>(null);
  const [examScheme, setExamScheme] = useState<"MID_FINAL" | "TERMINAL">("MID_FINAL");

  // Fetch real students & existing marks when program & course & session are selected
  useEffect(() => {
    if (!selectedCourse) {
      setStudents([]);
      setResultStatus("SAVED");
      setIsLocked(false);
      setDatesheetInfo(null);
      return;
    }

    setLoading(true);
    const queryParams = new URLSearchParams();
    queryParams.set("educationLevel", "BS");
    if (selectedProgram) queryParams.set("programId", selectedProgram);
    if (selectedSession && selectedSession !== "ALL") queryParams.set("session", selectedSession);
    if (selectedSemester) queryParams.set("currentSemester", selectedSemester);

    Promise.all([
      fetch(`/api/students?${queryParams}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/marks?courseId=${selectedCourse}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/datesheet?courseId=${selectedCourse}`, { cache: "no-store" }).then(r => r.ok ? r.json() : [])
    ]).then(([sData, mData, dsData]) => {
      const rawList = Array.isArray(sData) ? sData : [];
      const studentList = rawList.filter((st: any) => {
        // Exclude deactivated students
        if (st.isActive === false) return false;
        if (st.user && st.user.isActive === false && st.isActive !== true) return false;
        // Reactivated students (isActive === true) are always allowed
        if (st.isActive === true) return true;
        if (st.statuses && st.statuses.length > 0) {
          const activeStatuses = st.statuses.filter((s: any) => s.isActive !== false);
          const latest = activeStatuses[activeStatuses.length - 1];
          if (latest) {
            const type = latest.statusType?.toUpperCase();
            if (["FREEZE", "DROPOUT", "QUIT", "ADP", "MIGRATION_OUT"].includes(type)) return false;
          }
        }
        return true;
      });
      const marksArr = Array.isArray(mData) ? mData : [];

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

      if (marksArr.length > 0) {
        setResultStatus(marksArr[0].status || "SAVED");
        setIsLocked(Boolean(marksArr[0].isLocked));
      } else {
        setResultStatus("SAVED");
        setIsLocked(false);
      }

      const mapped = studentList.map((st: any) => {
        const existing = marksArr.find((m: any) => m.studentId === st.id);
        const inMemory = sharedAttendance[st.id];
        const isAbsent = inMemory !== undefined
          ? inMemory === "ABSENT"
          : (existing?.status === "ABSENT" || existing?.status === "A");
        return {
          id: st.id,
          name: st.user?.name || st.name || "Student",
          roll: st.rollNumber || st.roll || "N/A",
          session: st.session || "",
          currentSemester: st.currentSemester || 1,
          bsAdmissionType: st.bsAdmissionType || "REGULAR",
          attendance: isAbsent ? "ABSENT" : "PRESENT",
          assignment: isAbsent ? 0 : (existing?.assignmentMarks || 0),
          quiz: isAbsent ? 0 : (existing?.quizMarks || 0),
          practical: isAbsent ? 0 : (existing?.practicalMarks || 0),
          mid: isAbsent ? 0 : (existing?.midtermMarks || 0),
          final: isAbsent ? 0 : (existing?.finalMarks || 0),
          totalOnly: isAbsent ? 0 : (existing?.obtainedMarks || 0),
        };
      });

      setStudents(sortStudentsByRoll(mapped));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedCourse, selectedProgram, selectedSession, selectedSemester]);

  const toggleStudentAttendance = (id: string, newStatus: "PRESENT" | "ABSENT") => {
    if (isFacultyLocked) return;
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
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
    setSharedAttendance(prev => ({ ...prev, [id]: newStatus }));
  };

  const markAllAttendance = (status: "PRESENT" | "ABSENT") => {
    if (isFacultyLocked) return;
    setStudents(prev => prev.map(s => {
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
    setSharedAttendance(prev => {
      const copy = { ...prev };
      students.forEach(s => { copy[s.id] = status; });
      return copy;
    });
  };

  const currentSelectedCourse = courses.find((c: any) => c.id === selectedCourse);
  const isThesisOrProject = Boolean(
    courseTotalMarks === 200 || (
      currentSelectedCourse && (
        currentSelectedCourse.creditHours === 6 ||
        currentSelectedCourse.courseType === "CAPSTONE_THESIS" ||
        (currentSelectedCourse.title && (
          currentSelectedCourse.title.toLowerCase().includes("thesis") ||
          currentSelectedCourse.title.toLowerCase().includes("project") ||
          currentSelectedCourse.title.toLowerCase().includes("capstone") ||
          currentSelectedCourse.title.toLowerCase().includes("dissertation")
        ))
      )
    )
  );
  const isPracticalCourse = Boolean(
    !isThesisOrProject && currentSelectedCourse && (
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
    if (!student || student.attendance === "ABSENT") return;

    if (isThesisOrProject) {
      if ((field === "thesis" || field === "mid") && numValue > 100) {
        alert("Thesis marks cannot exceed 100!");
        return;
      }
      if ((field === "viva" || field === "final") && numValue > 100) {
        alert("Viva Voce marks cannot exceed 100!");
        return;
      }
      setStudents(students.map(s => {
        if (s.id !== id) return s;
        const updated = { ...s };
        if (field === "thesis" || field === "mid") {
          updated.mid = numValue;
          updated.thesis = numValue;
        } else if (field === "viva" || field === "final") {
          updated.final = numValue;
          updated.viva = numValue;
        } else {
          (updated as any)[field] = numValue;
        }
        return updated;
      }));
      return;
    }

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

  const handleTotalMarksChange = (studentId: string, valStr: string) => {
    if (isFacultyLocked) return;
    if (valStr === "") {
      setStudents(prev => prev.map(s => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          assignment: 0,
          quiz: 0,
          practical: 0,
          mid: 0,
          final: 0,
          totalOnly: 0,
        };
      }));
      return;
    }

    const num = parseFloat(valStr);
    if (isNaN(num) || num < 0) return;

    const clampedTotal = Math.min(num, courseTotalMarks);
    const dist = distributeTotalMarks(clampedTotal, {
      isPracticalCourse,
      examScheme,
      courseTotalMarks,
    });

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId || s.attendance === "ABSENT") return s;
      return {
        ...s,
        assignment: dist.assignment,
        quiz: dist.quiz,
        practical: dist.practical,
        mid: dist.mid,
        final: dist.final,
        totalOnly: clampedTotal,
      };
    }));
  };

  const handleDistributeStudent = (studentId: string, forceTotal?: number) => {
    if (isFacultyLocked) return;
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId || s.attendance === "ABSENT") return s;
      const currentTotal = forceTotal !== undefined ? forceTotal : (s.totalOnly > 0 ? s.totalOnly : (getComputed(s) > 0 ? getComputed(s) : courseTotalMarks));
      const dist = distributeTotalMarks(currentTotal, {
        isPracticalCourse,
        examScheme,
        courseTotalMarks,
      });
      return {
        ...s,
        assignment: dist.assignment,
        quiz: dist.quiz,
        practical: dist.practical,
        mid: dist.mid,
        final: dist.final,
        totalOnly: currentTotal,
      };
    }));
  };

  const handleDistributeAll = (forceTotal?: number) => {
    if (isFacultyLocked) return;
    setStudents(prev => prev.map(s => {
      if (s.attendance === "ABSENT") return s;
      const currentTotal = forceTotal !== undefined ? forceTotal : (s.totalOnly > 0 ? s.totalOnly : (getComputed(s) > 0 ? getComputed(s) : courseTotalMarks));
      const dist = distributeTotalMarks(currentTotal, {
        isPracticalCourse,
        examScheme,
        courseTotalMarks,
      });
      return {
        ...s,
        assignment: dist.assignment,
        quiz: dist.quiz,
        practical: dist.practical,
        mid: dist.mid,
        final: dist.final,
        totalOnly: currentTotal,
      };
    }));
    setSuccessMsg("Successfully auto-distributed Total Marks into Quiz, Mid & Final components!");
  };

  const handleApplyPastedMarks = () => {
    if (!pastedMarksInput.trim()) {
      alert("Please paste data from Excel or external spreadsheet first!");
      return;
    }
    const parsed = parsePastedMarksText(pastedMarksInput, students);
    if (parsed.length === 0) {
      alert("Could not detect any valid student marks from the pasted text. Please verify formatting.");
      return;
    }

    let updatedCount = 0;
    setStudents(prev => prev.map(s => {
      const match = parsed.find(p => p.studentId === s.id);
      if (!match) return s;
      updatedCount++;

      if (match.marks === "A") {
        return {
          ...s,
          attendance: "ABSENT",
          assignment: 0,
          quiz: 0,
          practical: 0,
          mid: 0,
          final: 0,
          totalOnly: 0,
        };
      }

      const markVal = typeof match.marks === "number" ? match.marks : 0;

      // Multi-column breakdown pasted (e.g. Roll, Assign, Quiz, Mid, Final)
      if (match.assignment !== undefined && match.final !== undefined) {
        return {
          ...s,
          attendance: "PRESENT",
          assignment: match.assignment,
          quiz: match.quiz || 0,
          mid: match.mid || 0,
          final: match.final || 0,
          practical: match.practical || 0,
          totalOnly: markVal > 0 ? markVal : (match.assignment + (match.quiz || 0) + (match.mid || 0) + (match.final || 0)),
        };
      }

      if (pasteTargetCol === "total" || match.assignment === undefined) {
        const dist = distributeTotalMarks(markVal, {
          isPracticalCourse,
          examScheme,
          courseTotalMarks,
        });
        return {
          ...s,
          attendance: "PRESENT",
          assignment: dist.assignment,
          quiz: dist.quiz,
          practical: dist.practical,
          mid: dist.mid,
          final: dist.final,
          totalOnly: markVal,
        };
      }

      // Specific single component
      return {
        ...s,
        attendance: "PRESENT",
        [pasteTargetCol]: markVal,
      };
    }));

    setIsPasteModalOpen(false);
    setPastedMarksInput("");
    setSuccessMsg(`Successfully imported & mapped marks for ${updatedCount} students from Excel!`);
  };

  const getComputed = (s: any) =>
    isThesisOrProject
      ? ((s.thesis !== undefined ? s.thesis : (s.mid || 0)) + (s.viva !== undefined ? s.viva : (s.final || 0)))
      : (entryType === "detailed"
        ? s.assignment + s.quiz + (isPracticalCourse ? (s.practical || 0) : 0) + (examScheme === "TERMINAL" ? 0 : s.mid) + s.final
        : s.totalOnly);

  const handleSaveWithStatus = async (targetStatus: "SAVED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED", lockTarget?: boolean) => {
    if (!selectedCourse) {
      alert("Please select a Course first!");
      return;
    }
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const lockVal = lockTarget !== undefined ? lockTarget : (targetStatus === "APPROVED");
    const effectiveTotalMarks = isThesisOrProject ? 200 : courseTotalMarks;

    let successCount = 0;
    let lastError = "";
    for (const s of students) {
      const isStudentAbsent = s.attendance === "ABSENT";
      const studentStatus = isStudentAbsent ? "ABSENT" : targetStatus;

      let assignVal = s.assignment || 0;
      let quizVal = s.quiz || 0;
      let pracVal = isPracticalCourse ? (s.practical || 0) : 0;
      let midVal = examScheme === "TERMINAL" ? 0 : (s.mid || 0);
      let finalVal = s.final || 0;

      if (isThesisOrProject) {
        assignVal = 0;
        quizVal = 0;
        pracVal = 0;
        midVal = isStudentAbsent ? 0 : (s.thesis !== undefined ? s.thesis : (s.mid || 0));
        finalVal = isStudentAbsent ? 0 : (s.viva !== undefined ? s.viva : (s.final || 0));
      } else {
        // Auto-distribute if entered in Total mode or only Total is present
        if (!isStudentAbsent && (assignVal + quizVal + pracVal + midVal + finalVal === 0) && (s.totalOnly || 0) > 0) {
          const distributed = distributeTotalMarks(s.totalOnly, {
            isPracticalCourse,
            examScheme,
            courseTotalMarks: effectiveTotalMarks,
            isThesisOrProject,
          });
          assignVal = distributed.assignment;
          quizVal = distributed.quiz;
          pracVal = distributed.practical;
          midVal = distributed.mid;
          finalVal = distributed.final;
        }
      }

      try {
        const res = await fetch("/api/marks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: s.id,
            courseId: selectedCourse,
            assignmentMarks: isStudentAbsent ? 0 : assignVal,
            quizMarks: isStudentAbsent ? 0 : quizVal,
            practicalMarks: isStudentAbsent ? 0 : pracVal,
            midtermMarks: isStudentAbsent ? 0 : midVal,
            finalMarks: isStudentAbsent ? 0 : finalVal,
            thesisMarks: isThesisOrProject ? midVal : undefined,
            vivaMarks: isThesisOrProject ? finalVal : undefined,
            totalMarks: effectiveTotalMarks,
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

      let baseMsg = "💾 Marks saved as Draft!";
      if (targetStatus === "PENDING_APPROVAL") {
        baseMsg = "🚀 Result published & submitted for Admin Approval!";
      } else if (targetStatus === "APPROVED") {
        baseMsg = "✅ Result approved & locked for Faculty!";
      } else if (targetStatus === "REJECTED") {
        baseMsg = "🔓 Result unlocked & returned to Faculty for editing.";
      }
      setSuccessMsg(baseMsg);

      // Trigger automatic promotion & next-semester enrollment for eligible students
      fetch("/api/students/auto-promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse,
          programId: selectedProgram,
          session: selectedSession,
          semester: parseInt(selectedSemester),
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.promotedCount > 0) {
            setSuccessMsg((prev) => `${prev} • 🚀 ${res.promotedCount} student(s) automatically pushed to next semester!`);
          }
        })
        .catch(() => { });
    } else {
      setErrorMsg(lastError ? `Failed to save marks: ${lastError}` : "Failed to update result status. Please try again.");
    }
  };

  // Admin: Delete/Reset all marks for course
  const handleDeleteAllMarksForCourse = async () => {
    if (!selectedCourse) return alert("Please select a Course first!");
    if (!confirm("Are you sure you want to DELETE / RESET all saved marks for this course? This action will permanently remove all marks entries for this course.")) return;

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/marks?courseId=${selectedCourse}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`🗑️ ${data.message || "All marks for this course have been deleted successfully!"}`);
        setStudents(prev => prev.map(s => ({
          ...s,
          assignment: 0,
          quiz: 0,
          practical: 0,
          mid: 0,
          final: 0,
          totalOnly: 0,
          marksRecord: null,
        })));
        setResultStatus("SAVED");
        setIsLocked(false);
      } else {
        setErrorMsg(data.error || "Failed to delete marks.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to delete marks.");
    }
    setSaving(false);
  };

  // Admin: Delete/Clear marks for a single student
  const handleDeleteStudentMarks = async (studentId: string, studentName: string) => {
    if (!selectedCourse) return;
    if (!confirm(`Are you sure you want to clear/delete saved marks for "${studentName}"?`)) return;

    try {
      const res = await fetch(`/api/marks?courseId=${selectedCourse}&studentId=${studentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`🗑️ Saved marks cleared for "${studentName}".`);
        setStudents(prev => prev.map(s => s.id === studentId ? {
          ...s,
          assignment: 0,
          quiz: 0,
          practical: 0,
          mid: 0,
          final: 0,
          totalOnly: 0,
          marksRecord: null,
        } : s));
      } else {
        alert(data.error || "Failed to delete marks");
      }
    } catch (e: any) {
      alert(e.message || "Failed to delete marks");
    }
  };

  // Submit Unlock Request (Faculty)
  const handleRequestUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockReason.trim()) return alert("Please specify the reason for edit request.");
    setSubmittingUnlockReq(true);
    try {
      const res = await fetch("/api/marks/unlock-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourse, reason: unlockReason })
      });
      const data = await res.json();
      if (res.ok) {
        setResultStatus("UNLOCK_REQUESTED");
        if (typeof window !== "undefined") sessionStorage.setItem("req_sent_" + selectedCourse, "true");
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

  const filteredStudentsList = sortStudentsByRoll(
    students.filter(st => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = st.name.toLowerCase().includes(q);
        const matchRoll = st.roll.toLowerCase().includes(q);
        if (!matchName && !matchRoll) return false;
      }

      // Session filter
      if (selectedSession && selectedSession !== "ALL" && st.session && st.session !== selectedSession) {
        return false;
      }

      // Program type filter
      if (selectedProgType === "ALL") return true;
      if (selectedProgType === "REGULAR") return st.bsAdmissionType === "REGULAR" || !st.bsAdmissionType;
      if (selectedProgType === "BRIDGING") return st.bsAdmissionType === "BRIDGING_5TH";
      if (selectedProgType === "MIGRATION") return st.bsAdmissionType === "MIGRATION";
      return true;
    })
  );

  return (
    <div className="space-y-6">
      {/* ── CARD HEADER: ENTER & REVIEW STUDENT MARKS (MATCHING USER SCREENSHOT) ── */}
      <div className="bg-[#064e3b] text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800/80 border border-emerald-600/60 flex items-center justify-center flex-shrink-0 text-white shadow-xs">
            <FileText className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Enter & Review Student Marks</h2>
            <p className="text-xs text-emerald-200/90 font-medium">Select program and course to manage student evaluation & result approvals.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {selectedCourse && (
            <div>
              {resultStatus === "APPROVED" ? (
                <span className="px-3.5 py-1.5 text-xs font-black rounded-xl bg-emerald-600/90 text-white border border-emerald-400 flex items-center gap-1.5 shadow-sm">
                  <span>🔒</span> APPROVED & PUBLISHED (LOCKED)
                </span>
              ) : resultStatus === "PENDING_APPROVAL" ? (
                <span className="px-3.5 py-1.5 text-xs font-black rounded-xl bg-amber-500 text-slate-950 border border-amber-300 flex items-center gap-1.5 animate-pulse shadow-sm">
                  <span>⏳</span> PENDING ADMIN APPROVAL
                </span>
              ) : resultStatus === "REJECTED" ? (
                <span className="px-3.5 py-1.5 text-xs font-black rounded-xl bg-rose-600 text-white border border-rose-300 flex items-center gap-1.5 shadow-sm">
                  <span>❌</span> REJECTED - REVISION NEEDED
                </span>
              ) : (
                <span className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-800/90 text-emerald-100 border border-emerald-700 flex items-center gap-1.5 shadow-sm">
                  <span>📝</span> DRAFT / SAVED
                </span>
              )}
            </div>
          )}

          <div className="flex bg-emerald-950/70 p-1 rounded-xl border border-emerald-800/60 shadow-inner">
            <button
              className={`px-3.5 py-1.5 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 ${entryType === 'detailed'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-200 hover:text-white hover:bg-white/10'
                }`}
              onClick={() => setEntryType('detailed')}
            >
              <span>📊</span>
              <span>Detailed Breakdown</span>
            </button>
            <button
              className={`px-3.5 py-1.5 text-xs rounded-lg font-bold transition-all ${entryType === 'total'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-200 hover:text-white hover:bg-white/10'
                }`}
              onClick={() => setEntryType('total')}
            >
              Total Only
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters row (Matching Screenshot) */}
      <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              <span>Search Student</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              placeholder="Search name or roll number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Program Type</span>
            </label>
            <select
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
              value={selectedProgType}
              onChange={e => setSelectedProgType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="REGULAR">BS Regular</option>
              <option value="BRIDGING">BS 5th / Bridging</option>
              <option value="MIGRATION">Migration</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Session</span>
            </label>
            <select
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
            >
              <option value="">-- Session --</option>
              {sessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Program</span>
            </label>
            <select
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
              value={selectedProgram}
              onChange={e => {
                setSelectedProgram(e.target.value);
                setSelectedCourse("");
              }}
            >
              <option value="">-- Select Program --</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Semester</span>
            </label>
            <select
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
              value={selectedSemester}
              onChange={e => {
                setSelectedSemester(e.target.value);
                setSelectedCourse("");
              }}
            >
              <option value="">-- Select Semester --</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Select Course *</span>
          </label>
          <select
            className={`w-full px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 ${!selectedProgram ? 'opacity-60 cursor-not-allowed' : ''}`}
            value={selectedCourse}
            onChange={e => handleCourseChange(e.target.value)}
          >
            <option value="">-- Select Course --</option>
            {filteredCourses.map(c => {
              const creditFmt = c.creditHoursFormat || (c.labHours && c.labHours > 0 ? `${c.creditHours}(${c.theoryHours || c.creditHours - c.labHours}-${c.labHours})` : `${c.creditHours}(${c.creditHours}-0)`);
              return (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.code}) — {creditFmt} Cr
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {successMsg && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200 font-medium">{successMsg}</div>}
      {errorMsg && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 font-medium">{errorMsg}</div>}

      {!selectedProgram || !selectedCourse ? (
        <div className="bg-amber-50 border-2 border-dashed border-amber-300 text-amber-900 p-8 rounded-xl text-center space-y-3 shadow-sm">
          <div className="text-4xl">⚠️</div>
          <h3 className="font-bold text-lg">Program & Course Selection Required</h3>
          <p className="text-sm text-amber-800 max-w-md mx-auto">
            {!selectedProgram
              ? "Please select a Program, Semester, and Course from the filters above to load enrolled students and enter marks."
              : "Please select a Course from the dropdown above to start entering student marks."}
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">⏳ Loading students and marks data...</div>
      ) : (
        <>
          {isFacultyLocked && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 p-4 rounded-xl flex items-center justify-between shadow-sm flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <h4 className="text-sm font-bold">Result is Approved & Published by Admin. Marks are locked and cannot be edited by Faculty.</h4>
                  <p className="text-xs text-amber-800">If you need to make changes, send an unlock request to Admin with your reason.</p>
                </div>
              </div>
              <button
                onClick={() => setUnlockModalOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow transition-all"
              >
                📩 Request Unlock / Edit Permission
              </button>
            </div>
          )}

          {resultStatus === "UNLOCK_REQUESTED" && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-900 font-semibold shadow-sm">
              <span className="text-2xl">⏳</span>
              <div>
                <strong className="block font-extrabold text-blue-950 text-sm">Unlock Request Submitted</strong>
                Your request to edit marks is pending Admin approval. As soon as Admin approves, marks will unlock automatically.
              </div>
            </div>
          )}

          {/* Exam Scheme Mode Card (Decided by Datesheet) - Matching User Screenshot */}
          <div className="bg-[#ecfdf5] p-4 sm:p-4.5 rounded-2xl border border-emerald-200/90 flex items-center justify-between flex-wrap gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200/80 flex-shrink-0 shadow-xs">
                <Calendar className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider">Exam Scheme Mode (Decided by Datesheet):</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      {examScheme === "TERMINAL"
                        ? `Single Terminal Exam Scheme — ${isPracticalCourse ? 'Quiz+Assign (5) + Practical (25) + Terminal (70) = 100' : 'Quiz+Assign (30) + Terminal Exam (70) = 100'}`
                        : `Mid + Final Scheme — ${isPracticalCourse ? 'Quiz+Assign (15) + Practical (25) + Mid (20) + Final (40) = 100' : 'Quiz+Assign (30) + Mid (30) + Final (40) = 100'}`}
                    </span>
                  </div>
                  {datesheetInfo && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-200 text-emerald-950 rounded-full border border-emerald-300">
                      Datesheet ({datesheetInfo.examType})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/80 p-1 rounded-xl border border-emerald-200 shadow-xs">
              <button
                type="button"
                onClick={() => setExamScheme("MID_FINAL")}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${examScheme === "MID_FINAL"
                  ? "bg-[#064e3b] text-white shadow-sm"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Mid (30/20) + Final (40)</span>
              </button>
              <button
                type="button"
                onClick={() => setExamScheme("TERMINAL")}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${examScheme === "TERMINAL"
                  ? "bg-[#064e3b] text-white shadow-sm"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Single Terminal Exam (70)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 px-5 py-3 rounded-xl flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-blue-800">📊 Total Marks:</span>
              <input
                type="number"
                min="1"
                max="200"
                step="1"
                disabled={isFacultyLocked}
                value={courseTotalMarks}
                onChange={e => setCourseTotalMarks(parseInt(e.target.value) || 100)}
                className="w-20 px-2 py-1.5 border-2 border-blue-300 rounded-lg text-center font-bold text-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCourseTotalMarks(100)}
                  disabled={isFacultyLocked}
                  className={`px-2 py-1 rounded text-xs font-bold border transition-all ${courseTotalMarks === 100
                    ? "bg-purple-100 text-purple-900 border-purple-300 shadow-xs font-black"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  100
                </button>
                <button
                  type="button"
                  onClick={() => setCourseTotalMarks(200)}
                  disabled={isFacultyLocked}
                  className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${courseTotalMarks === 200
                    ? "bg-indigo-600 text-white border-indigo-700 shadow-xs font-black"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                    }`}
                >
                  🎓 200 (Project / Thesis)
                </button>
              </div>
            </div>
            {courseTotalMarks === 200 ? (
              <span className="px-3 py-1 text-xs font-extrabold bg-indigo-100 text-indigo-900 rounded-full border border-indigo-300 shadow-2xs flex items-center gap-1">
                <span>🎓 Project / Thesis (6 Cr • 200 Marks)</span>
                <span className="text-indigo-700 font-bold">• Pass: ≥100 (50%) • GP: Marks ÷ 2 for 3+3 Cr</span>
              </span>
            ) : isPracticalCourse ? (
              <span className="px-2.5 py-1 text-xs font-extrabold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                🔬 Practical Included — {examScheme === "TERMINAL" ? "Quiz+Assign: 5, Prac: 25, Terminal: 70" : "Quiz+Assign: 15, Prac: 25, Mid: 20, Final: 40"}
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-extrabold bg-purple-100 text-purple-900 rounded-full border border-purple-200">
                📖 Theory Course — {examScheme === "TERMINAL" ? "Quiz+Assign: 30, Terminal Exam: 70" : "Quiz+Assign: 30, Mid: 30, Final: 40"}
              </span>
            )}
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
                  Students marked as <strong>Absent (A)</strong> in Step 1 are automatically locked from mark entry and marked with <strong>'A'</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
              <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-700 shadow-sm">
                Total: <strong>{students.length}</strong>
              </span>
              <span className="px-3 py-1.5 bg-green-100 border border-green-300 rounded-xl text-green-800 shadow-sm font-extrabold">
                Present: <strong>{students.filter(s => s.attendance !== "ABSENT").length}</strong>
              </span>
              <span className="px-3 py-1.5 bg-red-100 border border-red-300 rounded-xl text-red-800 shadow-sm font-black">
                Absent (A): <strong>{students.filter(s => s.attendance === "ABSENT").length}</strong>
              </span>

              <div className="flex items-center gap-1.5 sm:ml-2 flex-wrap">
                <button
                  type="button"
                  disabled={isFacultyLocked}
                  onClick={() => setIsPasteModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                  title="Bulk paste marks directly from Excel or Google Sheets"
                >
                  <span>📋</span>
                  <span>Paste from Excel</span>
                </button>

                <button
                  type="button"
                  disabled={isFacultyLocked}
                  onClick={() => handleDistributeAll()}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                  title="Auto-distribute all students' Total Marks into Quiz, Mid & Final breakdown"
                >
                  <span>🎲</span>
                  <span>Distribute All</span>
                </button>

                <button
                  type="button"
                  disabled={isFacultyLocked}
                  onClick={() => {
                    const ans = confirm(`Set Direct 100 Marks for all present students and auto-distribute?`);
                    if (ans) handleDistributeAll(100);
                  }}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
                  title="Quickly fill 100 Marks for all present students"
                >
                  <span>🎯</span>
                  <span>Fill All 100</span>
                </button>

                <button
                  type="button"
                  disabled={isFacultyLocked}
                  onClick={() => markAllAttendance("PRESENT")}
                  className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm text-xs font-bold transition-all disabled:opacity-50"
                  title="Mark all as Present"
                >
                  Mark All P
                </button>
                <button
                  type="button"
                  disabled={isFacultyLocked}
                  onClick={() => markAllAttendance("ABSENT")}
                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm text-xs font-bold transition-all disabled:opacity-50"
                  title="Mark all as Absent"
                >
                  Mark All A
                </button>
                <button
                  type="button"
                  onClick={onEditAttendance}
                  className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  title="Return to Step 1: Paper Attendance Sheet"
                >
                  <span>📋</span>
                  <span>Step 1 Sheet</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-slate-100/70 border-r border-slate-200 w-28">Attendance</th>
                  {isThesisOrProject ? (
                    <>
                      <th className="px-4 py-3 text-center text-xs font-black text-indigo-900 bg-indigo-50 border-x border-indigo-200 uppercase">
                        Thesis (Max 100)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-black text-purple-900 bg-purple-50 border-x border-purple-200 uppercase">
                        Viva Voce (Max 100)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-blue-600 uppercase">
                        Total (200)
                      </th>
                    </>
                  ) : entryType === "detailed" ? (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment (Limit {examScheme === "TERMINAL" ? (isPracticalCourse ? '5' : '30') : (isPracticalCourse ? '15' : '30')})</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz (Limit {examScheme === "TERMINAL" ? (isPracticalCourse ? '5' : '30') : (isPracticalCourse ? '15' : '30')})</th>
                      {isPracticalCourse && (
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 bg-blue-100/70 border-x border-blue-200 uppercase">Practical (25)</th>
                      )}
                      {examScheme === "TERMINAL" ? (
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 bg-gray-100 uppercase">Mid Term (Disabled in Terminal)</th>
                      ) : (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mid Term ({isPracticalCourse ? '20' : '30'})</th>
                      )}
                      {examScheme === "TERMINAL" ? (
                        <th className="px-4 py-3 text-left text-xs font-black text-purple-900 bg-purple-100 border-x border-purple-300 uppercase">Terminal Exam (70)</th>
                      ) : (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Term (40)</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-600 uppercase">Total ({courseTotalMarks})</th>
                    </>
                  ) : (
                    <th className="px-4 py-3 text-left text-xs font-bold text-blue-600 uppercase">Total ({courseTotalMarks})</th>
                  )}
                  <th className="px-4 py-3 text-center text-xs font-bold text-indigo-600 uppercase bg-indigo-50">Grade</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-purple-600 uppercase bg-purple-50">GP Value</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudentsList.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-3xl mb-2">🚫</div>
                      <p className="font-semibold text-gray-700">No students found matching search & filter criteria.</p>
                      <p className="text-xs text-gray-400 mt-1">Try clearing search query or changing filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudentsList.map(s => {
                    const isAbsent = s.attendance === "ABSENT";
                    const totalQuizAssignLimit = examScheme === "TERMINAL"
                      ? (isPracticalCourse ? 5 : 30)
                      : (isPracticalCourse ? 15 : 30);
                    const quizHasFullMarks = (s.quiz || 0) >= totalQuizAssignLimit;
                    const assignHasFullMarks = (s.assignment || 0) >= totalQuizAssignLimit;

                    const effectiveTotal = isThesisOrProject ? 200 : courseTotalMarks;
                    const obtained = isAbsent ? 0 : getComputed(s);
                    const gp = isAbsent ? 0.0 : getGP(obtained, effectiveTotal);
                    const grade = isAbsent ? "F (A)" : getGrade(obtained, effectiveTotal);
                    const pass = !isAbsent && gp >= 1.0;
                    const isTargetStudent = Boolean(
                      (targetStudentId && s.id === targetStudentId) ||
                      (targetRollNumber && s.roll?.toLowerCase().trim() === targetRollNumber.toLowerCase().trim())
                    );

                    return (
                      <tr
                        id={`exam-student-row-${s.id}`}
                        key={s.id}
                        className={`transition-all duration-300 ${isTargetStudent
                          ? "bg-amber-100/70 ring-2 ring-amber-400 font-medium shadow-md"
                          : isAbsent
                            ? "bg-red-50/20"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{s.name}</span>
                            {isAbsent && (
                              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-red-100 text-red-700 border border-red-200">
                                ❌ ABSENT (A)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{s.roll}</div>
                        </td>

                        <td className="px-3 py-3 text-center border-r border-gray-100">
                          <div className="inline-flex rounded-xl border border-gray-200 p-0.5 bg-gray-100 shadow-sm">
                            <button
                              type="button"
                              disabled={isFacultyLocked}
                              onClick={() => toggleStudentAttendance(s.id, "PRESENT")}
                              title="Mark Present (P)"
                              className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${!isAbsent
                                ? "bg-green-600 text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                              🟢 P
                            </button>
                            <button
                              type="button"
                              disabled={isFacultyLocked}
                              onClick={() => toggleStudentAttendance(s.id, "ABSENT")}
                              title="Mark Absent (A) - locks mark inputs to 0"
                              className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${isAbsent
                                ? "bg-red-600 text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                              🔴 A
                            </button>
                          </div>
                        </td>

                        {isThesisOrProject ? (
                          <>
                            <td className="px-4 py-3 bg-indigo-50/20 border-x border-indigo-100 text-center">
                              <input
                                id={`exam-input-thesis-${s.id}`}
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                disabled={isFacultyLocked || isAbsent}
                                placeholder="0"
                                title={isAbsent ? "Student is Absent. Cells locked!" : "Thesis Max 100"}
                                className={`w-24 px-2 py-1 border rounded text-sm text-center font-bold focus:ring-2 focus:ring-indigo-400 ${isAbsent
                                  ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed"
                                  : "bg-white border-indigo-300 text-indigo-950 font-black shadow-sm"
                                  }`}
                                value={isAbsent ? 0 : (s.thesis !== undefined ? s.thesis : (s.mid || ""))}
                                onChange={e => handleMarkChange(s.id, "thesis", e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3 bg-purple-50/20 border-x border-purple-100 text-center">
                              <input
                                id={`exam-input-viva-${s.id}`}
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                disabled={isFacultyLocked || isAbsent}
                                placeholder="0"
                                title={isAbsent ? "Student is Absent. Cells locked!" : "Viva Voce Max 100"}
                                className={`w-24 px-2 py-1 border rounded text-sm text-center font-bold focus:ring-2 focus:ring-purple-400 ${isAbsent
                                  ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed"
                                  : "bg-white border-purple-300 text-purple-950 font-black shadow-sm"
                                  }`}
                                value={isAbsent ? 0 : (s.viva !== undefined ? s.viva : (s.final || ""))}
                                onChange={e => handleMarkChange(s.id, "viva", e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3 font-bold text-center">
                              {isAbsent ? (
                                <span className="px-2.5 py-1 bg-red-100 text-red-700 font-black rounded-lg text-xs border border-red-200 shadow-sm">
                                  A (ABSENT)
                                </span>
                              ) : (
                                <span className="font-mono text-sm font-black text-gray-900">
                                  {obtained} / 200
                                </span>
                              )}
                            </td>
                          </>
                        ) : entryType === "detailed" ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                max={totalQuizAssignLimit}
                                step="0.5"
                                disabled={isFacultyLocked || quizHasFullMarks || isAbsent}
                                title={isAbsent ? "Student is Absent. Cells locked!" : (quizHasFullMarks ? `Quiz has taken full ${totalQuizAssignLimit} marks. Assignment auto-blocked!` : `Max allowed: ${Math.max(0, totalQuizAssignLimit - (s.quiz || 0))}`)}
                                className={`w-20 px-2 py-1 border rounded text-sm text-center focus:ring-2 focus:ring-blue-400 ${isAbsent
                                  ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed"
                                  : quizHasFullMarks
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                                    : ""
                                  }`}
                                value={isAbsent ? 0 : (quizHasFullMarks ? 0 : (s.assignment || ""))}
                                onChange={e => handleMarkChange(s.id, "assignment", e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                max={totalQuizAssignLimit}
                                step="0.5"
                                disabled={isFacultyLocked || assignHasFullMarks || isAbsent}
                                title={isAbsent ? "Student is Absent. Cells locked!" : (assignHasFullMarks ? `Assignment has taken full ${totalQuizAssignLimit} marks. Quiz auto-blocked!` : `Max allowed: ${Math.max(0, totalQuizAssignLimit - (s.assignment || 0))}`)}
                                className={`w-20 px-2 py-1 border rounded text-sm text-center focus:ring-2 focus:ring-blue-400 ${isAbsent
                                  ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed"
                                  : assignHasFullMarks
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                                    : ""
                                  }`}
                                value={isAbsent ? 0 : (assignHasFullMarks ? 0 : (s.quiz || ""))}
                                onChange={e => handleMarkChange(s.id, "quiz", e.target.value)}
                              />
                            </td>
                            {isPracticalCourse && (
                              <td className="px-4 py-3 bg-blue-50/70 border-x border-blue-200">
                                <input
                                  type="number"
                                  min="0"
                                  max="25"
                                  step="0.5"
                                  disabled={isFacultyLocked || isAbsent}
                                  title={isAbsent ? "Student is Absent. Cells locked!" : ""}
                                  className={`w-20 px-2 py-1 border rounded text-sm font-black text-center ${isAbsent
                                    ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed"
                                    : "border-blue-400 text-blue-900 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    }`}
                                  value={isAbsent ? 0 : (s.practical || "")}
                                  onChange={e => handleMarkChange(s.id, "practical", e.target.value)}
                                />
                              </td>
                            )}
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                max="30"
                                step="0.5"
                                disabled={isFacultyLocked || examScheme === "TERMINAL" || isAbsent}
                                title={isAbsent ? "Student is Absent. Cells locked!" : ""}
                                className={`w-20 px-2 py-1 border rounded text-sm text-center focus:ring-2 focus:ring-blue-400 ${isAbsent
                                  ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed"
                                  : examScheme === "TERMINAL"
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed font-bold"
                                    : ""
                                  }`}
                                value={isAbsent || examScheme === "TERMINAL" ? 0 : (s.mid || "")}
                                onChange={e => handleMarkChange(s.id, "mid", e.target.value)}
                              />
                            </td>
                            <td className={`px-4 py-3 ${examScheme === "TERMINAL" ? "bg-purple-50/70 border-x border-purple-200" : ""}`}>
                              <input
                                type="number"
                                min="0"
                                max={examScheme === "TERMINAL" ? 70 : 40}
                                step="0.5"
                                disabled={isFacultyLocked || isAbsent}
                                title={isAbsent ? "Student is Absent. Cells locked!" : ""}
                                className={`w-20 px-2 py-1 border rounded text-sm focus:ring-2 text-center disabled:bg-gray-100 disabled:cursor-not-allowed ${isAbsent
                                  ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed"
                                  : examScheme === "TERMINAL"
                                    ? "border-purple-400 font-black text-purple-950 focus:ring-purple-500 shadow-sm bg-white"
                                    : "focus:ring-blue-400"
                                  }`}
                                value={isAbsent ? 0 : (s.final || "")}
                                onChange={e => handleMarkChange(s.id, "final", e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3 font-bold text-center">
                              {isAbsent ? (
                                <span className="px-2.5 py-1 bg-red-100 text-red-700 font-black rounded-lg text-xs border border-red-200 shadow-sm">
                                  A (ABSENT)
                                </span>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max={courseTotalMarks}
                                    step="0.5"
                                    disabled={isFacultyLocked || isAbsent}
                                    placeholder="0"
                                    value={obtained > 0 ? obtained : ""}
                                    onChange={(e) => handleTotalMarksChange(s.id, e.target.value)}
                                    className="w-20 px-2 py-1.5 border-2 border-blue-200 rounded-lg text-center font-mono font-bold text-blue-800 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 bg-blue-50/40 hover:bg-white shadow-2xs transition-all"
                                    title="Enter or paste Total Marks here — it automatically splits into Quiz, Assignment, Mid & Final!"
                                  />
                                </div>
                              )}
                            </td>
                          </>
                        ) : (
                          <td className="px-4 py-3">
                            {isAbsent ? (
                              <span className="px-2.5 py-1 bg-red-100 text-red-700 font-black rounded-lg text-xs border border-red-200 shadow-sm">
                                A (ABSENT)
                              </span>
                            ) : (
                              <div className="flex items-center justify-center">
                                <input
                                  type="number" min="0" max={courseTotalMarks} step="0.5"
                                  disabled={isFacultyLocked || isAbsent}
                                  placeholder="e.g. 78"
                                  className="w-24 px-3 py-1.5 border-2 border-blue-200 rounded-lg focus:border-blue-500 font-mono font-bold text-blue-700 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm text-center"
                                  value={s.totalOnly > 0 ? s.totalOnly : (obtained > 0 ? obtained : "")}
                                  onChange={e => handleTotalMarksChange(s.id, e.target.value)}
                                  title="Enter or paste Total Marks here — it automatically splits into Quiz, Assignment, Mid & Final!"
                                />
                              </div>
                            )}
                          </td>
                        )}

                        <td className={`px-4 py-3 text-center font-bold ${isAbsent ? "text-red-600 bg-red-50" : "bg-indigo-50 text-indigo-700"}`}>
                          {isAbsent ? "F (A)" : obtained === 0 ? "—" : grade}
                        </td>

                        <td className={`px-4 py-3 text-center ${isAbsent ? "bg-red-50" : "bg-purple-50"}`}>
                          <span className={`text-sm font-bold ${isAbsent
                            ? "text-red-600"
                            : gp >= 3.5
                              ? "text-green-600"
                              : gp >= 2.0
                                ? "text-blue-600"
                                : gp >= 1.0
                                  ? "text-yellow-600"
                                  : "text-red-500"
                            }`}>
                            {isAbsent ? "0.00" : obtained === 0 ? "—" : gp.toFixed(2)}
                          </span>
                        </td>

                        <td id={`fail-cell-${s.id}`} className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isAbsent ? (
                              <span className="px-2.5 py-1 text-xs rounded-full font-black bg-red-100 text-red-800 border border-red-200">
                                ❌ ABSENT (A)
                              </span>
                            ) : obtained === 0 ? (
                              <span className="px-3 py-1 text-xs rounded-full font-semibold bg-gray-100 text-gray-500">—</span>
                            ) : pass ? (
                              <span className="px-3 py-1 text-xs rounded-full font-bold bg-green-100 text-green-700 border border-green-200">
                                ✅ Pass
                              </span>
                            ) : (
                              <span
                                className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${isTargetStudent
                                  ? "bg-red-600 text-white ring-4 ring-red-400 ring-offset-2 animate-pulse shadow-lg scale-105"
                                  : "bg-red-100 text-red-700 border border-red-200"
                                  }`}
                              >
                                ❌ Fail
                              </span>
                            )}
                            {isTargetStudent && !pass && (
                              <span className="text-[10px] font-black uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-300 animate-pulse whitespace-nowrap">
                                👈 Target Cell
                              </span>
                            )}
                            {isAdmin && (s.marksRecord || obtained > 0) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStudentMarks(s.id, s.name)}
                                title="Admin: Clear/Delete saved marks for this student"
                                className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors text-xs font-bold"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t">
            <div className="text-xs text-gray-500 font-medium">
              Showing {filteredStudentsList.length} of {students.length} student records.
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleDeleteAllMarksForCourse}
                  disabled={saving}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  title="Admin: Delete / Reset all saved marks for this course"
                >
                  🗑️ Reset / Delete Course Marks
                </button>
              )}

              {!isFacultyLocked && (
                <button
                  onClick={() => handleSaveWithStatus("SAVED", false)}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 border border-gray-300"
                >
                  💾 Save Draft
                </button>
              )}

              {!isFacultyLocked && (
                <button
                  onClick={() => handleSaveWithStatus("PENDING_APPROVAL", false)}
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  🚀 Publish / Submit for Approval
                </button>
              )}

              {isAdmin && (
                <>
                  {resultStatus !== "APPROVED" ? (
                    <button
                      onClick={() => handleSaveWithStatus("APPROVED", true)}
                      disabled={saving}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      ✅ Approve & Publish (Lock Result)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSaveWithStatus("REJECTED", false)}
                      disabled={saving}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      🔓 Unlock / Re-open Result for Edit
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
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

      {/* ── BULK PASTE MARKS MODAL (FROM EXCEL / EXTERNAL) ── */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Bulk Paste Marks from Excel / External Sheet</h3>
                  <p className="text-xs text-gray-500">Copy cells in Excel/Sheets (Ctrl+C) and paste directly below (Ctrl+V).</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Target Destination Column
                </label>
                <select
                  value={pasteTargetCol}
                  onChange={(e: any) => setPasteTargetCol(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-gray-800 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="total">Direct Total Marks (100 / Total)</option>
                  <option value="final">Final Term Exam (40 / 70)</option>
                  <option value="mid">Mid Term Exam (30 / 20)</option>
                  <option value="assignment">Assignment</option>
                  <option value="quiz">Quiz</option>
                </select>
              </div>

              <div className="flex items-center pt-4">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <span>⚡</span>
                  <span>Total marks automatically split into Quiz, Assignment, Mid & Final breakdown!</span>
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs text-gray-500">
                <span className="font-semibold">Paste Raw Data from Excel / Sheets:</span>
                <span className="italic text-[11px]">Supports Single Column, Roll+Marks, or Full Breakdown</span>
              </div>
              <textarea
                rows={9}
                value={pastedMarksInput}
                onChange={(e) => setPastedMarksInput(e.target.value)}
                placeholder={"Paste here from Excel (Ctrl + V)...\n\nSupported formats:\n1) Single column of marks (one per row):\n   78\n   85\n   A\n   90\n\n2) Roll Number + Marks (tab-separated):\n   S-22/GPGCQ-BSMATH:01\t78\n   S-22/GPGCQ-BSMATH:02\t85"}
                className="w-full px-4 py-3 border-2 border-dashed border-indigo-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-slate-50/50"
              />
            </div>

            {/* Quick stats on detected lines */}
            {pastedMarksInput.trim() && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
                <span>
                  Detected: <strong>{pastedMarksInput.split(/\r?\n/).filter(l => l.trim()).length} rows</strong>
                </span>
                <span className="text-gray-500 text-[11px]">
                  Will map to <strong>{students.length} students</strong> in the active list
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsPasteModalOpen(false);
                  setPastedMarksInput("");
                }}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPastedMarks}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5"
              >
                <span>✓</span>
                <span>Apply Marks to Table</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MeritScholarshipsTab() {
  const [viewAll, setViewAll] = useState(false);
  const [cgpaThreshold, setCgpaThreshold] = useState(3.5);
  const [sessionFilter, setSessionFilter] = useState("Fall 2026");
  const [programFilter, setProgramFilter] = useState("BS Computer Science");
  const [semesterFilter, setSemesterFilter] = useState("4th");

  const allStudents: Array<{
    id: number;
    name: string;
    roll: string;
    cnic: string;
    contact: string;
    program: string;
    session: string;
    currentSemester: string;
    gpa1: number | null;
    gpa2: number | null;
    gpa3: number | null;
    gpa4: number | null;
    gpa5: number | null;
    gpa6: number | null;
    gpa7: number | null;
    gpa8: number | null;
    currentCgpa: number;
    totalCgpa: number;
    cgpa: number;
  }> = [
      {
        id: 1, name: "Ali Khan", roll: "BSCS-001", cnic: "12345-6789012-3", contact: "0300-1234567",
        program: "BS Computer Science", session: "Fall 2026", currentSemester: "4th",
        gpa1: 3.80, gpa2: 3.90, gpa3: 3.95, gpa4: 3.92, gpa5: null, gpa6: null, gpa7: null, gpa8: null,
        currentCgpa: 3.92, totalCgpa: 3.92, cgpa: 3.92
      },
      {
        id: 2, name: "Sara Ahmed", roll: "BSCS-002", cnic: "98765-4321098-7", contact: "0311-9876543",
        program: "BS Computer Science", session: "Fall 2026", currentSemester: "4th",
        gpa1: 3.70, gpa2: 3.80, gpa3: 3.90, gpa4: 3.85, gpa5: null, gpa6: null, gpa7: null, gpa8: null,
        currentCgpa: 3.85, totalCgpa: 3.85, cgpa: 3.85
      },
      {
        id: 3, name: "Ayesha Noor", roll: "BSE-014", cnic: "45678-1234567-8", contact: "0322-1122334",
        program: "BS English", session: "Fall 2026", currentSemester: "2nd",
        gpa1: 3.80, gpa2: 3.70, gpa3: null, gpa4: null, gpa5: null, gpa6: null, gpa7: null, gpa8: null,
        currentCgpa: 3.75, totalCgpa: 3.75, cgpa: 3.75
      },
    ];

  const filteredStudents = allStudents
    .filter(s => s.totalCgpa >= cgpaThreshold)
    .filter(s => viewAll || (s.session === sessionFilter && s.program === programFilter && s.currentSemester === semesterFilter))
    .sort((a, b) => b.totalCgpa - a.totalCgpa);

  const handleExportCSV = () => {
    const headers = [
      "S.No", "Roll No", "Name", "CNIC", "Contact No", "Department/Program", "Session", "Current Semester",
      "GPA 1", "GPA 2", "GPA 3", "GPA 4", "GPA 5", "GPA 6", "GPA 7", "GPA 8", "Current CGPA", "Total CGPA"
    ];
    const csvContent = [
      headers.join(","),
      ...filteredStudents.map((s, idx) => [
        idx + 1, s.roll, `"${s.name}"`, s.cnic, s.contact, `"${s.program}"`, `"${s.session}"`, s.currentSemester,
        s.gpa1 || "", s.gpa2 || "", s.gpa3 || "", s.gpa4 || "", s.gpa5 || "", s.gpa6 || "", s.gpa7 || "", s.gpa8 || "",
        s.currentCgpa.toFixed(2), s.totalCgpa.toFixed(2)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "merit_scholarships_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print:m-0 print:space-y-0">
      <style>{`
        @media print {
          @page { size: letter landscape; margin: 8mm; }
          html, body { width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
        }
      `}</style>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Merit & Scholarships List</h2>
          <p className="text-gray-500 text-sm print:hidden">Generate lists of top performers eligible for scholarships or honors.</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print / Save as PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 items-end print:hidden">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm h-full">
          <label className="text-sm font-semibold text-gray-700">Minimum CGPA:</label>
          <select
            className="border-none bg-transparent text-sm font-bold text-blue-600 py-1"
            value={cgpaThreshold}
            onChange={(e) => setCgpaThreshold(parseFloat(e.target.value))}
          >
            <option value="3.00">3.00+</option>
            <option value="3.25">3.25+</option>
            <option value="3.50">3.50+ (Honors)</option>
            <option value="3.80">3.80+ (High Honors)</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">View Scope</label>
          <div className="flex bg-white rounded-lg border p-1 w-full sm:w-64">
            <button
              className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${!viewAll ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setViewAll(false)}
            >
              By Program
            </button>
            <button
              className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${viewAll ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setViewAll(true)}
            >
              Overall (All)
            </button>
          </div>
        </div>

        {!viewAll && (
          <>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Session</label>
              <select className="w-full px-4 py-2 border rounded-lg bg-white text-sm" value={sessionFilter} onChange={e => setSessionFilter(e.target.value)}>
                <option value="2024-2028">2024-2028</option>
                <option value="2025-2029">2025-2029</option>
                <option value="2026-2030">2026-2030</option>
                <option value="2023-2027">2023-2027</option>
                <option value="2022-2026">2022-2026</option>
                <option value="2024-2026">2024-2026</option>
                <option value="2025-2027">2025-2027</option>
                <option value="2026-2028">2026-2028</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Program</label>
              <select className="w-full px-4 py-2 border rounded-lg bg-white text-sm" value={programFilter} onChange={e => setProgramFilter(e.target.value)}>
                <option>BS Computer Science</option>
                <option>BS Software Engineering</option>
                <option>BS English</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Semester</label>
              <select className="w-full px-4 py-2 border rounded-lg bg-white text-sm" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)}>
                <option>1st</option>
                <option>2nd</option>
                <option>3rd</option>
                <option>4th</option>
                <option>5th</option>
                <option>6th</option>
                <option>7th</option>
                <option>8th</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm print:border-none print:shadow-none">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="min-w-full divide-y divide-gray-200 table-auto print:w-full">
            <thead className="bg-gray-50 whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">S.No</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">Roll No</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">CNIC</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">Contact No</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">Department/Program</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">Session</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">Current Semester</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 1</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 2</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 3</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 4</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 5</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 6</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 7</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 8</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-center text-xs print:text-[8px] font-bold text-blue-700 uppercase bg-blue-50">Current CGPA</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-center text-xs print:text-[8px] font-bold text-blue-800 uppercase bg-blue-100">Total CGPA</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm print:text-[9px] whitespace-nowrap print:whitespace-normal">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={18} className="px-6 py-8 text-center text-gray-500">
                    No students with results found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, index) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 print:px-1.5 print:py-1 font-medium text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-gray-700">{s.roll}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 font-bold text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-gray-600">{s.cnic}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-gray-600">{s.contact}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-gray-700 max-w-[120px] print:max-w-none truncate print:whitespace-normal">{s.program}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-gray-700">{s.session}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-center font-medium text-gray-800">{s.currentSemester}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa1 ? s.gpa1.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa2 ? s.gpa2.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa3 ? s.gpa3.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa4 ? s.gpa4.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa5 ? s.gpa5.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa6 ? s.gpa6.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa7 ? s.gpa7.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa8 ? s.gpa8.toFixed(2) : '-'}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-center font-bold text-blue-700 bg-blue-50/50 print:bg-transparent">{s.currentCgpa.toFixed(2)}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-center font-black text-blue-800 bg-blue-100/50 print:bg-transparent">{s.totalCgpa.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusAcademicActionsTab() {
  const { collegeName, collegeLogo, collegeAddress, settings } = useSettings();
  const universityName = settings?.UNIVERSITY_NAME || "University of Balochistan";

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState<"FREEZE" | "QUIT" | "MIGRATION">("FREEZE");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [destinationCollege, setDestinationCollege] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const collegeCodePrefix = (settings?.COLLEGE_CODE || "GPGCQ").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const currentYear = new Date().getFullYear();

  const generateFreezeMemoNo = (code = collegeCodePrefix) => `${code || "GPGCQ"}/EXAM/FRZ/${currentYear}/${Math.floor(1000 + Math.random() * 9000)}`;
  const generateAdaMemoNo = (code = collegeCodePrefix) => `${code || "GPGCQ"}/EXAM/ADA-ADS/${currentYear}/${Math.floor(1000 + Math.random() * 9000)}`;
  const generateMigrationMemoNo = (code = collegeCodePrefix) => `${code || "GPGCQ"}/EXAM/MIG-NOC/${currentYear}/${Math.floor(1000 + Math.random() * 9000)}`;

  // Distinct Memo / Dispatch Numbers for each report
  const [freezeMemoNo, setFreezeMemoNo] = useState(() => `${collegeCodePrefix || "GPGCQ"}/EXAM/FRZ/${currentYear}/${Math.floor(1000 + Math.random() * 9000)}`);
  const [adaMemoNo, setAdaMemoNo] = useState(() => `${collegeCodePrefix || "GPGCQ"}/EXAM/ADA-ADS/${currentYear}/${Math.floor(1000 + Math.random() * 9000)}`);
  const [migrationMemoNo, setMigrationMemoNo] = useState(() => `${collegeCodePrefix || "GPGCQ"}/EXAM/MIG-NOC/${currentYear}/${Math.floor(1000 + Math.random() * 9000)}`);
  const [reason, setReason] = useState("");

  // Freeze Specific State
  const [freezeFromSem, setFreezeFromSem] = useState("3");
  const [freezeToSem, setFreezeToSem] = useState("4");
  const [freezeSession, setFreezeSession] = useState("2024-2028");
  const [freezeReason, setFreezeReason] = useState("Medical Grounds");
  const [freezeRemarks, setFreezeRemarks] = useState("Sanctioned as per BS Semester Regulations. Dues cleared.");
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeStudent, setFreezeStudent] = useState<any | null>(null);
  const [freezeOrderDetails, setFreezeOrderDetails] = useState<{
    memoNo: string;
    issueDate: string;
    fromSem: string;
    toSem: string;
    reason: string;
    session: string;
    remarks: string;
  }>({
    memoNo: "",
    issueDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    fromSem: "3",
    toSem: "4",
    reason: "Medical Grounds",
    session: "2024-2028",
    remarks: "",
  });

  // Saved Database Status Records
  const [savedRecords, setSavedRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const loadSavedRecords = () => {
    setLoadingRecords(true);
    fetch("/api/students/status-action")
      .then((r) => r.json())
      .then((data) => {
        if (data?.records && Array.isArray(data.records)) {
          setSavedRecords(data.records);
        }
      })
      .catch((e) => console.error("Error loading status records:", e))
      .finally(() => setLoadingRecords(false));
  };

  // Dual Document Modal state (Migration Certificate & Transcript)
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalTab, setDocModalTab] = useState<"report" | "transcript">("report");
  const [migratedStudent, setMigratedStudent] = useState<any | null>(null);
  const [docDetails, setDocDetails] = useState<{
    destinationCollege: string;
    relievingNo: string;
    reason: string;
    issueDate: string;
  }>({
    destinationCollege: "",
    relievingNo: "",
    reason: "",
    issueDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  });

  // ADA / ADS Exit State & Modal
  const [showAdaModal, setShowAdaModal] = useState(false);
  const [adaModalTab, setAdaModalTab] = useState<"minutes" | "transcript">("minutes");
  const [adaStudent, setAdaStudent] = useState<any | null>(null);
  const [adaReason, setAdaReason] = useState("Compulsory Work");
  const [adaDegreeType, setAdaDegreeType] = useState<"ADA" | "ADS">("ADS");
  const [adaMeetingDate, setAdaMeetingDate] = useState(() => {
    const d = new Date();
    const day = d.getDate();
    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const year = d.getFullYear();
    return `${day}${suffix} of ${month}, ${year}`;
  });
  const [adaMeetingVenue, setAdaMeetingVenue] = useState("college conference hall");
  const [adaCreditHours, setAdaCreditHours] = useState("64");
  const [adaCgpa, setAdaCgpa] = useState("2.13");
  const [adaLiaisonUniv, setAdaLiaisonUniv] = useState(universityName || "University of Baluchistan Quetta");

  function computeStudentTwoYearStats(student: any) {
    let totalCredits = 0;
    let totalQP = 0;
    if (Array.isArray(student?.marks)) {
      student.marks.forEach((m: any) => {
        const sem = m.semester || m.course?.semester || 1;
        if (sem <= 4) {
          const cr = m.course?.creditHours || 3;
          const gp = getGPValue(m.obtainedMarks, m.totalMarks);
          totalQP += gp * cr;
          totalCredits += cr;
        }
      });
    }
    const cgpa = totalCredits > 0 ? (totalQP / totalCredits).toFixed(2) : "2.13";
    return {
      creditHours: totalCredits > 0 ? totalCredits : 64,
      cgpa,
    };
  }

  const loadStudents = () => {
    setLoading(true);
    fetch("/api/students?educationLevel=BS&includeInactive=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const bsOnly = sortStudentsByRoll(data.filter((s: any) => s.educationLevel === "BS"));
          setStudents(bsOnly);
        }
      })
      .catch((err) => console.error("Error fetching students:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
    loadSavedRecords();
  }, []);

  const activeCandidates = students.filter((s) => s.isActive !== false);
  const filteredActiveCandidates = activeCandidates.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    const name = s.user?.name?.toLowerCase() || "";
    const roll = s.rollNumber?.toLowerCase() || "";
    return name.includes(q) || roll.includes(q);
  });

  // Guarantee selectedStudentId is always valid within filteredActiveCandidates
  useEffect(() => {
    if (filteredActiveCandidates.length > 0) {
      const match = filteredActiveCandidates.find((s) => s.id === selectedStudentId);
      if (!match) {
        setSelectedStudentId(filteredActiveCandidates[0].id);
      }
    } else {
      if (selectedStudentId) {
        setSelectedStudentId("");
      }
    }
  }, [filteredActiveCandidates, selectedStudentId]);

  const selectedStudent = filteredActiveCandidates.find((s) => s.id === selectedStudentId) || null;

  useEffect(() => {
    if (selectedStudent) {
      if (selectedStudent.currentSemester) {
        setFreezeFromSem(String(selectedStudent.currentSemester));
        setFreezeToSem(String(Math.min(8, Number(selectedStudent.currentSemester) + 1)));
      }
      if (selectedStudent.session) {
        setFreezeSession(selectedStudent.session);
      }
      const stats = computeStudentTwoYearStats(selectedStudent);
      setAdaCreditHours(String(stats.creditHours));
      setAdaCgpa(String(stats.cgpa));
      const prog = (selectedStudent.program?.name || "").toLowerCase();
      if (
        prog.includes("arts") ||
        prog.includes("english") ||
        prog.includes("urdu") ||
        prog.includes("islam") ||
        prog.includes("history") ||
        prog.includes("political") ||
        prog.includes("pak") ||
        prog.includes("sociology") ||
        prog.includes("economics")
      ) {
        setAdaDegreeType("ADA");
      } else {
        setAdaDegreeType("ADS");
      }
    }
  }, [selectedStudent]);

  // Combined Saved Records Lists (From database + Student models)
  const freezeSavedList = [
    ...savedRecords.filter((r) => r.statusType === "FREEZE"),
    ...students
      .filter((s) => s.statuses?.some((st: any) => st.statusType === "FREEZE"))
      .filter((s) => !savedRecords.some((r) => r.studentId === s.id && r.statusType === "FREEZE"))
      .map((s) => ({
        id: `st-${s.id}`,
        studentId: s.id,
        statusType: "FREEZE",
        reason: s.statuses?.find((st: any) => st.statusType === "FREEZE")?.reason || "Medical Grounds",
        notes: s.statuses?.find((st: any) => st.statusType === "FREEZE")?.notes || "",
        createdAt: s.statuses?.find((st: any) => st.statusType === "FREEZE")?.createdAt || new Date().toISOString(),
        student: s,
      })),
  ];

  const quitSavedList = [
    ...savedRecords.filter((r) => r.statusType === "QUIT" || r.statusType === "ADP"),
    ...students
      .filter((s) => s.statuses?.some((st: any) => st.statusType === "QUIT" || st.statusType === "ADP"))
      .filter((s) => !savedRecords.some((r) => r.studentId === s.id && (r.statusType === "QUIT" || r.statusType === "ADP")))
      .map((s) => ({
        id: `st-${s.id}`,
        studentId: s.id,
        statusType: "QUIT",
        reason: s.statuses?.find((st: any) => st.statusType === "QUIT" || st.statusType === "ADP")?.reason || "Compulsory Work",
        notes: s.statuses?.find((st: any) => st.statusType === "QUIT" || st.statusType === "ADP")?.notes || "",
        createdAt: s.statuses?.find((st: any) => st.statusType === "QUIT" || st.statusType === "ADP")?.createdAt || new Date().toISOString(),
        student: s,
      })),
  ];

  const migrationSavedList = [
    ...savedRecords.filter((r) => r.statusType === "MIGRATION" || r.statusType === "MIGRATION_OUT"),
    ...students
      .filter((s) => s.statuses?.some((st: any) => st.statusType === "MIGRATION" || st.statusType === "MIGRATION_OUT"))
      .filter((s) => !savedRecords.some((r) => r.studentId === s.id && (r.statusType === "MIGRATION" || r.statusType === "MIGRATION_OUT")))
      .map((s) => ({
        id: `st-${s.id}`,
        studentId: s.id,
        statusType: "MIGRATION",
        reason: s.statuses?.find((st: any) => st.statusType === "MIGRATION" || st.statusType === "MIGRATION_OUT")?.reason || "Outward Migration",
        notes: s.statuses?.find((st: any) => st.statusType === "MIGRATION" || st.statusType === "MIGRATION_OUT")?.notes || "",
        createdAt: s.statuses?.find((st: any) => st.statusType === "MIGRATION" || st.statusType === "MIGRATION_OUT")?.createdAt || new Date().toISOString(),
        student: s,
      })),
  ];

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedStudent) return;
    setSaving(true);

    const activeMemo = actionType === "FREEZE" ? freezeMemoNo : actionType === "QUIT" ? adaMemoNo : migrationMemoNo;

    try {
      const res = await fetch("/api/students/status-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          statusType: actionType,
          memoNo: activeMemo,
          relievingNo: actionType === "MIGRATION" ? activeMemo : undefined,
          fromSem: actionType === "FREEZE" ? freezeFromSem : undefined,
          toSem: actionType === "FREEZE" ? freezeToSem : undefined,
          destinationCollege: actionType === "MIGRATION" ? destinationCollege : undefined,
          adaDegreeType: actionType === "QUIT" ? adaDegreeType : undefined,
          adaCreditHours: actionType === "QUIT" ? adaCreditHours : undefined,
          adaCgpa: actionType === "QUIT" ? adaCgpa : undefined,
          adaMeetingDate: actionType === "QUIT" ? adaMeetingDate : undefined,
          adaMeetingVenue: actionType === "QUIT" ? adaMeetingVenue : undefined,
          adaLiaisonUniv: actionType === "QUIT" ? adaLiaisonUniv : undefined,
          reason: actionType === "MIGRATION"
            ? (destinationCollege || "Outward Migration")
            : actionType === "QUIT"
              ? (adaReason || reason || "Compulsory Work")
              : (freezeReason || reason || "Medical Grounds"),
          notes: actionType === "FREEZE"
            ? freezeRemarks
            : actionType === "MIGRATION"
              ? reason
              : (adaReason || "Compulsory Work"),
        }),
      });

      if (res.ok) {
        setSuccess(`Academic action '${actionType === "QUIT" ? "Quit / ADA / ADS" : actionType}' recorded successfully with Memo No: ${activeMemo}!`);

        if (actionType === "FREEZE") {
          // Immediately open official Freeze Approval Notification Order
          setFreezeStudent(selectedStudent);
          setFreezeOrderDetails({
            memoNo: freezeMemoNo,
            issueDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
            fromSem: freezeFromSem,
            toSem: freezeToSem,
            reason: freezeReason || reason || "Medical Grounds",
            session: freezeSession || selectedStudent.session || "2024-2028",
            remarks: freezeRemarks,
          });
          setShowFreezeModal(true);
          setReason("");
          setFreezeMemoNo(generateFreezeMemoNo());
        } else if (actionType === "MIGRATION") {
          // Immediately generate migration certificate and official transcript
          setMigratedStudent(selectedStudent);
          setDocDetails({
            destinationCollege: destinationCollege || "Destination Institution",
            relievingNo: migrationMemoNo,
            reason: reason || "Outward Migration",
            issueDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
          });
          setDocModalTab("report");
          setShowDocModal(true);

          setDestinationCollege("");
          setReason("");
          setMigrationMemoNo(generateMigrationMemoNo());
        } else if (actionType === "QUIT") {
          // Immediately generate ADA / ADS Minutes of Meeting report
          setAdaStudent(selectedStudent);
          setAdaReason(adaReason || reason || "Compulsory Work");
          setAdaCreditHours(adaCreditHours || "64");
          setAdaCgpa(adaCgpa || "2.13");
          setAdaDegreeType(adaDegreeType);
          setAdaMeetingDate(adaMeetingDate);
          setAdaMeetingVenue(adaMeetingVenue);
          setAdaLiaisonUniv(adaLiaisonUniv || universityName || "University of Baluchistan Quetta");
          setAdaModalTab("minutes");
          setShowAdaModal(true);
          setReason("");
          setAdaMemoNo(generateAdaMemoNo());
        }

        loadStudents();
        loadSavedRecords();
        setTimeout(() => setSuccess(""), 6000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Action failed to execute.");
      }
    } catch {
      alert("Action failed to execute.");
    }
    setSaving(false);
  };

  const openFreezeOrderForStudent = (recordOrStudent: any) => {
    const student = recordOrStudent.student || recordOrStudent;
    const statusObj = recordOrStudent.statusType
      ? recordOrStudent
      : student.statuses?.find((s: any) => s.statusType === "FREEZE");

    let memoNo = generateFreezeMemoNo();
    let fSem = student.currentSemester ? String(student.currentSemester) : "3";
    let tSem = student.currentSemester ? String(Math.min(8, Number(student.currentSemester) + 1)) : "4";
    let rsn = statusObj?.reason || "Medical Grounds";
    let sess = student.session || "2024-2028";
    let rmks = "Sanctioned as per BS Semester Regulations. Dues cleared.";
    let iDate = statusObj?.createdAt
      ? new Date(statusObj.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    if (statusObj?.notes) {
      if (statusObj.notes.includes("Memo No: ")) {
        const m = statusObj.notes.match(/Memo No:\s*([^•\.\n]+)/);
        if (m) memoNo = m[1].trim();
      }
      if (statusObj.notes.includes("Freeze Duration: Sem ")) {
        const m = statusObj.notes.match(/Freeze Duration: Sem\s*(\d+)\s*to\s*Sem\s*(\d+)/i);
        if (m) {
          fSem = m[1];
          tSem = m[2];
        }
      }
      if (statusObj.notes.includes("Remarks: ")) {
        const m = statusObj.notes.split("Remarks: ");
        if (m[1]) rmks = m[1].trim();
      }
    }

    setFreezeStudent(student);
    setFreezeOrderDetails({
      memoNo,
      issueDate: iDate,
      fromSem: fSem,
      toSem: tSem,
      reason: rsn,
      session: sess,
      remarks: rmks,
    });
    setShowFreezeModal(true);
  };

  const openDocumentsForStudent = (recordOrStudent: any, tab: "report" | "transcript" = "report") => {
    const student = recordOrStudent.student || recordOrStudent;
    const migStatus = recordOrStudent.statusType
      ? recordOrStudent
      : student.statuses?.find((st: any) => st.statusType === "MIGRATION" || st.statusType === "MIGRATION_OUT");

    let dest = migStatus?.reason || "Destination Institution";
    let certNo = generateMigrationMemoNo();
    let iDate = migStatus?.createdAt
      ? new Date(migStatus.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    if (migStatus?.notes) {
      if (migStatus.notes.includes("Memo No: ")) {
        const m = migStatus.notes.match(/Memo No:\s*([^•\.\n]+)/);
        if (m) certNo = m[1].trim();
      } else if (migStatus.notes.includes("NOC No: ")) {
        const parts = migStatus.notes.split("NOC No: ");
        if (parts[1]) certNo = parts[1].split(".")[0].trim();
      }
      if (migStatus.notes.includes("Destination: ")) {
        const parts = migStatus.notes.split("Destination: ");
        if (parts[1]) dest = parts[1].split(".")[0].trim();
      }
    }

    setMigratedStudent(student);
    setDocDetails({
      destinationCollege: dest,
      relievingNo: certNo,
      reason: migStatus?.notes || migStatus?.reason || "Outward Migration",
      issueDate: iDate,
    });
    setDocModalTab(tab);
    setShowDocModal(true);
  };

  const openAdaMinutesForStudent = (recordOrStudent: any, tab: "minutes" | "transcript" = "minutes") => {
    const student = recordOrStudent.student || recordOrStudent;
    const quitStatus = recordOrStudent.statusType
      ? recordOrStudent
      : student.statuses?.find((st: any) => st.statusType === "QUIT" || st.statusType === "ADP");

    const stats = computeStudentTwoYearStats(student);
    let rsn = quitStatus?.reason || "Compulsory Work";
    let cr = String(stats.creditHours);
    let gpa = String(stats.cgpa);
    let mDate = adaMeetingDate;
    let venue = "college conference hall";
    let dType: "ADA" | "ADS" = "ADS";
    let memoNo = generateAdaMemoNo();

    const prog = (student.program?.name || "").toLowerCase();
    if (
      prog.includes("arts") ||
      prog.includes("english") ||
      prog.includes("urdu") ||
      prog.includes("islam") ||
      prog.includes("history") ||
      prog.includes("political") ||
      prog.includes("pak") ||
      prog.includes("sociology") ||
      prog.includes("economics")
    ) {
      dType = "ADA";
    }

    if (quitStatus?.notes) {
      if (quitStatus.notes.includes("Memo No: ")) {
        const m = quitStatus.notes.match(/Memo No:\s*([^•\.\n]+)/);
        if (m) memoNo = m[1].trim();
      }
      if (quitStatus.notes.includes("Credits: ")) {
        const m = quitStatus.notes.match(/Credits:\s*([0-9.]+)/);
        if (m) cr = m[1];
      }
      if (quitStatus.notes.includes("CGPA: ")) {
        const m = quitStatus.notes.match(/CGPA:\s*([0-9.]+)/);
        if (m) gpa = m[1];
      }
      if (quitStatus.notes.includes("Meeting Date: ")) {
        const m = quitStatus.notes.match(/Meeting Date:\s*([^•,\.]+)/);
        if (m) mDate = m[1].trim();
      }
      if (quitStatus.notes.includes("Venue: ")) {
        const m = quitStatus.notes.match(/Venue:\s*([^•,\.]+)/);
        if (m) venue = m[1].trim();
      }
      if (quitStatus.notes.includes("Degree: ADA") || quitStatus.notes.includes("ADA")) dType = "ADA";
      else if (quitStatus.notes.includes("Degree: ADS") || quitStatus.notes.includes("ADS")) dType = "ADS";
    }

    setAdaStudent(student);
    setAdaMemoNo(memoNo);
    setAdaReason(rsn);
    setAdaCreditHours(cr);
    setAdaCgpa(gpa);
    setAdaMeetingDate(mDate);
    setAdaMeetingVenue(venue);
    setAdaDegreeType(dType);
    setAdaLiaisonUniv(universityName || "University of Baluchistan Quetta");
    setAdaModalTab(tab);
    setShowAdaModal(true);
  };

  const handleUnfreezeStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to unfreeze ${studentName} and reactivate them for normal semester studies?`)) return;
    try {
      const res = await fetch("/api/students/status-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          statusType: "ACTIVE",
          reason: "Semester freeze completed. Resumed regular semester studies.",
        }),
      });
      if (res.ok) {
        setSuccess(`Student ${studentName} has been unfrozen and restored to active enrollment!`);
        loadStudents();
        loadSavedRecords();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to unfreeze student.");
      }
    } catch {
      alert("Failed to unfreeze student.");
    }
  };

  const handleDeleteStatusRecord = async (recordId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove this record for ${studentName}? If this was their only inactive status, their enrollment will be restored to active.`)) return;
    try {
      const res = await fetch(`/api/students/status-action?id=${encodeURIComponent(recordId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess(`Status record removed successfully for ${studentName}!`);
        loadStudents();
        loadSavedRecords();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to remove status record.");
      }
    } catch {
      alert("Failed to remove status record.");
    }
  };

  return (
    <div className="exams-page-root space-y-6 print:space-y-0">
      {/* Print isolation style: when modal is active, hide sibling views and fit Letter page cleanly */}
      {(showDocModal || showAdaModal || showFreezeModal) && (
        <style>{`
          @media print {
            @page {
              size: letter portrait;
              margin: 8mm 10mm;
            }
            html, body {
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .exams-page-root > :not(.bs-active-print-modal):not(style) {
              display: none !important;
            }
            #freeze-print-container, #migration-print-container, #ada-print-container {
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          }
        `}</style>
      )}

      <div className="flex justify-between items-center border-b pb-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Student Academic Status & Actions</h2>
          <p className="text-gray-500 text-xs mt-0.5">Manage academic semester freezing, student quit (ADA/ADS 2-Year exit), and outward migrations with reports.</p>
        </div>
      </div>

      {/* Quick Action Selection Tabs */}
      <div className="flex flex-wrap gap-2.5 print:hidden">
        {[
          { key: "FREEZE", label: "❄️ Freeze", desc: "Freeze Semester" },
          { key: "QUIT", label: "🎓 Quit / ADA / ADS", desc: "2-Year Exit & ADA/ADS Award Report" },
          { key: "MIGRATION", label: "🔄 Migration", desc: "Outward Migration & Clearance" },
        ].map((act) => (
          <button
            key={act.key}
            type="button"
            onClick={() => {
              setActionType(act.key as any);
              setSuccess("");
            }}
            className={`px-5 py-2.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${actionType === act.key
              ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300"
              : "bg-white text-gray-700 hover:bg-gray-100 border-gray-200"
              }`}
          >
            {act.label}
          </button>
        ))}
      </div>

      {success && (
        <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 text-sm font-bold flex items-center justify-between print:hidden">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess("")} className="text-xs text-green-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Action Input Form */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-2xl print:hidden">
        <h3 className="text-base font-black mb-4 text-gray-800 flex items-center gap-2">
          <span>⚙️ Update Academic Action:</span>
          <span className={`px-3 py-1 text-xs rounded-full font-bold ${actionType === "MIGRATION" ? "bg-amber-100 text-amber-800" :
            actionType === "FREEZE" ? "bg-cyan-100 text-cyan-800" :
              "bg-blue-100 text-blue-800"
            }`}>
            {actionType === "MIGRATION" ? "🔄 MIGRATION" :
              actionType === "QUIT" ? "🎓 QUIT / ADA / ADS (2-YEAR EXIT)" :
                "❄️ FREEZE"}
          </span>
        </h3>

        <form onSubmit={handleStatusSubmit} className="space-y-4">
          {/* Quick Search & Select Student */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black text-gray-600 uppercase tracking-wider">
                Select Active Student ({filteredActiveCandidates.length} eligible)
              </label>
              <span className="text-[11px] text-gray-400">Search by roll or name below</span>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="🔍 Type roll no or student name to filter..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400"
              />

              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
                disabled={filteredActiveCandidates.length === 0}
                className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white font-bold text-gray-800 focus:ring-2 focus:ring-blue-400 shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
              >
                {filteredActiveCandidates.length === 0 ? (
                  <option value="">No eligible active BS students found</option>
                ) : (
                  filteredActiveCandidates.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.rollNumber} — {s.user?.name} ({s.program?.name || "BS Degree"}) [Sem {s.currentSemester || 1}]
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedStudent ? (
              <div className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-slate-700">
                <span><strong>Roll No:</strong> <span className="font-mono font-bold text-blue-700">{selectedStudent.rollNumber}</span></span>
                <span><strong>Father Name:</strong> {selectedStudent.fatherName || "—"}</span>
                <span><strong>Session:</strong> {selectedStudent.session || "—"}</span>
                <span><strong>Current Sem:</strong> Semester {selectedStudent.currentSemester || 1}</span>
              </div>
            ) : (
              <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-800">
                No active student selected or matching filter.
              </div>
            )}
          </div>

          {/* Migration Specific Fields */}
          {actionType === "MIGRATION" ? (
            <>
              <div>
                <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                  Destination Institution / College <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={destinationCollege}
                  onChange={(e) => setDestinationCollege(e.target.value)}
                  required
                  placeholder="e.g. University of Balochistan / Govt Degree College Quetta"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                  Migration NOC / Relieving Memo Ref No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={migrationMemoNo}
                  onChange={(e) => setMigrationMemoNo(e.target.value)}
                  required
                  placeholder={`e.g. ${collegeCodePrefix}/EXAM/MIG-NOC/${currentYear}/1024`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-amber-400 text-amber-950"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block font-mono">
                  Distinct Outward Migration NOC Dispatch Number
                </span>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                  Migration Reason / Justification
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Specify reason (e.g. Family relocation, student transfer, personal reasons)..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <span className="text-base">📜</span>
                <p className="leading-relaxed">
                  <strong>Automatic Document Issuance:</strong> Upon confirmation, student will be relieved from the college, and both the <strong>Migration Report (NOC Certificate)</strong> with Memo No (<code>{migrationMemoNo}</code>) and <strong>Official Academic Transcript</strong> will be instantly generated for viewing and printing.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving || !selectedStudentId}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>🔄</span>
                <span>{saving ? "Processing Migration..." : "Confirm Migration & Issue Documents"}</span>
              </button>
            </>
          ) : actionType === "QUIT" ? (
            /* Quit / ADA / ADS 2-Year Exit Fields */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                    ADA / ADS Memo / Dispatch Ref No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adaMemoNo}
                    onChange={(e) => setAdaMemoNo(e.target.value)}
                    required
                    placeholder={`e.g. ${collegeCodePrefix}/EXAM/ADA-ADS/${currentYear}/1024`}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-blue-400 text-blue-950"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block font-mono">
                    Distinct ADA/ADS Minutes & Award Dispatch Number
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                    Award Degree Equivalent To <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAdaDegreeType("ADS")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${adaDegreeType === "ADS"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                        }`}
                    >
                      ADS (Science)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdaDegreeType("ADA")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${adaDegreeType === "ADA"
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                        }`}
                    >
                      ADA (Arts)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                  Exit Reason / Student Statement <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={adaReason}
                  onChange={(e) => setAdaReason(e.target.value)}
                  required
                  placeholder="e.g. Compulsory Work / Employment / Financial Constraints"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {["Compulsory Work", "Employment", "Financial Constraints", "Domestic Reasons"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAdaReason(preset)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                    Meeting Date (Held On)
                  </label>
                  <input
                    type="text"
                    value={adaMeetingDate}
                    onChange={(e) => setAdaMeetingDate(e.target.value)}
                    placeholder="e.g. 22th of October, 2026"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                    Meeting Venue
                  </label>
                  <input
                    type="text"
                    value={adaMeetingVenue}
                    onChange={(e) => setAdaMeetingVenue(e.target.value)}
                    placeholder="college conference hall"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-400 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                    Credit Hours (2 Years)
                  </label>
                  <input
                    type="text"
                    value={adaCreditHours}
                    onChange={(e) => setAdaCreditHours(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-black bg-white focus:ring-2 focus:ring-blue-400 text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                    CGPA (2 Years)
                  </label>
                  <input
                    type="text"
                    value={adaCgpa}
                    onChange={(e) => setAdaCgpa(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-black bg-white focus:ring-2 focus:ring-blue-400 text-center text-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                    Liaison University
                  </label>
                  <input
                    type="text"
                    value={adaLiaisonUniv}
                    onChange={(e) => setAdaLiaisonUniv(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                <span className="text-base">📜</span>
                <p className="leading-relaxed">
                  <strong>Automatic Minutes of Meeting Generation:</strong> Upon confirmation, student BS status is updated to Quit (2-Year Exit), and the official <strong>BS Examination Committee Minutes of Meeting</strong> with distinct Memo No (<code>{adaMemoNo}</code>) will be generated for official University liaison and instant printing.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !selectedStudentId}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>🎓</span>
                  <span>{saving ? "Processing Quit / ADA-ADS..." : "Confirm QUIT / ADA-ADS & Issue Report"}</span>
                </button>

                {selectedStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdaStudent(selectedStudent);
                      setAdaModalTab("minutes");
                      setShowAdaModal(true);
                    }}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    title="Preview or print the Minutes of Meeting without submitting"
                  >
                    <span>👁️</span>
                    <span>Preview Report</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Freeze Fields */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                    Freeze Order Memo / Dispatch Ref No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={freezeMemoNo}
                    onChange={(e) => setFreezeMemoNo(e.target.value)}
                    required
                    placeholder={`e.g. ${collegeCodePrefix}/EXAM/FRZ/${currentYear}/1024`}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-cyan-500 text-cyan-950"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block font-mono">
                    Distinct Official Semester Freeze Dispatch Number
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                    Academic Session / Batch
                  </label>
                  <input
                    type="text"
                    value={freezeSession}
                    onChange={(e) => setFreezeSession(e.target.value)}
                    placeholder="e.g. 2024-2028"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                    Freeze From Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={freezeFromSem}
                    onChange={(e) => {
                      setFreezeFromSem(e.target.value);
                      const next = Math.min(8, Number(e.target.value) + 1);
                      setFreezeToSem(String(next));
                    }}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-cyan-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                    Resumption / Return In Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={freezeToSem}
                    onChange={(e) => setFreezeToSem(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-cyan-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s} (Junior Batch)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                  Official Reason for Semester Freeze <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  required
                  placeholder="e.g. Medical Grounds / Financial Hardship / Family Circumstances"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-cyan-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {["Medical Grounds", "Financial Hardship", "Family Emergency", "Employment / Job Transfer", "Personal Circumstances"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFreezeReason(preset)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-medium transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
                  Institutional Notes / Committee Remarks
                </label>
                <textarea
                  value={freezeRemarks}
                  onChange={(e) => setFreezeRemarks(e.target.value)}
                  rows={2}
                  placeholder="Sanctioned as per BS Semester Regulations. Dues cleared. Permitted to rejoin with junior batch..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3.5 text-xs text-cyan-900 flex items-start gap-2.5">
                <span className="text-base">❄️</span>
                <p className="leading-relaxed">
                  <strong>Automatic Semester Freeze Order Issuance:</strong> Upon confirmation, student status is deactivated as Frozen, and an official <strong>Semester Freeze Approval Notification Order</strong> with distinct Memo No (<code>{freezeMemoNo}</code>) and formal Directorate & University signature blocks is instantly generated for printing and archival.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !selectedStudentId}
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>❄️</span>
                  <span>{saving ? "Processing Semester Freeze..." : "Confirm FREEZE & Issue Order"}</span>
                </button>

                {selectedStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      setFreezeStudent(selectedStudent);
                      setFreezeOrderDetails({
                        memoNo: freezeMemoNo,
                        issueDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
                        fromSem: freezeFromSem,
                        toSem: freezeToSem,
                        reason: freezeReason || "Medical Grounds",
                        session: freezeSession || selectedStudent.session || "2024-2028",
                        remarks: freezeRemarks || "Previewing order",
                      });
                      setShowFreezeModal(true);
                    }}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    title="Preview or print Freeze Order without submitting"
                  >
                    <span>👁️</span>
                    <span>Preview Order</span>
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      </div>

      {/* Freeze Students Directory & Instant Reprints */}
      {actionType === "FREEZE" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm print:hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h4 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <span>❄️ Saved Semester Freeze Records Directory</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold">
                {freezeSavedList.length} Students
              </span>
            </h4>
            <span className="text-xs text-gray-500">View or reprint official Semester Freeze Approval Notification Orders</span>
          </div>

          {freezeSavedList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs font-semibold">
              No students have frozen semesters yet. Use the form above to record a semester freeze with an official order.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b text-xs font-black text-gray-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">Memo / Order No</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Department & Session</th>
                    <th className="px-4 py-3">Freeze Period</th>
                    <th className="px-4 py-3">Reason & Date</th>
                    <th className="px-4 py-3 text-center">Current Status</th>
                    <th className="px-4 py-3 text-center">Actions & Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {freezeSavedList.map((rec) => {
                    const st = rec.student || rec;
                    const roll = st.rollNumber || rec.rollNumber;
                    const name = st.user?.name || st.name || rec.studentName || "Student";
                    const father = st.fatherName || "—";
                    const progName = st.program?.name || "BS";
                    const sess = st.session || "—";
                    const isFrozenNow = st.isActive === false;
                    let memo = generateFreezeMemoNo();
                    let fSem = "3";
                    let tSem = "4";
                    if (rec.notes) {
                      if (rec.notes.includes("Memo No: ")) {
                        const m = rec.notes.match(/Memo No:\s*([^•\.\n]+)/);
                        if (m) memo = m[1].trim();
                      }
                      if (rec.notes.includes("Freeze Duration: Sem ")) {
                        const m = rec.notes.match(/Freeze Duration: Sem\s*(\d+)\s*to\s*Sem\s*(\d+)/i);
                        if (m) {
                          fSem = m[1];
                          tSem = m[2];
                        }
                      }
                    }
                    const dateStr = rec.createdAt
                      ? new Date(rec.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

                    return (
                      <tr key={rec.id} className="hover:bg-cyan-50/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-xs text-cyan-900">{memo}</td>
                        <td className="px-4 py-3 font-mono font-bold text-xs text-gray-800">{roll}</td>
                        <td className="px-4 py-3 font-black text-gray-900">
                          <div>{name}</div>
                          <div className="text-[11px] font-normal text-gray-500">{father}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          <span className="font-bold">{progName}</span>
                          <div className="text-[11px] text-gray-500">{sess}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 font-bold text-[11px]">
                            Sem {fSem} → Sem {tSem}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="font-semibold text-gray-800">{rec.reason || "Medical Grounds"}</div>
                          <div className="text-[11px] font-mono text-gray-500">{dateStr}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isFrozenNow ? (
                            <span className="px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-900 font-black text-[10px] inline-flex items-center gap-1 border border-cyan-200">
                              <span>❄️</span>
                              <span>Frozen</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] inline-flex items-center gap-1 border border-emerald-200">
                              <span>✅</span>
                              <span>Active</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => openFreezeOrderForStudent(rec)}
                              className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                              title="Print / View Freeze Notification Order"
                            >
                              <span>🖨️</span>
                              <span>Freeze Order</span>
                            </button>
                            {isFrozenNow && (
                              <button
                                type="button"
                                onClick={() => handleUnfreezeStudent(st.id || rec.studentId, name)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                                title="Unfreeze and restore student to active enrollment"
                              >
                                <span>🔓</span>
                                <span>Unfreeze</span>
                              </button>
                            )}
                            {rec.id && !rec.id.startsWith("st-") && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStatusRecord(rec.id, name)}
                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Delete status record"
                              >
                                <span>🗑️</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quit / ADA / ADS Students Directory & Instant Reprints */}
      {actionType === "QUIT" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm print:hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h4 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <span>🎓 Saved Quit / ADA / ADS Records Directory</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                {quitSavedList.length} Students
              </span>
            </h4>
            <span className="text-xs text-gray-500">View or reprint issued ADA/ADS Minutes of Meeting reports & transcripts</span>
          </div>

          {quitSavedList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs font-semibold">
              No students have quit for ADA/ADS yet. Use the form above to record a 2-Year Quit / ADA-ADS exit.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b text-xs font-black text-gray-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">Memo No</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Department & Session</th>
                    <th className="px-4 py-3">Awarded Degree</th>
                    <th className="px-4 py-3">Exit Reason</th>
                    <th className="px-4 py-3 text-center">Issued Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quitSavedList.map((rec) => {
                    const st = rec.student || rec;
                    const roll = st.rollNumber || rec.rollNumber;
                    const name = st.user?.name || st.name || rec.studentName || "Student";
                    const father = st.fatherName || "—";
                    const progName = st.program?.name || "BS";
                    const sess = st.session || "—";
                    const isAda = rec.notes?.includes("Degree: ADA") || rec.notes?.includes("ADA") || false;
                    let memo = generateAdaMemoNo();
                    if (rec.notes && rec.notes.includes("Memo No: ")) {
                      const m = rec.notes.match(/Memo No:\s*([^•\.\n]+)/);
                      if (m) memo = m[1].trim();
                    }

                    return (
                      <tr key={rec.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-xs text-blue-900">{memo}</td>
                        <td className="px-4 py-3 font-mono font-bold text-xs text-gray-800">{roll}</td>
                        <td className="px-4 py-3 font-black text-gray-900">
                          <div>{name}</div>
                          <div className="text-[11px] font-normal text-gray-500">{father}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          <span className="font-bold">{progName}</span>
                          <div className="text-[11px] text-gray-500">{sess}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isAda ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                            }`}>
                            {isAda ? "ADA (Arts)" : "ADS (Science)"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="font-semibold text-gray-800">{rec.reason || "Compulsory Work"}</div>
                          <div className="text-[11px] font-mono text-gray-500">
                            {rec.notes ? rec.notes.slice(0, 45) + "..." : "Quit 2-Year Exit"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => openAdaMinutesForStudent(rec, "minutes")}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                              title="Print / View Minutes of Meeting Report"
                            >
                              <span>📜</span>
                              <span>Minutes Report</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openAdaMinutesForStudent(rec, "transcript")}
                              className="px-3 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                              title="Print / View Official Academic Transcript"
                            >
                              <span>🎓</span>
                              <span>Transcript</span>
                            </button>
                            {rec.id && !rec.id.startsWith("st-") && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStatusRecord(rec.id, name)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Delete status record"
                              >
                                <span>🗑️</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Migrated Students Directory & Instant Reprints */}
      {actionType === "MIGRATION" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm print:hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h4 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <span>📜 Saved Outward Migration Records Directory</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                {migrationSavedList.length} Students
              </span>
            </h4>
            <span className="text-xs text-gray-500">View or reprint issued NOC reports & official transcripts</span>
          </div>

          {migrationSavedList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs font-semibold">
              No students have been migrated yet. Use the form above to process a migration.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b text-xs font-black text-gray-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">NOC / Memo No</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Program & Sem</th>
                    <th className="px-4 py-3">Destination / NOC</th>
                    <th className="px-4 py-3 text-center">Issued Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {migrationSavedList.map((rec) => {
                    const st = rec.student || rec;
                    const roll = st.rollNumber || rec.rollNumber;
                    const name = st.user?.name || st.name || rec.studentName || "Student";
                    const father = st.fatherName || "—";
                    const progName = st.program?.name || "BS";
                    const sem = st.currentSemester || 1;
                    let memo = generateMigrationMemoNo();
                    let dest = rec.reason || "Destination Institution";
                    if (rec.notes) {
                      if (rec.notes.includes("Memo No: ")) {
                        const m = rec.notes.match(/Memo No:\s*([^•\.\n]+)/);
                        if (m) memo = m[1].trim();
                      } else if (rec.notes.includes("NOC No: ")) {
                        const parts = rec.notes.split("NOC No: ");
                        if (parts[1]) memo = parts[1].split(".")[0].trim();
                      }
                      if (rec.notes.includes("Destination: ")) {
                        const parts = rec.notes.split("Destination: ");
                        if (parts[1]) dest = parts[1].split(".")[0].trim();
                      }
                    }

                    return (
                      <tr key={rec.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-xs text-amber-900">{memo}</td>
                        <td className="px-4 py-3 font-mono font-bold text-xs text-gray-800">{roll}</td>
                        <td className="px-4 py-3 font-black text-gray-900">
                          <div>{name}</div>
                          <div className="text-[11px] font-normal text-gray-500">{father}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          <span className="font-bold">{progName}</span>
                          <span className="ml-1.5 px-2 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-600">
                            Sem {sem}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="font-semibold text-gray-800">{dest}</div>
                          <div className="text-[11px] font-mono text-gray-500">
                            {rec.notes ? rec.notes.slice(0, 45) + "..." : "NOC Issued"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => openDocumentsForStudent(rec, "report")}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                              title="Print / View Migration Report (NOC)"
                            >
                              <span>📜</span>
                              <span>Migration Report</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDocumentsForStudent(rec, "transcript")}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                              title="Print / View Official Academic Transcript"
                            >
                              <span>🎓</span>
                              <span>Transcript</span>
                            </button>
                            {rec.id && !rec.id.startsWith("st-") && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStatusRecord(rec.id, name)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Delete status record"
                              >
                                <span>🗑️</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DUAL DOCUMENT MODAL: MIGRATION REPORT (NOC) + OFFICIAL TRANSCRIPT */}
      {showDocModal && migratedStudent && (
        <div className="bs-active-print-modal fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto print:static print:inset-auto print:block print:w-full print:h-auto print:p-0 print:m-0 print:bg-white print:backdrop-blur-none print:overflow-visible">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-gray-200 print:max-w-none print:w-full print:max-h-none print:h-auto print:overflow-visible print:rounded-none print:border-none print:shadow-none">
            {/* Modal Top Control Header (Always hidden in Print) */}
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <span>🎓 Issued Migration Documents</span>
                  <span className="text-xs font-mono font-normal bg-slate-800 px-2 py-0.5 rounded text-blue-300">
                    {migratedStudent.rollNumber}
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  {migratedStudent.user?.name} — {migratedStudent.program?.name || "BS Degree"} (Semester {migratedStudent.currentSemester || 1})
                </p>
              </div>

              {/* Document Switcher Tabs */}
              <div className="flex items-center bg-slate-800 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setDocModalTab("report")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${docModalTab === "report"
                    ? "bg-amber-500 text-slate-950 font-black shadow"
                    : "text-slate-300 hover:text-white"
                    }`}
                >
                  📜 1. Migration Report / NOC
                </button>
                <button
                  type="button"
                  onClick={() => setDocModalTab("transcript")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${docModalTab === "transcript"
                    ? "bg-blue-600 text-white font-black shadow"
                    : "text-slate-300 hover:text-white"
                    }`}
                >
                  🎓 2. Official Academic Transcript
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Print {docModalTab === "report" ? "Migration Report" : "Transcript"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 print:p-0 print:overflow-visible print:bg-white">
              <div id="migration-print-container">
                {docModalTab === "report" ? (
                  /* Printable Migration Report / NOC */
                  <div className="bg-white border-2 border-slate-900 rounded-xl p-8 max-w-3xl mx-auto space-y-6 shadow-md print:shadow-none print:border-2 print:border-black print:rounded-none print:max-w-none print:w-full print:mx-0 print:m-0 print:p-6">
                    {/* Header */}
                    <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1.5">
                      {collegeLogo ? (
                        <img src={collegeLogo} alt="Logo" className="w-16 h-16 object-contain mx-auto" />
                      ) : (
                        <div className="text-3xl mx-auto">🏛️</div>
                      )}
                      <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-serif">
                        {collegeName}
                      </h1>
                      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">
                        {collegeAddress}
                      </p>
                      <div className="pt-2">
                        <span className="inline-block px-4 py-1.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded shadow-sm">
                          NO OBJECTION & RELIEVING CERTIFICATE (NOC) / MIGRATION REPORT
                        </span>
                      </div>
                    </div>

                    {/* Ref & Date */}
                    <div className="flex justify-between items-center text-xs font-mono font-bold text-gray-700 border-b pb-3">
                      <span>Ref / Certificate No: <strong className="text-slate-900 text-sm">{docDetails.relievingNo}</strong></span>
                      <span>Date: <strong className="text-slate-900">{docDetails.issueDate}</strong></span>
                    </div>

                    {/* Body */}
                    <div className="space-y-4 text-sm text-gray-800 leading-relaxed text-justify pt-2">
                      <p>
                        This is to certify that <strong>{migratedStudent.user?.name}</strong>, Son / Daughter of{" "}
                        <strong>{migratedStudent.fatherName || "—"}</strong>, holding Roll No{" "}
                        <strong className="font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300 text-slate-900">
                          {migratedStudent.rollNumber}
                        </strong>
                        {migratedStudent.registrationNo ? (
                          <> and Registration No <strong className="font-mono">{migratedStudent.registrationNo}</strong></>
                        ) : null}, was a bona fide regular student of this institution enrolled in the{" "}
                        <strong>{migratedStudent.program?.name || "BS Degree Program"}</strong> (Academic Session:{" "}
                        <strong>{migratedStudent.session || "2024-2028"}</strong>).
                      </p>

                      <p>
                        The student has successfully completed coursework and academic tenure up to{" "}
                        <strong>Semester {migratedStudent.currentSemester || 1}</strong> at this college. Upon formal application and fulfillment of institutional requirements, the candidate has been officially relieved from this institution on account of outward migration to:
                      </p>

                      <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-center font-black text-sm text-slate-900 tracking-wide uppercase">
                        🏛️ {docDetails.destinationCollege || "Destination Institution / University"}
                      </div>

                      <p>
                        The College Administration, Academic Council, and Examination Branch have{" "}
                        <strong>NO OBJECTION (NOC)</strong> to his/her admission or continuation of studies at the destination institution.
                      </p>

                      <p>
                        All institutional library books, laboratory apparatus, college hostel, and tuition fee dues have been{" "}
                        <strong className="text-green-700">FULLY SETTLED & CLEARED</strong> up to Semester{" "}
                        {migratedStudent.currentSemester || 1}.
                      </p>

                      <p>
                        During their academic tenure at this college, the student&apos;s moral character, discipline, and academic conduct remained{" "}
                        <strong>Satisfactory / Good</strong>. We wish the candidate success in their future academic endeavors.
                      </p>
                    </div>

                    {/* Signatures */}
                    <div className="pt-16 grid grid-cols-3 gap-6 text-center text-xs">
                      <div className="space-y-6">
                        <div className="border-b border-gray-400"></div>
                        <div className="font-bold text-gray-800">In-Charge Admissions</div>
                      </div>
                      <div className="space-y-6">
                        <div className="border-b border-gray-400"></div>
                        <div className="font-bold text-gray-800">Head of Department (HOD)</div>
                      </div>
                      <div className="space-y-6">
                        <div className="border-b border-gray-400"></div>
                        <div className="font-bold text-gray-800">Controller of Examinations / Principal</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Official Academic Transcript */
                  <div className="overflow-x-auto print:overflow-visible">
                    <OfficialTranscriptDocument
                      student={migratedStudent}
                      fromSemester={1}
                      toSemester={migratedStudent.currentSemester || 8}
                      collegeName={collegeName}
                      collegeLogo={collegeLogo}
                      collegeAddress={collegeAddress}
                      universityName={universityName}
                      issueDate={docDetails.issueDate}
                      serialNumber={docDetails.relievingNo}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADA / ADS MINUTES OF MEETING & TRANSCRIPT MODAL */}
      {showAdaModal && adaStudent && (
        <div className="bs-active-print-modal fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto print:static print:inset-auto print:block print:w-full print:h-auto print:p-0 print:m-0 print:bg-white print:backdrop-blur-none print:overflow-visible">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-gray-200 print:max-w-none print:w-full print:max-h-none print:h-auto print:overflow-visible print:rounded-none print:border-none print:shadow-none">
            {/* Modal Top Control Header (Always hidden in Print) */}
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <span>🎓 Award of Two Years Degree (ADA / ADS)</span>
                  <span className="text-xs font-mono font-normal bg-slate-800 px-2 py-0.5 rounded text-blue-300">
                    {adaStudent.rollNumber}
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  {adaStudent.user?.name || adaStudent.name} — {adaStudent.program?.name || "BS Program"} (Session: {adaStudent.session || "—"})
                </p>
              </div>

              {/* Tab Selector & Print Button */}
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setAdaModalTab("minutes")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${adaModalTab === "minutes"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white"
                      }`}
                  >
                    📜 1. Minutes of Meeting Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdaModalTab("transcript")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${adaModalTab === "transcript"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white"
                      }`}
                  >
                    🎓 2. Academic Transcript (Sem 1-4)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  title="Print this document or Save as PDF"
                >
                  <span>🖨️</span>
                  <span>Print {adaModalTab === "minutes" ? "Minutes Report" : "Transcript"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAdaModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  title="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body / Printable Document Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
              <div id="ada-print-container">
                {adaModalTab === "minutes" ? (
                  /* Printable Minutes of Meeting Report (Exact format of PDF) */
                  <div className="bg-white border-2 border-slate-900 rounded-xl p-8 sm:p-12 max-w-4xl mx-auto shadow-md print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full print:mx-0 print:m-0 print:p-0 font-serif text-black leading-normal">
                    {/* Top Logo / Emblem */}
                    <div className="text-center space-y-2 mb-6">
                      {collegeLogo ? (
                        <img src={collegeLogo} alt="Logo" className="w-20 h-20 object-contain mx-auto" />
                      ) : (
                        <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain mx-auto" onError={(e: any) => { e.target.style.display = 'none'; }} />
                      )}
                      <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-serif">
                        {collegeName || "GOVERNMENT POSTGRADUATE COLLEGE QUETTA"}
                      </h1>
                      <div className="pt-2">
                        <h2 className="text-base font-bold text-black font-serif uppercase tracking-normal underline underline-offset-4 decoration-1 inline-block">
                          MINUTES OF MEETING HELD ON REGARDING AWARD OF TWO YEARS DEGREE EQUILANT TO {adaDegreeType === "ADA" ? "ADA" : adaDegreeType === "ADS" ? "ADS" : "ADA/ADS"}
                        </h2>
                      </div>
                    </div>

                    {/* Memo / Dispatch Ref No & Date Bar */}
                    <div className="flex justify-between items-center text-xs font-mono font-bold text-black border-b border-black pb-2 mb-6">
                      <span>Ref / Memo No: <strong className="text-sm">{adaMemoNo}</strong></span>
                      <span>Date of Issue: <strong>{adaMeetingDate}</strong></span>
                    </div>

                    {/* Committee Narrative Paragraph */}
                    <p className="text-sm sm:text-base font-serif text-black leading-relaxed text-justify mb-8 indent-8">
                      The BS Examination committee meeting held on <strong className="font-bold">{adaMeetingDate}</strong> in the college conference hall regarding award of two years degree to the student who cannot continue his BS studies after completion of two years studies due to reasons specified in his application. The subject issue of the student is discussed in detail.
                    </p>

                    {/* Committee Decision Table */}
                    <table className="w-full border-collapse border border-black font-serif text-xs sm:text-sm text-black mb-12">
                      <thead>
                        <tr className="border border-black">
                          <th className="border border-black px-2 py-2.5 text-center w-12 font-bold align-middle">S. No</th>
                          <th className="border border-black px-3 py-2.5 text-left w-56 font-bold align-middle">Name and Detail of Student</th>
                          <th className="border border-black px-3 py-2.5 text-left font-bold align-middle">Remarks / Decision</th>
                          <th className="border border-black px-2 py-2.5 text-center w-20 font-bold align-middle">Credit Hours</th>
                          <th className="border border-black px-2 py-2.5 text-center w-16 font-bold align-middle">CGPA</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border border-black">
                          <td className="border border-black px-2 py-3 text-center align-middle font-bold">1</td>
                          <td className="border border-black px-3 py-3 align-top leading-relaxed">
                            <div className="font-bold text-black">{adaStudent.user?.name || adaStudent.name}</div>
                            <div className="text-black">S/O {adaStudent.fatherName || "—"}</div>
                            <div className="mt-1 text-black">Roll No. {adaStudent.rollNumber}</div>
                            <div className="text-black">Department : {adaStudent.program?.name || "BS Program"}</div>
                            <div className="text-black">Session.{adaStudent.session || "—"}</div>
                          </td>
                          <td className="border border-black px-3 py-3 align-top leading-relaxed text-justify text-black">
                            The students concerned has informed the committee that they cannot continue his BS studies after completion of two years studies due to {adaReason || "Compulsory Work"}. The Committee unanimously recommend award of two years degree to the concerned student due to tangible reason stipulated in their statement. The committee directed to the BS Coordinator to liaison with administration of {adaLiaisonUniv || universityName || "University of Baluchistan Quetta"} for award of two years degree to the concerned students.
                          </td>
                          <td className="border border-black px-2 py-3 text-center align-middle font-bold text-black">
                            {adaCreditHours}
                          </td>
                          <td className="border border-black px-2 py-3 text-center align-middle font-bold text-black">
                            {adaCgpa}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Signatures */}
                    <div className="pt-4 grid grid-cols-2 gap-y-10 gap-x-8 text-xs sm:text-sm font-serif text-black">
                      <div className="flex items-center">
                        <span>Head of Department _______________________</span>
                      </div>
                      <div className="flex items-center">
                        <span>Vice Principal ________________________________</span>
                      </div>
                      <div className="flex items-center">
                        <span>Controller ________________________________</span>
                      </div>
                      <div className="flex items-center">
                        <span>BS Coordinator _______________________________</span>
                      </div>
                    </div>

                    {/* Bottom Right Authority Sign-off */}
                    <div className="pt-10 flex justify-end font-serif">
                      <div className="text-right text-xs sm:text-sm font-bold text-black leading-snug">
                        <div>Principal,</div>
                        <div>{collegeName || "Govt. Postgraduate College"},</div>
                        <div>{collegeAddress || "Sariab Road, Quetta."}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Official Academic Transcript up to Semester 4 */
                  <div className="overflow-x-auto print:overflow-visible">
                    <OfficialTranscriptDocument
                      student={adaStudent}
                      fromSemester={1}
                      toSemester={4}
                      collegeName={collegeName}
                      collegeLogo={collegeLogo}
                      collegeAddress={collegeAddress}
                      universityName={universityName}
                      issueDate={adaMeetingDate}
                      serialNumber={`ADA-${adaStudent.rollNumber.replace(/[^a-zA-Z0-9]/g, "")}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FREEZE APPROVAL NOTIFICATION ORDER MODAL */}
      {showFreezeModal && freezeStudent && (
        <div className="bs-active-print-modal fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto print:static print:inset-auto print:block print:w-full print:h-auto print:p-0 print:m-0 print:bg-white print:backdrop-blur-none print:overflow-visible">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-gray-200 print:max-w-none print:w-full print:max-h-none print:h-auto print:overflow-visible print:rounded-none print:border-none print:shadow-none">
            {/* Modal Top Control Header (Always hidden in Print) */}
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <span>❄️ Semester Freeze Notification Order</span>
                  <span className="text-xs font-mono font-normal bg-slate-800 px-2 py-0.5 rounded text-cyan-300">
                    {freezeStudent.rollNumber}
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  {freezeStudent.user?.name || freezeStudent.name} — {freezeStudent.program?.name || "BS Program"} (Session: {freezeOrderDetails.session})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                  title="Print this notification order or Save as PDF"
                >
                  <span>🖨️</span>
                  <span>Print Freeze Notification Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFreezeModal(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Modal Body / Printable Document Container */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
              <div id="freeze-print-container">
                <div className="bg-white border-2 border-slate-900 rounded-xl p-8 sm:p-12 max-w-3xl mx-auto space-y-6 shadow-md print:shadow-none print:border-2 print:border-black print:rounded-none print:max-w-none print:w-full print:mx-0 print:m-0 print:p-6 font-serif text-slate-900">
                  {/* College Official Letterhead */}
                  <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
                    {collegeLogo ? (
                      <img src={collegeLogo} alt="Logo" className="w-16 h-16 object-contain mx-auto" />
                    ) : (
                      <div className="text-3xl mx-auto">🏛️</div>
                    )}
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-serif">
                      {collegeName || "GOVT. POST GRADUATE COLLEGE QUETTA"}
                    </h1>
                    <p className="text-xs text-gray-700 font-semibold uppercase tracking-wider">
                      {collegeAddress || "Sariab Road, Quetta, Balochistan"}
                    </p>
                    <p className="text-[11px] text-gray-600 font-medium">
                      Directorate of Colleges & Higher Education • Government of Balochistan
                    </p>
                    <div className="pt-2">
                      <span className="inline-block px-4 py-1.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded shadow-sm">
                        OFFICIAL NOTIFICATION / ORDER: SEMESTER FREEZE
                      </span>
                    </div>
                  </div>

                  {/* Ref / Memo & Date Bar */}
                  <div className="flex justify-between items-center text-xs font-mono font-bold text-gray-800 border-b pb-3">
                    <span>
                      Ref / Memo No: <strong className="text-slate-900 text-sm font-black">{freezeOrderDetails.memoNo}</strong>
                    </span>
                    <span>
                      Dated: <strong className="text-slate-900">{freezeOrderDetails.issueDate}</strong>
                    </span>
                  </div>

                  {/* Subject */}
                  <div className="bg-slate-50 border border-slate-300 p-2.5 rounded text-xs font-bold uppercase tracking-wide text-slate-900">
                    SUBJECT: SANCTION OF SEMESTER FREEZE UNDER 4-YEAR BS REGULATIONS
                  </div>

                  {/* Formal Narrative */}
                  <div className="space-y-4 text-sm text-gray-800 leading-relaxed text-justify pt-1 font-serif">
                    <p>
                      In exercise of the powers conferred under the Semester Regulations governing the 4-Year Bachelor of Studies (BS) degree programs in Affiliated Colleges of Balochistan, and upon the formal application submitted by the student and recommendation of the Departmental Academic Committee, sanction is hereby accorded to freeze the academic semester of the following regular student:
                    </p>

                    {/* Student Particulars Table */}
                    <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm font-serif my-3">
                      <tbody>
                        <tr className="border-b border-slate-300">
                          <td className="w-44 bg-slate-100 font-bold p-2 border-r border-slate-300">Student Name:</td>
                          <td className="p-2 font-bold text-slate-900">{freezeStudent.user?.name || freezeStudent.name}</td>
                          <td className="w-36 bg-slate-100 font-bold p-2 border-r border-l border-slate-300">Father&apos;s Name:</td>
                          <td className="p-2">{freezeStudent.fatherName || "—"}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <td className="bg-slate-100 font-bold p-2 border-r border-slate-300">Roll Number:</td>
                          <td className="p-2 font-mono font-bold">{freezeStudent.rollNumber}</td>
                          <td className="bg-slate-100 font-bold p-2 border-r border-l border-slate-300">Registration No:</td>
                          <td className="p-2 font-mono">{freezeStudent.registrationNo || "—"}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <td className="bg-slate-100 font-bold p-2 border-r border-slate-300">Degree Program:</td>
                          <td className="p-2 font-bold">{freezeStudent.program?.name || "BS Degree Program"}</td>
                          <td className="bg-slate-100 font-bold p-2 border-r border-l border-slate-300">Academic Session:</td>
                          <td className="p-2">{freezeOrderDetails.session || freezeStudent.session || "2024-2028"}</td>
                        </tr>
                        <tr>
                          <td className="bg-slate-100 font-bold p-2 border-r border-slate-300">Frozen Duration:</td>
                          <td className="p-2 font-bold text-cyan-900" colSpan={3}>
                            From Semester {freezeOrderDetails.fromSem} to Semester {freezeOrderDetails.toSem} (Resumption in Sem {freezeOrderDetails.toSem})
                          </td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <td className="bg-slate-100 font-bold p-2 border-r border-slate-300">Sanctioned Reason:</td>
                          <td className="p-2 italic text-gray-700" colSpan={3}>
                            {freezeOrderDetails.reason || "Medical / Domestic Grounds"}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Terms & Regulations */}
                    <div className="space-y-2 pt-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 underline">
                        Terms & Institutional Regulations of Semester Freeze:
                      </h4>
                      <ol className="list-decimal pl-5 space-y-1 text-xs text-gray-700 leading-normal">
                        <li>
                          <strong>Maximum Allowable Duration:</strong> Semester freeze is permitted for a maximum limit of two (02) semesters across the entire 4-Year BS degree. Freezing beyond the approved period without prior authorization shall lead to automatic cancellation of enrollment.
                        </li>
                        <li>
                          <strong>Resumption with Junior Batch:</strong> The student must resume coursework in <strong>Semester {freezeOrderDetails.toSem}</strong> with the immediate succeeding/junior academic batch, subject to seat availability, formal re-admission application, and payment of prescribed readmission dues.
                        </li>
                        <li>
                          <strong>Curricular Scheme:</strong> The student shall be bound to follow the syllabus, scheme of study, and academic calendar in vogue for the batch they join upon resumption.
                        </li>
                        <li>
                          <strong>Campus Privileges Suspension:</strong> Regular attendance, hostel accommodation, and college bus transport privileges remain suspended during the freeze period.
                        </li>
                        <li>
                          <strong>Financial Clearance:</strong> All institutional dues up to the frozen semester have been verified and settled in full.
                        </li>
                      </ol>
                    </div>

                    {freezeOrderDetails.remarks && (
                      <div className="p-2.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-700 italic">
                        <strong>Institutional Remarks:</strong> {freezeOrderDetails.remarks}
                      </div>
                    )}
                  </div>

                  {/* Formal 4-Column Signature Block */}
                  <div className="pt-12 grid grid-cols-4 gap-4 text-center text-xs font-serif text-slate-900">
                    <div className="space-y-4">
                      <div className="border-b border-slate-500 pt-6"></div>
                      <div className="font-bold">In-Charge Admissions</div>
                    </div>
                    <div className="space-y-4">
                      <div className="border-b border-slate-500 pt-6"></div>
                      <div className="font-bold">Head of Department (HOD)</div>
                    </div>
                    <div className="space-y-4">
                      <div className="border-b border-slate-500 pt-6"></div>
                      <div className="font-bold">BS Coordinator / Controller</div>
                    </div>
                    <div className="space-y-4">
                      <div className="border-b border-slate-500 pt-6"></div>
                      <div className="font-bold">Principal (Official Seal)</div>
                    </div>
                  </div>

                  {/* Dispatch Distribution (Copy Forwarded to) */}
                  <div className="pt-4 border-t border-slate-300 text-[10px] text-gray-600 font-serif space-y-1">
                    <div className="font-bold uppercase tracking-wider text-slate-800">Copy forwarded for information & record to:</div>
                    <div className="grid grid-cols-2 gap-x-4">
                      <div>1. The Director of Higher Education, Balochistan, Quetta.</div>
                      <div>2. The Controller of Examinations, University of Balochistan.</div>
                      <div>3. BS Academic Coordinator & In-Charge Examination Branch.</div>
                      <div>4. Accounts Branch & Student Personal Dossier File.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
