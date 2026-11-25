"use client";

import { useState, useEffect } from "react";
import { History } from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

type AuditLog = {
  id: string;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  createdAt: string;
};

const ACTION_COLORS: Record<string, string> = {
  CREATE:  "bg-green-100 text-green-700",
  UPDATE:  "bg-blue-100 text-blue-700",
  DELETE:  "bg-red-100 text-red-700",
  LOGIN:   "bg-purple-100 text-purple-700",
  PUBLISH: "bg-indigo-100 text-indigo-700",
  APPROVE: "bg-teal-100 text-teal-700",
  REJECT:  "bg-orange-100 text-orange-700",
};

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "PUBLISH", "APPROVE", "REJECT"];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [entities, setEntities] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/audit-logs");
    if (res.ok) {
      const data: AuditLog[] = await res.json();
      setLogs(data);
      // Extract unique entities
      const unique = Array.from(new Set(data.map((l) => l.entity)));
      setEntities(unique.sort());
    }
    setLoading(false);
  };

  const filtered = logs.filter((l) => {
    const matchSearch =
      (l.userName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.userEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction ? l.action === filterAction : true;
    const matchEntity = filterEntity ? l.entity === filterEntity : true;
    return matchSearch && matchAction && matchEntity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PortalPageHeader
        title="Audit Logs"
        subtitle="Track all system activity — who did what and when."
        icon={<History className="w-6 h-6" />}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ACTIONS.slice(0, 4).map((action) => {
          const count = logs.filter((l) => l.action === action).length;
          return (
            <div key={action} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${ACTION_COLORS[action] || "bg-gray-100 text-gray-600"}`}>
                {action}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="🔍 Search user, description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">-- All Actions --</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">-- All Entities --</option>
          {entities.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          🔄 Refresh
        </button>
        <span className="text-sm text-gray-500">
          {filtered.length} / {logs.length} entries
        </span>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-12">Loading audit logs...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p>No audit logs found.</p>
            <p className="text-xs mt-1">Logs appear here as users perform actions in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 font-semibold text-gray-600 whitespace-nowrap">Time</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 whitespace-nowrap">User</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 whitespace-nowrap">Action</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 whitespace-nowrap">Entity</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(log.createdAt).toLocaleString("en-PK")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900 text-xs">
                        {log.userName || "System"}
                      </div>
                      <div className="text-gray-400 text-xs">{log.userEmail || ""}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded-full ${
                          ACTION_COLORS[log.action] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 font-medium">
                        {log.entity}
                      </span>
                      {log.entityId && (
                        <div className="text-gray-400 text-xs mt-0.5 font-mono truncate max-w-[80px]">
                          {log.entityId.substring(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-700 max-w-sm">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
