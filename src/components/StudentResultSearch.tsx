"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  GraduationCap,
  Building2,
  Calendar,
  Award,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  User,
  Hash,
  FileText,
  FileCheck2,
  Clock,
} from "lucide-react";

interface CollegeOption {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  district?: string | null;
}

interface ProgramOption {
  id: string;
  name: string;
  code?: string | null;
}

interface CourseMark {
  paperNo: string;
  courseId?: string;
  courseTitle: string;
  courseCode: string;
  creditHours: number;
  obtainedMarks: number;
  totalMarks: number;
  gp: string;
  grade: string;
  isPass: boolean;
  isAbsent: boolean;
}

interface StudentResult {
  studentId: string;
  studentName: string;
  fatherName: string;
  rollNumber: string;
  registrationNo: string;
  cnic: string;
  session: string;
  semester: number;
  educationLevel: string;
  bsAdmissionType: string;
  college: {
    id: string;
    name: string;
    code: string;
    logoUrl: string | null;
    district?: string | null;
  };
  program: {
    id: string;
    name: string;
    code: string;
  };
  semesterGPA: number;
  cumulativeCGPA: number;
  semesterMarks: {
    obtained: number;
    total: number;
    percentage: number;
  };
  cumulativeMarks: {
    obtained: number;
    total: number;
  };
  academicStatus: string;
  failedCoursesCount: number;
  failedCourses: CourseMark[];
  previousBacklogsCount?: number;
  previousBacklogs?: any[];
  totalLifetimeFailedCount?: number;
  allFailedCourses?: any[];
  availableSemesters?: number[];
  courses: CourseMark[];
}

interface StudentResultSearchProps {
  isChtePortal?: boolean;
  collegeId?: string;
  collegeName?: string;
  collegeCode?: string;
  themeColor?: string;
}

const AVAILABLE_SESSIONS = [
  "ALL",
  "2021-2025",
  "2022-2026",
  "2023-2027",
  "2024-2028",
  "2025-2029",
];

const SEMESTERS = [
  { value: "ALL", label: "Latest / Current Semester" },
  { value: "1", label: "Semester 1" },
  { value: "2", label: "Semester 2" },
  { value: "3", label: "Semester 3" },
  { value: "4", label: "Semester 4" },
  { value: "5", label: "Semester 5" },
  { value: "6", label: "Semester 6" },
  { value: "7", label: "Semester 7" },
  { value: "8", label: "Semester 8" },
];

