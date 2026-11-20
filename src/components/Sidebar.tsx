"use client";

import { useState, useEffect } from "react";
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
  const { collegeName, collegeLogo, collegeSidebarBg, collegeNameColor: hookCollegeNameColor, collegeHeaderBg: hookCollegeHeaderBg } = useSettings();
  const [chteGovtLogo, setChteGovtLogo] = useState<string>("/balochistan-seal.png");

  const sessionUser = session?.user as any;
  const role = sessionUser?.role as string;
  const userName = sessionUser?.name || "Administrator";
  const userEmail = sessionUser?.email || "admin@chte.gob.pk";
  const initials =
    userName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "AD";

  // Central CHTE login vs College-specific campus login
  const isCentral =
    role === "CHTE_ADMIN" || role === "SUPER_ADMIN" || !sessionUser?.collegeId;

  // Dynamic College Sidebar Background Color (Theme Settings)
  const [sidebarBgColor, setSidebarBgColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const cCode = sessionUser?.collegeCode || (sessionUser?.email ? sessionUser.email.split("@")[1]?.split(".")[0] : "");
        if (cCode) {
          const cached = localStorage.getItem(`college_sidebar_${cCode.toLowerCase()}`);
          if (cached) return cached;
        }
        if (sessionUser?.collegeId) {
          const cachedId = localStorage.getItem(`college_sidebar_${sessionUser.collegeId.toLowerCase()}`);
          if (cachedId) return cachedId;
        }
      } catch {}
    }
    return "#090E24";
  });

  // Dynamic College Name Color (Theme Settings)
  const [collegeNameColor, setCollegeNameColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const cCode = sessionUser?.collegeCode || (sessionUser?.email ? sessionUser.email.split("@")[1]?.split(".")[0] : "");
        if (cCode) {
          const cached = localStorage.getItem(`college_name_color_${cCode.toLowerCase()}`);
          if (cached) return cached;
        }
        if (sessionUser?.collegeId) {
          const cachedId = localStorage.getItem(`college_name_color_${sessionUser.collegeId.toLowerCase()}`);
          if (cachedId) return cachedId;
        }
      } catch {}
    }
    return "#0f172a";
  });

  // Dynamic College Header Background Color (Theme Settings)
  const [collegeHeaderBg, setCollegeHeaderBg] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const cCode = sessionUser?.collegeCode || (sessionUser?.email ? sessionUser.email.split("@")[1]?.split(".")[0] : "");
        if (cCode) {
          const cached = localStorage.getItem(`college_header_bg_${cCode.toLowerCase()}`);
          if (cached) return cached;
        }
        if (sessionUser?.collegeId) {
          const cachedId = localStorage.getItem(`college_header_bg_${sessionUser.collegeId.toLowerCase()}`);
          if (cachedId) return cachedId;
        }
      } catch {}
    }
    return "#ffffff";
  });

  // Dynamic College Display Name (Theme Settings)
  const [collegeDisplayName, setCollegeDisplayName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const cCode = sessionUser?.collegeCode || (sessionUser?.email ? sessionUser.email.split("@")[1]?.split(".")[0] : "");
        if (cCode) {
          const cached = localStorage.getItem(`college_name_${cCode.toLowerCase()}`);
          if (cached) return cached;
        }
        if (sessionUser?.collegeId) {
          const cachedId = localStorage.getItem(`college_name_${sessionUser.collegeId.toLowerCase()}`);
          if (cachedId) return cachedId;
        }
      } catch {}
    }
    return collegeName || "Govt. Degree College";
  });

  // Dynamic Campus Subtitle (e.g. CAMPUS ERP PORTAL)
  const [portalSubtitle, setPortalSubtitle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const cCode = sessionUser?.collegeCode || (sessionUser?.email ? sessionUser.email.split("@")[1]?.split(".")[0] : "");
        if (cCode) {
          const cached = localStorage.getItem(`college_subtitle_${cCode.toLowerCase()}`);
          if (cached) return cached;
        }
        if (sessionUser?.collegeId) {
          const cachedId = localStorage.getItem(`college_subtitle_${sessionUser.collegeId.toLowerCase()}`);
          if (cachedId) return cachedId;
        }
      } catch {}
    }
    return "CAMPUS ERP PORTAL";
  });

  // Dynamic Subtitle Font Color
  const [portalSubtitleColor, setPortalSubtitleColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const cCode = sessionUser?.collegeCode || (sessionUser?.email ? sessionUser.email.split("@")[1]?.split(".")[0] : "");
        if (cCode) {
          const cached = localStorage.getItem(`college_subtitle_color_${cCode.toLowerCase()}`);
          if (cached) return cached;
        }
      } catch {}
    }
    return "#4338ca";
  });

  useEffect(() => {
    if (collegeName) {
      setCollegeDisplayName(collegeName);
    }
  }, [collegeName]);

  useEffect(() => {
    if (collegeSidebarBg && collegeSidebarBg !== "#090E24") {
      setSidebarBgColor(collegeSidebarBg);
    }
  }, [collegeSidebarBg]);

  useEffect(() => {
    if (hookCollegeNameColor && hookCollegeNameColor !== "#0f172a") {
      setCollegeNameColor(hookCollegeNameColor);
    }
  }, [hookCollegeNameColor]);

  useEffect(() => {
    if (hookCollegeHeaderBg && hookCollegeHeaderBg !== "#ffffff") {
      setCollegeHeaderBg(hookCollegeHeaderBg);
    }
  }, [hookCollegeHeaderBg]);

  useEffect(() => {
    const collegeKey = sessionUser?.collegeId || sessionUser?.collegeCode;
    if (!isCentral && collegeKey) {
      fetch(`/api/colleges/${encodeURIComponent(collegeKey)}/portal-settings`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.sidebarColor) {
            setSidebarBgColor(data.sidebarColor);
            if (typeof window !== "undefined") {
              try {
                if (sessionUser?.collegeCode) {
                  localStorage.setItem(`college_sidebar_${sessionUser.collegeCode.toLowerCase()}`, data.sidebarColor);
                }
                if (sessionUser?.collegeId) {
                  localStorage.setItem(`college_sidebar_${sessionUser.collegeId.toLowerCase()}`, data.sidebarColor);
                }
              } catch {}
            }
          }
          if (data?.collegeNameColor) {
            setCollegeNameColor(data.collegeNameColor);
            if (typeof window !== "undefined") {
              try {
                if (sessionUser?.collegeCode) {
                  localStorage.setItem(`college_name_color_${sessionUser.collegeCode.toLowerCase()}`, data.collegeNameColor);
                }
                if (sessionUser?.collegeId) {
                  localStorage.setItem(`college_name_color_${sessionUser.collegeId.toLowerCase()}`, data.collegeNameColor);
                }
              } catch {}
            }
          }
          if (data?.collegeHeaderBg) {
            setCollegeHeaderBg(data.collegeHeaderBg);
            if (typeof window !== "undefined") {
              try {
                if (sessionUser?.collegeCode) {
                  localStorage.setItem(`college_header_bg_${sessionUser.collegeCode.toLowerCase()}`, data.collegeHeaderBg);
                }
                if (sessionUser?.collegeId) {
                  localStorage.setItem(`college_header_bg_${sessionUser.collegeId.toLowerCase()}`, data.collegeHeaderBg);
                }
              } catch {}
            }
          }
          if (data?.collegeName) {
            setCollegeDisplayName(data.collegeName);
            if (typeof window !== "undefined") {
              try {
                if (sessionUser?.collegeCode) {
                  localStorage.setItem(`college_name_${sessionUser.collegeCode.toLowerCase()}`, data.collegeName);
                }
                if (sessionUser?.collegeId) {
                  localStorage.setItem(`college_name_${sessionUser.collegeId.toLowerCase()}`, data.collegeName);
                }
              } catch {}
            }
          }
          if (data?.portalSubtitle) {
            setPortalSubtitle(data.portalSubtitle);
            if (typeof window !== "undefined") {
              try {
                if (sessionUser?.collegeCode) {
                  localStorage.setItem(`college_subtitle_${sessionUser.collegeCode.toLowerCase()}`, data.portalSubtitle);
                }
                if (sessionUser?.collegeId) {
                  localStorage.setItem(`college_subtitle_${sessionUser.collegeId.toLowerCase()}`, data.portalSubtitle);
                }
              } catch {}
            }
          }
          if (data?.portalSubtitleColor) {
            setPortalSubtitleColor(data.portalSubtitleColor);
            if (typeof window !== "undefined") {
              try {
                if (sessionUser?.collegeCode) {
                  localStorage.setItem(`college_subtitle_color_${sessionUser.collegeCode.toLowerCase()}`, data.portalSubtitleColor);
                }
                if (sessionUser?.collegeId) {
                  localStorage.setItem(`college_subtitle_color_${sessionUser.collegeId.toLowerCase()}`, data.portalSubtitleColor);
                }
              } catch {}
            }
          }
        })
        .catch(() => {});
    }

    const handleThemeEvent = (e: any) => {
      if (e?.detail?.sidebarColor) {
        setSidebarBgColor(e.detail.sidebarColor);
      }
      if (e?.detail?.collegeNameColor) {
        setCollegeNameColor(e.detail.collegeNameColor);
      }
      if (e?.detail?.collegeHeaderBg) {
        setCollegeHeaderBg(e.detail.collegeHeaderBg);
      }
      if (e?.detail?.collegeName) {
        setCollegeDisplayName(e.detail.collegeName);
      }
      if (e?.detail?.portalSubtitle) {
        setPortalSubtitle(e.detail.portalSubtitle);
      }
      if (e?.detail?.portalSubtitleColor) {
        setPortalSubtitleColor(e.detail.portalSubtitleColor);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("college-theme-change", handleThemeEvent);
      return () => window.removeEventListener("college-theme-change", handleThemeEvent);
    }
  }, [isCentral, sessionUser?.collegeId, sessionUser?.collegeCode]);

  useEffect(() => {
    if (isCentral) {
      fetch("/api/chte-settings")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.govtLogo) setChteGovtLogo(data.govtLogo);
        })
        .catch(() => {});
    }
  }, [isCentral]);

  if (!session) return null;

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
    return `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${active
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
          key: "chte-master-dashboard",
          href: "/chte",
          label: "CHTE Master Dashboard",
          badge: "HQ",
          icon: LayoutDashboard,
        },
        {
          key: "chte-colleges",
          href: "/chte/colleges",
          label: "Colleges Management",
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
          key: "permissions",
          href: "/admin/permissions",
          label: "Role Permissions",
          module: MODULES.ADMIN_PERMISSIONS,
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
    <aside
      className="flex flex-col w-64 text-slate-100 h-screen border-r border-white/10 select-none shadow-2xl z-30 flex-shrink-0 print:hidden transition-colors duration-300"
      style={{ backgroundColor: isCentral ? "#090E24" : sidebarBgColor }}
    >
      {/* Top Header Logo */}
      {isCentral ? (
        <div className="px-4 py-4 border-b border-slate-800/90 flex items-center gap-3 bg-[#070C1E] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          {/* Government Official Emblem */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 p-0.5 shadow-lg shadow-emerald-950/60 flex items-center justify-center">
              <img
                src={chteGovtLogo || "/balochistan-seal.png"}
                alt="Government of Balochistan"
                className="w-9 h-9 object-contain rounded-[9px] bg-[#090E24] p-0.5"
                onError={(e) => {
                  e.currentTarget.src = "/balochistan-seal.png";
                }}
              />
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
        /* College Campus Header with Custom Background and Full Name */
        <div 
          className="px-4 py-3.5 border-b border-slate-200/90 flex items-center gap-3 shadow-xs transition-colors duration-200"
          style={{ backgroundColor: collegeHeaderBg || "#ffffff" }}
        >
          {collegeLogo ? (
            <img
              src={collegeLogo}
              alt={collegeName || "Logo"}
              className="w-11 h-11 object-contain flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.parentElement?.querySelector(".sidebar-fallback-badge") as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="sidebar-fallback-badge w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/20 border border-indigo-200 flex-shrink-0"
            style={{ display: collegeLogo ? "none" : "flex" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="text-xs font-black tracking-wide leading-tight uppercase line-clamp-2 transition-colors duration-200"
              style={{ color: collegeNameColor || "#0f172a" }}
              title={collegeDisplayName || collegeName || "Govt. Degree College"}
            >
              {collegeDisplayName || collegeName || "Govt. Degree College"}
            </div>
            <div 
              className="text-[9px] font-black uppercase tracking-wider mt-0.5 flex items-center gap-1.5 transition-colors duration-200"
              style={{ color: portalSubtitleColor || "#4338ca" }}
            >
              <span>{portalSubtitle || "CAMPUS ERP PORTAL"}</span>
              {sessionUser?.collegeCode && (
                <span className="text-[8px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-200/60 font-black">
                  {sessionUser.collegeCode}
                </span>
              )}
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
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${pathname === "/dashboard"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-bold scale-[1.01]"
              : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <LayoutDashboard
                className={`w-4 h-4 flex-shrink-0 ${pathname === "/dashboard" ? "text-white" : "text-blue-400"
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
                            className={`w-4 h-4 flex-shrink-0 transition-colors ${active
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
                          className={`w-3 h-3 transition-opacity ${active
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
      <div className="p-3.5 border-t border-white/10 bg-black/25 backdrop-blur-xs">
        <div className="bg-black/30 rounded-2xl p-3 border border-white/10 space-y-2">
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
          <p className="text-[10px] text-slate-300 font-medium">
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
            className="block w-full text-center py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] rounded-xl transition-colors border border-white/15"
          >
            {isCentral ? "CHTE Support" : "Get Support"}
          </a>
        </div>

        {/* User Quick Info */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg font-bold text-[10px] flex items-center justify-center border flex-shrink-0 ${isCentral
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
              <div className="text-[9.5px] text-slate-300 truncate">
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
            className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}


