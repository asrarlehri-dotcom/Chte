"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { sortStudentsByRoll, distributeTotalMarks, parsePastedMarksText } from "@/lib/domainParsers";

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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Examinations & Results</h1>
        <p className="text-gray-500 mt-1">Manage Exam Paper Attendance, Student Marks Entry, Result Compilation, and Promotions.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none">
        <div className="flex border-b print:hidden overflow-x-auto bg-slate-50/50">
          <button
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'paper_attendance'
                ? 'border-b-2 border-blue-600 text-blue-700 font-black bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
            }`}
            onClick={() => setActiveTab('paper_attendance')}
          >
            <span>📋 Paper Attendance</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">Step 1</span>
          </button>

          <button
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'marks'
                ? 'border-b-2 border-blue-600 text-blue-700 font-black bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
            }`}
            onClick={() => setActiveTab('marks')}
          >
            <span>📝 Marks Entry</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800">Step 2</span>
          </button>

          <button
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap ${
              activeTab === 'results' ? 'border-b-2 border-blue-600 text-blue-600 font-bold bg-white' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('results')}
          >
            Results & Promotion
          </button>
          <button
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap ${
              activeTab === 'academic_actions' ? 'border-b-2 border-blue-600 text-blue-600 font-bold bg-white' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('academic_actions')}
          >
            🔀 Status & Academic Actions
          </button>
          <button
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap ${
              activeTab === 'merit' ? 'border-b-2 border-blue-600 text-blue-600 font-bold bg-white' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('merit')}
          >
            Merit & Scholarships
          </button>
        </div>

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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Compile Results & GPA</h2>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Generate Gazette</button>
              </div>
              <p className="text-gray-600 text-sm">Select a semester to compute GPA/CGPA and promote students.</p>
              <div className="max-w-xs mt-4">
                <select className="w-full px-4 py-2 border rounded-lg mb-4">
                  <option>-- Select Program & Semester --</option>
                  <option>BS CS - 1st Semester</option>
                </select>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Compute Results</button>
              </div>
            </div>
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
// 50% = 1.0, 51% = 1.1, ..., 79% = 3.9, 80%+ = 4.0
function getGP(obtained: number, total: number): number {
  if (total <= 0) return 0.00;
  const pct = (obtained / total) * 100;
  const rounded = Math.round(pct);

  if (rounded < 50) return 0.00; // Fail
  if (rounded >= 80) return 4.00; // Max GP is 4.0 (starts at 80%)

  // Formula: 1.00 + (rounded - 50) * 0.10
  return parseFloat((1.00 + (rounded - 50) * 0.10).toFixed(2));
}

