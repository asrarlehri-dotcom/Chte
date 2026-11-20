"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  ShieldCheck,
  Save,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { MODULES } from "@/lib/permissions";

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
  {
    key: "CHTE_ADMIN",
    label: "🏛️ HEMIS Directorate Admin",
    desc: "Central Apex Governance & Provincial Oversight",
  },
];

const ACTIONS_LIST = ["VIEW", "ADD", "EDIT", "DELETE", "APPROVE"] as const;

export default function RolePermissionsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isChte = userRole === "SUPER_ADMIN" || userRole === "CHTE_ADMIN";

  const [selectedRole, setSelectedRole] = useState("CHTE_ADMIN");
  const [rolePerms, setRolePerms] = useState<RolePerm[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [localMatrix, setLocalMatrix] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"ALL" | "BS" | "INTER" | "ADMIN">("ALL");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Compute all available modules (from MODULES and DB)
  const modulesList = useMemo(() => {
    return Array.from(
      new Set([
        ...Object.values(MODULES),
        ...permissions.map((p) => p.module).filter(Boolean),
      ])
    );
  }, [permissions]);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/permissions");
      if (res.ok) {
        const data = await res.json();
        setRolePerms(data.rolePerms || []);
        setPermissions(data.permissions || []);
      }
    } catch (err) {
      console.error("Failed to load permissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Synchronize localMatrix when selectedRole, rolePerms, or modulesList change
  useEffect(() => {
    const matrix: Record<string, boolean> = {};

    rolePerms
      .filter((rp) => rp.role === selectedRole)
      .forEach((rp) => {
        matrix[`${rp.permission.module}:${rp.permission.action}`] = rp.isGranted;
      });

    // Provide default true grants for CHTE Admin / College Admin if not yet in DB
    if (selectedRole === "CHTE_ADMIN" || selectedRole === "COLLEGE_ADMIN") {
      modulesList.forEach((mod) => {
        ACTIONS_LIST.forEach((act) => {
          const key = `${mod}:${act}`;
          if (matrix[key] === undefined) {
            matrix[key] = true;
          }
        });
      });
    }

    setLocalMatrix(matrix);
  }, [selectedRole, rolePerms, modulesList]);

  const togglePermission = (module: string, action: string) => {
    const key = `${module}:${action}`;
    setLocalMatrix((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setAllForModule = (module: string, grant: boolean) => {
    setLocalMatrix((prev) => {
      const next = { ...prev };
      ACTIONS_LIST.forEach((act) => {
        next[`${module}:${act}`] = grant;
      });
      return next;
    });
  };

  const setAllForRole = (grant: boolean) => {
    setLocalMatrix((prev) => {
      const next = { ...prev };
      modulesList.forEach((mod) => {
        ACTIONS_LIST.forEach((act) => {
          next[`${mod}:${act}`] = grant;
        });
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const updates = modulesList.flatMap((mod) =>
        ACTIONS_LIST.map((act) => ({
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
        setMsg({
          type: "success",
          text: `Permissions for ${selectedRole.replace(/_/g, " ")} saved successfully!`,
        });
        fetchPermissions();
      } else {
        const err = await res.json();
        setMsg({
          type: "error",
          text: err.error || "Failed to save permissions. Please try again.",
        });
      }
    } catch {
      setMsg({ type: "error", text: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const filteredModules = useMemo(() => {
    return modulesList.filter((mod) => {
      const matchesSearch = mod.toLowerCase().includes(search.toLowerCase());
      const matchesCat =
        category === "ALL"
          ? true
          : category === "BS"
          ? mod.startsWith("BS.")
          : category === "INTER"
          ? mod.startsWith("INTERMEDIATE.")
          : mod.startsWith("ADMIN.");
      return matchesSearch && matchesCat;
    });
  }, [modulesList, search, category]);

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
            Configure system-wide module-level and action-level credentials for HEMIS Directorate Admin.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setAllForRole(true)}
            disabled={saving || loading}
            className="px-3.5 py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all disabled:opacity-50"
          >
            Grant All for HEMIS Directorate Admin
          </button>
          <button
            type="button"
            onClick={() => setAllForRole(false)}
            disabled={saving || loading}
            className="px-3.5 py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all disabled:opacity-50"
          >
            Revoke All
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving Changes..." : "Save Role Permissions"}</span>
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
            msg.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Role Selection Badge (HEMIS Directorate Admin) */}
      <div className="max-w-md">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-900 border border-blue-500/30 text-white shadow-lg flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black text-white flex items-center gap-2">
              <span className="text-base">🏛️</span>
              <span>HEMIS Directorate Admin</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Apex Role
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Central Directorate Governance. (College Admins operate with autonomous full access within their campus).
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800">
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

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { key: "ALL", label: "All Modules" },
            { key: "BS", label: "BS Degree" },
            { key: "INTER", label: "Intermediate" },
            { key: "ADMIN", label: "Administration" },
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                category === cat.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
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
                            className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] font-bold cursor-pointer"
                          >
                            Allow All
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllForModule(mod, false)}
                            className="px-2 py-1 rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 text-[10px] font-bold cursor-pointer"
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
