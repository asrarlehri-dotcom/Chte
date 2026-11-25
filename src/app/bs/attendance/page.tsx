"use client";

import { useState, useEffect } from "react";
import { ClipboardCheck } from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

type Program = { id: string; name: string; educationLevel: string };
type Course = { id: string; title: string; code: string; semester: number; programId: string; session: string };
type StudentRecord = {
  studentId: string;
  rollNumber: string;
  name: string;
  status: "PRESENT" | "ABSENT" | "LEAVE";
};

export default function BsAttendancePage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchProgramsAndCourses();
  }, []);

  const fetchProgramsAndCourses = async () => {
    try {
      const pRes = await fetch("/api/programs");
      if (pRes.ok) {
        const data = await pRes.json();
        setPrograms(data.filter((p: any) => p.educationLevel === "BS"));
      }

      const cRes = await fetch("/api/courses");
      if (cRes.ok) {
        const data = await cRes.json();
        setCourses(data);
      }

      const sRes = await fetch("/api/settings");
      if (sRes.ok) {
        const data = await sRes.json();
        const { filterValidSessions, DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        if (data.ACADEMIC_SESSIONS) {
          setSessions(filterValidSessions(data.ACADEMIC_SESSIONS));
        } else {
          setSessions(DEFAULT_ALL_SESSIONS);
        }
      } else {
        const { DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        setSessions(DEFAULT_ALL_SESSIONS);
      }
    } catch (e) {
      console.error("Error loading filters", e);
    }
  };

  const handleLoadStudents = async () => {
    if (!selectedProgram || !selectedSession || !selectedSemester || !selectedCourse) {
      setMsg({ type: "error", text: "Please select Program, Session, Semester, and Course first." });
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch(
        `/api/attendance?educationLevel=BS&date=${date}&courseId=${selectedCourse}`
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        if (data.length === 0) {
          setMsg({ type: "error", text: "No active student enrollments found for this course." });
        }
      } else {
        setMsg({ type: "error", text: "Failed to load student list." });
      }
    } catch (e) {
      setMsg({ type: "error", text: "An error occurred while fetching student list." });
    }
    setLoading(false);
  };

  const handleStatusChange = (studentId: string, status: "PRESENT" | "ABSENT" | "LEAVE") => {
    setStudents(prev =>
      prev.map(s => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleMarkAll = (status: "PRESENT" | "ABSENT" | "LEAVE") => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) return;
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          educationLevel: "BS",
          date,
          courseId: selectedCourse,
          records: students.map(s => ({ studentId: s.studentId, status: s.status }))
        })
      });
      if (res.ok) {
        setMsg({ type: "success", text: "Attendance sheet saved successfully!" });
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Failed to save attendance records." });
      }
    } catch (e) {
      setMsg({ type: "error", text: "An error occurred while saving attendance sheet." });
    }
    setSaving(false);
  };

  const filteredCourses = courses.filter(
    c => c.programId === selectedProgram && String(c.semester) === selectedSemester && c.session === selectedSession
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PortalPageHeader
        title="BS Program Attendance"
        subtitle="Mark and manage course-wise daily attendance records."
        icon={<ClipboardCheck className="w-6 h-6" />}
      />

      {msg.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${msg.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Filters card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setSelectedCourse("");
                setStudents([]);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="">-- Program --</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Session</label>
            <select
              value={selectedSession}
              onChange={(e) => {
                setSelectedSession(e.target.value);
                setSelectedCourse("");
                setStudents([]);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="">-- Session --</option>
              {sessions.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedCourse("");
                setStudents([]);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="">-- Semester --</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={String(s)}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Course</label>
            <select
              value={selectedCourse}
              disabled={!selectedProgram || !selectedSession || !selectedSemester}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setStudents([]);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-sm disabled:opacity-50"
            >
              <option value="">-- Choose Course --</option>
              {filteredCourses.map(c => (
                <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Attendance Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setStudents([]);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
            />
          </div>

          <div>
            <button
              onClick={handleLoadStudents}
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? "Loading..." : "🔍 Load Students"}
            </button>
          </div>
        </div>
      </div>

      {/* Sheet Table */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50/50 flex-wrap gap-4">
            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Attendance Sheet ({students.length} students)</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkAll("PRESENT")}
                className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded text-xs font-semibold transition-colors"
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleMarkAll("ABSENT")}
                className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded text-xs font-semibold transition-colors"
              >
                Mark All Absent
              </button>
              <button
                onClick={() => handleMarkAll("LEAVE")}
                className="px-3 py-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 rounded text-xs font-semibold transition-colors"
              >
                Mark All Leave
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-600 w-16">#</th>
                  <th className="px-6 py-3 font-semibold text-gray-600 w-48">Roll Number</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Student Name</th>
                  <th className="px-6 py-3 font-semibold text-gray-600 text-center w-80">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, index) => (
                  <tr key={s.studentId} className="border-b hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-gray-400 font-medium">{index + 1}</td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-700">{s.rollNumber}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleStatusChange(s.studentId, "PRESENT")}
                          className={`px-3 py-1 text-xs rounded-lg font-bold border transition-all ${
                            s.status === "PRESENT"
                              ? "bg-green-600 border-green-600 text-white shadow-sm"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          🟢 Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(s.studentId, "ABSENT")}
                          className={`px-3 py-1 text-xs rounded-lg font-bold border transition-all ${
                            s.status === "ABSENT"
                              ? "bg-red-600 border-red-600 text-white shadow-sm"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          🔴 Absent
                        </button>
                        <button
                          onClick={() => handleStatusChange(s.studentId, "LEAVE")}
                          className={`px-3 py-1 text-xs rounded-lg font-bold border transition-all ${
                            s.status === "LEAVE"
                              ? "bg-yellow-500 border-yellow-500 text-white shadow-sm"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          🟡 Leave
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t bg-gray-50/50 flex justify-end">
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? "Saving Sheet..." : "💾 Save Attendance"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
