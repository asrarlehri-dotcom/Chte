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

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingFaculty, setViewingFaculty] = useState<FacultyRecord | null>(null);
  const [editingFaculty, setEditingFaculty] = useState<FacultyRecord | null>(null);
  const [deletingFaculty, setDeletingFaculty] = useState<FacultyRecord | null>(null);

  // New Modals: Joining & Relieved Action Modals
  const [showJoiningModal, setShowJoiningModal] = useState(false);
  const [showRelievedModal, setShowRelievedModal] = useState(false);
  const [targetFaculty, setTargetFaculty] = useState<FacultyRecord | null>(null);

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
    email: "",
    password: "gpgcq123",
    designation: "Assistant Professor",
    qualification: "Ph.D. Computer Science",
    contactNumber: "",
    departmentId: "",
    educationLevel: "BOTH",
  };
  const [form, setForm] = useState(blankForm);

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

  // Filtered List
  const filteredFaculty = facultyList.filter((f) => {
    const q = search.toLowerCase().trim();
    if (q) {
      const nameMatch = f.user?.name?.toLowerCase().includes(q);
      const emailMatch = f.user?.email?.toLowerCase().includes(q);
      const fatherMatch = f.fatherName?.toLowerCase().includes(q);
      const desigMatch = f.designation?.toLowerCase().includes(q);
      const qualMatch = f.qualification?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !fatherMatch && !desigMatch && !qualMatch) return false;
    }

    if (filterDept !== "ALL" && f.departmentId !== filterDept) return false;

    if (filterDesignation !== "ALL") {
      if (f.designation?.toLowerCase() !== filterDesignation.toLowerCase()) return false;
    }

    return true;
  });

  // Action: Add Faculty Member
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Faculty member "${data.user?.name || form.name}" registered successfully!`);
        setForm({ ...blankForm, password: defaultPassword });
        setShowAddModal(false);
        fetchAll();
      } else {
        setError(data.error || "Failed to register faculty.");
      }
    } catch {
      setError("Server connection failed.");
    }
    setSaving(false);
  };

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

  // Action: Toggle Active Status
  const handleToggleActive = async (f: FacultyRecord) => {
    try {
      const res = await fetch(`/api/faculty/${f.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !f.isActive }),
      });
      if (res.ok) fetchAll();
    } catch {
      alert("Failed to toggle status.");
    }
  };

  // Action: Delete Faculty Member
  const handleConfirmDelete = async () => {
    if (!deletingFaculty) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/faculty/${deletingFaculty.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess(`Faculty member "${deletingFaculty.user?.name}" deleted successfully.`);
        setDeletingFaculty(null);
        fetchAll();
      } else {
        const d = await res.json();
        setError(d.error || "Delete failed.");
      }
    } catch {
      setError("Failed to delete faculty member.");
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
    if (!joiningForm.facultyId) {
      alert("Please select a faculty member");
      return;
    }
    setSaving(true);
    const sel = facultyList.find((f) => f.id === joiningForm.facultyId) || targetFaculty;

    try {
      const res = await fetch("/api/faculty/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...joiningForm,
          actionType: "JOINING",
          collegeName: collegeDisplayName,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setSuccess(`Faculty joining recorded successfully! Form T.R.I generated.`);
        setFacultyActions((prev) => ({ ...prev, [joiningForm.facultyId]: json.data }));
        setShowJoiningModal(false);

        // Open Form T.R.I Printable Report
        setTriReportData({
          facultyName: sel?.user?.name ? `MR. ${sel.user.name.toUpperCase()}` : "MR. RAHIM BAKHSH",
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
              <span>BS Faculty Management</span>
            </h1>
            <p className="text-gray-500 mt-0.5 text-sm font-medium">
              Register, manage and track faculty members, joining, relieving and other details.
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

          {/* Add Faculty */}
          <button
            onClick={() => {
              setForm({ ...blankForm, password: defaultPassword });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span>
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-bold border border-red-200">{error}</div>}
      {success && <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm font-bold border border-emerald-200">{success}</div>}

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
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                              {f.user?.name ? f.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "FC"}
                            </div>
                            <div>
                              <div className="font-black text-gray-900 text-sm">{f.user?.name}</div>
                              <div className="text-xs text-gray-500 font-medium">S/O: {f.fatherName || "N/A"}</div>
                              <div className="text-[11px] text-gray-400">{f.user?.email}</div>
                              {f.contactNumber && <div className="text-[11px] text-gray-400">📞 {f.contactNumber}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Designation & Qualification */}
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-0.5 text-xs font-black rounded-md bg-blue-50 text-blue-700 border border-blue-200 inline-block mb-1">
                            {f.designation || "Lecturer"}
                          </span>
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
                              <span>Relieved ({action.relievedDate || "15-06-2025"})</span>
                            </span>
                          ) : isJoined ? (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black inline-flex items-center gap-1.5 shadow-sm">
                              <span>📅</span>
                              <span>Joined ({action.joiningDate || "01-09-2023"})</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1.5">
                              <span>📅</span>
                              <span>Active on Duty</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleToggleActive(f)}
                            className={`px-3 py-1 text-xs font-black rounded-full border transition-all cursor-pointer ${
                              f.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                            }`}
                          >
                            {f.isActive ? "✅ Active" : "🔴 Inactive"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* View Profile */}
                            <button
                              onClick={() => setViewingFaculty(f)}
                              className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm cursor-pointer border border-emerald-200"
                              title="View Faculty Profile"
                            >
                              👁️
                            </button>

                            {/* Edit Details */}
                            <button
                              onClick={() => setEditingFaculty(f)}
                              className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center shadow-sm cursor-pointer border border-blue-200"
                              title="Edit Details"
                            >
                              ✏️
                            </button>

                            {/* Form T.R.I (Transfer of Charge / Joining Certificate) */}
                            <button
                              onClick={() => openTriForFaculty(f)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black shadow-sm flex items-center gap-1 cursor-pointer"
                              title="Print / Generate Form T.R.I (Certificate of Transfer of Charge)"
                            >
                              <span>📜</span>
                              <span>Form T.R.I</span>
                            </button>

                            {/* Form T.R.1 (Relieving Certificate) */}
                            <button
                              onClick={() => openRelievingForFaculty(f)}
                              className="px-2 py-1 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-[11px] font-black shadow-sm flex items-center gap-1 cursor-pointer"
                              title="Print / Generate Form T.R.1 (Relieving Certificate)"
                            >
                              <span>📄</span>
                              <span>Form T.R.1</span>
                            </button>

                            {/* Delete Record */}
                            <button
                              onClick={() => setDeletingFaculty(f)}
                              className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center shadow-sm cursor-pointer border border-rose-200"
                              title="Delete Faculty"
                            >
                              🗑️
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

            <form onSubmit={handleSubmitJoining} className="space-y-4">
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
              </div>

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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">{viewingFaculty.user?.name}</h2>
                <p className="text-xs text-emerald-700 font-bold mt-0.5">{viewingFaculty.designation || "Faculty Member"}</p>
              </div>
              <button onClick={() => setViewingFaculty(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Father Name</span>
                <span className="font-semibold text-gray-800">{viewingFaculty.fatherName || "N/A"}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Email Address</span>
                <span className="font-semibold text-gray-800 text-xs truncate block">{viewingFaculty.user?.email}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Qualification</span>
                <span className="font-semibold text-gray-800">{viewingFaculty.qualification || "N/A"}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Department</span>
                <span className="font-semibold text-gray-800">{viewingFaculty.department?.name || "Unassigned"}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Contact Number</span>
                <span className="font-semibold text-gray-800">{viewingFaculty.contactNumber || "N/A"}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Status</span>
                <span className="font-bold text-emerald-700">{viewingFaculty.isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setViewingFaculty(null)} className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT FACULTY MODAL */}
      {editingFaculty && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-black text-gray-900">Edit Faculty Details</h2>
              <button onClick={() => setEditingFaculty(null)} className="text-gray-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    className={INPUT_STYLE}
                    value={editingFaculty.user?.name || ""}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, user: { ...editingFaculty.user, name: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Father Name *</label>
                  <input
                    type="text"
                    className={INPUT_STYLE}
                    value={editingFaculty.fatherName || ""}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, fatherName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Designation *</label>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qualification *</label>
                  <input
                    type="text"
                    className={INPUT_STYLE}
                    value={editingFaculty.qualification || ""}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, qualification: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department *</label>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Faculty Type *</label>
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

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Number</label>
                <input
                  type="text"
                  className={INPUT_STYLE}
                  value={editingFaculty.contactNumber || ""}
                  onChange={(e) => setEditingFaculty({ ...editingFaculty, contactNumber: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-3">
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

      {/* DELETE FACULTY CONFIRMATION MODAL */}
      {deletingFaculty && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-4 text-center border border-red-200">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              🗑️
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Deactivate Faculty Member?</h2>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to deactivate <strong className="text-gray-900">"{deletingFaculty.user?.name}"</strong>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleConfirmDelete} disabled={saving} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer">
                {saving ? "Deactivating..." : "Confirm Deactivate"}
              </button>
              <button onClick={() => setDeletingFaculty(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW FACULTY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-black text-gray-900">Register New Faculty Member</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="Prof. Imran Zubair"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Father Name *</label>
                  <input
                    required
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="Muhammad Zubair"
                    value={form.fatherName}
                    onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Designation *</label>
                  <select
                    className={INPUT_STYLE}
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Visiting Faculty">Visiting Faculty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qualification *</label>
                  <input
                    required
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="Ph.D. Computer Science"
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Email Address *</label>
                    <span className="text-[10px] text-blue-600 font-semibold">✨ Auto-generated</span>
                  </div>
                  <input
                    required
                    type="email"
                    className={`${INPUT_STYLE} font-medium text-blue-900 bg-blue-50/50`}
                    placeholder={`imran.zubair${emailDomain}`}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Password *</label>
                    <span className="text-[10px] text-emerald-600 font-semibold">🔑 System Default</span>
                  </div>
                  <input
                    required
                    type="text"
                    className={`${INPUT_STYLE} font-mono font-bold text-emerald-800 bg-emerald-50/50`}
                    placeholder="gpgcq123"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department *</label>
                  <select
                    required
                    className={INPUT_STYLE}
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Faculty Type *</label>
                  <select
                    required
                    className={INPUT_STYLE}
                    value={form.educationLevel}
                    onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}
                  >
                    <option value="BS">🎓 BS Faculty</option>
                    <option value="INTERMEDIATE">🏫 Inter Faculty</option>
                    <option value="BOTH">🎓 Both (BS & Inter)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Number</label>
                <input
                  type="text"
                  className={INPUT_STYLE}
                  placeholder="0300-1234567"
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="submit" disabled={saving} className={`flex-1 ${BTN_PRIMARY} justify-center`}>
                  {saving ? "Registering..." : "Register Faculty"}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className={`flex-1 ${BTN_SECONDARY} justify-center`}>
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
