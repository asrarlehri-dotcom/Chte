"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

const ROLES = ["SUPER_ADMIN", "ADMIN", "FACULTY", "STUDENT"];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-orange-100 text-orange-700",
  FACULTY: "bg-blue-100 text-blue-700",
  STUDENT: "bg-green-100 text-green-700",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (ids: string[]) =>
    setSelectedIds(prev => prev.length === ids.length ? [] : ids);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
    setLoading(false);
  };

  const handleEditRole = async () => {
    if (!editUser) return;
    setSaving(true);
    setError(""); setSuccess("");
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: editRole }),
    });
    if (res.ok) {
      setSuccess(`${editUser.name} کا role "${editRole}" کر دیا گیا`);
      setEditUser(null);
      fetchUsers();
    } else {
      setError("Role update failed");
    }
    setSaving(false);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`"${user.name}" کو delete کریں؟`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      setSuccess(`${user.name} delete ہو گئے`);
      fetchUsers();
    } else {
      setError("Delete failed");
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole ? u.role === filterRole : true;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PortalPageHeader
        title="User Management"
        subtitle="View, search, and manage all system users and their roles."
        icon={<Users className="w-6 h-6" />}
      />

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="🔍 Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">-- All Roles --</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.replace("_", " ")}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {filtered.length} / {users.length} users
        </span>
        {selectedIds.length > 0 && (
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-12">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={() => toggleAll(filtered.map(u => u.id))} />
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600">#</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Name</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Email</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Role</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Joined</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} className={`border-b hover:bg-gray-50 transition-colors ${selectedIds.includes(u.id) ? "bg-blue-50/60" : ""}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        checked={selectedIds.includes(u.id)}
                        onChange={() => toggleSelect(u.id)} />
                    </td>
                    <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString("en-PK")}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setEditRole(u.role);
                          }}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          Edit Role
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="text-red-500 hover:underline text-xs font-medium"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Edit Role</h2>
            <p className="text-sm text-gray-500 mb-4">{editUser.name} — {editUser.email}</p>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace("_", " ")}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleEditRole}
                disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Role"}
              </button>
              <button
                onClick={() => setEditUser(null)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
