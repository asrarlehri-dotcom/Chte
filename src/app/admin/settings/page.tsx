"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ShieldAlert } from "lucide-react";
import { MODULES, ACTIONS, ROLES } from "@/lib/permissions";
import HomepageSettingsTab from "@/components/admin/HomepageSettingsTab";
import CollegePortalSettingsTab from "@/components/admin/CollegePortalSettingsTab";

// Type definitions
type Subject = {
  id: string;
  name: string;
  code: string | null;
};

type Group = {
  id: string;
  name: string;
  subjects: Subject[];
};

type Program = {
  id: string;
  name: string;
  code?: string | null;
  educationLevel: string;
  departmentId?: string | null;
  department?: { id: string; name: string; code: string; hodName: string } | null;
  groups: Group[];
};

type CustomField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
};

type FeeSetting = {
  id: string;
  key: string;
  session?: string | null;
  label: string;
  amount: number;
  isLocked: boolean;
  isActive: boolean;
  description: string | null;
  category: string | null;
};

// Word conversion helper for Fee Settings
function toWords(n: number): string {
  const a = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen"];
  const b = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (n === 0) return "zero";
  if (n < 20) return a[n];
  if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
  if (n < 1000) return a[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + toWords(n % 100) : "");
  if (n < 100000) return toWords(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? " " + toWords(n % 1000) : "");
  return toWords(Math.floor(n / 100000)) + " lakh" + (n % 100000 ? " " + toWords(n % 100000) : "");
}

