"use client";

import React from "react";

export interface CenterProgramCount {
  name: string;
  count: number;
}

export interface OfficialDutyRowInput {
  id: string;
  date: Date | string;
  shiftTime?: string;
  courseTitle?: string;
  courseCode?: string;
  facultyName: string;
  facultyDept?: string;
  dutyType?: string;
  isMandatory?: boolean;
  hall?: string;
}

export interface OfficialDatesheetRowInput {
  id: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  courseTitle: string;
  courseCode?: string;
  programName: string;
  semester?: number;
  session?: string;
  examType?: string;
  hall?: string;
}

interface OfficialExamCenterReportProps {
  variant: "duty" | "datesheet";
  collegeName: string;
  collegeLogo?: string;
  collegeTagline?: string;
  centerNumber: string;
  centerLocation: string;
  superintendentName: string;
  superintendentDepartment?: string;
  deputySuperintendent?: string;
  mobileCollector: string;
  dutyNote: string;
  examTitle?: string;
  sessionLabel?: string;
  semesterLabel: string;
  programCounts: CenterProgramCount[];
  dutyRows?: OfficialDutyRowInput[];
  datesheetRows?: OfficialDatesheetRowInput[];
}

function formatDateDDMMYYYY(val: Date | string): { dateKey: string; dateStr: string; weekdayStr: string } {
  const dt = new Date(val);
  if (Number.isNaN(dt.getTime())) {
    return { dateKey: String(val), dateStr: String(val), weekdayStr: "" };
  }
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const weekday = dt.toLocaleDateString("en-US", { weekday: "long" });
  return {
    dateKey: `${yyyy}-${mm}-${dd}`,
    dateStr: `${dd}-${mm}-${yyyy}`,
    weekdayStr: `(${weekday})`,
  };
}

