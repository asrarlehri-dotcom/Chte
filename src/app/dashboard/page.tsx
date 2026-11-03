"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getCompleteDashboardData } from "../shared-actions";
import {
  Users,
  LayoutGrid,
  UserCheck,
  BookOpen,
  Calendar,
  Search,
  Bell,
  ChevronDown,
  UserPlus,
  Receipt,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  BarChart2,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Clock,
  CheckCircle2,
  DollarSign,
  PieChart
} from "lucide-react";

type EducationLevel = "ALL" | "INTERMEDIATE" | "BS";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [level, setLevel] = useState<EducationLevel>("ALL");
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [dashboardSessions, setDashboardSessions] = useState<string[]>([
    "2024-2028", "2025-2029", "2026-2030", "2023-2027", "2022-2026",
    "2024-2026", "2025-2027", "2026-2028", "2023-2025", "2022-2024"
  ]);
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userName = session?.user?.name || "Admin";
  const userCollegeId = (session?.user as any)?.collegeId || null;
  const userCollegeName = (session?.user as any)?.collegeName || null;
  const userRole = (session?.user as any)?.role || "User";

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(async data => {
        const { filterValidSessions, DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        if (data.ACADEMIC_SESSIONS) {
          setDashboardSessions(filterValidSessions(data.ACADEMIC_SESSIONS));
        } else {
          setDashboardSessions(DEFAULT_ALL_SESSIONS);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getCompleteDashboardData(level, selectedSession, userCollegeId)
      .then((data) => {
        setDashData(data);
      })
      .finally(() => setLoading(false));
  }, [level, selectedSession, userCollegeId]);

  const topMetrics = dashData?.topMetrics || {
    totalStudents: 0,
    activePrograms: 0,
    totalFaculty: 0,
    totalCourses: 0,
    todaysClasses: 0,
    studentGrowth: "0%"
  };

  const statusOverview = dashData?.statusOverview || {
    active: 0,
    graduated: 0,
    dropout: 0,
    migration: 0,
    other: 0,
    total: 0
  };

  const feeSummary = dashData?.feeSummary || {
    totalExpected: 0,
    totalCollected: 0,
    pendingAmount: 0,
    collectionRate: "0.0"
  };

  const programWise = dashData?.programWiseEnrollment || [];
  const recentNotices = dashData?.recentNotices || [];
  const academicActivities = dashData?.academicActivities || [];
  const upcomingSchedule = dashData?.upcomingSchedule || [];
  const monthlyData = dashData?.monthlyEnrollment || [];

  // Donut chart calculations
  const totalSt = statusOverview.total || 0;
  const cCircumference = 238.76;
  const activePct = totalSt > 0 ? statusOverview.active / totalSt : 0;
  const gradPct = totalSt > 0 ? statusOverview.graduated / totalSt : 0;
  const dropPct = totalSt > 0 ? statusOverview.dropout / totalSt : 0;
  const migPct = totalSt > 0 ? statusOverview.migration / totalSt : 0;
  const otherPct = totalSt > 0 ? statusOverview.other / totalSt : 0;

  const activeDash = activePct * cCircumference;
  const gradDash = gradPct * cCircumference;
  const dropDash = dropPct * cCircumference;
  const migDash = migPct * cCircumference;

  const gradOffset = -activeDash;
  const dropOffset = -(activeDash + gradDash);
  const migOffset = -(activeDash + gradDash + dropDash);

  // Line chart calculations
  const maxEnroll = Math.max(
    ...monthlyData.map((d: any) => Math.max(d.current || 0, d.previous || 0)),
    topMetrics.totalStudents > 0 ? topMetrics.totalStudents : 10
  );

  const getPolylinePoints = (key: "current" | "previous") => {
    if (monthlyData.length === 0 || topMetrics.totalStudents === 0) {
      return "30,140 480,140";
    }
    return monthlyData.map((d: any, idx: number) => {
      const x = 30 + idx * ((480 - 30) / (monthlyData.length - 1));
      const val = d[key] || 0;
      const y = 140 - (val / (maxEnroll * 1.15)) * 115;
      return `${Math.round(x)},${Math.round(y)}`;
    }).join(" ");
  };

  const getAreaPath = () => {
    if (monthlyData.length === 0 || topMetrics.totalStudents === 0) {
      return "M 30 140 L 480 140 L 480 140 L 30 140 Z";
    }
    const points = monthlyData.map((d: any, idx: number) => {
      const x = 30 + idx * ((480 - 30) / (monthlyData.length - 1));
      const val = d.current || 0;
      const y = 140 - (val / (maxEnroll * 1.15)) * 115;
      return `${idx === 0 ? "M" : "L"} ${Math.round(x)} ${Math.round(y)}`;
    }).join(" ");
    return `${points} L 480 140 L 30 140 Z`;
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800 animate-fadeIn">
      {/* ── TOP NAV / HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {userCollegeName || "Institutional Dashboard"}
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-0.5">
            Welcome back, <span className="font-bold text-slate-700">{userName}</span>
            {userCollegeName ? <span className="text-indigo-600 font-bold"> • {userCollegeName}</span> : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Session Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <span className="text-slate-400 font-medium">Session</span>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Sessions</option>
              {dashboardSessions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Program Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <span className="text-slate-400 font-medium">Program</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as EducationLevel)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Programs</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="BS">BS Program</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative hidden md:block w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-12 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded-md">
              Ctrl + K
            </span>
          </div>

          {/* Notification Icon */}
          <button className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-200 transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>

          {/* User Profile Tag */}
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-800 shadow-xs">
            <div className="w-6 h-6 rounded-lg bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center uppercase">
              {userName.slice(0, 2)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-bold leading-none">{userName}</div>
              <div className="text-[9px] text-indigo-300 font-medium">{userRole.replace(/_/g, " ")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOP 5 KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Students */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Total Students</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-1">
                {topMetrics.totalStudents?.toLocaleString() ?? 0}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{topMetrics.studentGrowth ?? "0%"} this session</span>
          </div>
        </div>

        {/* Card 2: Active Programs */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Active Programs</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-1">
                {topMetrics.activePrograms ?? 0}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-400">
            All running programs
          </div>
        </div>

        {/* Card 3: Faculty Members */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Faculty Members</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-1">
                {topMetrics.totalFaculty ?? 0}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-400">
            Active faculty
          </div>
        </div>

        {/* Card 4: Total Courses */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Total Courses</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-1">
                {topMetrics.totalCourses ?? 0}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-400">
            Across all programs
          </div>
        </div>

        {/* Card 5: Today's Classes */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Today's Classes</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-1">
                {topMetrics.todaysClasses ?? 0}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-400">
            Scheduled today
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: ENROLLMENT OVERVIEW + STATUS DONUT + QUICK ACTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Line Chart: Enrollment Overview (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900">Enrollment Overview</h3>
            </div>
            <select className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg focus:outline-none">
              <option>This Session</option>
              <option>Last Session</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-600 rounded-full"></span>
              <span>This Session</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-300 border border-dashed border-slate-400"></span>
              <span>Last Session</span>
            </div>
          </div>

          {/* SVG Smooth Line Chart */}
          <div className="w-full h-48 pt-2">
            <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="20" x2="480" y2="20" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="30" y1="60" x2="480" y2="60" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="30" y1="100" x2="480" y2="100" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="30" y1="140" x2="480" y2="140" stroke="#F1F5F9" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="0" y="24" fill="#94A3B8" fontSize="9" fontWeight="bold">
                {topMetrics.totalStudents > 0 ? Math.round(maxEnroll) : 0}
              </text>
              <text x="0" y="64" fill="#94A3B8" fontSize="9" fontWeight="bold">
                {topMetrics.totalStudents > 0 ? Math.round(maxEnroll * 0.66) : 0}
              </text>
              <text x="0" y="104" fill="#94A3B8" fontSize="9" fontWeight="bold">
                {topMetrics.totalStudents > 0 ? Math.round(maxEnroll * 0.33) : 0}
              </text>
              <text x="0" y="144" fill="#94A3B8" fontSize="9" fontWeight="bold">0</text>

              {/* Last Session (Dashed Line) */}
              <polyline
                points={getPolylinePoints("previous")}
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* This Session Fill Area */}
              <path
                d={getAreaPath()}
                fill="url(#purpleGrad)"
              />

              {/* This Session (Solid Line) */}
              <polyline
                points={getPolylinePoints("current")}
                fill="none"
                stroke="#6366F1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Active Dot */}
              {topMetrics.totalStudents > 0 && (
                <circle cx="480" cy={140 - (topMetrics.totalStudents / (maxEnroll * 1.15)) * 115} r="4" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2" />
              )}

              {/* X Axis Month Labels */}
              <text x="30" y="165" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">Jul</text>
              <text x="71" y="165" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">Aug</text>
              <text x="112" y="165" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">Sep</text>
              <text x="153" y="165" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">Oct</text>
              <text x="194" y="165" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">Nov</text>
              <text x="235" y="165" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">Dec</text>
              <text x="276" y="165" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">Jan</text>
              <text x="317" y="165" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">Feb</text>
              <text x="358" y="165" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">Mar</text>
              <text x="399" y="165" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">Apr</text>
              <text x="440" y="165" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">May</text>
              <text x="480" y="165" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">Jun</text>
            </svg>
          </div>
        </div>

        {/* Donut Chart: Student Status Overview (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900">Student Status Overview</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* SVG Donut Chart with Center Count */}
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="12" />
                {/* Active (Green) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray={`${activeDash} ${cCircumference}`}
                  strokeDashoffset="0"
                />
                {/* Graduated (Blue) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="12"
                  strokeDasharray={`${gradDash} ${cCircumference}`}
                  strokeDashoffset={gradOffset}
                />
                {/* Dropout (Orange) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="12"
                  strokeDasharray={`${dropDash} ${cCircumference}`}
                  strokeDashoffset={dropOffset}
                />
                {/* Migration Out (Red) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="12"
                  strokeDasharray={`${migDash} ${cCircumference}`}
                  strokeDashoffset={migOffset}
                />
              </svg>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-black text-slate-900 leading-tight">
                  {statusOverview.total?.toLocaleString() ?? 0}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-2 text-xs font-semibold text-slate-600 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Active</span>
                </div>
                <span className="font-bold text-slate-900">
                  {statusOverview.active} ({(activePct * 100).toFixed(1)}%)
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Graduated</span>
                </div>
                <span className="font-bold text-slate-900">
                  {statusOverview.graduated} ({(gradPct * 100).toFixed(1)}%)
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span>Dropout</span>
                </div>
                <span className="font-bold text-slate-900">
                  {statusOverview.dropout} ({(dropPct * 100).toFixed(1)}%)
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>Migration (Out)</span>
                </div>
                <span className="font-bold text-slate-900">
                  {statusOverview.migration} ({(migPct * 100).toFixed(1)}%)
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span>Other / Inactive</span>
                </div>
                <span className="font-bold text-slate-900">
                  {statusOverview.other} ({(otherPct * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Notices (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Quick Actions Grid */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-2">
              <Link href="/bs/students" className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200/70 hover:border-indigo-200 rounded-xl text-center transition-colors group">
                <UserPlus className="w-4 h-4 text-indigo-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">Add Student</span>
              </Link>

              <Link href="/bs/fees" className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 rounded-xl text-center transition-colors group">
                <Receipt className="w-4 h-4 text-blue-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">Generate Challan</span>
              </Link>

              <Link href="/bs/timetable-datesheet" className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-200 rounded-xl text-center transition-colors group">
                <Calendar className="w-4 h-4 text-emerald-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">Create Timetable</span>
              </Link>

              <Link href="/bs/exams-results" className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200/70 hover:border-purple-200 rounded-xl text-center transition-colors group">
                <ClipboardCheck className="w-4 h-4 text-purple-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">Conduct Exam</span>
              </Link>

              <Link href="/bs/marks" className="p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200/70 hover:border-amber-200 rounded-xl text-center transition-colors group">
                <FileSpreadsheet className="w-4 h-4 text-amber-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">Publish Result</span>
              </Link>

              <Link href="/bs/gazette" className="p-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200/70 hover:border-rose-200 rounded-xl text-center transition-colors group">
                <FileText className="w-4 h-4 text-rose-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">View Reports</span>
              </Link>
            </div>
          </div>

          {/* Recent Notices */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Recent Notices</h3>
              <Link href="/bs/timetable-datesheet" className="text-[11px] font-bold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentNotices.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  No notices or datesheets posted
                </div>
              ) : (
                recentNotices.map((n: any) => (
                  <div key={n.id} className="p-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs flex justify-between items-start">
                    <div className="flex gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                        n.type === "rose" ? "bg-rose-500" : n.type === "indigo" ? "bg-indigo-500" : "bg-purple-500"
                      }`}></span>
                      <div className="min-w-0">
                        <strong className="block font-bold text-slate-900 leading-snug truncate">{n.title}</strong>
                        <span className="text-[10px] text-slate-500 font-medium">{n.target}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 ml-2">{n.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW 1: ACADEMIC ACTIVITY + FEE COLLECTION + PROGRAM WISE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Academic Activity (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900">Academic Activity</h3>
            <Link href="/admin/audit-logs" className="text-xs font-bold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {academicActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No recent academic activity recorded
              </div>
            ) : (
              academicActivities.map((act: any) => (
                <div key={act.id} className="p-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs flex justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="font-bold text-slate-900">{act.activity}</strong>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md truncate">
                          {act.program}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{act.details}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 ml-2">{act.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fee Collection Summary (3 cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900">Fee Collection Summary</h3>
            <select className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg focus:outline-none">
              <option>This Month</option>
              <option>This Session</option>
            </select>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-500">Total Expected</span>
              <span className="font-bold text-slate-900">PKR {(feeSummary.totalExpected || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-500">Total Collected</span>
              <span className="font-bold text-emerald-600">PKR {(feeSummary.totalCollected || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-500">Pending Amount</span>
              <span className="font-bold text-rose-600">PKR {(feeSummary.pendingAmount || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Collection Rate</span>
              <span className="font-black text-indigo-600">{feeSummary.collectionRate || "0.0"}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, parseFloat(feeSummary.collectionRate || "0")))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Program Wise Enrollment (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900">Program Wise Enrollment</h3>
            <Link href="/admin/departments-programs" className="text-xs font-bold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {programWise.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No programs or enrolled students found
              </div>
            ) : (
              programWise.map((p: any, i: number) => {
                const maxCount = Math.max(...programWise.map((x: any) => x.count), 1);
                const percentage = Math.min(100, (p.count / maxCount) * 100);
                const barColors = ["bg-indigo-600", "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500"];
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-700 truncate">{p.name}</span>
                      <span className="font-bold text-slate-900">{p.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColors[i % barColors.length]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW 2: UPCOMING SCHEDULE HORIZONTAL ROW ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900">Upcoming Schedule</h3>
          <Link href="/bs/timetable-datesheet" className="text-xs font-bold text-indigo-600 hover:underline">
            View Calendar
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {upcomingSchedule.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              No upcoming classes or exams scheduled
            </div>
          ) : (
            upcomingSchedule.map((sched: any) => (
              <div key={sched.id} className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-black tracking-widest">{sched.month}</span>
                  <span className="text-base font-black leading-none">{sched.day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs font-bold text-slate-900 leading-snug truncate">{sched.title}</strong>
                  <span className="text-[10px] text-slate-500 font-medium block truncate">{sched.sub}</span>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{sched.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-medium text-slate-400 pt-4 border-t border-slate-200/60">
        <div>
          © {new Date().getFullYear()} {userCollegeName || "Higher & Technical Education Department Balochistan"}. All rights reserved.
        </div>
        <div>
          Unified Colleges Cloud ERP | Government of Balochistan
        </div>
      </div>
    </div>
  );
}
