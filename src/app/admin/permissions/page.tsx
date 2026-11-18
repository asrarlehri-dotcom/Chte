"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  ShieldCheck,
  Check,
  X,
  Save,
  RefreshCw,
  Search,
  Lock,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter
} from "lucide-react";
import { MODULES, ACTIONS } from "@/lib/permissions";

interface RolePerm {
  id: string;
  role: string;
  permissionId: string;
  isGranted: boolean;
  permission: {
    id: string;
    module: string;
    action: string;
    description: string | null;
  };
}

interface PermissionItem {
  id: string;
  module: string;
  action: string;
  description: string | null;
}

const ROLES_LIST = [
  { key: "CHTE_ADMIN", label: "🏛️ CHTE Directorate Admin", desc: "Central Apex Governance & Provincial Oversight" },
  { key: "COLLEGE_ADMIN", label: "🏛️ College Admin", desc: "Campus Administration & Local Institutional Setup" },
];

export default function RolePermissionsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isChte = userRole === "SUPER_ADMIN" || userRole === "CHTE_ADMIN";

  const [selectedRole, setSelectedRole] = useState("CHTE_ADMIN");
  const [rolePerms, setRolePerms] = useState<RolePerm[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [localMatrix, setLocalMatrix] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Compute all available modules (from MODULES and DB)
  const modulesList = Array.from(
    new Set([
      ...Object.values(MODULES),
      ...permissions.map((p) => p.module).filter(Boolean),
    ])
  );

  useEffect(() => {
    // Populate localMatrix for selectedRole
    const matrix: Record<string, boolean> = {};
    rolePerms
      .filter((rp) => rp.role === selectedRole)
      .forEach((rp) => {
        matrix[`${rp.permission.module}:${rp.permission.action}`] = rp.isGranted;
      });

    // Provide default true grants for Principal / College Admin if not in DB
    if (selectedRole === "PRINCIPAL" || selectedRole === "COLLEGE_ADMIN") {
      modulesList.forEach((mod) => {
        ["VIEW", "ADD", "EDIT", "DELETE", "APPROVE"].forEach((act) => {
          const key = `${mod}:${act}`;
          if (matrix[key] === undefined) {
            matrix[key] = true;
          }
        });
      });
    } else if (selectedRole === "BS_CONTROLLER") {
      modulesList.forEach((mod) => {
        if (mod.startsWith("BS.")) {
          ["VIEW", "ADD", "EDIT", "DELETE", "APPROVE"].forEach((act) => {
            const key = `${mod}:${act}`;
            if (matrix[key] === undefined) {
              matrix[key] = true;
            }
          });
        }
      });
    }

    setLocalMatrix(matrix);
  }, [selectedRole, rolePerms, permissions]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/permissions");
      if (res.ok) {
        const data = await res.json();
        setRolePerms(data.rolePerms || []);
        setPermissions(data.permissions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (module: string, action: string) => {
    const key = `${module}:${action}`;
    setLocalMatrix((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setAllForModule = (module: string, grant: boolean) => {
    const actions = ["VIEW", "ADD", "EDIT", "DELETE", "APPROVE"];
    setLocalMatrix((prev) => {
      const next = { ...prev };
      actions.forEach((act) => {
        next[`${module}:${act}`] = grant;
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const actions = ["VIEW", "ADD", "EDIT", "DELETE", "APPROVE"];
      const updates = modulesList.flatMap((mod) =>
        actions.map((act) => ({
          module: mod,
          action: act,
          isGranted: !!localMatrix[`${mod}:${act}`],
        }))
      );

      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          updates,
        }),
      });

      if (res.ok) {
        setMsg({ type: "success", text: `Permissions for ${selectedRole.replace(/_/g, " ")} saved successfully!` });
        fetchPermissions();
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Failed to save permissions. Please try again." });
      }
    } catch {
      setMsg({ type: "error", text: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const filteredModules = modulesList.filter((mod) =>
    mod.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            {isChte ? "Central Governance Matrix" : "College Security & Access Matrix"}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {isChte ? "Role Permissions Control" : "College Staff Role Permissions"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isChte
              ? "Configure access privileges and action capabilities for affiliated college roles."
              : "Configure access privileges (View, Add, Edit, Delete, Approve) for Principal, BS Coordinator, Faculty, and Students."}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? "Saving Changes..." : "Save Role Permissions"}</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${msg.type === "success"
            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}
        >
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Role Selector Tabs (Only CHTE Directorate Admin & College Admin) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        {ROLES_LIST.map((r) => {
          const active = selectedRole === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setSelectedRole(r.key)}
              className={`p-3 rounded-2xl border text-left transition-all ${active
                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/25 scale-[1.02]"
                : "bg-slate-900/60 hover:bg-slate-900 text-slate-300 border-slate-800"
                }`}
            >
              <div className="text-xs font-bold truncate">{r.label}</div>
              <div className={`text-[10px] mt-0.5 font-mono truncate ${active ? "text-blue-200" : "text-slate-500"}`}>
                {r.key}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search module (e.g. BS_STUDENTS, FEES)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <strong>{filteredModules.length}</strong> modules for role{" "}
          <span className="text-blue-400 font-bold">{selectedRole}</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Loading Permission Matrix...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6 font-bold">Module Key</th>
                  <th className="py-3.5 px-4 font-bold text-center w-24">VIEW</th>
                  <th className="py-3.5 px-4 font-bold text-center w-24">ADD</th>
                  <th className="py-3.5 px-4 font-bold text-center w-24">EDIT</th>
                  <th className="py-3.5 px-4 font-bold text-center w-24">DELETE</th>
                  <th className="py-3.5 px-4 font-bold text-center w-24">APPROVE</th>
                  <th className="py-3.5 px-6 font-bold text-right">Quick Batch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredModules.map((mod) => {
                  const viewKey = `${mod}:VIEW`;
                  const addKey = `${mod}:ADD`;
                  const editKey = `${mod}:EDIT`;
                  const delKey = `${mod}:DELETE`;
                  const approveKey = `${mod}:APPROVE`;

                  return (
                    <tr key={mod} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-6">
                        <div className="font-bold text-white tracking-wide">{mod}</div>
                        <div className="text-[10px] text-slate-400">
                          {mod.replace(/_/g, " ").toLowerCase()} module
                        </div>
                      </td>

                      {/* VIEW */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!localMatrix[viewKey]}
                          onChange={() => togglePermission(mod, "VIEW")}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* ADD */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!localMatrix[addKey]}
                          onChange={() => togglePermission(mod, "ADD")}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* EDIT */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!localMatrix[editKey]}
                          onChange={() => togglePermission(mod, "EDIT")}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* DELETE */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!localMatrix[delKey]}
                          onChange={() => togglePermission(mod, "DELETE")}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* APPROVE */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!localMatrix[approveKey]}
                          onChange={() => togglePermission(mod, "APPROVE")}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* Quick Batch Toggle */}
                      <td className="py-3 px-6 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAllForModule(mod, true)}
                            className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] font-bold"
                          >
                            Allow All
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllForModule(mod, false)}
                            className="px-2 py-1 rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 text-[10px] font-bold"
                          >
                            Revoke
                          </button>
                        </div>
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
