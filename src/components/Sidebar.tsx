"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/lib/usePermissions";
import { MODULES, ACTIONS } from "@/lib/permissions";
import { useSettings } from "@/lib/useSettings";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Building2,
  BookOpen,
  UserCheck,
  Calendar,
  ClipboardCheck,
  FileText,
  CreditCard,
  Receipt,
  DollarSign,
  ShieldCheck,
  Sliders,
  History,
  ChevronRight,
  LogOut,
  HelpCircle,
  Landmark,
  LucideIcon,
} from "lucide-react";

type NavItem = {
  key?: string;
  href: string;
  label: string;
  badge?: string;
  module?: string;
  icon?: LucideIcon;
};

type NavGroup = {
  title: string;
  items: NavItem[];
  roles?: string[];
};

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { can } = usePermissions();
  const { collegeName, collegeLogo } = useSettings();

  if (!session) return null;
  const sessionUser = session.user as any;
  const role = sessionUser?.role as string;
  const userName = session.user?.name || "Administrator";
  const userEmail = session.user?.email || "admin@chte.gob.pk";
  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "AD";

  // Central CHTE login vs College-specific campus login
  const isCentral =
    role === "CHTE_ADMIN" || role === "SUPER_ADMIN" || !sessionUser?.collegeId;

  const isVisible = (item: NavItem): boolean => {
    if (role === "SUPER_ADMIN" || role === "CHTE_ADMIN") return true;
    if (!item.module) return true;
    return can(item.module, ACTIONS.VIEW);
  };

  const isGroupVisible = (group: NavGroup): boolean => {
    if (group.roles && !group.roles.includes(role)) return false;
    return group.items.some(isVisible);
  };

  const linkClass = (href: string) => {
    const active =
      pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
    return `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
      active
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 font-bold scale-[1.01]"
        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
    }`;
  };

  // ── Central Navigation: ONLY Colleges, Users, Permissions, Settings, Audit Logs ──
  const CENTRAL_NAV_GROUPS: NavGroup[] = [
    {
      title: "COLLEGES GOVERNANCE",
      items: [
        {
          key: "chte-homepage-setup",
          href: "/admin/settings",
          label: "CHTE Homepage & Portals",
          badge: "Live",
          icon: Landmark,
        },
        {
          key: "chte-colleges",
          href: "/chte/colleges",
          label: "Colleges Management",
          badge: "HQ",
          icon: Building2,
        },
      ],
    },
    {
      title: "ACCESS & SECURITY",
      items: [
        {
          key: "users-roles",
          href: "/admin/users",
          label: "Users & Accounts",
          module: MODULES.ADMIN_USERS,
          icon: Users,
        },
        {
          key: "permissions",
          href: "/admin/permissions",
          label: "Role Permissions",
          module: MODULES.ADMIN_PERMISSIONS,
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: "SYSTEM & CONFIGURATION",
      items: [
        {
          key: "settings",
          href: "/admin/settings",
          label: "System Settings",
          module: MODULES.ADMIN_SETTINGS,
          icon: Sliders,
        },
        {
          key: "audit-logs",
          href: "/admin/audit-logs",
          label: "Security & Audit Logs",
          module: MODULES.ADMIN_AUDIT_LOGS,
          icon: History,
        },
      ],
    },
  ];

  // ── College Navigation: Full Campus Academic, Finance & Operations ──
  const COLLEGE_NAV_GROUPS: NavGroup[] = [
    {
      title: "ACADEMIC",
      items: [
        {
          key: "admissions",
          href: "/bs/admissions",
          label: "Admissions",
          module: MODULES.BS_ADMISSIONS,
          icon: UserPlus,
        },
        {
          key: "students",
          href: "/bs/students",
          label: "Students & Enrollment",
          module: MODULES.BS_STUDENTS,
          icon: Users,
        },
        {
          key: "programs",
          href: "/admin/departments-programs",
          label: "Programs & Depts",
          module: MODULES.BS_ACADEMIC_SETUP,
          icon: Building2,
        },
        {
          key: "courses",
          href: "/bs/courses",
          label: "Courses & Syllabus",
          module: MODULES.BS_COURSES,
          icon: BookOpen,
        },
        {
          key: "faculty",
          href: "/bs/faculty",
          label: "Faculty Members",
          module: MODULES.BS_STUDENTS,
          icon: UserCheck,
        },
        {
          key: "timetable",
          href: "/bs/timetable-datesheet",
          label: "Timetable & Datesheet",
          module: MODULES.BS_TIMETABLE,
          icon: Calendar,
        },
        {
          key: "examinations",
          href: "/bs/exams-results",
          label: "Examinations",
          module: MODULES.BS_EXAMS,
          icon: ClipboardCheck,
        },
        {
          key: "results-reports",
          href: "/bs/gazette",
          label: "Results & Reports",
          module: MODULES.BS_GAZETTE,
          icon: FileText,
        },
      ],
    },
    {
      title: "FINANCE",
      items: [
        {
          key: "fee-management",
          href: "/admin/fees",
          label: "Fee Management",
          module: MODULES.BS_FEES,
          icon: CreditCard,
        },
        {
          key: "challan-management",
          href: "/bs/fees",
          label: "Challan Management",
          module: MODULES.BS_FEES,
          icon: Receipt,
        },
        {
          key: "dues-payments",
          href: "/bs/fees",
          label: "Dues & Payments",
          module: MODULES.BS_FEES,
          icon: DollarSign,
        },
        {
          key: "expenses",
          href: "/admin/expenses",
          label: "Expenses",
          module: MODULES.ADMIN_EXPENSES,
          icon: Receipt,
        },
      ],
    },
    {
      title: "ADMINISTRATION",
      roles: ["SUPER_ADMIN", "COLLEGE_ADMIN"],
      items: [
        {
          key: "users-roles",
          href: "/admin/users",
          label: "Users & Roles",
          module: MODULES.ADMIN_USERS,
          icon: ShieldCheck,
        },
        {
          key: "settings",
          href: "/admin/settings",
          label: "College Settings",
          module: MODULES.ADMIN_SETTINGS,
          icon: Sliders,
        },
        {
          key: "audit-logs",
          href: "/admin/audit-logs",
          label: "Audit Logs",
          module: MODULES.ADMIN_AUDIT_LOGS,
          icon: History,
        },
      ],
    },
  ];

  const NAV_GROUPS = isCentral ? CENTRAL_NAV_GROUPS : COLLEGE_NAV_GROUPS;

  return (
    <aside className="flex flex-col w-64 bg-[#090E24] text-slate-100 h-screen border-r border-slate-800/90 select-none shadow-2xl z-30 flex-shrink-0 print:hidden">
      {/* Top Header Logo */}
      {isCentral ? (
        <div className="px-4 py-4 border-b border-slate-800/90 flex items-center gap-3 bg-[#070C1E] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          {/* Government Shield / Official Emblem */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 p-0.5 shadow-lg shadow-emerald-950/60">
              <div className="w-full h-full bg-[#090E24] rounded-[10px] flex items-center justify-center">
                <Landmark className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#090E24] rounded-full" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-wider uppercase">
                CHTE PORTAL
              </span>
              <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                CENTRAL
              </span>
            </div>
            <div className="text-[10px] font-semibold text-slate-300 truncate leading-snug mt-0.5">
              Higher & Technical Education
            </div>
            <div className="text-[8.5px] font-medium text-emerald-400/90 tracking-wide">
              Government of Balochistan
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 border-b border-slate-800/80 flex items-center gap-3 bg-[#080D21]">
          {collegeLogo ? (
            <img
              src={collegeLogo}
              alt="Logo"
              className="w-10 h-10 object-contain rounded-xl bg-slate-800/60 p-1 border border-slate-700/50"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-extrabold text-xs flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30 flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-extrabold text-white tracking-wider leading-snug uppercase truncate">
              {collegeName || "Govt. Degree College"}
            </div>
            <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
              CAMPUS ERP PORTAL
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 custom-scrollbar">
        {/* Main Dashboard / Overview Link */}
        <div>
          <Link
            href="/dashboard"
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              pathname === "/dashboard"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-bold scale-[1.01]"
                : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <LayoutDashboard
                className={`w-4 h-4 flex-shrink-0 ${
                  pathname === "/dashboard" ? "text-white" : "text-blue-400"
                }`}
              />
              <span className="truncate">
                {isCentral ? "Central Overview" : "Dashboard"}
              </span>
            </div>
            {isCentral && (
              <span className="text-[8.5px] font-bold px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                HQ
              </span>
            )}
          </Link>
        </div>

        {/* Categories */}
        {NAV_GROUPS.map((group) => {
          if (!isGroupVisible(group)) return null;
          const visibleItems = group.items.filter(isVisible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1 pt-1">
              <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {group.title}
              </div>
              <div className="space-y-0.5 mt-1">
                {visibleItems.map((item) => {
                  const ItemIcon = item.icon;
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const itemKey = item.key || `${group.title}-${item.label}`;
                  return (
                    <Link
                      key={itemKey}
                      href={item.href}
                      className={linkClass(item.href)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {ItemIcon && (
                          <ItemIcon
                            className={`w-4 h-4 flex-shrink-0 transition-colors ${
                              active
                                ? "text-white"
                                : "text-slate-400 group-hover:text-slate-200"
                            }`}
                          />
                        )}
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.badge && (
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3 h-3 transition-opacity ${
                            active
                              ? "text-white opacity-90"
                              : "text-slate-500 opacity-50 group-hover:opacity-100"
                          }`}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Card Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#070C1E]">
        <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200">
              <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs font-bold">
                {isCentral ? "CHTE Central Helpdesk" : "Need Help?"}
              </div>
            </div>
            {isCentral && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                Govt
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {isCentral
              ? "Central IT Cell & Support"
              : "Contact campus support team"}
          </p>
          <a
            href={
              isCentral
                ? "mailto:support@chte.gob.pk"
                : "mailto:support@college.edu"
            }
            className="block w-full text-center py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-xl transition-colors border border-slate-700/60"
          >
            {isCentral ? "CHTE Support" : "Get Support"}
          </a>
        </div>

        {/* User Quick Info */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg font-bold text-[10px] flex items-center justify-center border flex-shrink-0 ${
                isCentral
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
              }`}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {userName}
              </div>
              <div className="text-[9.5px] text-slate-400 truncate">
                {isCentral
                  ? role === "CHTE_ADMIN"
                    ? "CHTE Administrator"
                    : "Central Super Admin"
                  : userEmail}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}