export default function UnifiedSettingsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isChteAdmin = userRole === "SUPER_ADMIN" || userRole === "CHTE_ADMIN";

  const [activeTab, setActiveTab] = useState<"HOMEPAGE" | "COLLEGE_PORTAL" | "ACADEMIC" | "FEES" | "PERMISSIONS" | "DATA">(
    userRole && !isChteAdmin ? "COLLEGE_PORTAL" : "HOMEPAGE"
  );
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (session && !isChteAdmin && activeTab === "HOMEPAGE") {
      setActiveTab("COLLEGE_PORTAL");
    }
  }, [session, isChteAdmin, activeTab]);

  // Dummy Data Management States
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [clearingLoading, setClearingLoading] = useState(false);

  const handleLoadDummyData = async () => {
    if (!confirm("⚡ Load comprehensive realistic dummy data across all departments, programs, courses, faculty, students, admissions, and fees?")) return;
    setSeedingLoading(true);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: data.message || "Realistic dummy data loaded successfully!" });
        fetchPrograms();
        fetchDepartments();
        fetchSettings();
        fetchFees();
        fetchPermissions();
      } else {
        setMsg({ type: "error", text: data.error || "Failed to load dummy data." });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Server error occurred while loading dummy data." });
    } finally {
      setSeedingLoading(false);
    }
  };

  const handleClearDummyData = async () => {
    if (!confirm("⚠️ CAUTION: Are you sure you want to clear ALL dummy & operational data? This will remove all students, admissions, courses, marks, and fees while preserving the SuperAdmin login account.")) return;
    setClearingLoading(true);
    try {
      const res = await fetch("/api/admin/seed", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: data.message || "All dummy data cleared successfully!" });
        fetchPrograms();
        fetchDepartments();
        fetchSettings();
        fetchFees();
        fetchPermissions();
      } else {
        setMsg({ type: "error", text: data.error || "Failed to clear dummy data." });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Server error occurred while clearing data." });
    } finally {
      setClearingLoading(false);
    }
  };

  // ----------------------------------------------------
  // TAB 1: ACADEMIC SETUP STATES & FUNCTIONS
  // ----------------------------------------------------
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [academicLoading, setAcademicLoading] = useState(true);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramCode, setNewProgramCode] = useState("");
  const [newProgramLevel, setNewProgramLevel] = useState("INTERMEDIATE");
  const [newProgramDeptId, setNewProgramDeptId] = useState("");

  // Department form states
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptHod, setNewDeptHod] = useState("");
  const [deptLoading, setDeptLoading] = useState(false);

  // Edit Department states
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDeptCode, setEditDeptCode] = useState("");
  const [editDeptHod, setEditDeptHod] = useState("");
  const [updatingDept, setUpdatingDept] = useState(false);

  // Edit Program states
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editProgramName, setEditProgramName] = useState("");
  const [editProgramCode, setEditProgramCode] = useState("");
  const [editProgramLevel, setEditProgramLevel] = useState("INTERMEDIATE");
  const [editProgramDeptId, setEditProgramDeptId] = useState("");
  const [updatingProgram, setUpdatingProgram] = useState(false);

  const [newGroupName, setNewGroupName] = useState("");
  const [addingGroupTo, setAddingGroupTo] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [addingSubjectTo, setAddingSubjectTo] = useState<string | null>(null);

  const handleStartEditDept = (dept: any) => {
    setEditingDeptId(dept.id);
    setEditDeptName(dept.name);
    setEditDeptCode(dept.code);
    setEditDeptHod(dept.hodName || "");
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeptId || !editDeptName || !editDeptCode) return;
    setUpdatingDept(true);
    try {
      const res = await fetch("/api/departments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingDeptId,
          name: editDeptName.trim(),
          code: editDeptCode.trim().toUpperCase(),
          hodName: editDeptHod.trim()
        }),
      });
      if (res.ok) {
        setEditingDeptId(null);
        fetchDepartments();
        fetchPrograms();
        setMsg({ type: "success", text: "Department updated successfully!" });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update department");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingDept(false);
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the department "${name}"? This will unlink it from all associated courses, programs, and faculty.`)) return;
    try {
      const res = await fetch(`/api/departments?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDepartments();
        fetchPrograms();
        setMsg({ type: "success", text: "Department deleted successfully!" });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete department");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartEditProgram = (prog: Program) => {
    setEditingProgramId(prog.id);
    setEditProgramName(prog.name);
    setEditProgramCode(prog.code || "");
    setEditProgramLevel(prog.educationLevel);
    setEditProgramDeptId(prog.departmentId || "");
  };

  const handleUpdateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgramId || !editProgramName || !editProgramCode || !editProgramLevel) return;
    setUpdatingProgram(true);
    try {
      const res = await fetch("/api/programs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProgramId,
          name: editProgramName,
          code: editProgramCode.trim().toUpperCase(),
          educationLevel: editProgramLevel,
          departmentId: editProgramDeptId || null
        }),
      });
      if (res.ok) {
        setEditingProgramId(null);
        fetchPrograms();
        setMsg({ type: "success", text: "Program updated successfully!" });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update program");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingProgram(false);
    }
  };

  const handleDeleteProgram = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the program "${name}"? This will permanently delete all associated courses, groups, and subjects.`)) return;
    try {
      const res = await fetch(`/api/programs?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPrograms();
        setMsg({ type: "success", text: "Program deleted successfully!" });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete program");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/programs");
      if (res.ok) {
        setPrograms(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAcademicLoading(false);
    }
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName || !newProgramCode || !newProgramLevel) return;
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProgramName,
          code: newProgramCode.trim(),
          educationLevel: newProgramLevel,
          departmentId: newProgramDeptId || null
        }),
      });
      if (res.ok) {
        setNewProgramName("");
        setNewProgramCode("");
        setNewProgramDeptId("");
        fetchPrograms();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add program");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode || !newDeptHod) {
      alert("Department Name, Code, and HOD Name are all required.");
      return;
    }
    setDeptLoading(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDeptName.trim(),
          code: newDeptCode.trim().toUpperCase(),
          hodName: newDeptHod.trim()
        }),
      });
      if (res.ok) {
        setNewDeptName("");
        setNewDeptCode("");
        setNewDeptHod("");
        fetchDepartments();
        fetchPrograms();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add department");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeptLoading(false);
    }
  };

  const handleAddGroup = async (programId: string) => {
    if (!newGroupName) return;
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, programId }),
      });
      if (res.ok) {
        setNewGroupName("");
        setAddingGroupTo(null);
        fetchPrograms();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddSubject = async (groupId: string) => {
    if (!newSubjectName) return;
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubjectName, code: newSubjectCode || null, groupId }),
      });
      if (res.ok) {
        setNewSubjectName("");
        setNewSubjectCode("");
        setAddingSubjectTo(null);
        fetchPrograms();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ----------------------------------------------------
  // TAB 2: FEES & SYSTEM SETTINGS STATES & FUNCTIONS
  // ----------------------------------------------------
  const [fees, setFees] = useState<FeeSetting[]>([]);
  const [feesLoading, setFeesLoading] = useState(true);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingFee, setSavingFee] = useState(false);

  // New states for session overrides
  const [newOverrideKey, setNewOverrideKey] = useState("");
  const [newOverrideSession, setNewOverrideSession] = useState("");
  const [newOverrideAmount, setNewOverrideAmount] = useState("");
  const [newOverrideDesc, setNewOverrideDesc] = useState("");
  const [creatingOverride, setCreatingOverride] = useState(false);

  // States for custom base fee item creation
  const [newBaseKey, setNewBaseKey] = useState("");
  const [newBaseLabel, setNewBaseLabel] = useState("");
  const [newBaseCategory, setNewBaseCategory] = useState("BS");
  const [newBaseAmount, setNewBaseAmount] = useState("");
  const [newBaseDesc, setNewBaseDesc] = useState("");
  const [creatingBase, setCreatingBase] = useState(false);

  // States for base fee inline editing
  const [editKey, setEditKey] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Global settings state
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [sequenceStart, setSequenceStart] = useState("");
  const [rollPattern, setRollPattern] = useState("");
  const [rollSequence, setRollSequence] = useState("");
  const [academicSessions, setAcademicSessions] = useState<string[]>([]);
  const [newSessionInput, setNewSessionInput] = useState("");

  // Admission Form Settings
  const [admissionRequiredFields, setAdmissionRequiredFields] = useState<string[]>([]);
  const [admissionCnicLength, setAdmissionCnicLength] = useState("15");
  const [admissionContactLength, setAdmissionContactLength] = useState("11");
  const [admissionCustomFields, setAdmissionCustomFields] = useState<CustomField[]>([]);

  // Faculty Default Setup
  const [defaultFacultyPassword, setDefaultFacultyPassword] = useState("gpgcq123");
  const [facultyEmailDomain, setFacultyEmailDomain] = useState("@gpgcquetta.edu.pk");

  // College Branding & Identity States
  const [collegeName, setCollegeName] = useState("Government Post Graduate College Quetta");
  const [collegeLogo, setCollegeLogo] = useState("");
  const [collegeBackground, setCollegeBackground] = useState("");
  const [collegeTagline, setCollegeTagline] = useState("College of Higher Education & Research");
  const [collegeAddress, setCollegeAddress] = useState("Quetta, Balochistan, Pakistan");

  const [updatingSettings, setUpdatingSettings] = useState(false);

  const fetchSettings = async () => {
    const userCollegeId = (session?.user as any)?.collegeId;
    const res = await fetch(userCollegeId ? `/api/settings?collegeId=${userCollegeId}` : "/api/settings");
    if (res.ok) {
      const data = await res.json();
      setBankAccount(data.CHALLAN_BANK_ACCOUNT || "");
      setBankName(data.CHALLAN_BANK_NAME || "");
      setBranchCode(data.CHALLAN_BRANCH_CODE || "");
      setAccountTitle(data.CHALLAN_ACCOUNT_TITLE || "");
      setSequenceStart(data.CHALLAN_SEQUENCE_CURRENT || "");
      setRollPattern(data.ROLL_NUMBER_PATTERN || "");
      setRollSequence(data.ROLL_SEQUENCE_CURRENT || "");
      setDefaultFacultyPassword(data.DEFAULT_FACULTY_PASSWORD || "college123");
      setFacultyEmailDomain(data.FACULTY_EMAIL_DOMAIN || "@college.edu.pk");
      setCollegeName(data.COLLEGE_NAME || (session?.user as any)?.collegeName || "Govt. Degree College");
      setCollegeLogo(data.COLLEGE_LOGO || (session?.user as any)?.collegeLogo || "");
      setCollegeBackground(data.COLLEGE_BACKGROUND || data.COLLEGE_WATERMARK || "");
      setCollegeTagline(data.COLLEGE_TAGLINE || "College of Higher Education & Research");
      setCollegeAddress(data.COLLEGE_ADDRESS || "Balochistan, Pakistan");
      if (data.ACADEMIC_SESSIONS) {
        const { filterValidSessions } = await import("@/lib/sessionHelper");
        setAcademicSessions(filterValidSessions(data.ACADEMIC_SESSIONS));
      } else {
        const { DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        setAcademicSessions(DEFAULT_ALL_SESSIONS);
      }
      if (data.ADMISSION_REQUIRED_FIELDS) {
        setAdmissionRequiredFields(data.ADMISSION_REQUIRED_FIELDS.split(",").map((s: string) => s.trim()).filter(Boolean));
      } else {
        setAdmissionRequiredFields(["studentName", "fatherName", "cnic", "dateOfBirth", "contactNumber", "email"]);
      }
      setAdmissionCnicLength(data.ADMISSION_CNIC_LENGTH || "15");
      setAdmissionContactLength(data.ADMISSION_CONTACT_LENGTH || "11");
      if (data.ADMISSION_CUSTOM_FIELDS) {
        try {
          setAdmissionCustomFields(JSON.parse(data.ADMISSION_CUSTOM_FIELDS));
        } catch (e) {
          console.error("Error parsing custom fields", e);
        }
      }
    }
  };

  const fetchFees = async () => {
    setFeesLoading(true);
    const res = await fetch("/api/fee-settings");
    if (res.ok) {
      const data = await res.json();
      setFees(data);
      const baseFees = data.filter((f: any) => !f.session || f.session === "");
      if (baseFees.length > 0) {
        setNewOverrideKey(prev => prev || baseFees[0].key);
      }
    }
    setFeesLoading(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSettings(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collegeId: (session?.user as any)?.collegeId || undefined,
        CHALLAN_BANK_ACCOUNT: bankAccount,
        CHALLAN_BANK_NAME: bankName,
        CHALLAN_BRANCH_CODE: branchCode,
        CHALLAN_ACCOUNT_TITLE: accountTitle,
        CHALLAN_SEQUENCE_CURRENT: sequenceStart,
        ROLL_NUMBER_PATTERN: rollPattern,
        ROLL_SEQUENCE_CURRENT: rollSequence,
        DEFAULT_FACULTY_PASSWORD: defaultFacultyPassword,
        FACULTY_EMAIL_DOMAIN: facultyEmailDomain,
        COLLEGE_NAME: collegeName,
        COLLEGE_LOGO: collegeLogo,
        COLLEGE_BACKGROUND: collegeBackground,
        COLLEGE_WATERMARK: collegeBackground,
        COLLEGE_TAGLINE: collegeTagline,
        COLLEGE_ADDRESS: collegeAddress,
        ACADEMIC_SESSIONS: academicSessions.join(","),
        ADMISSION_REQUIRED_FIELDS: admissionRequiredFields.join(","),
        ADMISSION_CNIC_LENGTH: admissionCnicLength,
        ADMISSION_CONTACT_LENGTH: admissionContactLength,
        ADMISSION_CUSTOM_FIELDS: JSON.stringify(admissionCustomFields)
      }),
    });
    if (res.ok) {
      setMsg({ type: "success", text: "Global system settings saved successfully." });
      fetchSettings();
    } else {
      setMsg({ type: "error", text: "Failed to save global settings." });
    }
    setUpdatingSettings(false);
  };

  const startEditFee = (fee: FeeSetting) => {
    setEditingFeeId(fee.id);
    setEditAmount(String(fee.amount));
    setEditDesc(fee.description || "");
    setEditKey(fee.key);
    setEditLabel(fee.label);
    setEditCategory(fee.category || "OTHER");
  };

  const handleSaveFee = async (id: string) => {
    setSavingFee(true);
    const amountVal = parseFloat(editAmount);
    if (isNaN(amountVal)) {
      alert("Please enter a valid amount.");
      setSavingFee(false);
      return;
    }
    const res = await fetch(`/api/fee-settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        amount: amountVal,
        description: editDesc,
        key: editKey,
        label: editLabel,
        category: editCategory
      }),
    });
    if (res.ok) {
      setEditingFeeId(null);
      fetchFees();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to update fee setting.");
    }
    setSavingFee(false);
  };

  const handleLockFee = async (id: string) => {
    if (!confirm("Are you sure you want to LOCK this fee? Once locked, its amount cannot be changed!")) return;
    const res = await fetch(`/api/fee-settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isLocked: true }),
    });
    if (res.ok) {
      fetchFees();
    }
  };

  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOverrideKey || !newOverrideSession || !newOverrideAmount) return;
    setCreatingOverride(true);
    const amountVal = parseFloat(newOverrideAmount);
    if (isNaN(amountVal)) {
      alert("Please enter a valid amount.");
      setCreatingOverride(false);
      return;
    }

    // Find the base fee label and category to duplicate
    const baseFee = fees.find(f => f.key === newOverrideKey && (!f.session || f.session === ""));
    const label = baseFee ? `${baseFee.label} (Session ${newOverrideSession})` : undefined;
    const category = baseFee ? baseFee.category : undefined;

    const res = await fetch("/api/fee-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: newOverrideKey,
        session: newOverrideSession,
        amount: amountVal,
        label,
        category,
        description: newOverrideDesc || undefined
      }),
    });

    if (res.ok) {
      setNewOverrideSession("");
      setNewOverrideAmount("");
      setNewOverrideDesc("");
      fetchFees();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to create override.");
    }
    setCreatingOverride(false);
  };

  const handleDeleteOverride = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session override?")) return;
    const res = await fetch(`/api/fee-settings?id=${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      fetchFees();
    } else {
      alert("Failed to delete override.");
    }
  };

  const handleToggleActive = async (fee: FeeSetting) => {
    const res = await fetch(`/api/fee-settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: fee.id, isActive: !fee.isActive }),
    });
    if (res.ok) {
      fetchFees();
    } else {
      alert("Failed to toggle fee status.");
    }
  };

  const handleAddBaseFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBaseKey || !newBaseLabel || !newBaseAmount) return;
    setCreatingBase(true);
    const amountVal = parseFloat(newBaseAmount);
    if (isNaN(amountVal)) {
      alert("Please enter a valid amount.");
      setCreatingBase(false);
      return;
    }
    const res = await fetch("/api/fee-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: newBaseKey.toUpperCase().trim(),
        label: newBaseLabel.trim(),
        category: newBaseCategory,
        amount: amountVal,
        description: newBaseDesc.trim() || undefined
      }),
    });
    if (res.ok) {
      setNewBaseKey("");
      setNewBaseLabel("");
      setNewBaseAmount("");
      setNewBaseDesc("");
      fetchFees();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to create base fee.");
    }
    setCreatingBase(false);
  };

  const handleDeleteBaseFee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fee item? All overrides associated with this fee will remain but the base key will be removed.")) return;
    const res = await fetch(`/api/fee-settings?id=${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      fetchFees();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to delete fee item.");
    }
  };

  // ----------------------------------------------------
  // TAB 3: PERMISSIONS STATES & FUNCTIONS
  // ----------------------------------------------------
  const [activeRole, setActiveRole] = useState<string>("BS_CONTROLLER");
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePerms, setRolePerms] = useState<any[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [savingMatrix, setSavingMatrix] = useState(false);

  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const res = await fetch("/api/admin/permissions");
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions);
        setRolePerms(data.rolePerms);
      }
    } catch { }
    setPermissionsLoading(false);
  };

  const getPermissionStatus = (module: string, action: string) => {
    const perm = rolePerms.find(
      (rp) => rp.role === activeRole && rp.permission?.module === module && rp.permission?.action === action
    );
    return perm ? perm.isGranted : false;
  };

  const handlePermissionToggle = (module: string, action: string) => {
    setRolePerms((prev) => {
      const existingIdx = prev.findIndex(
        (rp) => rp.role === activeRole && rp.permission?.module === module && rp.permission?.action === action
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          isGranted: !updated[existingIdx].isGranted,
        };
        return updated;
      } else {
        const pRef = permissions.find((p) => p.module === module && p.action === action);
        return [
          ...prev,
          {
            role: activeRole,
            permissionId: pRef?.id,
            permission: pRef,
            isGranted: true,
          },
        ];
      }
    });
  };

  const handleSavePermissions = async () => {
    setSavingMatrix(true);
    setMsg({ type: "", text: "" });

    const activeRoleUpdates = rolePerms
      .filter((rp) => rp.role === activeRole)
      .map((rp) => ({
        module: rp.permission.module,
        action: rp.permission.action,
        isGranted: rp.isGranted,
      }));

    try {
      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: activeRole,
          updates: activeRoleUpdates,
        }),
      });

      if (res.ok) {
        setMsg({ type: "success", text: "Permissions matrix updated successfully!" });
        fetchPermissions();
      }
    } catch {
      alert("Failed to save changes.");
    }
    setSavingMatrix(false);
  };

  // ----------------------------------------------------
  // INITIAL DATA LIFECYCLE
  // ----------------------------------------------------
  useEffect(() => {
    fetchPrograms();
    fetchDepartments();
    fetchSettings();
    fetchFees();
    fetchPermissions();
  }, [(session?.user as any)?.collegeId]);

  const [focusedHomepageSec, setFocusedHomepageSec] = useState<string | undefined>();
  const [activeAcademicSub, setActiveAcademicSub] = useState<string>("depts-list");
  const [activeFeeSub, setActiveFeeSub] = useState<string>("base-fees");

  // auto clear alert message
  useEffect(() => {
    if (msg.text) {
      const t = setTimeout(() => setMsg({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [msg]);

  // Tab change handler
  const handleTabChange = (tab: "HOMEPAGE" | "COLLEGE_PORTAL" | "ACADEMIC" | "FEES" | "PERMISSIONS" | "DATA") => {
    if (tab === "HOMEPAGE" && !isChteAdmin) {
      setMsg({
        type: "error",
        text: "Access Denied: CHTE Central Homepage settings and rules can only be modified by CHTE Super Administrators.",
      });
      return;
    }
    setActiveTab(tab);
    setMsg({ type: "", text: "" });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Tab Navigation */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Control Center & Settings</h1>
          <p className="text-gray-500 mt-1">Manage global system setup, fees structures, and permissions matrix.</p>
        </div>

        {/* Entity Switcher Pills: CHTE Main vs Affiliated Colleges */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-950/5 p-3 rounded-2xl border border-emerald-900/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Currently Configuring:</span>
            {isChteAdmin ? (
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleTabChange("HOMEPAGE")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                    activeTab === "HOMEPAGE"
                      ? "bg-[#0c5938] text-white shadow-xs scale-102"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span>🏛️</span>
                  <span>CHTE Main Homepage</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">/</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("COLLEGE_PORTAL")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                    activeTab === "COLLEGE_PORTAL"
                      ? "bg-slate-900 text-white shadow-xs scale-102"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span>🎨</span>
                  <span>Affiliated College Portals</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">/colleges/[code]</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-slate-900 text-white shadow-xs flex items-center gap-1.5">
                  <span>🎨</span>
                  <span>College Portal & Campus Theme</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">/colleges/[code]</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>CHTE Main Settings Restricted</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            {isChteAdmin && activeTab === "HOMEPAGE" ? (
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#0c5938] font-bold hover:underline"
              >
                <span>Open Live CHTE Homepage</span>
                <span>↗</span>
              </a>
            ) : (
              <span className="text-slate-500">
                {isChteAdmin
                  ? "Upload photos/videos & customize portals for 50+ Balochistan colleges"
                  : "Customize your college theme, logo, red patti ribbon, and faculty profiles"}
              </span>
            )}
          </div>
        </div>

        {/* Hover Dropdown Mega Menu Bar */}
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200/60 max-w-5xl overflow-visible relative z-30">
          {/* TAB 0: CHTE MAIN HOMEPAGE & PORTAL (ONLY FOR CHTE SUPER ADMIN) */}
          {isChteAdmin && (
            <div className="group relative flex-1 min-w-[170px]">
              <button
                onClick={() => handleTabChange("HOMEPAGE")}
                className={`w-full py-2.5 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "HOMEPAGE"
                    ? "bg-[#0c5938] text-white shadow-sm font-black"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>🏛️ CHTE Main Homepage</span>
                <span className="text-[10px] opacity-75">▼</span>
              </button>

              {/* Hover Sub-Menu Dropdown */}
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl py-2.5 hidden group-hover:block z-50 animate-fadeIn">
                <div className="px-3 pb-2 mb-1 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  CHTE Central Homepage Settings:
                </div>
                <button
                  onClick={() => { handleTabChange("HOMEPAGE"); setFocusedHomepageSec("colors"); }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-[#0c5938] flex items-center gap-2 transition-colors"
                >
                  <span>🎨</span> Background Colors & Emerald Theme
                </button>
                <button
                  onClick={() => { handleTabChange("HOMEPAGE"); setFocusedHomepageSec("scenery"); }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-[#0c5938] flex items-center gap-2 transition-colors"
                >
                  <span>🌄</span> Hero Scenery Photo & Zoom Framing
                </button>
                <button
                  onClick={() => { handleTabChange("HOMEPAGE"); setFocusedHomepageSec("titles"); }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-[#0c5938] flex items-center gap-2 transition-colors"
                >
                  <span>📝</span> Main Headline, Motto & Subtitles
                </button>
                <button
                  onClick={() => { handleTabChange("HOMEPAGE"); setFocusedHomepageSec("ticker"); }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-[#0c5938] flex items-center gap-2 transition-colors"
                >
                  <span>📣</span> Animated Marquee News Ticker
                </button>
                <button
                  onClick={() => { handleTabChange("HOMEPAGE"); setFocusedHomepageSec("leadership"); }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-[#0c5938] flex items-center gap-2 transition-colors"
                >
                  <span>🌟</span> Provincial Leadership & Profiles (Zoom/Pan)
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: COLLEGE PORTAL & THEME */}
          <div className="flex-1 min-w-[170px]">
            <button
              onClick={() => handleTabChange("COLLEGE_PORTAL")}
              className={`w-full py-2.5 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "COLLEGE_PORTAL"
                  ? "bg-slate-900 text-white shadow-sm font-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>🎨 College Portals & Themes</span>
            </button>
          </div>

          {/* TAB 2: ACADEMIC SETUP */}
          <div className="group relative flex-1 min-w-[140px]">
            <button
              onClick={() => handleTabChange("ACADEMIC")}
              className={`w-full py-2.5 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === "ACADEMIC"
                ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <span>🏫 Academic Setup</span>
              <span className="text-[10px] text-gray-400">▼</span>
            </button>

            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl py-2.5 hidden group-hover:block z-50 animate-fadeIn">
              <div className="px-3 pb-2 mb-1 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Academic Sub-Settings:
              </div>
              <button
                onClick={() => {
                  handleTabChange("ACADEMIC");
                  setActiveAcademicSub("depts-list");
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <span>🏬</span> Departments List & HODs
              </button>
              <button
                onClick={() => {
                  handleTabChange("ACADEMIC");
                  setActiveAcademicSub("programs-list");
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <span>📚</span> Programs & Groups Setup
              </button>
              <button
                onClick={() => {
                  handleTabChange("ACADEMIC");
                  setActiveAcademicSub("add-dept");
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <span>➕</span> Add New Department
              </button>
              <button
                onClick={() => {
                  handleTabChange("ACADEMIC");
                  setActiveAcademicSub("add-program");
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <span>🎓</span> Add New Program
              </button>
              <button
                onClick={() => {
                  handleTabChange("ACADEMIC");
                  setActiveAcademicSub("college-identity");
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <span>🏫</span> College Name & Identity
              </button>
            </div>
          </div>

          {/* TAB 3: FEE & CHALLAN SETTINGS */}
          <div className="group relative flex-1 min-w-[160px]">
            <button
              onClick={() => handleTabChange("FEES")}
              className={`w-full py-2.5 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === "FEES"
                ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <span>💰 Fee & Challan Settings</span>
              <span className="text-[10px] text-gray-400">▼</span>
            </button>

            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl py-2.5 hidden group-hover:block z-50 animate-fadeIn">
              <div className="px-3 pb-2 mb-1 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Fee Sub-Settings:
              </div>
              <button
                onClick={() => {
                  handleTabChange("FEES");
                  setActiveFeeSub("base-fees");
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <span>💵</span> Base Fee Rates Setup
              </button>
              <button
                onClick={() => {
                  handleTabChange("FEES");
                  setActiveFeeSub("session-overrides");
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <span>📅</span> Session Fee Overrides
              </button>
              <button
                onClick={() => {
                  handleTabChange("FEES");
                  setActiveFeeSub("bank-details");
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <span>🏛️</span> Bank Details & Challan Templates
              </button>
            </div>
          </div>

          {/* TAB 4: PERMISSIONS MATRIX */}
          <div className="group relative flex-1 min-w-[150px]">
            <button
              onClick={() => handleTabChange("PERMISSIONS")}
              className={`w-full py-2.5 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === "PERMISSIONS"
                ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <span>🔐 Permissions Matrix</span>
              <span className="text-[10px] text-gray-400">▼</span>
            </button>

            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl py-2.5 hidden group-hover:block z-50 animate-fadeIn">
              <div className="px-3 pb-2 mb-1 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Permissions Sub-Settings:
              </div>
              <button
                onClick={() => handleTabChange("PERMISSIONS")}
                className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <span>🛡️</span> Role Access Matrix
              </button>
            </div>
          </div>

          {/* TAB 5: DATA & SEEDING */}
          <div className="group relative flex-1 min-w-[140px]">
            <button
              onClick={() => handleTabChange("DATA")}
              className={`w-full py-2.5 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === "DATA"
                ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <span>⚡ Data & Seeding</span>
              <span className="text-[10px] text-gray-400">▼</span>
            </button>

            <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl py-2.5 hidden group-hover:block z-50 animate-fadeIn">
              <div className="px-3 pb-2 mb-1 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Data Operations:
              </div>
              <button
                onClick={() => handleTabChange("DATA")}
                className="w-full px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <span>⚡</span> Load Realistic Dummy Data
              </button>
              <button
                onClick={() => handleTabChange("DATA")}
                className="w-full px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <span>⚠️</span> Clear Operational Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Alert Notification */}
      {msg.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${msg.type === "success"
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-red-50 text-red-700 border-red-200"
          }`}>
          {msg.text}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 0: CHTE MAIN HOMEPAGE & CENTRAL PORTAL
          ---------------------------------------------------- */}
      {activeTab === "HOMEPAGE" && (
        <HomepageSettingsTab
          focusedSection={focusedHomepageSec}
          onSwitchToColleges={() => handleTabChange("COLLEGE_PORTAL")}
        />
      )}

      {/* ----------------------------------------------------
          TAB 1: COLLEGE PORTAL & THEME CONTROL PANEL
          ---------------------------------------------------- */}
      {activeTab === "COLLEGE_PORTAL" && (
        <CollegePortalSettingsTab onSwitchToChte={() => handleTabChange("HOMEPAGE")} />
      )}

      {/* ----------------------------------------------------
          TAB 1: ACADEMIC SETUP PANEL
          ---------------------------------------------------- */}
      {activeTab === "ACADEMIC" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub-Section Category Pills Bar */}
          <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2 overflow-x-auto">
            {[
              { id: "depts-list", label: "Departments List & HODs", icon: "🏬" },
              { id: "programs-list", label: "Programs & Groups", icon: "📚" },
              { id: "add-dept", label: "Add New Department", icon: "➕" },
              { id: "add-program", label: "Add New Program", icon: "🎓" },
              { id: "college-identity", label: "College Name & Identity", icon: "🏫" },
              { id: "ALL", label: "Show All Sections", icon: "📑" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveAcademicSub(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeAcademicSub === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-blue-600 border border-gray-200/80"
                  }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* SECTION: Add Department Form */}
          {(activeAcademicSub === "add-dept" || activeAcademicSub === "ALL") && (
            <div id="sec-add-dept" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><span>➕</span> Add New Department</h2>
              <form onSubmit={handleAddDepartment} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Department Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">HOD Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ahmed"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={newDeptHod}
                    onChange={(e) => setNewDeptHod(e.target.value)}
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={deptLoading}
                    className="w-full px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors h-[38px] flex items-center justify-center disabled:opacity-50"
                  >
                    {deptLoading ? "Adding..." : "+ Add Department"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION: Add Program Form */}
          {(activeAcademicSub === "add-program" || activeAcademicSub === "ALL") && (
            <div id="sec-add-program" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><span>🎓</span> Add New Program</h2>
              <form onSubmit={handleAddProgram} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Program Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BS Computer Science"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={newProgramName}
                    onChange={(e) => setNewProgramName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BSCS"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={newProgramCode}
                    onChange={(e) => setNewProgramCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Education Level <span className="text-red-500">*</span></label>
                  <select
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    value={newProgramLevel}
                    onChange={(e) => setNewProgramLevel(e.target.value)}
                  >
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="BS">BS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Department</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    value={newProgramDeptId}
                    onChange={(e) => setNewProgramDeptId(e.target.value)}
                  >
                    <option value="">-- None --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <button
                    type="submit"
                    className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors"
                  >
                    + Add Program
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION: Academic Setup Grid (Departments List & Programs Grid) */}
          {(activeAcademicSub === "depts-list" || activeAcademicSub === "programs-list" || activeAcademicSub === "ALL") && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Departments Card/List */}
              {(activeAcademicSub === "depts-list" || activeAcademicSub === "ALL") && (
                <div id="sec-depts-list" className="xl:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2"><span>🏬</span> Departments & HODs</h2>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {departments.length === 0 ? (
                      <p className="text-gray-400 text-sm italic">No departments registered yet.</p>
                    ) : (
                      departments.map((d) => (
                        <div key={d.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex flex-col gap-1 hover:bg-gray-100/50 transition-colors group relative">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-gray-900 text-sm">{d.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-gray-200 text-gray-700">{d.code}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium text-gray-700">HOD:</span> {d.hodName || "Not assigned"}
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1 border-t pt-1 border-gray-200/50">
                            <span>{d.programs?.length || 0} program(s) linked</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleStartEditDept(d)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors text-xs"
                                title="Edit Department"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(d.id, d.name)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors text-xs"
                                title="Delete Department"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Programs Grid */}
              {(activeAcademicSub === "programs-list" || activeAcademicSub === "ALL") && (
                <div id="sec-programs-list" className={`${activeAcademicSub === "programs-list" ? "xl:col-span-3" : "xl:col-span-2"} space-y-6`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {academicLoading ? (
                      <p className="text-gray-400 text-sm col-span-2">Loading programs...</p>
                    ) : (
                      programs.map((p) => (
                        <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition-shadow group relative">
                          <div className="flex justify-between items-start border-b pb-2">
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    {p.name}
                                    {p.code && (
                                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-blue-50 text-blue-700 border border-blue-100">
                                        {p.code}
                                      </span>
                                    )}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] uppercase font-bold text-blue-600">{p.educationLevel}</span>
                                    {p.department && (
                                      <span className="text-[10px] font-bold text-emerald-600">• {p.department.name}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleStartEditProgram(p)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors text-xs"
                                      title="Edit Program"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProgram(p.id, p.name)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors text-xs"
                                      title="Delete Program"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                  {addingGroupTo !== p.id && (
                                    <button
                                      onClick={() => setAddingGroupTo(p.id)}
                                      className="text-xs font-semibold text-blue-600 hover:underline"
                                    >
                                      + Add Group
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Add Group inline form */}
                          {addingGroupTo === p.id && (
                            <div className="p-3 bg-gray-50 rounded-lg flex gap-2">
                              <input
                                type="text"
                                placeholder="Group Name (e.g. Pre-Medical A)"
                                className="flex-1 px-3 py-1 border rounded text-xs"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                              />
                              <button
                                onClick={() => handleAddGroup(p.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setAddingGroupTo(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {/* Groups list */}
                          <div className="space-y-3">
                            {p.groups.length === 0 ? (
                              <p className="text-gray-400 text-xs italic">No groups registered.</p>
                            ) : (
                              p.groups.map((g) => (
                                <div key={g.id} className="pl-4 border-l-2 border-gray-200 py-1 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-800">{g.name}</span>
                                    {addingSubjectTo !== g.id && (
                                      <button
                                        onClick={() => setAddingSubjectTo(g.id)}
                                        className="text-[10px] text-blue-600 hover:underline"
                                      >
                                        + Add Course/Subject
                                      </button>
                                    )}
                                  </div>

                                  {/* Add Subject inline form */}
                                  {addingSubjectTo === g.id && (
                                    <div className="p-2 bg-gray-100 rounded flex gap-2 flex-wrap">
                                      <input
                                        type="text"
                                        placeholder="Name (e.g. English)"
                                        className="flex-1 min-w-[120px] px-2 py-1 border rounded text-[10px]"
                                        value={newSubjectName}
                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                      />
                                      <input
                                        type="text"
                                        placeholder="Code (e.g. ENG-101)"
                                        className="w-24 px-2 py-1 border rounded text-[10px]"
                                        value={newSubjectCode}
                                        onChange={(e) => setNewSubjectCode(e.target.value)}
                                      />
                                      <button
                                        onClick={() => handleAddSubject(g.id)}
                                        className="px-2.5 py-1 bg-blue-600 text-white text-[10px] rounded"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setAddingSubjectTo(null)}
                                        className="px-2.5 py-1 bg-gray-200 text-gray-700 text-[10px] rounded"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}

                                  {/* Subjects list */}
                                  <div className="flex flex-wrap gap-1.5">
                                    {g.subjects.map((sub) => (
                                      <span
                                        key={sub.id}
                                        className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-[10px] rounded"
                                      >
                                        {sub.name} {sub.code ? `(${sub.code})` : ""}
                                      </span>
                                    ))}
                                    {g.subjects.length === 0 && (
                                      <span className="text-gray-400 text-[10px] italic">No courses added.</span>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION: College Identity & System Configuration Cards */}
          {(activeAcademicSub === "college-identity" || activeAcademicSub === "ALL") && (
            <div className="space-y-6">
              {/* College Identity & Branding Setup Card */}
              <div id="sec-college-identity" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="border-b pb-3 flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">🏫 College Name, Logo & Identity Setup</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Customize your institution name, tagline, address, and logo. Changes dynamically apply across all Challans, DMCs, Transcripts, Datesheets & Reports.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        College / Institution Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Government Post Graduate College Quetta"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-bold text-gray-900"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                      />
                      <p className="text-[10px] text-gray-400 mt-1">This name will appear on all official printed receipts, certificates, gazettes, and headers.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        College Tagline / Subtitle
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. College of Higher Education & Research"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                        value={collegeTagline}
                        onChange={(e) => setCollegeTagline(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        College Address / Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Quetta, Balochistan, Pakistan"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                        value={collegeAddress}
                        onChange={(e) => setCollegeAddress(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        College Logo (Image File or Direct Image URL)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="https://example.com/logo.png or Base64"
                          className="flex-1 px-3 py-2 border rounded-lg text-xs font-mono"
                          value={collegeLogo}
                          onChange={(e) => setCollegeLogo(e.target.value)}
                        />
                        <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer transition-colors border">
                          📁 Upload Logo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const fd = new FormData();
                                  fd.append("file", file);
                                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                                  if (res.ok) {
                                    const data = await res.json();
                                    if (data.url) {
                                      setCollegeLogo(data.url);
                                      return;
                                    }
                                  }
                                } catch (err) {
                                  console.warn("Upload api failed, falling back to base64", err);
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setCollegeLogo(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {collegeLogo && (
                          <button
                            type="button"
                            onClick={() => setCollegeLogo("")}
                            className="px-2 py-2 text-red-500 hover:text-red-700 text-xs font-bold"
                            title="Remove logo"
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Document Background / Watermark (Image File or Direct Image URL)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="https://example.com/watermark.png or Base64"
                          className="flex-1 px-3 py-2 border rounded-lg text-xs font-mono"
                          value={collegeBackground}
                          onChange={(e) => setCollegeBackground(e.target.value)}
                        />
                        <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer transition-colors border">
                          🖼️ Upload Watermark
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const fd = new FormData();
                                  fd.append("file", file);
                                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                                  if (res.ok) {
                                    const data = await res.json();
                                    if (data.url) {
                                      setCollegeBackground(data.url);
                                      return;
                                    }
                                  }
                                } catch (err) {
                                  console.warn("Upload api failed, falling back to base64", err);
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setCollegeBackground(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {collegeBackground && (
                          <button
                            type="button"
                            onClick={() => setCollegeBackground("")}
                            className="px-2 py-2 text-red-500 hover:text-red-700 text-xs font-bold"
                            title="Remove watermark"
                          >
                            ❌
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Subtle background watermark for Timetables, Datesheets, Transcripts, Gazettes &amp; Challans.
                      </p>
                    </div>
                  </div>

                  {/* Live Preview Box */}
                  <div className="p-4 bg-gray-50 border rounded-xl space-y-2">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Document Header &amp; Watermark Preview</div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4 relative overflow-hidden">
                      {(collegeBackground || collegeLogo) && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none z-0">
                          <img src={collegeBackground || collegeLogo} alt="Watermark" className="w-32 h-32 object-contain grayscale" />
                        </div>
                      )}
                      <div className="relative z-10 flex items-center gap-4">
                        {collegeLogo ? (
                          <img src={collegeLogo} alt="College Logo" className="w-12 h-12 object-contain" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-2xl font-bold">
                            🏛️
                          </div>
                        )}
                        <div>
                          <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wide">{collegeName || "YOUR COLLEGE NAME"}</h3>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{collegeTagline}</p>
                          <p className="text-[10px] text-gray-400">{collegeAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updatingSettings}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
                    >
                      {updatingSettings ? "Saving..." : "💾 Save College Identity Settings"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Global Academic & Faculty System Configuration Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <h2 className="text-lg font-bold text-gray-900 border-b pb-2">⚙️ Academic & Faculty System Configuration</h2>
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  {/* Roll Number Pattern & Next Roll Sequence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Roll Number Pattern</label>
                      <input
                        type="text"
                        required
                        placeholder="[YEAR]-[CODE]-[SEQ]"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-bold"
                        value={rollPattern}
                        onChange={(e) => setRollPattern(e.target.value)}
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Placeholders: <span className="font-bold font-mono">[YEAR]</span> (session year), <span className="font-bold font-mono">[CODE]</span> (program code), <span className="font-bold font-mono">[SEQ]</span> (sequential sequence), <span className="font-bold font-mono">[TYPE]</span> (empty, -Bridge, or -Migration).
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Next Student Sequence (Roll Counter)</label>
                      <input
                        type="number"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-bold"
                        value={rollSequence}
                        onChange={(e) => setRollSequence(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Faculty Default Setup Card */}
                  <div className="pt-4 border-t">
                    <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider mb-3">👨‍🏫 Faculty Default Registration Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Default Faculty Password</label>
                        <input
                          type="text"
                          required
                          placeholder="gpgcq123"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-bold"
                          value={defaultFacultyPassword}
                          onChange={(e) => setDefaultFacultyPassword(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Pre-filled default password when registering new faculty members.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Faculty Email Domain</label>
                        <input
                          type="text"
                          required
                          placeholder="@gpgcquetta.edu.pk"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-bold"
                          value={facultyEmailDomain}
                          onChange={(e) => setFacultyEmailDomain(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Domain appended to auto-generated emails (e.g., ahmad.ali@gpgcquetta.edu.pk).</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Registered Academic Sessions</label>

                    {/* Active sessions list */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {academicSessions.map((session) => (
                        <span
                          key={session}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg shadow-sm"
                        >
                          📅 {session}
                          <button
                            type="button"
                            onClick={() => {
                              setAcademicSessions(prev => prev.filter(s => s !== session));
                            }}
                            className="text-blue-500 hover:text-blue-700 font-bold ml-1"
                            title="Remove session"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {academicSessions.length === 0 && (
                        <p className="text-gray-400 text-xs italic">No custom sessions added yet. Defaults will be loaded.</p>
                      )}
                    </div>

                    {/* Add new session input */}
                    <div className="space-y-2 max-w-md">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. 2024-2028 (BS) or 2024-2026 (Bridge/Inter)"
                          className="flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-xs"
                          value={newSessionInput}
                          onChange={(e) => setNewSessionInput(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const clean = newSessionInput.trim();
                            if (!clean) return;
                            const { isValidSession } = await import("@/lib/sessionHelper");
                            if (/^\d{4}$/.test(clean)) {
                              alert("Single-year sessions (e.g. " + clean + ") are not allowed. Please enter a 4-year span (e.g. " + clean + "-" + (parseInt(clean) + 4) + ") or 2-year span (e.g. " + clean + "-" + (parseInt(clean) + 2) + ").");
                              return;
                            }
                            if (!isValidSession(clean)) {
                              alert("Invalid session span. Must be a 4-year duration (e.g. 2024-2028 for BS) or 2-year duration (e.g. 2024-2026 for Bridge/Intermediate).");
                              return;
                            }
                            if (!academicSessions.includes(clean)) {
                              setAcademicSessions(prev => [...prev, clean]);
                              setNewSessionInput("");
                            }
                          }}
                          className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          Add Session
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium">
                        💡 Only 4-year spans (BS) and 2-year spans (Bridging/Intermediate) are permitted. Single years are prohibited.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-end">
                    <button
                      type="submit"
                      disabled={updatingSettings}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
                    >
                      {updatingSettings ? "Saving..." : "Save Academic Configurations"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: FEE & CHALLAN SETTINGS PANEL
          ---------------------------------------------------- */}
      {activeTab === "FEES" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub-Section Category Pills Bar */}
          <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2 overflow-x-auto">
            {[
              { id: "base-fees", label: "Base Fee Rates", icon: "💵" },
              { id: "session-overrides", label: "Session Fee Overrides", icon: "📅" },
              { id: "bank-details", label: "Bank Account & Challan Details", icon: "🏛️" },
              { id: "ALL", label: "Show All Sections", icon: "📑" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFeeSub(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeFeeSub === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-blue-600 border border-gray-200/80"
                  }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Bank & Fee Challan Setup Card */}
          {(activeFeeSub === "bank-details" || activeFeeSub === "ALL") && (
            <div id="sec-bank-details" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">🏦 Bank & Fee Challan Configuration</h2>
              <form onSubmit={handleSaveSettings} className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Habib Bank Limited (HBL)"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-bold text-gray-900"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Branch Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0873"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-bold"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Account Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Principal Govt College Quetta"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-bold text-gray-900"
                      value={accountTitle}
                      onChange={(e) => setAccountTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 08730001324203"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-bold"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Next Challan Number (Sequence Counter)</label>
                  <input
                    type="number"
                    required
                    className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-bold"
                    value={sequenceStart}
                    onChange={(e) => setSequenceStart(e.target.value)}
                  />
                </div>

                {/* Live Challan Bank Box Preview */}
                <div className="p-4 bg-gray-50 border rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Printed Challan Bank Header Preview</div>
                  <div className="bg-white p-3 border rounded text-xs font-semibold text-gray-700 uppercase tracking-wide space-y-1 font-mono max-w-md shadow-sm">
                    <div>Bank: <strong className="text-gray-900 font-bold">{bankName || "Habib Bank Limited (HBL)"}</strong></div>
                    <div>Branch Code: <strong className="text-gray-900 font-bold">{branchCode || "0873"}</strong></div>
                    <div>Title: <strong className="text-gray-900 font-bold">{accountTitle || "Principal Govt College"}</strong></div>
                    <div>A/C No: <strong className="text-blue-700 font-bold">{bankAccount || "08730001324203"}</strong></div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updatingSettings}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
                  >
                    {updatingSettings ? "Saving..." : "💾 Save Challan Bank Configuration"}
                  </button>
                </div>

                <div className="pt-6 border-t mt-4 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">📝 Admission Form Validation Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">CNIC Length Limit</label>
                      <input
                        type="number"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                        value={admissionCnicLength}
                        onChange={(e) => setAdmissionCnicLength(e.target.value)}
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Default is 15 for hyphenated (12345-1234567-1). Set to 13 to strictly disallow hyphens.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact No Length Limit</label>
                      <input
                        type="number"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                        value={admissionContactLength}
                        onChange={(e) => setAdmissionContactLength(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Compulsory Fields</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {["studentName", "fatherName", "cnic", "dateOfBirth", "contactNumber", "email", "residentAddress", "gender"].map(field => (
                        <label key={field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={admissionRequiredFields.includes(field)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAdmissionRequiredFields(prev => [...prev, field]);
                              } else {
                                setAdmissionRequiredFields(prev => prev.filter(f => f !== field));
                              }
                            }}
                          />
                          <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').replace('cnic', 'CNIC')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Custom Dynamic Fields */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Dynamic Fields (Add/Remove)</label>
                    <div className="space-y-2 mb-3">
                      {admissionCustomFields.map((cf) => (
                        <div key={cf.id} className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50 text-sm">
                          <span className="font-semibold flex-1">{cf.label}</span>
                          <span className="text-gray-500 uppercase text-xs">{cf.type}</span>
                          <span className={`text-xs font-bold ${cf.required ? 'text-red-500' : 'text-gray-400'}`}>{cf.required ? "Required" : "Optional"}</span>
                          <button type="button" onClick={() => setAdmissionCustomFields(prev => prev.filter(f => f.id !== cf.id))} className="text-red-500 hover:text-red-700 ml-2">❌</button>
                        </div>
                      ))}
                      {admissionCustomFields.length === 0 && <p className="text-xs text-gray-400 italic">No custom fields added.</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center bg-white p-2 border rounded-lg">
                      <input type="text" placeholder="Field Label (e.g. Blood Group)" id="new_cf_label" className="flex-1 min-w-[120px] px-2 py-1.5 text-sm border rounded focus:ring-blue-500 outline-none" />
                      <select id="new_cf_type" className="px-2 py-1.5 text-sm border rounded focus:ring-blue-500 outline-none bg-white">
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs font-bold text-gray-600"><input type="checkbox" id="new_cf_req" className="rounded" /> Required</label>
                      <button type="button" onClick={() => {
                        const labelEl = document.getElementById("new_cf_label") as HTMLInputElement;
                        const typeEl = document.getElementById("new_cf_type") as HTMLSelectElement;
                        const reqEl = document.getElementById("new_cf_req") as HTMLInputElement;
                        if (!labelEl.value.trim()) return;
                        const newField = {
                          id: "cf_" + Date.now(),
                          label: labelEl.value.trim(),
                          type: typeEl.value,
                          required: reqEl.checked
                        };
                        setAdmissionCustomFields(prev => [...prev, newField]);
                        labelEl.value = "";
                        reqEl.checked = false;
                      }} className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs font-bold hover:bg-black transition-colors">Add Field</button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingSettings}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {updatingSettings ? "Saving Settings..." : "💾 Save System Settings"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Grid layout for custom base fee creation and base fees table */}
          {(activeFeeSub === "base-fees" || activeFeeSub === "ALL") && (
            <div id="sec-base-fees" className="grid grid-cols-1 lg:grid-cols-4 gap-6">

              {/* Create Base Fee Form */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-4 lg:col-span-1">
                <h2 className="text-base font-bold text-gray-900 border-b pb-2">➕ Add New Fee Item</h2>
                <form onSubmit={handleAddBaseFee} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fee Key (Unique)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SPORTS_FEE"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                      value={newBaseKey}
                      onChange={(e) => setNewBaseKey(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Display Label</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sports & Athletics Fee"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={newBaseLabel}
                      onChange={(e) => setNewBaseLabel(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                      value={newBaseCategory}
                      onChange={(e) => setNewBaseCategory(e.target.value)}
                    >
                      <option value="BS">BS Program</option>
                      <option value="INTERMEDIATE">Intermediate Program</option>
                      <option value="EXAM">Examination</option>
                      <option value="OTHER">Other Fees</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount (PKR)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1500"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                      value={newBaseAmount}
                      onChange={(e) => setNewBaseAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      placeholder="Brief description"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={newBaseDesc}
                      onChange={(e) => setNewBaseDesc(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingBase}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {creatingBase ? "Creating Item..." : "Save Fee Item"}
                  </button>
                </form>
              </div>

              {/* Fee Amounts Card (Base Fees Table) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-3">
                <div className="p-6 border-b flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">💰 Base Fee Rates & Locks</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Configure default fee amounts used for auto challan generation when no session override exists.</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded font-semibold">🔓 Editable</span>
                    <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-semibold">🔒 Locked (Fixed)</span>
                  </div>
                </div>

                {feesLoading ? (
                  <p className="p-6 text-center text-gray-400 text-sm">Loading fee settings...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap w-24">Lock Status</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap w-24">Status</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Category</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Key</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Fee Label</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Amount (PKR)</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Amount in Words</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees.filter(f => !f.session || f.session === "").map((fee) => {
                          const isEditing = editingFeeId === fee.id;
                          return (
                            <tr key={fee.id} className="border-b hover:bg-gray-50/50">
                              <td className="px-4 py-4">
                                <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${fee.isLocked ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
                                  }`}>
                                  {fee.isLocked ? "🔒 Locked" : "🔓 Open"}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => handleToggleActive(fee)}
                                  className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-colors ${fee.isActive
                                    ? "bg-green-600 border-green-600 text-white hover:bg-green-700"
                                    : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                  {fee.isActive ? "🟢 Active" : "🔴 Inactive"}
                                </button>
                              </td>
                              <td className="px-4 py-4">
                                {isEditing ? (
                                  <select
                                    className="px-2 py-1 border rounded text-xs bg-white focus:ring-blue-500"
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                  >
                                    <option value="BS">BS</option>
                                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                                    <option value="EXAM">EXAM</option>
                                    <option value="OTHER">OTHER</option>
                                  </select>
                                ) : (
                                  <span className="font-semibold text-gray-500 uppercase tracking-wide text-xs">{fee.category || "General"}</span>
                                )}
                              </td>
                              <td className="px-4 py-4 font-mono text-xs font-bold text-gray-700">
                                {isEditing && !fee.isLocked ? (
                                  <input
                                    type="text"
                                    className="px-2 py-1 border rounded text-xs font-bold font-mono focus:ring-blue-500"
                                    value={editKey}
                                    onChange={(e) => setEditKey(e.target.value.toUpperCase())}
                                  />
                                ) : (
                                  fee.key
                                )}
                              </td>
                              <td className="px-4 py-4">
                                {isEditing && !fee.isLocked ? (
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1 border rounded text-xs focus:ring-blue-500"
                                    value={editLabel}
                                    onChange={(e) => setEditLabel(e.target.value)}
                                  />
                                ) : (
                                  <div className="font-semibold text-gray-900">{fee.label}</div>
                                )}
                                {isEditing ? (
                                  <input
                                    type="text"
                                    className="mt-1 w-full px-2 py-1 border rounded text-[10px] text-gray-500"
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    placeholder="Note/Description"
                                  />
                                ) : (
                                  fee.description && <div className="text-xs text-gray-500">{fee.description}</div>
                                )}
                              </td>
                              <td className="px-4 py-4 font-mono font-bold text-gray-800">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    className="w-24 px-2 py-1 border rounded text-sm font-bold font-mono focus:ring-blue-500"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                  />
                                ) : (
                                  `Rs. ${fee.amount.toLocaleString()}`
                                )}
                              </td>
                              <td className="px-4 py-4 text-xs text-gray-500 capitalize italic">
                                {isEditing ? (
                                  toWords(parseFloat(editAmount) || 0) + " Rupees Only"
                                ) : (
                                  toWords(fee.amount) + " Rupees Only"
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <div className="flex justify-center gap-3">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => handleSaveFee(fee.id)}
                                        disabled={savingFee}
                                        className="text-xs text-blue-600 font-bold hover:underline"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingFeeId(null)}
                                        className="text-xs text-gray-500 hover:underline"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => startEditFee(fee)}
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        Edit
                                      </button>
                                      {!fee.isLocked && (
                                        <>
                                          <button
                                            onClick={() => handleLockFee(fee.id)}
                                            className="text-xs text-red-600 hover:underline font-semibold"
                                          >
                                            Lock
                                          </button>
                                          <button
                                            onClick={() => handleDeleteBaseFee(fee.id)}
                                            className="text-xs text-red-600 hover:underline font-semibold"
                                          >
                                            Delete
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Session Overrides Section */}
          {(activeFeeSub === "session-overrides" || activeFeeSub === "ALL") && (
            <div id="sec-session-overrides" className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Create Override Form */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-4 lg:col-span-1">
                <h2 className="text-base font-bold text-gray-900 border-b pb-2">➕ Add Session Override</h2>
                <form onSubmit={handleAddOverride} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Fee Item</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                      value={newOverrideKey}
                      onChange={(e) => setNewOverrideKey(e.target.value)}
                    >
                      {fees.filter(f => (!f.session || f.session === "") && f.isActive).map(f => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Session Year</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 2022"
                      min={2000}
                      max={2099}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                      value={newOverrideSession}
                      onChange={(e) => setNewOverrideSession(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Override Amount (PKR)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 3000"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                      value={newOverrideAmount}
                      onChange={(e) => setNewOverrideAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Discounted rate for 2022 batch"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={newOverrideDesc}
                      onChange={(e) => setNewOverrideDesc(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingOverride}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {creatingOverride ? "Creating Override..." : "Save Override"}
                  </button>
                </form>
              </div>

              {/* List of Active Overrides */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
                <div className="p-6 border-b">
                  <h2 className="text-base font-bold text-gray-900">⚡ Active Session Overrides</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Session-wise customized fee structures currently active in the system.</p>
                </div>

                {feesLoading ? (
                  <p className="p-6 text-center text-gray-400 text-xs">Loading overrides...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-2.5 font-semibold text-gray-600">Session</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-600">Fee Item</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-600">Override Amount</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-600">Description</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-600 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees.filter(f => f.session && f.session !== "").map((fee) => {
                          const isEditing = editingFeeId === fee.id;
                          return (
                            <tr key={fee.id} className="border-b hover:bg-gray-50/50">
                              <td className="px-4 py-3 font-mono font-bold text-blue-700">{fee.session}</td>
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {fees.find(bf => bf.key === fee.key && (!bf.session || bf.session === ""))?.label || fee.key}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-gray-800">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    className="w-20 px-2 py-0.5 border rounded text-xs font-bold font-mono"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                  />
                                ) : (
                                  `Rs. ${fee.amount.toLocaleString()}`
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    className="w-full px-2 py-0.5 border rounded text-xs"
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                  />
                                ) : (
                                  fee.description || "—"
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center gap-2">
                                  {isEditing ? (
                                    <>
                                      <button onClick={() => handleSaveFee(fee.id)} className="text-blue-600 font-bold hover:underline">Save</button>
                                      <button onClick={() => setEditingFeeId(null)} className="text-gray-500 hover:underline">Cancel</button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => startEditFee(fee)} className="text-blue-600 hover:underline">Edit</button>
                                      <button onClick={() => handleDeleteOverride(fee.id)} className="text-red-600 font-bold hover:underline">Delete</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {fees.filter(f => f.session && f.session !== "").length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-400 italic">No session-wise overrides configured. Use the form on the left to add one!</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: PERMISSIONS MATRIX PANEL
          ---------------------------------------------------- */}
      {activeTab === "PERMISSIONS" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Dynamic RBAC Permission Matrix</h2>
              <p className="text-gray-500 mt-0.5">Configure system-wide module-level and action-level credentials dynamically.</p>
            </div>
            <button
              onClick={handleSavePermissions}
              disabled={savingMatrix || permissionsLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
            >
              {savingMatrix ? "Saving Changes..." : "💾 Save Matrix Changes"}
            </button>
          </div>

          {/* Role Selection Tabs */}
          <div className="flex border-b overflow-x-auto bg-gray-50/50 rounded-t-2xl">
            {Object.values(ROLES)
              .filter((r) => r !== "SUPER_ADMIN") // Super Admin has hardcoded full bypass
              .map((r) => (
                <button
                  key={r}
                  className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-all ${activeRole === r
                    ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setActiveRole(r)}
                >
                  👤 {r.replace(/_/g, " ")}
                </button>
              ))}
          </div>

          {/* Permissions Grid */}
          <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-gray-100 overflow-hidden">
            {permissionsLoading ? (
              <p className="text-center py-16 text-gray-400">Loading permission definitions...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-5 py-4 font-bold text-gray-700 w-80">Module / Resource Name</th>
                      {Object.values(ACTIONS).map((action) => (
                        <th key={action} className="px-3 py-4 text-center font-bold text-gray-600 text-xs">
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(new Set(permissions.map((p) => p.module))).map((module) => (
                      <tr key={module} className="border-b hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-800 text-xs tracking-wider">
                          {module}
                        </td>
                        {Object.values(ACTIONS).map((action) => {
                          const granted = getPermissionStatus(module, action);
                          return (
                            <td key={action} className="px-3 py-3 text-center">
                              <button
                                onClick={() => handlePermissionToggle(module, action)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${granted
                                  ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                                  : "bg-red-50 text-red-400 hover:bg-red-100 border border-red-200"
                                  }`}
                              >
                                {granted ? "✓" : "✗"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 4: DATA & SEEDING MANAGEMENT PANEL
          ---------------------------------------------------- */}
      {activeTab === "DATA" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-2">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              ⚡ Dummy Data & Database Management
            </h2>
            <p className="text-gray-500 text-sm">
              Load realistic dummy data across all system models (Departments, Programs, Courses, Faculty, Students, Admissions, Fees & Challans) or clear system operational data while preserving SuperAdmin credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Load Dummy Data Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold border border-emerald-200">
                  🌱
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Load Realistic Sample Data</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Populates the database with real Pakistan/Balochistan context names, CNICs, roll numbers, departments, programs, courses, faculty members, student enrollments, marks, fees & paid/pending challans.
                  </p>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-xl text-xs text-emerald-900 border border-emerald-100 space-y-1">
                  <p className="font-bold">Includes Sample Credentials:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800">
                    <li>Super Admin: <code className="bg-white px-1 py-0.5 rounded font-mono font-bold text-emerald-900">admin@college.edu / admin123</code></li>
                    <li>Faculty Members: <code className="bg-white px-1 py-0.5 rounded font-mono font-bold text-emerald-900">gpgcq123</code></li>
                    <li>Students: <code className="bg-white px-1 py-0.5 rounded font-mono font-bold text-emerald-900">student123</code></li>
                  </ul>
                </div>
              </div>

              <button
                onClick={handleLoadDummyData}
                disabled={seedingLoading || clearingLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {seedingLoading ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span> Loading Dummy Data...
                  </>
                ) : (
                  <>⚡ Populate Sample Dummy Data</>
                )}
              </button>
            </div>

            {/* Clear All Dummy Data Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-2xl font-bold border border-red-200">
                  🗑️
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Clear All Operational Data</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Wipes out all operational records including students, faculty profiles, admissions, courses, marks, attendance, and fee challans.
                  </p>
                </div>
                <div className="bg-red-50/60 p-3 rounded-xl text-xs text-red-900 border border-red-100">
                  <p className="font-bold text-red-900">🔒 Safe Reset Guaranteed:</p>
                  <p className="text-[11px] text-red-800 mt-0.5">
                    Your SuperAdmin login (<code className="bg-white px-1 py-0.5 rounded font-mono font-bold text-red-900">admin@college.edu</code>) and default system permissions will NOT be deleted.
                  </p>
                </div>
              </div>

              <button
                onClick={handleClearDummyData}
                disabled={seedingLoading || clearingLoading}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
              >
                {clearingLoading ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span> Clearing Data...
                  </>
                ) : (
                  <>🗑️ Clear All Operational Data</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDeptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl max-w-md w-full mx-4 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">✏️ Edit Department</h3>
              <button
                onClick={() => setEditingDeptId(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={editDeptCode}
                  onChange={(e) => setEditDeptCode(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  HOD Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ahmed"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={editDeptHod}
                  onChange={(e) => setEditDeptHod(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDeptId(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingDept}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {updatingDept ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {editingProgramId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl max-w-md w-full mx-4 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">✏️ Edit Program</h3>
              <button
                onClick={() => setEditingProgramId(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateProgram} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Program Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BS Computer Science"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={editProgramName}
                  onChange={(e) => setEditProgramName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BSCS"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={editProgramCode}
                  onChange={(e) => setEditProgramCode(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Education Level <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  value={editProgramLevel}
                  onChange={(e) => setEditProgramLevel(e.target.value)}
                >
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="BS">BS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Department</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  value={editProgramDeptId}
                  onChange={(e) => setEditProgramDeptId(e.target.value)}
                >
                  <option value="">-- None --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProgramId(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProgram}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {updatingProgram ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

