"use client";

import { useState, useEffect } from "react";
import { ClipboardCheck } from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

type Program = { id: string; name: string; educationLevel: string };
type Group = { id: string; name: string; programId: string };
type StudentRecord = {
  studentId: string;
  rollNumber: string;
  name: string;
  status: "PRESENT" | "ABSENT" | "LEAVE";
};

export default function IntermediateAttendancePage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchProgramsAndGroups();
  }, []);

  const fetchProgramsAndGroups = async () => {
    try {
      const pRes = await fetch("/api/programs");
      if (pRes.ok) {
        const data = await pRes.json();
        setPrograms(data.filter((p: any) => p.educationLevel === "INTERMEDIATE"));
      }

      const gRes = await fetch("/api/groups");
      if (gRes.ok) {
        const data = await gRes.json();
        setGroups(data);
      }
    } catch (e) {
      console.error("Error loading filters", e);
    }
  };

  const handleLoadStudents = async () => {
    if (!selectedProgram || !selectedGroup) {
      setMsg({ type: "error", text: "Please select both Program and Group first." });
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch(
        `/api/attendance?educationLevel=INTERMEDIATE&date=${date}&programId=${selectedProgram}&groupId=${selectedGroup}`
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        if (data.length === 0) {
          setMsg({ type: "error", text: "No active students found in this group/program." });
        }
      } else {
        setMsg({ type: "error", text: "Failed to load students." });
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
          educationLevel: "INTERMEDIATE",
          date,
          programId: selectedProgram,
          groupId: selectedGroup,
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

  const filteredGroups = groups.filter(g => g.programId === selectedProgram);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PortalPageHeader
        title="Intermediate Attendance"
        subtitle="Mark and update daily student attendance sheet."
        icon={<ClipboardCheck className="w-6 h-6" />}
      />

      {msg.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${msg.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Filter panel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setSelectedGroup("");
                setStudents([]);
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="">-- Choose Program --</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Group</label>
            <select
              value={selectedGroup}
              disabled={!selectedProgram}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setStudents([]);
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-sm disabled:opacity-50"
            >
              <option value="">-- Choose Group --</option>
              {filteredGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
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

      {/* Students sheet */}
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
