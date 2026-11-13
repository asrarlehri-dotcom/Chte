"use client";
import { useState, useEffect } from "react";

const INPUT = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const BTN_PRIMARY = "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50";
const BTN_GRAY = "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200";

export default function IntermediateStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (ids: string[]) =>
    setSelectedIds(prev => prev.length === ids.length ? [] : ids);

  const blankForm = { name: "", email: "", password: "", rollNumber: "", educationLevel: "INTERMEDIATE", programId: "", groupId: "" };
  const [form, setForm] = useState(blankForm);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [sRes, pRes, gRes] = await Promise.all([
      fetch("/api/students?educationLevel=INTERMEDIATE&includeInactive=true"),
      fetch("/api/programs"),
      fetch("/api/groups")
    ]);
    if (sRes.ok) setStudents(await sRes.json());
    if (pRes.ok) setPrograms(await pRes.json());
    if (gRes.ok) setGroups(await gRes.json());
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
      body: JSON.stringify({ programId: editItem.programId, groupId: editItem.groupId, rollNumber: editItem.rollNumber }),
    });
    if (res.ok) { setSuccess("Student updated!"); setEditItem(null); fetchAll(); }
    else { const d = await res.json(); setError(d.error); }
    setSaving(false);
  };

  const handleToggle = async (s: any) => {
    await fetch(`/api/students/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !s.isActive }) });
    fetchAll();
  };

  const handleDelete = async (s: any) => {
    if (!confirm(`Are you sure you want to delete student "${s.user?.name}"?`)) return;
    setError(""); setSuccess("");
    try {
      const res = await fetch(`/api/students/${s.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Student "${s.user?.name}" deleted successfully!`);
        fetchAll();
      } else {
        setError(data.error || "Delete failed");
      }
    } catch {
      setError("Failed to delete student");
    }
  };

  const filtered = students.filter(s =>
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const intermediatePrograms = programs.filter(p => p.educationLevel === "INTERMEDIATE");

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎓 Intermediate Student Management</h1>
          <p className="text-gray-500 mt-1">Register, manage and track all enrolled Intermediate students.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className={BTN_PRIMARY}>+ Add Student</button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm border border-green-100">{success}</div>}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <input className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm" placeholder="🔍 Search name, email, roll..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="self-center text-sm text-gray-500">{filtered.length} Intermediate students</span>
        {selectedIds.length > 0 && (
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full self-center">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <p className="text-center py-12 text-gray-400">Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={() => toggleAll(filtered.map(s => s.id))} />
                  </th>
                  {["#","Name & Email","Roll No","Program","Group","Status","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className={`border-b hover:bg-gray-50 transition-colors ${!s.isActive ? "opacity-60" : ""} ${selectedIds.includes(s.id) ? "bg-blue-50/60" : ""}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => toggleSelect(s.id)} />
                    </td>
                    <td className="px-4 py-3 text-gray-400">{i+1}</td>
                    <td className="px-4 py-3"><div className="font-medium text-gray-900">{s.user?.name}</div><div className="text-xs text-gray-500">{s.user?.email}</div></td>
                    <td className="px-4 py-3 font-mono text-gray-700">{s.rollNumber}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{s.program?.name || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{s.group?.name || "—"}</td>
                    <td className="px-4 py-3"><button onClick={() => handleToggle(s)} className={`px-2 py-1 text-xs rounded-full font-semibold ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.isActive ? "Active" : "Inactive"}</button></td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button onClick={() => setEditItem({ ...s, programId: s.programId || "", groupId: s.groupId || "" })} className="text-blue-600 text-xs hover:underline font-medium">Edit</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => handleDelete(s)} className="text-red-600 text-xs hover:underline font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">No students found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Register New Intermediate Student</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label><input required className={INPUT} placeholder="Ali Hassan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Roll Number *</label><input required className={INPUT} placeholder="26-FSC-0001" value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label><input required type="email" className={INPUT} placeholder="student@college.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Password *</label><input required type="password" className={INPUT} placeholder="Min 6 chars" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Program</label><select required className={INPUT} value={form.programId} onChange={e => setForm(f => ({ ...f, programId: e.target.value }))}><option value="">-- Select Program --</option>{intermediatePrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Group</label><select required className={INPUT} value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}><option value="">-- Select Group --</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
              </div>
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
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Program</label><select className={INPUT} value={editItem.programId} onChange={e => setEditItem((i: any) => ({ ...i, programId: e.target.value }))}><option value="">-- None --</option>{intermediatePrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1">Group</label><select className={INPUT} value={editItem.groupId} onChange={e => setEditItem((i: any) => ({ ...i, groupId: e.target.value }))}><option value="">-- None --</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
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
