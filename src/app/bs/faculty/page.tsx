"use client";

import { useState, useEffect } from "react";

type FacultyRecord = {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  fatherName?: string | null;
  designation?: string | null;
  qualification?: string | null;
  contactNumber?: string | null;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  educationLevel?: string | null;
  isActive: boolean;
  courses?: any[];
  college?: {
    id: string;
    name: string;
    code: string;
  } | null;
  cnic?: string | null;
  personalNo?: string | null;
  firstAppointmentDate?: string | null;
  previousCollege?: string | null;
  division?: string | null;
  district?: string | null;
  photo?: string | null;
  additionalCharge?: string | null;
  leaveDossier?: {
    leaveType: string;
    reason: string;
    sanctionRef: string;
    startDate: string;
    endDate?: string;
    documentUrl?: string;
    documentName?: string;
    createdAt?: string;
  } | null;
};

type FacultyActionData = {
  facultyId: string;
  facultyName: string;
  fatherName?: string;
  department?: string;
  collegeName?: string;
  currentStatus: "JOINED" | "RELIEVED";
  joiningDate?: string;
  joiningNotificationNo?: string;
  joiningNotificationDate?: string;
  joiningTimeOfDay?: string;
  joiningDesignation?: string;
  joiningBpsScale?: string;
  joiningSubject?: string;
  joiningStation?: string;
  joiningMemoNo?: string;
  joiningCashNo?: string;
  joiningOpiumDated?: string;
  joiningNotes?: string;
  relievedDate?: string;
  relievedNotificationNo?: string;
  relievedNotificationDate?: string;
  relievedTimeOfDay?: string;
  relievedDesignation?: string;
  relievedBpsScale?: string;
  relievedSubject?: string;
  relievedMemoNo?: string;
  relievedStation?: string;
  relievedDestination?: string;
  relievedNotes?: string;
  lastUpdated?: string;
};

const INPUT_STYLE = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium";
const BTN_PRIMARY = "px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50";
const BTN_SECONDARY = "px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-gray-200 shadow-sm cursor-pointer";

// Helper to auto-generate faculty email from name
const generateEmailFromName = (fullName: string, domain: string) => {
  if (!fullName) return "";
  let cleaned = fullName.replace(/^(dr|prof|engr|mr|ms|mrs)\.?\s+/i, "");
  cleaned = cleaned.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".");
  cleaned = cleaned.replace(/^\.|\.$/g, "");
  return cleaned ? `${cleaned}${domain}` : "";
};

