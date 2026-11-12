"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  GraduationCap,
  Users2,
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ClipboardList,
  Edit2,
  Trash2,
  Lock,
  Upload,
  Download,
  CheckCircle2,
  X,
  Loader2
} from "lucide-react";
import { parseGenericCSV, validateDepartmentBatch, getDepartmentSampleCSV } from "@/lib/domainParsers";
import UniversalImportModal from "@/components/UniversalImportModal";
import { 
  getDepartments, 
  addDepartment, 
  toggleDepartmentStatus, 
  getPrograms, 
  addProgram, 
  toggleProgramStatus,
  updateDepartment,
  deleteDepartment,
  updateProgram,
  deleteProgram 
} from "./actions";

export default function DepartmentsProgramsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"departments" | "programs">("departments");
  const [isPending, startTransition] = useTransition();

  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination controls
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Add New Modal state
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for Department
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptHod, setDeptHod] = useState("");
  const [deptPhone, setDeptPhone] = useState("+123 4567890");
  const [deptEmail, setDeptEmail] = useState("dept@example.com");
  const [deptStartYear, setDeptStartYear] = useState("2020");
  const [deptCapacity, setDeptCapacity] = useState("150");

  // Form states for Program
  const [progName, setProgName] = useState("");
  const [progCode, setProgCode] = useState("");
  const [progLevel, setProgLevel] = useState("BS");
  const [progDeptId, setProgDeptId] = useState("");

  // Edit and Feedback states
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [editingProg, setEditingProg] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Safeguard Lock Modal state
  const [lockedItem, setLockedItem] = useState<{
    type: "department" | "program";
    name: string;
    studentCount: number;
    marksCount?: number;
    action: "edit" | "delete";
  } | null>(null);

  // Import states
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationData, setValidationData] = useState<any>(null);
  const [importSourceName, setImportSourceName] = useState("");
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");

    try {
      const text = await file.text();
      const parsed = parseGenericCSV(text);
      if (parsed.length === 0) {
        setError("Invalid or empty CSV file. Please make sure headers like Name and Code are present.");
        return;
      }
      const validation = validateDepartmentBatch(parsed);
      setValidationData(validation);
      setImportSourceName(file.name);
      setValidationModalOpen(true);
    } catch {
      setError("An unexpected error occurred while reading the file.");
    } finally {
      e.target.value = "";
    }
  };

  const handleProcessPastedText = () => {
    if (!pasteText.trim()) return;
    setError("");
    setSuccess("");

    try {
      const parsed = parseGenericCSV(pasteText);
      if (parsed.length === 0) {
        setError("Could not parse department records from pasted text.");
        return;
      }
      const validation = validateDepartmentBatch(parsed);
      setValidationData(validation);
      setImportSourceName("Pasted Data");
      setPasteModalOpen(false);
      setValidationModalOpen(true);
    } catch {
      setError("Failed to parse pasted text.");
    }
  };

  const handleConfirmDeptImport = async (validRows: Record<string, string>[]) => {
    if (validRows.length === 0) return;
    setIsImporting(true);

    try {
      const res = await fetch("/api/departments/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: validRows })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setValidationModalOpen(false);
        setPasteText("");
        setImportSummary(data);
        const parts = [];
        if (data.imported > 0) parts.push(`${data.imported} added`);
        if (data.updated > 0) parts.push(`${data.updated} updated`);
        if (data.failed > 0) parts.push(`${data.failed} failed`);
        setSuccess(`Departments import finished: ${parts.join(", ") || "processed"}.`);
        fetchData();
      } else {
        setError(data.error || "Failed to import departments.");
      }
    } catch {
      setError("Server error while importing departments.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadDeptTemplate = () => {
    const templateContent = getDepartmentSampleCSV();
    const blob = new Blob(["\uFEFF" + templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Departments_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedDepts = await getDepartments();
      const fetchedProgs = await getPrograms();
      setDepartments(fetchedDepts);
      setPrograms(fetchedProgs);
    } catch {
      setError("Failed to load records.");
    }
    setLoading(false);
  };

  const handleAddDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    startTransition(async () => {
      await addDepartment({ 
        name: deptName, 
        code: deptCode, 
        hodName: deptHod,
        phone: deptPhone,
        email: deptEmail,
        startingYear: parseInt(deptStartYear) || 2020,
        studentCapacity: parseInt(deptCapacity) || 150
      });
      setDeptName("");
      setDeptCode("");
      setDeptHod("");
      setShowAddModal(false);
      fetchData();
      setSuccess(`Department "${deptName}" added successfully!`);
    });
  };

  const handleAddProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progName || !progCode || !progDeptId) return;
    startTransition(async () => {
      await addProgram({ name: progName, code: progCode, educationLevel: progLevel, departmentId: progDeptId });
      setProgName("");
      setProgCode("");
      setProgDeptId("");
      setShowAddModal(false);
      fetchData();
      setSuccess(`Program "${progName}" added successfully!`);
    });
  };

  const handleToggleDept = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleDepartmentStatus(id, !currentStatus);
      fetchData();
    });
  };

  const handleToggleProg = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleProgramStatus(id, !currentStatus);
      fetchData();
    });
  };

  // Intercept Delete Department
  const handleDeleteDept = async (dept: any) => {
    if (dept.hasData || dept.studentCount > 0) {
      setLockedItem({
        type: "department",
        name: dept.name,
        studentCount: dept.studentCount || 0,
        action: "delete"
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete department "${dept.name}"?`)) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await deleteDepartment(dept.id);
      if (res.success) {
        setSuccess(`Department "${dept.name}" deleted successfully.`);
        fetchData();
      } else {
        setError(res.error || "Failed to delete department.");
      }
    });
  };

  // Intercept Delete Program
  const handleDeleteProg = async (prog: any) => {
    if (prog.hasData || prog.studentCount > 0 || prog.marksCount > 0) {
      setLockedItem({
        type: "program",
        name: prog.name,
        studentCount: prog.studentCount || 0,
        marksCount: prog.marksCount || 0,
        action: "delete"
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete program "${prog.name}"?`)) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await deleteProgram(prog.id);
      if (res.success) {
        setSuccess(`Program "${prog.name}" deleted successfully.`);
        fetchData();
      } else {
        setError(res.error || "Failed to delete program.");
      }
    });
  };

  // Intercept Edit Department
  const handleEditDeptClick = (dept: any) => {
    if (dept.hasData || dept.studentCount > 0) {
      setLockedItem({
        type: "department",
        name: dept.name,
        studentCount: dept.studentCount || 0,
        action: "edit"
      });
      return;
    }
    setEditingDept({ id: dept.id, name: dept.name, code: dept.code, hodName: dept.hodName || "" });
  };

  // Intercept Edit Program
  const handleEditProgClick = (prog: any) => {
    if (prog.hasData || prog.studentCount > 0 || prog.marksCount > 0) {
      setLockedItem({
        type: "program",
        name: prog.name,
        studentCount: prog.studentCount || 0,
        marksCount: prog.marksCount || 0,
        action: "edit"
      });
      return;
    }
    setEditingProg({ 
      id: prog.id, 
      name: prog.name, 
      code: prog.code || "", 
      educationLevel: prog.educationLevel, 
      departmentId: prog.departmentId || "" 
    });
  };

  const handleUpdateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editingDept.name || !editingDept.code) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await updateDepartment(editingDept.id, {
        name: editingDept.name,
        code: editingDept.code,
        hodName: editingDept.hodName || ""
      });
      if (res.success) {
        setSuccess(`Department "${editingDept.name}" updated successfully.`);
        setEditingDept(null);
        fetchData();
      } else {
        setError(res.error || "Failed to update department.");
      }
    });
  };

  const handleUpdateProg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProg || !editingProg.name || !editingProg.code || !editingProg.departmentId) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await updateProgram(editingProg.id, {
        name: editingProg.name,
        code: editingProg.code,
        educationLevel: editingProg.educationLevel,
        departmentId: editingProg.departmentId
      });
      if (res.success) {
        setSuccess(`Program "${editingProg.name}" updated successfully.`);
        setEditingProg(null);
        fetchData();
      } else {
        setError(res.error || "Failed to update program.");
      }
    });
  };

  // Filtered lists based on search
  const filteredDepartments = useMemo(() => {
    return departments.filter(d => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return d.name.toLowerCase().includes(q) || (d.code && d.code.toLowerCase().includes(q)) || (d.hodName && d.hodName.toLowerCase().includes(q));
    });
  }, [departments, searchQuery]);

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q));
    });
  }, [programs, searchQuery]);

  const activeList = activeTab === "departments" ? filteredDepartments : filteredPrograms;
  const totalPages = Math.max(1, Math.ceil(activeList.length / entriesPerPage));
  const displayedDepts = filteredDepartments.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  const displayedProgs = filteredPrograms.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  return (
    <div className="space-y-5">
      {/* Top Header & Tab Switcher */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Programs & Departments Setup</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage academic departments, degree programs, and capacity settings.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200/70 self-end sm:self-auto">
          <button 
            className={`px-4 py-2 font-semibold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'departments' 
                ? 'bg-white shadow-xs text-blue-600 font-bold border border-gray-200/50' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => {
              setActiveTab('departments');
              setCurrentPage(1);
            }}
          >
            <Building2 className="w-4 h-4" />
            <span>Departments</span>
          </button>
          <button 
            className={`px-4 py-2 font-semibold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'programs' 
                ? 'bg-white shadow-xs text-blue-600 font-bold border border-gray-200/50' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => {
              setActiveTab('programs');
              setCurrentPage(1);
            }}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Programs</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-200 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}

      {/* Main Content Card — Exactly matching attached screenshot */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Card Header Bar */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                {activeTab === "departments" ? "Department List" : "Program List"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeTab === "departments" 
                  ? "Add, edit, and manage academic departments." 
                  : "Add, edit, and manage degree programs."}
              </p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg border border-gray-200/80 hover:bg-gray-50 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Top Controls Row: Add New + | Entries dropdown | Search input */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add New</span>
              </button>

              <label className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 cursor-pointer flex items-center gap-2 shadow-2xs">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Import CSV</span>
                <input type="file" accept=".csv, .tsv, .txt" onChange={handleImportCSV} className="hidden" />
              </label>

              <button
                onClick={() => setPasteModalOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-2xs cursor-pointer"
                title="Paste copied rows directly from Excel"
              >
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                <span>Paste Excel</span>
              </button>

              <button
                onClick={handleDownloadDeptTemplate}
                className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-2xs cursor-pointer"
                title="Download CSV format template"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Template CSV</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="relative inline-block">
                  <select
                    value={entriesPerPage}
                    onChange={e => {
                      setEntriesPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="appearance-none px-2.5 py-1.5 pr-6 border border-gray-200 rounded-lg bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <span>entries per page</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Search:</span>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={activeTab === "departments" ? "Search departments..." : "Search programs..."}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 sm:w-60 text-gray-900 placeholder-gray-400 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TABLE SECTION — Matching screenshot header colors and column layout */}
          {activeTab === "departments" ? (
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-blue-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  <tr>
                    <th className="px-3.5 py-3.5 text-center w-10">#</th>
                    <th className="px-4 py-3.5">DEPT. NAME</th>
                    <th className="px-4 py-3.5">HEAD OF DEPT.</th>
                    <th className="px-4 py-3.5">PHONE</th>
                    <th className="px-4 py-3.5">EMAIL</th>
                    <th className="px-4 py-3.5 text-center">STARTING YEAR</th>
                    <th className="px-4 py-3.5 text-center">STUDENT CAPACITY</th>
                    <th className="px-4 py-3.5 text-center">EDIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center text-gray-400 font-medium text-xs">
                        Loading departments...
                      </td>
                    </tr>
                  ) : displayedDepts.length === 0 ? (
                    /* Empty State */
                    <tr>
                      <td colSpan={8} className="py-16 px-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-blue-50/80 border border-blue-100 flex items-center justify-center mx-auto mb-4 relative">
                          <ClipboardList className="w-9 h-9 text-blue-500" />
                          <Search className="w-4 h-4 text-blue-600 absolute bottom-4 right-4 bg-white rounded-full p-0.5 shadow-xs" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">No departments found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                          No departments found matching your criteria.
                        </p>
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm shadow-blue-600/30 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Add New Department</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    displayedDepts.map((d, index) => {
                      const rowNum = (currentPage - 1) * entriesPerPage + index + 1;
                      return (
                        <tr key={d.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-3.5 py-3.5 text-center font-medium text-gray-800">{rowNum}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-gray-900">{d.name}</div>
                            <div className="text-[11px] text-gray-400 font-mono">{d.code}</div>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-gray-700">{d.hodName || "—"}</td>
                          <td className="px-4 py-3.5 text-gray-600 text-[11px] font-mono">{d.phone || "+123 4567890"}</td>
                          <td className="px-4 py-3.5 text-gray-600 text-[11px]">{d.email || "dept@example.com"}</td>
                          <td className="px-4 py-3.5 text-center font-medium text-gray-700">{d.startingYear || 2020}</td>
                          <td className="px-4 py-3.5 text-center font-bold text-gray-800">
                            {d.studentCapacity || 150}
                            {d.studentCount > 0 && (
                              <span className="ml-1.5 px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded-full font-bold border border-blue-100">
                                ({d.studentCount} Active)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditDeptClick(d)}
                                className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                title="Edit Department"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDept(d)}
                                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                title="Delete Department"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* PROGRAMS TABLE */
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-blue-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  <tr>
                    <th className="px-3.5 py-3.5 text-center w-10">#</th>
                    <th className="px-4 py-3.5">PROGRAM NAME</th>
                    <th className="px-4 py-3.5 text-center">CODE</th>
                    <th className="px-4 py-3.5 text-center">LEVEL</th>
                    <th className="px-4 py-3.5">DEPARTMENT</th>
                    <th className="px-4 py-3.5 text-center">ENROLLED STUDENTS</th>
                    <th className="px-4 py-3.5 text-center">EDIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-gray-400 font-medium text-xs">
                        Loading programs...
                      </td>
                    </tr>
                  ) : displayedProgs.length === 0 ? (
                    /* Empty State */
                    <tr>
                      <td colSpan={7} className="py-16 px-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-blue-50/80 border border-blue-100 flex items-center justify-center mx-auto mb-4 relative">
                          <ClipboardList className="w-9 h-9 text-blue-500" />
                          <Search className="w-4 h-4 text-blue-600 absolute bottom-4 right-4 bg-white rounded-full p-0.5 shadow-xs" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">No programs found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                          No programs found matching your criteria.
                        </p>
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm shadow-blue-600/30 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Add New Program</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    displayedProgs.map((p, index) => {
                      const rowNum = (currentPage - 1) * entriesPerPage + index + 1;
                      return (
                        <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-3.5 py-3.5 text-center font-medium text-gray-800">{rowNum}</td>
                          <td className="px-4 py-3.5 font-bold text-gray-900">{p.name}</td>
                          <td className="px-4 py-3.5 text-center font-mono text-[11px] text-gray-600">{p.code || "—"}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                              {p.educationLevel}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-gray-700">{p.department?.name || "—"}</td>
                          <td className="px-4 py-3.5 text-center font-bold text-blue-600">
                            {p.studentCount || 0}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditProgClick(p)}
                                className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                title="Edit Program"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProg(p)}
                                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                title="Delete Program"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer & Pagination */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span>Showing</span>
              <div className="relative inline-block">
                <select
                  value={entriesPerPage}
                  onChange={e => {
                    setEntriesPerPage(Number(e.target.value));
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SAFEGUARD LOCK MODAL */}
      {lockedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-4 border border-amber-200 text-center">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">Major Action Locked</h2>
              <p className="text-xs text-amber-800 font-semibold bg-amber-50 p-2 rounded-xl mt-2 border border-amber-200">
                Active Student & Results Data Detected!
              </p>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed text-left">
              The {lockedItem.type} <strong className="text-gray-900">"{lockedItem.name}"</strong> contains{" "}
              <strong className="text-blue-700">{lockedItem.studentCount} enrolled student records</strong>
              {lockedItem.marksCount ? ` and ${lockedItem.marksCount} marks/result entries` : ""}.
              Direct {lockedItem.action} or structural edits are restricted here to prevent corrupting student roll numbers and grade transcripts.
            </p>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-500 text-left">
              💡 <strong>Requirement:</strong> Major administrative changes or permission overrides must be managed through System Settings Control Center.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setLockedItem(null);
                  router.push("/admin/settings");
                }}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Go to System Settings</span>
              </button>
              <button
                onClick={() => setLockedItem(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">
                {activeTab === "departments" ? "Add New Department" : "Add New Program"}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            {activeTab === "departments" ? (
              <form onSubmit={handleAddDepartmentSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Department Name *</label>
                  <input type="text" required value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g. Mechanical Engg." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Code *</label>
                    <input type="text" required value={deptCode} onChange={e => setDeptCode(e.target.value)} placeholder="e.g. ME" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Head of Dept. (HOD)</label>
                    <input type="text" value={deptHod} onChange={e => setDeptHod(e.target.value)} placeholder="e.g. Sanjay Chohan" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Phone</label>
                    <input type="text" value={deptPhone} onChange={e => setDeptPhone(e.target.value)} placeholder="+123 4567890" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" value={deptEmail} onChange={e => setDeptEmail(e.target.value)} placeholder="test@example.com" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Starting Year</label>
                    <input type="number" value={deptStartYear} onChange={e => setDeptStartYear(e.target.value)} placeholder="1998" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Student Capacity</label>
                    <input type="number" value={deptCapacity} onChange={e => setDeptCapacity(e.target.value)} placeholder="150" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900" />
                  </div>
                </div>
                <div className="flex gap-3 pt-3">
                  <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-xs">
                    {isPending ? "Saving..." : "Save Department"}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddProgramSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Program Name *</label>
                  <input type="text" required value={progName} onChange={e => setProgName(e.target.value)} placeholder="e.g. BS Computer Science" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Program Code *</label>
                    <input type="text" required value={progCode} onChange={e => setProgCode(e.target.value)} placeholder="e.g. BSCS" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Level *</label>
                    <select value={progLevel} onChange={e => setProgLevel(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900">
                      <option value="BS">BS</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Department *</label>
                  <select required value={progDeptId} onChange={e => setProgDeptId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900">
                    <option value="" disabled>-- Select Department --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-3">
                  <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-xs">
                    {isPending ? "Saving..." : "Save Program"}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {editingDept && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-4">
            <h2 className="text-base font-bold text-gray-900">Edit Department</h2>
            <form onSubmit={handleUpdateDept} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                  value={editingDept.code}
                  onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">HOD Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                  value={editingDept.hodName}
                  onChange={(e) => setEditingDept({ ...editingDept, hodName: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-xs hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xs"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-xs hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROGRAM MODAL */}
      {editingProg && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-4">
            <h2 className="text-base font-bold text-gray-900">Edit Program</h2>
            <form onSubmit={handleUpdateProg} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Program Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                  value={editingProg.name}
                  onChange={(e) => setEditingProg({ ...editingProg, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                  value={editingProg.code}
                  onChange={(e) => setEditingProg({ ...editingProg, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Level</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                  value={editingProg.educationLevel}
                  onChange={(e) => setEditingProg({ ...editingProg, educationLevel: e.target.value })}
                >
                  <option value="BS">BS</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Department</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                  value={editingProg.departmentId}
                  onChange={(e) => setEditingProg({ ...editingProg, departmentId: e.target.value })}
                >
                  <option value="" disabled>-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-xs hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xs"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProg(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-xs hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Paste Excel Data Modal */}
      {pasteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  Paste Department Data
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Copy table rows from Excel or Google Sheets (Ctrl+C) and paste below (Ctrl+V).
                </p>
              </div>
              <button
                onClick={() => setPasteModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={9}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Department Name\tDepartment Code\tHOD Name\tEmail\tPhone\nDepartment of Computer Science\tCS\tDr. Muhammad Usman\tcs@college.edu.pk\t03001234567\nDepartment of Mathematics\tMATH\tProf. Tariq Baloch\tmath@college.edu.pk\t03337654321"}
              className="w-full p-3 font-mono text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 resize-y text-gray-900"
            />

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!pasteText.trim()}
                onClick={handleProcessPastedText}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Review & Validate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Check Diagnostics Modal */}
      <UniversalImportModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        onConfirmImport={handleConfirmDeptImport}
        validationData={validationData}
        isImporting={isImporting}
        entityName="Department"
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
                  Department Import Summary
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Results of department batch import</p>
              </div>
              <button
                onClick={() => setImportSummary(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-lg font-bold text-emerald-700">{importSummary.imported || 0}</div>
                <div className="text-[11px] text-emerald-600 font-medium">New Added</div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-lg font-bold text-blue-700">{importSummary.updated || 0}</div>
                <div className="text-[11px] text-blue-600 font-medium">Updated</div>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                <div className="text-lg font-bold text-rose-700">{importSummary.failed || 0}</div>
                <div className="text-[11px] text-rose-600 font-medium">Failed</div>
              </div>
            </div>

            {importSummary.errors && importSummary.errors.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-gray-700">Notice / Errors Log:</div>
                <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-1.5 font-mono">
                  {importSummary.errors.map((e: any, idx: number) => (
                    <div key={idx} className="flex gap-2 text-gray-700">
                      <span className="font-bold text-gray-900">Row {e.row}:</span>
                      <span className="font-semibold text-blue-700">{e.item}</span> —
                      <span className="text-rose-600">{e.reason}</span>
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
    </div>
  );
}
