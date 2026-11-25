"use client";
import { useState, useEffect } from "react";
import { UserCheck } from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

const INPUT = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const BTN_PRIMARY = "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50";
const BTN_GRAY = "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200";

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ name: "", email: "", password: "", departmentId: "", educationLevel: "BOTH" });
  const [editDept, setEditDept] = useState("");
  const [editLevel, setEditLevel] = useState("BOTH");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (ids: string[]) =>
    setSelectedIds(prev => prev.length === ids.length ? [] : ids);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [fRes, dRes] = await Promise.all([fetch("/api/faculty"), fetch("/api/departments")]);
    if (fRes.ok) setFaculty(await fRes.json());
    if (dRes.ok) setDepartments(await dRes.json());
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    const res = await fetch("/api/faculty", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) { setSuccess(`Faculty "${data.user?.name}" registered!`); setForm({ name: "", email: "", password: "", departmentId: "", educationLevel: "BOTH" }); setShowAdd(false); fetchAll(); }
    else setError(data.error);
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editItem) return; setSaving(true); setError("");
    const res = await fetch(`/api/faculty/${editItem.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId: editDept || null, educationLevel: editLevel }),
    });
    if (res.ok) { setSuccess("Faculty updated!"); setEditItem(null); fetchAll(); }
    else { const d = await res.json(); setError(d.error); }
    setSaving(false);
  };

  const handleToggle = async (f: any) => {
    await fetch(`/api/faculty/${f.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !f.isActive }),
    });
    fetchAll();
  };

  const filtered = faculty.filter(f =>
    f.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Faculty Management"
        subtitle="Register, manage and assign faculty members to departments and level types."
        icon={<UserCheck className="w-6 h-6" />}
      >
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer">+ Add Faculty</button>
      </PortalPageHeader>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm border border-green-100">{success}</div>}

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center">
        <input className={INPUT} placeholder="🔍 Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        {selectedIds.length > 0 && (
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full whitespace-nowrap">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <p className="text-center py-12 text-gray-400">Loading...</p> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={() => toggleAll(filtered.map(f => f.id))} />
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">#</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Name & Email</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Department</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Faculty Type</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3 font-semibold text-gray-600 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.id} className={`border-b hover:bg-gray-50 transition-colors ${!f.isActive ? "opacity-60" : ""} ${selectedIds.includes(f.id) ? "bg-blue-50/60" : ""}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      checked={selectedIds.includes(f.id)}
                      onChange={() => toggleSelect(f.id)} />
                  </td>
                  <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{f.user?.name}</div>
                    <div className="text-xs text-gray-500">{f.user?.email}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{f.department?.name || <span className="text-gray-400 italic">Unassigned</span>}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                      f.educationLevel === "INTERMEDIATE" ? "bg-amber-100 text-amber-800" :
                      f.educationLevel === "BOTH" ? "bg-purple-100 text-purple-800" :
                      "bg-emerald-100 text-emerald-800"
                    }`}>
                      {f.educationLevel === "INTERMEDIATE" ? "Inter Faculty" : f.educationLevel === "BOTH" ? "Both (BS & Inter)" : "BS Faculty"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleToggle(f)} className={`px-2 py-1 text-xs rounded-full font-semibold cursor-pointer ${f.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {f.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => { setEditItem(f); setEditDept(f.departmentId || ""); setEditLevel(f.educationLevel || "BOTH"); }} className="text-blue-600 text-xs hover:underline font-medium">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">No faculty found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Register New Faculty</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label><input required className={INPUT} placeholder="Dr. Ahmad Ali" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label><input required type="email" className={INPUT} placeholder="ahmad@college.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Password *</label><input required type="password" className={INPUT} placeholder="Min 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Faculty Type *</label>
                <select className={INPUT} value={form.educationLevel} onChange={e => setForm(f => ({ ...f, educationLevel: e.target.value }))}>
                  <option value="BS">🎓 BS Faculty</option>
                  <option value="INTERMEDIATE">🏫 Inter Faculty</option>
                  <option value="BOTH">🎓🏫 Both (BS & Inter)</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Department</label>
                <select className={INPUT} value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                  <option value="">-- Select Department --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className={`flex-1 ${BTN_PRIMARY}`}>{saving ? "Registering..." : "Register"}</button>
                <button type="button" onClick={() => setShowAdd(false)} className={`flex-1 ${BTN_GRAY}`}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Edit Faculty Details</h2>
            <p className="text-sm text-gray-500">{editItem.user?.name}</p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Faculty Type</label>
              <select className={INPUT} value={editLevel} onChange={e => setEditLevel(e.target.value)}>
                <option value="BS">🎓 BS Faculty</option>
                <option value="INTERMEDIATE">🏫 Inter Faculty</option>
                <option value="BOTH">🎓🏫 Both (BS & Inter)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Department</label>
              <select className={INPUT} value={editDept} onChange={e => setEditDept(e.target.value)}>
                <option value="">-- No Department --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
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