export default function StudentResultSearch({
  isChtePortal = false,
  collegeId: initialCollegeId,
  collegeName: initialCollegeName,
  collegeCode: initialCollegeCode,
  themeColor = "#0c5938",
}: StudentResultSearchProps) {
  // Filters state
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(initialCollegeId || "ALL");
  const [selectedSession, setSelectedSession] = useState<string>("ALL");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("ALL");
  const [selectedSemester, setSelectedSemester] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Result state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // 1. Load colleges for CHTE portal
  useEffect(() => {
    if (isChtePortal) {
      fetch("/api/public/colleges")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setColleges(data);
        })
        .catch(() => {});
    }
  }, [isChtePortal]);

  // 2. Load programs scoped to college
  useEffect(() => {
    const targetColId = isChtePortal
      ? selectedCollegeId !== "ALL"
        ? selectedCollegeId
        : ""
      : initialCollegeId || "";

    const url = targetColId
      ? `/api/public/programs?collegeId=${targetColId}`
      : "/api/public/programs";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPrograms(data);
      })
      .catch(() => setPrograms([]));
  }, [isChtePortal, selectedCollegeId, initialCollegeId]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setResults([]);
    setSelectedResult(null);

    const queryTrimmed = searchQuery.trim();
    if (!queryTrimmed && selectedProgramId === "ALL" && selectedCollegeId === "ALL") {
      setErrorMsg("Please enter a Roll No, CNIC, Reg No, or Student Name to search.");
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (!isChtePortal && initialCollegeId) {
        params.append("collegeId", initialCollegeId);
      } else if (selectedCollegeId && selectedCollegeId !== "ALL") {
        params.append("collegeId", selectedCollegeId);
      }

      if (selectedSession && selectedSession !== "ALL") {
        params.append("session", selectedSession);
      }
      if (selectedProgramId && selectedProgramId !== "ALL") {
        params.append("programId", selectedProgramId);
      }
      if (selectedSemester && selectedSemester !== "ALL") {
        params.append("semester", selectedSemester);
      }
      if (queryTrimmed) {
        params.append("query", queryTrimmed);
      }

      const res = await fetch(`/api/public/results?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to search results.");
      } else if (data.students && data.students.length > 0) {
        setResults(data.students);
        setSelectedResult(data.students[0]);
      } else {
        setResults([]);
        setSelectedResult(null);
      }
    } catch {
      setErrorMsg("An unexpected error occurred while checking results.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSelectSemester = async (sem: number) => {
    if (!selectedResult) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedResult.college.id) params.append("collegeId", selectedResult.college.id);
      if (selectedResult.session) params.append("session", selectedResult.session);
      if (selectedResult.program.id) params.append("programId", selectedResult.program.id);
      params.append("semester", sem.toString());
      params.append("query", selectedResult.rollNumber);

      const res = await fetch(`/api/public/results?${params.toString()}`);
      const data = await res.json();
      if (data.students && data.students.length > 0) {
        setSelectedResult(data.students[0]);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setErrorMsg("");
    setResults([]);
    setSelectedResult(null);
    setHasSearched(false);
    setSelectedSemester("ALL");
  };

  return (
    <div className="w-full font-sans">
      {/* ── Search & Filter Box Container ── */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden text-slate-900 print:hidden transition-all">
        {/* Banner Header */}
        <div
          className="p-5 sm:p-7 text-white"
          style={{
            background: isChtePortal
              ? "linear-gradient(135deg, #072a1e 0%, #0c5938 60%, #157347 100%)"
              : `linear-gradient(135deg, ${themeColor} 0%, #0f172a 100%)`,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-200 text-[10px] font-black uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Official Student Result Verification Portal
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  {isChtePortal
                    ? "Online Student Examination Result"
                    : `${initialCollegeName || "College"} — Student Result Portal`}
                </h3>
                <p className="text-xs text-white/80 font-medium">
                  Search by Roll Number, CNIC, Registration Number, or Student Name.
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 bg-white/10 rounded-lg border border-white/20 text-white/90">
              BS Semester Examination System
            </span>
          </div>
        </div>

        {/* Filter Controls & Search Form */}
        <form onSubmit={handleSearch} className="p-5 sm:p-7 bg-slate-50/70 space-y-4">
          {/* Dropdown Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. College Selector (Only on CHTE portal) */}
            {isChtePortal ? (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  College Name
                </label>
                <select
                  value={selectedCollegeId}
                  onChange={(e) => {
                    setSelectedCollegeId(e.target.value);
                    setSelectedProgramId("ALL");
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
                >
                  <option value="ALL">🏛️ All Colleges Across Balochistan</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* 2. Session */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Academic Session
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
              >
                {AVAILABLE_SESSIONS.map((sess) => (
                  <option key={sess} value={sess}>
                    {sess === "ALL" ? "📅 All Sessions" : `Batch ${sess}`}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Program */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                Degree Program
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
              >
                <option value="ALL">🎓 All Programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.code ? `(${p.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Semester */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Target Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
              >
                {SEMESTERS.map((sem) => (
                  <option key={sem.value} value={sem.value}>
                    {sem.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Query Input Bar */}
          <div className="pt-2">
            <label className="block text-xs font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>Search by Student Roll No, CNIC, Registration No, or Name:</span>
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Roll No (e.g. S-22/MATH:01), CNIC (e.g. 54400-...), or Name..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl text-white font-extrabold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
                  style={{
                    backgroundColor: isChtePortal ? "#0c5938" : themeColor || "#0c5938",
                  }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Check Result / رزلٹ معلوم کریں</span>
                    </>
                  )}
                </button>

                {(searchQuery || hasSearched) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    title="Reset Search"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2">
              <span>💡 Search examples:</span>
              <button
                type="button"
                onClick={() => setSearchQuery("S-22/MATH:01")}
                className="text-emerald-700 underline font-mono hover:text-emerald-900"
              >
                S-22/MATH:01
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery("Munawar")}
                className="text-emerald-700 underline font-mono hover:text-emerald-900"
              >
                Munawar
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery("Abdul Baseer")}
                className="text-emerald-700 underline font-mono hover:text-emerald-900"
              >
                Abdul Baseer
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>

        {/* Multiple Matches Student Selector Tabs */}
        {results.length > 1 && (
          <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="font-extrabold text-slate-600 flex-shrink-0">
              Matched Students ({results.length}):
            </span>
            {results.map((r) => (
              <button
                key={r.studentId}
                type="button"
                onClick={() => setSelectedResult(r)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  selectedResult?.studentId === r.studentId
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                <span>{r.studentName}</span>
                <span className="font-mono text-[10px] opacity-80">({r.rollNumber})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── No Results Found Alert ── */}
      {hasSearched && !loading && results.length === 0 && !errorMsg && (
        <div className="mt-6 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center max-w-xl mx-auto">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-7 h-7" />
          </div>
          <h4 className="text-base font-black text-slate-900">No Student Result Found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            We couldn't find any student examination record matching{" "}
            <span className="font-bold text-slate-800">"{searchQuery}"</span>. Please double-check the
            Roll No, CNIC, or selected filters.
          </p>
        </div>
      )}

      {/* ── Official Student Result Card & DMC View ── */}
      {selectedResult && (
        <div className="mt-8 space-y-4">
          {/* Quick Action Top Bar (Hidden on print) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-950 print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold">
                Official Result Record Found for{" "}
                <span className="font-black underline">{selectedResult.studentName}</span> (
                {selectedResult.rollNumber})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-extrabold rounded-lg shadow-sm flex items-center gap-2 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Result Slip</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-all"
              >
                Search Another
              </button>
            </div>
          </div>

          {/* ── Printable DMC Card Container ── */}
          <div
            ref={printAreaRef}
            className="bg-white rounded-2xl border-2 border-slate-300/80 shadow-2xl p-6 sm:p-10 text-slate-900 overflow-hidden relative print:border-none print:shadow-none print:p-0"
          >
            {/* Watermark Logo in Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <GraduationCap className="w-96 h-96 text-black" />
            </div>

            {/* Card Header */}
            <div className="border-b-2 border-slate-800 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                {/* College / Gov Logo */}
                <div className="flex items-center gap-4">
                  {selectedResult.college.logoUrl ? (
                    <img
                      src={selectedResult.college.logoUrl}
                      alt="Logo"
                      className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-1 bg-white shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#0c5938] text-white font-black flex items-center justify-center text-xl shadow-xs">
                      {selectedResult.college.code.substring(0, 3)}
                    </div>
                  )}
                  <div>
                    <span className="text-[11px] font-black tracking-widest uppercase text-emerald-800 block">
                      GOVERNMENT OF BALOCHISTAN
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
                      {selectedResult.college.name}
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold">
                      College Examination Branch • Campus: {selectedResult.college.district || "Balochistan"} (
                      {selectedResult.college.code})
                    </p>
                  </div>
                </div>

                {/* Badge: DMC Type */}
                <div className="text-center sm:text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-md text-xs font-black uppercase tracking-wider">
                    SEMESTER RESULT SLIP
                  </span>
                  <div className="text-[11px] font-mono text-slate-500 mt-1 font-bold">
                    SEMESTER {selectedResult.semester} EXAMINATION
                  </div>

                  {/* Quick Semester Switcher Tabs (Hidden when printing) */}
                  {selectedResult.availableSemesters && selectedResult.availableSemesters.length > 1 && (
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5 mt-2.5 print:hidden">
                      <span className="text-[10px] font-bold text-slate-500 mr-0.5">Switch Sem:</span>
                      {selectedResult.availableSemesters.map((sem) => (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => handleSelectSemester(sem)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all ${
                            selectedResult.semester === sem
                              ? "bg-[#0c5938] text-white shadow-xs scale-105"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                          }`}
                        >
                          Sem {sem}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Student Bio & Academic Information Grid */}
            <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-4 sm:p-5 mb-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-6">
                <div>
                  <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wide">
                    Student Name:
                  </span>
                  <span className="font-black text-slate-950 text-sm">{selectedResult.studentName}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wide">
                    Father's Name:
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{selectedResult.fatherName}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wide">
                    Roll Number:
                  </span>
                  <span className="font-mono font-black text-slate-950 text-sm">
                    {selectedResult.rollNumber}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wide">
                    Registration No:
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {selectedResult.registrationNo}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wide">
                    Degree Program:
                  </span>
                  <span className="font-bold text-emerald-900">{selectedResult.program.name}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wide">
                    Session & Batch:
                  </span>
                  <span className="font-bold text-slate-800">{selectedResult.session}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wide">
                    CNIC / B-Form:
                  </span>
                  <span className="font-mono font-bold text-slate-800">{selectedResult.cnic}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wide">
                    Examination Semester:
                  </span>
                  <span className="font-black text-blue-900">Semester {selectedResult.semester}</span>
                </div>
              </div>
            </div>

            {/* Subject-Wise Examination Marks Table */}
            <div className="mb-6 overflow-x-auto rounded-xl border border-slate-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="p-3 text-center w-12 border-r border-slate-700">#</th>
                    <th className="p-3 border-r border-slate-700">Course / Subject Name</th>
                    <th className="p-3 text-center border-r border-slate-700">Course Code</th>
                    <th className="p-3 text-center border-r border-slate-700">Cr. Hours</th>
                    <th className="p-3 text-center border-r border-slate-700">Marks (Obt / Total)</th>
                    <th className="p-3 text-center border-r border-slate-700">Grade Point (GP)</th>
                    <th className="p-3 text-center border-r border-slate-700">Letter Grade</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {selectedResult.courses.map((course, idx) => (
                    <tr
                      key={idx}
                      className={
                        !course.isPass
                          ? "bg-red-50/70 text-red-950 font-bold"
                          : idx % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/50"
                      }
                    >
                      <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-bold border-r border-slate-200">
                        {course.courseTitle}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-700 border-r border-slate-200">
                        {course.courseCode}
                      </td>
                      <td className="p-3 text-center font-bold border-r border-slate-200">
                        {course.creditHours}
                      </td>
                      <td className="p-3 text-center font-mono font-bold border-r border-slate-200">
                        {course.isAbsent ? (
                          <span className="text-red-600 font-black">ABSENT (0 / {course.totalMarks})</span>
                        ) : (
                          <span>
                            {course.obtainedMarks} / {course.totalMarks}
                          </span>
                        )}
                      </td>
                      <td
                        className={`p-3 text-center font-mono font-black border-r border-slate-200 ${
                          !course.isPass ? "text-red-600" : "text-blue-900"
                        }`}
                      >
                        {course.gp}
                      </td>
                      <td
                        className={`p-3 text-center font-bold text-xs border-r border-slate-200 ${
                          !course.isPass ? "text-red-600 font-black" : "text-slate-800"
                        }`}
                      >
                        {course.grade}
                      </td>
                      <td className="p-3 text-center">
                        {course.isAbsent ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-300">
                            🚫 ABSENT
                          </span>
                        ) : course.isPass ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✅ PASS
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-600 text-white ring-2 ring-red-300 animate-pulse">
                            ❌ FAIL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Summary & Performance Metrics Dashboard Bar ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white shadow-md mb-6">
              {/* Semester Marks */}
              <div className="border-r border-slate-700/80 pr-4">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Semester Marks
                </span>
                <div className="text-xl font-black mt-1">
                  {selectedResult.semesterMarks.obtained}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    / {selectedResult.semesterMarks.total}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {selectedResult.semesterMarks.percentage}% Score
                </span>
              </div>

              {/* Semester GPA */}
              <div className="border-r border-slate-700/80 pr-4">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Semester {selectedResult.semester} GPA
                </span>
                <div className="text-2xl font-black text-amber-300 mt-0.5">
                  {selectedResult.academicStatus === "RESULT_AWAITED" || selectedResult.semesterMarks.total === 0
                    ? "—"
                    : selectedResult.semesterGPA.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-400">Scale of 4.00</span>
              </div>

              {/* Cumulative CGPA */}
              <div className="border-r border-slate-700/80 pr-4">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Cumulative CGPA
                </span>
                <div className="text-2xl font-black text-cyan-300 mt-0.5">
                  {selectedResult.academicStatus === "RESULT_AWAITED" || selectedResult.semesterMarks.total === 0 || selectedResult.cumulativeCGPA === 0
                    ? "—"
                    : selectedResult.cumulativeCGPA.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-400">
                  {selectedResult.academicStatus === "RESULT_AWAITED" || selectedResult.semesterMarks.total === 0
                    ? "Result Not Compiled Yet"
                    : `Total Marks: ${selectedResult.cumulativeMarks.obtained} / ${selectedResult.cumulativeMarks.total}`}
                </span>
              </div>

              {/* Official Academic Promotion Status */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Promotion Status
                </span>
                <div className="mt-1">
                  {selectedResult.academicStatus === "PROMOTED" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-lg shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PROMOTED
                    </span>
                  )}
                  {selectedResult.academicStatus === "PROBATION" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-sm">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      PROBATION
                    </span>
                  )}
                  {selectedResult.academicStatus === "DROPOUT" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white font-black text-xs rounded-lg shadow-sm">
                      <XCircle className="w-3.5 h-3.5" />
                      DROPOUT
                    </span>
                  )}
                  {selectedResult.academicStatus === "ABSENT" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white font-black text-xs rounded-lg shadow-sm">
                      ABSENT (F)
                    </span>
                  )}
                  {selectedResult.academicStatus === "RESULT_AWAITED" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-600 text-white font-bold text-xs rounded-lg shadow-sm">
                      RESULT AWAITED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Status Notices & Alerts ── */}
            {/* 1. Result Awaited / No Papers Entered in this semester */}
            {selectedResult.courses.length === 0 || selectedResult.academicStatus === "RESULT_AWAITED" ? (
              <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-slate-800 mb-6 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600 font-bold">
                  <Clock className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-xs">
                  <div className="font-black text-slate-900 text-sm">
                    Result Awaited — No Examination Records for Semester {selectedResult.semester}
                  </div>
                  <p className="text-slate-600 mt-1">
                    Official marks for Semester {selectedResult.semester} have not been uploaded by the examination department yet.
                    {selectedResult.availableSemesters && selectedResult.availableSemesters.length > 0 && (
                      <span className="block mt-1.5 font-bold text-slate-800">
                        👉 Exam records are available for Semester:{" "}
                        {selectedResult.availableSemesters.map((sem) => (
                          <button
                            key={sem}
                            type="button"
                            onClick={() => handleSelectSemester(sem)}
                            className="underline text-blue-700 mx-1 hover:text-blue-900 font-bold cursor-pointer"
                          >
                            Semester {sem}
                          </button>
                        ))}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ) : null}

            {/* 2. Failed Papers in THIS Semester */}
            {selectedResult.failedCoursesCount > 0 && (
              <div className="p-4 bg-red-50 border-2 border-red-400 rounded-xl text-red-950 mb-6 shadow-xs">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs w-full">
                    <div className="font-black text-red-950 text-sm flex items-center justify-between">
                      <span>❌ Failed in {selectedResult.failedCoursesCount} Paper(s) in Semester {selectedResult.semester}:</span>
                      <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-md">
                        SUPPLEMENTARY REQUIRED
                      </span>
                    </div>
                    <div className="mt-2 divide-y divide-red-200 border border-red-200 rounded-lg overflow-hidden bg-white/70">
                      {selectedResult.failedCourses.map((fc, i) => (
                        <div key={i} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                          <span className="font-extrabold text-red-950">
                            {i + 1}. {fc.courseTitle} ({fc.courseCode})
                          </span>
                          <span className="font-mono font-bold text-red-700 flex-shrink-0">
                            {fc.isAbsent ? (
                              <span className="px-2 py-0.5 bg-red-100 rounded text-red-800 font-black">ABSENT (A)</span>
                            ) : (
                              <span>Obtained: {fc.obtainedMarks} / {fc.totalMarks} (GP: {fc.gp}, Grade: {fc.grade})</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-red-700 font-medium mt-2">
                      * As per university policy, the student must register and clear these failed papers in subsequent supplementary examinations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Previous Semesters Backlog Alert */}
            {selectedResult.previousBacklogs && selectedResult.previousBacklogs.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs w-full">
                  <div className="font-black text-amber-900 text-sm">
                    ⚠️ Previous Backlogs Notice: Student has {selectedResult.previousBacklogs.length} uncleared paper(s) from earlier semesters:
                  </div>
                  <div className="mt-2 divide-y divide-amber-200 border border-amber-200 rounded-lg overflow-hidden bg-white/70">
                    {selectedResult.previousBacklogs.map((pb: any, i: number) => (
                      <div key={i} className="p-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          Semester {pb.semester}: {pb.courseTitle} ({pb.courseCode})
                        </span>
                        <span className="font-mono font-bold text-red-600">
                          {pb.isAbsent ? "ABSENT" : `Marks: ${pb.obtainedMarks}/${pb.totalMarks} (${pb.grade})`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1">
                    * Pending backlogs must be cleared prior to final degree award.
                  </p>
                </div>
              </div>
            )}

            {/* 4. Academic Standing Warning (Probation or Dropout) */}
            {(selectedResult.academicStatus === "DROPOUT" || selectedResult.academicStatus === "PROBATION") && (
              <div className={`p-4 rounded-xl border-2 mb-6 flex items-start gap-3 ${
                selectedResult.academicStatus === "DROPOUT"
                  ? "bg-red-50 border-red-500 text-red-950"
                  : "bg-amber-50 border-amber-400 text-amber-950"
              }`}>
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                <div className="text-xs">
                  <div className="font-black text-sm uppercase">
                    {selectedResult.academicStatus === "DROPOUT" ? "🚫 Academic Dropout Notice" : "⚠️ Academic Probation Notice"}
                  </div>
                  <p className="mt-1 font-semibold">
                    {selectedResult.academicStatus === "DROPOUT"
                      ? `Cumulative CGPA (${selectedResult.cumulativeCGPA.toFixed(2)}) is below the minimum threshold required for continuation.`
                      : `Cumulative CGPA (${selectedResult.cumulativeCGPA.toFixed(2)}) is under probation. The student must improve GPA in subsequent semester.`}
                  </p>
                </div>
              </div>
            )}

            {/* 5. Congratulations Box ONLY WHEN TRULY PASSED EVERYTHING */}
            {selectedResult.courses.length > 0 &&
              selectedResult.failedCoursesCount === 0 &&
              (!selectedResult.previousBacklogs || selectedResult.previousBacklogs.length === 0) &&
              (!selectedResult.totalLifetimeFailedCount || selectedResult.totalLifetimeFailedCount === 0) &&
              selectedResult.academicStatus === "PROMOTED" && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 mb-6 flex items-center gap-2.5 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    🎉 Congratulations! All semester papers passed successfully with satisfactory academic standing.
                  </span>
                </div>
              )}

            {/* Footer Signatures Area (Official Slip Style) */}
            <div className="pt-8 border-t border-slate-300 flex flex-col sm:flex-row items-end justify-between gap-6 text-center text-xs font-bold text-slate-700">
              <div>
                <div className="w-40 border-b border-slate-800 pb-1 mx-auto sm:mx-0">
                  Computer Operator
                </div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">Checked & Verified</div>
              </div>

              <div>
                <div className="w-44 border-b border-slate-800 pb-1 mx-auto">
                  Assistant Controller of Exams
                </div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">Balochistan Education Dept</div>
              </div>

              <div>
                <div className="w-40 border-b border-slate-800 pb-1 mx-auto sm:mx-0">
                  Controller of Examinations
                </div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">{selectedResult.college.name}</div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center mt-6">
              * Note: This is an online verified provisional examination slip generated via the CHTE Balochistan Academic ERP. Errors & omissions accepted.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

