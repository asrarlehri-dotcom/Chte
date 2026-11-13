"use client";

import { useState, useEffect, useMemo } from "react";
import { sortStudentsByRoll } from "@/lib/domainParsers";
import {
  GraduationCap,
  FileSpreadsheet,
  Printer,
  Plus,
  Filter,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Info,
  ClipboardList
} from "lucide-react";

type StudentRecord = {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  rollNumber: string;
  registrationNumber?: string;
  fatherName?: string;
  educationLevel: string;
  session?: string;
  shift?: string;
  currentSemester?: number | null;
  bsAdmissionType?: string | null;
  isActive: boolean;
  programId?: string | null;
  program?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  cnic?: string;
  contactNumber?: string;
  residentAddress?: string;
  statuses?: any[];
};

const INPUT_STYLE =
  "w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all";

export default function BSStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [sessionOptions, setSessionOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notifications
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters State
  const [search, setSearch] = useState("");
  const [filterShift, setFilterShift] = useState("ALL");
  const [filterSession, setFilterSession] = useState("ALL");
  const [filterProgram, setFilterProgram] = useState("ALL");
  const [filterSemester, setFilterSemester] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Selection / Checkbox state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<StudentRecord | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(null);

  // Form State for Adding New Student
  const blankForm = {
    name: "",
    fatherName: "",
    email: "",
    password: "",
    rollNumber: "",
    registrationNumber: "",
    educationLevel: "BS",
    programId: "",
    session: "2024-2028",
    shift: "Morning",
    currentSemester: "1",
    bsAdmissionType: "REGULAR",
  };
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, pRes, setRes] = await Promise.all([
        fetch("/api/students?educationLevel=BS&includeInactive=true"),
        fetch("/api/programs"),
        fetch("/api/settings"),
      ]);

      if (sRes.ok) setStudents(await sRes.json());
      if (pRes.ok) setPrograms(await pRes.json());
      if (setRes.ok) {
        const data = await setRes.json();
        const { filterValidSessions, DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        if (data.ACADEMIC_SESSIONS) {
          setSessionOptions(filterValidSessions(data.ACADEMIC_SESSIONS));
        } else {
          setSessionOptions(DEFAULT_ALL_SESSIONS);
        }
      }
    } catch {
      setError("Failed to load BS student records.");
    }
    setLoading(false);
  };

  // Helper to derive academic status
  const getStudentStatusObj = (s: StudentRecord) => {
    if (s.isActive === false) {
      return { key: "DEACTIVATED", badge: "Deactivated", cls: "bg-red-50 text-red-700 border-red-200" };
    }

    if (s.statuses && s.statuses.length > 0) {
      const latest = s.statuses[s.statuses.length - 1];
      const type = latest.statusType?.toUpperCase();
      if (type === "FREEZE") return { key: "FREEZE", badge: "❄️ Freeze", cls: "bg-cyan-50 text-cyan-800 border-cyan-200" };
      if (type === "DROPOUT") return { key: "DROPOUT", badge: "🚫 Dropout", cls: "bg-red-50 text-red-800 border-red-200" };
      if (type === "QUIT" || type === "ADP") return { key: "QUIT", badge: "🚪 Quit / ADP", cls: "bg-gray-100 text-gray-800 border-gray-200" };
      if (type === "MIGRATION_IN" || (s.bsAdmissionType === "MIGRATION" && type !== "MIGRATION_OUT")) {
        return { key: "MIGRATION_IN", badge: "➡️ Migration In", cls: "bg-purple-50 text-purple-800 border-purple-200" };
      }
      if (type === "MIGRATION_OUT" || type === "MIGRATION") {
        return { key: "MIGRATION_OUT", badge: "⬅️ Migration Out", cls: "bg-orange-50 text-orange-800 border-orange-200" };
      }
    }

    if (s.bsAdmissionType === "MIGRATION") {
      return { key: "MIGRATION_IN", badge: "➡️ Migration In", cls: "bg-purple-50 text-purple-800 border-purple-200" };
    }

    if (!s.isActive) {
      return { key: "INACTIVE", badge: "Inactive", cls: "bg-gray-100 text-gray-700 border-gray-200" };
    }

    return { key: "PROMOTED", badge: `Active (Sem ${s.currentSemester || 1})`, cls: "bg-emerald-50 text-emerald-800 border-emerald-200" };
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    const list = students.filter((s) => {
      const q = search.toLowerCase().trim();
      if (q) {
        const nameMatch = s.user?.name?.toLowerCase().includes(q);
        const emailMatch = s.user?.email?.toLowerCase().includes(q);
        const fatherMatch = s.fatherName?.toLowerCase().includes(q);
        const rollMatch = s.rollNumber?.toLowerCase().includes(q);
        const regMatch = s.registrationNumber?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !fatherMatch && !rollMatch && !regMatch) return false;
      }

      if (filterShift !== "ALL") {
        const studentShift = s.shift || "Morning";
        if (studentShift.toLowerCase() !== filterShift.toLowerCase()) return false;
      }

      if (filterSession !== "ALL") {
        const sSession = s.session || "2024-2028";
        if (sSession !== filterSession) return false;
      }

      if (filterProgram !== "ALL" && s.programId !== filterProgram) return false;

      if (filterSemester !== "ALL" && String(s.currentSemester) !== filterSemester) return false;

      if (filterStatus !== "ALL") {
        const stObj = getStudentStatusObj(s);
        if (filterStatus === "PROMOTED" && stObj.key !== "PROMOTED") return false;
        if (filterStatus === "FREEZE" && stObj.key !== "FREEZE") return false;
        if (filterStatus === "DROPOUT" && stObj.key !== "DROPOUT") return false;
        if (filterStatus === "QUIT" && stObj.key !== "QUIT") return false;
        if (filterStatus === "MIGRATION_IN" && stObj.key !== "MIGRATION_IN") return false;
        if (filterStatus === "MIGRATION_OUT" && stObj.key !== "MIGRATION_OUT") return false;
      }

      return true;
    });
    return sortStudentsByRoll(list);
  }, [students, search, filterShift, filterSession, filterProgram, filterSemester, filterStatus]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Bulk Selection Handlers
  const isAllSelected =
    paginatedStudents.length > 0 && paginatedStudents.every((s) => selectedIds.includes(s.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStudents.map((s) => s.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Action: Add New Student
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`BS Student "${data.user?.name || form.name}" registered successfully!`);
        setForm(blankForm);
        setShowAddModal(false);
        fetchAll();
      } else {
        setError(data.error || "Failed to register student.");
      }
    } catch {
      setError("Server connection failed.");
    }
    setSaving(false);
  };

  // Action: Edit Student
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNumber: editingStudent.rollNumber,
          programId: editingStudent.programId,
          currentSemester: editingStudent.currentSemester,
          isActive: editingStudent.isActive,
        }),
      });
      if (res.ok) {
        setSuccess(`Student "${editingStudent.user?.name}" updated successfully!`);
        setEditingStudent(null);
        fetchAll();
      } else {
        const d = await res.json();
        setError(d.error || "Update failed.");
      }
    } catch {
      setError("Failed to update student details.");
    }
    setSaving(false);
  };

  // Action: Delete Student
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/students/${deletingStudent.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess(`Student record for "${deletingStudent.user?.name}" deleted successfully!`);
        setDeletingStudent(null);
        fetchAll();
      } else {
        const d = await res.json();
        setError(d.error || "Delete failed.");
      }
    } catch {
      setError("Failed to delete student record.");
    }
    setSaving(false);
  };

  // Action: Export CSV
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      alert("No student records available to export.");
      return;
    }

    const headers = [
      "#",
      "Full Name",
      "Father Name",
      "Email",
      "Roll Number",
      "Registration Number",
      "Program",
      "Session",
      "Semester",
      "Shift",
      "Status",
    ];

    const rows = filteredStudents.map((s, index) => [
      index + 1,
      `"${s.user?.name || ""}"`,
      `"${s.fatherName || "N/A"}"`,
      `"${s.user?.email || ""}"`,
      `"${s.rollNumber || ""}"`,
      `"${s.registrationNumber || `REG-${s.rollNumber}`}"`,
      `"${s.program?.name || "BS"}"`,
      `"${s.session || "2024-2028"}"`,
      `"Semester ${s.currentSemester || 1}"`,
      `"${s.shift || "Morning"}"`,
      `"${getStudentStatusObj(s).badge}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BS_Students_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Action: Print List
  const handlePrintList = () => {
    window.print();
  };

  const bsPrograms = programs.filter((p) => p.educationLevel === "BS");

  return (
    <div className="space-y-5">
      {/* Print Page adjustments */}
      <style
        dangerouslySetInnerHTML={{
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
      `,
        }}
      />

      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">BS Student Management</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                BS Academic Branch
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Manage student registrations, academic shifts, batches, and examination status records.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-xs cursor-pointer"
            title="Export list to CSV file"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Print List Button */}
          <button
            onClick={handlePrintList}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-xs cursor-pointer"
            title="Print formatted student list"
          >
            <Printer className="w-4 h-4 text-purple-600" />
            <span>Print List</span>
          </button>

          {/* Add Student Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-xs font-semibold transition-all shadow-sm shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-800 p-4 rounded-xl text-xs font-semibold border border-rose-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs font-semibold border border-emerald-200 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}

      {/* Filters & Search Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 print:hidden">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters & Search</span>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3.5 items-end">
          {/* Search Bar */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
              Search Student
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all"
                placeholder="Search name, father name, roll no, reg no..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Shift Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Shift</label>
            <div className="relative">
              <select
                value={filterShift}
                onChange={(e) => {
                  setFilterShift(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none px-3 py-2 pr-7 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 cursor-pointer"
              >
                <option value="ALL">All Shifts</option>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Replica">Replica</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Session Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Session</label>
            <div className="relative">
              <select
                value={filterSession}
                onChange={(e) => {
                  setFilterSession(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none px-3 py-2 pr-7 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 cursor-pointer"
              >
                <option value="ALL">All Sessions</option>
                {sessionOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Program Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Program</label>
            <div className="relative">
              <select
                value={filterProgram}
                onChange={(e) => {
                  setFilterProgram(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none px-3 py-2 pr-7 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 cursor-pointer"
              >
                <option value="ALL">All Programs</option>
                {bsPrograms.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Semester</label>
            <div className="relative">
              <select
                value={filterSemester}
                onChange={(e) => {
                  setFilterSemester(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none px-3 py-2 pr-7 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 cursor-pointer"
              >
                <option value="ALL">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={String(sem)}>Semester {sem}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Second Row: Status Filter */}
        <div className="w-full sm:w-48">
          <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Status</label>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none px-3 py-2 pr-7 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PROMOTED">🏆 Promoted</option>
              <option value="FREEZE">❄️ Freeze Status</option>
              <option value="DROPOUT">🚫 Dropout Status</option>
              <option value="QUIT">🚪 Quit / ADP</option>
              <option value="MIGRATION_IN">➡️ Migration In</option>
              <option value="MIGRATION_OUT">⬅️ Migration Out</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Filter Summary Notice */}
        <div className="pt-2 flex items-center justify-between text-xs text-blue-600 font-medium">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>Showing {filteredStudents.length} matching BS student(s)</span>
          </div>

          {(filterShift !== "ALL" ||
            filterSession !== "ALL" ||
            filterProgram !== "ALL" ||
            filterSemester !== "ALL" ||
            filterStatus !== "ALL" ||
            search !== "") && (
            <button
              onClick={() => {
                setFilterShift("ALL");
                setFilterSession("ALL");
                setFilterProgram("ALL");
                setFilterSemester("ALL");
                setFilterStatus("ALL");
                setSearch("");
                setCurrentPage(1);
              }}
              className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-xs font-medium">
            Loading student records...
          </div>
        ) : filteredStudents.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-50/80 border border-blue-100 flex items-center justify-center mx-auto mb-4 relative">
              <ClipboardList className="w-9 h-9 text-blue-500" />
              <Search className="w-4 h-4 text-blue-600 absolute bottom-4 right-4 bg-white rounded-full p-0.5 shadow-xs" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No BS students found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              No students match your search or filter criteria.
              <br />
              Try resetting filters or searching with different keywords.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-700">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer focus:ring-0"
                    />
                  </th>
                  <th className="py-3.5 px-3 w-8">#</th>
                  <th className="py-3.5 px-4">Student Info</th>
                  <th className="py-3.5 px-4">Roll / Reg No</th>
                  <th className="py-3.5 px-4">Program</th>
                  <th className="py-3.5 px-4 text-center">Session</th>
                  <th className="py-3.5 px-4 text-center">Semester</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {paginatedStudents.map((s, index) => {
                  const rowIndex = (currentPage - 1) * pageSize + index + 1;
                  const stObj = getStudentStatusObj(s);
                  const isSelected = selectedIds.includes(s.id);

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-blue-50/30 transition-colors ${
                        isSelected ? "bg-blue-50/60" : "bg-white"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(s.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer focus:ring-0"
                        />
                      </td>
                      <td className="py-3.5 px-3 font-medium text-gray-800">{rowIndex}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{s.user?.name || "Student"}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">S/O: {s.fatherName || "N/A"}</div>
                        <div className="text-[11px] text-gray-400">{s.user?.email || "—"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-800 text-[11px] font-mono">{s.rollNumber}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {s.registrationNumber || `REG-${s.rollNumber}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-800">{s.program?.name || "BS Program"}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Shift: <span className="font-medium text-gray-600">{s.shift || "Morning"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                          {s.session || "2024-2028"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-blue-600">
                        Semester {s.currentSemester || 1}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${stObj.cls}`}>
                          {stObj.badge}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingStudent(s)}
                            className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors shadow-2xs"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingStudent(s)}
                            className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors shadow-2xs"
                            title="Edit Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingStudent(s)}
                            className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors shadow-2xs"
                            title="Deactivate Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Table Footer & Pagination */}
        <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <div className="relative inline-block">
              <select
                value={pageSize}
                onChange={(e) => {
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
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? "bg-blue-600 text-white shadow-xs"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: VIEW PROFILE MODAL */}
      {/* ---------------------------------------------------- */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-5">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{viewingStudent.user?.name}</h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Roll: {viewingStudent.rollNumber} | Reg:{" "}
                  {viewingStudent.registrationNumber || `REG-${viewingStudent.rollNumber}`}
                </p>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-gray-400 hover:text-gray-600 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Father Name</span>
                <span className="font-semibold text-gray-800">{viewingStudent.fatherName || "N/A"}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Email Address</span>
                <span className="font-semibold text-gray-800 truncate block">
                  {viewingStudent.user?.email || "N/A"}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Degree Program</span>
                <span className="font-semibold text-gray-800">{viewingStudent.program?.name || "BS"}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Shift / Batch</span>
                <span className="font-semibold text-gray-800">
                  {viewingStudent.shift || "Morning"} ({viewingStudent.session || "2024-2028"})
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Current Semester</span>
                <span className="font-bold text-blue-600">Semester {viewingStudent.currentSemester || 1}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Academic Status</span>
                <span className="font-bold text-gray-800">
                  {getStudentStatusObj(viewingStudent).badge}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: EDIT STUDENT DETAILS MODAL */}
      {/* ---------------------------------------------------- */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Edit Student Details</h2>
              <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  className={INPUT_STYLE}
                  value={editingStudent.rollNumber}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, rollNumber: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Degree Program</label>
                <select
                  className={INPUT_STYLE}
                  value={editingStudent.programId || ""}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, programId: e.target.value })
                  }
                >
                  <option value="">-- Select Program --</option>
                  {bsPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Current Semester</label>
                <select
                  className={INPUT_STYLE}
                  value={editingStudent.currentSemester || 1}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      currentSemester: parseInt(e.target.value),
                    })
                  }
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editingStudent.isActive}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded accent-blue-600"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Student Account Active
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xs"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: DELETE CONFIRMATION MODAL */}
      {/* ---------------------------------------------------- */}
      {deletingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Deactivate Student Record?</h2>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to deactivate student{" "}
                <strong className="text-gray-900">"{deletingStudent.user?.name}"</strong> (
                {deletingStudent.rollNumber})?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirmDelete}
                disabled={saving}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition-all shadow-xs disabled:opacity-50"
              >
                {saving ? "Deactivating..." : "Confirm Deactivate"}
              </button>
              <button
                onClick={() => setDeletingStudent(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: ADD NEW STUDENT MODAL */}
      {/* ---------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Register New BS Student</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="Ali Hassan"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Father Name</label>
                  <input
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="Muhammad Hassan"
                    value={form.fatherName}
                    onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Roll Number *</label>
                  <input
                    required
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="24-BSCS-001"
                    value={form.rollNumber}
                    onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Registration No.</label>
                  <input
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="REG-2024-CS-001"
                    value={form.registrationNumber}
                    onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    className={INPUT_STYLE}
                    placeholder="student@college.edu"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Password *</label>
                  <input
                    required
                    type="password"
                    className={INPUT_STYLE}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Shift *</label>
                  <select
                    className={INPUT_STYLE}
                    value={form.shift}
                    onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Replica">Replica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Session *</label>
                  <select
                    className={INPUT_STYLE}
                    value={form.session}
                    onChange={(e) => setForm({ ...form, session: e.target.value })}
                  >
                    {sessionOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Semester *</label>
                  <select
                    className={INPUT_STYLE}
                    value={form.currentSemester}
                    onChange={(e) => setForm({ ...form, currentSemester: e.target.value })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">BS Admission Type</label>
                  <select
                    className={INPUT_STYLE}
                    value={form.bsAdmissionType}
                    onChange={(e) => setForm({ ...form, bsAdmissionType: e.target.value })}
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="BRIDGING_5TH">Bridging 5th</option>
                    <option value="MIGRATION">Migration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Program *</label>
                <select
                  required
                  className={INPUT_STYLE}
                  value={form.programId}
                  onChange={(e) => setForm({ ...form, programId: e.target.value })}
                >
                  <option value="">-- Select BS Program --</option>
                  {bsPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xs"
                >
                  {saving ? "Registering..." : "Register Student"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