export default function BSFacultyPage() {
  const [facultyList, setFacultyList] = useState<FacultyRecord[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // System Settings Defaults
  const [defaultPassword, setDefaultPassword] = useState("gpgcq123");
  const [emailDomain, setEmailDomain] = useState("@gpgcquetta.edu.pk");
  const [collegeDisplayName, setCollegeDisplayName] = useState("Govt: Postgraduate College Sariab Road Quetta");
  const [collegeShortCode, setCollegeShortCode] = useState("GCQ");

  // Faculty Actions Map (Joining / Relieved Status Store)
  const [facultyActions, setFacultyActions] = useState<Record<string, FacultyActionData>>({});

  // Alerts
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters State
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterDesignation, setFilterDesignation] = useState("ALL");
  const [statusTab, setStatusTab] = useState<"ACTIVE" | "INACTIVE" | "RELIEVED" | "ALL">("ACTIVE");

  // Modals
  const [viewingFaculty, setViewingFaculty] = useState<FacultyRecord | null>(null);
  const [editingFaculty, setEditingFaculty] = useState<FacultyRecord | null>(null);

  // Leave & Rejoin Modals (for Inactive Status with Reason & Documents)
  const [leaveModalFaculty, setLeaveModalFaculty] = useState<FacultyRecord | null>(null);
  const [rejoinModalFaculty, setRejoinModalFaculty] = useState<FacultyRecord | null>(null);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "STUDY_LEAVE",
    sanctionRef: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    reason: "",
    documentUrl: "",
    documentName: "",
  });
  const [rejoinForm, setRejoinForm] = useState({
    returnDate: new Date().toISOString().slice(0, 10),
    remarks: "Resumed active teaching duties.",
  });

  const LEAVE_TYPES: Record<string, string> = {
    STUDY_LEAVE: "Study Leave (Higher Studies / Ph.D.)",
    HEALTH_LEAVE: "Medical / Health Leave",
    LEAVE_WITHOUT_PAY: "Leave Without Pay / Salary (EOL)",
    EX_PAKISTAN_LEAVE: "Ex-Pakistan Leave",
    MATERNITY_PATERNITY: "Maternity / Paternity Leave",
    DEPUTATION: "On Deputation / Attached to other Dept",
    SUSPENSION: "Under Suspension",
    OTHER: "Other Official Absence / Leave",
  };

  const getLeaveLabel = (type?: string) => {
    if (!type) return "On Leave";
    return LEAVE_TYPES[type] || type;
  };

  // Helper for Document Upload (PDF / Image) up to 5MB
  const handleDocUpload = (file: File, callback: (base64: string, name: string) => void) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Document file size must be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        callback(reader.result as string, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // New Modals: Joining & Relieved Action Modals
  const [showJoiningModal, setShowJoiningModal] = useState(false);
  const [showRelievedModal, setShowRelievedModal] = useState(false);
  const [targetFaculty, setTargetFaculty] = useState<FacultyRecord | null>(null);
  const [joiningMode, setJoiningMode] = useState<"EXISTING" | "NEW">("EXISTING");

  // New Incoming Faculty Form State (within Joining Modal)
  const blankJoiningNewForm = {
    name: "",
    fatherName: "",
    cnic: "",
    contactNumber: "",
    email: "",
    photo: "",
    personalNo: "",
    firstAppointmentDate: "",
    previousCollege: "",
    division: "Quetta",
    district: "Quetta",
    qualification: "Ph.D. Computer Science",
    departmentId: "",
    educationLevel: "BOTH",
    additionalCharge: "",
  };
  const [joiningNewForm, setJoiningNewForm] = useState(blankJoiningNewForm);

  // Printable Official Report Modals (Word File Formats)
  const [showTriPrintModal, setShowTriPrintModal] = useState(false);
  const [showRelievingPrintModal, setShowRelievingPrintModal] = useState(false);

  // Report Data States
  const [triReportData, setTriReportData] = useState<{
    facultyName: string;
    designation: string;
    bpsScale: string;
    subject: string;
    collegeName: string;
    notificationNo: string;
    notificationDate: string;
    joiningDate: string;
    timeOfDay: string;
    station: string;
    cashNo: string;
    opiumDated: string;
  }>({
    facultyName: "MR. RAHIM BAKHSH",
    designation: "Lecturer",
    bpsScale: "B-17",
    subject: "Psychology",
    collegeName: "Govt: Postgraduate College Sariab Road Quetta",
    notificationNo: "SOC- 1/1-1(5)2008/1796-1807",
    notificationDate: "07/Sep:/2020",
    joiningDate: "22/Sep /2020",
    timeOfDay: "before noon",
    station: "Quetta",
    cashNo: "1042/GCQ",
    opiumDated: "2020",
  });

  const [relievingReportData, setRelievingReportData] = useState<{
    facultyName: string;
    designation: string;
    bpsScale: string;
    subject: string;
    collegeName: string;
    collegeAddress: string;
    notificationNo: string;
    notificationDate: string;
    relievingDate: string;
    timeOfDay: string;
    station: string;
    memoNo: string;
  }>({
    facultyName: "MR. ABDUL AHAD",
    designation: "Associate Professor",
    bpsScale: "B-19",
    subject: "Mathematics",
    collegeName: "Govt: Boys Postgraduate College",
    collegeAddress: "Sariab Road, Quetta.",
    notificationNo: "SOC. 11/1-1 (5) /2008/Edn::/2012-17/",
    notificationDate: "21/September /2020",
    relievingDate: "22/09/2020",
    timeOfDay: "before noon",
    station: "Quetta",
    memoNo: "1042",
  });

  // Joining Form State
  const [joiningForm, setJoiningForm] = useState({
    facultyId: "",
    notificationNo: "SOC- 1/1-1(5)2008/1796-1807",
    notificationDate: "07/Sep:/2020",
    effectiveDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    timeOfDay: "before noon",
    designation: "Lecturer",
    bpsScale: "B-17",
    subject: "Psychology",
    memoNo: "1042/GCQ",
    station: "Quetta",
    cashNo: "",
    opiumDated: new Date().getFullYear().toString(),
    notes: "",
  });

  // Relieved Form State
  const [relievedForm, setRelievedForm] = useState({
    facultyId: "",
    notificationNo: "SOC. 11/1-1 (5) /2008/Edn::/2012-17/",
    notificationDate: "21/September /2020",
    effectiveDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
    timeOfDay: "before noon",
    designation: "Associate Professor",
    bpsScale: "B-19",
    subject: "Mathematics",
    memoNo: "1042",
    station: "Quetta",
    destinationTransfer: "",
    notes: "",
  });

  // Form State for New Faculty Registration
  const blankForm = {
    name: "",
    fatherName: "",
    cnic: "",
    contactNumber: "",
    email: "",
    password: "gpgcq123",
    photo: "",
    personalNo: "",
    firstAppointmentDate: "",
    previousCollege: "",
    division: "Quetta",
    district: "Quetta",
    designation: "Assistant Professor",
    qualification: "Ph.D. Computer Science",
    departmentId: "",
    educationLevel: "BOTH",
  };
  const [form, setForm] = useState(blankForm);

  // Helper for image upload to base64
  const handlePhotoUpload = (file: File, callback: (base64: string) => void) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Image file size should be less than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        callback(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchAll();
    loadFacultyActions();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fRes, dRes, sRes] = await Promise.all([
        fetch("/api/faculty"),
        fetch("/api/departments"),
        fetch("/api/settings"),
      ]);

      if (fRes.ok) setFacultyList(await fRes.json());
      if (dRes.ok) setDepartments(await dRes.json());
      if (sRes.ok) {
        const sData = await sRes.json();
        const pwd = sData.DEFAULT_FACULTY_PASSWORD || "gpgcq123";
        const dom = sData.FACULTY_EMAIL_DOMAIN || "@gpgcquetta.edu.pk";
        const cName = sData.COLLEGE_NAME || "Govt: Postgraduate College Sariab Road Quetta";
        const cCode = sData.COLLEGE_CODE || "GCQ";
        setDefaultPassword(pwd);
        setEmailDomain(dom);
        setCollegeDisplayName(cName);
        setCollegeShortCode(cCode);
        setForm((prev) => ({ ...prev, password: prev.password || pwd }));
      }
    } catch {
      setError("Failed to load faculty records.");
    }
    setLoading(false);
  };

  const loadFacultyActions = async () => {
    try {
      const res = await fetch("/api/faculty/actions");
      if (res.ok) {
        const json = await res.json();
        if (json.data && typeof json.data === "object") {
          setFacultyActions(json.data);
          try {
            localStorage.setItem("faculty_actions_cache", JSON.stringify(json.data));
          } catch {}
        }
      }
    } catch {
      try {
        const cached = localStorage.getItem("faculty_actions_cache");
        if (cached) setFacultyActions(JSON.parse(cached));
      } catch {}
    }
  };

  // Auto-generate email on name change
  const handleNameChange = (nameVal: string) => {
    const autoEmail = generateEmailFromName(nameVal, emailDomain);
    setForm((prev) => ({
      ...prev,
      name: nameVal,
      email: autoEmail,
    }));
  };

  // Filtered List with Tab-Aware Status Filtering
  const filteredFaculty = facultyList.filter((f) => {
    const act = facultyActions[f.id];
    const isRelieved = act?.currentStatus === "RELIEVED";

    // Tab Status Filtering: Relieved faculty is automatically moved out of active roster
    if (statusTab === "ACTIVE") {
      if (isRelieved || !f.isActive) return false;
    } else if (statusTab === "INACTIVE") {
      if (isRelieved || f.isActive) return false;
    } else if (statusTab === "RELIEVED") {
      if (!isRelieved) return false;
    }

    const q = search.toLowerCase().trim();
    if (q) {
      const nameMatch = f.user?.name?.toLowerCase().includes(q);
      const emailMatch = f.user?.email?.toLowerCase().includes(q);
      const fatherMatch = f.fatherName?.toLowerCase().includes(q);
      const desigMatch = f.designation?.toLowerCase().includes(q);
      const addlMatch = f.additionalCharge?.toLowerCase().includes(q);
      const qualMatch = f.qualification?.toLowerCase().includes(q);
      const cnicMatch = f.cnic?.toLowerCase().includes(q);
      const personalNoMatch = f.personalNo?.toLowerCase().includes(q);
      const prevCollegeMatch = f.previousCollege?.toLowerCase().includes(q);
      const divisionMatch = f.division?.toLowerCase().includes(q);
      const districtMatch = f.district?.toLowerCase().includes(q);
      if (
        !nameMatch &&
        !emailMatch &&
        !fatherMatch &&
        !desigMatch &&
        !addlMatch &&
        !qualMatch &&
        !cnicMatch &&
        !personalNoMatch &&
        !prevCollegeMatch &&
        !divisionMatch &&
        !districtMatch
      )
        return false;
    }

    if (filterDept !== "ALL" && f.departmentId !== filterDept) return false;

    if (filterDesignation !== "ALL") {
      if (f.designation?.toLowerCase() !== filterDesignation.toLowerCase()) return false;
    }

    return true;
  });

  // Action: Edit Faculty Details
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/faculty/${editingFaculty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingFaculty.user?.name,
          fatherName: editingFaculty.fatherName,
          designation: editingFaculty.designation,
          qualification: editingFaculty.qualification,
          contactNumber: editingFaculty.contactNumber,
          departmentId: editingFaculty.departmentId,
          educationLevel: editingFaculty.educationLevel,
          isActive: editingFaculty.isActive,
          cnic: editingFaculty.cnic,
          personalNo: editingFaculty.personalNo,
          firstAppointmentDate: editingFaculty.firstAppointmentDate,
          previousCollege: editingFaculty.previousCollege,
          division: editingFaculty.division,
          district: editingFaculty.district,
          photo: editingFaculty.photo,
          additionalCharge: editingFaculty.additionalCharge,
        }),
      });

      if (res.ok) {
        setSuccess(`Faculty details for "${editingFaculty.user?.name}" updated successfully!`);
        setEditingFaculty(null);
        fetchAll();
      } else {
        const d = await res.json();
        setError(d.error || "Update failed.");
      }
    } catch {
      setError("Failed to update faculty member.");
    }
    setSaving(false);
  };

  // Open Leave Modal (to set inactive with reason & document)
  const openLeaveModal = (f: FacultyRecord) => {
    setLeaveModalFaculty(f);
    setLeaveForm({
      leaveType: "STUDY_LEAVE",
      sanctionRef: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      reason: "",
      documentUrl: "",
      documentName: "",
    });
  };

  // Submit Leave Action
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveModalFaculty) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/faculty/${leaveModalFaculty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: false,
          leaveDossier: {
            ...leaveForm,
            createdAt: new Date().toISOString(),
          },
        }),
      });
      if (res.ok) {
        setSuccess(`Faculty member "${leaveModalFaculty.user?.name}" marked Inactive (${getLeaveLabel(leaveForm.leaveType)}).`);
        setLeaveModalFaculty(null);
        fetchAll();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to record leave.");
      }
    } catch {
      setError("Failed to record leave.");
    }
    setSaving(false);
  };

  // Open Rejoin Modal (to resume duty from leave)
  const openRejoinModal = (f: FacultyRecord) => {
    setRejoinModalFaculty(f);
    setRejoinForm({
      returnDate: new Date().toISOString().slice(0, 10),
      remarks: "Resumed active teaching duties.",
    });
  };

  // Submit Rejoin Action
  const handleSubmitRejoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejoinModalFaculty) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/faculty/${rejoinModalFaculty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: true,
          leaveDossier: null,
        }),
      });
      if (res.ok) {
        setSuccess(`Faculty member "${rejoinModalFaculty.user?.name}" has rejoined active duty successfully!`);
        setRejoinModalFaculty(null);
        fetchAll();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to resume active status.");
      }
    } catch {
      setError("Failed to resume active status.");
    }
    setSaving(false);
  };

  // Action: Export CSV
  const handleExportCSV = () => {
    if (filteredFaculty.length === 0) {
      alert("No faculty records available to export.");
      return;
    }

    const headers = [
      "#",
      "Faculty Name",
      "Father Name",
      "Designation",
      "Qualification",
      "Department",
      "Joining Status",
      "Email Address",
      "Contact Number",
      "Status",
    ];

    const rows = filteredFaculty.map((f, i) => {
      const act = facultyActions[f.id];
      const statusLabel = act?.currentStatus === "RELIEVED"
        ? `Relieved (${act.relievedDate || ""})`
        : act?.currentStatus === "JOINED"
        ? `Joined (${act.joiningDate || ""})`
        : "Active on Duty";

      return [
        i + 1,
        `"${f.user?.name || ""}"`,
        `"${f.fatherName || "N/A"}"`,
        `"${f.designation || "Lecturer"}"`,
        `"${f.qualification || "M.Phil"}"`,
        `"${f.department?.name || "Unassigned"}"`,
        `"${statusLabel}"`,
        `"${f.user?.email || ""}"`,
        `"${f.contactNumber || "N/A"}"`,
        `"${f.isActive ? "Active" : "Inactive"}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BS_Faculty_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Joining Modal for specific faculty or general
  const handleOpenJoiningModal = (f?: FacultyRecord) => {
    const sel = f || (filteredFaculty.length > 0 ? filteredFaculty[0] : null);
    const existing = sel ? facultyActions[sel.id] : null;
    setTargetFaculty(sel);
    setJoiningForm({
      facultyId: sel?.id || "",
      notificationNo: existing?.joiningNotificationNo || "SOC- 1/1-1(5)2008/1796-1807",
      notificationDate: existing?.joiningNotificationDate || "07/Sep:/2020",
      effectiveDate: existing?.joiningDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      timeOfDay: existing?.joiningTimeOfDay || "before noon",
      designation: existing?.joiningDesignation || sel?.designation || "Lecturer",
      bpsScale: existing?.joiningBpsScale || (sel?.designation?.includes("Associate") ? "B-19" : sel?.designation?.includes("Assistant") ? "B-18" : sel?.designation?.includes("Professor") ? "B-20" : "B-17"),
      subject: existing?.joiningSubject || sel?.department?.name || "Psychology",
      memoNo: existing?.joiningMemoNo || `${Math.floor(1000 + Math.random() * 9000)}/${collegeShortCode || "GCQ"}`,
      station: existing?.joiningStation || "Quetta",
      cashNo: existing?.joiningCashNo || "",
      opiumDated: existing?.joiningOpiumDated || new Date().getFullYear().toString(),
      notes: existing?.joiningNotes || "",
    });
    setShowJoiningModal(true);
  };

  // Open Relieved Modal for specific faculty or general
  const handleOpenRelievedModal = (f?: FacultyRecord) => {
    const sel = f || (filteredFaculty.length > 0 ? filteredFaculty[0] : null);
    const existing = sel ? facultyActions[sel.id] : null;
    setTargetFaculty(sel);
    setRelievedForm({
      facultyId: sel?.id || "",
      notificationNo: existing?.relievedNotificationNo || "SOC. 11/1-1 (5) /2008/Edn::/2012-17/",
      notificationDate: existing?.relievedNotificationDate || "21/September /2020",
      effectiveDate: existing?.relievedDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
      timeOfDay: existing?.relievedTimeOfDay || "before noon",
      designation: existing?.relievedDesignation || sel?.designation || "Associate Professor",
      bpsScale: existing?.relievedBpsScale || (sel?.designation?.includes("Associate") ? "B-19" : sel?.designation?.includes("Assistant") ? "B-18" : sel?.designation?.includes("Professor") ? "B-20" : "B-17"),
      subject: existing?.relievedSubject || sel?.department?.name || "Mathematics",
      memoNo: existing?.relievedMemoNo || `${Math.floor(1000 + Math.random() * 9000)}`,
      station: existing?.relievedStation || "Quetta",
      destinationTransfer: existing?.relievedDestination || "",
      notes: existing?.relievedNotes || "",
    });
    setShowRelievedModal(true);
  };

  // Submit Joining Action & Issue Form T.R.I
  const handleSubmitJoining = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let resolvedFacultyId = joiningForm.facultyId;
    let facultyDisplayName = "";

    try {
      if (joiningMode === "NEW") {
        if (!joiningNewForm.name) {
          alert("Please enter full name of incoming faculty member.");
          setSaving(false);
          return;
        }
        const autoEmail = joiningNewForm.email || generateEmailFromName(joiningNewForm.name, emailDomain);
        const facRes = await fetch("/api/faculty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...joiningNewForm,
            email: autoEmail,
            password: defaultPassword,
            designation: joiningForm.designation,
            departmentId: joiningNewForm.departmentId || (departments[0]?.id || null),
          }),
        });

        if (!facRes.ok) {
          const d = await facRes.json().catch(() => ({}));
          alert(d.error || "Failed to register incoming faculty member.");
          setSaving(false);
          return;
        }
        const createdFac = await facRes.json();
        resolvedFacultyId = createdFac.id;
        facultyDisplayName = createdFac.user?.name || joiningNewForm.name;
      } else {
        if (!joiningForm.facultyId) {
          alert("Please select a faculty member");
          setSaving(false);
          return;
        }
        const sel = facultyList.find((f) => f.id === joiningForm.facultyId) || targetFaculty;
        facultyDisplayName = sel?.user?.name || "MR. RAHIM BAKHSH";
      }

      const res = await fetch("/api/faculty/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...joiningForm,
          facultyId: resolvedFacultyId,
          actionType: "JOINING",
          collegeName: collegeDisplayName,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setSuccess(`Faculty joining recorded successfully! Form T.R.I generated.`);
        setFacultyActions((prev) => ({ ...prev, [resolvedFacultyId]: json.data }));
        setShowJoiningModal(false);
        setJoiningNewForm(blankJoiningNewForm);
        fetchAll();

        // Open Form T.R.I Printable Report
        setTriReportData({
          facultyName: `MR. ${facultyDisplayName.toUpperCase()}`,
          designation: joiningForm.designation,
          bpsScale: joiningForm.bpsScale,
          subject: joiningForm.subject,
          collegeName: collegeDisplayName,
          notificationNo: joiningForm.notificationNo,
          notificationDate: joiningForm.notificationDate,
          joiningDate: joiningForm.effectiveDate,
          timeOfDay: joiningForm.timeOfDay,
          station: joiningForm.station,
          cashNo: joiningForm.memoNo,
          opiumDated: joiningForm.opiumDated,
        });
        setShowTriPrintModal(true);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Failed to record joining.");
      }
    } catch {
      alert("Failed to submit joining record.");
    }
    setSaving(false);
  };

  // Submit Relieved Action & Issue Form T.R.1
  const handleSubmitRelieved = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relievedForm.facultyId) {
      alert("Please select a faculty member");
      return;
    }
    setSaving(true);
    const sel = facultyList.find((f) => f.id === relievedForm.facultyId) || targetFaculty;

    try {
      const res = await fetch("/api/faculty/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...relievedForm,
          actionType: "RELIEVED",
          collegeName: collegeDisplayName,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setSuccess(`Faculty relieved status recorded successfully! Relieving Certificate generated.`);
        setFacultyActions((prev) => ({ ...prev, [relievedForm.facultyId]: json.data }));
        setShowRelievedModal(false);
        fetchAll();

        // Open Form T.R.1 Printable Report
        setRelievingReportData({
          facultyName: sel?.user?.name ? `MR. ${sel.user.name.toUpperCase()}` : "MR. ABDUL AHAD",
          designation: relievedForm.designation,
          bpsScale: relievedForm.bpsScale,
          subject: relievedForm.subject,
          collegeName: collegeDisplayName,
          collegeAddress: "Sariab Road, Quetta.",
          notificationNo: relievedForm.notificationNo,
          notificationDate: relievedForm.notificationDate,
          relievingDate: relievedForm.effectiveDate,
          timeOfDay: relievedForm.timeOfDay,
          station: relievedForm.station,
          memoNo: relievedForm.memoNo,
        });
        setShowRelievingPrintModal(true);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Failed to record relieving status.");
      }
    } catch {
      alert("Failed to submit relieving record.");
    }
    setSaving(false);
  };

  // Instant Report Viewers for row buttons
  const openTriForFaculty = (f: FacultyRecord) => {
    const act = facultyActions[f.id];
    setTriReportData({
      facultyName: `MR. ${(f.user?.name || "").toUpperCase()}`,
      designation: act?.joiningDesignation || f.designation || "Lecturer",
      bpsScale: act?.joiningBpsScale || (f.designation?.includes("Associate") ? "B-19" : f.designation?.includes("Assistant") ? "B-18" : f.designation?.includes("Professor") ? "B-20" : "B-17"),
      subject: act?.joiningSubject || f.department?.name || "Psychology",
      collegeName: collegeDisplayName,
      notificationNo: act?.joiningNotificationNo || "SOC- 1/1-1(5)2008/1796-1807",
      notificationDate: act?.joiningNotificationDate || "07/Sep:/2020",
      joiningDate: act?.joiningDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      timeOfDay: act?.joiningTimeOfDay || "before noon",
      station: act?.joiningStation || "Quetta",
      cashNo: act?.joiningMemoNo || `1042/${collegeShortCode || "GCQ"}`,
      opiumDated: act?.joiningOpiumDated || new Date().getFullYear().toString(),
    });
    setShowTriPrintModal(true);
  };

  const openRelievingForFaculty = (f: FacultyRecord) => {
    const act = facultyActions[f.id];
    setRelievingReportData({
      facultyName: `MR. ${(f.user?.name || "").toUpperCase()}`,
      designation: act?.relievedDesignation || f.designation || "Associate Professor",
      bpsScale: act?.relievedBpsScale || (f.designation?.includes("Associate") ? "B-19" : f.designation?.includes("Assistant") ? "B-18" : f.designation?.includes("Professor") ? "B-20" : "B-17"),
      subject: act?.relievedSubject || f.department?.name || "Mathematics",
      collegeName: collegeDisplayName,
      collegeAddress: "Sariab Road, Quetta.",
      notificationNo: act?.relievedNotificationNo || "SOC. 11/1-1 (5) /2008/Edn::/2012-17/",
      notificationDate: act?.relievedNotificationDate || "21/September /2020",
      relievingDate: act?.relievedDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
      timeOfDay: act?.relievedTimeOfDay || "before noon",
      station: act?.relievedStation || "Quetta",
      memoNo: act?.relievedMemoNo || "1042",
    });
    setShowRelievingPrintModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Print isolation style for clean 1:1 Word file printing */}
      {(showTriPrintModal || showRelievingPrintModal) && (
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #tri-print-container, #tri-print-container *,
            #relieving-print-container, #relieving-print-container * {
              visibility: visible !important;
            }
            #tri-print-container, #relieving-print-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              padding: 28px !important;
              margin: 0 !important;
              color: #000 !important;
              font-family: "Times New Roman", Times, Georgia, serif !important;
            }
          }
        `}</style>
      )}

      {/* Top Banner Card matching user's Screenshot 1 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl shadow-sm border border-emerald-100 flex-shrink-0">
            🎓
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>Faculty Members</span>
            </h1>
            <p className="text-gray-500 mt-0.5 text-sm font-medium">
              Official faculty roster, additional charges, leave tracking, joining, and relieving history.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Faculty Joining Button */}
          <button
            onClick={() => handleOpenJoiningModal()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            title="Issue Faculty Joining & Form T.R.I (Transfer of Charge)"
          >
            <span>👤+</span>
            <span>Faculty Joining</span>
          </button>

          {/* Faculty Relieved Button */}
          <button
            onClick={() => handleOpenRelievedModal()}
            className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-sm font-black transition-all shadow-md shadow-teal-900/20 flex items-center gap-2 cursor-pointer"
            title="Issue Faculty Relieved & Form T.R.1 Relieving Certificate"
          >
            <span>🚪</span>
            <span>Faculty Relieved</span>
          </button>

          {/* Export CSV */}
          <button onClick={handleExportCSV} className={BTN_SECONDARY} title="Export faculty list to CSV">
            <span>⬆️</span>
            <span>Export CSV</span>
          </button>

          {/* Print List */}
          <button onClick={() => window.print()} className={BTN_SECONDARY} title="Print faculty roster list">
            <span>🖨️</span>
            <span>Print List</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-bold border border-red-200">{error}</div>}
      {success && <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm font-bold border border-emerald-200">{success}</div>}

      {/* Faculty Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setStatusTab("ACTIVE")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            statusTab === "ACTIVE"
              ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/20"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/70"
          }`}
        >
          <span>✅ Active Faculty</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusTab === "ACTIVE" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"}`}>
            {facultyList.filter((f) => facultyActions[f.id]?.currentStatus !== "RELIEVED" && f.isActive).length}
          </span>
        </button>

        <button
          onClick={() => setStatusTab("INACTIVE")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            statusTab === "INACTIVE"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/70"
          }`}
        >
          <span>🟡 On Leave / Inactive</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusTab === "INACTIVE" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"}`}>
            {facultyList.filter((f) => facultyActions[f.id]?.currentStatus !== "RELIEVED" && !f.isActive).length}
          </span>
        </button>

        <button
          onClick={() => setStatusTab("RELIEVED")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            statusTab === "RELIEVED"
              ? "bg-teal-800 text-white shadow-md shadow-teal-800/20"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/70"
          }`}
        >
          <span>🚪 Relieved / Transfer History</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusTab === "RELIEVED" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"}`}>
            {facultyList.filter((f) => facultyActions[f.id]?.currentStatus === "RELIEVED").length}
          </span>
        </button>

        <button
          onClick={() => setStatusTab("ALL")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            statusTab === "ALL"
              ? "bg-gray-800 text-white shadow-md"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/70"
          }`}
        >
          <span>📋 All Roster</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusTab === "ALL" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"}`}>
            {facultyList.length}
          </span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          {/* Search Input */}
          <div className="md:col-span-6">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>🔍</span>
              <span>Search Faculty</span>
            </label>
            <input
              type="text"
              className={INPUT_STYLE}
              placeholder="Search by name, father name, designation, qualification, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <div className="md:col-span-3">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className={INPUT_STYLE}
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Designation Filter */}
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              Designation
            </label>
            <select
              value={filterDesignation}
              onChange={(e) => setFilterDesignation(e.target.value)}
              className={INPUT_STYLE}
            >
              <option value="ALL">All Designations</option>
              <option value="Professor">Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Visiting Faculty">Visiting Faculty</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="md:col-span-1">
            <button
              onClick={() => {}}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>🔍</span>
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 font-bold">⏳ Loading faculty records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-emerald-800 text-white">
                <tr>
                  <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-center w-12">#</th>
                  <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Faculty Info</th>
                  <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Designation & Qualification</th>
                  <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-center">Joining Status</th>
                  <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredFaculty.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-3xl mb-2">🚫</div>
                      <p className="font-semibold text-gray-700">No faculty members found matching criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredFaculty.map((f, i) => {
                    const action = facultyActions[f.id];
                    const isRelieved = action?.currentStatus === "RELIEVED";
                    const isJoined = action?.currentStatus === "JOINED";

                    return (
                      <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-4 text-center font-bold text-gray-400">{i + 1}</td>

                        {/* Faculty Info */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {f.photo ? (
                              <img
                                src={f.photo}
                                alt={f.user?.name || "Faculty"}
                                className="w-12 h-12 rounded-xl object-cover border border-emerald-200 shadow-sm flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                                {f.user?.name ? f.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "FC"}
                              </div>
                            )}
                            <div>
                              <div className="font-black text-gray-900 text-sm">{f.user?.name}</div>
                              <div className="text-xs text-gray-500 font-medium">S/O: {f.fatherName || "N/A"}</div>
                              <div className="text-[11px] text-gray-400">{f.user?.email}</div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 mt-0.5">
                                {f.personalNo && <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">P#: {f.personalNo}</span>}
                                {f.cnic && <span className="text-gray-500">CNIC: {f.cnic}</span>}
                                {f.contactNumber && <span>📞 {f.contactNumber}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Designation & Qualification */}
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-0.5 text-xs font-black rounded-md bg-blue-50 text-blue-700 border border-blue-200 inline-block mb-1">
                            {f.designation || "Lecturer"}
                          </span>
                          {f.additionalCharge && (
                            <div className="mb-1">
                              <span className="px-2 py-0.5 text-[11px] font-black rounded-md bg-amber-100 text-amber-950 border border-amber-300 inline-flex items-center gap-1 shadow-xs" title={`Special Additional Charge: ${f.additionalCharge}`}>
                                <span>⚡</span>
                                <span>Addl: {f.additionalCharge}</span>
                              </span>
                            </div>
                          )}
                          <div className="text-xs font-semibold text-gray-700">{f.qualification || "M.Phil"}</div>
                          <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            f.educationLevel === "INTERMEDIATE" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                            f.educationLevel === "BOTH" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                            "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}>
                            {f.educationLevel === "INTERMEDIATE" ? "🏫 Inter Faculty" : f.educationLevel === "BOTH" ? "🎓 Both (BS & Inter)" : "🎓 BS Faculty"}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-4 font-bold text-gray-800 text-xs">
                          {f.department?.name || <span className="text-gray-400 italic">Unassigned</span>}
                        </td>

                        {/* Joining Status */}
                        <td className="px-4 py-4 text-center">
                          {isRelieved ? (
                            <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black inline-flex items-center gap-1.5 shadow-sm">
                              <span>📅</span>
                              <span>Relieved ({action?.relievedDate || "N/A"})</span>
                            </span>
                          ) : isJoined ? (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black inline-flex items-center gap-1.5 shadow-sm">
                              <span>📅</span>
                              <span>Joined ({action?.joiningDate || "On Duty"})</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1.5">
                              <span>📅</span>
                              <span>Active on Duty</span>
                            </span>
                          )}
                        </td>

                        {/* Status (Click to grant Leave or Resume Duty) */}
                        <td className="px-4 py-4 text-center">
                          {isRelieved ? (
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200 inline-block">
                              🚪 Relieved
                            </span>
                          ) : f.isActive ? (
                            <button
                              onClick={() => openLeaveModal(f)}
                              className="px-3 py-1 text-xs font-black rounded-full border bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 cursor-pointer shadow-xs transition-all"
                              title="Click to record leave / mark inactive"
                            >
                              ✅ Active
                            </button>
                          ) : (
                            <button
                              onClick={() => openRejoinModal(f)}
                              className="px-3 py-1 text-xs font-black rounded-full border bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1 mx-auto"
                              title="Click to view leave dossier & resume duty"
                            >
                              <span>🟡</span>
                              <span>{getLeaveLabel(f.leaveDossier?.leaveType)}</span>
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* View Profile */}
                            <button
                              onClick={() => setViewingFaculty(f)}
                              className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm cursor-pointer border border-emerald-200"
                              title="View Official Faculty Dossier"
                            >
                              👁️
                            </button>

                            {/* Edit Details & Additional Charge */}
                            <button
                              onClick={() => setEditingFaculty(f)}
                              className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center shadow-sm cursor-pointer border border-blue-200"
                              title="Edit Details & Additional Charge"
                            >
                              ✏️
                            </button>

                            {/* Relieving Certificate quick viewer if in history */}
                            {isRelieved && (
                              <button
                                onClick={() => openRelievingForFaculty(f)}
                                className="px-2 py-1 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-[11px] font-black shadow-sm flex items-center gap-1 cursor-pointer"
                                title="View / Print Form T.R.1 Relieving Certificate"
                              >
                                <span>📄</span>
                                <span>Relieving Certificate</span>
                              </button>
                            )}
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
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 1: ISSUE FACULTY JOINING (Form T.R.I - Transfer of Charge)
      ────────────────────────────────────────────────────────────────────────────── */}
      {showJoiningModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl space-y-5 border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <span>🏛️</span>
                  <span>Issue Faculty Joining (Form T.R.I)</span>
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Certificate of the Transfer of Charge (See Rule 44) official Government report generator
                </p>
              </div>
              <button onClick={() => setShowJoiningModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer">✕</button>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setJoiningMode("EXISTING")}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  joiningMode === "EXISTING" ? "bg-white text-emerald-800 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>🏢 Transferred / Existing Faculty</span>
              </button>
              <button
                type="button"
                onClick={() => setJoiningMode("NEW")}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  joiningMode === "NEW" ? "bg-white text-emerald-800 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>👤+ Register Incoming Faculty Member</span>
              </button>
            </div>

            <form onSubmit={handleSubmitJoining} className="space-y-4">
              {joiningMode === "EXISTING" ? (
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Select Faculty Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={joiningForm.facultyId}
                    onChange={(e) => {
                      const sel = facultyList.find((f) => f.id === e.target.value);
                      setTargetFaculty(sel || null);
                      setJoiningForm((prev) => ({
                        ...prev,
                        facultyId: e.target.value,
                        designation: sel?.designation || prev.designation,
                        subject: sel?.department?.name || prev.subject,
                      }));
                    }}
                    className={INPUT_STYLE}
                  >
                    <option value="">-- Choose Faculty Member --</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.user?.name} ({f.designation || "Lecturer"} - {f.department?.name || "BS"})
                      </option>
                    ))}
                  </select>
                  {targetFaculty && (
                    <div className="mt-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs flex flex-wrap gap-x-4 gap-y-1 text-emerald-950 font-medium">
                      {targetFaculty.personalNo && <span><strong>SAP P#:</strong> {targetFaculty.personalNo}</span>}
                      {targetFaculty.cnic && <span><strong>CNIC:</strong> {targetFaculty.cnic}</span>}
                      {targetFaculty.firstAppointmentDate && <span><strong>1st Appt Date:</strong> {targetFaculty.firstAppointmentDate}</span>}
                      {targetFaculty.previousCollege && <span><strong>Prev Station:</strong> {targetFaculty.previousCollege}</span>}
                      {targetFaculty.district && <span><strong>District:</strong> {targetFaculty.district}</span>}
                      {targetFaculty.additionalCharge && <span><strong>Addl Charge:</strong> {targetFaculty.additionalCharge}</span>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3.5 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
                  <div className="text-xs font-black text-emerald-900 uppercase tracking-wide border-b pb-1">
                    Incoming Faculty Dossier Details
                  </div>

                  {/* Photo Upload */}
                  <div className="flex items-center gap-3">
                    {joiningNewForm.photo ? (
                      <img src={joiningNewForm.photo} alt="Incoming" className="w-14 h-14 rounded-xl object-cover border border-emerald-500 shadow-xs" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-bold border">No Photo</div>
                    )}
                    <div>
                      <label className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 shadow-xs">
                        <span>📁 Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(file, (b64) => setJoiningNewForm({ ...joiningNewForm, photo: b64 }));
                          }}
                        />
                      </label>
                      {joiningNewForm.photo && (
                        <button type="button" onClick={() => setJoiningNewForm({ ...joiningNewForm, photo: "" })} className="text-xs text-red-600 font-bold ml-2">Remove</button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name *</label>
                      <input
                        required
                        type="text"
                        className={INPUT_STYLE}
                        placeholder="Prof. Dr. Javed Ahmed Baloch"
                        value={joiningNewForm.name}
                        onChange={(e) => setJoiningNewForm({ ...joiningNewForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Father Name *</label>
                      <input
                        required
                        type="text"
                        className={INPUT_STYLE}
                        placeholder="Father Name"
                        value={joiningNewForm.fatherName}
                        onChange={(e) => setJoiningNewForm({ ...joiningNewForm, fatherName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Personal No. (SAP / Civil Service ID)</label>
                      <input
                        type="text"
                        className={INPUT_STYLE}
                        placeholder="e.g. 10845231"
                        value={joiningNewForm.personalNo}
                        onChange={(e) => setJoiningNewForm({ ...joiningNewForm, personalNo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">CNIC Number</label>
                      <input
                        type="text"
                        className={INPUT_STYLE}
                        placeholder="e.g. 54400-1234567-1"
                        value={joiningNewForm.cnic}
                        onChange={(e) => setJoiningNewForm({ ...joiningNewForm, cnic: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Department *</label>
                      <select
                        required
                        className={INPUT_STYLE}
                        value={joiningNewForm.departmentId}
                        onChange={(e) => {
                          const d = departments.find((x) => x.id === e.target.value);
                          setJoiningNewForm({ ...joiningNewForm, departmentId: e.target.value });
                          if (d) setJoiningForm((prev) => ({ ...prev, subject: d.name }));
                        }}
                      >
                        <option value="">-- Select Department --</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Qualification</label>
                      <input
                        type="text"
                        className={INPUT_STYLE}
                        placeholder="Ph.D. / M.Phil"
                        value={joiningNewForm.qualification}
                        onChange={(e) => setJoiningNewForm({ ...joiningNewForm, qualification: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Previous College / Station</label>
                      <input
                        type="text"
                        className={INPUT_STYLE}
                        placeholder="e.g. Govt Degree College Sariab Road"
                        value={joiningNewForm.previousCollege}
                        onChange={(e) => setJoiningNewForm({ ...joiningNewForm, previousCollege: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Division</label>
                      <select
                        className={INPUT_STYLE}
                        value={joiningNewForm.division}
                        onChange={(e) => setJoiningNewForm({ ...joiningNewForm, division: e.target.value })}
                      >
                        <option value="Quetta">Quetta Division</option>
                        <option value="Kalat">Kalat Division</option>
                        <option value="Makran">Makran Division</option>
                        <option value="Nasirabad">Nasirabad Division</option>
                        <option value="Sibi">Sibi Division</option>
                        <option value="Zhob">Zhob Division</option>
                        <option value="Rakhshan">Rakhshan Division</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">District</label>
                      <input
                        type="text"
                        list="districts-list"
                        className={INPUT_STYLE}
                        placeholder="e.g. Quetta / Pishin"
                        value={joiningNewForm.district}
                        onChange={(e) => setJoiningNewForm({ ...joiningNewForm, district: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-900 uppercase mb-1 flex items-center gap-1">
                      <span>⚡</span>
                      <span>Additional Charge (Optional / اضافی چارج)</span>
                    </label>
                    <input
                      type="text"
                      list="additional-charges-list"
                      className={INPUT_STYLE}
                      placeholder="e.g. Vice Principal, Controller Examinations, Incharge Principal"
                      value={joiningNewForm.additionalCharge}
                      onChange={(e) => setJoiningNewForm({ ...joiningNewForm, additionalCharge: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Notification Reference No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={joiningForm.notificationNo}
                    onChange={(e) => setJoiningForm({ ...joiningForm, notificationNo: e.target.value })}
                    placeholder="e.g. SOC- 1/1-1(5)2008/1796-1807"
                    className={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Notification Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={joiningForm.notificationDate}
                    onChange={(e) => setJoiningForm({ ...joiningForm, notificationDate: e.target.value })}
                    placeholder="e.g. 07/Sep:/2020"
                    className={INPUT_STYLE}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Assumed Charge Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={joiningForm.effectiveDate}
                    onChange={(e) => setJoiningForm({ ...joiningForm, effectiveDate: e.target.value })}
                    placeholder="e.g. 22/Sep /2020"
                    className={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Time of Day
                  </label>
                  <select
                    value={joiningForm.timeOfDay}
                    onChange={(e) => setJoiningForm({ ...joiningForm, timeOfDay: e.target.value })}
                    className={INPUT_STYLE}
                  >
                    <option value="before noon">before noon</option>
                    <option value="afternoon">afternoon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Pay Scale (BPS) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={joiningForm.bpsScale}
                    onChange={(e) => setJoiningForm({ ...joiningForm, bpsScale: e.target.value })}
                    className={INPUT_STYLE}
                  >
                    <option value="B-17">B-17 (Lecturer)</option>
                    <option value="B-18">B-18 (Assistant Professor)</option>
                    <option value="B-19">B-19 (Associate Professor)</option>
                    <option value="B-20">B-20 (Professor)</option>
                    <option value="B-21">B-21</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={joiningForm.designation}
                    onChange={(e) => setJoiningForm({ ...joiningForm, designation: e.target.value })}
                    placeholder="Lecturer / Assistant Professor"
                    className={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Subject / Discipline
                  </label>
                  <input
                    type="text"
                    value={joiningForm.subject}
                    onChange={(e) => setJoiningForm({ ...joiningForm, subject: e.target.value })}
                    placeholder="Psychology / Mathematics"
                    className={INPUT_STYLE}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Station
                  </label>
                  <input
                    type="text"
                    value={joiningForm.station}
                    onChange={(e) => setJoiningForm({ ...joiningForm, station: e.target.value })}
                    placeholder="Quetta"
                    className={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Cash Ref Memo No
                  </label>
                  <input
                    type="text"
                    value={joiningForm.memoNo}
                    onChange={(e) => setJoiningForm({ ...joiningForm, memoNo: e.target.value })}
                    placeholder="1042/GCQ"
                    className={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Treasury Opium Year
                  </label>
                  <input
                    type="text"
                    value={joiningForm.opiumDated}
                    onChange={(e) => setJoiningForm({ ...joiningForm, opiumDated: e.target.value })}
                    placeholder="2020"
                    className={INPUT_STYLE}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="submit" disabled={saving} className={`flex-1 ${BTN_PRIMARY} justify-center`}>
                  <span>📜</span>
                  <span>{saving ? "Processing..." : "Confirm Joining & Generate Form T.R.I"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoiningModal(false)}
                  className={`flex-1 ${BTN_SECONDARY} justify-center`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 2: ISSUE FACULTY RELIEVED (Form T.R.1 - Relieving Certificate)
      ────────────────────────────────────────────────────────────────────────────── */}
      {showRelievedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl space-y-5 border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <span>🏛️</span>
                  <span>Issue Faculty Relieving Certificate (Form T.R.1)</span>
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Official Government of Balochistan Relieving Certificate generator
                </p>
              </div>
              <button onClick={() => setShowRelievedModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmitRelieved} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                  Select Faculty Member to Relieve <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={relievedForm.facultyId}
                  onChange={(e) => {
                    const sel = facultyList.find((f) => f.id === e.target.value);
                    setTargetFaculty(sel || null);
                    setRelievedForm((prev) => ({
                      ...prev,
                      facultyId: e.target.value,
                      designation: sel?.designation || prev.designation,
                      subject: sel?.department?.name || prev.subject,
                    }));
                  }}
                  className={INPUT_STYLE}
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.user?.name} ({f.designation || "Associate Professor"} - {f.department?.name || "Mathematics"})
                    </option>
                  ))}
                </select>
                {targetFaculty && (
                  <div className="mt-2 p-2.5 bg-teal-50/80 border border-teal-200 rounded-xl text-xs flex flex-wrap gap-x-4 gap-y-1 text-teal-950 font-medium">
                    {targetFaculty.personalNo && <span><strong>SAP P#:</strong> {targetFaculty.personalNo}</span>}
                    {targetFaculty.cnic && <span><strong>CNIC:</strong> {targetFaculty.cnic}</span>}
                    {targetFaculty.firstAppointmentDate && <span><strong>1st Appt Date:</strong> {targetFaculty.firstAppointmentDate}</span>}
                    {targetFaculty.previousCollege && <span><strong>Current Station:</strong> {targetFaculty.previousCollege}</span>}
                    {targetFaculty.district && <span><strong>District:</strong> {targetFaculty.district}</span>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Compliance Notification No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={relievedForm.notificationNo}
                    onChange={(e) => setRelievedForm({ ...relievedForm, notificationNo: e.target.value })}
                    placeholder="e.g. SOC. 11/1-1 (5) /2008/Edn::/2012-17/"
                    className={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Notification Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={relievedForm.notificationDate}
                    onChange={(e) => setRelievedForm({ ...relievedForm, notificationDate: e.target.value })}
                    placeholder="e.g. 21/September /2020"
                    className={INPUT_STYLE}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Relieving Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={relievedForm.effectiveDate}
                    onChange={(e) => setRelievedForm({ ...relievedForm, effectiveDate: e.target.value })}
                    placeholder="e.g. 22/09/2020"
                    className={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Time of Day
                  </label>
                  <select
                    value={relievedForm.timeOfDay}
                    onChange={(e) => setRelievedForm({ ...relievedForm, timeOfDay: e.target.value })}
                    className={INPUT_STYLE}
                  >
                    <option value="before noon">before noon</option>
                    <option value="afternoon">afternoon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Pay Scale (BPS) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={relievedForm.bpsScale}
                    onChange={(e) => setRelievedForm({ ...relievedForm, bpsScale: e.target.value })}
                    className={INPUT_STYLE}
                  >
                    <option value="B-19">B-19 (Associate Professor)</option>
                    <option value="B-18">B-18 (Assistant Professor)</option>
                    <option value="B-17">B-17 (Lecturer)</option>
                    <option value="B-20">B-20 (Professor)</option>
                    <option value="B-21">B-21</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={relievedForm.designation}
                    onChange={(e) => setRelievedForm({ ...relievedForm, designation: e.target.value })}
                    placeholder="Associate Professor"
                    className={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Subject / Discipline
                  </label>
                  <input
                    type="text"
                    value={relievedForm.subject}
                    onChange={(e) => setRelievedForm({ ...relievedForm, subject: e.target.value })}
                    placeholder="Mathematics"
                    className={INPUT_STYLE}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Establishment Dispatch Memo Ref (NO. Esst:)
                  </label>
                  <input
                    type="text"
                    value={relievedForm.memoNo}
                    onChange={(e) => setRelievedForm({ ...relievedForm, memoNo: e.target.value })}
                    placeholder="1042"
                    className={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-600 uppercase mb-1">
                    Station
                  </label>
                  <input
                    type="text"
                    value={relievedForm.station}
                    onChange={(e) => setRelievedForm({ ...relievedForm, station: e.target.value })}
                    placeholder="Quetta"
                    className={INPUT_STYLE}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-teal-800 hover:bg-teal-900 text-white font-black rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
                  <span>📄</span>
                  <span>{saving ? "Processing..." : "Confirm Relieved & Generate Relieving Certificate"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRelievedModal(false)}
                  className={`flex-1 ${BTN_SECONDARY} justify-center`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          PRINTABLE MODAL 1: FORM T.R.I (Transfer of Charge / Joining Certificate)
          Exact 1:1 replica of the Word Document in Image 2
      ────────────────────────────────────────────────────────────────────────────── */}
      {showTriPrintModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Controls Bar (Always hidden during print) */}
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <div>
                  <h3 className="text-sm font-black tracking-wide">
                    FORM T.R.I (See Rule 44) — Certificate of Transfer of Charge
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Official Government of Balochistan Word Document Layout
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Print Document (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTriPrintModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Document Sheet (Printable A4 Target) */}
            <div className="p-6 sm:p-12 overflow-y-auto flex-1 bg-gray-50/50 print:bg-white print:p-0">
              <div
                id="tri-print-container"
                className="max-w-[800px] mx-auto bg-white p-8 sm:p-12 shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0 text-black leading-relaxed"
                style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
              >
                {/* Header Titles */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold tracking-wider">FORM T.R.I</h2>
                  <h3 className="text-base font-semibold italic mt-0.5">(See Rule 44)</h3>
                  <h1 className="text-lg font-bold tracking-wide mt-3 uppercase border-b-2 border-black inline-block pb-0.5">
                    CERTIFICATE OF THE TRANSFER OF CHARGE
                  </h1>
                </div>

                {/* Paragraph 1: Main Joining / Charge Assumption Statement */}
                <div className="text-justify text-base leading-relaxed mb-8 indent-8">
                  With reference to Secretary Colleges, Higher & Technical Education, Quetta Vide Notification No. <strong>{triReportData.notificationNo}</strong>/Dated.<strong>{triReportData.notificationDate}</strong>. I, <strong>{triReportData.facultyName}</strong> as <strong>{triReportData.designation}</strong> of <strong>({triReportData.subject})</strong> (<strong>{triReportData.bpsScale}</strong>) and Posted at <strong>{triReportData.collegeName}</strong> . I assumed the Charge today on dated <strong>{triReportData.joiningDate}</strong> {triReportData.timeOfDay}.
                </div>

                {/* Officer Signature & Designation Block (Right Aligned) */}
                <div className="flex justify-end mb-8">
                  <div className="text-center min-w-[280px]">
                    <div className="h-10"></div>
                    <div className="font-bold text-base tracking-wide">{triReportData.facultyName}</div>
                    <div className="text-sm font-semibold">{triReportData.designation} in ({triReportData.subject})</div>
                    <div className="text-xs font-bold uppercase tracking-wide">{triReportData.collegeName}</div>
                  </div>
                </div>

                {/* Station & Dated Section */}
                <div className="mb-4 text-sm">
                  <div className="flex gap-4">
                    <span className="font-semibold w-20">Station</span>
                    <span className="font-bold">{triReportData.station}.</span>
                  </div>
                  <div className="flex gap-4 mt-1">
                    <span className="font-semibold w-20">Dated;-</span>
                    <span>_________________</span>
                  </div>
                  <p className="indent-8 text-sm mt-2 text-justify">
                    Memo of the balance for which responsibility is accepted by the Officer Receiving charge.
                  </p>
                </div>

                {/* Permanent Advance Section */}
                <div className="text-center my-3">
                  <div className="inline-block px-3 py-0.5 bg-yellow-200 font-bold text-sm">Permanent Advance</div>
                  <div className="text-sm font-semibold mt-1">Treasury balance:-</div>
                </div>

                <div className="flex justify-between items-center text-sm font-medium mb-2 px-4">
                  <div className="space-y-1">
                    <div>Cash &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; No___________/{collegeShortCode || "GCQ"}.</div>
                    <div>Opium &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Dated________{triReportData.opiumDated}.</div>
                  </div>
                  <div>Stamp and Match Excise Banderoles.</div>
                </div>

                {/* Official Treasury Breakdown Table (Image 2 Replica) */}
                <div className="border-2 border-black mb-4">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-black text-center font-bold">
                        <th className="border-r border-black p-2 w-[22%]">Description</th>
                        <th className="border-r border-black p-2 w-[28%]">Under Double locks</th>
                        <th className="border-r border-black p-2 w-[35%]">With treasuries</th>
                        <th className="border-r border-black p-2 w-[15%]">In-Sun- Treasuries</th>
                        <th className="p-2 w-[10%]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="align-top">
                        {/* Description Column */}
                        <td className="border-r border-black p-2 font-bold leading-relaxed">
                          <div>Notes</div>
                          <div className="h-28"></div>
                          <div className="mt-4">Silver</div>
                        </td>

                        {/* Under Double Locks Column */}
                        <td className="border-r border-black p-2 text-left leading-relaxed">
                          <div>At Rs.10000</div>
                          <div>;; &nbsp;&nbsp;&nbsp; 1000</div>
                          <div>;; &nbsp;&nbsp;&nbsp;&nbsp; 500</div>
                          <div>;; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 50</div>
                          <div>;; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 10</div>
                          <div>;; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 5</div>
                          <div>;; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 1</div>
                          <div className="mt-1 font-medium">Whole Rupees</div>
                          <div className="font-medium">Half Quarter</div>
                          <div className="font-medium">Eight In current coins.</div>
                        </td>

                        {/* With Treasuries (Dispatch Copies list embedded in table as per official form) */}
                        <td colSpan={2} className="border-r border-black p-2.5 text-left text-[11px] leading-relaxed">
                          <ol className="space-y-2 font-bold list-decimal list-inside uppercase">
                            <li>P.S TO SECRETARY, COLLEGES HIGHER & TECHNICAL EDUCATION BALOCHISTAN, QUETTA.</li>
                            <li>DIRECTOR, OF COLLEGES & HIGHER EDUCATION BALOCHISTAN, QUETTA.</li>
                            <li>ACCOUNTANT GENERAL, BALOCHISTAN, QUETTA.</li>
                            <li>CONCERNED OFFICER.</li>
                            <li>MASTER FILE</li>
                          </ol>
                        </td>

                        {/* Total Column */}
                        <td className="p-2 text-center"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footnote */}
                <p className="text-[10px] text-justify leading-normal italic text-gray-700 mb-8">
                  *the total of the case balance reported in the tests daily sheets received from Sub-treasuries without any details notes or connect need only be shown in this column.
                </p>

                {/* Principal Signature Block */}
                <div className="flex justify-end pt-4">
                  <div className="text-center min-w-[240px]">
                    <div className="h-10"></div>
                    <div className="font-bold text-sm tracking-wide">Principal,</div>
                    <div className="text-sm font-semibold">{triReportData.collegeName}</div>
                    <div className="text-sm font-semibold">{triReportData.station}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          PRINTABLE MODAL 2: FORM T.R.1 (Relieving Certificate)
          Exact 1:1 replica of the Word Document in Image 3
      ────────────────────────────────────────────────────────────────────────────── */}
      {showRelievingPrintModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Controls Bar (Always hidden during print) */}
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <div>
                  <h3 className="text-sm font-black tracking-wide">
                    Form T.R.1 — Relieving Certificate
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Official Government of Balochistan Word Document Layout
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Print Certificate (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRelievingPrintModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Document Sheet (Printable A4 Target) */}
            <div className="p-6 sm:p-12 overflow-y-auto flex-1 bg-gray-50/50 print:bg-white print:p-0">
              <div
                id="relieving-print-container"
                className="max-w-[800px] mx-auto bg-white p-8 sm:p-14 shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0 text-black leading-relaxed"
                style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
              >
                {/* Header Titles */}
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold tracking-wider">Form T.R.1</h2>
                  <h1 className="text-lg font-bold tracking-wide mt-3 uppercase border-b-2 border-black inline-block pb-0.5">
                    RELIEVING CERTIFICATE.
                  </h1>
                </div>

                {/* Paragraph: Relieving Compliance Statement */}
                <div className="text-justify text-base leading-relaxed mb-8 indent-8">
                  In Compliance of the Secretary, Govt: of Baluchistan Quetta Vide. Notification No. <strong>{relievingReportData.notificationNo}</strong> Dated: <strong>{relievingReportData.notificationDate}</strong>, <strong>{relievingReportData.facultyName}</strong> {relievingReportData.designation} (<strong>{relievingReportData.bpsScale}</strong>) ({relievingReportData.subject}) in <strong>{relievingReportData.collegeName}</strong>, {relievingReportData.collegeAddress} is hereby relieved from this College today on, <strong>{relievingReportData.relievingDate}</strong> {relievingReportData.timeOfDay}.
                </div>

                {/* Dispatch Reference & Date */}
                <div className="text-sm font-semibold mb-8 space-y-1">
                  <div>NO. Esst: <strong>{relievingReportData.memoNo}</strong> {collegeShortCode || "GCQ"}.</div>
                  <div>Dated {relievingReportData.station}, the _______{new Date().getFullYear()}.</div>
                </div>

                {/* Relieved Officer Block (Centered/Right Aligned) */}
                <div className="flex justify-end mb-12">
                  <div className="text-center min-w-[280px]">
                    <div className="h-10"></div>
                    <div className="font-bold text-base tracking-wide">{relievingReportData.facultyName}</div>
                    <div className="text-sm font-semibold">{relievingReportData.designation} of {relievingReportData.subject}</div>
                    <div className="text-xs font-bold uppercase tracking-wide">{relievingReportData.collegeName}</div>
                    <div className="text-xs">{relievingReportData.collegeAddress}</div>
                  </div>
                </div>

                {/* Copy to Section */}
                <div className="text-sm mb-12">
                  <div className="font-bold mb-2">Copy to:-</div>
                  <ol className="space-y-1.5 font-medium pl-4">
                    <li>1- The P.S to Secretary, of Education Balochistan Quetta.</li>
                    <li>2- The Director, of Colleges , and Higher Education Balochistan Quetta.</li>
                    <li>3- The Accountant General Balochistan Quetta .</li>
                    <li>4- The Principal {relievingReportData.collegeName} {relievingReportData.station}</li>
                    <li>5- The Officer Concerned.</li>
                  </ol>
                </div>

                {/* Principal Signature Block */}
                <div className="flex justify-end pt-6">
                  <div className="text-center min-w-[240px]">
                    <div className="h-12"></div>
                    <div className="font-bold text-sm tracking-wide">Principal,</div>
                    <div className="text-sm font-semibold">{relievingReportData.collegeName},</div>
                    <div className="text-sm font-semibold">{relievingReportData.station}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW FACULTY PROFILE MODAL */}
      {viewingFaculty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl space-y-5 max-h-[92vh] overflow-y-auto border border-gray-100">
            {/* Header with Photo */}
            <div className="flex justify-between items-start border-b pb-4">
              <div className="flex items-center gap-4">
                {viewingFaculty.photo ? (
                  <img
                    src={viewingFaculty.photo}
                    alt={viewingFaculty.user?.name || "Faculty Photo"}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    {viewingFaculty.user?.name ? viewingFaculty.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "FC"}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-black text-gray-900">{viewingFaculty.user?.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {viewingFaculty.designation || "Faculty Member"}
                    </span>
                    {viewingFaculty.personalNo && (
                      <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                        SAP P#: {viewingFaculty.personalNo}
                      </span>
                    )}
                    {viewingFaculty.additionalCharge && (
                      <span className="text-xs font-black text-amber-950 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-xs">
                        <span>⚡</span>
                        <span>Addl: {viewingFaculty.additionalCharge}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingFaculty(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">✕</button>
            </div>

            {/* Leave / Inactivity Alert Banner if currently on leave */}
            {!viewingFaculty.isActive && viewingFaculty.leaveDossier && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs space-y-1.5 shadow-xs">
                <div className="font-black text-amber-950 flex items-center gap-1.5 text-sm">
                  <span>⚠️</span>
                  <span>Currently Inactive on {getLeaveLabel(viewingFaculty.leaveDossier.leaveType)}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-800">
                  <div><strong>Sanction Ref:</strong> {viewingFaculty.leaveDossier.sanctionRef || "N/A"}</div>
                  <div><strong>Duration:</strong> {viewingFaculty.leaveDossier.startDate} to {viewingFaculty.leaveDossier.endDate || "Indefinite"}</div>
                </div>
                {viewingFaculty.leaveDossier.reason && (
                  <div className="text-gray-700"><strong>Notes / Remarks:</strong> {viewingFaculty.leaveDossier.reason}</div>
                )}
                {viewingFaculty.leaveDossier.documentUrl && (
                  <div className="pt-1 border-t border-amber-200/60 mt-1">
                    <a
                      href={viewingFaculty.leaveDossier.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={viewingFaculty.leaveDossier.documentName || "Leave_Document"}
                      className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-bold underline text-xs"
                    >
                      <span>📎</span>
                      <span>Download Attached Sanction Document ({viewingFaculty.leaveDossier.documentName || "Attachment"})</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Section 1: Civil Service & Govt Posting Dossier */}
            <div>
              <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>🏛️</span>
                <span>Government Service & Posting Dossier</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">Personal No. (SAP / Personnel ID)</span>
                  <span className="font-mono font-bold text-emerald-900">{viewingFaculty.personalNo || "Not Recorded"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">First Appointment in Govt Service</span>
                  <span className="font-semibold text-gray-800">{viewingFaculty.firstAppointmentDate || "Not Recorded"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">Previous College / Station</span>
                  <span className="font-semibold text-gray-800">{viewingFaculty.previousCollege || "N/A"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">Division & District</span>
                  <span className="font-semibold text-gray-800">
                    {viewingFaculty.division || "Balochistan"} {viewingFaculty.district ? `(${viewingFaculty.district})` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Personal & Identity Information */}
            <div>
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>👤</span>
                <span>Personal & Identity Information</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">Father Name</span>
                  <span className="font-semibold text-gray-800">{viewingFaculty.fatherName || "N/A"}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">CNIC Number</span>
                  <span className="font-mono font-bold text-gray-900">{viewingFaculty.cnic || "Not Recorded"}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">Contact Number</span>
                  <span className="font-semibold text-gray-800">{viewingFaculty.contactNumber || "N/A"}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">Official Email</span>
                  <span className="font-semibold text-gray-800 text-xs truncate block">{viewingFaculty.user?.email}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Academic Setup */}
            <div>
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>🎓</span>
                <span>Academic & Faculty Placement</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">Department</span>
                  <span className="font-semibold text-gray-800">{viewingFaculty.department?.name || "Unassigned"}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">Qualification</span>
                  <span className="font-semibold text-gray-800">{viewingFaculty.qualification || "N/A"}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">Faculty Type</span>
                  <span className="font-semibold text-gray-800">
                    {viewingFaculty.educationLevel === "INTERMEDIATE" ? "Intermediate" : viewingFaculty.educationLevel === "BOTH" ? "Both (BS & Inter)" : "BS Faculty"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button onClick={() => setViewingFaculty(null)} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT FACULTY MODAL */}
      {editingFaculty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl space-y-5 border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <span>✏️</span>
                  <span>Edit Faculty Profile & Dossier</span>
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Update personal, government service, additional charge, and academic details.
                </p>
              </div>
              <button onClick={() => setEditingFaculty(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              {/* Photo Upload Section */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-4">
                {editingFaculty.photo ? (
                  <img
                    src={editingFaculty.photo}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold border flex-shrink-0">
                    No Photo
                  </div>
                )}
                <div className="flex-1">
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-700 cursor-pointer shadow-sm">
                      <span>📁 Change Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handlePhotoUpload(file, (base64) => {
                              setEditingFaculty({ ...editingFaculty, photo: base64 });
                            });
                          }
                        }}
                      />
                    </label>
                    {editingFaculty.photo && (
                      <button
                        type="button"
                        onClick={() => setEditingFaculty({ ...editingFaculty, photo: null })}
                        className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-800 font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">JPG, PNG, WEBP (Max 2MB)</span>
                </div>
              </div>

              {/* SECTION 1: Personal Details */}
              <div className="space-y-3">
                <div className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                  <span>👤</span>
                  <span>Personal Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name *</label>
                    <input
                      required
                      type="text"
                      className={INPUT_STYLE}
                      value={editingFaculty.user?.name || ""}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, user: { ...editingFaculty.user, name: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Father Name *</label>
                    <input
                      type="text"
                      className={INPUT_STYLE}
                      value={editingFaculty.fatherName || ""}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, fatherName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">CNIC Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 54400-1234567-1"
                      className={INPUT_STYLE}
                      value={editingFaculty.cnic || ""}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, cnic: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Contact Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 0300-1234567"
                      className={INPUT_STYLE}
                      value={editingFaculty.contactNumber || ""}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, contactNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Special Assignment / Additional Charge */}
              <div className="space-y-3">
                <div className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                  <span>⚡</span>
                  <span>Special Designation / Additional Charge (اضافی چارج)</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                    Special Additional Charge / Office
                  </label>
                  <input
                    type="text"
                    list="additional-charges-list"
                    className={INPUT_STYLE}
                    placeholder="e.g. Vice Principal, Controller Examinations, Incharge Principal, Chief Proctor"
                    value={editingFaculty.additionalCharge || ""}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, additionalCharge: e.target.value })}
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    e.g. Prof. Dr. Javed Ahmed Baloch (Professor B-20 Chemistry) with Additional Charge: Vice Principal
                  </span>
                </div>
              </div>

              {/* SECTION 2: Government Service & Posting Dossier */}
              <div className="space-y-3">
                <div className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                  <span>🏛️</span>
                  <span>Government Service & Posting Dossier</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Personal No. (SAP / Civil Service ID)</label>
                    <input
                      type="text"
                      placeholder="e.g. 10845231"
                      className={INPUT_STYLE}
                      value={editingFaculty.personalNo || ""}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, personalNo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">First Appointment Date in Govt Service</label>
                    <input
                      type="date"
                      className={INPUT_STYLE}
                      value={editingFaculty.firstAppointmentDate || ""}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, firstAppointmentDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Previous College / Station</label>
                    <input
                      type="text"
                      placeholder="e.g. Govt Degree College Sariab Road"
                      className={INPUT_STYLE}
                      value={editingFaculty.previousCollege || ""}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, previousCollege: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Division</label>
                    <select
                      className={INPUT_STYLE}
                      value={editingFaculty.division || "Quetta"}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, division: e.target.value })}
                    >
                      <option value="Quetta">Quetta Division</option>
                      <option value="Kalat">Kalat Division</option>
                      <option value="Makran">Makran Division</option>
                      <option value="Nasirabad">Nasirabad Division</option>
                      <option value="Sibi">Sibi Division</option>
                      <option value="Zhob">Zhob Division</option>
                      <option value="Rakhshan">Rakhshan Division</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">District</label>
                    <input
                      type="text"
                      list="districts-list"
                      placeholder="e.g. Quetta / Pishin"
                      className={INPUT_STYLE}
                      value={editingFaculty.district || ""}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, district: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Academic Setup */}
              <div className="space-y-3">
                <div className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                  <span>🎓</span>
                  <span>Academic & Department Setup</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Designation *</label>
                    <select
                      className={INPUT_STYLE}
                      value={editingFaculty.designation || "Lecturer"}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, designation: e.target.value })}
                    >
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Visiting Faculty">Visiting Faculty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Qualification *</label>
                    <input
                      type="text"
                      className={INPUT_STYLE}
                      value={editingFaculty.qualification || ""}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, qualification: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Department *</label>
                    <select
                      className={INPUT_STYLE}
                      value={editingFaculty.departmentId || ""}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, departmentId: e.target.value })}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Faculty Type *</label>
                    <select
                      className={INPUT_STYLE}
                      value={editingFaculty.educationLevel || "BOTH"}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, educationLevel: e.target.value })}
                    >
                      <option value="BS">🎓 BS Faculty</option>
                      <option value="INTERMEDIATE">🏫 Inter Faculty</option>
                      <option value="BOTH">🎓 Both (BS & Inter)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="submit" disabled={saving} className={`flex-1 ${BTN_PRIMARY} justify-center`}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditingFaculty(null)} className={`flex-1 ${BTN_SECONDARY} justify-center`}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: MARK FACULTY INACTIVE / RECORD OFFICIAL LEAVE (Requirement 6)
      ────────────────────────────────────────────────────────────────────────────── */}
      {leaveModalFaculty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-5 border border-amber-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <span>🟡</span>
                  <span>Mark Faculty Inactive / Record Leave</span>
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Recording official leave for <strong>{leaveModalFaculty.user?.name}</strong> ({leaveModalFaculty.designation || "Faculty"})
                </p>
              </div>
              <button onClick={() => setLeaveModalFaculty(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              {/* Leave Type */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Official Leave Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className={INPUT_STYLE}
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                >
                  <option value="STUDY_LEAVE">🎓 Study Leave (Ph.D. / M.Phil / Higher Studies)</option>
                  <option value="HEALTH_LEAVE">🏥 Medical / Health Leave</option>
                  <option value="LEAVE_WITHOUT_PAY">⛔ Leave Without Pay / Salary (EOL - Extra Ordinary Leave)</option>
                  <option value="EX_PAKISTAN_LEAVE">✈️ Ex-Pakistan Leave</option>
                  <option value="MATERNITY_PATERNITY">👶 Maternity / Paternity Leave</option>
                  <option value="DEPUTATION">🏛️ On Deputation / Attached to other Dept</option>
                  <option value="SUSPENSION">⚠️ Under Suspension</option>
                  <option value="OTHER">📋 Other Official Absence / Leave</option>
                </select>
              </div>

              {/* Sanction Ref No */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Sanction / Notification Reference No. <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  className={INPUT_STYLE}
                  placeholder="e.g. SO(HE)4-12/2026/Study-Leave"
                  value={leaveForm.sanctionRef}
                  onChange={(e) => setLeaveForm({ ...leaveForm, sanctionRef: e.target.value })}
                />
              </div>

              {/* Date From & Date To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                    Leave Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    className={INPUT_STYLE}
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    className={INPUT_STYLE}
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Remarks / Reason */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Reason & Institutional Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  className={INPUT_STYLE}
                  placeholder="Specify official reasons, university details for study leave, or medical hospital grounds..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>

              {/* Supporting Document Attachment */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                <label className="block text-xs font-black text-gray-800 uppercase mb-1.5 flex items-center gap-1.5">
                  <span>📎</span>
                  <span>Supporting Document / Sanction Order</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-700 cursor-pointer shadow-xs">
                    <span>Choose File (PDF/Image)</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleDocUpload(file, (base64, name) => {
                            setLeaveForm({ ...leaveForm, documentUrl: base64, documentName: name });
                          });
                        }
                      }}
                    />
                  </label>
                  {leaveForm.documentName && (
                    <span className="text-xs text-emerald-800 font-bold truncate max-w-[220px]">
                      ✓ {leaveForm.documentName}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Official sanction notification copy, medical certificate, or university admission letter (Max 5MB).
                </span>
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="submit" disabled={saving} className={`flex-1 ${BTN_PRIMARY} justify-center bg-amber-600 hover:bg-amber-700`}>
                  {saving ? "Processing..." : "Confirm & Mark Inactive"}
                </button>
                <button type="button" onClick={() => setLeaveModalFaculty(null)} className={`flex-1 ${BTN_SECONDARY} justify-center`}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: RESUME DUTY / END LEAVE
      ────────────────────────────────────────────────────────────────────────────── */}
      {rejoinModalFaculty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-4 border border-emerald-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <span>✅</span>
                  <span>Resume Duty / End Leave</span>
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Reactivate <strong>{rejoinModalFaculty.user?.name}</strong> to active teaching status
                </p>
              </div>
              <button onClick={() => setRejoinModalFaculty(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer">✕</button>
            </div>

            {/* Current Leave Summary */}
            {rejoinModalFaculty.leaveDossier && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                <div className="font-bold text-amber-950">
                  Current Status: {getLeaveLabel(rejoinModalFaculty.leaveDossier.leaveType)}
                </div>
                <div className="text-gray-700">Ref: {rejoinModalFaculty.leaveDossier.sanctionRef || "N/A"}</div>
                <div className="text-gray-600">Since: {rejoinModalFaculty.leaveDossier.startDate}</div>
              </div>
            )}

            <form onSubmit={handleSubmitRejoin} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Resumed Active Duty Date <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  className={INPUT_STYLE}
                  value={rejoinForm.returnDate}
                  onChange={(e) => setRejoinForm({ ...rejoinForm, returnDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Rejoining Remarks / Charge Report Memo
                </label>
                <input
                  type="text"
                  className={INPUT_STYLE}
                  placeholder="e.g. Resumed duty after completion of study leave."
                  value={rejoinForm.remarks}
                  onChange={(e) => setRejoinForm({ ...rejoinForm, remarks: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="submit" disabled={saving} className={`flex-1 ${BTN_PRIMARY} justify-center`}>
                  {saving ? "Processing..." : "Confirm Rejoin & Activate"}
                </button>
                <button type="button" onClick={() => setRejoinModalFaculty(null)} className={`flex-1 ${BTN_SECONDARY} justify-center`}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Datalist for Special Additional Charges */}
      <datalist id="additional-charges-list">
        <option value="Vice Principal" />
        <option value="Incharge Principal" />
        <option value="Director Academics" />
        <option value="Controller of Examinations" />
        <option value="Chief Proctor" />
        <option value="Hostel Warden" />
        <option value="Head of Department (HOD)" />
        <option value="Drawing & Disbursing Officer (DDO)" />
        <option value="Staff Secretary" />
        <option value="Focal Person (HEC / HEMIS)" />
        <option value="Focal Person (BS Admissions)" />
        <option value="Director Physical Education (DPE)" />
      </datalist>

      {/* Datalist for District Auto-suggestions */}
      <datalist id="districts-list">
        <option value="Quetta" />
        <option value="Pishin" />
        <option value="Killa Abdullah" />
        <option value="Chaman" />
        <option value="Killa Saifullah" />
        <option value="Mastung" />
        <option value="Kalat" />
        <option value="Khuzdar" />
        <option value="Loralai" />
        <option value="Zhob" />
        <option value="Sibi" />
        <option value="Kech (Turbat)" />
        <option value="Gwadar" />
        <option value="Hub" />
        <option value="Lasbela" />
        <option value="Jafarabad" />
        <option value="Nasirabad" />
        <option value="Usta Muhammad" />
        <option value="Ziarat" />
        <option value="Nushki" />
        <option value="Chagai" />
      </datalist>
    </div>
  );
}