function formatTime12Hour(t: string): string {
  const [hStr, mStr] = (t || "").split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${(mStr || "00").padStart(2, "0")} ${ampm}`;
}

function formatExamTypeLabel(raw?: string): string {
  if (!raw) return "Terminal Exam";
  if (raw === "TERMINAL") return "Terminal Exam";
  if (raw === "FINAL_TERM") return "Final Term";
  if (raw === "MID_TERM") return "Mid Term";
  return raw;
}

export default function OfficialExamCenterReport({
  variant,
  collegeName,
  collegeLogo,
  collegeTagline,
  centerNumber,
  centerLocation,
  superintendentName,
  superintendentDepartment,
  deputySuperintendent,
  mobileCollector,
  dutyNote,
  examTitle,
  sessionLabel,
  semesterLabel,
  programCounts,
  dutyRows = [],
  datesheetRows = [],
}: OfficialExamCenterReportProps) {
  const totalStudents = programCounts.reduce((acc, item) => acc + (item.count || 0), 0);

  // Group supervising duties chronologically by Date (DD-MM-YYYY) so all staff on one date list together cleanly
  const groupedDutiesMap = new Map<
    string,
    {
      dateKey: string;
      dateStr: string;
      weekdayStr: string;
      staffList: Array<{ label: string; badge?: string }>;
      papers: string[];
      shifts: string[];
    }
  >();

  if (variant === "duty") {
    const sorted = [...dutyRows].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    for (const row of sorted) {
      const { dateKey, dateStr, weekdayStr } = formatDateDDMMYYYY(row.date);
      if (!groupedDutiesMap.has(dateKey)) {
        groupedDutiesMap.set(dateKey, {
          dateKey,
          dateStr,
          weekdayStr,
          staffList: [],
          papers: [],
          shifts: [],
        });
      }
      const bucket = groupedDutiesMap.get(dateKey)!;
      const cleanName = (row.facultyName || "TBA").trim();
      const staffFormatted = row.facultyDept
        ? `${cleanName} (${row.facultyDept})`
        : cleanName;

      if (!bucket.staffList.some((s) => s.label === staffFormatted)) {
        bucket.staffList.push({
          label: staffFormatted,
          badge: row.isMandatory ? "Subject Teacher" : undefined,
        });
      }
      const paperStr = row.courseTitle
        ? `${row.courseTitle}${row.courseCode ? ` (${row.courseCode})` : ""}`
        : "";
      if (paperStr && !bucket.papers.includes(paperStr)) {
        bucket.papers.push(paperStr);
      }
      if (row.shiftTime && !bucket.shifts.includes(row.shiftTime)) {
        bucket.shifts.push(row.shiftTime);
      }
    }
  }

  const groupedDutyDates = Array.from(groupedDutiesMap.values());

  const sortedDatesheets =
    variant === "datesheet"
      ? [...datesheetRows].sort((a, b) => {
          const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
          return diff !== 0 ? diff : (a.startTime || "").localeCompare(b.startTime || "");
        })
      : [];

  return (
    <div className="official-report-sheet bg-white text-slate-950 p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-2 print:rounded-none font-serif space-y-5 max-w-4xl mx-auto">
      {/* Institutional Crest + Title */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-300 pb-3 print:border-black">
        <div className="w-14 shrink-0">
          {collegeLogo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={collegeLogo} alt="College Emblem" className="w-14 h-14 object-contain" />
          )}
        </div>
        <div className="flex-1 text-center space-y-0.5">
          <div className="text-base sm:text-xl font-black uppercase tracking-wide text-black">
            {collegeName}
          </div>
          {collegeTagline && (
            <div className="text-[10.5px] font-semibold uppercase tracking-widest text-slate-700 print:text-black">
              {collegeTagline}
            </div>
          )}
          <div className="text-sm sm:text-base font-black text-black pt-0.5">
            {examTitle || (variant === "duty" ? `Center No ${centerNumber}` : "OFFICIAL EXAMINATION DATE SHEET")}
          </div>
          {variant === "datesheet" && centerNumber && (
            <div className="text-xs font-bold text-slate-800 print:text-black">
              Center No {centerNumber}
              {sessionLabel ? ` • Session: ${sessionLabel}` : ""}
            </div>
          )}
        </div>
        <div className="w-14 shrink-0 text-right text-[10px] font-bold text-slate-500 print:text-black">
          {new Date().toLocaleDateString("en-GB")}
        </div>
      </div>

      {/* Centered Student Count Mini-Table (Matches Reference Image 2) */}
      {programCounts.length > 0 && (
        <div className="flex justify-center">
          <table className="border-collapse border border-black text-xs text-center min-w-[320px]">
            <tbody>
              <tr>
                <td
                  rowSpan={2}
                  className="border border-black px-3.5 py-2 font-black text-black align-middle"
                >
                  {semesterLabel}
                </td>
                {programCounts.map((pc) => (
                  <td key={pc.name} className="border border-black px-3.5 py-1.5 font-bold text-black">
                    {pc.name}
                  </td>
                ))}
                <td className="border border-black px-3.5 py-1.5 font-black text-black">
                  Total
                </td>
              </tr>
              <tr>
                {programCounts.map((pc) => (
                  <td key={`cnt-${pc.name}`} className="border border-black px-3.5 py-1.5 font-semibold text-black">
                    {pc.count}
                  </td>
                ))}
                <td className="border border-black px-3.5 py-1.5 font-black text-black">
                  {totalStudents}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Center Location & Center Superintendent Header Lines */}
      <div className="text-center space-y-1">
        <div className="text-sm sm:text-base font-black text-black">
          Center: {centerLocation}
        </div>
        <div className="text-sm sm:text-base font-semibold text-black">
          Center Superintendent:{" "}
          <span className="font-bold">
            {superintendentName}
            {superintendentDepartment ? ` (${superintendentDepartment})` : ""}
          </span>
        </div>
      </div>

      {/* MAIN OFFICIAL TABLE */}
      {variant === "duty" ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 print:bg-white">
                <th className="border border-black px-3 py-2 text-center font-black text-black w-44">
                  Date of Duty
                </th>
                <th className="border border-black px-4 py-2 text-left font-black text-black">
                  Name of Supervising Staff
                </th>
                <th className="border border-black px-3 py-2 text-left font-black text-black w-56">
                  Exam Paper &amp; Shift
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedDutyDates.map((grp) => (
                <tr key={grp.dateKey} className="align-top">
                  <td className="border border-black px-3 py-3 text-center font-black text-black whitespace-nowrap">
                    <div>{grp.dateStr}</div>
                    <div className="font-bold text-xs mt-0.5">{grp.weekdayStr}</div>
                  </td>
                  <td className="border border-black px-4 py-2.5 text-black leading-relaxed">
                    <div className="space-y-0.5 font-medium">
                      {grp.staffList.map((st, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2">
                          <span>{st.label}</span>
                          {st.badge && (
                            <span className="font-sans text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300 print:hidden">
                              {st.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="border border-black px-3 py-2.5 text-xs text-slate-800 print:text-black leading-snug">
                    {grp.shifts.length > 0 && (
                      <div className="font-bold text-black mb-1">{grp.shifts.join(" / ")}</div>
                    )}
                    {grp.papers.length > 0 ? (
                      <div className="space-y-0.5">
                        {grp.papers.map((paper, pIdx) => (
                          <div key={pIdx}>{paper}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 print:text-black">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 print:bg-white">
                <th className="border border-black px-3 py-2 text-center font-black text-black w-40">
                  Date &amp; Day
                </th>
                <th className="border border-black px-3 py-2 text-center font-black text-black w-36">
                  Time / Shift
                </th>
                <th className="border border-black px-4 py-2 text-left font-black text-black">
                  Course / Subject Paper
                </th>
                <th className="border border-black px-3 py-2 text-left font-black text-black">
                  Program &amp; Semester
                </th>
                <th className="border border-black px-3 py-2 text-center font-black text-black w-28">
                  Exam Type
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDatesheets.map((row) => {
                const { dateStr, weekdayStr } = formatDateDDMMYYYY(row.date);
                return (
                  <tr key={row.id} className="align-middle">
                    <td className="border border-black px-3 py-2 text-center font-black text-black whitespace-nowrap">
                      <div>{dateStr}</div>
                      <div className="font-bold text-[11px]">{weekdayStr}</div>
                    </td>
                    <td className="border border-black px-3 py-2 text-center font-semibold text-black whitespace-nowrap text-xs">
                      {formatTime12Hour(row.startTime)} – {formatTime12Hour(row.endTime)}
                    </td>
                    <td className="border border-black px-4 py-2 font-bold text-black">
                      {row.courseTitle}
                      {row.courseCode && (
                        <span className="ml-1.5 font-normal text-xs text-slate-700 print:text-black">
                          ({row.courseCode})
                        </span>
                      )}
                    </td>
                    <td className="border border-black px-3 py-2 text-xs font-semibold text-black">
                      {row.programName}
                      {row.semester ? ` — Sem ${row.semester}` : ""}
                      {row.session ? ` (${row.session})` : ""}
                    </td>
                    <td className="border border-black px-3 py-2 text-center text-xs font-bold text-black">
                      {formatExamTypeLabel(row.examType)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Official Note, Mobile Collector Officer & Signature Strip */}
      <div className="pt-4 space-y-5 text-xs sm:text-sm text-black">
        <p className="font-semibold">
          <strong>Note:</strong> {dutyNote}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-2">
          <div className="space-y-1">
            {mobileCollector && (
              <div>
                <strong className="underline">Mobile Collector Officer:</strong>{" "}
                <span className="font-semibold">{mobileCollector}</span>
              </div>
            )}
            {deputySuperintendent && (
              <div className="text-xs text-slate-700 print:text-black">
                <strong>Deputy Superintendent:</strong> {deputySuperintendent}
              </div>
            )}
          </div>

          <div className="flex items-end gap-8 pt-6 sm:pt-0">
            <div className="text-center min-w-[150px]">
              <div className="border-b border-black h-7 mb-1" />
              <div className="font-bold text-xs">Chief Superintendent</div>
            </div>
            <div className="text-center min-w-[160px]">
              <div className="border-b border-black h-7 mb-1" />
              <div className="font-bold text-xs">Principal / Controller of Exams</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

