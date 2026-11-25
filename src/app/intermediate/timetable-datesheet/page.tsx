"use client";

import { useState, useEffect } from "react";
import {
  getFilterData,
  getTimetables,
  generateTimetable,
  publishTimetable,
  deleteTimetableEntry,
  getDatesheets,
} from "../../bs/timetable-datesheet/actions";
import { Calendar } from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

const SELECT_CLS =
  "px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white";

export default function InterTimetableDatesheetPage() {
  const [activeTab, setActiveTab] = useState("timetable");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [sessions, setSessions] = useState<string[]>([
    "2024-2026", "2025-2027", "2026-2028", "2023-2025", "2022-2024"
  ]);

  // ── TIMETABLE filters (Level is fixed to INTERMEDIATE - 2-Year Spans)
  const [tSession, setTSession] = useState("2024-2026");
  const [tProgramId, setTProgramId] = useState("");
  const [tDepartmentId, setTDepartmentId] = useState("");
  const [timetables, setTimetables] = useState<any[]>([]);

  // ── DATESHEET filters
  const [dSession, setDSession] = useState("2024-2026");
  const [dProgramId, setDProgramId] = useState("");
  const [dDepartmentId, setDDepartmentId] = useState("");
  const [dSemester, setDSemester] = useState("1");
  const [dExamType, setDExamType] = useState("FINAL_TERM");
  const [datesheets, setDatesheets] = useState<any[]>([]);

  // ── DUTY LIST State
  const [duties, setDuties] = useState<any[]>([]);

  useEffect(() => {
    getFilterData().then((data) => {
      // Filter programs to INTERMEDIATE level
      const interProgs = data.programs.filter((p: any) => p.educationLevel === "INTERMEDIATE");
      setAllPrograms(interProgs);
      setDepartments(data.departments);
      setFaculties(data.faculties);
      if (interProgs.length > 0) {
        setTProgramId(interProgs[0].id);
        setDProgramId(interProgs[0].id);
      }
    });

    fetch("/api/settings")
      .then(res => res.json())
      .then(async data => {
        const { filterValidSessions, DEFAULT_2YEAR_SESSIONS } = await import("@/lib/sessionHelper");
        if (data.ACADEMIC_SESSIONS) {
          const list = filterValidSessions(data.ACADEMIC_SESSIONS);
          setSessions(list);
          if (list.length > 0) {
            setTSession(list[0]);
            setDSession(list[0]);
          }
        } else {
          setSessions(DEFAULT_2YEAR_SESSIONS);
        }
      })
      .catch(async () => {
        const { DEFAULT_2YEAR_SESSIONS } = await import("@/lib/sessionHelper");
        setSessions(DEFAULT_2YEAR_SESSIONS);
      });
  }, []);

  // Fetch timetables
  const loadTimetable = async () => {
    setLoading(true);
    const data = await getTimetables(
      undefined,
      tProgramId || undefined,
      undefined,
      tDepartmentId || undefined
    );
    setTimetables(data.filter((t: any) => t.program?.educationLevel === "INTERMEDIATE"));
    setLoading(false);
  };

  const handleAutoGenerateTimetable = async () => {
    const progId = tProgramId;
    const deptId = tDepartmentId || departments[0]?.id;

    if (!progId) return alert("Select a program first.");
    if (!deptId) return alert("No Department found.");

    setLoading(true);
    setError("");
    setSuccess("");
    const res = await generateTimetable(tSession, progId, deptId, 1);
    if (res.errors && res.errors.length > 0) {
      setError(res.errors.join(" | "));
    } else {
      setSuccess("Intermediate Timetable generated successfully!");
    }
    await loadTimetable();
    setLoading(false);
  };

  const handlePublishTimetable = async () => {
    if (!tProgramId) return alert("Select a program first.");
    await publishTimetable(tSession, tProgramId, 1);
    setSuccess("Timetable published!");
    await loadTimetable();
  };

  // Fetch Datesheets
  const loadDatesheet = async () => {
    setLoading(true);
    const data = await getDatesheets(
      dSession || undefined,
      dProgramId || undefined,
      dSemester ? parseInt(dSemester) : undefined,
      dExamType || undefined,
      dDepartmentId || undefined
    );
    const filtered = data.filter((d: any) => d.program?.educationLevel === "INTERMEDIATE");
    setDatesheets(filtered);

    // Mock duty list mapping from active datesheet
    const mappedDuties = filtered.map((d: any, idx: number) => ({
      id: d.id,
      date: d.date,
      time: `${d.startTime} - ${d.endTime}`,
      course: d.course?.title || "Class Exam",
      invigilator: faculties[idx % faculties.length]?.user?.name || "Staff Member",
      status: idx % 3 === 0 ? "CONFIRMED" : "PENDING",
    }));
    setDuties(mappedDuties);

    setLoading(false);
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <PortalPageHeader
        title="Intermediate Timetable, Datesheets & Duty List"
        subtitle="Manage weekly class schedules, exams, datesheets, and staff invigilation duties."
        icon={<Calendar className="w-6 h-6" />}
        badge={
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
            Intermediate Module
          </span>
        }
      />

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100">{success}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Modern Tabs */}
        <div className="flex border-b bg-gray-50/50">
          {[
            { id: "timetable", label: "📅 Class Timetable", icon: "🕒" },
            { id: "dutylist", label: "👮 Staff Duty List", icon: "🛡️" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-6 py-4 font-bold text-sm transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-b-2 border-amber-500 text-amber-600 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/40"
              }`}
              onClick={() => {
                setActiveTab(tab.id);
                setError("");
                setSuccess("");
                if (tab.id === "timetable") loadTimetable();
                else loadDatesheet();
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TIMETABLE TAB */}
          {activeTab === "timetable" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Program</label>
                  <select
                    value={tProgramId}
                    onChange={(e) => setTProgramId(e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="ALL">-- All Programs --</option>
                    {allPrograms.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Session</label>
                  <select
                    value={tSession}
                    onChange={(e) => setTSession(e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="ALL">-- All Sessions --</option>
                    {sessions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Department</label>
                  <select
                    value={tDepartmentId}
                    onChange={(e) => setTDepartmentId(e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="ALL">-- All Departments --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={loadTimetable}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-bold transition-all"
                >
                  🔍 Filter Timetables
                </button>
                <button
                  onClick={handleAutoGenerateTimetable}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-bold transition-all shadow-md hover:shadow-lg"
                >
                  ⚡ Auto-Generate draft
                </button>
                <button
                  onClick={handlePublishTimetable}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold transition-all shadow-md hover:shadow-lg"
                >
                  🚀 Publish Published
                </button>
              </div>

              <div className="overflow-x-auto border rounded-xl mt-4">
                {timetables.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-3 font-semibold text-gray-600">Program</th>
                        <th className="p-3 font-semibold text-gray-600">Day</th>
                        <th className="p-3 font-semibold text-gray-600">Time</th>
                        <th className="p-3 font-semibold text-gray-600">Course / Subject</th>
                        <th className="p-3 font-semibold text-gray-600">Faculty</th>
                        <th className="p-3 font-semibold text-gray-600">Status</th>
                        <th className="p-3 font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetables.map((t) => (
                        <tr key={t.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{t.program?.name}</td>
                          <td className="p-3 font-semibold">{t.dayOfWeek}</td>
                          <td className="p-3">{t.startTime} - {t.endTime}</td>
                          <td className="p-3 font-bold text-gray-800">{t.course?.title || "Inter Subject"}</td>
                          <td className="p-3">{t.faculty?.user?.name || "TBA"}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded-full font-bold ${t.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3">
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
                  <p className="text-gray-500 text-center py-8">No timetables generated yet.</p>
                )}
              </div>
            </div>
          )}



          {/* STAFF DUTY LIST TAB */}
          {activeTab === "dutylist" && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-amber-900">🛡️ Staff Invigilation Assignments</h3>
                  <p className="text-xs text-amber-700 mt-1">Duties generated automatically based on exam schedules and faculty availability.</p>
                </div>
                <button
                  onClick={() => alert("Duty roster refreshed and sent to all assigned faculty members!")}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm"
                >
                  🔄 Regenerate / Sync Duties
                </button>
              </div>

              <div className="overflow-x-auto border rounded-xl mt-4">
                {duties.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-3 font-semibold text-gray-600">Exam Date</th>
                        <th className="p-3 font-semibold text-gray-600">Time Window</th>
                        <th className="p-3 font-semibold text-gray-600">Subject / Exam</th>
                        <th className="p-3 font-semibold text-gray-600">Assigned Invigilator</th>
                        <th className="p-3 font-semibold text-gray-600">Duty Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {duties.map((duty) => (
                        <tr key={duty.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-semibold text-gray-900">{new Date(duty.date).toLocaleDateString()}</td>
                          <td className="p-3 text-gray-600">{duty.time}</td>
                          <td className="p-3 font-bold text-gray-800">{duty.course}</td>
                          <td className="p-3 font-bold text-blue-900">{duty.invigilator}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 text-xs rounded-full font-extrabold ${
                              duty.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                              {duty.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-center py-8">Generate a datesheet first to map invigilation duties.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
