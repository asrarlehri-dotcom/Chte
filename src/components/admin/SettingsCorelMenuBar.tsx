"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export type SettingsTabId =
  | "CHTE_SETTINGS"
  | "COLLEGE_PORTAL"
  | "ACADEMIC"
  | "FEES"
  | "PERMISSIONS";

export interface CorelSubItem {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  tab: SettingsTabId;
  subTab?: string;
  scrollId?: string;
  dividerBefore?: boolean;
}

export interface CorelMenuItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string;
  tab: SettingsTabId;
  subTab?: string;
  scrollId?: string;
  dividerBefore?: boolean;
  children?: CorelSubItem[];
}

export interface CorelTopMenu {
  tab: SettingsTabId;
  label: string;
  icon: string;
  badge?: string;
  badgeClass?: string;
  activeClass: string;
  headerTitle: string;
  visible: boolean;
  items: CorelMenuItem[];
}

export interface SettingsCorelMenuBarProps {
  isChteAdmin: boolean;
  activeTab: SettingsTabId;
  activePortalSub: string;
  activeAcademicSub: string;
  activeFeeSub: string;
  permissionCategory: string;
  onSelect: (opts: {
    tab: SettingsTabId;
    subTab?: string;
    scrollId?: string;
  }) => void;
}

export default function SettingsCorelMenuBar({
  isChteAdmin,
  activeTab,
  activePortalSub,
  activeAcademicSub,
  activeFeeSub,
  permissionCategory,
  onSelect,
}: SettingsCorelMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<SettingsTabId | null>(null);
  const [hoveredItemKey, setHoveredItemKey] = useState<string | null>(null);
  const [expandedMobileKey, setExpandedMobileKey] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpenMenu(null);
      setHoveredItemKey(null);
    }, 150);
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setHoveredItemKey(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      clearCloseTimer();
    };
  }, []);

  const topMenus: CorelTopMenu[] = [
    {
      tab: "CHTE_SETTINGS",
      label: "HEMIS Main Settings",
      icon: "🏛️",
      badge: "Apex",
      badgeClass: "bg-emerald-400/20 text-emerald-300",
      activeClass: "bg-[#0c5938] text-white shadow-sm font-black",
      headerTitle: "HEMIS Apex Portal Modules:",
      visible: isChteAdmin,
      items: [
        {
          id: "hemis-logo",
          label: "Govt Logo & HEMIS Seal",
          icon: "🏛️",
          tab: "CHTE_SETTINGS",
          scrollId: "hemis-sec-0",
        },
        {
          id: "hemis-theme",
          label: "Provincial Theme & Scenery",
          icon: "🎨",
          tab: "CHTE_SETTINGS",
          dividerBefore: true,
          children: [
            {
              id: "hemis-bg",
              label: "Background & Primary Accent",
              icon: "🎨",
              tab: "CHTE_SETTINGS",
              scrollId: "hemis-sec-1",
            },
            {
              id: "hemis-scenery",
              label: "Hero Scenery Photo & Zoom",
              icon: "🏔️",
              tab: "CHTE_SETTINGS",
              scrollId: "hemis-sec-2",
            },
          ],
        },
        {
          id: "hemis-content",
          label: "Headlines, Ticker & Profiles",
          icon: "📢",
          tab: "CHTE_SETTINGS",
          children: [
            {
              id: "hemis-headings",
              label: "Homepage Headlines & Motto",
              icon: "📝",
              tab: "CHTE_SETTINGS",
              scrollId: "hemis-sec-3",
            },
            {
              id: "hemis-ticker",
              label: "Animated Broadcast News Ticker",
              icon: "📰",
              tab: "CHTE_SETTINGS",
              scrollId: "hemis-sec-4",
            },
            {
              id: "hemis-profiles",
              label: "Featured Leadership Profiles",
              icon: "👔",
              tab: "CHTE_SETTINGS",
              scrollId: "hemis-sec-5",
            },
          ],
        },
      ],
    },
    {
      tab: "COLLEGE_PORTAL",
      label: "College Portals & Themes",
      icon: "🏫",
      badge: "Colleges",
      badgeClass: "bg-slate-200 text-slate-800 font-black",
      activeClass: "bg-slate-900 text-white shadow-sm font-black",
      headerTitle: "Portal & Theme Sub-Settings:",
      visible: true,
      items: [
        {
          id: "portal-all",
          label: "All Portal Settings (Show Everything)",
          icon: "📑",
          tab: "COLLEGE_PORTAL",
          subTab: "ALL",
        },
        {
          id: "portal-theme-group",
          label: "Theme Colors & Presets",
          icon: "🎨",
          tab: "COLLEGE_PORTAL",
          subTab: "THEME_COLORS",
          dividerBefore: true,
          children: [
            {
              id: "portal-theme-all",
              label: "All Theme Color Cards",
              icon: "🎨",
              tab: "COLLEGE_PORTAL",
              subTab: "THEME_COLORS",
            },
            {
              id: "portal-presets",
              label: "1-Click Theme Presets Gallery",
              icon: "✨",
              tab: "COLLEGE_PORTAL",
              subTab: "THEME_COLORS",
              scrollId: "portal-sec-presets",
              dividerBefore: true,
            },
            {
              id: "portal-ribbon",
              label: 'Top Accent Ribbon ("Red Patii")',
              icon: "🎗️",
              tab: "COLLEGE_PORTAL",
              subTab: "THEME_COLORS",
              scrollId: "portal-card-ribbonColor",
            },
            {
              id: "portal-primary",
              label: "Primary Header Background",
              icon: "🖼️",
              tab: "COLLEGE_PORTAL",
              subTab: "THEME_COLORS",
              scrollId: "portal-card-primaryColor",
            },
            {
              id: "portal-body",
              label: "Overall Portal Background",
              icon: "🌌",
              tab: "COLLEGE_PORTAL",
              subTab: "THEME_COLORS",
              scrollId: "portal-card-bodyBgColor",
            },
            {
              id: "portal-sidebar",
              label: "Sidebar ERP Background",
              icon: "🧭",
              tab: "COLLEGE_PORTAL",
              subTab: "THEME_COLORS",
              scrollId: "portal-card-sidebarColor",
            },
            {
              id: "portal-palette",
              label: "Custom Color Palette Manager",
              icon: "🎯",
              tab: "COLLEGE_PORTAL",
              subTab: "THEME_COLORS",
              scrollId: "portal-sec-palette",
              dividerBefore: true,
            },
          ],
        },
        {
          id: "portal-banner-group",
          label: "Header Banner & Side Ribbons",
          icon: "🏞️",
          tab: "COLLEGE_PORTAL",
          subTab: "BANNER_RIBBONS",
          children: [
            {
              id: "portal-banner-studio",
              label: "All Banner & Wave Ribbon Settings",
              icon: "🏞️",
              tab: "COLLEGE_PORTAL",
              subTab: "BANNER_RIBBONS",
            },
            {
              id: "portal-module-scope",
              label: "Per-Module Picture & Ribbon Override",
              icon: "🗂️",
              tab: "COLLEGE_PORTAL",
              subTab: "BANNER_RIBBONS",
              scrollId: "portal-module-scope",
              dividerBefore: true,
            },
            {
              id: "portal-banner-pic",
              label: "Banner Picture, Size, Zoom & Position",
              icon: "🖼️",
              tab: "COLLEGE_PORTAL",
              subTab: "BANNER_RIBBONS",
              scrollId: "portal-card-pageBannerBg",
            },
            {
              id: "portal-banner-wave",
              label: "Side Wave Ribbons (Color & Opacity)",
              icon: "🌊",
              tab: "COLLEGE_PORTAL",
              subTab: "BANNER_RIBBONS",
              scrollId: "portal-card-pageBannerWaveColor",
            },
            {
              id: "portal-banner-preview",
              label: "Live Header Banner Preview",
              icon: "👁️",
              tab: "COLLEGE_PORTAL",
              subTab: "BANNER_RIBBONS",
              scrollId: "portal-banner-preview",
            },
          ],
        },
        {
          id: "portal-typography-group",
          label: "College Header, Name & Logo",
          icon: "🔤",
          tab: "COLLEGE_PORTAL",
          subTab: "HEADER_TYPOGRAPHY",
          children: [
            {
              id: "portal-header-box",
              label: "College Header Box Background",
              icon: "🪧",
              tab: "COLLEGE_PORTAL",
              subTab: "HEADER_TYPOGRAPHY",
              scrollId: "portal-card-collegeHeaderBg",
            },
            {
              id: "portal-name-font",
              label: "College Name & MS Word Font Style",
              icon: "🅰️",
              tab: "COLLEGE_PORTAL",
              subTab: "HEADER_TYPOGRAPHY",
              scrollId: "portal-card-collegeNameColor",
            },
            {
              id: "portal-emblem-upload",
              label: "College Identity, Emblem & BG Remover",
              icon: "🪪",
              tab: "COLLEGE_PORTAL",
              subTab: "IDENTITY_PROFILES",
              scrollId: "portal-sec-identity",
              dividerBefore: true,
            },
          ],
        },
        {
          id: "portal-hero-group",
          label: "Hero Media, Slides & Ticker",
          icon: "🎬",
          tab: "COLLEGE_PORTAL",
          subTab: "HERO_TICKER",
          dividerBefore: true,
          children: [
            {
              id: "portal-hero-slides",
              label: "Hero Background Photos & Video",
              icon: "📸",
              tab: "COLLEGE_PORTAL",
              subTab: "HERO_TICKER",
              scrollId: "portal-sec-hero",
            },
            {
              id: "portal-flash-ticker",
              label: "Development Notice & Flash Ticker",
              icon: "📢",
              tab: "COLLEGE_PORTAL",
              subTab: "HERO_TICKER",
              scrollId: "portal-sec-ticker",
            },
          ],
        },
        {
          id: "portal-profiles-group",
          label: "Leadership Profiles & Social",
          icon: "👥",
          tab: "COLLEGE_PORTAL",
          subTab: "IDENTITY_PROFILES",
          children: [
            {
              id: "portal-identity-details",
              label: "College Address, Contact & Logo",
              icon: "🏫",
              tab: "COLLEGE_PORTAL",
              subTab: "IDENTITY_PROFILES",
              scrollId: "portal-sec-identity",
            },
            {
              id: "portal-leadership",
              label: "Featured Principal, Deans & Faculty",
              icon: "👔",
              tab: "COLLEGE_PORTAL",
              subTab: "IDENTITY_PROFILES",
              scrollId: "portal-sec-profiles",
            },
            {
              id: "portal-social",
              label: "Social Media Links (X, FB, YT, LI)",
              icon: "🌐",
              tab: "COLLEGE_PORTAL",
              subTab: "IDENTITY_PROFILES",
              scrollId: "portal-sec-social",
            },
          ],
        },
      ],
    },
    {
      tab: "ACADEMIC",
      label: "Academic Setup",
      icon: "🏬",
      activeClass: "bg-white text-blue-600 shadow-sm border border-gray-100 font-black",
      headerTitle: "Academic Sub-Settings:",
      visible: !isChteAdmin,
      items: [
        {
          id: "acad-all",
          label: "Show All Academic Sections",
          icon: "📑",
          tab: "ACADEMIC",
          subTab: "ALL",
        },
        {
          id: "acad-depts-group",
          label: "Departments & HODs",
          icon: "🏬",
          tab: "ACADEMIC",
          subTab: "depts-list",
          dividerBefore: true,
          children: [
            {
              id: "acad-depts-list",
              label: "Departments List & HODs",
              icon: "📋",
              tab: "ACADEMIC",
              subTab: "depts-list",
              scrollId: "sec-depts-list",
            },
            {
              id: "acad-add-dept",
              label: "Add New Department",
              icon: "➕",
              tab: "ACADEMIC",
              subTab: "add-dept",
              scrollId: "sec-add-dept",
            },
          ],
        },
        {
          id: "acad-progs-group",
          label: "Programs & Subject Groups",
          icon: "📚",
          tab: "ACADEMIC",
          subTab: "programs-list",
          children: [
            {
              id: "acad-progs-list",
              label: "Programs & Groups Setup",
              icon: "📚",
              tab: "ACADEMIC",
              subTab: "programs-list",
              scrollId: "sec-programs-list",
            },
            {
              id: "acad-add-prog",
              label: "Add New Program",
              icon: "🎓",
              tab: "ACADEMIC",
              subTab: "add-program",
              scrollId: "sec-add-program",
            },
          ],
        },
        {
          id: "acad-identity-group",
          label: "Identity & Academic Sessions",
          icon: "🏫",
          tab: "ACADEMIC",
          subTab: "college-identity",
          dividerBefore: true,
          children: [
            {
              id: "acad-identity",
              label: "College Name, Logo & Slides",
              icon: "🏫",
              tab: "ACADEMIC",
              subTab: "college-identity",
              scrollId: "sec-college-identity",
            },
            {
              id: "acad-sessions",
              label: "Academic Sessions Manager",
              icon: "📅",
              tab: "ACADEMIC",
              subTab: "college-identity",
              scrollId: "sec-academic-sessions",
            },
          ],
        },
      ],
    },
    {
      tab: "FEES",
      label: "Fee & Challan Settings",
      icon: "💰",
      activeClass: "bg-white text-blue-600 shadow-sm border border-gray-100 font-black",
      headerTitle: "Fee Sub-Settings:",
      visible: !isChteAdmin,
      items: [
        {
          id: "fees-all",
          label: "Show All Fee Sections",
          icon: "📑",
          tab: "FEES",
          subTab: "ALL",
        },
        {
          id: "fees-rates-group",
          label: "Fee Rates & Overrides",
          icon: "💵",
          tab: "FEES",
          subTab: "base-fees",
          dividerBefore: true,
          children: [
            {
              id: "fees-base",
              label: "Base Fee Rates Setup",
              icon: "💵",
              tab: "FEES",
              subTab: "base-fees",
              scrollId: "sec-base-fees",
            },
            {
              id: "fees-session",
              label: "Session Fee Overrides",
              icon: "📅",
              tab: "FEES",
              subTab: "session-overrides",
              scrollId: "sec-session-overrides",
            },
          ],
        },
        {
          id: "fees-bank-group",
          label: "Bank & Challan Templates",
          icon: "🏛️",
          tab: "FEES",
          subTab: "bank-details",
          children: [
            {
              id: "fees-bank-cfg",
              label: "Bank Account & Branch Code",
              icon: "🏦",
              tab: "FEES",
              subTab: "bank-details",
              scrollId: "sec-bank-details",
            },
          ],
        },
      ],
    },
    {
      tab: "PERMISSIONS",
      label: "Permissions Matrix",
      icon: "🔐",
      activeClass: "bg-white text-blue-600 shadow-sm border border-gray-100 font-black",
      headerTitle: "Permissions Sub-Settings:",
      visible: true,
      items: [
        {
          id: "perm-matrix-group",
          label: "Role Access Matrix",
          icon: "🛡️",
          tab: "PERMISSIONS",
          subTab: "ALL",
          children: [
            {
              id: "perm-all",
              label: "All System Modules",
              icon: "🌐",
              tab: "PERMISSIONS",
              subTab: "ALL",
              scrollId: "sec-permissions-grid",
            },
            {
              id: "perm-bs",
              label: "BS Degree Modules Only",
              icon: "🎓",
              tab: "PERMISSIONS",
              subTab: "BS",
              scrollId: "sec-permissions-grid",
            },
            {
              id: "perm-inter",
              label: "Intermediate Modules Only",
              icon: "📘",
              tab: "PERMISSIONS",
              subTab: "INTER",
              scrollId: "sec-permissions-grid",
            },
            {
              id: "perm-admin",
              label: "Administration Modules Only",
              icon: "⚙️",
              tab: "PERMISSIONS",
              subTab: "ADMIN",
              scrollId: "sec-permissions-grid",
            },
          ],
        },
      ],
    },
  ];

  const isSubSelected = (tab: SettingsTabId, subTab?: string): boolean => {
    if (activeTab !== tab || !subTab) return false;
    if (tab === "COLLEGE_PORTAL") return activePortalSub === subTab;
    if (tab === "ACADEMIC") return activeAcademicSub === subTab;
    if (tab === "FEES") return activeFeeSub === subTab;
    if (tab === "PERMISSIONS") return permissionCategory === subTab;
    return false;
  };

  const handleTrigger = (tab: SettingsTabId, subTab?: string, scrollId?: string) => {
    onSelect({ tab, subTab, scrollId });
    setOpenMenu(null);
    setHoveredItemKey(null);
    setExpandedMobileKey(null);
  };

  return (
    <div
      ref={barRef}
      className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200/80 relative z-40"
    >
      <div className="flex flex-wrap bg-gray-50 p-1.5 rounded-xl border border-gray-200/60 max-w-6xl gap-1.5 overflow-visible relative">
        {topMenus
          .filter((m) => m.visible)
          .map((menu) => {
            const isOpen = openMenu === menu.tab;
            const isActive = activeTab === menu.tab;
            return (
              <div
                key={menu.tab}
                className="relative"
                onMouseEnter={() => {
                  clearCloseTimer();
                  setOpenMenu(menu.tab);
                }}
                onMouseLeave={scheduleClose}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect({ tab: menu.tab });
                    setOpenMenu((prev) => (prev === menu.tab ? null : menu.tab));
                  }}
                  className={`py-2.5 px-3.5 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? menu.activeClass
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/80"
                  }`}
                >
                  <span>{menu.icon}</span>
                  <span>{menu.label}</span>
                  {menu.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${menu.badgeClass || ""}`}>
                      {menu.badge}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isOpen ? "rotate-180" : ""
                    } ${isActive ? "opacity-90" : "text-gray-400"}`}
                  />
                </button>

                {/* Level-1 CorelDRAW-Style Menu Dropdown */}
                {isOpen && (
                  <div
                    onMouseEnter={clearCloseTimer}
                    onMouseLeave={scheduleClose}
                    className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-300/90 rounded-xl shadow-2xl py-1.5 z-50 text-slate-800"
                  >
                    <div className="px-3.5 py-1.5 mb-1 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{menu.headerTitle}</span>
                      <span className="font-mono text-[9px] text-slate-300">▸ Flyout</span>
                    </div>

                    {menu.items.map((item) => {
                      const hasChildren = Boolean(item.children && item.children.length > 0);
                      const isRowHovered = hoveredItemKey === item.id;
                      const isRowMobileOpen = expandedMobileKey === item.id;
                      const activeLeaf = !hasChildren && isSubSelected(item.tab, item.subTab);

                      return (
                        <React.Fragment key={item.id}>
                          {item.dividerBefore && <div className="my-1 border-t border-slate-100" />}

                          <div
                            className="relative"
                            onMouseEnter={() => {
                              clearCloseTimer();
                              setHoveredItemKey(item.id);
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (hasChildren) {
                                  // Desktop hover handles flyout; click activates the group OR toggles mobile accordion
                                  setExpandedMobileKey((prev) =>
                                    prev === item.id ? null : item.id
                                  );
                                  handleTrigger(item.tab, item.subTab, item.scrollId);
                                } else {
                                  handleTrigger(item.tab, item.subTab, item.scrollId);
                                }
                              }}
                              className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                isRowHovered || activeLeaf
                                  ? "bg-sky-50 text-sky-900 border-l-2 border-sky-500 pl-2.5 font-bold"
                                  : "text-slate-700 hover:bg-sky-50/70 hover:text-sky-900"
                              }`}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <span className="w-4 text-center flex-shrink-0">
                                  {item.icon || "•"}
                                </span>
                                <span className="truncate">{item.label}</span>
                              </span>

                              {hasChildren && (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              )}
                            </button>

                            {/* Level-2 CorelDRAW Cascading Flyout Sub-Bullets */}
                            {hasChildren && (isRowHovered || isRowMobileOpen) && (
                              <div
                                onMouseEnter={() => {
                                  clearCloseTimer();
                                  setHoveredItemKey(item.id);
                                }}
                                className="md:absolute md:left-full md:-top-1 md:ml-0.5 md:w-72 md:bg-white md:border md:border-slate-300/90 md:rounded-xl md:shadow-2xl md:py-1.5 z-50 bg-slate-50/90 border-l-2 border-sky-200 ml-4 md:ml-0.5"
                              >
                                <div className="hidden md:flex px-3.5 py-1 mb-1 border-b border-slate-100 text-[10px] font-extrabold text-sky-700 uppercase tracking-wider items-center gap-1.5">
                                  <span>{item.icon}</span>
                                  <span className="truncate">{item.label}</span>
                                </div>

                                {item.children!.map((sub) => {
                                  const subActive =
                                    isSubSelected(sub.tab, sub.subTab) && !sub.scrollId;
                                  return (
                                    <React.Fragment key={sub.id}>
                                      {sub.dividerBefore && (
                                        <div className="my-1 border-t border-slate-100" />
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTrigger(sub.tab, sub.subTab, sub.scrollId);
                                        }}
                                        className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                                          subActive
                                            ? "bg-sky-100 text-sky-950 font-bold"
                                            : "text-slate-700 hover:bg-sky-50 hover:text-sky-900"
                                        }`}
                                      >
                                        <span className="text-[10px] text-sky-600 flex-shrink-0">
                                          •
                                        </span>
                                        <span className="w-4 text-center flex-shrink-0">
                                          {sub.icon || ""}
                                        </span>
                                        <span className="truncate">{sub.label}</span>
                                      </button>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
