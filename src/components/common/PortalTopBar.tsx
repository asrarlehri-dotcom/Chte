"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, ExternalLink, Megaphone } from "lucide-react";
import { getRepresentativeColor, isLightColor } from "@/lib/theme-fill-compiler";
import { normalizeModulePath, parseStoredModuleOverrides } from "@/lib/portal-banner-config";

export function PortalTopBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [dutyData, setDutyData] = useState<any>(null);
  const [accentColor, setAccentColor] = useState<string>("#047857");

  const sessionUser = session?.user as any;
  const userName = sessionUser?.name || "College Admin";
  const userRole = (sessionUser?.role || "ADMIN").replace(/_/g, " ");
  const initials =
    userName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "CA";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const readEffectiveAccent = (overrideMapInput?: Record<string, any>, globalWaveInput?: any) => {
        const normPath = normalizeModulePath(pathname);
        const overrides =
          overrideMapInput ??
          parseStoredModuleOverrides(localStorage.getItem("college_banner_module_overrides"));
        const modWave = normPath ? overrides?.[normPath]?.pageBannerWaveColor : undefined;
        const baseWave = globalWaveInput ?? localStorage.getItem("college_banner_wave_color");
        const active = modWave !== undefined ? modWave : baseWave;
        if (active) {
          setAccentColor(getRepresentativeColor(active, "#047857"));
        } else {
          setAccentColor("#047857");
        }
      };

      readEffectiveAccent();

      const handleTheme = (e: any) => {
        readEffectiveAccent(
          e?.detail?.moduleBannerOverrides,
          e?.detail?.pageBannerWaveColor
        );
      };
      window.addEventListener("college-theme-change", handleTheme);
      return () => window.removeEventListener("college-theme-change", handleTheme);
    }
  }, [pathname]);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/faculty/duties", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setDutyData(data);
      })
      .catch(() => { });
  }, [session]);

  const ttCount = dutyData?.publishedTimetablesCount || 0;
  const dsCount = dutyData?.publishedDatesheetsCount || 0;
  const noticeCount = (ttCount > 0 ? 1 : 0) + (dsCount > 0 ? 1 : 0) || 1;

  const noticeText =
    dsCount > 0
      ? `Official Notice: ${dsCount} Exam Datesheet session(s) & ${ttCount} Timetable schedule(s) published.`
      : ttCount > 0
        ? `Official Notice: ${ttCount} active Class Timetable schedule(s) published for the current semester.`
        : "Official Notice: Academic schedules, exam datesheets & portal services are active.";

  const pillIsLight = isLightColor(accentColor);
  const pillTextClass = pillIsLight ? "text-slate-900" : "text-white";
  const pillSubTextClass = pillIsLight ? "text-slate-800 hover:text-slate-950 border-slate-900/20" : "text-white/85 hover:text-white border-white/25";

  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 md:px-8 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs print:hidden">
      {/* Left: Dynamic Accent Official Notice Pill */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Link
          href="/bs/timetable-datesheet"
          className={`inline-flex items-center gap-2 ${pillTextClass} px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs hover:brightness-110 truncate max-w-full`}
          style={{ backgroundColor: accentColor }}
        >
          <Megaphone className="w-3.5 h-3.5 flex-shrink-0 opacity-90" />
          <span className="truncate">{noticeText}</span>
          <span className={`${pillSubTextClass} flex items-center gap-1 text-[11px] font-semibold border-l pl-2.5 ml-1 flex-shrink-0`}>
            View Details <ExternalLink className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {/* Right: Notification Bell + User Profile Badge */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          href="/bs/timetable-datesheet"
          className="p-2 text-slate-600 hover:text-emerald-800 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-colors relative"
          title="Notifications & Published Schedules"
        >
          <Bell className="w-4 h-4 text-slate-800" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
            {noticeCount}
          </span>
        </Link>

        <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200">
          <div
            className={`w-8 h-8 rounded-full ${pillTextClass} font-bold text-xs flex items-center justify-center uppercase shadow-xs ring-2 ring-slate-100`}
            style={{ backgroundColor: accentColor }}
          >
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-black text-slate-900 leading-none">{userName}</div>
            <div
              className="text-[10px] font-semibold mt-0.5 uppercase tracking-wide"
              style={{ color: pillIsLight ? "#334155" : accentColor }}
            >
              {userRole}
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </div>
      </div>
    </div>
  );
}
