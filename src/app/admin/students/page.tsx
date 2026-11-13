"use client";
import { useState, useEffect } from "react";

const INPUT = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const BTN_PRIMARY = "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50";
const BTN_GRAY = "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  const blankForm = { name: "", email: "", password: "", rollNumber: "", educationLevel: "BS", programId: "", currentSemester: "1", bsAdmissionType: "REGULAR" };
  const [form, setForm] = useState(blankForm);

  useEffect(() => { fetchAll(); }, [filterLevel]);

  const fetchAll = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("includeInactive", "true");
    if (filterLevel) params.set("educationLevel", filterLevel);
    const [sRes, pRes] = await Promise.all([fetch(`/api/students?${params}`), fetch("/api/programs")]);
    if (sRes.ok) setStudents(await sRes.json());
    if (pRes.ok) setPrograms(await pRes.json());
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    const res = await fetch("/api/students", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) { setSuccess(`Student "${data.user?.name}" registered!`); setForm(blankForm); setShowAdd(false); fetchAll(); }
    else setError(data.error);
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editItem) return; setSaving(true); setError("");
    const res = await fetch(`/api/students/${editItem.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentSemester: editItem.currentSemester, programId: editItem.programId, rollNumber: editItem.rollNumber }),
    });
    if (res.ok) { setSuccess("Student updated!"); setEditItem(null); fetchAll(); }
    else { const d = await res.json(); setError(d.error); }
    setSaving(false);
  };

  const handleToggle = async (s: any) => {
    await fetch(`/api/students/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !s.isActive }) });
    fetchAll();
  };

  const filtered = students.filter(s =>
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPrograms = form.educationLevel ? programs.filter(p => p.educationLevel === form.educationLevel) : programs;
  const editPrograms = editItem ? programs.filter(p => p.educationLevel === editItem.educationLevel) : programs;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎓 Student Management</h1>
          <p className="text-gray-500 mt-1">Register, manage and track all enrolled students.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className={BTN_PRIMARY}>+ Add Student</button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm border border-green-100">{success}</div>}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <input className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm" placeholder="🔍 Search name, email, roll..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="px-3 py-2 border rounded-lg text-sm" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
          <option value="">-- All Levels --</option>
          <option value="BS">BS</option>
          <option value="INTERMEDIATE">Intermediate</option>
        </select>
        <span className="self-center text-sm text-gray-500">{filtered.length} students</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <p className="text-center py-12 text-gray-400">Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["#","Name & Email","Roll No","Level","Program","Semester","Status","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className={`border-b hover:bg-gray-50 ${!s.isActive ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3 text-gray-400">{i+1}</td>
                    <td className="px-4 py-3"><div className="font-medium text-gray-900">{s.user?.name}</div><div className="text-xs text-gray-500">{s.user?.email}</div></td>
                    <td className="px-4 py-3 font-mono text-gray-700">{s.rollNumber}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${s.educationLevel === "BS" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{s.educationLevel}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-700">{s.program?.name || "—"}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{s.currentSemester ?? "—"}</td>
                    <td className="px-4 py-3"><button onClick={() => handleToggle(s)} className={`px-2 py-1 text-xs rounded-full font-semibold ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.isActive ? "Active" : "Inactive"}</button></td>
                    <td className="px-4 py-3"><button onClick={() => setEditItem({ ...s, programId: s.programId || "" })} className="text-blue-600 text-xs hover:underline font-medium">Edit</button></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">No students found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Register New Student</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label><input required className={INPUT} placeholder="Ali Hassan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Roll Number *</label><input required className={INPUT} placeholder="BS-2026-001" value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label><input required type="email" className={INPUT} placeholder="student@college.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Password *</label><input required type="password" className={INPUT} placeholder="Min 6 chars" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Level *</label><select required className={INPUT} value={form.educationLevel} onChange={e => setForm(f => ({ ...f, educationLevel: e.target.value, programId: "" }))}><option value="BS">BS</option><option value="INTERMEDIATE">Intermediate</option></select></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Semester</label><select className={INPUT} value={form.currentSemester} onChange={e => setForm(f => ({ ...f, currentSemester: e.target.value }))}>{[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Program</label><select className={INPUT} value={form.programId} onChange={e => setForm(f => ({ ...f, programId: e.target.value }))}><option value="">-- No Program --</option>{filteredPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              {form.educationLevel === "BS" && (
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">BS Admission Type</label><select className={INPUT} value={form.bsAdmissionType} onChange={e => setForm(f => ({ ...f, bsAdmissionType: e.target.value }))}><option value="REGULAR">Regular</option><option value="BRIDGING_5TH">Bridging 5th</option></select></div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className={`flex-1 ${BTN_PRIMARY}`}>{saving ? "Registering..." : "Register Student"}</button>
                <button type="button" onClick={() => setShowAdd(false)} className={`flex-1 ${BTN_GRAY}`}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Edit Student</h2>
            <p className="text-sm text-gray-500">{editItem.user?.name} — {editItem.rollNumber}</p>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Roll Number</label><input className={INPUT} value={editItem.rollNumber} onChange={e => setEditItem((i: any) => ({ ...i, rollNumber: e.target.value }))} /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Program</label><select className={INPUT} value={editItem.programId} onChange={e => setEditItem((i: any) => ({ ...i, programId: e.target.value }))}><option value="">-- None --</option>{editPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Current Semester</label><select className={INPUT} value={editItem.currentSemester} onChange={e => setEditItem((i: any) => ({ ...i, currentSemester: e.target.value }))}>{[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="flex gap-3">
              <button onClick={handleUpdate} disabled={saving} className={`flex-1 ${BTN_PRIMARY}`}>{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => setEditItem(null)} className={`flex-1 ${BTN_GRAY}`}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
