"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Upload,
  X,
  Search,
  Filter,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Check,
  Info
} from "lucide-react";
import type { RowValidationResult, FieldDiagnostic } from "@/lib/admissionParser";

interface ImportValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (validRows: Record<string, string>[]) => Promise<void>;
  validationData: {
    total: number;
    validCount: number;
    errorCount: number;
    warningCount: number;
    results: RowValidationResult[];
  } | null;
  isImporting: boolean;
  educationLevel: "BS" | "INTERMEDIATE";
  sourceName?: string;
}

export default function ImportValidationModal({
  isOpen,
  onClose,
  onConfirmImport,
  validationData,
  isImporting,
  educationLevel,
  sourceName
}: ImportValidationModalProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "VALID" | "ERRORS" | "WARNINGS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen || !validationData) return null;

  const { total, validCount, errorCount, warningCount, results } = validationData;

  // Filter rows
  const filteredRows = results.filter(row => {
    // Tab filter
    if (activeTab === "VALID" && !row.isValid) return false;
    if (activeTab === "ERRORS" && row.isValid) return false;
    if (activeTab === "WARNINGS" && (row.warnings.length === 0 || !row.isValid)) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inStudent = (row.studentName || "").toLowerCase().includes(q);
      const inFather = (row.fatherName || "").toLowerCase().includes(q);
      const inCnic = (row.cnic || "").toLowerCase().includes(q);
      const inContact = (row.contactNumber || "").toLowerCase().includes(q);
      const inProg = (row.program || "").toLowerCase().includes(q);
      const inErrors = row.errors.some(e => e.message.toLowerCase().includes(q) || e.field.toLowerCase().includes(q));
      return inStudent || inFather || inCnic || inContact || inProg || inErrors;
    }

    return true;
  });

  const handleImport = async () => {
    const validRowsToImport = results.filter(r => r.isValid).map(r => r.raw);
    await onConfirmImport(validRowsToImport);
  };

  const getDiagnosticBadge = (diag: FieldDiagnostic, isError: boolean) => {
    const baseClass = isError
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

    return (
      <span
        key={diag.message}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${baseClass}`}
      >
        {isError ? <XCircle className="w-3 h-3 text-rose-500" /> : <AlertTriangle className="w-3 h-3 text-amber-500" />}
        {diag.field}: {diag.code.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-gray-50 via-white to-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                  Import Data Pre-Check & Field Diagnostics
                </h2>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] font-bold border border-blue-200">
                  {educationLevel}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {sourceName ? `Source: ${sourceName} • ` : ""}
                Verify records, missing required fields, and diagnostics before committing to the database.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="p-4 sm:p-5 bg-gray-50/70 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setActiveTab("ALL")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-white border-blue-500 ring-2 ring-blue-500/10 shadow-xs"
                : "bg-white/80 border-gray-200 hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Total Rows</span>
              <FileSpreadsheet className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-xl font-extrabold text-gray-900 mt-1">{total}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Parsed from source</div>
          </div>

          <div
            onClick={() => setActiveTab("VALID")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === "VALID"
                ? "bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs"
                : "bg-white/80 border-gray-200 hover:bg-emerald-50/30"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
              <span>Ready to Import</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-700 mt-1">{validCount}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">
              {validCount === total ? "100% valid" : `${Math.round((validCount / Math.max(1, total)) * 100)}% clean`}
            </div>
          </div>

          <div
            onClick={() => setActiveTab("ERRORS")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === "ERRORS"
                ? "bg-rose-50/60 border-rose-500 ring-2 ring-rose-500/10 shadow-xs"
                : "bg-white/80 border-gray-200 hover:bg-rose-50/30"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-700 font-medium">
              <span>Cannot Import (Errors)</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-extrabold text-rose-700 mt-1">{errorCount}</div>
            <div className="text-[10px] text-rose-600 mt-0.5">
              {errorCount === 0 ? "No blocking errors" : "Missing CNIC/Name/Contact"}
            </div>
          </div>

          <div
            onClick={() => setActiveTab("WARNINGS")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === "WARNINGS"
                ? "bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/10 shadow-xs"
                : "bg-white/80 border-gray-200 hover:bg-amber-50/30"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-700 font-medium">
              <span>Notices / Warnings</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-amber-700 mt-1">{warningCount}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Auto-formatted or blank father</div>
          </div>
        </div>

        {/* Search & Filter Tabs */}
        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Records ({total})
            </button>
            <button
              onClick={() => setActiveTab("VALID")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "VALID"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              Ready ({validCount})
            </button>
            <button
              onClick={() => setActiveTab("ERRORS")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "ERRORS"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
              }`}
            >
              Errors ({errorCount})
            </button>
            <button
              onClick={() => setActiveTab("WARNINGS")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "WARNINGS"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              Warnings ({warningCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by student, CNIC, error..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Diagnostic Banner */}
        {errorCount > 0 && (
          <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>{errorCount} student row(s)</strong> have critical issues (e.g. missing CNIC, missing student name, or invalid contact).
                You can import the <strong>{validCount} valid records</strong> directly, or cancel to fix your file.
              </span>
            </div>
          </div>
        )}

        {errorCount === 0 && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All <strong>{total} records</strong> passed validation! Every required field (Student Name, CNIC, Contact, Program) is in order.
            </span>
          </div>
        )}

        {/* Records Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">Row</th>
                  <th className="py-2.5 px-3 w-28">Status</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">CNIC / B-Form</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Program / Session</th>
                  <th className="py-2.5 px-3">Validation Diagnostics & Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredRows.map(r => {
                  return (
                    <tr
                      key={r.row}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        !r.isValid ? "bg-rose-50/20" : r.warnings.length > 0 ? "bg-amber-50/10" : ""
                      }`}
                    >
                      {/* Row # */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-gray-500">
                        {r.row}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {r.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Cannot Import
                          </span>
                        )}
                      </td>

                      {/* Student & Father Name */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900">{r.studentName}</div>
                        <div className="text-[11px] text-gray-500">Father: {r.fatherName}</div>
                      </td>

                      {/* CNIC */}
                      <td className="py-3 px-3 font-mono">
                        {r.cnic ? (
                          <span className="font-semibold text-gray-800">{r.cnic}</span>
                        ) : (
                          <span className="text-rose-500 font-bold italic">[Missing CNIC]</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3 font-mono text-gray-700">
                        {r.contactNumber !== "—" ? (
                          r.contactNumber
                        ) : (
                          <span className="text-rose-500 font-bold italic">[Missing Contact]</span>
                        )}
                      </td>

                      {/* Program & Session */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900">{r.program}</div>
                        <div className="text-[11px] text-gray-500">Session: {r.session}</div>
                      </td>

                      {/* Validation Diagnostics & Reasons */}
                      <td className="py-3 px-3">
                        {/* Errors */}
                        {r.errors.length > 0 && (
                          <div className="space-y-1.5">
                            {r.errors.map((err, eIdx) => (
                              <div
                                key={eIdx}
                                className="p-2 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-900 space-y-0.5"
                              >
                                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span>{err.message}</span>
                                </div>
                                {err.tip && (
                                  <div className="text-[10px] text-rose-700 pl-5">
                                    💡 <strong>Fix:</strong> {err.tip}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Warnings */}
                        {r.warnings.length > 0 && (
                          <div className={`space-y-1.5 ${r.errors.length > 0 ? "mt-1.5" : ""}`}>
                            {r.warnings.map((warn, wIdx) => (
                              <div
                                key={wIdx}
                                className="p-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 space-y-0.5 text-[11px]"
                              >
                                <div className="flex items-center gap-1 font-semibold">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>{warn.message}</span>
                                </div>
                                {warn.tip && (
                                  <div className="text-[10px] text-amber-700 pl-4">
                                    ℹ️ {warn.tip}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Completely Clean */}
                        {r.isValid && r.warnings.length === 0 && (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>All fields valid & verified</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No matching records found for the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/70">
          <div className="text-xs text-gray-600">
            {validCount > 0 ? (
              <span>
                Ready to import: <strong className="text-emerald-700">{validCount}</strong> of <strong>{total}</strong> records.
                {errorCount > 0 && (
                  <span className="text-rose-600 ml-1">
                    ({errorCount} invalid records will be skipped)
                  </span>
                )}
              </span>
            ) : (
              <span className="text-rose-600 font-semibold">
                Cannot import: All {total} records contain blocking validation errors.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              Cancel & Fix File
            </button>

            <button
              onClick={handleImport}
              disabled={validCount === 0 || isImporting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing Records...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>
                    Import {validCount} Valid Record{validCount === 1 ? "" : "s"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
