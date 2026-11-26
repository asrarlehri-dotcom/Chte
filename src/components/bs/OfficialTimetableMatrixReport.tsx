"use client";

import React from "react";
import { DAY_ABBREV, expandTimetableDays, type TimetableWeekday } from "@/lib/timetable-days";
import { parseCombinedClassTag } from "@/lib/timetable-recommendations";

const FIRST_HALF_DAYS: readonly TimetableWeekday[] = ["Monday", "Tuesday", "Wednesday"];
const LAST_HALF_DAYS: readonly TimetableWeekday[] = ["Thursday", "Friday", "Saturday"];
const DEFAULT_PERIODS = [
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
];

export function toOrdinalUpper(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}TH`;
  switch (n % 10) {
    case 1: return `${n}ST`;
    case 2: return `${n}ND`;
    case 3: return `${n}RD`;
    default: return `${n}TH`;
  }
}

export function formatPeriodWindow(start: string, end: string): string {
  const fmtHour = (t: string) => {
    const [hStr, mStr] = (t || "").split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    if (Number.isNaN(h)) return { label: t, ampm: "" };
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const minPart = m > 0 ? `:${String(m).padStart(2, "0")}` : "";
    return { label: `${h12}${minPart}`, ampm };
  };

  const s = fmtHour(start);
  const e = fmtHour(end);
  if (!s.ampm && !e.ampm) return `(${start}-${end})`;
  const suffix = e.ampm || s.ampm;
  return `(${s.label}-${e.label} ${suffix})`;
}

export interface TimetableMatrixSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  session?: string;
  semester?: number | null;
  programId?: string | null;
  courseId?: string | null;
  facultyId?: string | null;
  classSectionId?: string | null;
  program?: { id?: string; name?: string | null } | null;
  course?: { title?: string | null; code?: string | null } | null;
  faculty?: { user?: { name?: string | null } | null } | null;
}

interface OfficialTimetableMatrixReportProps {
  collegeName: string;
  collegeLogo?: string;
  collegeTagline?: string;
  timetables: TimetableMatrixSlot[];
  selectedSemester: string;
  selectedSession: string;
  onEditSlot?: (slot: TimetableMatrixSlot) => void;
}

export default function OfficialTimetableMatrixReport({
  collegeName,
  collegeLogo,
  collegeTagline,
  timetables,
  selectedSemester,
  selectedSession,
  onEditSlot,
}: OfficialTimetableMatrixReportProps) {
  // Collect all sorted unique time periods from entries (minimum standard 3 morning slots)
  const periodMap = new Map<string, { start: string; end: string }>();
  for (const t of timetables) {
    if (t.startTime && t.endTime) {
      const key = `${t.startTime}-${t.endTime}`;
      if (!periodMap.has(key)) {
        periodMap.set(key, { start: t.startTime, end: t.endTime });
      }
    }
  }
  if (periodMap.size < 3) {
    for (const dp of DEFAULT_PERIODS) {
      const key = `${dp.start}-${dp.end}`;
      if (!periodMap.has(key)) periodMap.set(key, dp);
    }
  }
  const periods = Array.from(periodMap.values()).sort((a, b) => a.start.localeCompare(b.start));

  // Collect combined/joint class cohorts by group ID
  const combinedPeersByGroupId = new Map<string, string[]>();
  for (const t of timetables) {
    const meta = parseCombinedClassTag(t.classSectionId);
    if (meta.groupId) {
      const label = `${t.program?.name || "BS"} (Sem ${t.semester || 1}${t.session ? ` • ${t.session}` : ""})`;
      const existingList = combinedPeersByGroupId.get(meta.groupId) || [];
      if (!existingList.includes(label)) existingList.push(label);
      combinedPeersByGroupId.set(meta.groupId, existingList);
    }
  }

  // Group rows cleanly by Program (and Semester / Session when distinct batches exist)
  const distinctSessions = new Set(timetables.map((t) => (t.session || "").trim()).filter(Boolean));
  const showSessionInRow = selectedSession === "ALL" && distinctSessions.size > 1;
  const showSemInRow = selectedSemester === "0" || showSessionInRow;
  const rowMap = new Map<
    string,
    {
      rowKey: string;
      programName: string;
      semester: number;
      session: string;
      slots: TimetableMatrixSlot[];
    }
  >();

  for (const t of timetables) {
    const pName = t.program?.name || "General BS";
    const sem = t.semester || 1;
    const sess = (t.session || "").trim();
    const rowKey = showSessionInRow
      ? `${t.programId || pName}__sem${sem}__${sess}`
      : showSemInRow
        ? `${t.programId || pName}__sem${sem}`
        : `${t.programId || pName}`;
    if (!rowMap.has(rowKey)) {
      rowMap.set(rowKey, {
        rowKey,
        programName: pName,
        semester: sem,
        session: sess,
        slots: [],
      });
    }
    rowMap.get(rowKey)!.slots.push(t);
  }

  const rows = Array.from(rowMap.values()).sort((a, b) => {
    const cmp = a.programName.localeCompare(b.programName);
    if (cmp !== 0) return cmp;
    if (a.semester !== b.semester) return a.semester - b.semester;
    return a.session.localeCompare(b.session);
  });

  const renderSlotEntriesCell = (entries: Array<{ slot: TimetableMatrixSlot; dayHint: string }>) => {
    if (entries.length === 0) {
      return <span className="text-slate-300 print:hidden text-[10px]">—</span>;
    }
    return (
      <div className="space-y-1.5">
        {entries.map(({ slot, dayHint }) => {
          const combMeta = parseCombinedClassTag(slot.classSectionId);
          const peers = combMeta.groupId ? combinedPeersByGroupId.get(combMeta.groupId) || [] : [];
          return (
            <div
              key={slot.id}
              onClick={() => onEditSlot?.(slot)}
              className={`${onEditSlot ? "cursor-pointer hover:bg-blue-50/70 rounded p-0.5 -m-0.5 transition-colors print:p-0 print:m-0" : ""}`}
              title={
                peers.length > 1
                  ? `Combined Class (${peers.join(" + ")})${onEditSlot ? " — Click to edit" : ""}`
                  : onEditSlot
                    ? "Click to edit this timetable slot"
                    : undefined
              }
            >
              <div className="font-bold uppercase text-[10.5px] leading-snug text-black">
                {slot.course?.title || "Subject"}
                {dayHint && (
                  <span className="ml-1 font-sans text-[9px] font-bold px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded print:bg-white print:border-black print:text-black">
                    {dayHint}
                  </span>
                )}
                {combMeta.isCombined && (
                  <span className="ml-1 font-sans text-[8.5px] font-bold px-1 py-0.2 bg-purple-100 text-purple-900 border border-purple-300 rounded print:bg-white print:border-black print:text-black">
                    {peers.length > 1 ? `Joint (${peers.length})` : "Joint"}
                  </span>
                )}
                {combMeta.isOptionalParallel && (
                  <span className="ml-1 font-sans text-[8.5px] font-bold px-1 py-0.2 bg-teal-100 text-teal-900 border border-teal-300 rounded print:bg-white print:border-black print:text-black">
                    Opt
                  </span>
                )}
              </div>
              <div className="text-[10.5px] text-slate-800 mt-0.5 font-medium">
                {slot.faculty?.user?.name || "TBA"}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const semNum = parseInt(selectedSemester, 10);
  const semTitle =
    selectedSemester !== "0" && !Number.isNaN(semNum)
      ? `OF ${toOrdinalUpper(semNum)} SEMESTER`
      : "MASTER SCHEDULE (ALL SEMESTERS)";
  const sessionTitle = selectedSession !== "ALL" ? ` (${selectedSession})` : "";

  const getCellEntries = (slots: TimetableMatrixSlot[], start: string, end: string, halfDays: readonly TimetableWeekday[]) => {
    return slots
      .filter((s) => s.startTime === start && s.endTime === end)
      .map((s) => {
        const expanded = expandTimetableDays(s.dayOfWeek);
        const matchedDays = halfDays.filter((hd) => expanded.includes(hd));
        if (matchedDays.length === 0) return null;
        const coversAllThree = matchedDays.length === 3;
        const dayHint = coversAllThree ? "" : matchedDays.map((d) => DAY_ABBREV[d]).join(", ");
        return { slot: s, dayHint };
      })
      .filter(Boolean) as Array<{ slot: TimetableMatrixSlot; dayHint: string }>;
  };

  return (
    <div className="official-report-sheet bg-white text-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:rounded-none font-serif">
      {/* Official Institutional Header matching Reference Layout */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b-2 border-black">
        <div className="w-16 shrink-0 hidden sm:block print:block" />
        <div className="flex-1 text-center space-y-0.5">
          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-black">
            {collegeName}
          </h2>
          {collegeTagline && (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-700">
              {collegeTagline}
            </p>
          )}
          <h3 className="text-sm sm:text-xl font-black uppercase tracking-wide text-black pt-1">
            TIME TABLE {semTitle}
            {sessionTitle}
          </h3>
        </div>
        <div className="w-16 shrink-0 flex justify-end">
          {collegeLogo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={collegeLogo}
              alt="College Crest"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
            />
          )}
        </div>
      </div>

      {/* Symmetric 2-Half Period × Days Matrix Table */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full border-collapse border-2 border-black text-xs text-left">
          <thead>
            {/* Row 1: PERIOD | Left Periods | Right Periods */}
            <tr className="bg-slate-100/90 print:bg-white">
              <th className="border border-black px-2.5 py-2 text-center font-black uppercase text-xs sm:text-sm tracking-wider w-40">
                PERIOD
              </th>
              {periods.map((p) => (
                <th
                  key={`L-${p.start}-${p.end}`}
                  className="border border-black px-2 py-2 text-center font-black text-[11px] sm:text-xs whitespace-nowrap"
                >
                  {formatPeriodWindow(p.start, p.end)}
                </th>
              ))}
              {periods.map((p, idx) => (
                <th
                  key={`R-${p.start}-${p.end}`}
                  className={`border border-black px-2 py-2 text-center font-black text-[11px] sm:text-xs whitespace-nowrap ${idx === 0 ? "border-l-2 border-l-black" : ""
                    }`}
                >
                  {formatPeriodWindow(p.start, p.end)}
                </th>
              ))}
            </tr>

            {/* Row 2: DAYS | (1-3) | (4-6) */}
            <tr className="bg-slate-50 print:bg-white">
              <th className="border border-black px-2.5 py-1.5 text-center font-black uppercase text-xs tracking-wider">
                DAYS
              </th>
              <th
                colSpan={periods.length}
                className="border border-black px-2 py-1.5 text-center font-black text-xs"
              >
                (1-3) &nbsp;
                <span className="font-semibold text-[10.5px] text-slate-700">
                  [Mon, Tue, Wed]
                </span>
              </th>
              <th
                colSpan={periods.length}
                className="border border-black border-l-2 border-l-black px-2 py-1.5 text-center font-black text-xs"
              >
                (4-6) &nbsp;
                <span className="font-semibold text-[10.5px] text-slate-700">
                  [Thu, Fri, Sat]
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.rowKey} className="hover:bg-slate-50/60 print:hover:bg-white">
                {/* Program Name Cell */}
                <td className="border border-black px-2.5 py-2.5 font-black italic uppercase text-xs sm:text-[13px] align-middle bg-slate-50/50 print:bg-white">
                  <div>{row.programName}</div>
                  {showSemInRow && (
                    <div className="not-italic text-[10px] font-bold text-slate-600 mt-0.5">
                      Semester {row.semester}
                      {showSessionInRow && row.session ? ` • ${row.session}` : ""}
                    </div>
                  )}
                </td>

                {/* Left Half: Days (1-3) */}
                {periods.map((p) => {
                  const entries = getCellEntries(row.slots, p.start, p.end, FIRST_HALF_DAYS);
                  return (
                    <td
                      key={`${row.rowKey}-L-${p.start}-${p.end}`}
                      className="border border-black px-2 py-1.5 align-top min-w-[115px]"
                    >
                      {renderSlotEntriesCell(entries)}
                    </td>
                  );
                })}

                {/* Right Half: Days (4-6) */}
                {periods.map((p, idx) => {
                  const entries = getCellEntries(row.slots, p.start, p.end, LAST_HALF_DAYS);
                  return (
                    <td
                      key={`${row.rowKey}-R-${p.start}-${p.end}`}
                      className={`border border-black px-2 py-1.5 align-top min-w-[115px] ${idx === 0 ? "border-l-2 border-l-black" : ""
                        }`}
                    >
                      {renderSlotEntriesCell(entries)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Notes & Official Signatures */}
      <div className="mt-5 pt-3 border-t border-slate-300 print:border-black space-y-6">
        <p className="text-[11px] font-semibold text-slate-700 print:text-black">
          <strong className="uppercase">Note:</strong> Concerned faculty members and students are advised to strictly follow the notified class schedule and assigned periods. Click any cell on screen to edit directly.
        </p>

        <div className="grid grid-cols-3 gap-8 pt-6 text-center text-xs">
          <div className="space-y-1.5">
            <div className="border-b border-black w-4/5 mx-auto h-6" />
            <div className="font-bold text-black">Time Table Incharge / Coordinator</div>
          </div>
          <div className="space-y-1.5">
            <div className="border-b border-black w-4/5 mx-auto h-6" />
            <div className="font-bold text-black">Vice Principal (Academic)</div>
          </div>
          <div className="space-y-1.5">
            <div className="border-b border-black w-4/5 mx-auto h-6" />
            <div className="font-bold text-black">Principal &amp; Official Stamp</div>
          </div>
        </div>
      </div>
    </div>
  );
}
