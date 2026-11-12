"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { usePermissions } from "@/lib/usePermissions";
import { MODULES, ACTIONS } from "@/lib/permissions";
import {
  GraduationCap,
  Download,
  Upload,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  X,
  ClipboardList
} from "lucide-react";
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
  bsAdmissionType?: string | null;
  migrationSemester?: number | null;
  session?: string | null;
  programId?: string | null;
  groupId?: string | null;
  program?: { name: string } | null;
  rollNumber?: string | null;
  createdAt: string;
};

type ChallanStatus = {
  id: string;
  cnic: string;
  status: string;
  challanNumber: string;
  amount: number;
  paidId?: string | null;
};

export default function BsAdmissionsPage() {
  const { can } = usePermissions();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [challanMap, setChallanMap] = useState<Record<string, ChallanStatus>>({});
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (ids: string[]) =>
    setSelectedIds(prev => prev.length === ids.length ? [] : ids);

  // Edit form states
  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(null);
  const [editForm, setEditForm] = useState({
    studentName: "",
    fatherName: "",
    email: "",
    contactNumber: "",
    cnic: "",
    session: "",
    bsAdmissionType: "",
    programId: "",
    migrationSemester: ""
  });
  const [updating, setUpdating] = useState(false);

  const canAdd = can(MODULES.BS_ADMISSIONS, ACTIONS.ADD);
  const canApprove = can(MODULES.BS_ADMISSIONS, ACTIONS.APPROVE);

  useEffect(() => {
    fetchAdmissions();
    fetchChallans();
    fetchPrograms();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    const res = await fetch("/api/admissions?educationLevel=BS");
    if (res.ok) setAdmissions(await res.json());
    setLoading(false);
  };

  const fetchChallans = async () => {
    const res = await fetch("/api/challans?educationLevel=BS");
    if (res.ok) {
      const data: any[] = await res.json();
      const map: Record<string, ChallanStatus> = {};
      data.forEach(c => {
        if (!map[c.cnic] || c.status === "PAID") {
          map[c.cnic] = { id: c.id, cnic: c.cnic, status: c.status, challanNumber: c.challanNumber, amount: c.amount, paidId: c.paidId };
        }
      });
      setChallanMap(map);
    }
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admission application?")) return;
    const res = await fetch(`/api/admissions/${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      setMsg({ type: "success", text: "Application deleted successfully." });
      fetchAdmissions();
      fetchChallans();
    } else {
      const data = await res.json();
      setMsg({ type: "error", text: data.error || "Failed to delete application" });
    }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admissions?educationLevel=BS&all=true", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true, educationLevel: "BS" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ type: "success", text: `Successfully deleted all ${data.count} BS admission application(s).` });
        setSelectedIds([]);
        setDeleteAllModalOpen(false);
        fetchAdmissions();
        fetchChallans();
      } else {
        setMsg({ type: "error", text: data.error || "Failed to delete admissions." });
      }
    } catch {
      setMsg({ type: "error", text: "Network error while deleting applications." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected admission application(s)?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admissions?educationLevel=BS", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, educationLevel: "BS" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ type: "success", text: `Successfully deleted ${data.count} selected application(s).` });
        setSelectedIds([]);
        fetchAdmissions();
        fetchChallans();
      } else {
        setMsg({ type: "error", text: data.error || "Failed to delete selected applications." });
      }
    } catch {
      setMsg({ type: "error", text: "Network error while deleting selected applications." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEdit = (a: Admission) => {
    setEditingAdmission(a);
    setEditForm({
      studentName: a.studentName || "",
      fatherName: a.fatherName || "",
      email: a.email || "",
      contactNumber: a.contactNumber || "",
      cnic: a.cnic || "",
      session: a.session || "",
      bsAdmissionType: a.bsAdmissionType || "REGULAR",
      programId: a.programId || "",
      migrationSemester: String(a.migrationSemester || "")
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmission) return;
    setUpdating(true);
    const res = await fetch(`/api/admissions/${editingAdmission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        migrationSemester: editForm.bsAdmissionType === "MIGRATION" && editForm.migrationSemester ? Number(editForm.migrationSemester) : null
      })
    });
    if (res.ok) {
      setMsg({ type: "success", text: "Admission details updated successfully." });
      setEditingAdmission(null);
      fetchAdmissions();
      fetchChallans();
    } else {
      const data = await res.json();
      setMsg({ type: "error", text: data.error || "Failed to save details" });
    }
    setUpdating(false);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMsg({ type: "", text: "" });

    try {
      const text = await file.text();
      const parsedAdmissions = parseCSVToRows(text);

      if (parsedAdmissions.length === 0) {
        setMsg({ type: "error", text: "Invalid or empty CSV/TSV file. Please ensure the file contains valid headers and student rows." });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Pre-validate all rows and field diagnostics
      const validation = validateAdmissionsBatch(parsedAdmissions, programs, "BS");
      setValidationData(validation);
      setImportSourceName(file.name);
      setValidationModalOpen(true);
    } catch (err: any) {
      console.error("CSV import parse error:", err);
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
        setMsg({ type: "error", text: "Could not parse any student records. Ensure headers like Student Name, CNIC, Program are included." });
        return;
      }

      // Pre-validate all rows and field diagnostics
      const validation = validateAdmissionsBatch(parsedAdmissions, programs, "BS");
      setValidationData(validation);
      setImportSourceName("Pasted Excel Data");
      setPasteModalOpen(false);
      setValidationModalOpen(true);
    } catch (err: any) {
      console.error("Paste import parse error:", err);
      setMsg({ type: "error", text: "An unexpected error occurred while processing pasted data." });
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
          educationLevel: "BS"
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
        fetchChallans();
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
    const sampleProg = programs[0]?.name || "BS Computer Science";
    const templateContent = getSampleCSV("BS", sampleProg);
    const blob = new Blob(["\uFEFF" + templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `BS_Admissions_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = [
      "Student Name",
      "Father Name",
      "CNIC",
      "Contact",
      "Email",
      "Program",
      "Session",
      "Status",
      "Challan No",
      "Fee Status"
    ];
    const rows = filtered.map(a => [
      a.studentName || "",
      a.fatherName || "",
      a.cnic || "N/A",
      a.contactNumber || "",
      a.email || "N/A",
      a.program?.name || "N/A",
      a.session || "N/A",
      a.status,
      challanMap[a.cnic]?.challanNumber || "N/A",
      challanMap[a.cnic]?.status || "N/A"
    ]);

    const csvContent = "\uFEFF"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `BS_Admissions_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return admissions.filter(a => {
      const matchSearch =
        !q ||
        (a.studentName || "").toLowerCase().includes(q) ||
        (a.fatherName || "").toLowerCase().includes(q) ||
        (a.cnic || "").includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.program?.name || "").toLowerCase().includes(q);
      const matchFilter = filter === "ALL" || a.status === filter;
      return matchSearch && matchFilter;
    });
  }, [admissions, search, filter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedAdmissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-5">
      {/* Print Page adjustments */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          aside, .sidebar, .print-hide, .no-print, button, label, input, select, header {
            display: none !important;
          }
          html, body, div.flex.h-screen, main {
            height: auto !important;
            overflow: visible !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
        }
      `}} />

      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <GraduationCap className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">BS Admissions</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage BS program admission applications.</p>
          </div>
        </div>

        <div className="flex gap-2.5 items-center flex-wrap self-end sm:self-auto">
          {/* CSV/TSV File Import */}
          <label className={`px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 cursor-pointer flex items-center gap-2 shadow-xs ${isImporting ? "opacity-60 pointer-events-none" : ""}`}>
            {isImporting ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin" /> : <Upload className="w-4 h-4 text-blue-600" />}
            {isImporting ? "Importing Admissions..." : "Import File"}
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
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-xs cursor-pointer"
            title="Paste copied rows directly from Excel or Google Sheets"
          >
            <ClipboardList className="w-4 h-4 text-indigo-600" />
            Paste Excel Data
          </button>

          {/* Download Sample Template */}
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-xs cursor-pointer"
            title="Download CSV format template with sample rows"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Template CSV
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            Export CSV
          </button>

          {/* PDF Export */}
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-red-500" />
            Export PDF
          </button>

          {/* Delete All Applications */}
          {admissions.length > 0 && (
            <button
              onClick={() => setDeleteAllModalOpen(true)}
              disabled={isDeleting}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-all border border-rose-200 flex items-center gap-2 shadow-xs cursor-pointer"
              title="Delete all BS admission applications"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              Delete All
            </button>
          )}

          {canAdd && (
            <a
              href="/admission"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-xs font-semibold transition-all shadow-sm shadow-blue-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              New Application
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
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
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
              placeholder={"Student Name\tFather Name\tCNIC\tContact\tEmail\tProgram\tSession\nMuhammad Ali\tGhulam Ali\t54400-1234567-1\t03001234567\tm.ali@test.com\tBS Computer Science\t2026-2030"}
              className="w-full p-3 font-mono text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 resize-y"
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
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
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
        educationLevel="BS"
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
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {deleteAllModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-100 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete All BS Admissions</h3>
                <p className="text-xs text-rose-600 font-semibold">Irreversible administrative action</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-2 text-xs text-rose-900">
              <p className="font-semibold">
                Are you sure you want to permanently delete all {admissions.length} BS admission application(s)?
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-700 font-medium">
                <li>All applicant records and personal details will be deleted.</li>
                <li>All associated admission fee challans will be deleted.</li>
                <li>This will clear all applications from the database.</li>
              </ul>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteAllModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert message */}
      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs ${msg.type === "success"
          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
          : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ type: "", text: "" })} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Filters & Search Card */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, CNIC, or email..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200/90 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 placeholder-gray-400 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setFilter("ALL"); setCurrentPage(1); }}
            className={`px-4 py-1.5 text-xs rounded-xl font-semibold transition-all cursor-pointer ${filter === "ALL"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200/80"
              }`}
          >
            All
          </button>

          <button
            onClick={() => { setFilter("PENDING"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 text-xs rounded-xl font-semibold transition-all flex items-center gap-2 cursor-pointer ${filter === "PENDING"
              ? "bg-amber-50 text-amber-900 border border-amber-300 ring-2 ring-amber-400/20"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80"
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Pending
          </button>

          <button
            onClick={() => { setFilter("APPROVED"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 text-xs rounded-xl font-semibold transition-all flex items-center gap-2 cursor-pointer ${filter === "APPROVED"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-300 ring-2 ring-emerald-400/20"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80"
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Approved
          </button>

          <button
            onClick={() => { setFilter("REJECTED"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 text-xs rounded-xl font-semibold transition-all flex items-center gap-2 cursor-pointer ${filter === "REJECTED"
              ? "bg-rose-50 text-rose-900 border border-rose-300 ring-2 ring-rose-400/20"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80"
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Rejected
          </button>
        </div>

        {/* Counter Block */}
        <div className="flex items-center gap-3 pl-3 sm:border-l sm:border-gray-100">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg">
                {selectedIds.length} selected
              </span>
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                title="Delete only selected applications"
              >
                <Trash2 className="w-3 h-3" />
                Delete Selected
              </button>
            </div>
          )}
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900 leading-tight">
              {filtered.length} <span className="text-gray-400 font-normal">/ {admissions.length}</span>
            </div>
            <div className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
              Total
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-xs font-medium">Loading applications...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-700">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer focus:ring-0"
                      checked={selectedIds.length === paginatedAdmissions.length && paginatedAdmissions.length > 0}
                      onChange={() => toggleAll(paginatedAdmissions.map(a => a.id))}
                    />
                  </th>
                  <th className="py-3.5 px-3 w-8">#</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">CNIC</th>
                  <th className="py-3.5 px-4">Program</th>
                  <th className="py-3.5 px-4">Session</th>
                  <th className="py-3.5 px-4">Challan Type</th>
                  <th className="py-3.5 px-4">Fee Status</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {paginatedAdmissions.map((a, i) => {
                  const rowIndex = (currentPage - 1) * pageSize + i + 1;
                  const isSelected = selectedIds.includes(a.id);
                  const challan = challanMap[a.cnic];

                  return (
                    <tr
                      key={a.id}
                      className={`hover:bg-blue-50/30 transition-colors ${isSelected ? "bg-blue-50/60" : "bg-white"}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer focus:ring-0"
                          checked={isSelected}
                          onChange={() => toggleSelect(a.id)}
                        />
                      </td>
                      <td className="py-3.5 px-3 font-medium text-gray-800">{rowIndex}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="font-bold text-blue-600 hover:text-blue-700 text-left block transition-colors"
                        >
                          {a.studentName}
                        </button>
                        <div className="text-[11px] text-gray-500 mt-0.5">{a.email || "No email"}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800 text-[11px]">
                        {a.cnic || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {a.program?.name || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium">
                        {a.session || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {challan ? (
                          <a
                            href={`/print/challan/${challan.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            {challan.challanNumber}
                          </a>
                        ) : (
                          <span className="text-gray-500 font-normal">No Challan</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-3 py-1 text-[11px] rounded-full bg-blue-50 text-blue-600 font-semibold">
                          {a.bsAdmissionType === "BRIDGING_5TH"
                            ? "Bridging"
                            : a.bsAdmissionType === "MIGRATION"
                              ? `Migration (Sem ${a.migrationSemester ?? "?"})`
                              : "Regular"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {a.status === "PENDING" && (
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800">
                            PENDING
                          </span>
                        )}
                        {a.status === "APPROVED" && (
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800">
                            APPROVED
                          </span>
                        )}
                        {a.status === "REJECTED" && (
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-100 text-rose-800">
                            REJECTED
                          </span>
                        )}
                        {a.status === "APPROVED" && a.rollNumber && (
                          <div className="mt-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 inline-block font-mono">
                            🆔 {a.rollNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium">
                        {new Date(a.createdAt).toLocaleDateString("en-US")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {canApprove && a.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleStatus(a.id, "APPROVED")}
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-xs font-semibold cursor-pointer transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatus(a.id, "REJECTED")}
                                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-16 text-gray-400 text-xs">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer & Pagination */}
        <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <div className="relative inline-block">
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-2.5 py-1 pr-6 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === page
                  ? "bg-blue-600 text-white shadow-xs"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Admission Modal */}
      {editingAdmission && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-gray-900">Update Admission & Student Profile</h2>
            <p className="text-xs text-gray-500">Update details for CNIC: {editForm.cnic}</p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Student Name *</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                    value={editForm.studentName}
                    onChange={e => setEditForm(f => ({ ...f, studentName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Father's Name *</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                    value={editForm.fatherName}
                    onChange={e => setEditForm(f => ({ ...f, fatherName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Contact Number *</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                    value={editForm.contactNumber}
                    onChange={e => setEditForm(f => ({ ...f, contactNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">CNIC Number *</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 font-mono"
                    value={editForm.cnic}
                    onChange={e => setEditForm(f => ({ ...f, cnic: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Session Year Prefix *</label>
                  <input
                    required
                    placeholder="e.g. 2026-2028"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                    value={editForm.session}
                    onChange={e => setEditForm(f => ({ ...f, session: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Admission Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                    value={editForm.bsAdmissionType}
                    onChange={e => setEditForm(f => ({ ...f, bsAdmissionType: e.target.value }))}
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="BRIDGING_5TH">Bridging 5th</option>
                    <option value="MIGRATION">Migration</option>
                  </select>
                </div>
                {editForm.bsAdmissionType === "MIGRATION" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Migration Semester</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                      value={editForm.migrationSemester}
                      onChange={e => setEditForm(f => ({ ...f, migrationSemester: e.target.value }))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={String(s)}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Program</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                  value={editForm.programId}
                  onChange={e => setEditForm(f => ({ ...f, programId: e.target.value }))}
                >
                  <option value="">-- Select BS Program --</option>
                  {programs.filter((p: any) => p.educationLevel === "BS").map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xs"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAdmission(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

