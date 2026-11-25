"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/lib/usePermissions";
import { MODULES, ACTIONS } from "@/lib/permissions";
import { UserPlus } from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

type Admission = {
  id: string;
  studentName: string;
  fatherName: string;
  cnic: string;
  contactNumber: string;
  email: string;
  status: string;
  bsAdmissionType?: string | null;
  program?: { name: string } | null;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100  text-green-800",
  REJECTED: "bg-red-100    text-red-800",
};

export default function BsAdmissionsPage() {
  const { data: session } = useSession();
  const userCollegeId = (session?.user as any)?.collegeId;
  const { can } = usePermissions();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("ALL");
  const [msg, setMsg]               = useState({ type: "", text: "" });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (ids: string[]) =>
    setSelectedIds(prev => prev.length === ids.length ? [] : ids);

  const canAdd     = can(MODULES.BS_ADMISSIONS, ACTIONS.ADD);
  const canApprove = can(MODULES.BS_ADMISSIONS, ACTIONS.APPROVE);

  useEffect(() => { fetchAdmissions(); }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    const res = await fetch("/api/admissions?educationLevel=BS");
    if (res.ok) setAdmissions(await res.json());
    setLoading(false);
  };

  const handleStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setMsg({ type: "success", text: `Application ${status.toLowerCase()}` });
      fetchAdmissions();
    } else {
      setMsg({ type: "error", text: "Update failed" });
    }
  };

  const handleRegisterStudent = async (id: string) => {
    const res = await fetch("/api/students/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionId: id }),
    });
    if (res.ok) {
      setMsg({ type: "success", text: "Student registered & fee challan generated!" });
      fetchAdmissions();
    } else {
      const data = await res.json();
      setMsg({ type: "error", text: data.error || "Registration failed" });
    }
  };

  const filtered = admissions.filter(a => {
    const matchSearch =
      a.studentName.toLowerCase().includes(search.toLowerCase()) ||
      a.cnic.includes(search) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || a.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PortalPageHeader
        title="BS Admissions"
        subtitle="Manage BS program admission applications."
        icon={<UserPlus className="w-6 h-6" />}
      >
        {canAdd && (
          <a
            href={userCollegeId ? `/admission?collegeId=${userCollegeId}` : "/admission"}
            className="px-4 py-2 bg-[#047857] text-white rounded-xl hover:bg-[#065f46] text-xs font-bold transition-all shadow-xs"
          >
            + New Application
          </a>
        )}
      </PortalPageHeader>

      {/* Alert message */}
      {msg.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${
          msg.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="🔍 Search name, CNIC, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              filter === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">
          {filtered.length} / {admissions.length}
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
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={() => toggleAll(filtered.map(a => a.id))} />
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Student</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">CNIC</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Program</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id} className={`border-b hover:bg-gray-50 transition-colors ${selectedIds.includes(a.id) ? "bg-blue-50/60" : ""}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        checked={selectedIds.includes(a.id)}
                        onChange={() => toggleSelect(a.id)} />
                    </td>
                    <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{a.studentName}</div>
                      <div className="text-xs text-gray-500">{a.email}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 font-mono text-xs">{a.cnic}</td>
                    <td className="px-5 py-3 text-gray-600">{a.program?.name || "—"}</td>
                    <td className="px-5 py-3">
                      {a.bsAdmissionType ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 font-medium">
                          {a.bsAdmissionType === "BRIDGING_5TH" ? "5th Sem / Bridging" : "Regular"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[a.status] || "bg-gray-100"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {canApprove && a.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleStatus(a.id, "APPROVED")}
                              className="text-green-600 hover:underline text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatus(a.id, "REJECTED")}
                              className="text-red-500 hover:underline text-xs font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {a.status === "APPROVED" && (
                          <button
                            onClick={() => handleRegisterStudent(a.id)}
                            className="text-blue-600 hover:underline text-xs font-bold"
                          >
                            Register & Gen Fee
                          </button>
                        )}
                        {!canApprove && a.status !== "APPROVED" && (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
