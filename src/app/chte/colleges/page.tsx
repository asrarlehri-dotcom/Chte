"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Printer,
  Sparkles,
  KeyRound,
  GraduationCap,
  Users,
  Eye,
  EyeOff,
  School,
  Lock,
  Phone,
  Mail,
  MapPin,
  CreditCard
} from "lucide-react";

interface CollegeItem {
  id: string;
  name: string;
  code: string;
  slug: string;
  tagline: string | null;
  logoUrl: string | null;
  district: string | null;
  division: string | null;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  principalName: string | null;
  bankName: string | null;
  bankAccount: string | null;
  branchCode: string | null;
  accountTitle: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    students: number;
    faculty: number;
    programs: number;
    departments: number;
  };
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  }>;
}

export default function ChteCollegesPage() {
  const { data: session } = useSession();
  const [colleges, setColleges] = useState<CollegeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedCollegeForReset, setSelectedCollegeForReset] = useState<CollegeItem | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");

  // New College Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    tagline: "Center of Excellence & Quality Education",
    logoUrl: "",
    district: "Quetta",
    division: "Quetta Division",
    address: "",
    contactPhone: "",
    principalName: "",
    adminEmail: "",
    adminPassword: "",
    bankName: "Habib Bank Limited (HBL)",
    bankAccount: "",
    branchCode: "",
    accountTitle: "",
  });

  const [createdCredentials, setCreatedCredentials] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch colleges
  const fetchColleges = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chte/colleges");
      if (res.ok) {
        const data = await res.json();
        setColleges(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  // Auto-generate code and email when college name changes
  const handleNameChange = (val: string) => {
    setFormData((prev) => {
      // e.g. "Govt Degree College Sariab" -> "GDC-SARIAB"
      let suggestedCode = prev.code;
      if (!prev.code || prev.code === "") {
        const words = val.trim().split(/\s+/);
        if (words.length > 1) {
          suggestedCode = words.map(w => w[0]).join("").toUpperCase();
        } else {
          suggestedCode = val.substring(0, 4).toUpperCase();
        }
      }
      const cleanCode = suggestedCode.replace(/[^A-Z0-9]/gi, "").toLowerCase();
      const suggestedEmail = prev.adminEmail === "" || prev.adminEmail.includes("@") 
        ? `admin@${cleanCode || "college"}.edu.pk` 
        : prev.adminEmail;

      return {
        ...prev,
        name: val,
        code: suggestedCode,
        adminEmail: suggestedEmail,
        accountTitle: prev.accountTitle === "" ? `Principal ${val}` : prev.accountTitle
      };
    });
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pwd = "Col@";
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, adminPassword: pwd }));
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/chte/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create college");
        setSubmitting(false);
        return;
      }

      setCreatedCredentials(data.credentials);
      await fetchColleges();
      setSubmitting(false);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
      setSubmitting(false);
    }
  };

  const toggleStatus = async (college: CollegeItem) => {
    try {
      const res = await fetch(`/api/chte/colleges/${college.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !college.isActive }),
      });
      if (res.ok) {
        setColleges((prev) =>
          prev.map((c) => (c.id === college.id ? { ...c, isActive: !c.isActive } : c))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedCollegeForReset || !newPasswordInput.trim()) return;
    try {
      const res = await fetch(`/api/chte/colleges/${selectedCollegeForReset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newAdminPassword: newPasswordInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Password updated successfully!");
        setResetModalOpen(false);
        setNewPasswordInput("");
      } else {
        alert(data.error || "Failed to reset password");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredColleges = colleges.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.principalName && c.principalName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDistrict = selectedDistrict === "ALL" || c.district === selectedDistrict;
    return matchesSearch && matchesDistrict;
  });

  const districts = Array.from(new Set(colleges.map((c) => c.district).filter(Boolean)));
  const totalStudents = colleges.reduce((sum, c) => sum + (c._count?.students || 0), 0);
  const totalFaculty = colleges.reduce((sum, c) => sum + (c._count?.faculty || 0), 0);
  const activeColleges = colleges.filter((c) => c.isActive).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8">
      {/* Top CHTE Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-700/40 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              CHTE Higher & Technical Education
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Central Colleges Provisioning & Master Server
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Generate new colleges across Balochistan, issue unique administrator credentials, and provision independent institutional portals with customized emblems, timetables, and gazette engines.
            </p>
          </div>

          <button
            onClick={() => {
              setCreatedCredentials(null);
              setErrorMsg("");
              generateRandomPassword();
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Generate New College</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Colleges</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-white">{colleges.length}</div>
          <div className="mt-1 text-xs text-slate-400">Institutions Registered</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Active Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-emerald-400">{activeColleges}</div>
          <div className="mt-1 text-xs text-slate-400">Live operational portals</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Enrolled Students</span>
            <GraduationCap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-purple-300">{totalStudents.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-400">Across all institutions</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Faculty Members</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-extrabold text-amber-300">{totalFaculty.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-400">Teaching Staff Members</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/70 p-4 rounded-2xl border border-slate-800/80">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search college name, code, or principal..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Districts ({colleges.length})</option>
            {districts.map((d: any) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            onClick={fetchColleges}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Colleges Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
          Loading CHTE institutional registry...
        </div>
      ) : filteredColleges.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800/80">
          <School className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-300">No Colleges Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or click "Generate New College" to onboard one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColleges.map((college) => {
            const adminUser = college.users?.[0];
            return (
              <div
                key={college.id}
                className={`rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                  college.isActive
                    ? "bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-xl"
                    : "bg-slate-950/80 border-rose-900/40 opacity-75"
                }`}
              >
                <div>
                  {/* Card Header: Logo, Name, Badge */}
                  <div className="flex items-start gap-3.5">
                    {college.logoUrl ? (
                      <img
                        src={college.logoUrl}
                        alt="Logo"
                        className="w-12 h-12 object-contain rounded-xl bg-slate-950 p-1.5 border border-slate-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md flex-shrink-0">
                        {college.code.substring(0, 3)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono text-[10px] font-bold border border-blue-500/20">
                          {college.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            college.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {college.isActive ? "Active" : "Suspended"}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mt-1 leading-snug line-clamp-2">
                        {college.name}
                      </h3>
                      {college.tagline && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{college.tagline}</p>
                      )}
                    </div>
                  </div>

                  {/* College Stats & Info */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Students</span>
                      <span className="text-sm font-bold text-purple-300">
                        {college._count?.students || 0}
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Faculty</span>
                      <span className="text-sm font-bold text-amber-300">
                        {college._count?.faculty || 0}
                      </span>
                    </div>
                  </div>

                  {/* Principal & District Meta */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    {college.principalName && (
                      <div className="flex items-center gap-2 truncate">
                        <School className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">Principal: <strong className="text-slate-200">{college.principalName}</strong></span>
                      </div>
                    )}
                    {college.district && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>District: <strong className="text-slate-200">{college.district}</strong></span>
                      </div>
                    )}
                    {adminUser && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate font-mono text-[11px] text-slate-300">{adminUser.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedCollegeForReset(college);
                      setNewPasswordInput("");
                      setResetModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    title="Reset Admin Password"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Pass</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(college)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        college.isActive
                          ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {college.isActive ? "Suspend" : "Activate"}
                    </button>

                    <a
                      href={`/dashboard?collegeId=${college.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-colors"
                      title="Inspect College Portal"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL 1: GENERATE NEW COLLEGE FORM & CREDENTIAL SLIP       */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl space-y-6">
            {!createdCredentials ? (
              <form onSubmit={handleCreateCollege} className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Generate New College & Issue Credentials</h2>
                      <p className="text-xs text-slate-400">CHTE Master Institutional Onboarding</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {/* Section 1: Institutional Identity */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5" /> 1. Institutional Identity
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Official College Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Government Degree College Sariab Road, Quetta"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Unique College Short Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. GDC-SARIAB"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Emblem / Logo URL (PNG/SVG)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /logos/gdc-sariab.png or online URL"
                        value={formData.logoUrl}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Motto / Tagline
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Section 2: Administration & Location */}
                <div className="space-y-4 pt-2 border-t border-slate-800/80">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> 2. Administration & Location
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        District *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Quetta"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Principal Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Prof. Dr. Abdul Qayyum"
                        value={formData.principalName}
                        onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Official Phone / Landline
                      </label>
                      <input
                        type="text"
                        placeholder="+92 81 9200000"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Physical Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sariab Road, Quetta"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: College Admin Login Credentials */}
                <div className="space-y-4 pt-2 border-t border-slate-800/80">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> 3. Administrator Portal Credentials
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Admin Login Email / Username *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="admin@college.edu.pk"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Initial Password *
                        </label>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                        >
                          <Sparkles className="w-3 h-3" /> Auto-Generate
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.adminPassword}
                          onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Bank Challan Setup */}
                <div className="space-y-4 pt-2 border-t border-slate-800/80">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> 4. Institutional Bank Account (For Challans)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 08730001324203"
                        value={formData.bankAccount}
                        onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Provisioning..." : "Generate College Now"}
                  </button>
                </div>
              </form>
            ) : (
              /* Success / Credential Handover Slip */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-white">College Successfully Generated!</h2>
                  <p className="text-xs text-slate-400">
                    Hand over this official credential voucher to the College Principal or Administrator.
                  </p>
                </div>

                {/* Credential Slip Card */}
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs text-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-400 font-sans font-bold">College:</span>
                    <strong className="text-white text-sm font-sans">{createdCredentials.collegeName}</strong>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-400 font-sans font-bold">Institutional Code:</span>
                    <strong className="text-blue-400 font-bold">{createdCredentials.collegeCode}</strong>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-400 font-sans font-bold">Portal Login URL:</span>
                    <span className="text-purple-300 font-sans">{window.location.origin}/login</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-400 font-sans font-bold">Admin Username / Email:</span>
                    <span className="text-amber-300 font-bold">{createdCredentials.adminEmail}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans font-bold">Temporary Password:</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                      {createdCredentials.adminPassword}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => {
                      const text = `=== CHTE COLLEGE CREDENTIALS ===\nCollege: ${createdCredentials.collegeName} (${createdCredentials.collegeCode})\nPortal: ${window.location.origin}/login\nEmail: ${createdCredentials.adminEmail}\nPassword: ${createdCredentials.adminPassword}\n================================`;
                      copyToClipboard(text);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copied ? "Copied to Clipboard!" : "Copy Credentials"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Slip</span>
                    </button>

                    <button
                      onClick={() => setModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Done & Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL 2: RESET ADMIN PASSWORD MODAL                        */}
      {/* ─────────────────────────────────────────────────────────── */}
      {resetModalOpen && selectedCollegeForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" /> Reset College Admin Password
              </h3>
              <button
                onClick={() => setResetModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Resetting administrator password for:
                <br />
                <strong className="text-white">{selectedCollegeForReset.name}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Enter New Password
                </label>
                <input
                  type="text"
                  placeholder="e.g. NewSecret2026@"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={!newPasswordInput.trim()}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold disabled:opacity-50"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