// Grade letter calculation based on HEC range table from user screenshot
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
                            className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                              !isAbsent
                                ? "bg-green-600 text-white shadow-md scale-[1.02]"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            🟢 Present (P)
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStudentAttendance(st.id, "ABSENT")}
                            className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${
                              isAbsent
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
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

      const userEmail = session?.user?.email;
      const facultyAssignedCourse = validCourses.find((c: any) =>
        c.faculty?.user?.email && userEmail && c.faculty.user.email.toLowerCase() === userEmail.toLowerCase()
      );

      if (facultyAssignedCourse) {
        setSelectedProgram(facultyAssignedCourse.programId);
        setSelectedSemester(facultyAssignedCourse.semester?.toString() || "1");
        setSelectedCourse(facultyAssignedCourse.id);
        const totals: Record<number, number> = { 1: 33, 2: 67, 3: 100, 4: 100 };
        setCourseTotalMarks(totals[facultyAssignedCourse.creditHours] ?? 100);
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
      const totals: Record<number, number> = { 1: 33, 2: 67, 3: 100, 4: 100 };
      setCourseTotalMarks(totals[course.creditHours] ?? 100);
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
    if (!student || student.attendance === "ABSENT") return;

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

      if (pasteTargetCol === "total") {
        if (autoDistributeOnPaste) {
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
        } else {
          return {
            ...s,
            attendance: "PRESENT",
            totalOnly: markVal,
          };
        }
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
    entryType === "detailed"
      ? s.assignment + s.quiz + (isPracticalCourse ? (s.practical || 0) : 0) + (examScheme === "TERMINAL" ? 0 : s.mid) + s.final
      : s.totalOnly;

  const handleSaveWithStatus = async (targetStatus: "SAVED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED", lockTarget?: boolean) => {
    if (!selectedCourse) {
      alert("Please select a Course first!");
      return;
    }
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const lockVal = lockTarget !== undefined ? lockTarget : (targetStatus === "APPROVED");

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

      // Auto-distribute if entered in Total mode or only Total is present
      if (!isStudentAbsent && (assignVal + quizVal + pracVal + midVal + finalVal === 0) && (s.totalOnly || 0) > 0) {
        const distributed = distributeTotalMarks(s.totalOnly, {
          isPracticalCourse,
          examScheme,
          courseTotalMarks,
        });
        assignVal = distributed.assignment;
        quizVal = distributed.quiz;
        pracVal = distributed.practical;
        midVal = distributed.mid;
        finalVal = distributed.final;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Enter & Review Student Marks</h2>
          <p className="text-xs text-gray-500">Select program and course to manage student evaluation & result approvals.</p>
        </div>

        <div className="flex items-center gap-3">
          {selectedCourse && (
            <div>
              {resultStatus === "APPROVED" ? (
                <span className="px-3 py-1.5 text-xs font-black rounded-lg bg-green-100 text-green-800 border border-green-300 flex items-center gap-1.5 shadow-sm">
                  <span>🔒</span> APPROVED & PUBLISHED (LOCKED)
                </span>
              ) : resultStatus === "PENDING_APPROVAL" ? (
                <span className="px-3 py-1.5 text-xs font-black rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 animate-pulse shadow-sm">
                  <span>⏳</span> PENDING ADMIN APPROVAL
                </span>
              ) : resultStatus === "REJECTED" ? (
                <span className="px-3 py-1.5 text-xs font-black rounded-lg bg-red-100 text-red-800 border border-red-300 flex items-center gap-1.5 shadow-sm">
                  <span>❌</span> REJECTED - REVISION NEEDED
                </span>
              ) : (
                <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5 shadow-sm">
                  <span>📝</span> DRAFT / SAVED
                </span>
              )}
            </div>
          )}

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${entryType === 'detailed' ? 'bg-white shadow-sm font-bold text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setEntryType('detailed')}
            >Detailed Breakdown</button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${entryType === 'total' ? 'bg-white shadow-sm font-bold text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setEntryType('total')}
            >Total Only</button>
          </div>
        </div>
      </div>

      {/* Search & Filters row */}
      <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Search Student</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400"
              placeholder="🔍 Search name or roll number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Program Type</label>
            <select
              className="w-full px-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400"
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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Session</label>
            <select
              className="w-full px-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400"
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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Program</label>
            <select
              className="w-full px-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400"
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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Semester</label>
            <select
              className="w-full px-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400"
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
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Course *</label>
          <select
            className={`w-full px-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400 ${!selectedProgram ? 'opacity-60 cursor-not-allowed' : ''}`}
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

          {/* Exam Scheme Mode Card (Decided by Datesheet) */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-4 rounded-xl border border-purple-200 flex items-center justify-between flex-wrap gap-3 shadow-sm">
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
                type="button"
                onClick={() => setExamScheme("MID_FINAL")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${examScheme === "MID_FINAL" ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Mid (30/20) + Final (40)
              </button>
              <button
                type="button"
                onClick={() => setExamScheme("TERMINAL")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${examScheme === "TERMINAL" ? "bg-purple-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Single Terminal Exam (70)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 px-5 py-3 rounded-xl flex-wrap">
            <span className="text-sm font-semibold text-blue-800">📊 Total Marks (out of):</span>
            <input
              type="number"
              min="1"
              max="200"
              step="1"
              disabled={isFacultyLocked}
              value={courseTotalMarks}
              onChange={e => setCourseTotalMarks(parseInt(e.target.value) || 100)}
              className="w-24 px-3 py-1.5 border-2 border-blue-300 rounded-lg text-center font-bold text-blue-700 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  {entryType === "detailed" ? (
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

                    const obtained = isAbsent ? 0 : getComputed(s);
                    const gp = isAbsent ? 0.0 : getGP(obtained, courseTotalMarks);
                    const grade = isAbsent ? "F (A)" : getGrade(obtained, courseTotalMarks);
                    const pass = !isAbsent && gp >= 1.0;

                    return (
                      <tr key={s.id} className={`transition-colors ${isAbsent ? "bg-red-50/20" : "hover:bg-gray-50"}`}>
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
                              className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                                !isAbsent
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
                              className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                                isAbsent
                                  ? "bg-red-600 text-white shadow-sm"
                                  : "text-gray-500 hover:text-gray-900"
                              }`}
                            >
                              🔴 A
                            </button>
                          </div>
                        </td>

                        {entryType === "detailed" ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                max={totalQuizAssignLimit}
                                step="0.5"
                                disabled={isFacultyLocked || quizHasFullMarks || isAbsent}
                                title={isAbsent ? "Student is Absent. Cells locked!" : (quizHasFullMarks ? `Quiz has taken full ${totalQuizAssignLimit} marks. Assignment auto-blocked!` : `Max allowed: ${Math.max(0, totalQuizAssignLimit - (s.quiz || 0))}`)}
                                className={`w-20 px-2 py-1 border rounded text-sm text-center focus:ring-2 focus:ring-blue-400 ${
                                  isAbsent
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
                                className={`w-20 px-2 py-1 border rounded text-sm text-center focus:ring-2 focus:ring-blue-400 ${
                                  isAbsent
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
                                  className={`w-20 px-2 py-1 border rounded text-sm font-black text-center ${
                                    isAbsent
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
                                className={`w-20 px-2 py-1 border rounded text-sm text-center focus:ring-2 focus:ring-blue-400 ${
                                  isAbsent
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
                                className={`w-20 px-2 py-1 border rounded text-sm focus:ring-2 text-center disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                  isAbsent
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
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md font-mono text-sm">{obtained}</span>
                                  <button
                                    type="button"
                                    disabled={isFacultyLocked || isAbsent}
                                    onClick={() => {
                                      const promptVal = prompt(`Enter Direct Total Marks (0 - ${courseTotalMarks}) for ${s.name}:`, String(obtained || 100));
                                      if (promptVal !== null) {
                                        const num = parseFloat(promptVal);
                                        if (!isNaN(num) && num >= 0 && num <= courseTotalMarks) {
                                          handleDistributeStudent(s.id, num);
                                        } else {
                                          alert(`Invalid marks! Please enter a value between 0 and ${courseTotalMarks}.`);
                                        }
                                      }
                                    }}
                                    className="px-1.5 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[11px] font-bold shadow-sm transition-all"
                                    title="Set Direct Total Marks and Auto-Distribute into Quiz, Mid & Final"
                                  >
                                    🎲 Split
                                  </button>
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
                              <div className="flex items-center gap-2">
                                <input
                                  type="number" min="0" max={courseTotalMarks} step="0.5"
                                  disabled={isFacultyLocked || isAbsent}
                                  placeholder="e.g. 78"
                                  className="w-24 px-3 py-1.5 border-2 border-blue-200 rounded-lg focus:border-blue-500 font-mono font-bold text-blue-700 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm"
                                  value={s.totalOnly || ""}
                                  onChange={e => handleMarkChange(s.id, "totalOnly", e.target.value)}
                                />
                                <button
                                  type="button"
                                  disabled={isFacultyLocked || isAbsent || !s.totalOnly}
                                  onClick={() => handleDistributeStudent(s.id)}
                                  className="px-2.5 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 shadow-sm"
                                  title="Randomly distribute Total into Quiz, Assignment, Mid & Final components"
                                >
                                  <span>🎲</span>
                                  <span>Distribute</span>
                                </button>
                              </div>
                            )}
                          </td>
                        )}

                        <td className={`px-4 py-3 text-center font-bold ${isAbsent ? "text-red-600 bg-red-50" : "bg-indigo-50 text-indigo-700"}`}>
                          {isAbsent ? "F (A)" : obtained === 0 ? "—" : grade}
                        </td>

                        <td className={`px-4 py-3 text-center ${isAbsent ? "bg-red-50" : "bg-purple-50"}`}>
                          <span className={`text-sm font-bold ${
                            isAbsent
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

                        <td className="px-4 py-3 text-center">
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
                              <span className="px-3 py-1 text-xs rounded-full font-bold bg-red-100 text-red-700 border border-red-200">
                                ❌ Fail
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

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoDistributeOnPaste}
                    onChange={(e) => setAutoDistributeOnPaste(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-purple-950">
                    🎲 Auto-distribute Total into Quiz, Mid & Final breakdown
                  </span>
                </label>
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
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
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
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState("FREEZE");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const bsOnly = sortStudentsByRoll(data.filter((s: any) => s.educationLevel === "BS"));
          setStudents(bsOnly);
          if (bsOnly.length > 0) setSelectedStudentId(bsOnly[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePromote = async (studentId: string, currentSem: number) => {
    const nextSem = currentSem + 1;
    if (nextSem > 8) {
      alert("Student is already in the final 8th semester!");
      return;
    }
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSemester: nextSem }),
      });
      if (res.ok) {
        setSuccess(`Student successfully promoted to Semester ${nextSem}!`);
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, currentSemester: nextSem } : s))
        );
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      alert("Promotion failed.");
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/students/status-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          statusType: actionType,
          reason,
        }),
      });
      if (res.ok) {
        setSuccess(`Status action '${actionType}' updated successfully!`);
        setReason("");
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      alert("Action failed to execute.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Student Academic Status & Actions</h2>
          <p className="text-gray-500 text-sm">Manage semester promotions, academic freezing, dropouts, quit, and migrations.</p>
        </div>
      </div>

      {/* Quick Action Selection Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "FREEZE", label: "❄️ Freeze", desc: "Freeze Semester" },
          { key: "PROMOTED", label: "🏆 Promoted", desc: "Semester Promotion" },
          { key: "DROPOUT", label: "🚫 Dropout", desc: "Mark Dropout" },
          { key: "QUIT", label: "🚪 Quit", desc: "Quit Program" },
          { key: "MIGRATION_IN", label: "➡️ Migration In", desc: "Incoming Migration" },
          { key: "MIGRATION_OUT", label: "⬅️ Migration Out", desc: "Outward Migration" },
        ].map(act => (
          <button
            key={act.key}
            onClick={() => setActionType(act.key)}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all ${actionType === act.key ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            {act.label}
          </button>
        ))}
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-semibold">
          {success}
        </div>
      )}

      {actionType === "PROMOTED" ? (
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-gray-50 font-bold text-gray-800 flex justify-between items-center">
            <span>🏆 Semester Promotions List</span>
            <span className="text-xs font-normal text-gray-500">{students.length} Students</span>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Student Name</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Roll Number</th>
                <th className="px-4 py-3 font-semibold text-center">Current Semester</th>
                <th className="px-4 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">{s.user?.name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{s.rollNumber}</td>
                  <td className="px-4 py-3 text-center font-extrabold text-blue-600">Semester {s.currentSemester || 1}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handlePromote(s.id, s.currentSemester || 1)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      🚀 Promote to Sem {(s.currentSemester || 1) + 1}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border shadow-sm max-w-xl">
          <h3 className="text-base font-bold mb-4 text-gray-800 flex items-center gap-2">
            <span>⚙️ Update Academic Action:</span>
            <span className="px-2.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">{actionType}</span>
          </h3>
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user?.name} ({s.rollNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason / Institutional Notes</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                placeholder="Specify reason for freeze, quit, migration, or dropout..."
                className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? "Updating..." : `Confirm ${actionType} Status Update`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
