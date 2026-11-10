"use client";

import { useState, useEffect, useRef } from "react";
import { usePermissions } from "@/lib/usePermissions";
import { MODULES, ACTIONS } from "@/lib/permissions";
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, X } from "lucide-react";
import { parseCSVToRows, getSampleCSV } from "@/lib/admissionParser";

type Admission = {
  id: string;
  studentName: string;
  fatherName: string;
  cnic: string;
  contactNumber: string;
  email: string;
  status: string;
  program?: { name: string } | null;
  group?: { name: string } | null;
  session?: string | null;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100  text-green-800",
  REJECTED: "bg-red-100    text-red-800",
};

export default function IntermediateAdmissionsPage() {
  const { can } = usePermissions();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("ALL");
  const [msg, setMsg]               = useState({ type: "", text: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    skipped: number;
    failed: number;
    errors: { row: number; student: string; reason: string }[];
  } | null>(null);

  const canAdd    = can(MODULES.INTER_ADMISSIONS, ACTIONS.ADD);
  const canEdit   = can(MODULES.INTER_ADMISSIONS, ACTIONS.EDIT);
  const canApprove= can(MODULES.INTER_ADMISSIONS, ACTIONS.APPROVE);
  const canDelete = can(MODULES.INTER_ADMISSIONS, ACTIONS.DELETE);

  useEffect(() => { fetchAdmissions(); }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    const res = await fetch("/api/admissions?educationLevel=INTERMEDIATE");
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

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMsg({ type: "", text: "" });

    try {
      const text = await file.text();
      const parsedAdmissions = parseCSVToRows(text);

      if (parsedAdmissions.length === 0) {
        setMsg({ type: "error", text: "Invalid or empty CSV file. Please make sure the CSV contains headers and data rows." });
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const res = await fetch("/api/admissions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: parsedAdmissions,
          educationLevel: "INTERMEDIATE"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImportSummary({
          total: data.total,
          imported: data.imported,
          skipped: data.skipped || 0,
          failed: data.failed,
          errors: data.errors || []
        });
        if (data.imported > 0) {
          setMsg({
            type: "success",
            text: `Successfully imported ${data.imported} out of ${data.total} admissions!`
          });
        } else {
          setMsg({
            type: "error",
            text: `Import finished: 0 imported, ${data.skipped || 0} skipped, ${data.failed} failed. See summary details.`
          });
        }
        fetchAdmissions();
      } else {
        setMsg({ type: "error", text: data.error || "Failed to process admissions import." });
      }
    } catch (err: any) {
      console.error("CSV import error:", err);
      setMsg({ type: "error", text: "An unexpected error occurred while reading or uploading the CSV file." });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent = getSampleCSV("INTERMEDIATE", "F.Sc Pre-Medical");
    const blob = new Blob(["\uFEFF" + templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Intermediate_Admissions_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ["Student Name", "Father Name", "CNIC", "Contact", "Email", "Program / Group", "Session", "Status", "Date"];
    const rows = filtered.map(a => [
      a.studentName || "",
      a.fatherName || "",
      a.cnic || "N/A",
      a.contactNumber || "",
      a.email || "N/A",
      a.program?.name || a.group?.name || "N/A",
      a.session || "N/A",
      a.status,
      new Date(a.createdAt).toLocaleDateString()
    ]);

    const csvContent = "\uFEFF"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Intermediate_Admissions_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filtered = admissions.filter(a => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      (a.studentName || "").toLowerCase().includes(q) ||
      (a.cnic || "").includes(q) ||
      (a.email || "").toLowerCase().includes(q);
    const matchFilter = filter === "ALL" || a.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intermediate Admissions</h1>
          <p className="text-gray-500 mt-1">Manage F.Sc / F.A admission applications.</p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap self-end sm:self-auto">
          {/* CSV Import */}
          <label className={`px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-all border border-gray-200 cursor-pointer flex items-center gap-2 shadow-xs ${isImporting ? "opacity-60 pointer-events-none" : ""}`}>
            {isImporting ? <Loader2 className="w-4 h-4 text-amber-600 animate-spin" /> : <Upload className="w-4 h-4 text-amber-600" />}
            {isImporting ? "Importing..." : "Import CSV"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              disabled={isImporting}
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>

          {/* Download Sample Template */}
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-xs cursor-pointer"
            title="Download CSV format template with sample rows"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Template CSV
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            Export CSV
          </button>

          {canAdd && (
            <a
              href="/admission"
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium transition-colors"
            >
              + New Application
            </a>
          )}
        </div>
      </div>

      {/* Import Summary Modal */}
      {importSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Admission Import Summary
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Results of batch admissions processing</p>
              </div>
              <button
                onClick={() => setImportSummary(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-xl font-bold text-emerald-700">{importSummary.imported}</div>
                <div className="text-xs text-emerald-600 font-medium">Imported</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="text-xl font-bold text-amber-700">{importSummary.skipped}</div>
                <div className="text-xs text-amber-600 font-medium">Skipped (Duplicate)</div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="text-xl font-bold text-red-700">{importSummary.failed}</div>
                <div className="text-xs text-red-600 font-medium">Failed</div>
              </div>
            </div>

            {importSummary.errors.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-gray-700">Notice / Errors Log:</div>
                <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-1.5 font-mono">
                  {importSummary.errors.map((e, idx) => (
                    <div key={idx} className="flex gap-2 text-gray-700">
                      <span className="font-bold text-gray-900">Row {e.row}:</span>
                      <span className="font-semibold text-amber-700">{e.student}</span> —
                      <span className="text-gray-600">{e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setImportSummary(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {msg.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <input
          type="text" placeholder="🔍 Search name, CNIC, email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${filter === s ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">{filtered.length} / {admissions.length}</span>
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
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Student</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">CNIC</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Program / Group</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{a.studentName}</div>
                      <div className="text-xs text-gray-500">{a.email}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 font-mono text-xs">{a.cnic}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {a.program?.name || "—"}
                      {a.group && <span className="text-xs text-gray-400"> / {a.group.name}</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[a.status] || "bg-gray-100"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        {canApprove && a.status === "PENDING" && (
                          <>
                            <button onClick={() => handleStatus(a.id, "APPROVED")} className="text-green-600 hover:underline text-xs font-medium">Approve</button>
                            <button onClick={() => handleStatus(a.id, "REJECTED")} className="text-red-500 hover:underline text-xs font-medium">Reject</button>
                          </>
                        )}
                        {!canApprove && <span className="text-gray-300 text-xs">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">No applications found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
