"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Users,
  Search,
  RefreshCw,
  Sparkles,
  BookOpen,
  ChevronRight
} from "lucide-react";
import { sortStudentsByRoll } from "@/lib/domainParsers";

interface ResultsPromotionTabProps {
  sharedFilters: {
    session: string;
    programId: string;
    semester: string;
    courseId: string;
    progType: string;
  };
  setSharedFilters: React.Dispatch<React.SetStateAction<any>>;
  onNavigateToMarks?: (nextSem: number) => void;
  onNavigateToAttendance?: (nextSem: number) => void;
}

export default function ResultsPromotionTab({
  sharedFilters,
  setSharedFilters,
  onNavigateToMarks,
  onNavigateToAttendance,
}: ResultsPromotionTabProps) {
  const [programs, setPrograms] = useState<any[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState(sharedFilters.programId || "");
  const [selectedSession, setSelectedSession] = useState(sharedFilters.session || "2022-2026");
  const [selectedSemester, setSelectedSemester] = useState<number>(
    parseInt(sharedFilters.semester || "1") || 1
  );

  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [promotionSuccess, setPromotionSuccess] = useState<{
    promotedCount: number;
    toSemester: number;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const nextSemester = Math.min(8, selectedSemester + 1);
  const isFinalSemester = selectedSemester >= 8;

  // Load programs & sessions on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/programs").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/settings").then((r) => (r.ok ? r.json() : {})),
    ]).then(async ([pData, sData]) => {
      const validProgs = Array.isArray(pData)
        ? pData.filter((p: any) => p.educationLevel === "BS" || !p.educationLevel)
        : [];
      setPrograms(validProgs);
      if (validProgs.length > 0 && !selectedProgram) {
        setSelectedProgram(validProgs[0].id);
      }

      const settingsObj = (sData as any) || {};
      if (settingsObj.ACADEMIC_SESSIONS) {
        const { filterValidSessions } = await import("@/lib/sessionHelper");
        const validList = filterValidSessions(settingsObj.ACADEMIC_SESSIONS);
        setSessions(validList);
        if (validList.length > 0 && !validList.includes(selectedSession)) {
          setSelectedSession(validList[0]);
        }
      }
    });
  }, []);

  // Sync back to parent sharedFilters
  useEffect(() => {
    setSharedFilters((prev: any) => ({
      ...prev,
      programId: selectedProgram,
      session: selectedSession,
      semester: String(selectedSemester),
    }));
  }, [selectedProgram, selectedSession, selectedSemester, setSharedFilters]);

  // Load cohort students and courses whenever filters change
  const loadCohortData = () => {
    if (!selectedProgram) return;

    setLoading(true);
    setErrorMessage("");
    setPromotionSuccess(null);

    const queryParams = new URLSearchParams();
    queryParams.set("educationLevel", "BS");
    queryParams.set("programId", selectedProgram);
    if (selectedSession && selectedSession !== "ALL") queryParams.set("session", selectedSession);
    queryParams.set("currentSemester", String(selectedSemester));

    Promise.all([
      fetch(`/api/students?${queryParams}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/courses?programId=${selectedProgram}&semester=${selectedSemester}`).then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([sData, cData]) => {
        const rawList = Array.isArray(sData) ? sData : [];
        const studentList = rawList.filter((st: any) => {
          if (st.isActive === false) return false;
          if (st.user && st.user.isActive === false && st.isActive !== true) return false;
          return true;
        });
        const sorted = sortStudentsByRoll(studentList);
        setStudents(sorted);
        setCourses(Array.isArray(cData) ? cData : []);

        // Pre-select students who are evaluated as eligible
        const eligibleIds: string[] = [];
        sorted.forEach((st: any) => {
          const evalResult = computeStudentStanding(st, selectedSemester);
          if (evalResult.isEligible) {
            eligibleIds.push(st.id);
          }
        });
        setSelectedStudentIds(eligibleIds);
      })
      .catch((err) => {
        console.error("Failed to load cohort data:", err);
        setErrorMessage("Failed to load students for this semester.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCohortData();
  }, [selectedProgram, selectedSession, selectedSemester]);

  // Standing calculation helper
  function computeStudentStanding(s: any, sem: number) {
    const studentMarks: any[] = s.marks || [];
    const semMarks = studentMarks.filter((m) => {
      const mSem = m.course?.semester ?? m.semester;
      return mSem === sem;
    });

    let totalObtained = 0;
    let totalMax = 0;
    let totalAbsent = 0;
    let failedCount = 0;
    let totalQualityPoints = 0;
    let totalCredits = 0;

    semMarks.forEach((m) => {
      const cr = m.course?.creditHours || 3;
      const isAbs = m.status === "ABSENT" || m.status === "A";
      const obtained = isAbs ? 0 : typeof m.obtainedMarks === "number" ? m.obtainedMarks : 0;
      const max = typeof m.totalMarks === "number" && m.totalMarks > 0 ? m.totalMarks : 100;

      if (isAbs) {
        totalAbsent++;
        failedCount++;
      } else {
        const pct = (obtained / max) * 100;
        if (pct < 50) failedCount++;
        totalObtained += obtained;

        // Approximate QP for standard 4.0 scale
        let gp = 0;
        if (pct >= 85) gp = 4.0;
        else if (pct >= 80) gp = 3.66;
        else if (pct >= 75) gp = 3.33;
        else if (pct >= 71) gp = 3.0;
        else if (pct >= 68) gp = 2.66;
        else if (pct >= 64) gp = 2.33;
        else if (pct >= 61) gp = 2.0;
        else if (pct >= 58) gp = 1.66;
        else if (pct >= 54) gp = 1.3;
        else if (pct >= 50) gp = 1.0;
        else gp = 0.0;

        totalQualityPoints += gp * cr;
      }
      totalMax += max;
      totalCredits += cr;
    });

    const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;
    const cgpa = gpa; // for Sem 1, CGPA == GPA
    const semPaperCount = courses.length > 0 ? courses.length : semMarks.length;

    let status = "PROMOTED";
    if (totalMax === 0) {
      status = "PENDING_RESULTS";
    } else if (totalAbsent > 0 && totalAbsent === semPaperCount) {
      status = "ABSENT";
    } else if (sem === 1) {
      status = gpa >= 1.0 ? "PROMOTED" : "DROPOUT";
    } else if (sem === 2) {
      status = cgpa >= 1.5 ? "PROMOTED" : cgpa >= 1.0 ? "PROBATION" : "DROPOUT";
    } else if (sem === 3) {
      status = cgpa >= 1.75 ? "PROMOTED" : cgpa >= 1.0 ? "PROBATION" : "DROPOUT";
    } else {
      status = cgpa >= 2.0 ? "PROMOTED" : cgpa >= 1.0 ? "PROBATION" : "DROPOUT";
    }

    const isEligible = status === "PROMOTED" || status === "PROBATION";

    return {
      totalObtained,
      totalMax,
      percentage: totalMax > 0 ? (totalObtained / totalMax) * 100 : 0,
      gpa,
      cgpa,
      failedCount,
      totalAbsent,
      status,
      isEligible,
    };
  }

  // Evaluated cohort
  const evaluatedStudents = useMemo(() => {
    return students.map((st) => {
      const standing = computeStudentStanding(st, selectedSemester);
      return {
        ...st,
        standing,
      };
    });
  }, [students, selectedSemester, courses]);

  // Filtered by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return evaluatedStudents;
    const q = searchQuery.toLowerCase().trim();
    return evaluatedStudents.filter(
      (s) =>
        s.rollNumber?.toLowerCase().includes(q) ||
        s.user?.name?.toLowerCase().includes(q) ||
        s.fatherName?.toLowerCase().includes(q)
    );
  }, [evaluatedStudents, searchQuery]);

  // Cohort summary statistics
  const summary = useMemo(() => {
    let clearPass = 0;
    let probation = 0;
    let dropout = 0;
    let absent = 0;
    let pending = 0;

    evaluatedStudents.forEach((s) => {
      if (s.standing.status === "PROMOTED") clearPass++;
      else if (s.standing.status === "PROBATION") probation++;
      else if (s.standing.status === "DROPOUT") dropout++;
      else if (s.standing.status === "ABSENT") absent++;
      else pending++;
    });

    return {
      total: evaluatedStudents.length,
      eligible: clearPass + probation,
      clearPass,
      probation,
      ineligible: dropout + absent,
      pending,
    };
  }, [evaluatedStudents]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllEligible = () => {
    const eligibleIds = evaluatedStudents.filter((s) => s.standing.isEligible).map((s) => s.id);
    setSelectedStudentIds(eligibleIds);
  };

  const handleSelectAll = () => {
    setSelectedStudentIds(evaluatedStudents.map((s) => s.id));
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  // Batch Promotion Execution
  const handleBatchPromote = async () => {
    if (selectedStudentIds.length === 0) {
      alert("Please select at least one student to promote.");
      return;
    }

    if (isFinalSemester) {
      alert("Students are already in Semester 8. Batch promotion cannot proceed beyond Semester 8.");
      return;
    }

    const confirmMsg = `Are you sure you want to promote ${selectedStudentIds.length} student(s) from Semester ${selectedSemester} to Semester ${nextSemester}?\n\nThey will automatically appear in Semester ${nextSemester} Marks Entry and Exam Attendance.`;
    if (!window.confirm(confirmMsg)) return;

    setPromoting(true);
    setErrorMessage("");
    setPromotionSuccess(null);

    const promotionPayload = selectedStudentIds.map((id) => {
      const match = evaluatedStudents.find((s) => s.id === id);
      return {
        studentId: id,
        status: match?.standing.status || "PROMOTED",
        gpa: match?.standing.gpa ? parseFloat(match.standing.gpa.toFixed(2)) : null,
        cgpa: match?.standing.cgpa ? parseFloat(match.standing.cgpa.toFixed(2)) : null,
        remarks: `Promoted from Semester ${selectedSemester} to ${nextSemester}`,
      };
    });

    try {
      const res = await fetch("/api/students/batch-promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: selectedProgram,
          session: selectedSession,
          fromSemester: selectedSemester,
          toSemester: nextSemester,
          students: promotionPayload,
          autoEnrollNextCourses: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to batch promote students.");
      }

      setPromotionSuccess({
        promotedCount: data.promotedCount || selectedStudentIds.length,
        toSemester: nextSemester,
        message: data.message || `Successfully pushed students to Semester ${nextSemester}!`,
      });

      // Reload cohort data to reflect promoted state
      loadCohortData();
    } catch (err: any) {
      console.error("Batch promotion failed:", err);
      setErrorMessage(err.message || "Failed to promote students. Please try again.");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Academic Progression Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              Semester Results & Batch Promotion
            </h2>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Evaluate cohort performance, compute University/HEC promotion standing, and push qualified students to the next semester so their next semester marks can be added.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/bs/gazette?programId=${selectedProgram}&session=${selectedSession}&semester=${selectedSemester}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-white text-blue-900 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all shadow-sm flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-blue-700" />
              <span>Open Gazette</span>
            </a>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Degree Program */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Degree Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full bg-white text-gray-800 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Session */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Academic Session
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full bg-white text-gray-800 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Current Semester */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Current Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
              className="w-full bg-white text-gray-800 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          <div>
            <button
              onClick={loadCohortData}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span>Refresh Cohort Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification with Instant Next-Semester Actions */}
      {promotionSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-900">
                  {promotionSuccess.message}
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  The promoted students are now enrolled in Semester {promotionSuccess.toSemester}. You can immediately start recording attendance or adding marks for Semester {promotionSuccess.toSemester}!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onNavigateToMarks && (
                <button
                  onClick={() => onNavigateToMarks(promotionSuccess.toSemester)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center"
                >
                  <span>📝 Go to Sem {promotionSuccess.toSemester} Marks Entry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {onNavigateToAttendance && (
                <button
                  onClick={() => onNavigateToAttendance(promotionSuccess.toSemester)}
                  className="px-4 py-2 bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center"
                >
                  <span>📋 Go to Sem {promotionSuccess.toSemester} Attendance</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Cohort Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Total Students</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-1">{summary.total}</p>
          <span className="text-[10px] text-gray-400 font-semibold">Semester {selectedSemester} Cohort</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">Eligible to Promote</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-800 mt-1">{summary.eligible}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {summary.clearPass} Passed + {summary.probation} Probation
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase">On Probation</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-800 mt-1">{summary.probation}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Conditional Promotion</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase">Ineligible / Dropped</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-800 mt-1">{summary.ineligible}</p>
          <span className="text-[10px] text-rose-600 font-semibold">Below Promotion Threshold</span>
        </div>
      </div>

      {/* Main Student Promotion Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by roll number or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none w-56 sm:w-64"
              />
            </div>

            <button
              onClick={handleSelectAllEligible}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all"
            >
              Select All Eligible ({summary.eligible})
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-600 border border-gray-300 rounded-xl text-xs font-bold transition-all"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-bold text-gray-600">
              <span className="text-blue-700 font-black">{selectedStudentIds.length}</span> of{" "}
              {evaluatedStudents.length} selected
            </div>

            <button
              onClick={handleBatchPromote}
              disabled={promoting || selectedStudentIds.length === 0 || isFinalSemester}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {promoting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Promoting Students...</span>
                </>
              ) : isFinalSemester ? (
                <span>Final Semester (No Next Sem)</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>
                    Push {selectedStudentIds.length} Selected to Semester {nextSemester}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Evaluating Cohort Academic Standing...
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-600">
              No students found in Semester {selectedSemester} for this Program & Session.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Select another semester or verify student enrollments in Students & Enrollment module.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredStudents.length > 0 &&
                        filteredStudents.every((s) => selectedStudentIds.includes(s.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) handleSelectAll();
                        else handleClearSelection();
                      }}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-3 text-center">Semester Marks</th>
                  <th className="py-3 px-3 text-center">GPA</th>
                  <th className="py-3 px-3 text-center">Standing</th>
                  <th className="py-3 px-3 text-center">Target</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredStudents.map((st, idx) => {
                  const isChecked = selectedStudentIds.includes(st.id);
                  const { standing } = st;
                  const isPromoted = standing.status === "PROMOTED";
                  const isProbation = standing.status === "PROBATION";
                  const isDropout = standing.status === "DROPOUT";
                  const isAbsent = standing.status === "ABSENT";

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isChecked ? "bg-blue-50/30" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(st.id)}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3 font-semibold text-gray-400">{idx + 1}</td>

                      <td className="py-3 px-3 font-mono font-bold text-gray-800 whitespace-nowrap">
                        {st.rollNumber}
                      </td>

                      <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                        <div>{st.user?.name || "Student"}</div>
                        {st.fatherName && (
                          <div className="text-[10px] text-gray-400 font-normal">
                            S/O {st.fatherName}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-semibold text-gray-700 whitespace-nowrap">
                        {standing.totalMax > 0 ? (
                          <>
                            <span className="font-bold text-gray-900">
                              {standing.totalObtained}
                            </span>
                            <span className="text-gray-400 font-normal"> / {standing.totalMax}</span>{" "}
                            <span className="text-[10px] text-blue-600 font-bold ml-1">
                              ({standing.percentage.toFixed(1)}%)
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">No marks</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-black text-gray-900">
                        {standing.totalMax > 0 ? standing.gpa.toFixed(2) : "—"}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isPromoted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Promoted</span>
                          </span>
                        ) : isProbation ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Probation</span>
                          </span>
                        ) : isDropout ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Dropout</span>
                          </span>
                        ) : isAbsent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Absent</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-semibold">Pending</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-gray-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                          <span>Sem {selectedSemester}</span>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                          <span className="text-blue-700 font-black">Sem {nextSemester}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedStudentIds([st.id]);
                            setTimeout(() => handleBatchPromote(), 50);
                          }}
                          disabled={promoting || isFinalSemester}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-[11px] font-bold border border-blue-200 hover:border-transparent transition-all shadow-2xs"
                        >
                          Push to Sem {nextSemester}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

