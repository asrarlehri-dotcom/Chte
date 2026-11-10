"use client";

import React from "react";
import { getGPValue, calculateStudentCGPA } from "@/lib/cgpa";
import { TranscriptStudentData } from "@/components/OfficialTranscriptDocument";

export interface OfficialDMCDocumentProps {
  student: TranscriptStudentData;
  semester: number;
  collegeName?: string;
  collegeLogo?: string;
  collegeAddress?: string;
  issueDate?: string;
  serialNumber?: string;
}

const SEMESTER_NAMES: Record<number, string> = {
  1: "FIRST SEMESTER",
  2: "SECOND SEMESTER",
  3: "THIRD SEMESTER",
  4: "FOURTH SEMESTER",
  5: "FIFTH SEMESTER",
  6: "SIXTH SEMESTER",
  7: "SEVENTH SEMESTER",
  8: "EIGHTH SEMESTER",
};

function getGradeLetter(score: number, isPercent: boolean = true): string {
  const pct = isPercent ? score : score * 25;
  if (pct >= 85) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 75) return "B+";
  if (pct >= 70) return "B";
  if (pct >= 65) return "B-";
  if (pct >= 60) return "C+";
  if (pct >= 55) return "C";
  if (pct >= 50) return "D";
  return "F";
}

function formatOrdinalDate(d: Date): string {
  const day = d.getDate();
  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${day}${suffix} ${monthNames[d.getMonth()]}, ${d.getFullYear()}`;
}

export default function OfficialDMCDocument({
  student,
  semester = 1,
  collegeName,
  collegeLogo,
  collegeAddress,
  issueDate,
  serialNumber,
}: OfficialDMCDocumentProps) {
  // Active concerned college details
  const activeCollegeName =
    (student as any)?.college?.name ||
    collegeName ||
    "Government Post Graduate College Quetta";

  const activeCollegeAddress =
    (student as any)?.college?.address ||
    collegeAddress ||
    "Quetta, Balochistan, Pakistan";

  const activeCollegeLogo =
    collegeLogo ||
    (student as any)?.college?.logoUrl ||
    "/logo.png";

  // Filter marks for this specific semester
  const semMarks = (student.marks || []).filter(
    (m) => (m.course?.semester ?? m.semester ?? 1) === semester
  );

  let totalCredits = 0;
  let totalMax = 0;
  let totalObtained = 0;
  let totalGPPoints = 0;
  let absentCount = 0;

  const coursesDetails = semMarks.map((m, idx) => {
    const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
    const credit = m.course?.creditHours || 3;
    const max = m.totalMarks || 100;
    const obt = isAbsent ? 0 : m.obtainedMarks;
    const gp = isAbsent ? 0.0 : getGPValue(obt, max);
    const pct = max > 0 ? (obt / max) * 100 : 0;
    const grade = isAbsent ? "F" : getGradeLetter(pct, true);

    if (isAbsent) absentCount++;
    totalCredits += credit;
    totalMax += max;
    totalObtained += obt;
    totalGPPoints += gp * credit;

    return {
      sr: idx + 1,
      code: m.course?.code || `COURSE-${semester}0${idx + 1}`,
      title: m.course?.title || "Subject",
      credit,
      max,
      obtained: isAbsent ? "A" : obt,
      isAbsent,
      pct: pct.toFixed(0),
      gp: gp.toFixed(2),
      grade,
    };
  });

  const sgpa = totalCredits > 0 ? (totalGPPoints / totalCredits).toFixed(2) : "0.00";
  const semPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  const semGrade = getGradeLetter(semPct, true);
  const isAllAbsent = absentCount > 0 && absentCount === semMarks.length;

  // Derive CGPA up to this semester
  const semestersMap: Record<number, { gpPoints: number; credits: number }> = {};
  (student.marks || []).forEach((m) => {
    const sem = m.course?.semester ?? m.semester ?? 1;
    if (sem <= semester) {
      const isAbs = (m as any).status === "ABSENT" || (m as any).status === "A";
      const cr = m.course?.creditHours || 3;
      const gp = isAbs ? 0.0 : getGPValue(m.obtainedMarks, m.totalMarks);
      if (!semestersMap[sem]) semestersMap[sem] = { gpPoints: 0, credits: 0 };
      semestersMap[sem].gpPoints += gp * cr;
      semestersMap[sem].credits += cr;
    }
  });

  const semestersData = Object.entries(semestersMap).map(([sStr, d]) => ({
    semester: parseInt(sStr),
    gpa: d.credits > 0 ? parseFloat((d.gpPoints / d.credits).toFixed(2)) : 0,
    creditHours: d.credits,
  }));

  const { cgpa } = calculateStudentCGPA(
    { bsAdmissionType: student.bsAdmissionType || null },
    semestersData
  );

  // Status computation based on HEC rules
  let status = "PROMOTED";
  if (totalMax === 0) status = "—";
  else if (isAllAbsent) status = "ABSENT";
  else if (semester === 1) status = parseFloat(sgpa) >= 1.0 ? "PROMOTED" : "DROPOUT";
  else if (semester === 2) status = cgpa >= 1.5 ? "PROMOTED" : cgpa >= 1.0 ? "PROBATION" : "DROPOUT";
  else if (semester === 3) status = cgpa >= 1.75 ? "PROMOTED" : cgpa >= 1.0 ? "PROBATION" : "DROPOUT";
  else status = cgpa >= 2.0 ? "PROMOTED" : cgpa >= 1.0 ? "PROBATION" : "DROPOUT";

  // Student details resolution
  const studentName = student.user?.name || student.name || "Muhammad Akber";
  const fatherName = student.fatherName || "—";
  const rollNo = student.rollNumber || "S17/Zoo-13";
  const sessionStr = student.session || "2024-2028";
  const programName = (student.program?.name || student.programName || "BS ZOOLOGY").toUpperCase();
  const cnicStr = student.cnic || "51201-8257456-9";
  const modeOfStudy = student.bsAdmissionType === "BRIDGING_5TH" ? "Bridging (Lateral)" : "Regular";

  // DOB formatting
  let dobStr = "28-02-2000";
  if (student.dateOfBirth) {
    const d = new Date(student.dateOfBirth);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      dobStr = `${dd}-${mm}-${d.getFullYear()}`;
    }
  }

  // Registration Number
  const progAbbr = programName.replace(/[^A-Z]/g, "").slice(0, 4) || "ZOOL";
  const regNo =
    student.registrationNo ||
    `REG/BS-${sessionStr.slice(2, 4)}/${progAbbr}-${rollNo.replace(/\D/g, "").slice(-3).padStart(3, "0") || "306"}`;

  // Declaration Date
  const declDateStr = issueDate || formatOrdinalDate(new Date());

  // Serial Number
  const collegeCode =
    (student as any)?.college?.code ||
    (rollNo.includes("-") ? rollNo.split("-")[1] : "COL");
  const serialNoStr =
    serialNumber ||
    `DMC-${collegeCode}-${semester}-${String((rollNo.replace(/\D/g, "") || "706")).padStart(5, "0")}`;

  const fullInstituteName = activeCollegeAddress
    ? `${activeCollegeName}, ${activeCollegeAddress}`
    : activeCollegeName;

  const semName = SEMESTER_NAMES[semester] || `SEMESTER ${semester}`;

  return (
    <div className="official-dmc-root bg-white text-black p-4 sm:p-6 mx-auto max-w-[850px] font-sans border-2 border-black shadow-lg print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-[11px] leading-snug">
      {/* ─── 1. TOP SERIAL NUMBER ─── */}
      <div className="flex justify-between items-center text-[11px] font-serif tracking-normal text-black mb-1">
        <span className="text-[10px] text-gray-500 font-sans tracking-wide">
          DETAILED MARKS CERTIFICATE
        </span>
        <span>No. {serialNoStr}</span>
      </div>

      {/* ─── 2. MAIN HEADER (CONCERNED COLLEGE LOGO & NAME) ─── */}
      <div className="text-center space-y-1 mb-3">
        {activeCollegeLogo && (
          <div className="flex justify-center mb-1">
            <img
              src={activeCollegeLogo}
              alt="College Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("/logo.png")) {
                  target.src = "/logo.png";
                }
              }}
            />
          </div>
        )}
        <h1 className="font-serif text-2xl sm:text-[26px] font-black tracking-tight text-black uppercase">
          {activeCollegeName}
        </h1>
        {activeCollegeAddress && (
          <p className="text-[10px] font-semibold text-gray-700 tracking-wide uppercase">
            {activeCollegeAddress}
          </p>
        )}
        <h2 className="text-xs sm:text-sm font-bold tracking-[0.22em] text-black uppercase mt-1">
          DETAILED MARKS CERTIFICATE (DMC)
        </h2>
      </div>

      {/* ─── 3. STUDENT PROFILE INFORMATION GRID ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[10.5px] mb-2 leading-tight">
        {/* Left Column */}
        <div className="space-y-0.5">
          <div className="flex">
            <span className="w-36 shrink-0 font-medium text-black">Student Name:</span>
            <span className="font-bold text-black">{studentName}</span>
          </div>
          <div className="flex">
            <span className="w-36 shrink-0 font-medium text-black">Father's Name:</span>
            <span className="font-normal text-black">{fatherName}</span>
          </div>
          <div className="flex">
            <span className="w-36 shrink-0 font-medium text-black">Date of Birth:</span>
            <span className="font-normal text-black">{dobStr}</span>
          </div>
          <div className="flex">
            <span className="w-36 shrink-0 font-medium text-black">CNIC:</span>
            <span className="font-normal text-black font-mono">{cnicStr}</span>
          </div>
          <div className="flex">
            <span className="w-36 shrink-0 font-medium text-black">Program:</span>
            <span className="font-bold text-black">{student.program?.name || programName}</span>
          </div>
          <div className="flex items-start">
            <span className="w-36 shrink-0 font-medium text-black">Department/Institute Name:</span>
            <span className="font-normal text-black leading-tight">{fullInstituteName}</span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-0.5">
          <div className="flex">
            <span className="w-40 shrink-0 font-medium text-black">Roll No:</span>
            <span className="font-bold font-mono text-black">{rollNo}</span>
          </div>
          <div className="flex">
            <span className="w-40 shrink-0 font-medium text-black">Registration No:</span>
            <span className="font-bold font-mono text-black">{regNo}</span>
          </div>
          <div className="flex">
            <span className="w-40 shrink-0 font-medium text-black">Mode of Study:</span>
            <span className="font-normal text-black">{modeOfStudy}</span>
          </div>
          <div className="flex">
            <span className="w-40 shrink-0 font-medium text-black">Session:</span>
            <span className="font-bold text-black">{sessionStr}</span>
          </div>
          <div className="flex">
            <span className="w-40 shrink-0 font-medium text-black">Result Declaration Date:</span>
            <span className="font-normal text-black">{declDateStr}</span>
          </div>
        </div>
      </div>

      {/* ─── 4. PROGRAM & SEMESTER TITLE BAR ─── */}
      <div className="border-t-2 border-b-2 border-black py-1 my-2 text-center text-xs font-bold tracking-wider uppercase text-black">
        {programName} (4 YEAR'S PROGRAM) &bull; {semName} EXAMINATION
      </div>

      {/* ─── 5. DMC MARKS TABLE ─── */}
      <div className="border border-black overflow-hidden mb-3 bg-white">
        <table className="w-full border-collapse text-black text-[10px] leading-tight">
          <thead>
            {/* Table Header Banner */}
            <tr className="border-b border-black">
              <th
                colSpan={8}
                className="py-1 px-1 text-center font-bold tracking-wider uppercase text-[11px] text-black bg-white"
              >
                STATEMENT OF DETAILED MARKS &bull; {semName}
              </th>
            </tr>
            {/* Column Headers */}
            <tr className="border-b border-black text-[9px] font-bold uppercase tracking-tight text-center">
              <th className="border-r border-black py-1.5 px-1 w-[32px]">S/No</th>
              <th className="border-r border-black py-1.5 px-2 text-left w-[110px]">COURSE CODE</th>
              <th className="border-r border-black py-1.5 px-2 text-left">COURSE TITLE</th>
              <th className="border-r border-black py-1.5 px-1 w-[50px] leading-none">
                CREDIT<br />HOURS
              </th>
              <th className="border-r border-black py-1.5 px-1 w-[54px] leading-none">
                TOTAL<br />MARKS
              </th>
              <th className="border-r border-black py-1.5 px-1 w-[54px] leading-none">
                MARKS<br />OBT.
              </th>
              <th className="border-r border-black py-1.5 px-1 w-[46px]">GRADE</th>
              <th className="py-1.5 px-1 w-[56px] leading-none">
                GRADE<br />POINT
              </th>
            </tr>
          </thead>
          <tbody>
            {coursesDetails.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-400 italic text-xs">
                  No examination papers recorded for {semName}
                </td>
              </tr>
            ) : (
              coursesDetails.map((c) => (
                <tr key={c.sr} className="border-b border-black text-center font-normal">
                  <td className="border-r border-black py-1.5 px-1">{c.sr}</td>
                  <td className="border-r border-black py-1.5 px-2 text-left font-mono font-bold text-[9.5px]">
                    {c.code}
                  </td>
                  <td className="border-r border-black py-1.5 px-2 text-left font-medium">
                    {c.title}
                  </td>
                  <td className="border-r border-black py-1.5 px-1 font-medium">{c.credit}</td>
                  <td className="border-r border-black py-1.5 px-1">{c.max}</td>
                  <td className={`border-r border-black py-1.5 px-1 font-bold ${c.isAbsent ? "text-red-600" : ""}`}>
                    {c.obtained}
                  </td>
                  <td className={`border-r border-black py-1.5 px-1 font-bold ${c.grade === "F" ? "text-red-600" : ""}`}>
                    {c.grade}
                  </td>
                  <td className="py-1.5 px-1 font-medium">{c.gp}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            {/* Semester Totals & SGPA */}
            <tr className="border-t border-black font-bold">
              <td colSpan={3} className="border-r border-black py-1.5 px-2 text-right uppercase tracking-wider text-[9.5px]">
                Semester Total:
              </td>
              <td className="border-r border-black py-1.5 px-1 text-center text-[10px]">{totalCredits}</td>
              <td className="border-r border-black py-1.5 px-1 text-center text-[10px]">{totalMax}</td>
              <td className="border-r border-black py-1.5 px-1 text-center text-[10px] font-black">{totalObtained}</td>
              <td className="border-r border-black py-1.5 px-1 text-center text-[9.5px] font-bold">SGPA</td>
              <td className="py-1.5 px-1 text-center font-black text-[10.5px]">{sgpa}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ─── 6. CUMULATIVE & STANDING SUMMARY ROW ─── */}
      <div className="border border-black py-1.5 px-3 mb-4 flex items-center justify-between flex-wrap gap-2 text-[11px] text-black">
        <div>
          Obtained Marks <strong className="underline ml-1 text-black font-black">{totalObtained}</strong>
        </div>
        <div>
          Total Marks <strong className="underline ml-1 text-black font-black">{totalMax}</strong>
        </div>
        <div>
          Percentage <strong className="underline ml-1 text-black font-black">{semPct}%</strong>
        </div>
        <div>
          Grade <strong className="underline ml-1 text-black font-black">{semGrade}</strong>
        </div>
        <div>
          SGPA <strong className="underline ml-1 text-black font-black">{sgpa}</strong>
        </div>
        <div>
          CGPA <strong className="underline ml-1 text-black font-black">{cgpa.toFixed(2)}</strong>
        </div>
        <div>
          Standing: <strong className="underline ml-1 text-black font-black uppercase">{status}</strong>
        </div>
      </div>

      {/* ─── 7. FOOTER / SIGNATURES ─── */}
      <div className="grid grid-cols-2 gap-4 items-end pt-2 text-[10.5px]">
        {/* Left Signature Column */}
        <div className="space-y-2">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="w-24 shrink-0 font-normal">Prepared By:</span>
              <div className="border-b border-black flex-1 h-3"></div>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-24 shrink-0 font-normal">Checked By:</span>
              <div className="border-b border-black flex-1 h-3"></div>
            </div>
          </div>

          <div className="text-[9px] italic text-gray-700 pt-0.5">
            */** Repeated/Improved Marks
          </div>

          {/* Clean Official Stamp Area */}
          <div className="pt-3">
            <div className="w-28 h-14 border border-dashed border-gray-400 rounded flex items-center justify-center text-center">
              <span className="text-[7.5px] font-semibold text-gray-400 uppercase tracking-widest">[ College Stamp ]</span>
            </div>
          </div>
        </div>

        {/* Right Signature Column */}
        <div className="text-center space-y-1">
          {/* Controller Signature Blank Area */}
          <div className="h-10"></div>

          <div className="border-t border-black pt-1">
            <p className="font-bold text-[10.5px] leading-tight text-black">
              Controller / Incharge Examinations
            </p>
            <p className="text-[9.5px] font-medium text-black">
              (Examination Cell)
            </p>
          </div>

          <div className="pt-2 text-[9px] leading-tight text-gray-800">
            <p className="font-medium">Issued by Examination Cell</p>
            <p className="italic text-gray-600">Errors and Omissions are expected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
