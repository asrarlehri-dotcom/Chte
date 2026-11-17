"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bell, Calendar, ClipboardList, X, ArrowRight, Sparkles } from "lucide-react";

export function NotificationBar() {
  const { data: session } = useSession();
  const [dutyData, setDutyData] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    fetch("/api/faculty/duties", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && (data.publishedTimetablesCount > 0 || data.publishedDatesheetsCount > 0)) {
          setDutyData(data);
        }
      })
      .catch(() => {});
  }, [session]);

  if (!session || dismissed || !dutyData) return null;

  const role = (session.user as any)?.role || "";
  const collegeId = (session.user as any)?.collegeId;
  const isCentral = role === "CHTE_ADMIN" || (!collegeId && role === "SUPER_ADMIN");

  // Hide official notice / duties marquee on CHTE Central Dashboard, but keep it active for colleges
  if (isCentral) return null;

  const isInterFaculty = role === "INTER_FACULTY";
  const isBSFaculty = ["BS_FACULTY", "FACULTY", "TEACHER"].includes(role);

  const ttCount = dutyData.publishedTimetablesCount || 0;
  const dsCount = dutyData.publishedDatesheetsCount || 0;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-slate-100 px-4 py-2.5 shadow-sm flex items-center justify-between gap-3 z-40 relative border-b border-indigo-900/40">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Animated pulse dot */}
        <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>

        {/* Badge Tag */}
        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded-md uppercase tracking-wider border border-indigo-400/25 flex-shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          {isInterFaculty ? "INTERMEDIATE ANNOUNCEMENT" : isBSFaculty ? "BS PROGRAM ANNOUNCEMENT" : "OFFICIAL NOTICE"}
        </span>

        {/* Notice Info */}
        <div className="text-xs font-medium truncate flex items-center gap-3 text-slate-200">
          {ttCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span><strong className="font-semibold text-white">Class Timetable Published:</strong> {ttCount} class entry(ies) assigned.</span>
            </span>
          )}
          {dsCount > 0 && (
            <span className="flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span><strong className="font-semibold text-white">Exam Invigilation & Conduct:</strong> {dsCount} exam duty session(s) active.</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/dashboard"
          className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1 group"
        >
          <span>View Duties</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          title="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

