"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSettings } from "@/lib/useSettings";
import { ShieldCheck } from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

type StudentData = {
  id: string;
  rollNumber: string;
  registrationNumber?: string;
  user: { name: string; email: string };
  currentSemester: number | null;
  bsAdmissionType: string | null;
  session?: string;
  shift?: string;
  isActive: boolean;
  program?: { name: string };
  statuses?: any[];
};

function StudentActionsContent() {
  const { collegeName, collegeLogo, settings } = useSettings();
  const searchParams = useSearchParams();
  const initialAction = searchParams.get("action")?.toUpperCase() || "FREEZE";

  const collegeCodePrefix = (settings?.COLLEGE_CODE || "GPGCQ").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const currentYear = new Date().getFullYear();

  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [activeTab, setActiveTab] = useState(initialAction);

  // Form input states with distinct institutional Memo Numbers
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [fromSem, setFromSem] = useState("3");
  const [toSem, setToSem] = useState("4");
  const [freezeMemoNo, setFreezeMemoNo] = useState(() => `${collegeCodePrefix || "GPGCQ"}/EXAM/FRZ/${currentYear}/${Math.floor(1000 + Math.random() * 9000)}`);
  const [relievingNo, setRelievingNo] = useState(() => `${collegeCodePrefix || "GPGCQ"}/EXAM/MIG-NOC/${currentYear}/${Math.floor(1000 + Math.random() * 9000)}`);
  const [adaMemoNo, setAdaMemoNo] = useState(() => `${collegeCodePrefix || "GPGCQ"}/EXAM/ADA-ADS/${currentYear}/${Math.floor(1000 + Math.random() * 9000)}`);

  // Feedback & Modal states
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Printable Form Modals
  const [showFreezePrintModal, setShowFreezePrintModal] = useState(false);
  const [showRelievingCertModal, setShowRelievingCertModal] = useState(false);
  const [actionStudent, setActionStudent] = useState<StudentData | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students?educationLevel=BS");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudents(data);
          if (data.length > 0) setSelectedStudentId(data[0].id);
        }
      }
    } catch {
      setError("Failed to fetch student database.");
    }
    setLoading(false);
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Filter students for Migration In (Automated from Admissions)
  const migrationInStudents = students.filter(
    (s) => s.bsAdmissionType === "MIGRATION" || s.statuses?.some((st) => st.statusType === "MIGRATION_IN")
  );

  // Filter students for Migration Out (Relieving cert issued)
  const migrationOutStudents = students.filter((s) =>
    s.statuses?.some((st) => st.statusType === "MIGRATION_OUT" || st.statusType === "MIGRATION")
  );

  // Handle Manual Freeze Action
  const handleFreezeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedStudent) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/students/status-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          statusType: "FREEZE",
          memoNo: freezeMemoNo,
          fromSem,
          toSem,
          reason,
          notes: `Freeze Duration: Sem ${fromSem} to Sem ${toSem}. Remarks: ${remarks}`,
        }),
      });

      if (res.ok) {
        setSuccess(`Semester freeze recorded for ${selectedStudent.user?.name}! You can now print the agreement form.`);
        setActionStudent(selectedStudent);
        setShowFreezePrintModal(true);
        fetchStudents();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to process semester freeze.");
      }
    } catch {
      setError("Server connection failed.");
    }
    setSaving(false);
  };

  // Handle Quit / ADP Exit Action
  const handleQuitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedStudent) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/students/status-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          statusType: "QUIT",
          memoNo: adaMemoNo,
          reason,
          notes: `Program Quit / ADP Exit. Remarks: ${remarks}`,
        }),
      });

      if (res.ok) {
        setSuccess(`Student "${selectedStudent.user?.name}" status updated to Quit / ADP Exit.`);
        setReason("");
        setRemarks("");
        fetchStudents();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to update quit status.");
      }
    } catch {
      setError("Server connection failed.");
    }
    setSaving(false);
  };

  // Handle Migration Out & Relieving Certificate Generation
  const handleMigrationOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedStudent) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/students/status-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          statusType: "MIGRATION_OUT",
          reason,
          memoNo: relievingNo,
          relievingNo,
          destinationCollege: reason,
          notes: `Relieving Certificate / NOC Issued: ${relievingNo}. Destination Institute: ${reason}`,
        }),
      });

      if (res.ok) {
        setSuccess(`Relieving Certificate generated & Status updated to Migration Out for ${selectedStudent.user?.name}!`);
        setActionStudent(selectedStudent);
        setShowRelievingCertModal(true);
        fetchStudents();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to process outward migration.");
      }
    } catch {
      setError("Server connection failed.");
    }
    setSaving(false);
  };

  return (
    <div className="actions-page-root space-y-6 max-w-6xl mx-auto print:max-w-none print:w-full print:mx-0 print:space-y-0">
      {(showFreezePrintModal || showRelievingCertModal) && (
        <style>{`
          @media print {
            @page {
              size: letter portrait;
              margin: 9mm 10mm;
            }
            html, body {
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .actions-page-root > :not(.bs-active-print-modal):not(style) {
              display: none !important;
            }
          }
        `}</style>
      )}
      {/* Top Banner */}
      <PortalPageHeader
        title="Student Academic Status & Actions"
        subtitle="Manage semester freeze agreements, outward migration relieving certificates, and quit/ADP exits."
        icon={<ShieldCheck className="w-6 h-6" />}
        badge={
          <span className="px-2.5 py-0.5 text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
            Academic Branch Operations
          </span>
        }
      />

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-semibold border border-red-200">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-semibold border border-green-200">{success}</div>}

      {/* Main Tabs Navigation Bar */}
      <div className="flex flex-wrap bg-white p-2 rounded-2xl border border-gray-200 shadow-sm gap-1">
        {[
          { key: "FREEZE", label: "❄️ Freeze Status", desc: "Manual Freeze & Printable Form" },
          { key: "QUIT", label: "🎓 Quit / ADA / ADS", desc: "2-Year Exit & ADA/ADS Award" },
          { key: "MIGRATION-IN", label: "➡️ Migration In", desc: "Auto Admitted Migrations" },
          { key: "MIGRATION-OUT", label: "⬅️ Migration Out", desc: "Relieving Certificate & NOC" },
          { key: "PROMOTED", label: "🏆 Promoted", desc: "Auto Result Promotions" },
          { key: "DROPOUT", label: "🚫 Dropout", desc: "Auto Result Dropouts" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-extrabold transition-all text-center ${activeTab === tab.key
              ? "bg-blue-600 text-white shadow-md scale-[1.02]"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
          >
            <div>{tab.label}</div>
            <div className={`text-[10px] font-normal mt-0.5 ${activeTab === tab.key ? "text-blue-100" : "text-gray-400"}`}>
              {tab.desc}
            </div>
          </button>
        ))}
      </div>

      {/* TAB 1: FREEZE STATUS (Manual input + Remarks + Printable Form) */}
      {activeTab === "FREEZE" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>❄️ Manual Semester Freeze Request</span>
              <span className="px-2.5 py-0.5 text-xs bg-cyan-100 text-cyan-800 rounded-full font-extrabold">Agreement & Remarks</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Process manual semester freeze. Generating a freeze form includes printable agreement with student & HOD signatures.
            </p>
          </div>

          {loading ? (
            <p className="text-center py-8 text-gray-400">Loading student records...</p>
          ) : (
            <form onSubmit={handleFreezeSubmit} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Student *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-400"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user?.name} ({s.rollNumber}) — Sem {s.currentSemester || 1} ({s.program?.name || "BS"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Freeze From Semester *</label>
                  <select
                    value={fromSem}
                    onChange={(e) => setFromSem(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl text-sm bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unfreeze At Semester *</label>
                  <select
                    value={toSem}
                    onChange={(e) => setToSem(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl text-sm bg-white"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Official Reason for Freeze *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Medical reasons / Financial hardship / Family emergency"
                  className="w-full px-4 py-2 border rounded-xl text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student Remarks / Undertaking *</label>
                <textarea
                  required
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Student undertaking remarks: I request to freeze my current semester due to above reason and agree to abide by college policy..."
                  className="w-full px-4 py-2 border rounded-xl text-sm bg-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
                >
                  <span>❄️ Process Freeze & Generate Form</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: QUIT / ADA / ADS EXIT */}
      {activeTab === "QUIT" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>🎓 Program Quit / Associate Degree (ADA / ADS) Exit</span>
              <span className="px-2.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-extrabold">2-Year Degree Award</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Mark student program exit or 2-year Associate Degree (ADA / ADS) completion exit with official BS Examination committee minutes of meeting.
            </p>
          </div>

          <form onSubmit={handleQuitSubmit} className="space-y-5 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Student *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-400 font-bold text-gray-800"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user?.name} ({s.rollNumber}) — Sem {s.currentSemester || 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exit Category *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl text-sm bg-white font-semibold"
              >
                <option value="Compulsory Work">Compulsory Work (ADA / ADS Exit)</option>
                <option value="Employment Exit">Job / Employment Exit (ADA / ADS)</option>
                <option value="Financial Constraints">Financial Constraints (ADA / ADS)</option>
                <option value="Domestic Reasons">Domestic Reasons (ADA / ADS)</option>
                <option value="Personal Quit">Voluntary Program Quit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Institutional Notes / Remarks</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter exit details, tangible reason stipulated in statement, or minutes of meeting notes..."
                className="w-full px-4 py-2 border rounded-xl text-sm bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>🎓</span>
              <span>Confirm Quit / ADA-ADS Exit</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MIGRATION IN (Automated from Admissions) */}
      {activeTab === "MIGRATION-IN" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="border-b pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>➡️ Migration In Students</span>
                <span className="px-2.5 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full font-extrabold">Automated Admission Link</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Students admitted via outward institution transfer / Migration In mode are automatically pulled from Admissions database.
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
              {migrationInStudents.length} Migrated Record(s)
            </span>
          </div>

          <div className="overflow-x-auto border rounded-xl shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">Student Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Roll Number</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Program</th>
                  <th className="px-4 py-3 font-semibold text-center">Semester</th>
                  <th className="px-4 py-3 font-semibold text-center">Admission Mode</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {migrationInStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 font-medium">
                      No incoming migration student records found in database.
                    </td>
                  </tr>
                ) : (
                  migrationInStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">{s.user?.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.rollNumber}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{s.program?.name || "BS"}</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-700">Semester {s.currentSemester || 3}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full font-bold">
                          Migration In
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-bold">
                          Active & Enrolled
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MIGRATION OUT (Relieving Certificate & NOC Generation) */}
      {activeTab === "MIGRATION-OUT" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>⬅️ Outward Migration & Relieving Certificate (NOC)</span>
              <span className="px-2.5 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full font-extrabold">NOC & Auto-Status</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Issue official Relieving Certificate / NOC for outward student migration. Issuing the certificate automatically updates student status to Migration Out.
            </p>
          </div>

          <form onSubmit={handleMigrationOutSubmit} className="space-y-5 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Student *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-400"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user?.name} ({s.rollNumber}) — Sem {s.currentSemester || 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">NOC / Relieving Certificate Serial No. *</label>
              <input
                type="text"
                required
                value={relievingNo}
                onChange={(e) => setRelievingNo(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl text-sm bg-white font-mono font-bold text-orange-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination University / College *</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Quaid-i-Azam University / University of the Punjab"
                className="w-full px-4 py-2 border rounded-xl text-sm bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
            >
              <span>📜 Issue Relieving Certificate & Mark Migration Out</span>
            </button>
          </form>

          {/* Issued Migration Out Records Table */}
          {migrationOutStudents.length > 0 && (
            <div className="pt-4 border-t space-y-3">
              <h3 className="font-bold text-gray-800 text-sm">Issued Migration Out Records</h3>
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Student</th>
                      <th className="px-4 py-2 font-semibold">Roll No</th>
                      <th className="px-4 py-2 font-semibold">NOC / Relieving Cert</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {migrationOutStudents.map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-2 font-bold">{s.user?.name}</td>
                        <td className="px-4 py-2 font-mono">{s.rollNumber}</td>
                        <td className="px-4 py-2 font-mono font-bold text-orange-700">
                          {s.statuses?.find((st) => st.statusType === "MIGRATION_OUT")?.notes || "Issued"}
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-bold">
                            ⬅️ Migration Out
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5 & 6: PROMOTED & DROPOUT (Automatic from Examinations & Results) */}
      {(activeTab === "PROMOTED" || activeTab === "DROPOUT") && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>{activeTab === "PROMOTED" ? "🏆 Automatic Semester Promotions" : "🚫 Automatic Result Dropouts"}</span>
              <span className="px-2.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-extrabold">Results Sync</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Promotions and Dropouts are automatically computed and updated when semester GPA/CGPA results are compiled in Examinations & Results branch.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-blue-900 text-base">Automatic Evaluation active</h3>
              <p className="text-xs text-blue-700 mt-1">
                Student promotions to next semesters and academic dropouts are updated automatically upon CGPA computation.
              </p>
            </div>
            <a
              href="/bs/exams-results"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-1.5"
            >
              <span>📊 Open Examinations & Results</span>
            </a>
          </div>
        </div>
      )}

      {/* PRINTABLE MODAL 1: SEMESTER FREEZE AGREEMENT FORM (Includes Student & HOD Signature Lines) */}
      {showFreezePrintModal && actionStudent && (
        <div className="bs-active-print-modal fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto print:static print:inset-auto print:block print:w-full print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full space-y-6 print:max-w-none print:w-full print:mx-0 print:p-6 print:rounded-none print:shadow-none print:border-2 print:border-black">
            <div className="text-center border-b pb-4 space-y-1">
              {collegeLogo ? (
                <img src={collegeLogo} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-1" />
              ) : (
                <div className="text-2xl mb-1">🏛️</div>
              )}
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{collegeName}</h2>
              <h3 className="text-sm font-bold text-cyan-800 uppercase">SEMESTER FREEZE APPLICATION & AGREEMENT FORM</h3>
              <p className="text-xs text-gray-500 font-mono">Academic Order Ref: <strong className="text-slate-900">{freezeMemoNo}</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border">
              <div><span className="text-xs text-gray-400 font-bold block uppercase">Student Name</span> <strong className="text-gray-900">{actionStudent.user?.name}</strong></div>
              <div><span className="text-xs text-gray-400 font-bold block uppercase">Roll Number</span> <strong className="font-mono text-gray-900">{actionStudent.rollNumber}</strong></div>
              <div><span className="text-xs text-gray-400 font-bold block uppercase">Program & Shift</span> <strong className="text-gray-900">{actionStudent.program?.name || "BS"} ({actionStudent.shift || "Morning"})</strong></div>
              <div><span className="text-xs text-gray-400 font-bold block uppercase">Freeze Duration</span> <strong className="text-cyan-800">Semester {fromSem} to Semester {toSem}</strong></div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="font-bold text-gray-800">Reason for Freeze:</div>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-700 italic border">{reason || "As per student application"}</div>

              <div className="font-bold text-gray-800 mt-2">Student Undertaking / Remarks:</div>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-700 italic border">{remarks || "I agree to freeze my current semester and return upon completion."}</div>
            </div>

            {/* FORMAL SIGNATURE BLOCKS REQUIRED BY USER */}
            <div className="pt-8 border-t grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-8">
                <div className="border-b border-gray-400 pt-8"></div>
                <div className="font-bold text-gray-800">Student Signature & Date</div>
              </div>
              <div className="space-y-8">
                <div className="border-b border-gray-400 pt-8"></div>
                <div className="font-bold text-gray-800">Parent / Guardian Signature</div>
              </div>
              <div className="space-y-8">
                <div className="border-b border-gray-400 pt-8"></div>
                <div className="font-bold text-gray-800">Head of Department (HOD) Signature & Stamp</div>
              </div>
              <div className="space-y-8">
                <div className="border-b border-gray-400 pt-8"></div>
                <div className="font-bold text-gray-800">Controller of Examinations / Principal</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 shadow-md flex items-center gap-1.5"
              >
                <span>🖨️ Print Agreement Form</span>
              </button>
              <button
                onClick={() => setShowFreezePrintModal(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE MODAL 2: MIGRATION OUT RELIEVING CERTIFICATE / NOC */}
      {showRelievingCertModal && actionStudent && (
        <div className="bs-active-print-modal fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto print:static print:inset-auto print:block print:w-full print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full space-y-6 print:max-w-none print:w-full print:mx-0 print:p-6 print:rounded-none print:shadow-none print:border-2 print:border-black">
            <div className="text-center border-b pb-4 space-y-1">
              {collegeLogo ? (
                <img src={collegeLogo} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-1" />
              ) : (
                <div className="text-2xl mb-1">🏛️</div>
              )}
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{collegeName}</h2>
              <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wider">NO OBJECTION & RELIEVING CERTIFICATE (NOC)</h3>
              <p className="text-xs font-mono font-bold text-orange-700">Certificate No: {relievingNo}</p>
            </div>

            <p className="text-sm text-gray-800 leading-relaxed text-justify">
              This is to certify that <strong>{actionStudent.user?.name}</strong> (Roll No: <strong className="font-mono">{actionStudent.rollNumber}</strong>)
              enrolled in <strong>{actionStudent.program?.name || "BS"}</strong> (Session {actionStudent.session || "2024-2028"}) has been officially relieved from this institution
              for outward migration to <strong>{reason || "Destination Institute"}</strong>.
            </p>

            <p className="text-sm text-gray-800 leading-relaxed text-justify">
              The college has NO OBJECTION to his/her migration. All college dues have been cleared up to Semester {actionStudent.currentSemester || 1}.
            </p>

            <div className="pt-12 border-t grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-8">
                <div className="border-b border-gray-400 pt-8"></div>
                <div className="font-bold text-gray-800">Head of Department (HOD)</div>
              </div>
              <div className="space-y-8">
                <div className="border-b border-gray-400 pt-8"></div>
                <div className="font-bold text-gray-800">Controller of Examinations / Principal</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-orange-600 text-white font-bold rounded-xl text-sm hover:bg-orange-700 shadow-md flex items-center gap-1.5"
              >
                <span>📜 Print Relieving Certificate</span>
              </button>
              <button
                onClick={() => setShowRelievingCertModal(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentActionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading Academic Status Actions...</div>}>
      <StudentActionsContent />
    </Suspense>
  );
}

