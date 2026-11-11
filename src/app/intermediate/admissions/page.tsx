"use client";

import { useState, useEffect, useRef } from "react";
import { usePermissions } from "@/lib/usePermissions";
import { MODULES, ACTIONS } from "@/lib/permissions";
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, X, ClipboardList } from "lucide-react";
import { parseCSVToRows, getSampleCSV, validateAdmissionsBatch } from "@/lib/admissionParser";
import ImportValidationModal from "@/components/ImportValidationModal";

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
  const [programs, setPrograms]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("ALL");
  const [msg, setMsg]               = useState({ type: "", text: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationData, setValidationData] = useState<ReturnType<typeof validateAdmissionsBatch> | null>(null);
  const [importSourceName, setImportSourceName] = useState("");
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: { row: number; student: string; reason: string }[];
  } | null>(null);

  const canAdd    = can(MODULES.INTER_ADMISSIONS, ACTIONS.ADD);
  const canEdit   = can(MODULES.INTER_ADMISSIONS, ACTIONS.EDIT);
  const canApprove= can(MODULES.INTER_ADMISSIONS, ACTIONS.APPROVE);
  const canDelete = can(MODULES.INTER_ADMISSIONS, ACTIONS.DELETE);

  useEffect(() => {
    fetchAdmissions();
    fetchPrograms();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    const res = await fetch("/api/admissions?educationLevel=INTERMEDIATE");
    if (res.ok) setAdmissions(await res.json());
    setLoading(false);
  };

  const fetchPrograms = async () => {
    const res = await fetch("/api/programs");
    if (res.ok) setPrograms(await res.json());
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

    setMsg({ type: "", text: "" });

    try {
      const text = await file.text();
      const parsedAdmissions = parseCSVToRows(text);

      if (parsedAdmissions.length === 0) {
        setMsg({ type: "error", text: "Invalid or empty file. Please make sure the file contains valid headers and student rows." });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const validation = validateAdmissionsBatch(parsedAdmissions, programs, "INTERMEDIATE");
      setValidationData(validation);
      setImportSourceName(file.name);
      setValidationModalOpen(true);
    } catch (err: any) {
      console.error("CSV import error:", err);
      setMsg({ type: "error", text: "An unexpected error occurred while reading the file." });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleProcessPastedText = () => {
    if (!pasteText.trim()) return;
    setMsg({ type: "", text: "" });

    try {
      const parsedAdmissions = parseCSVToRows(pasteText);
      if (parsedAdmissions.length === 0) {
        setMsg({ type: "error", text: "Could not parse any student records. Ensure headers like Student Name, CNIC are included." });
        return;
      }

      const validation = validateAdmissionsBatch(parsedAdmissions, programs, "INTERMEDIATE");
      setValidationData(validation);
      setImportSourceName("Pasted Data");
      setPasteModalOpen(false);
      setValidationModalOpen(true);
    } catch (err: any) {
      console.error("Paste import parse error:", err);
      setMsg({ type: "error", text: "An unexpected error occurred while parsing pasted text." });
    }
  };

  const handleConfirmBatchImport = async (validRows: Record<string, string>[]) => {
    if (validRows.length === 0) return;
    setIsImporting(true);

    try {
      const res = await fetch("/api/admissions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: validRows,
          educationLevel: "INTERMEDIATE"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setValidationModalOpen(false);
        setPasteText("");
        setImportSummary({
          total: data.total,
          imported: data.imported,
          updated: data.updated || 0,
          skipped: data.skipped || 0,
          failed: data.failed,
          errors: data.errors || []
        });

        const summaryParts = [];
        if (data.imported > 0) summaryParts.push(`${data.imported} new imported`);
        if (data.updated > 0) summaryParts.push(`${data.updated} updated`);
        if (data.failed > 0) summaryParts.push(`${data.failed} failed`);

        setMsg({
          type: data.failed > 0 && data.imported === 0 && data.updated === 0 ? "error" : "success",
          text: `Import finished: ${summaryParts.join(", ") || "processed"}.`
        });
        fetchAdmissions();
      } else {
        setMsg({ type: "error", text: data.error || "Failed to process admissions import." });
      }
    } catch (err: any) {
      console.error("Batch import execution error:", err);
      setMsg({ type: "error", text: "An unexpected error occurred while communicating with the server." });
    } finally {
      setIsImporting(false);
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
          {/* File Import */}
          <label className={`px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-all border border-gray-200 cursor-pointer flex items-center gap-2 shadow-xs ${isImporting ? "opacity-60 pointer-events-none" : ""}`}>
            {isImporting ? <Loader2 className="w-4 h-4 text-amber-600 animate-spin" /> : <Upload className="w-4 h-4 text-amber-600" />}
            {isImporting ? "Importing..." : "Import File"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .tsv, .txt, text/csv, text/tab-separated-values, text/plain"
              disabled={isImporting}
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>

          {/* Paste Excel Data */}
          <button
            onClick={() => setPasteModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-xs cursor-pointer"
            title="Paste copied rows directly from Excel or Google Sheets"
          >
            <ClipboardList className="w-4 h-4 text-amber-600" />
            Paste Excel Data
          </button>

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

      {/* Paste Excel Data Modal */}
      {pasteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                  Paste Excel / TSV / CSV Data
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Copy table rows directly from Excel or Google Sheets (Ctrl+C) and paste below (Ctrl+V).
                </p>
              </div>
              <button
                onClick={() => setPasteModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={9}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Student Name\tFather Name\tCNIC\tContact\tEmail\tProgram / Group\tSession\nBilal Ahmed\tTariq Mehmood\t54400-9876543-1\t03129876543\tbilal@test.com\tF.Sc Pre-Medical\t2026-2028"}
              className="w-full p-3 font-mono text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50/50 resize-y"
            />

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!pasteText.trim() || isImporting}
                onClick={handleProcessPastedText}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isImporting ? "Processing..." : "Import Pasted Records"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Pre-Check & Validation Modal */}
      <ImportValidationModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        onConfirmImport={handleConfirmBatchImport}
        validationData={validationData}
        isImporting={isImporting}
        educationLevel="INTERMEDIATE"
        sourceName={importSourceName}
      />

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
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-lg font-bold text-emerald-700">{importSummary.imported}</div>
                <div className="text-[11px] text-emerald-600 font-medium">New Added</div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-lg font-bold text-blue-700">{importSummary.updated}</div>
                <div className="text-[11px] text-blue-600 font-medium">Updated</div>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <div className="text-lg font-bold text-amber-700">{importSummary.skipped}</div>
                <div className="text-[11px] text-amber-600 font-medium">Skipped</div>
              </div>
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-100">
                <div className="text-lg font-bold text-red-700">{importSummary.failed}</div>
                <div className="text-[11px] text-red-600 font-medium">Failed</div>
              </div>
            </div>

            {importSummary.errors.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>Import Notices & Failure Diagnostics:</span>
                  <span className="text-[11px] text-rose-600 font-bold">{importSummary.errors.length} issue(s)</span>
                </div>
                <div className="max-h-52 overflow-y-auto bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-2">
                  {importSummary.errors.map((e, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white border border-rose-200/80 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-gray-900">Row {e.row}: {e.student}</span>
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-bold border border-rose-200">Blocked</span>
                      </div>
                      <div className="text-rose-700 text-xs font-medium">
                        {e.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setImportSummary(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
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
