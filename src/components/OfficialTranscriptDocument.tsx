"use client";

import React from "react";
import { getGPValue, calculateStudentCGPA } from "@/lib/cgpa";

export type TranscriptStudentData = {
  id?: string;
  rollNumber: string;
  fatherName?: string | null;
  cnic?: string | null;
  dateOfBirth?: string | Date | null;
  registrationNo?: string | null;
  session?: string | null;
  user?: { name: string };
  name?: string;
  currentSemester?: number | null;
  bsAdmissionType?: string | null;
  program?: { name: string; code?: string } | null;
  programName?: string;
  marks?: Array<{
    semester?: number;
    courseId?: string;
    obtainedMarks: number;
    totalMarks: number;
    status?: string;
    course?: {
      id?: string;
      title?: string;
      code?: string;
      creditHours?: number;
      semester?: number;
    };
  }>;
};

export interface OfficialTranscriptDocumentProps {
  student: TranscriptStudentData;
  fromSemester?: number;
  toSemester?: number;
  maxSemester?: number;
  collegeName?: string;
  collegeAddress?: string;
  universityName?: string;
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

export default function OfficialTranscriptDocument({
  student,
  fromSemester = 1,
  toSemester,
  maxSemester,
  collegeName,
  collegeAddress,
  universityName,
  issueDate,
  serialNumber,
}: OfficialTranscriptDocumentProps) {
  const startSem = fromSemester || 1;
  const endSem = toSemester || maxSemester || 8;

  // Active concerned college details
  const activeCollegeName =
    (student as any)?.college?.name ||
    collegeName ||
    "Government Post Graduate College Quetta";

  const activeCollegeAddress =
    (student as any)?.college?.address ||
    collegeAddress ||
    "Quetta, Balochistan, Pakistan";

  // Extract all marks within [startSem, endSem]
  const semestersMap: Record<number, NonNullable<TranscriptStudentData["marks"]>> = {};
  (student.marks || []).forEach((m) => {
    const sem = m.course?.semester ?? m.semester ?? 1;
    if (sem >= startSem && sem <= endSem) {
      if (!semestersMap[sem]) semestersMap[sem] = [];
      semestersMap[sem].push(m);
    }
  });

  // Collect semesters that fall in range
  const targetSemesters: number[] = [];
  for (let s = startSem; s <= endSem; s++) {
    targetSemesters.push(s);
  }

  // Split into odd (left column) and even (right column)
  const oddSemesters = targetSemesters.filter((s) => s % 2 === 1);
  const evenSemesters = targetSemesters.filter((s) => s % 2 === 0);

  let grandTotalCredits = 0;
  let grandTotalMax = 0;
  let grandTotalObtained = 0;
  let grandTotalGPPoints = 0;

  // Compute per-semester data
  const semesterDataMap: Record<
    number,
    {
      semester: number;
      semName: string;
      items: Array<{
        sr: number;
        code: string;
        title: string;
        creditHours: number;
        totalMarks: number;
        obtainedMarks: string | number;
        grade: string;
        gradePoint: string;
        isAbsent: boolean;
      }>;
      semCredits: number;
      semMax: number;
      semObt: number;
      sgpa: string;
    }
  > = {};

  targetSemesters.forEach((sem) => {
    const marks = semestersMap[sem] || [];
    let semCredits = 0;
    let semMax = 0;
    let semObt = 0;
    let semGPPoints = 0;

    const items = marks.map((m, idx) => {
      const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
      const credit = m.course?.creditHours || 3;
      const max = m.totalMarks || 100;
      const obt = isAbsent ? 0 : m.obtainedMarks;
      const gp = isAbsent ? 0.0 : getGPValue(obt, max);
      const pct = max > 0 ? (obt / max) * 100 : 0;
      const grade = isAbsent ? "F" : getGradeLetter(pct, true);

      semCredits += credit;
      semMax += max;
      semObt += obt;
      semGPPoints += gp * credit;

      return {
        sr: idx + 1,
        code: m.course?.code || `COURSE-${sem}0${idx + 1}`,
        title: m.course?.title || "Course",
        creditHours: credit,
        totalMarks: max,
        obtainedMarks: isAbsent ? "A" : obt,
        grade,
        gradePoint: isAbsent ? "0.00" : gp.toFixed(2),
        isAbsent,
      };
    });

    const sgpa = semCredits > 0 ? (semGPPoints / semCredits).toFixed(2) : "0.00";

    grandTotalCredits += semCredits;
    grandTotalMax += semMax;
    grandTotalObtained += semObt;
    grandTotalGPPoints += semGPPoints;

    semesterDataMap[sem] = {
      semester: sem,
      semName: SEMESTER_NAMES[sem] || `SEMESTER ${sem}`,
      items,
      semCredits,
      semMax,
      semObt,
      sgpa,
    };
  });

  // Calculate Cumulative CGPA
  const semestersDataForCgpa = targetSemesters.map((s) => ({
    semester: s,
    gpa: parseFloat(semesterDataMap[s]?.sgpa || "0"),
    creditHours: semesterDataMap[s]?.semCredits || 0,
  }));

  const { cgpa } = calculateStudentCGPA(
    { bsAdmissionType: student.bsAdmissionType || null },
    semestersDataForCgpa
  );

  const overallPercentage = grandTotalMax > 0 ? Math.round((grandTotalObtained / grandTotalMax) * 100) : 0;
  const overallGrade = getGradeLetter(overallPercentage, true);

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
  const progAbbr = (programName.replace(/[^A-Z]/g, "").slice(0, 4) || "ZOOL");
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
    `${collegeCode}-${String((rollNo.replace(/\D/g, "") || "706")).padStart(6, "0")}`;

  // Department / Institute address
  const fullInstituteName = activeCollegeAddress
    ? `${activeCollegeName}, ${activeCollegeAddress}`
    : activeCollegeName;

  // Render a single semester table
  const renderSemesterTable = (sem: number) => {
    const semData = semesterDataMap[sem];
    if (!semData) return null;

    return (
      <div key={sem} className="border border-black overflow-hidden mb-2.5 bg-white">
        <table className="w-full border-collapse text-black text-[9px] leading-tight">
          <thead>
            {/* Semester Heading */}
            <tr className="border-b border-black">
              <th
                colSpan={7}
                className="py-1 px-1 text-center font-bold tracking-wider uppercase text-[10px] text-black bg-white"
              >
                {semData.semName}
              </th>
            </tr>
            {/* Column Headers */}
            <tr className="border-b border-black text-[8px] font-bold uppercase tracking-tight text-center">
              <th className="border-r border-black py-1 px-0.5 w-[24px]">S/No</th>
              <th className="border-r border-black py-1 px-1 text-left w-[120px]">COURSE CODE</th>
              <th className="border-r border-black py-1 px-0.5 w-[38px] leading-none">
                CREDIT<br />HOURS
              </th>
              <th className="border-r border-black py-1 px-0.5 w-[42px] leading-none">
                TOTAL<br />MARKS
              </th>
              <th className="border-r border-black py-1 px-0.5 w-[42px] leading-none">
                MARKS<br />OBT.
              </th>
              <th className="border-r border-black py-1 px-0.5 w-[34px]">GRADE</th>
              <th className="py-1 px-0.5 w-[44px] leading-none">
                GRADE<br />POINT
              </th>
            </tr>
          </thead>
          <tbody>
            {semData.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-3 text-gray-400 italic">
                  No examination papers recorded
                </td>
              </tr>
            ) : (
              semData.items.map((row) => (
                <tr key={row.sr} className="border-b border-black text-center font-normal">
                  <td className="border-r border-black py-0.5 px-0.5">{row.sr}</td>
                  <td
                    className="border-r border-black py-0.5 px-1 text-left font-mono font-medium truncate max-w-[120px]"
                    title={row.title}
                  >
                    {row.code}
                  </td>
                  <td className="border-r border-black py-0.5 px-0.5">{row.creditHours}</td>
                  <td className="border-r border-black py-0.5 px-0.5">{row.totalMarks}</td>
                  <td className={`border-r border-black py-0.5 px-0.5 ${row.isAbsent ? "font-bold text-red-600" : ""}`}>
                    {row.obtainedMarks}
                  </td>
                  <td className={`border-r border-black py-0.5 px-0.5 font-bold ${row.grade === "F" ? "text-red-600" : ""}`}>
                    {row.grade}
                  </td>
                  <td className="py-0.5 px-0.5">{row.gradePoint}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            {/* GPA Row */}
            <tr className="border-t border-black font-bold">
              <td colSpan={5} className="border-r border-black py-0.5 px-1 text-right text-[8.5px]"></td>
              <td className="border-r border-black py-0.5 px-1 text-center font-bold text-[9px]">GPA</td>
              <td className="py-0.5 px-1 text-center font-black text-[9px]">{semData.sgpa}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div className="official-transcript-root bg-white text-black p-4 sm:p-6 mx-auto max-w-[850px] font-sans border-2 border-black shadow-lg print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-[11px] leading-snug">
      {/* ─── 1. TOP SERIAL NUMBER ─── */}
      <div className="flex justify-end text-[11px] font-serif tracking-normal text-black mb-1">
        <span>No. {serialNoStr}</span>
      </div>

      {/* ─── 2. MAIN HEADER (CONCERNED COLLEGE NAME) ─── */}
      <div className="text-center space-y-0.5 mb-3">
        <h1 className="font-serif text-2xl sm:text-[26px] font-black tracking-tight text-black uppercase">
          {activeCollegeName}
        </h1>
        {activeCollegeAddress && (
          <p className="text-[10px] font-semibold text-gray-700 tracking-wide uppercase">
            {activeCollegeAddress}
          </p>
        )}
        <h2 className="text-xs sm:text-sm font-bold tracking-[0.22em] text-black uppercase mt-1">
          STUDENT TRANSCRIPT
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

      {/* ─── 4. PROGRAM TITLE BAR ─── */}
      <div className="border-t-2 border-b-2 border-black py-1 my-2 text-center text-xs font-bold tracking-wider uppercase text-black">
        {programName} (4 YEAR'S PROGRAM)
      </div>

      {/* ─── 5. TWO-COLUMN SEMESTERS GRID ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 mb-1">
        {/* Left Column: Odd Semesters (1, 3, 5, 7) */}
        <div>
          {oddSemesters.map((sem) => renderSemesterTable(sem))}
        </div>

        {/* Right Column: Even Semesters (2, 4, 6, 8) */}
        <div>
          {evenSemesters.map((sem) => renderSemesterTable(sem))}
        </div>
      </div>

      {/* ─── 6. CUMULATIVE MARKS SUMMARY ROW ─── */}
      <div className="border border-black py-1.5 px-3 mb-4 flex items-center justify-between flex-wrap gap-2 text-[11px] text-black">
        <div>
          Obtained Marks <strong className="underline ml-1 text-black font-black">{grandTotalObtained}</strong>
        </div>
        <div>
          Total Marks <strong className="underline ml-1 text-black font-black">{grandTotalMax}</strong>
        </div>
        <div>
          Grade <strong className="underline ml-1 text-black font-black">{overallGrade}</strong>
        </div>
        <div>
          Percentage <strong className="underline ml-1 text-black font-black">{overallPercentage}%</strong>
        </div>
        <div>
          CGPA <strong className="underline ml-1 text-black font-black text-xs">{cgpa.toFixed(2)}</strong>
        </div>
      </div>

      {/* ─── 7. FOOTER / SIGNATURES ─── */}
      <div className="grid grid-cols-2 gap-4 items-end pt-2 text-[10.5px]">
        {/* Left Signature Column */}
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="w-24 shrink-0 font-normal">Prepared By:</span>
              <div className="border-b border-black flex-1 h-3 flex items-end">
                <span className="font-serif italic text-xs tracking-widest text-gray-700 pl-4">H.A</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-24 shrink-0 font-normal">Checked By:</span>
              <div className="border-b border-black flex-1 h-3 flex items-end">
                <span className="font-serif italic text-xs tracking-widest text-gray-700 pl-4">N.K</span>
              </div>
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
          {/* Controller Signature Area */}
          <div className="h-10 flex items-center justify-center">
            <span className="font-serif italic text-base tracking-widest text-gray-800 -rotate-3 select-none">
              A.K. Lehri
            </span>
          </div>

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
