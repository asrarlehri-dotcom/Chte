"use client";

import { useState, useEffect } from "react";
import {
  getFilterData,
  getTimetables,
  generateTimetable,
  saveManualTimetable,
  publishTimetable,
  deleteTimetableEntry,
  getDatesheets,
  generateDatesheet,
  saveManualDatesheet,
  publishDatesheet,
  deleteDatesheetEntry,
  finalizeTimetable,
  unfinalizeTimetable,
  finalizeDatesheet,
  unfinalizeDatesheet,
  getDuties,
  generateDutiesAction,
  saveManualDuty,
  deleteDutyEntry,
} from "./actions";
import { useSettings } from "@/lib/useSettings";

const SELECT_CLS =
  "w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-2xs transition-all";

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function BSTimetableDatesheetPage() {
  const { collegeName, collegeLogo, collegeTagline, collegeBackground, collegeWatermark } = useSettings();
  const [activeTab, setActiveTab] = useState("timetable");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);

  // ── TIMETABLE filters
  const [tSession, setTSession] = useState("ALL");
  const [tProgramId, setTProgramId] = useState("ALL");
  const [tDepartmentId, setTDepartmentId] = useState("ALL");
  const [tSemester, setTSemester] = useState("0");
  const [timetables, setTimetables] = useState<any[]>([]);

  // ── DATESHEET filters & Exam Start Date
  const [dSession, setDSession] = useState("ALL");
  const [dProgramId, setDProgramId] = useState("ALL");
  const [dDepartmentId, setDDepartmentId] = useState("ALL");
  const [dSemester, setDSemester] = useState("0");
  const [dExamType, setDExamType] = useState("ALL");
  const [examStartDate, setExamStartDate] = useState("2026-06-01");
  const [excludedDatesInput, setExcludedDatesInput] = useState("");
  const [datesheets, setDatesheets] = useState<any[]>([]);

  // ── DUTY LIST — DB-backed (new Exam Duty tab)
  const [dbDuties, setDbDuties] = useState<any[]>([]);
  const [dutySession, setDutySession] = useState("ALL");
  const [dutyProgramId, setDutyProgramId] = useState("ALL");
  const [dutySemester, setDutySemester] = useState("0");
  const [dutyExamType, setDutyExamType] = useState("ALL");
  const [maxInvigilatorsPerPaper, setMaxInvigilatorsPerPaper] = useState(2);
  const [generatingDuties, setGeneratingDuties] = useState(false);
  const [dutyWarnings, setDutyWarnings] = useState<string[]>([]);

  // ── Legacy duties (used by old Superintendent + Staff Duty tabs)
  const [duties, setDuties] = useState<any[]>([]);


  // Finalization status (computed from timetable/datesheet data)
  const [timetableFinalized, setTimetableFinalized] = useState(false);
  const [datesheetFinalized, setDatesheetFinalized] = useState(false);

  // Manual Duty Modal
  const [showManualDutyModal, setShowManualDutyModal] = useState(false);
  const [dutyFacultyId, setDutyFacultyId] = useState("");
  const [dutyDatesheetId, setDutyDatesheetId] = useState("");
  const [dutyType, setDutyType] = useState("INVIGILATOR");
  const [dutyRoom, setDutyRoom] = useState("");
  const [editingDuty, setEditingDuty] = useState<any>(null);

  // ── SUPERINTENDENT PARAMETERS
  const [superintendentName, setSuperintendentName] = useState("Dr. Muhammad Usman");
  const [superintendentDesignation, setSuperintendentDesignation] = useState("Chief Superintendent / HOD");
  const [superintendentDepartment, setSuperintendentDepartment] = useState("Computer Science");
  const [deputySuperintendent, setDeputySuperintendent] = useState("Prof. Shahida Kakar (Deputy Superintendent)");
  const [examHallName, setExamHallName] = useState("Main Auditorium - Examination Hall A");
  const [isHallMerged, setIsHallMerged] = useState(true);
  const [selectedMergedPrograms, setSelectedMergedPrograms] = useState<string[]>([]);

  // Multi-selection options for Superintendent
  const [selectedSuptSessions, setSelectedSuptSessions] = useState<string[]>(["2024", "2025"]);
  const [selectedSuptSemesters, setSelectedSuptSemesters] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);
  const [selectedSuptPrograms, setSelectedSuptPrograms] = useState<string[]>([]);

  // ── MANUAL MODALS
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<any>(null);
  const [ttProgramIdModal, setTtProgramIdModal] = useState("");
  const [ttSessionModal, setTtSessionModal] = useState("2024");
  const [ttSemesterModal, setTtSemesterModal] = useState("1");
  const [ttDay, setTtDay] = useState("Monday");
  const [ttStart, setTtStart] = useState("09:00");
  const [ttEnd, setTtEnd] = useState("10:00");
  const [ttCourseId, setTtCourseId] = useState("");
  const [ttFacultyId, setTtFacultyId] = useState("");

  const [showDatesheetModal, setShowDatesheetModal] = useState(false);
  const [editingDatesheet, setEditingDatesheet] = useState<any>(null);
  const [dsProgramIdModal, setDsProgramIdModal] = useState("");
  const [dsSessionModal, setDsSessionModal] = useState("2024");
  const [dsSemesterModal, setDsSemesterModal] = useState("1");
  const [dsExamTypeModal, setDsExamTypeModal] = useState("TERMINAL");
  const [dsDate, setDsDate] = useState("2026-06-04");
  const [dsStart, setDsStart] = useState("09:00");
  const [dsEnd, setDsEnd] = useState("12:00");
  const [dsCourseId, setDsCourseId] = useState("");

  // ── MANUAL DUTIES & SUPERINTENDENT STATE
  const [dutyFilterMode, setDutyFilterMode] = useState<"ALL" | "AUTO" | "MANUAL">("ALL");
  const [suptFilterMode, setSuptFilterMode] = useState<"ALL" | "AUTO" | "MANUAL">("ALL");
  const [maxDutiesPerInvigilator, setMaxDutiesPerInvigilator] = useState<number>(3);

  const [manualDuties, setManualDuties] = useState<any[]>([]);
  const [manualSuptEntries, setManualSuptEntries] = useState<any[]>([]);

  // Time overlap helper function
  const isTimeOverlap = (timeStr1: string, timeStr2: string) => {
    if (!timeStr1 || !timeStr2) return false;
    if (timeStr1 === timeStr2) return true;
    const parseRange = (s: string) => {
      const parts = s.split("-").map(p => p.trim());
      if (parts.length < 2) return { start: s, end: s };
      return { start: parts[0], end: parts[1] };
    };
    const r1 = parseRange(timeStr1);
    const r2 = parseRange(timeStr2);
    return r1.start < r2.end && r1.end > r2.start;
  };

  // Staff Duty Modal
  const [showStaffDutyModal, setShowStaffDutyModal] = useState(false);
  const [editingStaffDuty, setEditingStaffDuty] = useState<any>(null);
  const [dutyForm, setDutyForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "09:00 - 12:00",
    course: "",
    courseCode: "",
    invigilator: "",
    superintendent: "Dr. Muhammad Usman (Chief Superintendent / HOD)",
    hall: "Main Auditorium",
    status: "ASSIGNED"
  });

  // Superintendent Modal
  const [showSuptModal, setShowSuptModal] = useState(false);
  const [editingSuptEntry, setEditingSuptEntry] = useState<any>(null);
  const [suptForm, setSuptForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "09:00 - 12:00",
    course: "",
    hall: "Main Auditorium",
    programName: "BS Programs",
    chief: "Dr. Muhammad Usman",
    designation: "Chief Superintendent / HOD",
    department: "Computer Science",
    deputy: "Prof. Shahida Kakar (Deputy Superintendent)",
    sessions: ["2024", "2025"] as string[],
    semesters: [1, 2, 3, 4, 5, 6, 7, 8] as number[],
    programs: [] as string[]
  });

  useEffect(() => {
    try {
      const savedMD = localStorage.getItem("manual_staff_duties");
      if (savedMD) setManualDuties(JSON.parse(savedMD));
      const savedMS = localStorage.getItem("manual_supt_entries");
      if (savedMS) setManualSuptEntries(JSON.parse(savedMS));
      const savedLimit = localStorage.getItem("max_invigilation_duties");
      if (savedLimit) setMaxDutiesPerInvigilator(parseInt(savedLimit));
    } catch (e) {}

    getFilterData().then((data) => {
      const bsProgs = data.programs.filter((p: any) => p.educationLevel === "BS");
      setAllPrograms(bsProgs);
      setDepartments(data.departments);
      setFaculties(data.faculties);
      if (bsProgs.length > 0) {
        setTtProgramIdModal(bsProgs[0].id);
        setDsProgramIdModal(bsProgs[0].id);
        setSelectedMergedPrograms(bsProgs.map(p => p.name));
      }
    });

    fetch("/api/courses")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCourses(data);
      })
      .catch(() => {});

    fetch("/api/settings")
      .then(res => res.json())
      .then(async data => {
        const { filterValidSessions, DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        if (data.ACADEMIC_SESSIONS) {
          setSessions(filterValidSessions(data.ACADEMIC_SESSIONS));
        } else {
          setSessions(DEFAULT_ALL_SESSIONS);
        }
      })
      .catch(async () => {
        const { DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        setSessions(DEFAULT_ALL_SESSIONS);
      });
  }, []);

  // Fetch Timetables
  const loadTimetable = async () => {
    setLoading(true);
    const data = await getTimetables(
      tSession,
      tProgramId,
      parseInt(tSemester),
      tDepartmentId
    );
    const filtered = data.filter((t: any) => t.program?.educationLevel === "BS");
    setTimetables(filtered);
    // Update finalization status
    setTimetableFinalized(filtered.length > 0 && filtered.every((t: any) => t.isFinalized));
    setLoading(false);
  };

  useEffect(() => {
    loadTimetable();
  }, [tProgramId, tSemester, tDepartmentId, tSession]);

  const handleAutoGenerateTimetable = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await generateTimetable(
      tSession,
      tProgramId,
      tDepartmentId,
      parseInt(tSemester),
      "BS"
    );
    if (res.errors && res.errors.length > 0) {
      setError(res.errors.join(" | "));
    } else {
      setSuccess(`BS Class Timetables generated successfully! (${res.count || 0} class slots created, Sundays excluded)`);
    }
    await loadTimetable();
    setLoading(false);
  };

  const handleSaveManualTT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttCourseId || !ttFacultyId) return alert("Please select both Course and Faculty.");
    const res = await saveManualTimetable({
      id: editingTimetable?.id,
      session: ttSessionModal || "2024",
      programId: ttProgramIdModal || (allPrograms[0]?.id || ""),
      departmentId: tDepartmentId !== "ALL" ? tDepartmentId : null,
      semester: ttSemesterModal || "1",
      courseId: ttCourseId,
      facultyId: ttFacultyId,
      dayOfWeek: ttDay,
      startTime: ttStart,
      endTime: ttEnd,
    });
    if (res.success) {
      setSuccess("Timetable entry saved!");
      setShowTimetableModal(false);
      setEditingTimetable(null);
      loadTimetable();
    } else {
      setError(res.error || "Failed to save timetable entry");
    }
  };

  const handlePublishTimetable = async () => {
    await publishTimetable(tSession, tProgramId, parseInt(tSemester));
    setSuccess("Timetables published successfully!");
    await loadTimetable();
  };

  const handleFinalizeTimetable = async () => {
    if (!confirm("Finalize this timetable? Once finalized, it becomes the source of truth for Date Sheet generation.")) return;
    setLoading(true);
    const res = await finalizeTimetable(tSession, tProgramId, parseInt(tSemester));
    if (res.success) {
      setSuccess(`✅ Timetable FINALIZED (${res.count} entries). You can now generate the Date Sheet.`);
    } else {
      setError(res.error || "Finalization failed");
    }
    await loadTimetable();
    setLoading(false);
  };

  const handleUnfinalizeTimetable = async () => {
    if (!confirm("Un-finalize this timetable? This will allow changes but block datesheet generation.")) return;
    const res = await unfinalizeTimetable(tSession, tProgramId, parseInt(tSemester));
    if (res.success) {
      setSuccess("Timetable un-finalized.");
    } else {
      setError(res.error || "Un-finalization failed");
    }
    await loadTimetable();
  };

  // Fetch Datesheets
  const loadDatesheet = async () => {
    setLoading(true);
    const data = await getDatesheets(
      dSession,
      dProgramId,
      parseInt(dSemester),
      dExamType,
      dDepartmentId
    );
    const filtered = data.filter((d: any) => d.program?.educationLevel === "BS");
    setDatesheets(filtered);
    // Update finalization status
    setDatesheetFinalized(filtered.length > 0 && filtered.every((d: any) => d.isFinalized));
    setLoading(false);
  };

  // Fetch DB-backed Duties
  const loadDuties = async () => {
    const data = await getDuties(dutySession, dutyProgramId, parseInt(dutySemester), dutyExamType);
    setDbDuties(data);
  };

  useEffect(() => {
    loadDatesheet();
  }, [dProgramId, dSemester, dExamType, dDepartmentId, dSession]);


  const handleAutoGenerateDatesheet = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await generateDatesheet(
      dSession,
      dProgramId,
      dDepartmentId,
      parseInt(dSemester),
      dExamType,
      dSession !== "ALL" ? dSession : "2024",
      "BS",
      excludedDatesInput,
      examStartDate
    );
    if (res.errors && res.errors.length > 0) {
      setError(res.errors.join(" | "));
    } else {
      setSuccess(`BS Date Sheets & Duty Roster generated successfully starting from ${examStartDate}! (${res.count || 0} exam papers scheduled)`);
    }
    await loadDatesheet();
    setLoading(false);
  };

  const handleSaveManualDS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dsCourseId) return alert("Please select a Course.");
    const res = await saveManualDatesheet({
      id: editingDatesheet?.id,
      session: dsSessionModal || "2024",
      programId: dsProgramIdModal || (allPrograms[0]?.id || ""),
      departmentId: dDepartmentId !== "ALL" ? dDepartmentId : null,
      semester: dsSemesterModal || "1",
      examType: dsExamTypeModal || "TERMINAL",
      courseId: dsCourseId,
      date: dsDate,
      startTime: dsStart,
      endTime: dsEnd,
    });
    if (res.success) {
      setSuccess("Datesheet entry saved!");
      setShowDatesheetModal(false);
      setEditingDatesheet(null);
      loadDatesheet();
    } else {
      setError(res.error || "Failed to save datesheet entry");
    }
  };

  const handlePublishDatesheet = async () => {
    await publishDatesheet(dSession, dProgramId, parseInt(dSemester), dExamType);
    setSuccess("Date Sheets published successfully!");
    await loadDatesheet();
  };

  const handleFinalizeDatesheet = async () => {
    if (!confirm("Finalize this Date Sheet? Once finalized, it becomes the official exam schedule and unlocks Duty assignment and Result entry.")) return;
    setLoading(true);
    const res = await finalizeDatesheet(dSession, dProgramId, parseInt(dSemester), dExamType);
    if (res.success) {
      setSuccess(`✅ Date Sheet FINALIZED (${res.count} entries). Exam Duty and Result Entry are now unlocked.`);
    } else {
      setError(res.error || "Finalization failed");
    }
    await loadDatesheet();
    setLoading(false);
  };

  const handleUnfinalizeDatesheet = async () => {
    if (!confirm("Un-finalize this Date Sheet? Duty assignments and result entry will be locked again.")) return;
    const res = await unfinalizeDatesheet(dSession, dProgramId, parseInt(dSemester), dExamType);
    if (res.success) {
      setSuccess("Date Sheet un-finalized.");
    } else {
      setError(res.error || "Un-finalization failed");
    }
    await loadDatesheet();
  };

  const handleGenerateDuties = async () => {
    if (!confirm("Generate Exam Duties? This will auto-assign mandatory duties (course faculty) and fill remaining invigilator slots from eligible faculty.")) return;
    setGeneratingDuties(true);
    setDutyWarnings([]);
    const res = await generateDutiesAction(
      dutyProgramId,
      dutySession,
      parseInt(dutySemester),
      dutyExamType,
      maxInvigilatorsPerPaper
    );
    if (res.success) {
      setSuccess(`✅ Duties generated: ${res.created} assignments created.`);
      if (res.warnings && res.warnings.length > 0) setDutyWarnings(res.warnings);
    } else {
      setError((res as any).error || "Duty generation failed");
    }
    await loadDuties();
    setGeneratingDuties(false);
  };

  const handleDeleteDuty = async (id: string) => {
    if (!confirm("Remove this duty assignment?")) return;
    await deleteDutyEntry(id);
    await loadDuties();
    setSuccess("Duty removed.");
  };

  // Manual Duty Handler with Conflict Check & Duty Limit Enforcement
  const handleSaveStaffDuty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyForm.course || !dutyForm.invigilator) return alert("Please enter Course and Invigilator name.");

    const targetDateStr = new Date(dutyForm.date).toISOString().split('T')[0];

    // 1. Conflict Check: Check if Invigilator is ALREADY assigned to an overlapping duty
    const existingConflict = allDutiesList.find(d => {
      if (editingStaffDuty && d.id === editingStaffDuty.id) return false;
      const dDateStr = new Date(d.date).toISOString().split('T')[0];
      if (d.invigilator === dutyForm.invigilator && dDateStr === targetDateStr && isTimeOverlap(d.time, dutyForm.time)) {
        return true;
      }
      return false;
    });

    if (existingConflict) {
      return alert(
        `❌ Invigilator Time Conflict!\n\n${dutyForm.invigilator} is ALREADY assigned to an invigilation duty in "${existingConflict.hall}" under "${existingConflict.superintendent || superintendentName}" on ${targetDateStr} (${existingConflict.time}).\n\nDouble-booking an invigilator across halls or superintendents at the same time is strictly not allowed.`
      );
    }

    // 2. Max Duty Limit Check
    const currentDutiesCount = allDutiesList.filter(d => {
      if (editingStaffDuty && d.id === editingStaffDuty.id) return false;
      return d.invigilator === dutyForm.invigilator;
    }).length;

    if (currentDutiesCount >= maxDutiesPerInvigilator) {
      const proceed = confirm(
        `⚠️ Duty Limit Reached!\n\n${dutyForm.invigilator} already has ${currentDutiesCount} duty slot(s) assigned (Configured max limit is ${maxDutiesPerInvigilator}).\n\nDo you want to override and assign this extra duty anyway?`
      );
      if (!proceed) return;
    }

    if (editingStaffDuty) {
      if (editingStaffDuty.isManual) {
        const updated = manualDuties.map(d => d.id === editingStaffDuty.id ? { ...d, ...dutyForm } : d);
        setManualDuties(updated);
        try { localStorage.setItem("manual_staff_duties", JSON.stringify(updated)); } catch(e){}
      } else {
        const updated = duties.map(d => d.id === editingStaffDuty.id ? { ...d, ...dutyForm } : d);
        setDuties(updated);
      }
    } else {
      const newEntry = {
        id: `manual_duty_${Date.now()}`,
        ...dutyForm,
        isManual: true
      };
      const updated = [newEntry, ...manualDuties];
      setManualDuties(updated);
      try { localStorage.setItem("manual_staff_duties", JSON.stringify(updated)); } catch(e){}
    }
    setShowStaffDutyModal(false);
    setEditingStaffDuty(null);
    setSuccess("Invigilation duty entry saved successfully!");
  };

  const handleDeleteStaffDuty = (duty: any) => {
    if (duty.isManual) {
      const updated = manualDuties.filter(d => d.id !== duty.id);
      setManualDuties(updated);
      try { localStorage.setItem("manual_staff_duties", JSON.stringify(updated)); } catch(e){}
    } else {
      setDuties(duties.filter(d => d.id !== duty.id));
    }
    setSuccess("Invigilation duty entry removed!");
  };

  const handleSaveSuptEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suptForm.course || !suptForm.hall) return alert("Please enter Exam Subject and Hall name.");

    if (editingSuptEntry) {
      if (editingSuptEntry.isManual) {
        const updated = manualSuptEntries.map(s => s.id === editingSuptEntry.id ? { ...s, ...suptForm } : s);
        setManualSuptEntries(updated);
        try { localStorage.setItem("manual_supt_entries", JSON.stringify(updated)); } catch(e){}
      } else {
        const newManual = {
          id: editingSuptEntry.id,
          ...suptForm,
          isManual: true
        };
        const updated = [newManual, ...manualSuptEntries];
        setManualSuptEntries(updated);
        try { localStorage.setItem("manual_supt_entries", JSON.stringify(updated)); } catch(e){}
      }
    } else {
      const newEntry = {
        id: `manual_supt_${Date.now()}`,
        ...suptForm,
        isManual: true
      };
      const updated = [newEntry, ...manualSuptEntries];
      setManualSuptEntries(updated);
      try { localStorage.setItem("manual_supt_entries", JSON.stringify(updated)); } catch(e){}
    }
    setShowSuptModal(false);
    setEditingSuptEntry(null);
    setSuccess("Superintendent roster entry saved!");
  };

  const handleDeleteSuptEntry = (entry: any) => {
    if (entry.isManual) {
      const updated = manualSuptEntries.filter(s => s.id !== entry.id);
      setManualSuptEntries(updated);
      try { localStorage.setItem("manual_supt_entries", JSON.stringify(updated)); } catch(e){}
    } else {
      setDuties(duties.filter(d => `auto_supt_${d.id}` !== entry.id));
    }
    setSuccess("Superintendent roster entry removed!");
  };

  // Computed display lists
  const allDutiesList = [...manualDuties, ...duties];
  const displayDuties = allDutiesList.filter((d: any) => {
    if (dutyFilterMode === "AUTO") return !d.isManual;
    if (dutyFilterMode === "MANUAL") return Boolean(d.isManual);
    return true;
  });

  const autoSuptList = duties.map((d: any) => ({
    id: `auto_supt_${d.id}`,
    date: d.date,
    time: d.time,
    course: `${d.course} (${d.courseCode})`,
    hall: d.hall,
    programName: isHallMerged ? selectedMergedPrograms.join(" + ") : d.programName,
    chief: superintendentName,
    deputy: deputySuperintendent,
    isManual: false
  }));

  const allSuptList = [...manualSuptEntries, ...autoSuptList];
  const displaySuptList = allSuptList.filter((s: any) => {
    if (suptFilterMode === "AUTO") return !s.isManual;
    if (suptFilterMode === "MANUAL") return Boolean(s.isManual);
    return true;
  });

  // CSV EXPORTERS
  const exportTimetableCSV = () => {
    const headers = ["Day", "Time Slot", "Course Title", "Course Code", "Faculty Name", "Program", "Semester", "Session", "Status"];
    const rows = timetables.map(t => [
      t.dayOfWeek,
      `${t.startTime} - ${t.endTime}`,
      t.course?.title || "",
      t.course?.code || "",
      t.faculty?.user?.name || "TBA",
      t.program?.name || "",
      `Sem ${t.semester}`,
      t.session,
      t.status
    ]);
    downloadCSV("Class_Timetable.csv", headers, rows);
  };

  const exportDatesheetCSV = () => {
    const headers = ["Exam Date", "Time Slot", "Course Title", "Course Code", "Program", "Semester", "Session", "Exam Type", "Status"];
    const rows = datesheets.map(d => [
      new Date(d.date).toISOString().split('T')[0],
      `${d.startTime} - ${d.endTime}`,
      d.course?.title || "",
      d.course?.code || "",
      d.program?.name || "",
      `Sem ${d.semester}`,
      d.session,
      d.examType,
      d.status
    ]);
    downloadCSV("Exam_Datesheet.csv", headers, rows);
  };

  const exportDutyListCSV = () => {
    const headers = ["Exam Date", "Time Slot", "Course Title", "Assigned Invigilator", "Exam Hall", "Chief Superintendent", "Deputy Superintendent", "Status"];
    const rows = duties.map(d => [
      new Date(d.date).toISOString().split('T')[0],
      d.time,
      d.course,
      d.invigilator,
      d.hall,
      superintendentName,
      deputySuperintendent,
      d.status
    ]);
    downloadCSV("Invigilation_Duty_Roster.csv", headers, rows);
  };

  const exportSuperintendentCSV = () => {
    const headers = ["Chief Superintendent", "Deputy Superintendent", "Exam Center / Hall", "Merged Programs", "Exam Date", "Shift Window", "Course Exam Paper"];
    const rows = duties.map(d => [
      superintendentName,
      deputySuperintendent,
      d.hall,
      isHallMerged ? selectedMergedPrograms.join(" + ") : d.programName,
      new Date(d.date).toISOString().split('T')[0],
      d.time,
      d.course
    ]);
    downloadCSV("Superintendent_Duty_Allocation.csv", headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#0d4a22] text-white flex items-center justify-center text-2xl shadow-sm border-2 border-emerald-500/30 shrink-0 overflow-hidden bg-white">
            {collegeLogo ? (
              <img src={collegeLogo} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <span>📅</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-serif font-black text-[#073619] tracking-tight">
                Timetable &amp; Datesheet
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                BS Academic Schedule &amp; Exams
              </span>
            </div>
            <p className="text-slate-500 mt-0.5 font-medium text-xs">
              Manage weekly class schedules, examination datesheets, faculty invigilation duties, and superintendent hall rosters.
            </p>
          </div>
        </div>
        <div className="text-xs font-bold px-4 py-1.5 bg-[#0d4a22] text-white rounded-full shadow-2xs flex items-center gap-1.5 shrink-0">
          <span>🏛️</span>
          <span>BS Academic ERP</span>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-semibold text-xs">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 font-semibold text-xs">{success}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white flex-wrap">
          {[
            { id: "timetable", label: "Class Timetable", icon: "🕒", subIcon: "📅" },
            { id: "datesheet", label: "Exam Datesheet", icon: "📅", subIcon: "📝" },
            { id: "examduty", label: "Exam Duty", icon: "🛡️", subIcon: "🛡️" },
            { id: "superintendent", label: "Superintendent", icon: "📜", subIcon: "🧑‍🏫" },
            { id: "dutylist", label: "Staff Duty List", icon: "🛡️", subIcon: "👮" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-5 py-3.5 font-bold text-sm transition-all flex items-center gap-2 border-r border-gray-100 ${
                activeTab === tab.id
                  ? "border-b-2 border-b-blue-600 text-blue-600 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/60 border-b-2 border-b-transparent"
              }`}
              onClick={() => {
                setActiveTab(tab.id);
                setError("");
                setSuccess("");
                if (tab.id === "timetable") loadTimetable();
                else if (tab.id === "examduty") { loadDuties(); loadDatesheet(); }
                else loadDatesheet();
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.subIcon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ----------------- TIMETABLE TAB ----------------- */}
          {activeTab === "timetable" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    PROGRAM
                  </label>
                  <select
                    value={tProgramId}
                    onChange={(e) => setTProgramId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    <option value="ALL">-- All Programs --</option>
                    {allPrograms.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    SESSION
                  </label>
                  <select
                    value={tSession}
                    onChange={(e) => setTSession(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    <option value="ALL">-- All Sessions --</option>
                    {sessions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    SEMESTER
                  </label>
                  <select
                    value={tSemester}
                    onChange={(e) => setTSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    <option value="0">-- All Semesters --</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s.toString()}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    DEPARTMENT
                  </label>
                  <select
                    value={tDepartmentId}
                    onChange={(e) => setTDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    <option value="ALL">-- All Departments --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 items-center justify-between">
                <div className="flex flex-wrap gap-2.5 items-center">
                  <button
                    onClick={loadTimetable}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <span>🔍</span>
                    <span>Filter Timetables</span>
                  </button>
                  <button
                    onClick={handleAutoGenerateTimetable}
                    className="px-3.5 py-2 bg-[#1d63ed] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>Auto-Generate draft</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingTimetable(null);
                      setTtProgramIdModal(tProgramId !== "ALL" ? tProgramId : (allPrograms[0]?.id || ""));
                      setTtSessionModal(tSession !== "ALL" ? tSession : "2024");
                      setTtSemesterModal(tSemester !== "0" ? tSemester : "1");
                      setTtCourseId(courses[0]?.id || "");
                      setTtFacultyId(faculties[0]?.id || "");
                      setShowTimetableModal(true);
                    }}
                    className="px-3.5 py-2 bg-[#7c00e6] hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>➕</span>
                    <span>Add Manual Slot</span>
                  </button>
                  <button
                    onClick={handlePublishTimetable}
                    className="px-3.5 py-2 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>🚀</span>
                    <span>Publish Timetable</span>
                  </button>
                  {/* Finalize Timetable button */}
                  {timetableFinalized ? (
                    <button
                      onClick={handleUnfinalizeTimetable}
                      className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>🔓</span>
                      <span>Un-Finalize</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleFinalizeTimetable}
                      disabled={loading || timetables.length === 0}
                      className="px-3.5 py-2 bg-[#ea580c] hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <span>🔒</span>
                      <span>Finalize Timetable</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2.5 items-center">
                  <button
                    onClick={exportTimetableCSV}
                    className="px-3.5 py-2 bg-[#046c4e] hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>📥</span>
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>📄</span>
                    <span>Export PDF / Print</span>
                  </button>
                </div>
              </div>

              {/* Finalization Status Banner */}
              {timetables.length > 0 && (
                <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold ${
                  timetableFinalized
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-[#fffbeb] border-[#fde68a] text-[#92400e]"
                }`}>
                  <span className="text-base">{timetableFinalized ? "✅" : "⚠️"}</span>
                  <span>
                    {timetableFinalized
                      ? `Timetable is FINALIZED — Date Sheet can be generated from this timetable.`
                      : `Timetable is NOT FINALIZED — Publish and click "Finalize Timetable" before generating the Date Sheet.`
                    }
                  </span>
                </div>
              )}

              {/* Printable Header */}
              <div className="hidden print:block text-center border-b-2 border-gray-800 pb-3 space-y-1">
                {collegeLogo && <img src={collegeLogo} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-1" />}
                <h2 className="text-xl font-black text-gray-900 uppercase">{collegeName}</h2>
                <p className="text-xs font-bold text-blue-600 uppercase">{collegeTagline}</p>
                <h3 className="text-sm font-bold text-gray-800 uppercase pt-1">
                  BS Class Schedule / Master Timetable Sheet
                </h3>
              </div>

              <div className="overflow-x-auto border rounded-xl mt-4 relative">
                {(collegeBackground || collegeWatermark || collegeLogo) && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none z-0">
                    <img
                      src={collegeBackground || collegeWatermark || collegeLogo}
                      alt="Watermark"
                      className="w-72 h-72 sm:w-96 sm:h-96 object-contain grayscale"
                    />
                  </div>
                )}
                <div className="relative z-10">
                {loading ? (
                  <p className="text-center py-12 text-gray-400">Loading Timetable Entries...</p>
                ) : timetables.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-3 font-semibold text-gray-600">Day</th>
                        <th className="p-3 font-semibold text-gray-600">Time Window</th>
                        <th className="p-3 font-semibold text-gray-600">Course Code & Title</th>
                        <th className="p-3 font-semibold text-gray-600">Assigned Faculty</th>
                        <th className="p-3 font-semibold text-gray-600">Program & Semester</th>
                        <th className="p-3 font-semibold text-gray-600">Status</th>
                        <th className="p-3 font-semibold text-gray-600 print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetables.map((t) => (
                        <tr key={t.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-bold text-blue-900">{t.dayOfWeek}</td>
                          <td className="p-3 font-mono font-bold text-gray-700">{t.startTime} - {t.endTime}</td>
                          <td className="p-3 font-bold text-gray-900">
                            {t.course?.title} {t.course?.code && <span className="text-xs text-gray-500 font-mono">({t.course.code})</span>}
                          </td>
                          <td className="p-3 font-semibold text-indigo-900">{t.faculty?.user?.name || "TBA"}</td>
                          <td className="p-3 text-xs text-gray-600 font-semibold">{t.program?.name} - Sem {t.semester} ({t.session})</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${t.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 print:hidden flex gap-2 items-center">
                            <button
                              onClick={() => {
                                setEditingTimetable(t);
                                setTtProgramIdModal(t.programId || (allPrograms[0]?.id || ""));
                                setTtSessionModal(t.session || "2024");
                                setTtSemesterModal(t.semester?.toString() || "1");
                                setTtDay(t.dayOfWeek);
                                setTtStart(t.startTime);
                                setTtEnd(t.endTime);
                                setTtCourseId(t.courseId || "");
                                setTtFacultyId(t.facultyId || "");
                                setShowTimetableModal(true);
                              }}
                              className="text-blue-600 text-xs font-bold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                await deleteTimetableEntry(t.id);
                                loadTimetable();
                              }}
                              className="text-red-500 text-xs font-semibold hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <p className="text-gray-500 text-sm font-semibold">No timetable entries found for this selection.</p>
                    <button
                      onClick={handleAutoGenerateTimetable}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                    >
                      ⚡ Auto-Generate Master Timetable Now
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

          {/* ----------------- DATESHEET TAB ----------------- */}
          {activeTab === "datesheet" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    PROGRAM
                  </label>
                  <select
                    value={dProgramId}
                    onChange={(e) => setDProgramId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    <option value="ALL">-- All Programs --</option>
                    {allPrograms.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    SESSION
                  </label>
                  <select
                    value={dSession}
                    onChange={(e) => setDSession(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    <option value="ALL">-- All Sessions --</option>
                    {sessions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    SEMESTER
                  </label>
                  <select
                    value={dSemester}
                    onChange={(e) => setDSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    <option value="0">-- All Semesters --</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s.toString()}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    EXAM TYPE
                  </label>
                  <select
                    value={dExamType}
                    onChange={(e) => setDExamType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    <option value="ALL">-- All Exam Types --</option>
                    <option value="TERMINAL">Terminal Exam</option>
                    <option value="FINAL_TERM">Final Term</option>
                    <option value="MID_TERM">Mid Term</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    📅 EXAM START DATE
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={examStartDate}
                    onChange={(e) => setExamStartDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Excluded Exam Dates Input Box */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                  🚫 Excluded Exam Dates (Holidays / Exclusions)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026-06-07, 2026-06-14 (Comma separated dates to skip when generating)"
                  className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs font-mono font-bold bg-white text-slate-800 shadow-2xs"
                  value={excludedDatesInput}
                  onChange={(e) => setExcludedDatesInput(e.target.value)}
                />
                <p className="text-[11px] text-amber-800 font-semibold pt-0.5">
                  ✨ Note: <strong>SUNDAYS are automatically excluded by default</strong> in all exam datesheet calculations.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 items-center justify-between">
                <div className="flex flex-wrap gap-2.5 items-center">
                  <button
                    onClick={loadDatesheet}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <span>🔍</span>
                    <span>Filter Datesheets</span>
                  </button>
                  <button
                    onClick={handleAutoGenerateDatesheet}
                    className="px-3.5 py-2 bg-[#1d63ed] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>Auto-Generate Exam Dates</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingDatesheet(null);
                      setDsProgramIdModal(dProgramId !== "ALL" ? dProgramId : (allPrograms[0]?.id || ""));
                      setDsSessionModal(dSession !== "ALL" ? dSession : "2024");
                      setDsSemesterModal(dSemester !== "0" ? dSemester : "1");
                      setDsExamTypeModal(dExamType !== "ALL" ? dExamType : "TERMINAL");
                      setDsCourseId(courses[0]?.id || "");
                      setShowDatesheetModal(true);
                    }}
                    className="px-3.5 py-2 bg-[#7c00e6] hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>➕</span>
                    <span>Add Manual Exam Paper</span>
                  </button>
                  <button
                    onClick={handlePublishDatesheet}
                    className="px-3.5 py-2 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>🚀</span>
                    <span>Publish Datesheet</span>
                  </button>
                  {/* Finalize Datesheet button */}
                  {datesheetFinalized ? (
                    <button
                      onClick={handleUnfinalizeDatesheet}
                      className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>🔓</span>
                      <span>Un-Finalize</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleFinalizeDatesheet}
                      disabled={loading || datesheets.length === 0}
                      className="px-3.5 py-2 bg-[#ea580c] hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <span>🔒</span>
                      <span>Finalize Date Sheet</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2.5 items-center">
                  <button
                    onClick={exportDatesheetCSV}
                    className="px-3.5 py-2 bg-[#046c4e] hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>📥</span>
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>📄</span>
                    <span>Export PDF / Print</span>
                  </button>
                </div>
              </div>

              {/* Datesheet Finalization Status Banner */}
              {datesheets.length > 0 && (
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-sm font-semibold ${
                  datesheetFinalized
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                }`}>
                  <span className="text-lg">{datesheetFinalized ? "✅" : "⚠️"}</span>
                  <span>
                    {datesheetFinalized
                      ? "Date Sheet is FINALIZED — This is the official exam schedule. Exam Duty and Result Entry are now unlocked."
                      : "Date Sheet is NOT FINALIZED — Publish and click \"Finalize Date Sheet\" to make it official."
                    }
                  </span>
                </div>
              )}

              {/* Printable Header */}
              <div className="hidden print:block text-center border-b-2 border-gray-800 pb-3 space-y-1">
                {collegeLogo && <img src={collegeLogo} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-1" />}
                <h2 className="text-xl font-black text-gray-900 uppercase">{collegeName}</h2>
                <p className="text-xs font-bold text-blue-600 uppercase">{collegeTagline}</p>
                <h3 className="text-sm font-bold text-gray-800 uppercase pt-1">
                  Examination Master Datesheet Sheet (Commencing: {examStartDate})
                </h3>
              </div>

              <div className="overflow-x-auto border rounded-xl mt-4 relative">
                {(collegeBackground || collegeWatermark || collegeLogo) && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none z-0">
                    <img
                      src={collegeBackground || collegeWatermark || collegeLogo}
                      alt="Watermark"
                      className="w-72 h-72 sm:w-96 sm:h-96 object-contain grayscale"
                    />
                  </div>
                )}
                <div className="relative z-10">
                {loading ? (
                  <p className="text-center py-12 text-gray-400">Loading Exam Datesheet Entries...</p>
                ) : datesheets.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-3 font-semibold text-gray-600">Exam Date</th>
                        <th className="p-3 font-semibold text-gray-600">Time Window</th>
                        <th className="p-3 font-semibold text-gray-600">Course Code & Title</th>
                        <th className="p-3 font-semibold text-gray-600">Program & Semester</th>
                        <th className="p-3 font-semibold text-gray-600">Exam Type</th>
                        <th className="p-3 font-semibold text-gray-600">Status</th>
                        <th className="p-3 font-semibold text-gray-600 print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datesheets.map((d) => (
                        <tr key={d.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-bold text-gray-900">{new Date(d.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="p-3 font-mono font-bold text-gray-700">{d.startTime} - {d.endTime}</td>
                          <td className="p-3 font-bold text-gray-900">
                            {d.course?.title} {d.course?.code && <span className="text-xs text-gray-500 font-mono">({d.course.code})</span>}
                          </td>
                          <td className="p-3 text-xs text-gray-600 font-semibold">{d.program?.name} - Sem {d.semester} ({d.session})</td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {d.examType === 'TERMINAL' ? 'Terminal' : d.examType === 'FINAL_TERM' ? 'Final Term' : 'Mid Term'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${d.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
                                {d.status}
                              </span>
                              {d.isFinalized && (
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-orange-100 text-orange-700 border border-orange-300 rounded-full">
                                  🔒 FINALIZED
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 print:hidden flex gap-2 items-center">
                            <button
                              onClick={() => {
                                setEditingDatesheet(d);
                                setDsProgramIdModal(d.programId || (allPrograms[0]?.id || ""));
                                setDsSessionModal(d.session || "2024");
                                setDsSemesterModal(d.semester?.toString() || "1");
                                setDsExamTypeModal(d.examType || "TERMINAL");
                                setDsDate(new Date(d.date).toISOString().split('T')[0]);
                                setDsStart(d.startTime);
                                setDsEnd(d.endTime);
                                setDsCourseId(d.courseId || "");
                                setShowDatesheetModal(true);
                              }}
                              className="text-blue-600 text-xs font-bold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                await deleteDatesheetEntry(d.id);
                                loadDatesheet();
                              }}
                              className="text-red-500 text-xs font-semibold hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <p className="text-gray-500 text-sm font-semibold">No exam datesheet generated yet.</p>
                    <button
                      onClick={handleAutoGenerateDatesheet}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                    >
                      ⚡ Auto-Generate Master Datesheet Now
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

          {/* ----------------- EXAM DUTY TAB ----------------- */}
          {activeTab === "examduty" && (
            <div className="space-y-5">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-5 rounded-2xl shadow-md">
                <h2 className="text-lg font-black flex items-center gap-2">
                  <span>🛡️ Exam Duty Assignment</span>
                </h2>
                <p className="text-xs text-orange-100 mt-1">
                  Mandatory duties are auto-assigned based on the faculty-course mapping from the finalized timetable.
                  Additional invigilator slots are filled from eligible faculty (conflict-free).
                </p>
              </div>

              {/* Duty Warnings */}
              {dutyWarnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl space-y-2">
                  <div className="font-bold text-amber-800 text-sm flex items-center gap-2">
                    <span>⚠️</span> Duty Generation Warnings ({dutyWarnings.length})
                  </div>
                  {dutyWarnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-700 font-semibold pl-5">{w}</p>
                  ))}
                </div>
              )}

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">PROGRAM</label>
                  <select value={dutyProgramId} onChange={e => setDutyProgramId(e.target.value)} className={SELECT_CLS}>
                    <option value="ALL">-- All Programs --</option>
                    {allPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">SESSION</label>
                  <select value={dutySession} onChange={e => setDutySession(e.target.value)} className={SELECT_CLS}>
                    <option value="ALL">-- All Sessions --</option>
                    {sessions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">SEMESTER</label>
                  <select value={dutySemester} onChange={e => setDutySemester(e.target.value)} className={SELECT_CLS}>
                    <option value="0">-- All Semesters --</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{`Semester ${s}`}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">EXAM TYPE</label>
                  <select value={dutyExamType} onChange={e => setDutyExamType(e.target.value)} className={SELECT_CLS}>
                    <option value="ALL">-- All Exam Types --</option>
                    <option value="TERMINAL">Terminal Exam</option>
                    <option value="FINAL_TERM">Final Term</option>
                    <option value="MID_TERM">Mid Term</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={loadDuties}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300/80 transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <span>🔍</span>
                    <span>Filter Duties</span>
                  </button>
                  <button
                    onClick={handleGenerateDuties}
                    disabled={generatingDuties}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>{generatingDuties ? "⏳ Generating..." : "⚡ Generate Duties (Auto)"}</span>
                  </button>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                    <label className="text-xs font-bold text-slate-600">Max Invigilators/Paper:</label>
                    <input
                      type="number"
                      min={1} max={5}
                      value={maxInvigilatorsPerPaper}
                      onChange={e => setMaxInvigilatorsPerPaper(parseInt(e.target.value) || 2)}
                      className="w-12 px-1.5 py-0.5 border border-slate-300 rounded text-xs font-bold text-center bg-white"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const headers = ["Date", "Course", "Faculty", "Duty Type", "Mandatory", "Room", "Shift", "Override"];
                    const rows = dbDuties.map(d => [
                      new Date(d.datesheet?.date).toLocaleDateString(),
                      d.datesheet?.course?.title || "",
                      d.faculty?.user?.name || "",
                      d.dutyType,
                      d.isMandatory ? "YES" : "NO",
                      d.room || "",
                      d.shiftTime || "",
                      d.isOverride ? "YES (Override)" : "NO"
                    ]);
                    downloadCSV("Exam_Duty_List.csv", headers, rows);
                  }}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  📥 Export CSV
                </button>
              </div>

              {/* Duty Table */}
              <div className="overflow-x-auto border rounded-xl mt-2 relative">
                {(collegeBackground || collegeWatermark || collegeLogo) && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none z-0">
                    <img
                      src={collegeBackground || collegeWatermark || collegeLogo}
                      alt="Watermark"
                      className="w-72 h-72 sm:w-96 sm:h-96 object-contain grayscale"
                    />
                  </div>
                )}
                <div className="relative z-10">
                {dbDuties.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-3 font-semibold text-gray-600">Exam Date</th>
                        <th className="p-3 font-semibold text-gray-600">Course</th>
                        <th className="p-3 font-semibold text-gray-600">Shift</th>
                        <th className="p-3 font-semibold text-gray-600">Faculty / Invigilator</th>
                        <th className="p-3 font-semibold text-gray-600">Duty Type</th>
                        <th className="p-3 font-semibold text-gray-600">Room</th>
                        <th className="p-3 font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbDuties.map(duty => (
                        <tr key={duty.id} className={`border-b hover:bg-gray-50 ${duty.isOverride ? "bg-amber-50/40" : ""}`}>
                          <td className="p-3 font-bold text-gray-900">
                            {new Date(duty.datesheet?.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-gray-900 text-sm">{duty.datesheet?.course?.title}</div>
                            <div className="text-xs text-gray-400 font-mono">{duty.datesheet?.course?.code}</div>
                          </td>
                          <td className="p-3 font-mono text-xs text-gray-600 font-semibold">{duty.shiftTime || `${duty.datesheet?.startTime} - ${duty.datesheet?.endTime}`}</td>
                          <td className="p-3">
                            <div className="font-bold text-gray-900">{duty.faculty?.user?.name}</div>
                            <div className="text-xs text-gray-400">{duty.faculty?.designation}</div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <span className={`px-2.5 py-1 text-xs font-extrabold rounded-full inline-block w-fit ${
                                duty.isMandatory
                                  ? "bg-red-100 text-red-700 border border-red-300"
                                  : "bg-blue-100 text-blue-700 border border-blue-200"
                              }`}>
                                {duty.isMandatory ? "🔴 MANDATORY" : "🔵 INVIGILATOR"}
                              </span>
                              {duty.isOverride && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300 rounded-full inline-block w-fit">
                                  ⚠️ Override
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-xs text-gray-600">{duty.room || "—"}</td>
                          <td className="p-3">
                            <button
                              onClick={() => handleDeleteDuty(duty.id)}
                              className="text-red-500 text-xs font-semibold hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <p className="text-gray-500 text-sm font-semibold">No duty assignments found.</p>
                    <p className="text-gray-400 text-xs">Make sure the Date Sheet is finalized, then click "Generate Duties (Auto)".</p>
                    <button
                      onClick={handleGenerateDuties}
                      disabled={generatingDuties}
                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                    >
                      ⚡ Generate Duties Now
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 3: CHIEF SUPERINTENDENT DUTY ROSTER ----------------- */}
          {activeTab === "superintendent" && (

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <span>👨‍⚖️ Standalone Chief Superintendent & Hall Allotment Roster</span>
                  </h2>
                  <p className="text-xs text-indigo-200 mt-1">
                    Configure Chief Superintendent profile, select multiple sessions, semesters & programs, and manage hall allotments.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={loadDatesheet}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <span>⚡ Auto-Generate Roster</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingSuptEntry(null);
                      setSuptForm({
                        date: new Date().toISOString().split("T")[0],
                        time: "09:00 - 12:00",
                        course: "",
                        hall: examHallName,
                        programName: selectedSuptPrograms.length > 0 ? selectedSuptPrograms.join(" + ") : (isHallMerged ? selectedMergedPrograms.join(" + ") : "BS Programs"),
                        chief: superintendentName,
                        designation: superintendentDesignation,
                        department: superintendentDepartment,
                        deputy: deputySuperintendent,
                        sessions: selectedSuptSessions,
                        semesters: selectedSuptSemesters,
                        programs: selectedSuptPrograms
                      });
                      setShowSuptModal(true);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <span>➕ Add Manual Entry</span>
                  </button>
                  <button
                    onClick={exportSuperintendentCSV}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <span>📥 Export CSV</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-white text-purple-900 hover:bg-indigo-50 font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <span>📄 Export PDF / Print Roster</span>
                  </button>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center gap-2 bg-white p-3 rounded-xl border print:hidden">
                <span className="text-xs font-extrabold text-purple-950 uppercase">Roster Display Mode:</span>
                {[
                  { id: "ALL", label: `ALL (${displaySuptList.length})` },
                  { id: "AUTO", label: `⚡ Auto-Mapped (${autoSuptList.length})` },
                  { id: "MANUAL", label: `✍️ Manual Entries (${manualSuptEntries.length})` },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSuptFilterMode(mode.id as any)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                      suptFilterMode === mode.id
                        ? "bg-purple-800 text-white border-purple-800 shadow"
                        : "bg-white text-gray-700 border-purple-200 hover:bg-purple-50"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Chief Superintendent Setup Parameters & Multi-Selections Form */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6 print:hidden">
                <div className="border-b pb-3">
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    ⚙️ Chief Superintendent Parameters & Allocation Controls
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure Superintendent profile info and select multiple sessions, semesters, and programs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Chief Superintendent Name</label>
                    <div className="space-y-1.5">
                      <select
                        value={superintendentName}
                        onChange={(e) => setSuperintendentName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-gray-900 bg-white"
                      >
                        <option value="Dr. Muhammad Usman">Dr. Muhammad Usman</option>
                        {faculties.map(f => (
                          <option key={f.id} value={f.user?.name}>{f.user?.name} ({f.designation || 'Faculty'})</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Or enter custom name..."
                        className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold text-gray-900"
                        value={superintendentName}
                        onChange={(e) => setSuperintendentName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Designation</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-gray-900"
                      value={superintendentDesignation}
                      onChange={(e) => setSuperintendentDesignation(e.target.value)}
                      placeholder="e.g. Chief Superintendent / HOD"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Department</label>
                    <select
                      value={superintendentDepartment}
                      onChange={(e) => setSuperintendentDepartment(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-gray-900 bg-white"
                    >
                      <option value="Computer Science">Computer Science</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Deputy Superintendent</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-gray-900"
                      value={deputySuperintendent}
                      onChange={(e) => setDeputySuperintendent(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Examination Center / Main Hall</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-gray-900"
                      value={examHallName}
                      onChange={(e) => setExamHallName(e.target.value)}
                    />
                  </div>
                </div>

                {/* MULTI SELECTION SECTION 1: Academic Sessions */}
                <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-purple-950 uppercase flex items-center gap-1.5">
                      📅 Academic Sessions (Multiple Selection)
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedSuptSessions(["2022", "2023", "2024", "2025", "2026", "2027"])}
                        className="text-[10px] font-bold text-purple-700 hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-purple-300">|</span>
                      <button
                        onClick={() => setSelectedSuptSessions([])}
                        className="text-[10px] font-bold text-purple-700 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["2022", "2023", "2024", "2025", "2026", "2027"].map(s => {
                      const isSelected = selectedSuptSessions.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            if (isSelected) setSelectedSuptSessions(selectedSuptSessions.filter(x => x !== s));
                            else setSelectedSuptSessions([...selectedSuptSessions, s]);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                            isSelected
                              ? "bg-purple-700 text-white border-purple-700 shadow-sm"
                              : "bg-white text-gray-700 border-purple-200 hover:bg-purple-100"
                          }`}
                        >
                          {isSelected ? "✓ Session " : "+ Session "} {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* MULTI SELECTION SECTION 2: Semesters */}
                <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-indigo-950 uppercase flex items-center gap-1.5">
                      📚 Semesters (Multiple Selection)
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedSuptSemesters([1, 2, 3, 4, 5, 6, 7, 8])}
                        className="text-[10px] font-bold text-indigo-700 hover:underline"
                      >
                        Select All (1 to 8)
                      </button>
                      <span className="text-indigo-300">|</span>
                      <button
                        onClick={() => setSelectedSuptSemesters([])}
                        className="text-[10px] font-bold text-indigo-700 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
                      const isSelected = selectedSuptSemesters.includes(sem);
                      return (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => {
                            if (isSelected) setSelectedSuptSemesters(selectedSuptSemesters.filter(x => x !== sem));
                            else setSelectedSuptSemesters([...selectedSuptSemesters, sem]);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                            isSelected
                              ? "bg-indigo-700 text-white border-indigo-700 shadow-sm"
                              : "bg-white text-gray-700 border-indigo-200 hover:bg-indigo-100"
                          }`}
                        >
                          {isSelected ? "✓ Semester " : "+ Semester "} {sem}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* MULTI SELECTION SECTION 3: Programs */}
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-blue-950 uppercase flex items-center gap-1.5">
                      🎓 Programs (Multiple Selection)
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedSuptPrograms(allPrograms.map(p => p.name))}
                        className="text-[10px] font-bold text-blue-700 hover:underline"
                      >
                        Select All Programs
                      </button>
                      <span className="text-blue-300">|</span>
                      <button
                        onClick={() => setSelectedSuptPrograms([])}
                        className="text-[10px] font-bold text-blue-700 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allPrograms.map(p => {
                      const isSelected = selectedSuptPrograms.includes(p.name);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) setSelectedSuptPrograms(selectedSuptPrograms.filter(x => x !== p.name));
                            else setSelectedSuptPrograms([...selectedSuptPrograms, p.name]);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-gray-700 border-blue-200 hover:bg-blue-100"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "} {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Official Superintendent Roster Document */}
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                <div className="text-center border-b-2 border-gray-800 pb-4 space-y-1">
                  {collegeLogo && <img src={collegeLogo} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-1" />}
                  <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">{collegeName}</h1>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{collegeTagline}</p>
                  <h2 className="text-base font-extrabold text-gray-900 uppercase pt-2">
                    OFFICIAL CHIEF SUPERINTENDENT EXAM HALL ALLOTMENT ROSTER
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Chief Superintendent</span>
                    <strong className="text-gray-900 font-bold">{superintendentName} ({superintendentDesignation})</strong>
                    <span className="text-[10px] text-gray-500 block">Dept: {superintendentDepartment}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Deputy Superintendent</span>
                    <strong className="text-gray-900 font-bold">{deputySuperintendent}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Allotted Center / Hall</span>
                    <strong className="text-purple-900 font-bold">{examHallName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Allotted Sessions & Semesters</span>
                    <strong className="text-blue-900 font-bold">
                      Sessions: {selectedSuptSessions.join(", ") || "All"} | Sems: {selectedSuptSemesters.join(", ") || "All"}
                    </strong>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  {displaySuptList.length > 0 ? (
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="p-3 font-bold text-gray-800">Date & Shift</th>
                          <th className="p-3 font-bold text-gray-800">Exam Subject / Code</th>
                          <th className="p-3 font-bold text-gray-800">Chief Superintendent</th>
                          <th className="p-3 font-bold text-gray-800">Allotted Exam Hall</th>
                          <th className="p-3 font-bold text-gray-800">Assigned Programs</th>
                          <th className="p-3 font-bold text-gray-800">Type</th>
                          <th className="p-3 font-bold text-gray-800 text-center print:hidden">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displaySuptList.map((d) => (
                          <tr key={d.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-bold text-gray-900">
                              <div>{new Date(d.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              <div className="font-mono text-xs text-purple-700 font-bold">{d.time}</div>
                            </td>
                            <td className="p-3 font-bold text-gray-900">{d.course}</td>
                            <td className="p-3 text-xs">
                              <div className="font-bold text-gray-900">👨‍⚖️ {d.chief || superintendentName}</div>
                              <div className="text-[10px] text-gray-500">{d.designation || superintendentDesignation} ({d.department || superintendentDepartment})</div>
                            </td>
                            <td className="p-3 font-bold text-purple-900">{d.hall}</td>
                            <td className="p-3 text-xs font-semibold text-blue-900">{d.programName}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${d.isManual ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                                {d.isManual ? '✍️ Manual' : '⚡ Auto'}
                              </span>
                            </td>
                            <td className="p-3 text-center print:hidden">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingSuptEntry(d);
                                    setSuptForm({
                                      date: new Date(d.date).toISOString().split('T')[0],
                                      time: d.time,
                                      course: d.course,
                                      hall: d.hall,
                                      programName: d.programName,
                                      chief: d.chief || superintendentName,
                                      designation: d.designation || superintendentDesignation,
                                      department: d.department || superintendentDepartment,
                                      deputy: d.deputy || deputySuperintendent,
                                      sessions: d.sessions || selectedSuptSessions,
                                      semesters: d.semesters || selectedSuptSemesters,
                                      programs: d.programs || selectedSuptPrograms
                                    });
                                    setShowSuptModal(true);
                                  }}
                                  className="text-blue-600 text-xs font-bold hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSuptEntry(d)}
                                  className="text-red-500 text-xs font-semibold hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12 space-y-3">
                      <p className="text-gray-500 text-sm font-semibold">No superintendent roster entries found.</p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={loadDatesheet}
                          className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow transition-all"
                        >
                          ⚡ Auto-Generate Roster
                        </button>
                        <button
                          onClick={() => {
                            setEditingSuptEntry(null);
                            setSuptForm({
                              date: new Date().toISOString().split("T")[0],
                              time: "09:00 - 12:00",
                              course: "",
                              hall: examHallName,
                              programName: selectedSuptPrograms.length > 0 ? selectedSuptPrograms.join(" + ") : (isHallMerged ? selectedMergedPrograms.join(" + ") : "BS Programs"),
                              chief: superintendentName,
                              designation: superintendentDesignation,
                              department: superintendentDepartment,
                              deputy: deputySuperintendent,
                              sessions: selectedSuptSessions,
                              semesters: selectedSuptSemesters,
                              programs: selectedSuptPrograms
                            });
                            setShowSuptModal(true);
                          }}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                        >
                          ➕ Add Manual Entry
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Signature Block */}
                <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-8">
                    <div className="border-b border-gray-400"></div>
                    <div className="font-bold text-gray-800">Chief Superintendent Signature & Stamp</div>
                  </div>
                  <div className="space-y-8">
                    <div className="border-b border-gray-400"></div>
                    <div className="font-bold text-gray-800">Principal / Controller of Examinations</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 4: STAFF DUTY LIST TAB ----------------- */}
          {activeTab === "dutylist" && (
            <div className="space-y-4">
              {/* Invigilation Setup Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200 space-y-4 print:hidden">
                <div className="flex justify-between items-center flex-wrap gap-3 border-b border-blue-200/60 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
                      🛡️ Invigilation Roster Setup & Duty Allocation
                    </h3>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Assign faculty invigilators, exam dates, time windows, and select Chief Superintendent for each duty.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleAutoGenerateDatesheet}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <span>⚡ Auto-Map Duties</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingStaffDuty(null);
                        setDutyForm({
                          date: new Date().toISOString().split("T")[0],
                          time: "09:00 - 12:00",
                          course: "",
                          courseCode: "",
                          invigilator: faculties[0]?.user?.name || "",
                          superintendent: `${superintendentName} (${superintendentDesignation})`,
                          hall: examHallName,
                          status: "ASSIGNED"
                        });
                        setShowStaffDutyModal(true);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <span>➕ Add Manual Duty</span>
                    </button>
                    <button
                      onClick={exportDutyListCSV}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <span>📥 Export CSV</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <span>📄 Export PDF / Print</span>
                    </button>
                  </div>
                </div>

                {/* Auto vs Manual Filter Buttons */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-blue-950 uppercase">Duty Display Mode:</span>
                    {[
                      { id: "ALL", label: `ALL (${displayDuties.length})` },
                      { id: "AUTO", label: `⚡ Auto-Mapped (${duties.length})` },
                      { id: "MANUAL", label: `✍️ Manual Entries (${manualDuties.length})` },
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setDutyFilterMode(mode.id as any)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                          dutyFilterMode === mode.id
                            ? "bg-blue-600 text-white border-blue-600 shadow"
                            : "bg-white text-gray-700 border-blue-200 hover:bg-blue-100"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-blue-900 uppercase mb-1">Max Duties Per Invigilator</label>
                    <select
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-xs font-bold text-gray-900 bg-white"
                      value={maxDutiesPerInvigilator}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setMaxDutiesPerInvigilator(val);
                        try { localStorage.setItem("max_invigilation_duties", val.toString()); } catch(e){}
                      }}
                    >
                      <option value={1}>Max 1 Duty / Invigilator</option>
                      <option value={2}>Max 2 Duties / Invigilator</option>
                      <option value={3}>Max 3 Duties (Recommended)</option>
                      <option value={4}>Max 4 Duties / Invigilator</option>
                      <option value={5}>Max 5 Duties / Invigilator</option>
                      <option value={10}>Max 10 Duties (High Capacity)</option>
                      <option value={999}>Unlimited Duties</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-blue-900 uppercase mb-1">Default Chief Superintendent</label>
                    <select
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-xs font-bold text-gray-900 bg-white"
                      value={superintendentName}
                      onChange={(e) => setSuperintendentName(e.target.value)}
                    >
                      <option value="Dr. Muhammad Usman">Dr. Muhammad Usman (HOD / CS)</option>
                      {faculties.map(f => (
                        <option key={f.id} value={f.user?.name}>{f.user?.name} ({f.designation || 'Faculty'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-blue-900 uppercase mb-1">Deputy Superintendent</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-xs font-bold text-gray-900 bg-white"
                      value={deputySuperintendent}
                      onChange={(e) => setDeputySuperintendent(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-blue-900 uppercase mb-1">Examination Hall / Center</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-xs font-bold text-gray-900 bg-white"
                      value={examHallName}
                      onChange={(e) => setExamHallName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Printable Official Duty Roster Header */}
              <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 space-y-1">
                {collegeLogo && <img src={collegeLogo} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-1" />}
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">{collegeName}</h1>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{collegeTagline}</p>
                <h2 className="text-base font-extrabold text-gray-800 uppercase pt-1">
                  Official Examination Invigilation Duty Roster
                </h2>
                <div className="text-xs text-gray-600 flex justify-center gap-6 pt-1">
                  <span><strong>Chief Superintendent:</strong> {superintendentName} ({superintendentDesignation})</span>
                  <span><strong>Deputy Superintendent:</strong> {deputySuperintendent}</span>
                  <span><strong>Exam Center:</strong> {examHallName}</span>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-xl mt-4 relative">
                {(collegeBackground || collegeWatermark || collegeLogo) && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none z-0">
                    <img
                      src={collegeBackground || collegeWatermark || collegeLogo}
                      alt="Watermark"
                      className="w-72 h-72 sm:w-96 sm:h-96 object-contain grayscale"
                    />
                  </div>
                )}
                <div className="relative z-10">
                {displayDuties.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-3 font-semibold text-gray-600">Exam Date</th>
                        <th className="p-3 font-semibold text-gray-600">Time Window</th>
                        <th className="p-3 font-semibold text-gray-600">Course / Exam Paper</th>
                        <th className="p-3 font-semibold text-gray-600">Assigned Invigilator (Faculty)</th>
                        <th className="p-3 font-semibold text-gray-600">Assigned Superintendent</th>
                        <th className="p-3 font-semibold text-gray-600">Exam Hall Center</th>
                        <th className="p-3 font-semibold text-gray-600">Type</th>
                        <th className="p-3 font-semibold text-gray-600">Status</th>
                        <th className="p-3 font-semibold text-gray-600 text-center print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayDuties.map((duty) => (
                        <tr key={duty.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-bold text-gray-900">{new Date(duty.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="p-3 font-mono text-gray-700 font-bold">{duty.time}</td>
                          <td className="p-3 font-bold text-gray-900">{duty.course} {duty.courseCode && <span className="text-xs text-gray-500 font-mono">({duty.courseCode})</span>}</td>
                          <td className="p-3 font-bold text-indigo-900 flex items-center gap-1.5">
                            <span>👨‍🏫</span> {duty.invigilator}
                          </td>
                          <td className="p-3 text-xs font-bold text-purple-900">
                            <span>👨‍⚖️</span> {duty.superintendent || superintendentName}
                          </td>
                          <td className="p-3 text-xs font-semibold text-gray-700">{duty.hall}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${duty.isManual ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                              {duty.isManual ? '✍️ Manual' : '⚡ Auto'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 text-xs rounded-full font-extrabold bg-green-100 text-green-800 border border-green-200">
                              {duty.status || 'ASSIGNED'}
                            </span>
                          </td>
                          <td className="p-3 text-center print:hidden">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingStaffDuty(duty);
                                  setDutyForm({
                                    date: new Date(duty.date).toISOString().split('T')[0],
                                    time: duty.time,
                                    course: duty.course,
                                    courseCode: duty.courseCode || "",
                                    invigilator: duty.invigilator,
                                    superintendent: duty.superintendent || superintendentName,
                                    hall: duty.hall,
                                    status: duty.status || "ASSIGNED"
                                  });
                                  setShowStaffDutyModal(true);
                                }}
                                className="text-blue-600 text-xs font-bold hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteStaffDuty(duty)}
                                className="text-red-500 text-xs font-semibold hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <p className="text-gray-500 text-sm font-semibold">No invigilation duties found.</p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={handleAutoGenerateDatesheet}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                      >
                        ⚡ Auto-Generate Exam Dates & Duties
                      </button>
                      <button
                        onClick={() => {
                          setEditingStaffDuty(null);
                          setDutyForm({
                            date: new Date().toISOString().split("T")[0],
                            time: "09:00 - 12:00",
                            course: "",
                            courseCode: "",
                            invigilator: faculties[0]?.user?.name || "",
                            superintendent: `${superintendentName} (${superintendentDesignation})`,
                            hall: examHallName,
                            status: "ASSIGNED"
                          });
                          setShowStaffDutyModal(true);
                        }}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                      >
                        ➕ Add Manual Invigilation Duty
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Printable Signature & Guidelines Block */}
              <div className="hidden print:grid grid-cols-2 gap-8 text-center text-xs pt-12">
                <div className="space-y-8">
                  <div className="border-b border-gray-400"></div>
                  <div className="font-bold text-gray-800">Deputy Superintendent Signature</div>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-gray-400"></div>
                  <div className="font-bold text-gray-800">Chief Superintendent / Principal Signature & Stamp</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- MODAL 1: MANUAL TIMETABLE ENTRY ---------------- */}
      {showTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl max-w-md w-full mx-4 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingTimetable ? "✏️ Edit Timetable Slot" : "➕ Add Manual Timetable Slot"}
              </h3>
              <button
                onClick={() => setShowTimetableModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveManualTT} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Program</label>
                  <select
                    value={ttProgramIdModal}
                    onChange={(e) => setTtProgramIdModal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  >
                    {allPrograms.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Academic Session</label>
                  <select
                    value={ttSessionModal}
                    onChange={(e) => setTtSessionModal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  >
                    {sessions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Semester</label>
                  <select
                    value={ttSemesterModal}
                    onChange={(e) => setTtSemesterModal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s.toString()}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Day of Week</label>
                  <select
                    value={ttDay}
                    onChange={(e) => setTtDay(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  >
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="09:00"
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold"
                    value={ttStart}
                    onChange={(e) => setTtStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">End Time</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00"
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold"
                    value={ttEnd}
                    onChange={(e) => setTtEnd(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Course / Subject</label>
                <select
                  value={ttCourseId}
                  onChange={(e) => setTtCourseId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-bold"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Assigned Faculty Member</label>
                <select
                  value={ttFacultyId}
                  onChange={(e) => setTtFacultyId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-bold"
                >
                  <option value="">-- Select Faculty --</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.user?.name} ({f.designation || "Faculty"})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowTimetableModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 2: MANUAL DATESHEET ENTRY ---------------- */}
      {showDatesheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl max-w-md w-full mx-4 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingDatesheet ? "✏️ Edit Datesheet Entry" : "➕ Add Manual Exam Paper"}
              </h3>
              <button
                onClick={() => setShowDatesheetModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveManualDS} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Program</label>
                  <select
                    value={dsProgramIdModal}
                    onChange={(e) => setDsProgramIdModal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  >
                    {allPrograms.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Academic Session</label>
                  <select
                    value={dsSessionModal}
                    onChange={(e) => setDsSessionModal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  >
                    {sessions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Semester</label>
                  <select
                    value={dsSemesterModal}
                    onChange={(e) => setDsSemesterModal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s.toString()}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Exam Type</label>
                  <select
                    value={dsExamTypeModal}
                    onChange={(e) => setDsExamTypeModal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-bold"
                  >
                    <option value="TERMINAL">Terminal Exam</option>
                    <option value="FINAL_TERM">Final Term</option>
                    <option value="MID_TERM">Mid Term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Exam Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  value={dsDate}
                  onChange={(e) => setDsDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="09:00"
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold"
                    value={dsStart}
                    onChange={(e) => setDsStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">End Time</label>
                  <input
                    type="text"
                    required
                    placeholder="12:00"
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold"
                    value={dsEnd}
                    onChange={(e) => setDsEnd(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Course / Exam Subject</label>
                <select
                  value={dsCourseId}
                  onChange={(e) => setDsCourseId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-bold"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowDatesheetModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 3: MANUAL STAFF IN VIGILATION DUTY ---------------- */}
      {showStaffDutyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl max-w-md w-full mx-4 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingStaffDuty ? "✏️ Edit Invigilation Duty Entry" : "➕ Add Manual Invigilation Duty"}
              </h3>
              <button
                onClick={() => { setShowStaffDutyModal(false); setEditingStaffDuty(null); }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStaffDuty} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Exam Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    value={dutyForm.date}
                    onChange={(e) => setDutyForm({ ...dutyForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Time Window</label>
                  <input
                    type="text"
                    required
                    placeholder="09:00 - 12:00"
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    value={dutyForm.time}
                    onChange={(e) => setDutyForm({ ...dutyForm, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures"
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    value={dutyForm.course}
                    onChange={(e) => setDutyForm({ ...dutyForm, course: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS-201"
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    value={dutyForm.courseCode}
                    onChange={(e) => setDutyForm({ ...dutyForm, courseCode: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Assigned Invigilator (Faculty Member)</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white mb-2"
                  onChange={(e) => {
                    if (e.target.value) setDutyForm({ ...dutyForm, invigilator: e.target.value });
                  }}
                >
                  <option value="">-- Select from Registered Faculty --</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.user?.name}>{f.user?.name} ({f.designation || 'Faculty'})</option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="Or type Invigilator Name..."
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  value={dutyForm.invigilator}
                  onChange={(e) => setDutyForm({ ...dutyForm, invigilator: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Assigned Chief Superintendent</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  value={dutyForm.superintendent}
                  onChange={(e) => setDutyForm({ ...dutyForm, superintendent: e.target.value })}
                >
                  <option value={`${superintendentName} (${superintendentDesignation})`}>
                    {superintendentName} ({superintendentDesignation})
                  </option>
                  {faculties.map(f => (
                    <option key={f.id} value={`${f.user?.name} (${f.designation || 'Faculty'})`}>
                      {f.user?.name} ({f.designation || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Exam Hall Center</label>
                  <input
                    type="text"
                    required
                    placeholder="Hall A / Auditorium"
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    value={dutyForm.hall}
                    onChange={(e) => setDutyForm({ ...dutyForm, hall: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    value={dutyForm.status}
                    onChange={(e) => setDutyForm({ ...dutyForm, status: e.target.value })}
                  >
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => { setShowStaffDutyModal(false); setEditingStaffDuty(null); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow"
                >
                  Save Duty Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 4: MANUAL SUPERINTENDENT ENTRY ---------------- */}
      {showSuptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl max-w-md w-full mx-4 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingSuptEntry ? "✏️ Edit Superintendent Roster Entry" : "➕ Add Manual Superintendent Roster Entry"}
              </h3>
              <button
                onClick={() => { setShowSuptModal(false); setEditingSuptEntry(null); }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSuptEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Exam Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    value={suptForm.date}
                    onChange={(e) => setSuptForm({ ...suptForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Shift Window</label>
                  <input
                    type="text"
                    required
                    placeholder="09:00 - 12:00"
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    value={suptForm.time}
                    onChange={(e) => setSuptForm({ ...suptForm, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Exam Subject / Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics II (PHY-102)"
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  value={suptForm.course}
                  onChange={(e) => setSuptForm({ ...suptForm, course: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Chief Superintendent</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    value={suptForm.chief}
                    onChange={(e) => setSuptForm({ ...suptForm, chief: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    value={suptForm.designation}
                    onChange={(e) => setSuptForm({ ...suptForm, designation: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Department</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  value={suptForm.department}
                  onChange={(e) => setSuptForm({ ...suptForm, department: e.target.value })}
                >
                  <option value="Computer Science">Computer Science</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Allotted Exam Hall</label>
                  <input
                    type="text"
                    required
                    placeholder="Main Auditorium"
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    value={suptForm.hall}
                    onChange={(e) => setSuptForm({ ...suptForm, hall: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Assigned Programs</label>
                  <input
                    type="text"
                    required
                    placeholder="BS CS + BS Math"
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    value={suptForm.programName}
                    onChange={(e) => setSuptForm({ ...suptForm, programName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Deputy Superintendent</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                  value={suptForm.deputy}
                  onChange={(e) => setSuptForm({ ...suptForm, deputy: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => { setShowSuptModal(false); setEditingSuptEntry(null); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow"
                >
                  Save Roster Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
