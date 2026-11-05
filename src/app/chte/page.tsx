"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Building2,
  Sliders,
  Sparkles,
  ExternalLink,
  Users,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  MapPin,
  Mail,
  Phone,
  LayoutGrid,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Settings,
  ChevronRight,
  Globe
} from "lucide-react";
import HomepageSettingsTab from "@/components/admin/HomepageSettingsTab";

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
  isActive: boolean;
  createdAt: string;
  _count?: {
    students: number;
    faculty: number;
    programs: number;
    departments: number;
  };
  users?: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  }[];
}

export default function ChteMasterDashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isChteAdmin = userRole === "SUPER_ADMIN" || userRole === "CHTE_ADMIN";

  const [activeTab, setActiveTab] = useState<"SETTINGS" | "COLLEGES" | "OVERVIEW">("SETTINGS");
  const [colleges, setColleges] = useState<CollegeItem[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");

  const fetchColleges = async () => {
    setLoadingColleges(true);
    try {
      const res = await fetch("/api/chte/colleges");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setColleges(data);
        }
      }
    } catch (err) {
      console.error("Failed to load colleges:", err);
    } finally {
      setLoadingColleges(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  // Compute aggregate statistics
  const totalColleges = colleges.length;
  const activeColleges = colleges.filter((c) => c.isActive).length;
  const totalStudents = colleges.reduce((sum, c) => sum + (c._count?.students || 0), 0);
  const totalFaculty = colleges.reduce((sum, c) => sum + (c._count?.faculty || 0), 0);
  const totalPrograms = colleges.reduce((sum, c) => sum + (c._count?.programs || 0), 0);

  // Filtered colleges list
  const districts = Array.from(
    new Set(colleges.map((c) => c.district).filter(Boolean) as string[])
  ).sort();

  const filteredColleges = colleges.filter((col) => {
    const matchesSearch =
      col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (col.district && col.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (col.principalName && col.principalName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDistrict = selectedDistrict === "ALL" || col.district === selectedDistrict;

    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Banner */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-5 sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  CHTE Central Dashboard
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Apex Master
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Balochistan Higher & Technical Education Department " Unified Central Governance
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all shadow-sm"
              title="Preview Public Homepage"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Website</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <Link
              href="/chte/colleges"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision New College</span>
            </Link>

            <button
              onClick={fetchColleges}
              disabled={loadingColleges}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingColleges ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* KPI Province Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Colleges</div>
              <div className="text-lg font-black text-white">{totalColleges}</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Campuses</div>
              <div className="text-lg font-black text-emerald-400">{activeColleges}</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Students</div>
              <div className="text-lg font-black text-white">{totalStudents.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Faculty Members</div>
              <div className="text-lg font-black text-white">{totalFaculty.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">BS Programs</div>
              <div className="text-lg font-black text-white">{totalPrograms}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setActiveTab("SETTINGS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "SETTINGS"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>CHTE Homepage & Portal Settings</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400/20 text-emerald-300 ml-1">
              Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab("COLLEGES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "COLLEGES"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Colleges Directory & Portals</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-300 ml-1">
              {colleges.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "OVERVIEW"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Governance & Access</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-6 flex-1">
        {/* TAB 1: CHTE Homepage Settings */}
        {activeTab === "SETTINGS" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  CHTE Public Portal Customization
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust header titles, scenic backdrop, news tickers, leadership messages, and color palettes for the main CHTE portal.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Changes on Public Site</span>
                </Link>
              </div>
            </div>

            {/* Embedded Homepage Settings Component */}
            <HomepageSettingsTab onSwitchToColleges={() => setActiveTab("COLLEGES")} />
          </div>
        )}

        {/* TAB 2: Colleges Directory */}
        {activeTab === "COLLEGES" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  Affiliated Colleges Directory
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Direct access to individual campus portals, administrative logins, and provisioning.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/chte/colleges"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add / Manage Colleges</span>
                </Link>
              </div>
            </div>

            {/* Search & District Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search colleges by name, code, district, or principal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Colleges Grid */}
            {loadingColleges ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
                <p className="text-xs text-slate-400">Loading affiliated colleges...</p>
              </div>
            ) : filteredColleges.length === 0 ? (
              <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl py-14 text-center">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">No colleges matched your search</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try clearing the search query or district filter to view all institutions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredColleges.map((college) => {
                  const adminUser = college.users?.[0];
                  return (
                    <div
                      key={college.id}
                      className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-sm hover:shadow-lg hover:shadow-emerald-950/20"
                    >
                      <div>
                        {/* College Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center font-black text-sm text-emerald-400 group-hover:scale-105 transition-all">
                              {college.code}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                                {college.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  {college.district || "Balochistan"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              college.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {college.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {/* Principal & Info */}
                        {college.principalName && (
                          <div className="text-xs text-slate-400 bg-slate-950/60 rounded-lg px-3 py-2 border border-slate-800/80 mb-3">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase block">Principal</span>
                            <span className="font-medium text-slate-200">{college.principalName}</span>
                          </div>
                        )}

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center my-3">
                          <div>
                            <div className="text-xs font-bold text-white">{college._count?.students || 0}</div>
                            <div className="text-[10px] text-slate-500">Students</div>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{college._count?.faculty || 0}</div>
                            <div className="text-[10px] text-slate-500">Faculty</div>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{college._count?.programs || 0}</div>
                            <div className="text-[10px] text-slate-500">Programs</div>
                          </div>
                        </div>

                        {/* Admin Email details if provisioned */}
                        {adminUser && (
                          <div className="text-[11px] text-slate-400 flex items-center justify-between mb-3">
                            <span className="text-slate-500">Admin Account:</span>
                            <span className="text-slate-300 font-mono text-[10px]">{adminUser.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-2 pt-2">
                        <Link
                          href={`/login?mode=institute&institute=${college.code.toLowerCase()}`}
                          target="_blank"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 transition-all border border-slate-700/60"
                        >
                          <span>Portal Login</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href="/chte/colleges"
                          className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-all border border-slate-700/60"
                          title="Manage Campus Details"
                        >
                          <Settings className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Governance & Access Quick Links */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">Users & Roles</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage college administrators, controllers, faculty accounts, and permissions across all institutes.
                  </p>
                </div>
                <Link
                  href="/admin/users"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  <span>Open Users Directory</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">Security & Permissions</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure granular access controls, role-based capabilities, and module policies.
                  </p>
                </div>
                <Link
                  href="/admin/permissions"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Manage Role Permissions</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">Institutional Onboarding</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Provision new government colleges, assign admin credentials, bank accounts, and programs.
                  </p>
                </div>
                <Link
                  href="/chte/colleges"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300"
                >
                  <span>Provision New College</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

