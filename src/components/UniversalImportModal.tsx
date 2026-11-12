"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  X,
  Search,
  FileSpreadsheet,
  Loader2,
  Check,
  ShieldAlert
} from "lucide-react";
import type { UniversalBatchResult, UniversalFieldDiagnostic } from "@/lib/domainParsers";

interface UniversalImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (validRows: Record<string, string>[]) => Promise<void>;
  validationData: UniversalBatchResult | null;
  isImporting: boolean;
  entityName: string; // e.g. "Course", "Department", "Timetable", "Datesheet", "Marks"
  sourceName?: string;
  extraNotice?: string;
}

export default function UniversalImportModal({
  isOpen,
  onClose,
  onConfirmImport,
  validationData,
  isImporting,
  entityName,
  sourceName,
  extraNotice
}: UniversalImportModalProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "VALID" | "ERRORS" | "WARNINGS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen || !validationData) return null;

  const { total, validCount, errorCount, warningCount, results } = validationData;

  // Filter rows
  const filteredRows = results.filter(row => {
    if (activeTab === "VALID" && !row.isValid) return false;
    if (activeTab === "ERRORS" && row.isValid) return false;
    if (activeTab === "WARNINGS" && (row.warnings.length === 0 || !row.isValid)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inPrimary = row.primaryTitle.toLowerCase().includes(q);
      const inSecondary = (row.secondaryTitle || "").toLowerCase().includes(q);
      const inColumns = row.columns.some(c => c.value.toLowerCase().includes(q));
      const inErrors = row.errors.some(e => e.message.toLowerCase().includes(q) || e.field.toLowerCase().includes(q));
      return inPrimary || inSecondary || inColumns || inErrors;
    }

    return true;
  });

  const handleImport = async () => {
    const validRowsToImport = results.filter(r => r.isValid).map(r => r.raw);
    await onConfirmImport(validRowsToImport);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-gray-50 via-white to-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                  {entityName} Import Diagnostics & Pre-Check
                </h2>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-bold border border-indigo-200">
                  Batch Import
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {sourceName ? `Source: ${sourceName} • ` : ""}
                Verify records and error diagnostics before saving into the system.
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

        {/* KPI Cards */}
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
            <div className="text-[10px] text-gray-500 mt-0.5">Parsed from file/text</div>
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
              {errorCount === 0 ? "No blocking errors" : "Missing required fields"}
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
            <div className="text-[10px] text-amber-600 mt-0.5">Auto-handled defaults</div>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-indigo-600 text-white shadow-xs"
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
              placeholder={`Search ${entityName.toLowerCase()}s, errors...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Notices */}
        {errorCount > 0 && (
          <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>{errorCount} row(s)</strong> have blocking errors. You can click <strong>"Import {validCount} Valid Records"</strong> to import the clean records, or cancel to fix your file.
              </span>
            </div>
          </div>
        )}

        {errorCount === 0 && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All <strong>{total} records</strong> are validated and ready to import!
            </span>
          </div>
        )}

        {extraNotice && (
          <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-800">
            {extraNotice}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">Row</th>
                  <th className="py-2.5 px-3 w-28">Status</th>
                  <th className="py-2.5 px-3">{entityName} Details</th>
                  <th className="py-2.5 px-3">Parameters</th>
                  <th className="py-2.5 px-3">Diagnostics & Validation Reason</th>
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

                      {/* Main Title */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900">{r.primaryTitle}</div>
                        {r.secondaryTitle && (
                          <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                            {r.secondaryTitle}
                          </div>
                        )}
                      </td>

                      {/* Columns */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          {r.columns.map((c, cIdx) => (
                            <span key={cIdx} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                              <strong>{c.label}:</strong> {c.value}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Diagnostics */}
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

                        {/* Clean */}
                        {r.isValid && r.warnings.length === 0 && (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>All parameters valid</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/70">
          <div className="text-xs text-gray-600">
            {validCount > 0 ? (
              <span>
                Ready to import: <strong className="text-emerald-700">{validCount}</strong> of <strong>{total}</strong> records.
                {errorCount > 0 && (
                  <span className="text-rose-600 ml-1">
                    ({errorCount} invalid rows will be skipped)
                  </span>
                )}
              </span>
            ) : (
              <span className="text-rose-600 font-semibold">
                Cannot import: All {total} rows contain blocking errors.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              Cancel & Fix
            </button>

            <button
              onClick={handleImport}
              disabled={validCount === 0 || isImporting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
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

