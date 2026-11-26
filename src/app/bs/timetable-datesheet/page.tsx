"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Upload,
  Download,
  ClipboardList,
  CheckCircle2,
  X,
  Calendar,
  Layers,
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react";
import { parseGenericCSV, validateTimetableBatch, validateDatesheetBatch, getTimetableSampleCSV, getDatesheetSampleCSV } from "@/lib/domainParsers";
import {
  TIMETABLE_WEEKDAYS,
  TIMETABLE_DAY_PRESETS,
  DAY_ABBREV,
  expandTimetableDays,
  formatSelectedDaysValue,
  isSingleOrPresetDay,
  type TimetableWeekday,
} from "@/lib/timetable-days";
import {
  buildSharedSubjectRecommendations,
  formatCourseLabel,
  normalizeSubjectKey,
  parseCombinedClassTag,
  isOptionalSubjectCourse,
  type SharedSubjectRecommendation,
} from "@/lib/timetable-recommendations";
import UniversalImportModal from "@/components/UniversalImportModal";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";
import OfficialTimetableMatrixReport, { toOrdinalUpper } from "@/components/bs/OfficialTimetableMatrixReport";
import OfficialExamCenterReport from "@/components/bs/OfficialExamCenterReport";

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

  // Universal Import states for Timetable & Datesheet
  const [importEntity, setImportEntity] = useState<"Timetable" | "Datesheet">("Timetable");
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationData, setValidationData] = useState<any>(null);
  const [importSourceName, setImportSourceName] = useState("");
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);

  const handleImportTimetableCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseGenericCSV(text);
      if (parsed.length === 0) {
        setError("Invalid or empty CSV file. Please ensure valid headers and class rows exist.");
        return;
      }
      const validation = validateTimetableBatch(parsed, allPrograms, courses);
      setValidationData(validation);
      setImportEntity("Timetable");
      setImportSourceName(file.name);
      setValidationModalOpen(true);
    } catch {
      setError("Failed to read CSV file.");
    } finally {
      e.target.value = "";
    }
  };

  const handleImportDatesheetCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseGenericCSV(text);
      if (parsed.length === 0) {
        setError("Invalid or empty CSV file. Please ensure valid headers and exam rows exist.");
        return;
      }
      const validation = validateDatesheetBatch(parsed, allPrograms, courses);
      setValidationData(validation);
      setImportEntity("Datesheet");
      setImportSourceName(file.name);
      setValidationModalOpen(true);
    } catch {
      setError("Failed to read CSV file.");
    } finally {
      e.target.value = "";
    }
  };

  const handleProcessPastedText = () => {
    if (!pasteText.trim()) return;
    try {
      const parsed = parseGenericCSV(pasteText);
      if (parsed.length === 0) {
        setError("Could not parse records from pasted data.");
        return;
      }
      const validation = importEntity === "Timetable"
        ? validateTimetableBatch(parsed, allPrograms, courses)
        : validateDatesheetBatch(parsed, allPrograms, courses);
      setValidationData(validation);
      setImportSourceName("Pasted Data");
      setPasteModalOpen(false);
      setValidationModalOpen(true);
    } catch {
      setError("Failed to parse pasted text.");
    }
  };

  const handleConfirmEntityImport = async (validRows: Record<string, string>[]) => {
    if (validRows.length === 0) return;
    setIsImporting(true);

    try {
      const endpoint = importEntity === "Timetable" ? "/api/timetable/import" : "/api/datesheet/import";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: validRows,
          educationLevel: "BS"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setValidationModalOpen(false);
        setPasteText("");
        setImportSummary(data);
        setSuccess(`${importEntity} import completed successfully: ${data.imported} records added.`);
        loadTimetable();
        loadDatesheet();
      } else {
        setError(data.error || `Failed to import ${importEntity}.`);
      }
    } catch {
      setError(`Communication error during ${importEntity} import.`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTimetableTemplate = () => {
    const templateContent = getTimetableSampleCSV();
    const blob = new Blob(["\uFEFF" + templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Timetable_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDatesheetTemplate = () => {
    const templateContent = getDatesheetSampleCSV();
    const blob = new Blob(["\uFEFF" + templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Datesheet_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Manual Duty Modal
  const [showManualDutyModal, setShowManualDutyModal] = useState(false);
  const [dutyFacultyId, setDutyFacultyId] = useState("");
  const [dutyDatesheetId, setDutyDatesheetId] = useState("");
  const [dutyType, setDutyType] = useState("INVIGILATOR");
  const [dutyRoom, setDutyRoom] = useState("");
  const [editingDuty, setEditingDuty] = useState<any>(null);

  // ── SUPERINTENDENT & OFFICIAL CENTER REPORT PARAMETERS
  const [centerNumber, setCenterNumber] = useState("5");
  const [superintendentName, setSuperintendentName] = useState("Dr. Muhammad Usman");
  const [superintendentDesignation, setSuperintendentDesignation] = useState("Chief Superintendent / HOD");
  const [superintendentDepartment, setSuperintendentDepartment] = useState("Computer Science");
  const [deputySuperintendent, setDeputySuperintendent] = useState("Prof. Shahida Kakar (Deputy Superintendent)");
  const [examHallName, setExamHallName] = useState("1st Floor BS New Block");
  const [mobileCollector, setMobileCollector] = useState("Mr. Munir Ahmed (Botany LAB)");
  const [dutyNote, setDutyNote] = useState("All respected professors are advised to note and ensure their presence on allocated duty.");
  const [isHallMerged, setIsHallMerged] = useState(true);
  const [selectedMergedPrograms, setSelectedMergedPrograms] = useState<string[]>([]);
  const [studentCounts, setStudentCounts] = useState<Array<{ programId: string | null; semester: number | null; count: number }>>([]);

  // Official Report View Toggles
  const [ttViewMode, setTtViewMode] = useState<"matrix" | "list">("matrix");
  const [dsViewMode, setDsViewMode] = useState<"official" | "list">("official");
  const [dbDutyViewMode, setDbDutyViewMode] = useState<"official" | "list">("official");
  const [suptViewMode, setSuptViewMode] = useState<"official" | "list">("official");
  const [staffDutyViewMode, setStaffDutyViewMode] = useState<"official" | "list">("official");

  // Multi-selection options for Superintendent
  const [selectedSuptSessions, setSelectedSuptSessions] = useState<string[]>(["2024", "2025"]);
  const [selectedSuptSemesters, setSelectedSuptSemesters] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);
  const [selectedSuptPrograms, setSelectedSuptPrograms] = useState<string[]>([]);

  // ── MANUAL MODALS
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<any>(null);
  const [ttProgramIdModal, setTtProgramIdModal] = useState("");
  const [ttSessionModal, setTtSessionModal] = useState("2024-2028");
  const [ttSemesterModal, setTtSemesterModal] = useState("1");
  const [ttDay, setTtDay] = useState("Monday");
  const [ttCustomDayMode, setTtCustomDayMode] = useState(false);
  const [ttStart, setTtStart] = useState("09:00");
  const [ttEnd, setTtEnd] = useState("10:00");
  const [ttCourseId, setTtCourseId] = useState("");
  const [ttFacultyId, setTtFacultyId] = useState("");
  const [ttMode, setTtMode] = useState<"single" | "combined">("single");
  const [ttAllowCombinedSingle, setTtAllowCombinedSingle] = useState(false);
  const [ttAllowOptionalParallel, setTtAllowOptionalParallel] = useState(false);
  const [ttCombinedGroupId, setTtCombinedGroupId] = useState<string | null>(null);
  const [ttApplyToCombinedGroup, setTtApplyToCombinedGroup] = useState(true);
  const [ttCombinedCohorts, setTtCombinedCohorts] = useState<
    Array<{ programId: string; session: string; semester: string; courseId: string }>
  >([]);
  const [showRecommendationsPanel, setShowRecommendationsPanel] = useState(true);

  const availableSessionOptions = useMemo(() => {
    const combined = new Set<string>(sessions);
    courses.forEach((c) => {
      if (c?.session && typeof c.session === "string") combined.add(c.session.trim());
    });
    timetables.forEach((t) => {
      if (t?.session && typeof t.session === "string") combined.add(t.session.trim());
    });
    return Array.from(combined).filter(Boolean);
  }, [sessions, courses, timetables]);

  const sharedRecommendations = useMemo(
    () =>
      buildSharedSubjectRecommendations({
        courses,
        programs: allPrograms,
        faculties,
        timetables,
      }),
    [courses, allPrograms, faculties, timetables]
  );

  const bsCoursesSorted = useMemo(() => {
    const bsProgIds = new Set(allPrograms.map((p) => p.id));
    const bsList = courses.filter((c) => !c.programId || bsProgIds.has(c.programId) || c.program?.educationLevel === "BS");
    const matching = bsList.filter(
      (c) =>
        (!ttProgramIdModal || c.programId === ttProgramIdModal) &&
        (!ttSemesterModal || Number(c.semester) === Number(ttSemesterModal))
    );
    const matchingIds = new Set(matching.map((c) => c.id));
    const others = bsList.filter((c) => !matchingIds.has(c.id));
    return { matching, others, all: bsList };
  }, [courses, allPrograms, ttProgramIdModal, ttSemesterModal]);

  const modalSelectedSubjectPeers = useMemo(() => {
    const primary = courses.find((c) => c.id === ttCourseId);
    if (!primary) return [];
    const targetKey = normalizeSubjectKey(primary.title, primary.code);
    if (!targetKey) return [];
    const bsProgMap = new Map(allPrograms.map((p) => [p.id, p]));
    const peers: Array<{ programId: string; programName: string; session: string; semester: string; courseId: string }> = [];
    const seen = new Set<string>();
    for (const c of courses) {
      if (!c.programId || !bsProgMap.has(c.programId)) continue;
      if (normalizeSubjectKey(c.title, c.code) !== targetKey) continue;
      const sess = (c.session || availableSessionOptions[0] || "2024-2028").trim();
      const sem = String(c.semester || 1);
      const dedupeKey = `${c.programId}__${sess}__${sem}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      peers.push({
        programId: c.programId,
        programName: bsProgMap.get(c.programId)?.name || "BS Program",
        session: sess,
        semester: sem,
        courseId: c.id,
      });
    }
    return peers.sort((a, b) => a.programName.localeCompare(b.programName) || Number(a.semester) - Number(b.semester));
  }, [courses, allPrograms, ttCourseId, availableSessionOptions]);

  const resolveCourseForCohort = (programId: string, semester: string, fallbackCourseId: string) => {
    const primary = courses.find((c) => c.id === fallbackCourseId);
    const primaryKey = primary ? normalizeSubjectKey(primary.title, primary.code) : "";
    const exact = courses.find(
      (c) =>
        c.programId === programId &&
        String(c.semester) === String(semester) &&
        (!primaryKey || normalizeSubjectKey(c.title, c.code) === primaryKey)
    );
    return exact?.id || fallbackCourseId;
  };

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

  // Shared helper to derive Center Summary mini-table (Semesters label & Program Student Counts)
  const buildCenterSummaryMeta = (
    targetProgramIds: string[],
    targetSemesters: number[]
  ) => {
    const cleanSems = Array.from(new Set(targetSemesters.filter((s) => s > 0))).sort((a, b) => a - b);
    let semesterLabel = "All Semesters";
    if (cleanSems.length === 1) {
      semesterLabel = `${toOrdinalUpper(cleanSems[0]).toLowerCase()} Semester`;
    } else if (cleanSems.length === 2) {
      semesterLabel = `${toOrdinalUpper(cleanSems[0]).toLowerCase()} and ${toOrdinalUpper(cleanSems[1]).toLowerCase()} Semesters`;
    } else if (cleanSems.length > 2 && cleanSems.length < 8) {
      semesterLabel = `${cleanSems.map((s) => toOrdinalUpper(s).toLowerCase()).join(", ")} Semesters`;
    }

    const activeProgs =
      targetProgramIds.length > 0
        ? allPrograms.filter((p) => targetProgramIds.includes(p.id))
        : allPrograms;

    const programCounts = activeProgs.map((p) => {
      const sum = studentCounts
        .filter((sc) => sc.programId === p.id && (cleanSems.length === 0 || (sc.semester && cleanSems.includes(sc.semester))))
        .reduce((acc, sc) => acc + sc.count, 0);
      return {
        name: p.name.replace(/^BS\s+/i, ""),
        count: sum,
      };
    });

    return { semesterLabel, programCounts };
  };

  const openAddManualTimetableModal = (
    presetMode: "single" | "combined" = "single",
    rec?: SharedSubjectRecommendation
  ) => {
    const defaultSession = tSession !== "ALL" ? tSession : (availableSessionOptions[0] || "2024-2028");
    const defaultProg = tProgramId !== "ALL" ? tProgramId : (allPrograms[0]?.id || "");
    const defaultSem = tSemester !== "0" ? tSemester : "1";

    setEditingTimetable(null);
    setError("");
    setTtCombinedGroupId(null);
    setTtApplyToCombinedGroup(true);
    setTtDay("Monday");
    setTtCustomDayMode(false);
    setTtStart("09:00");
    setTtEnd("10:00");

    if (rec) {
      const firstCohort = rec.cohorts[0];
      const primaryCid = firstCohort?.courseId || courses[0]?.id || "";
      setTtMode("combined");
      setTtProgramIdModal(firstCohort?.programId || defaultProg);
      setTtSessionModal(firstCohort?.session || defaultSession);
      setTtSemesterModal(String(firstCohort?.semester || defaultSem));
      setTtCourseId(primaryCid);
      setTtFacultyId(rec.suggestedFacultyId || faculties[0]?.id || "");
      setTtAllowCombinedSingle(true);
      setTtAllowOptionalParallel(rec.hasOptionalCourse);
      setTtCombinedCohorts(
        rec.cohorts.map((c) => ({
          programId: c.programId,
          session: c.session || defaultSession,
          semester: String(c.semester || 1),
          courseId: c.courseId,
        }))
      );
      setShowTimetableModal(true);
      return;
    }

    const matchingCourse =
      courses.find(
        (c) =>
          c.programId === defaultProg &&
          String(c.semester) === String(defaultSem)
      ) || courses[0];

    setTtMode(presetMode);
    setTtProgramIdModal(defaultProg);
    setTtSessionModal(defaultSession);
    setTtSemesterModal(defaultSem);
    setTtCourseId(matchingCourse?.id || "");
    setTtFacultyId(matchingCourse?.facultyId || faculties[0]?.id || "");
    setTtAllowCombinedSingle(presetMode === "combined");
    setTtAllowOptionalParallel(matchingCourse ? isOptionalSubjectCourse(matchingCourse) : false);

    if (presetMode === "combined") {
      const initRows = allPrograms.slice(0, Math.min(4, allPrograms.length)).map((p) => ({
        programId: p.id,
        session: defaultSession,
        semester: defaultSem,
        courseId: resolveCourseForCohort(p.id, defaultSem, matchingCourse?.id || ""),
      }));
      setTtCombinedCohorts(
        initRows.length > 0
          ? initRows
          : [{ programId: defaultProg, session: defaultSession, semester: defaultSem, courseId: matchingCourse?.id || "" }]
      );
    } else {
      setTtCombinedCohorts([
        {
          programId: defaultProg,
          session: defaultSession,
          semester: defaultSem,
          courseId: matchingCourse?.id || "",
        },
      ]);
    }
    setShowTimetableModal(true);
  };

  // Helper to open Timetable Edit modal cleanly from Matrix or List view
  const openEditTimetableSlot = (t: any) => {
    const combMeta = parseCombinedClassTag(t.classSectionId);
    const defaultSession = t.session || (availableSessionOptions[0] || "2024-2028");
    const siblings = combMeta.groupId
      ? timetables.filter(
          (row) => parseCombinedClassTag(row.classSectionId).groupId === combMeta.groupId
        )
      : [];

    setEditingTimetable(t);
    setError("");
    setTtProgramIdModal(t.programId || (allPrograms[0]?.id || ""));
    setTtSessionModal(defaultSession);
    setTtSemesterModal(t.semester?.toString() || "1");
    setTtDay(t.dayOfWeek);
    setTtCustomDayMode(!isSingleOrPresetDay(t.dayOfWeek));
    setTtStart(t.startTime);
    setTtEnd(t.endTime);
    setTtCourseId(t.courseId || "");
    setTtFacultyId(t.facultyId || "");
    setTtCombinedGroupId(combMeta.groupId);
    setTtAllowCombinedSingle(combMeta.isCombined);
    setTtAllowOptionalParallel(combMeta.isOptionalParallel);

    if (siblings.length > 1) {
      setTtMode("combined");
      setTtApplyToCombinedGroup(true);
      setTtCombinedCohorts(
        siblings.map((s) => ({
          programId: s.programId || (allPrograms[0]?.id || ""),
          session: s.session || defaultSession,
          semester: String(s.semester || 1),
          courseId: s.courseId || t.courseId || "",
        }))
      );
    } else {
      setTtMode("single");
      setTtApplyToCombinedGroup(false);
      setTtCombinedCohorts([
        {
          programId: t.programId || (allPrograms[0]?.id || ""),
          session: defaultSession,
          semester: String(t.semester || 1),
          courseId: t.courseId || "",
        },
      ]);
    }
    setShowTimetableModal(true);
  };

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
      if (Array.isArray((data as any).studentCounts)) {
        setStudentCounts((data as any).studentCounts);
      }
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
    if (ttMode === "combined" && ttCombinedCohorts.length === 0) {
      return alert("Please add at least one Program / Semester cohort for the combined class.");
    }
    setError("");
    const activeSession = ttSessionModal || availableSessionOptions[0] || "2024-2028";
    const res = await saveManualTimetable({
      id: editingTimetable?.id,
      session: activeSession,
      programId: ttProgramIdModal || (allPrograms[0]?.id || ""),
      departmentId: tDepartmentId !== "ALL" ? tDepartmentId : null,
      semester: ttSemesterModal || "1",
      courseId: ttCourseId,
      facultyId: ttFacultyId,
      dayOfWeek: ttDay,
      startTime: ttStart,
      endTime: ttEnd,
      allowCombinedSharedClass: ttMode === "combined" || ttAllowCombinedSingle,
      allowOptionalParallel: ttAllowOptionalParallel,
      combinedGroupId: ttCombinedGroupId,
      applyToCombinedGroup: ttMode === "combined" && Boolean(ttCombinedGroupId) && ttApplyToCombinedGroup,
      cohorts: ttMode === "combined" ? ttCombinedCohorts : undefined,
    });
    if (res.success) {
      setSuccess(
        res.count && res.count > 1
          ? `Combined class slot saved across ${res.count} cohorts under one teacher!`
          : "Timetable entry saved!"
      );
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

  const isMatrixPrintLandscape = activeTab === "timetable" && ttViewMode === "matrix";

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          @page {
            size: ${isMatrixPrintLandscape ? "letter landscape" : "letter portrait"};
            margin: ${isMatrixPrintLandscape ? "7mm 8mm" : "8mm 9mm"};
          }
          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <PortalPageHeader
        title={<>Timetable &amp; Datesheet</>}
        subtitle="Manage weekly class schedules, examination datesheets, faculty invigilation duties, and superintendent hall rosters."
        icon={
          collegeLogo ? (
            <img src={collegeLogo} alt="Logo" className="w-8 h-8 object-contain" />
          ) : (
            <Calendar className="w-6 h-6" />
          )
        }
        badge={
          <span className="px-2.5 py-0.5 text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
            BS Academic Schedule &amp; Exams
          </span>
        }
      >
        <div className="text-xs font-bold px-3.5 py-1.5 bg-[#047857] text-white rounded-xl shadow-2xs flex items-center gap-1.5 shrink-0">
          <span>🏛️</span>
          <span>BS Academic ERP</span>
        </div>
      </PortalPageHeader>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-semibold text-xs print:hidden">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 font-semibold text-xs print:hidden">{success}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none print:rounded-none print:overflow-visible">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white flex-wrap print:hidden">
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

        <div className="p-6 print:p-0">
          {/* ----------------- TIMETABLE TAB ----------------- */}
          {activeTab === "timetable" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl border border-gray-200 bg-white print:hidden">
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

              <div className="flex flex-wrap gap-2.5 items-center justify-between print:hidden">
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
                    onClick={() => openAddManualTimetableModal("single")}
                    className="px-3.5 py-2 bg-[#7c00e6] hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>➕</span>
                    <span>Add Manual Slot</span>
                  </button>
                  <button
                    onClick={() => openAddManualTimetableModal("combined")}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    title="Assign one teacher to 4-6 programs or cross-semester/session cohorts together"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Combine Programs / Sems</span>
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

                <div className="flex gap-2.5 items-center flex-wrap">
                  <label className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Import Timetable</span>
                    <input type="file" accept=".csv, .tsv, .txt" onChange={handleImportTimetableCSV} className="hidden" />
                  </label>

                  <button
                    onClick={() => {
                      setImportEntity("Timetable");
                      setPasteModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    title="Paste copied rows from Excel"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Paste Excel</span>
                  </button>

                  <button
                    onClick={handleDownloadTimetableTemplate}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    title="Download Timetable CSV format template"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Template</span>
                  </button>

                  <button
                    onClick={exportTimetableCSV}
                    className="px-3.5 py-2 bg-[#046c4e] hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📥</span>
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📄</span>
                    <span>Export PDF / Print</span>
                  </button>
                </div>
              </div>

              {/* Finalization Status Banner */}
              {timetables.length > 0 && (
                <div className={`flex items-center justify-between flex-wrap gap-2 px-4 py-3 rounded-xl border text-xs font-semibold print:hidden ${
                  timetableFinalized
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-[#fffbeb] border-[#fde68a] text-[#92400e]"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{timetableFinalized ? "✅" : "⚠️"}</span>
                    <span>
                      {timetableFinalized
                        ? `Timetable is FINALIZED — Date Sheet can be generated from this timetable.`
                        : `Timetable is NOT FINALIZED — Publish and click "Finalize Timetable" before generating the Date Sheet.`
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setTtViewMode("matrix")}
                      className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${ttViewMode === "matrix"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      📊 Official Matrix Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setTtViewMode("list")}
                      className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${ttViewMode === "list"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      📋 Detailed Slot List
                    </button>
                  </div>
                </div>
              )}

              {/* Smart Shared / Combined & Optional Subject Recommendations */}
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-emerald-50/60 p-4 space-y-3 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-2 flex-wrap">
                        <span>Smart Combined &amp; Optional Class Recommendations</span>
                        {sharedRecommendations.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                            {sharedRecommendations.length} Suggested Group{sharedRecommendations.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Combine common courses (e.g. Functional English across 4–6 programs), cross-semester/session cohorts (e.g. Pak Study 1st Sem + 2nd Sem), or same-semester optional subjects under 1 teacher.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openAddManualTimetableModal("combined")}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Custom Combined Class</span>
                    </button>
                    {sharedRecommendations.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowRecommendationsPanel((p) => !p)}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                      >
                        {showRecommendationsPanel ? "Hide Suggestions" : `Show Suggestions (${sharedRecommendations.length})`}
                      </button>
                    )}
                  </div>
                </div>

                {showRecommendationsPanel && sharedRecommendations.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                    {sharedRecommendations.slice(0, 6).map((rec) => {
                      const catStyle =
                        rec.category === "CROSS_SEMESTER_SESSION"
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : rec.category === "OPTIONAL_ELECTIVE"
                            ? "bg-teal-100 text-teal-900 border-teal-300"
                            : "bg-indigo-100 text-indigo-900 border-indigo-300";
                      return (
                        <div
                          key={rec.key}
                          className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-col justify-between gap-2.5"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-black text-xs text-slate-900 leading-snug">
                                {rec.displayTitle}
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black border shrink-0 ${catStyle}`}>
                                {rec.badgeLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">
                              {rec.recommendationNote}
                            </p>
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {rec.cohorts.slice(0, 6).map((c) => (
                                <span
                                  key={`${rec.key}-${c.programId}-${c.semester}-${c.session}`}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700"
                                >
                                  {c.programName} • S{c.semester} ({c.session})
                                </span>
                              ))}
                              {rec.cohorts.length > 6 && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500">
                                  +{rec.cohorts.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            <span className="text-[10.5px] font-semibold text-slate-600 truncate">
                              👩‍🏫 {rec.suggestedFacultyName || "Assign Faculty in Modal"}
                            </span>
                            <button
                              type="button"
                              onClick={() => openAddManualTimetableModal("combined", rec)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                            >
                              Combine ({rec.cohorts.length})
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {loading ? (
                <p className="text-center py-12 text-gray-400">Loading Timetable Entries...</p>
              ) : timetables.length === 0 ? (
                <div className="text-center py-12 border rounded-xl space-y-3 print:hidden">
                  <p className="text-gray-500 text-sm font-semibold">No timetable entries found for this selection.</p>
                  <button
                    onClick={handleAutoGenerateTimetable}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                  >
                    ⚡ Auto-Generate Master Timetable Now
                  </button>
                </div>
              ) : ttViewMode === "matrix" ? (
                <OfficialTimetableMatrixReport
                  collegeName={collegeName}
                  collegeLogo={collegeLogo}
                  collegeTagline={collegeTagline}
                  timetables={timetables}
                  selectedSemester={tSemester}
                  selectedSession={tSession}
                  onEditSlot={openEditTimetableSlot}
                />
              ) : (
                <>
                  {/* Printable Header */}
                  <div className="hidden print:block text-center border-b-2 border-gray-800 pb-3 space-y-1">
                    {collegeLogo && <img src={collegeLogo} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-1" />}
                    <h2 className="text-xl font-black text-gray-900 uppercase">{collegeName}</h2>
                    <p className="text-xs font-bold text-blue-600 uppercase">{collegeTagline}</p>
                    <h3 className="text-sm font-bold text-gray-800 uppercase pt-1">
                      BS Class Schedule / Master Timetable Sheet
                    </h3>
                  </div>

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
                          {timetables.map((t) => {
                            const combMeta = parseCombinedClassTag(t.classSectionId);
                            return (
                              <tr key={t.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-bold text-blue-900">{t.dayOfWeek}</td>
                                <td className="p-3 font-mono font-bold text-gray-700">{t.startTime} - {t.endTime}</td>
                                <td className="p-3 font-bold text-gray-900">
                                  <span>{formatCourseLabel(t.course?.title, t.course?.code)}</span>
                                </td>
                                <td className="p-3 font-semibold text-indigo-900">{t.faculty?.user?.name || "TBA"}</td>
                                <td className="p-3 text-xs text-gray-600 font-semibold">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span>{t.program?.name} - Sem {t.semester} ({t.session})</span>
                                    {combMeta.isCombined && (
                                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-black">
                                        Joint / Combined
                                      </span>
                                    )}
                                    {combMeta.isOptionalParallel && (
                                      <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-black">
                                        Optional
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${t.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
                                    {t.status}
                                  </span>
                                </td>
                                <td className="p-3 print:hidden flex gap-2 items-center">
                                  <button
                                    onClick={() => openEditTimetableSlot(t)}
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ----------------- DATESHEET TAB ----------------- */}
          {activeTab === "datesheet" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 rounded-2xl border border-gray-200 bg-white print:hidden">
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

              {/* Excluded Exam Dates & Center Report Metadata Strip */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 print:hidden">
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

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Center No</label>
                    <input
                      type="text"
                      value={centerNumber}
                      onChange={(e) => setCenterNumber(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Exam Center / Block</label>
                    <input
                      type="text"
                      value={examHallName}
                      onChange={(e) => setExamHallName(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 items-center justify-between print:hidden">
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

                <div className="flex gap-2.5 items-center flex-wrap">
                  <label className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Import Datesheet</span>
                    <input type="file" accept=".csv, .tsv, .txt" onChange={handleImportDatesheetCSV} className="hidden" />
                  </label>

                  <button
                    onClick={() => {
                      setImportEntity("Datesheet");
                      setPasteModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    title="Paste copied rows from Excel"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Paste Excel</span>
                  </button>

                  <button
                    onClick={handleDownloadDatesheetTemplate}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    title="Download Datesheet CSV format template"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Template</span>
                  </button>

                  <button
                    onClick={exportDatesheetCSV}
                    className="px-3.5 py-2 bg-[#046c4e] hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📥</span>
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📄</span>
                    <span>Export PDF / Print</span>
                  </button>
                </div>
              </div>

              {/* Datesheet Finalization Status Banner */}
              {datesheets.length > 0 && (
                <div className={`flex items-center justify-between flex-wrap gap-2 px-4 py-2 rounded-xl border text-sm font-semibold print:hidden ${
                  datesheetFinalized
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{datesheetFinalized ? "✅" : "⚠️"}</span>
                    <span className="text-xs sm:text-sm">
                      {datesheetFinalized
                        ? "Date Sheet is FINALIZED — This is the official exam schedule. Exam Duty and Result Entry are now unlocked."
                        : "Date Sheet is NOT FINALIZED — Publish and click \"Finalize Date Sheet\" to make it official."
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setDsViewMode("official")}
                      className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${dsViewMode === "official"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      📜 Official Exam Sheet
                    </button>
                    <button
                      type="button"
                      onClick={() => setDsViewMode("list")}
                      className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${dsViewMode === "list"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      📋 Detailed Datesheet List
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <p className="text-center py-12 text-gray-400">Loading Exam Datesheet Entries...</p>
              ) : datesheets.length === 0 ? (
                <div className="text-center py-12 border rounded-xl space-y-3 print:hidden">
                  <p className="text-gray-500 text-sm font-semibold">No exam datesheet generated yet.</p>
                  <button
                    onClick={handleAutoGenerateDatesheet}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                  >
                    ⚡ Auto-Generate Master Datesheet Now
                  </button>
                </div>
              ) : dsViewMode === "official" ? (
                (() => {
                  const dsProgIds = Array.from(new Set(datesheets.map((d) => d.programId).filter(Boolean))) as string[];
                  const dsSems = Array.from(new Set(datesheets.map((d) => d.semester).filter(Boolean))) as number[];
                  const { semesterLabel, programCounts } = buildCenterSummaryMeta(dsProgIds, dsSems);
                  const examTitle =
                    dExamType === "FINAL_TERM"
                      ? "OFFICIAL FINAL TERM EXAMINATION DATE SHEET"
                      : dExamType === "MID_TERM"
                        ? "OFFICIAL MID TERM EXAMINATION DATE SHEET"
                        : "OFFICIAL TERMINAL EXAMINATION DATE SHEET";
                  return (
                    <OfficialExamCenterReport
                      variant="datesheet"
                      collegeName={collegeName}
                      collegeLogo={collegeLogo}
                      collegeTagline={collegeTagline}
                      centerNumber={centerNumber}
                      centerLocation={examHallName}
                      superintendentName={superintendentName}
                      superintendentDepartment={superintendentDepartment}
                      deputySuperintendent={deputySuperintendent}
                      mobileCollector={mobileCollector}
                      dutyNote={dutyNote}
                      examTitle={examTitle}
                      sessionLabel={dSession !== "ALL" ? dSession : undefined}
                      semesterLabel={semesterLabel}
                      programCounts={programCounts}
                      datesheetRows={datesheets.map((d) => ({
                        id: d.id,
                        date: d.date,
                        startTime: d.startTime,
                        endTime: d.endTime,
                        courseTitle: d.course?.title || "Subject",
                        courseCode: d.course?.code,
                        programName: d.program?.name || "BS Program",
                        semester: d.semester,
                        session: d.session,
                        examType: d.examType,
                        hall: examHallName,
                      }))}
                    />
                  );
                })()
              ) : (
                <>
                  {/* Printable Header */}
                  <div className="hidden print:block text-center border-b-2 border-gray-800 pb-3 space-y-1">
                    {collegeLogo && <img src={collegeLogo} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-1" />}
                    <h2 className="text-xl font-black text-gray-900 uppercase">{collegeName}</h2>
                    <p className="text-xs font-bold text-blue-600 uppercase">{collegeTagline}</p>
                    <h3 className="text-sm font-bold text-gray-800 uppercase pt-1">
                      Examination Master Datesheet Sheet (Commencing: {examStartDate})
                    </h3>
                  </div>

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
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ----------------- EXAM DUTY TAB ----------------- */}
          {activeTab === "examduty" && (
            <div className="space-y-5">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-5 rounded-2xl shadow-md print:hidden">
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
                <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl space-y-2 print:hidden">
                  <div className="font-bold text-amber-800 text-sm flex items-center gap-2">
                    <span>⚠️</span> Duty Generation Warnings ({dutyWarnings.length})
                  </div>
                  {dutyWarnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-700 font-semibold pl-5">{w}</p>
                  ))}
                </div>
              )}

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 print:hidden">
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

              {/* Center Metadata Strip for Official Sheet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs print:hidden">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Center No</label>
                  <input
                    type="text"
                    value={centerNumber}
                    onChange={(e) => setCenterNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Center / Block</label>
                  <input
                    type="text"
                    value={examHallName}
                    onChange={(e) => setExamHallName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Center Superintendent</label>
                  <input
                    type="text"
                    value={superintendentName}
                    onChange={(e) => setSuperintendentName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Mobile Collector Officer</label>
                  <input
                    type="text"
                    value={mobileCollector}
                    onChange={(e) => setMobileCollector(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 items-center justify-between print:hidden">
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
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDbDutyViewMode("official")}
                      className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-all ${dbDutyViewMode === "official"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-white"
                        }`}
                    >
                      📄 Official Center Sheet
                    </button>
                    <button
                      type="button"
                      onClick={() => setDbDutyViewMode("list")}
                      className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-all ${dbDutyViewMode === "list"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-white"
                        }`}
                    >
                      📋 Detailed Table
                    </button>
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
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    📥 Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    📄 Export PDF / Print
                  </button>
                </div>
              </div>

              {/* Duty View */}
              {dbDuties.length === 0 ? (
                <div className="text-center py-12 border rounded-xl space-y-3 print:hidden">
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
              ) : dbDutyViewMode === "official" ? (
                (() => {
                  const dutyProgIds = Array.from(new Set(dbDuties.map((d) => d.datesheet?.programId).filter(Boolean))) as string[];
                  const dutySems = Array.from(new Set(dbDuties.map((d) => d.datesheet?.semester).filter(Boolean))) as number[];
                  const { semesterLabel, programCounts } = buildCenterSummaryMeta(dutyProgIds, dutySems);
                  return (
                    <OfficialExamCenterReport
                      variant="duty"
                      collegeName={collegeName}
                      collegeLogo={collegeLogo}
                      collegeTagline={collegeTagline}
                      centerNumber={centerNumber}
                      centerLocation={examHallName}
                      superintendentName={superintendentName}
                      superintendentDepartment={superintendentDepartment}
                      deputySuperintendent={deputySuperintendent}
                      mobileCollector={mobileCollector}
                      dutyNote={dutyNote}
                      sessionLabel={dutySession !== "ALL" ? dutySession : undefined}
                      semesterLabel={semesterLabel}
                      programCounts={programCounts}
                      dutyRows={dbDuties.map((d) => ({
                        id: d.id,
                        date: d.datesheet?.date,
                        shiftTime: d.shiftTime || (d.datesheet?.startTime ? `${d.datesheet.startTime} - ${d.datesheet.endTime}` : ""),
                        courseTitle: d.datesheet?.course?.title,
                        courseCode: d.datesheet?.course?.code,
                        facultyName: d.faculty?.user?.name || "TBA",
                        facultyDept: d.faculty?.department?.name || d.faculty?.designation || undefined,
                        dutyType: d.dutyType,
                        isMandatory: Boolean(d.isMandatory),
                        hall: d.room || examHallName,
                      }))}
                    />
                  );
                })()
              ) : (
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
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="p-3 font-semibold text-gray-600">Exam Date</th>
                          <th className="p-3 font-semibold text-gray-600">Course</th>
                          <th className="p-3 font-semibold text-gray-600">Shift</th>
                          <th className="p-3 font-semibold text-gray-600">Faculty / Invigilator</th>
                          <th className="p-3 font-semibold text-gray-600">Duty Type</th>
                          <th className="p-3 font-semibold text-gray-600">Room</th>
                          <th className="p-3 font-semibold text-gray-600 print:hidden">Actions</th>
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
                              <div className="text-xs text-gray-400">{duty.faculty?.department?.name || duty.faculty?.designation}</div>
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
                            <td className="p-3 print:hidden">
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
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ----------------- TAB 3: CHIEF SUPERINTENDENT DUTY ROSTER ----------------- */}
          {activeTab === "superintendent" && (

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between flex-wrap gap-4 print:hidden">
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
              <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-3 rounded-xl border print:hidden">
                <div className="flex items-center gap-2 flex-wrap">
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
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSuptViewMode("official")}
                    className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-all ${suptViewMode === "official"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-white"
                      }`}
                  >
                    📄 Official Center Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuptViewMode("list")}
                    className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-all ${suptViewMode === "list"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-white"
                      }`}
                  >
                    📋 Editable Roster Table
                  </button>
                </div>
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

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Center No</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-gray-900"
                      value={centerNumber}
                      onChange={(e) => setCenterNumber(e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Examination Center / Main Hall</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-gray-900"
                      value={examHallName}
                      onChange={(e) => setExamHallName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile Collector Officer</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-gray-900"
                      value={mobileCollector}
                      onChange={(e) => setMobileCollector(e.target.value)}
                      placeholder="e.g. Mr. Munir Ahmed (Botany LAB)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Official Note (Printed Footer)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-xs font-semibold text-gray-800"
                      value={dutyNote}
                      onChange={(e) => setDutyNote(e.target.value)}
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
              {displaySuptList.length > 0 && suptViewMode === "official" ? (
                (() => {
                  const targetProgIds =
                    selectedSuptPrograms.length > 0
                      ? allPrograms.filter((p) => selectedSuptPrograms.includes(p.name)).map((p) => p.id)
                      : allPrograms.map((p) => p.id);
                  const { semesterLabel, programCounts } = buildCenterSummaryMeta(targetProgIds, selectedSuptSemesters);
                  return (
                    <OfficialExamCenterReport
                      variant="duty"
                      collegeName={collegeName}
                      collegeLogo={collegeLogo}
                      collegeTagline={collegeTagline}
                      centerNumber={centerNumber}
                      centerLocation={examHallName}
                      superintendentName={superintendentName}
                      superintendentDepartment={superintendentDepartment}
                      deputySuperintendent={deputySuperintendent}
                      mobileCollector={mobileCollector}
                      dutyNote={dutyNote}
                      sessionLabel={selectedSuptSessions.join(", ") || undefined}
                      semesterLabel={semesterLabel}
                      programCounts={programCounts}
                      dutyRows={displaySuptList.map((d) => {
                        const matchedDuty = duties.find((item) => `auto_supt_${item.id}` === d.id);
                        const personName = matchedDuty?.invigilator || d.chief || superintendentName;
                        const facMatch = faculties.find((f) => f.user?.name === personName);
                        const dept = facMatch?.department?.name || d.department || superintendentDepartment;
                        return {
                          id: d.id,
                          date: d.date,
                          shiftTime: d.time,
                          courseTitle: d.course,
                          facultyName: personName,
                          facultyDept: dept,
                          hall: d.hall,
                        };
                      })}
                    />
                  );
                })()
              ) : (
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
                      <div className="text-center py-12 space-y-3 print:hidden">
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
              )}
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
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-blue-200">
                    <button
                      type="button"
                      onClick={() => setStaffDutyViewMode("official")}
                      className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-all ${staffDutyViewMode === "official"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      📄 Official Center Sheet
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffDutyViewMode("list")}
                      className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-all ${staffDutyViewMode === "list"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      📋 Editable Duty List
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-blue-900 uppercase mb-1">Max Duties / Faculty</label>
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
                    <label className="block font-bold text-blue-900 uppercase mb-1">Center No</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-xs font-bold text-gray-900 bg-white"
                      value={centerNumber}
                      onChange={(e) => setCenterNumber(e.target.value)}
                    />
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
                  <div>
                    <label className="block font-bold text-blue-900 uppercase mb-1">Mobile Collector Officer</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-xs font-bold text-gray-900 bg-white"
                      value={mobileCollector}
                      onChange={(e) => setMobileCollector(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {displayDuties.length > 0 && staffDutyViewMode === "official" ? (
                (() => {
                  const targetProgIds =
                    isHallMerged && selectedMergedPrograms.length > 0
                      ? allPrograms.filter((p) => selectedMergedPrograms.includes(p.name)).map((p) => p.id)
                      : allPrograms.map((p) => p.id);
                  const { semesterLabel, programCounts } = buildCenterSummaryMeta(targetProgIds, selectedSuptSemesters);
                  return (
                    <OfficialExamCenterReport
                      variant="duty"
                      collegeName={collegeName}
                      collegeLogo={collegeLogo}
                      collegeTagline={collegeTagline}
                      centerNumber={centerNumber}
                      centerLocation={examHallName}
                      superintendentName={superintendentName}
                      superintendentDepartment={superintendentDepartment}
                      deputySuperintendent={deputySuperintendent}
                      mobileCollector={mobileCollector}
                      dutyNote={dutyNote}
                      semesterLabel={semesterLabel}
                      programCounts={programCounts}
                      dutyRows={displayDuties.map((d) => {
                        const facMatch = faculties.find((f) => f.user?.name === d.invigilator);
                        return {
                          id: d.id,
                          date: d.date,
                          shiftTime: d.time,
                          courseTitle: d.course,
                          courseCode: d.courseCode,
                          facultyName: d.invigilator || "TBA",
                          facultyDept: facMatch?.department?.name || facMatch?.designation || undefined,
                          hall: d.hall,
                        };
                      })}
                    />
                  );
                })()
              ) : (
                <>
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
                      <div className="text-center py-12 space-y-3 print:hidden">
                        <p className="text-gray-500 text-sm font-semibold">No invigilation duties found.</p>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={handleAutoGenerateDatesheet}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                          >
                            ⚡ Auto-Generate Exam Dates &amp; Duties
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
                      <div className="font-bold text-gray-800">Chief Superintendent / Principal Signature &amp; Stamp</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- MODAL 1: MANUAL TIMETABLE ENTRY (SINGLE & COMBINED / MULTI-COHORT) ---------------- */}
      {showTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-xl w-full max-h-[92vh] overflow-y-auto space-y-4 ${ttMode === "combined" ? "max-w-2xl" : "max-w-lg"}`}>
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {editingTimetable
                    ? ttMode === "combined"
                      ? "✏️ Edit Combined / Joint Timetable Slot"
                      : "✏️ Edit Timetable Slot"
                    : ttMode === "combined"
                      ? "🔗 Schedule Combined / Joint Class"
                      : "➕ Add Manual Timetable Slot"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Schedule a single class or combine multiple Programs, Sessions &amp; Semesters under one teacher.
                </p>
              </div>
              <button
                onClick={() => setShowTimetableModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTtMode("single")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${ttMode === "single"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                📘 Single Program / Sem
              </button>
              <button
                type="button"
                onClick={() => {
                  setTtMode("combined");
                  if (ttCombinedCohorts.length === 0) {
                    const sess = ttSessionModal || availableSessionOptions[0] || "2024-2028";
                    const prog = ttProgramIdModal || allPrograms[0]?.id || "";
                    const sem = ttSemesterModal || "1";
                    setTtCombinedCohorts(
                      modalSelectedSubjectPeers.length >= 2
                        ? modalSelectedSubjectPeers.map((p) => ({
                            programId: p.programId,
                            session: p.session,
                            semester: p.semester,
                            courseId: p.courseId,
                          }))
                        : [{ programId: prog, session: sess, semester: sem, courseId: ttCourseId }]
                    );
                  }
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${ttMode === "combined"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Combined Class (4–6 Progs / Cross-Sem)</span>
              </button>
            </div>

            <form onSubmit={handleSaveManualTT} className="space-y-4">
              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              {ttMode === "single" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      {availableSessionOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
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
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Day of Week {ttMode === "combined" ? "(Shared Schedule)" : ""}
                </label>
                <select
                  value={ttCustomDayMode || !isSingleOrPresetDay(ttDay) ? "__CUSTOM__" : ttDay}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__CUSTOM__") {
                      setTtCustomDayMode(true);
                      if (expandTimetableDays(ttDay).length <= 1) {
                        setTtDay("Mon, Tue, Thu");
                      }
                    } else {
                      setTtCustomDayMode(false);
                      setTtDay(val);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                >
                  <optgroup label="Single Day">
                    {TIMETABLE_WEEKDAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Day Groups (First / Last Days)">
                    {TIMETABLE_DAY_PRESETS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Custom Multiple Days">
                    <option value="__CUSTOM__">Custom Days (e.g. Mon, Tue, Thu)</option>
                  </optgroup>
                </select>
              </div>

              {(ttCustomDayMode || !isSingleOrPresetDay(ttDay)) && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Select Custom Days:</span>
                    <span className="text-[10px] font-semibold text-blue-700">{ttDay}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {TIMETABLE_WEEKDAYS.map((day) => {
                      const activeDays = expandTimetableDays(ttDay);
                      const isSelected = activeDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const next: TimetableWeekday[] = isSelected
                              ? activeDays.filter((d) => d !== day)
                              : [...activeDays, day];
                            if (next.length === 0) return;
                            setTtDay(formatSelectedDaysValue(next));
                          }}
                          className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                        >
                          {DAY_ABBREV[day]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {expandTimetableDays(ttDay).length > 1 && (
                <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] font-semibold text-indigo-800">
                  Scheduled Days: {expandTimetableDays(ttDay).join(", ")}
                </div>
              )}

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Course / Subject</label>
                  <select
                    value={ttCourseId}
                    onChange={(e) => {
                      const nextCid = e.target.value;
                      setTtCourseId(nextCid);
                      const chosen = courses.find((c) => c.id === nextCid);
                      if (chosen) {
                        setTtAllowOptionalParallel(isOptionalSubjectCourse(chosen));
                        if (ttMode === "combined") {
                          setTtCombinedCohorts((prev) =>
                            prev.map((row) => ({
                              ...row,
                              courseId: resolveCourseForCohort(row.programId, row.semester, nextCid),
                            }))
                          );
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-bold"
                  >
                    <option value="">-- Select Course --</option>
                    {bsCoursesSorted.matching.length > 0 && (
                      <optgroup label="Selected Program & Semester Courses">
                        {bsCoursesSorted.matching.map((c) => (
                          <option key={c.id} value={c.id}>
                            {formatCourseLabel(c.title, c.code)}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label={bsCoursesSorted.matching.length > 0 ? "All Other BS / Shared Courses" : "All BS Courses"}>
                      {bsCoursesSorted.others.map((c) => (
                        <option key={c.id} value={c.id}>
                          {formatCourseLabel(c.title, c.code)}{c.program?.name ? ` — ${c.program.name} (S${c.semester})` : ""}
                        </option>
                      ))}
                    </optgroup>
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
              </div>

              {/* Smart inline peer detection inside Modal */}
              {modalSelectedSubjectPeers.length > 1 && (
                <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-amber-950">
                      💡 Recommendation: {modalSelectedSubjectPeers.length} cohorts take this subject across programs / semesters / sessions
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTtMode("combined");
                        setTtAllowCombinedSingle(true);
                        setTtCombinedCohorts(
                          modalSelectedSubjectPeers.map((p) => ({
                            programId: p.programId,
                            session: p.session,
                            semester: p.semester,
                            courseId: p.courseId,
                          }))
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      Combine All ({modalSelectedSubjectPeers.length}) Under 1 Teacher
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {modalSelectedSubjectPeers.map((p) => (
                      <span
                        key={`${p.programId}-${p.semester}-${p.session}`}
                        className="px-1.5 py-0.5 rounded bg-white border border-amber-200 text-[10px] font-semibold text-amber-900"
                      >
                        {p.programName} • Sem {p.semester} ({p.session})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Combined / Multi-Cohort Target List */}
              {ttMode === "combined" && (
                <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-indigo-950">
                        Participating Cohorts ({ttCombinedCohorts.length} Classes Combined Together)
                      </h4>
                      <p className="text-[10.5px] text-slate-600">
                        Mix 4–6 BS programs OR different Semesters &amp; Sessions (e.g. Sem 1 2022-2026 + Sem 2 2023-2027) in this same slot.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {allPrograms.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const sess = ttSessionModal || availableSessionOptions[0] || "2024-2028";
                            const sem = ttSemesterModal || "1";
                            const targetProgs = allPrograms.slice(0, Math.min(6, allPrograms.length));
                            setTtCombinedCohorts(
                              targetProgs.map((p) => ({
                                programId: p.id,
                                session: sess,
                                semester: sem,
                                courseId: resolveCourseForCohort(p.id, sem, ttCourseId),
                              }))
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold cursor-pointer"
                        >
                          Select {Math.min(6, allPrograms.length)} Programs (Sem {ttSemesterModal})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const sess = ttSessionModal || availableSessionOptions[0] || "2024-2028";
                          const nextProg =
                            allPrograms.find((p) => !ttCombinedCohorts.some((c) => c.programId === p.id))?.id ||
                            allPrograms[0]?.id ||
                            "";
                          const sem = ttSemesterModal || "1";
                          setTtCombinedCohorts((prev) => [
                            ...prev,
                            {
                              programId: nextProg,
                              session: sess,
                              semester: sem,
                              courseId: resolveCourseForCohort(nextProg, sem, ttCourseId),
                            },
                          ]);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Cohort Row</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick-Toggle BS Program Chips for fast 4-6 program combining */}
                  {allPrograms.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                        Quick-Add BS Programs (Uses Sem {ttSemesterModal} • {ttSessionModal || availableSessionOptions[0]}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {allPrograms.map((p) => {
                          const isIncluded = ttCombinedCohorts.some((c) => c.programId === p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                if (isIncluded) {
                                  if (ttCombinedCohorts.length <= 1) return;
                                  setTtCombinedCohorts((prev) => prev.filter((c) => c.programId !== p.id));
                                } else {
                                  const sess = ttSessionModal || availableSessionOptions[0] || "2024-2028";
                                  const sem = ttSemesterModal || "1";
                                  setTtCombinedCohorts((prev) => [
                                    ...prev,
                                    {
                                      programId: p.id,
                                      session: sess,
                                      semester: sem,
                                      courseId: resolveCourseForCohort(p.id, sem, ttCourseId),
                                    },
                                  ]);
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${isIncluded
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50"
                                }`}
                            >
                              {isIncluded ? "✓ " : "+ "}
                              {p.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Per-Cohort Program / Session / Semester / Course Table */}
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {ttCombinedCohorts.map((row, idx) => (
                      <div
                        key={`cohort-${idx}`}
                        className="grid grid-cols-12 gap-1.5 items-center bg-white p-2 rounded-lg border border-indigo-100 shadow-2xs"
                      >
                        <div className="col-span-5">
                          <select
                            value={row.programId}
                            onChange={(e) => {
                              const nextProg = e.target.value;
                              setTtCombinedCohorts((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? {
                                        ...item,
                                        programId: nextProg,
                                        courseId: resolveCourseForCohort(nextProg, item.semester, ttCourseId),
                                      }
                                    : item
                                )
                              );
                            }}
                            className="w-full px-2 py-1.5 border rounded text-[11px] font-bold bg-white"
                          >
                            {allPrograms.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <select
                            value={row.session}
                            onChange={(e) => {
                              const nextSess = e.target.value;
                              setTtCombinedCohorts((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, session: nextSess } : item))
                              );
                            }}
                            className="w-full px-2 py-1.5 border rounded text-[11px] font-bold bg-white"
                          >
                            {availableSessionOptions.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <select
                            value={row.semester}
                            onChange={(e) => {
                              const nextSem = e.target.value;
                              setTtCombinedCohorts((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? {
                                        ...item,
                                        semester: nextSem,
                                        courseId: resolveCourseForCohort(item.programId, nextSem, ttCourseId),
                                      }
                                    : item
                                )
                              );
                            }}
                            className="w-full px-2 py-1.5 border rounded text-[11px] font-bold bg-white"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                              <option key={s} value={String(s)}>
                                Sem {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            disabled={ttCombinedCohorts.length <= 1}
                            onClick={() =>
                              setTtCombinedCohorts((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded disabled:opacity-30 cursor-pointer"
                            title="Remove cohort"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {editingTimetable && ttCombinedGroupId && (
                    <label className="flex items-center gap-2 text-[11px] font-bold text-indigo-900 pt-1">
                      <input
                        type="checkbox"
                        checked={ttApplyToCombinedGroup}
                        onChange={(e) => setTtApplyToCombinedGroup(e.target.checked)}
                        className="rounded accent-indigo-600"
                      />
                      <span>Update all participating cohorts in this Combined Group together</span>
                    </label>
                  )}
                </div>
              )}

              {/* Flexibility Toggles for Single & Combined Classes */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                {ttMode === "single" && (
                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ttAllowCombinedSingle}
                      onChange={(e) => setTtAllowCombinedSingle(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span>Joint / Combined Class — allow same teacher to share this subject time slot across multiple programs/semesters</span>
                  </label>
                )}
                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ttAllowOptionalParallel}
                    onChange={(e) => setTtAllowOptionalParallel(e.target.checked)}
                    className="rounded accent-teal-600"
                  />
                  <span>Optional / Elective Parallel Subject — allow scheduling at the same time as another elective in the same semester</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowTimetableModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer"
                >
                  {ttMode === "combined"
                    ? `Save Combined Slot (${ttCombinedCohorts.length})`
                    : "Save Entry"}
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
      {/* Paste Excel Data Modal */}
      {pasteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  Paste {importEntity} Data
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Copy table rows from Excel or Google Sheets (Ctrl+C) and paste below (Ctrl+V).
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
              placeholder={
                importEntity === "Timetable"
                  ? "Day\tStart Time\tEnd Time\tCourse\tSemester\tTeacher\tRoom\tProgram\nMonday\t09:00\t10:00\tCS-101 Programming Fundamentals\t1\tProf. Tariq Mehmood\tLab 1\tBS Computer Science"
                  : "Exam Date\tStart Time\tEnd Time\tCourse\tSemester\tExam Type\tRoom\tProgram\n2026-06-15\t09:30\t12:30\tCS-101 Programming Fundamentals\t1\tFINAL_TERM\tExamination Hall A\tBS Computer Science"
              }
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
        onConfirmImport={handleConfirmEntityImport}
        validationData={validationData}
        isImporting={isImporting}
        entityName={importEntity}
        sourceName={importSourceName}
      />

      {/* Import Summary Modal */}
      {importSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  {importEntity} Import Summary
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Results of {importEntity.toLowerCase()} batch import</p>
              </div>
              <button
                onClick={() => setImportSummary(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-xl font-bold text-emerald-700">{importSummary.imported || 0}</div>
                <div className="text-xs text-emerald-600 font-medium">Added to Schedule</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <div className="text-xl font-bold text-rose-700">{importSummary.failed || 0}</div>
                <div className="text-xs text-rose-600 font-medium">Failed</div>
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
