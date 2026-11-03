"use client";

import { useState, useEffect } from "react";
import { getGPValue, calculateStudentCGPA } from "@/lib/cgpa";
import { useSettings } from "@/lib/useSettings";

type MarkEntry = {
  courseId?: string;
  semester?: number;
  obtainedMarks: number;
  totalMarks: number;
  status?: string;
  course: { id?: string; creditHours: number; title: string; semester?: number; code?: string; programId?: string };
};

type FailedCourse = {
  id?: string;
  title: string;
  code?: string;
  programId?: string;
};

type StudentData = {
  id: string;
  rollNumber: string;
  fatherName?: string | null;
  cnic?: string | null;
  session: string | null;
  user: { name: string; email?: string };
  currentSemester: number | null;
  bsAdmissionType: string | null;
  programId: string | null;
  program: { id: string; name: string } | null;
  marks: MarkEntry[];
};

type Program = { id: string; name: string; educationLevel: string };

/** Derives letter grade from GPA and Percentage using standard HEC scale */
function getGrade(gpa: number, pct: number): string {
  if (gpa >= 3.80 || pct >= 85) return "A+";
  if (gpa >= 3.50 || pct >= 80) return "A";
  if (gpa >= 3.00 || pct >= 75) return "B+";
  if (gpa >= 2.50 || pct >= 65) return "B";
  if (gpa >= 2.00 || pct >= 58) return "C";
  if (gpa >= 1.00 || pct >= 50) return "D";
  return "F";
}

/** Academic Discipline Standard Color Theme Palette */
function getProgramColor(progName: string) {
  const p = (progName || "").toLowerCase();

  // BS Computer Science: Dark Blue
  if (p.includes("computer")) {
    return {
      headerBg: "bg-blue-950/95 print:bg-blue-50",
      badgeBg: "bg-blue-600/30 text-blue-200 border-blue-400/50 print:bg-blue-100 print:text-blue-900",
      accentText: "text-blue-300 print:text-blue-800",
      bannerBg: "from-blue-950 via-slate-900 to-slate-950 border-blue-800/60",
      indicatorColor: "bg-blue-500",
    };
  }

  // BS Chemistry: Golden Yellow (Science standard)
  if (p.includes("chem")) {
    return {
      headerBg: "bg-amber-950/90 print:bg-amber-50",
      badgeBg: "bg-amber-500/25 text-amber-300 border-amber-400/60 print:bg-amber-100 print:text-amber-900",
      accentText: "text-amber-300 print:text-amber-800",
      bannerBg: "from-amber-950 via-slate-900 to-slate-950 border-amber-800/60",
      indicatorColor: "bg-amber-500",
    };
  }

  // BS Economics: Copper / Rust (Currency & Trade standard)
  if (p.includes("econ")) {
    return {
      headerBg: "bg-[#2d160e] print:bg-orange-50",
      badgeBg: "bg-[#8b4513]/40 text-orange-200 border-orange-500/50 print:bg-orange-100 print:text-orange-900",
      accentText: "text-orange-300 print:text-orange-800",
      bannerBg: "from-[#2d160e] via-slate-900 to-slate-950 border-orange-800/60",
      indicatorColor: "bg-orange-500",
    };
  }

  // BS Education: Light Blue / Sky Blue
  if (p.includes("education")) {
    return {
      headerBg: "bg-sky-950/90 print:bg-sky-50",
      badgeBg: "bg-sky-500/25 text-sky-200 border-sky-400/60 print:bg-sky-100 print:text-sky-900",
      accentText: "text-sky-300 print:text-sky-800",
      bannerBg: "from-sky-950 via-slate-900 to-slate-950 border-sky-800/60",
      indicatorColor: "bg-sky-500",
    };
  }

  // BS English: Pure White / Silver (Arts & Literature standard)
  if (p.includes("english")) {
    return {
      headerBg: "bg-slate-900 print:bg-slate-50",
      badgeBg: "bg-white text-slate-950 border-slate-200 font-black print:bg-slate-200 print:text-slate-900",
      accentText: "text-slate-200 print:text-slate-800",
      bannerBg: "from-slate-800 via-slate-900 to-slate-950 border-slate-600/60",
      indicatorColor: "bg-slate-300",
    };
  }

  // BS Geography: Golden Yellow (Science faculty) / White
  if (p.includes("geograph")) {
    return {
      headerBg: "bg-amber-950/90 print:bg-amber-50",
      badgeBg: "bg-amber-500/25 text-amber-300 border-amber-400/60 print:bg-amber-100 print:text-amber-900",
      accentText: "text-amber-300 print:text-amber-800",
      bannerBg: "from-amber-950 via-slate-900 to-slate-950 border-amber-800/60",
      indicatorColor: "bg-amber-500",
    };
  }

  // BS Islamiat: Islamic Green / White
  if (p.includes("islam")) {
    return {
      headerBg: "bg-emerald-950/95 print:bg-emerald-50",
      badgeBg: "bg-emerald-600/30 text-emerald-200 border-emerald-400/60 print:bg-emerald-100 print:text-emerald-900",
      accentText: "text-emerald-300 print:text-emerald-800",
      bannerBg: "from-emerald-950 via-slate-900 to-slate-950 border-emerald-800/60",
      indicatorColor: "bg-emerald-500",
    };
  }

  // BS Math / Mathematics: Golden Yellow (Science standard)
  if (p.includes("math")) {
    return {
      headerBg: "bg-amber-950/90 print:bg-amber-50",
      badgeBg: "bg-amber-500/25 text-amber-300 border-amber-400/60 print:bg-amber-100 print:text-amber-900",
      accentText: "text-amber-300 print:text-amber-800",
      bannerBg: "from-amber-950 via-slate-900 to-slate-950 border-amber-800/60",
      indicatorColor: "bg-amber-500",
    };
  }

  // BS Physics: Golden Yellow (Science standard)
  if (p.includes("physic")) {
    return {
      headerBg: "bg-amber-950/90 print:bg-amber-50",
      badgeBg: "bg-amber-500/25 text-amber-300 border-amber-400/60 print:bg-amber-100 print:text-amber-900",
      accentText: "text-amber-300 print:text-amber-800",
      bannerBg: "from-amber-950 via-slate-900 to-slate-950 border-amber-800/60",
      indicatorColor: "bg-amber-500",
    };
  }

  // BS Political Science: Dark Blue
  if (p.includes("politic")) {
    return {
      headerBg: "bg-blue-950/95 print:bg-blue-50",
      badgeBg: "bg-blue-600/30 text-blue-200 border-blue-400/50 print:bg-blue-100 print:text-blue-900",
      accentText: "text-blue-300 print:text-blue-800",
      bannerBg: "from-blue-950 via-slate-900 to-slate-950 border-blue-800/60",
      indicatorColor: "bg-blue-500",
    };
  }

  // BS Sociology: Citron / Lime (Social Sciences standard)
  if (p.includes("sociolog")) {
    return {
      headerBg: "bg-lime-950/90 print:bg-lime-50",
      badgeBg: "bg-lime-500/25 text-lime-200 border-lime-400/60 print:bg-lime-100 print:text-lime-900",
      accentText: "text-lime-300 print:text-lime-800",
      bannerBg: "from-lime-950 via-slate-900 to-slate-950 border-lime-800/60",
      indicatorColor: "bg-lime-500",
    };
  }

  // BS Zoology / Botany / Biology: Golden Yellow (Biology & Sciences standard)
  if (p.includes("zoolo") || p.includes("botan") || p.includes("biolog")) {
    return {
      headerBg: "bg-amber-950/90 print:bg-amber-50",
      badgeBg: "bg-amber-500/25 text-amber-300 border-amber-400/60 print:bg-amber-100 print:text-amber-900",
      accentText: "text-amber-300 print:text-amber-800",
      bannerBg: "from-amber-950 via-slate-900 to-slate-950 border-amber-800/60",
      indicatorColor: "bg-amber-500",
    };
  }

  // Default / Other disciplines
  return {
    headerBg: "bg-slate-900 print:bg-slate-100",
    badgeBg: "bg-violet-500/25 text-violet-200 border-violet-400/50 print:bg-violet-100 print:text-violet-900",
    accentText: "text-slate-300 print:text-slate-700",
    bannerBg: "from-slate-900 via-slate-900 to-slate-950 border-slate-700",
    indicatorColor: "bg-blue-500",
  };
}

/** Derives student results for a given semester using the shared cgpa lib */
function buildStudentResults(
  s: StudentData,
  selectedSemester: number
) {
  const semestersMap: Record<number, { gpPoints: number; credits: number }> = {};
  const failedCourses: FailedCourse[] = [];

  (s.marks || []).forEach((m) => {
    const sem = m.course?.semester ?? m.semester ?? 1;
    const credit = m.course?.creditHours || 3;
    const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
    const gp = isAbsent ? 0.0 : getGPValue(m.obtainedMarks, m.totalMarks);

    if ((gp === 0 || isAbsent) && sem === selectedSemester) {
      failedCourses.push({
        id: m.course?.id,
        title: isAbsent ? `${m.course?.title || "Subject"} (A)` : (m.course?.title || "Subject"),
        code: m.course?.code,
        programId: m.course?.programId || s.programId || undefined,
      });
    }

    if (!semestersMap[sem]) semestersMap[sem] = { gpPoints: 0, credits: 0 };
    semestersMap[sem].gpPoints += gp * credit;
    semestersMap[sem].credits += credit;
  });

  const semestersData = Object.entries(semestersMap).map(([semStr, d]) => ({
    semester: parseInt(semStr),
    gpa: d.credits > 0 ? parseFloat((d.gpPoints / d.credits).toFixed(2)) : 0,
    creditHours: d.credits,
  }));

  const { cgpa } = calculateStudentCGPA({ bsAdmissionType: s.bsAdmissionType }, semestersData);
  const targetSem = semestersData.find((sd) => sd.semester === selectedSemester);
  const gpa = targetSem ? targetSem.gpa : 0;

  // Per-course marks + totals for selected semester (supports both ID and Title lookup)
  const courseMarksById: Record<string, number | "A"> = {};
  const courseMarksByTitle: Record<string, number | "A"> = {};
  let totalObtained = 0;
  let totalMax = 0;
  let totalAbsentCount = 0;
  let semPaperCount = 0;

  (s.marks || [])
    .filter((m) => (m.course?.semester ?? m.semester ?? 1) === selectedSemester)
    .forEach((m) => {
      semPaperCount++;
      const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
      if (isAbsent) {
        totalAbsentCount++;
        if (m.courseId) courseMarksById[m.courseId] = "A";
        if (m.course?.id) courseMarksById[m.course.id] = "A";
        if (m.course?.title) courseMarksByTitle[m.course.title.trim().toLowerCase()] = "A";
      } else {
        if (m.courseId) courseMarksById[m.courseId] = m.obtainedMarks;
        if (m.course?.id) courseMarksById[m.course.id] = m.obtainedMarks;
        if (m.course?.title) {
          courseMarksByTitle[m.course.title.trim().toLowerCase()] = m.obtainedMarks;
        }
        totalObtained += m.obtainedMarks;
      }
      totalMax += m.totalMarks;
    });

  const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  let grade = "—";
  if (totalMax > 0) {
    if (totalAbsentCount > 0 && totalAbsentCount === semPaperCount) {
      grade = "F (A)";
    } else if (gpa < 1.00) {
      grade = "F";
    } else {
      grade = getGrade(gpa, pct);
    }
  }

  // Per-semester promotion logic based on university rules:
  let status = "PROMOTED";
  if (totalMax === 0) {
    status = "—";
  } else if (totalAbsentCount > 0 && totalAbsentCount === semPaperCount) {
    status = "ABSENT";
  } else if (selectedSemester === 1) {
    if (gpa >= 1.00) status = "PROMOTED";
    else status = "DROPOUT";
  } else if (selectedSemester === 2) {
    if (cgpa >= 1.50) status = "PROMOTED";
    else if (cgpa >= 1.00) status = "PROBATION";
    else status = "DROPOUT";
  } else if (selectedSemester === 3) {
    if (cgpa >= 1.75) status = "PROMOTED";
    else if (cgpa >= 1.00) status = "PROBATION";
    else status = "DROPOUT";
  } else {
    // Semesters 4 to 8
    if (cgpa >= 2.00) status = "PROMOTED";
    else if (cgpa >= 1.00) status = "PROBATION";
    else status = "DROPOUT";
  }

  // Cumulative Marks & Credit Hours up to current selected semester
  let cumObtained = 0;
  let cumMax = 0;
  let cumCredits = 0;

  (s.marks || [])
    .filter((m) => {
      const sem = m.course?.semester ?? m.semester ?? 1;
      if (s.bsAdmissionType === "BRIDGING_5TH") {
        return sem >= 5 && sem <= selectedSemester;
      }
      return sem >= 1 && sem <= selectedSemester;
    })
    .forEach((m) => {
      const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
      if (!isAbsent) cumObtained += m.obtainedMarks;
      cumMax += m.totalMarks;
      cumCredits += m.course?.creditHours || 3;
    });

  // Serialized / numbered failed papers: "1. Math, 2. Physics"
  let remarks = "Passed";
  if (totalMax === 0) {
    remarks = "—";
  } else if (totalAbsentCount > 0 && totalAbsentCount === semPaperCount) {
    remarks = "Absent in all Exam Papers (A)";
  } else if (failedCourses.length > 0) {
    const serializedFailed = failedCourses.map((c, i) => `${i + 1}. ${c.title}`).join(", ");
    remarks = `Failed in ${failedCourses.length} Paper(s): ${serializedFailed}`;
  }

  return {
    gpa,
    cgpa,
    status,
    grade,
    pct,
    totalObtained,
    totalMax,
    totalAbsentCount,
    semPaperCount,
    courseMarksById,
    courseMarksByTitle,
    failedCourses,
    remarks,
    cumObtained,
    cumMax,
    cumCredits,
  };
}

type ProgramSessionGroup = {
  programId: string;
  programName: string;
  session: string;
  students: StudentData[];
  courses: Array<{ id?: string; title: string; code?: string; creditHours: number }>;
  courseMaxMarks: Record<string, number>;
  grandTotalMax: number;
  theme: ReturnType<typeof getProgramColor>;
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OFFICIAL DETAILED MARKS CERTIFICATE (DMC) PRINT CARD
 * Dynamically generated from Live Gazette Results Data — Zero Hardcoding
 * ═══════════════════════════════════════════════════════════════════════════
 */
function DMCPrintCard({
  student,
  semester,
  collegeName,
  collegeLogo,
  collegeTagline,
  collegeAddress,
  programName,
  session,
}: {
  student: StudentData;
  semester: number;
  collegeName: string;
  collegeLogo?: string;
  collegeTagline?: string;
  collegeAddress?: string;
  programName: string;
  session: string;
}) {
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
    const obtained = isAbsent ? 0 : m.obtainedMarks;
    const gp = isAbsent ? 0.0 : getGPValue(obtained, max);
    const pct = max > 0 ? (obtained / max) * 100 : 0;
    const grade = isAbsent ? "F (A)" : getGrade(gp, pct);
    const remarks = isAbsent ? "Absent (A)" : gp >= 1.0 ? "Pass" : "Fail";

    if (isAbsent) absentCount++;
    totalCredits += credit;
    totalMax += max;
    totalObtained += obtained;
    totalGPPoints += gp * credit;

    return {
      sr: idx + 1,
      code: m.course?.code || `BS-${101 + idx}`,
      title: m.course?.title || "Subject",
      credit,
      max,
      obtained: isAbsent ? "A" : obtained,
      isAbsent,
      pct: pct.toFixed(1),
      gp: gp.toFixed(2),
      grade,
      remarks,
    };
  });

  const sgpa = totalCredits > 0 ? (totalGPPoints / totalCredits).toFixed(2) : "0.00";
  const semPct = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "0.0";
  const isAllAbsent = absentCount > 0 && absentCount === semMarks.length;

  // Derive CGPA using calculateStudentCGPA
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

  const { cgpa } = calculateStudentCGPA({ bsAdmissionType: student.bsAdmissionType }, semestersData);

  // Status computation
  let status = "PROMOTED";
  if (totalMax === 0) status = "—";
  else if (isAllAbsent) status = "ABSENT";
  else if (semester === 1) status = parseFloat(sgpa) >= 1.0 ? "PROMOTED" : "DROPOUT";
  else if (semester === 2) status = cgpa >= 1.5 ? "PROMOTED" : cgpa >= 1.0 ? "PROBATION" : "DROPOUT";
  else if (semester === 3) status = cgpa >= 1.75 ? "PROMOTED" : cgpa >= 1.0 ? "PROBATION" : "DROPOUT";
  else status = cgpa >= 2.0 ? "PROMOTED" : cgpa >= 1.0 ? "PROBATION" : "DROPOUT";

  const issueDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="page-break-student bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-slate-900 shadow-md print:shadow-none print:border-2 print:border-slate-900 print:rounded-none relative overflow-hidden font-sans">
      {/* Decorative Government Watermark in Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
        <span className="text-[120px] font-black uppercase tracking-widest text-slate-900">CHTE</span>
      </div>

      <div className="space-y-4 relative z-10">
        {/* Header Section */}
        <div className="border-b-2 border-slate-900 pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              {collegeLogo ? (
                <img src={collegeLogo} alt="Logo" className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
                  🏛️
                </div>
              )}
            </div>

            <div className="text-center flex-1">
              <div className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">
                Government of Balochistan
              </div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Department of Higher &amp; Technical Education
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight mt-0.5">
                {collegeName}
              </h1>
              <p className="text-[9.5px] font-semibold text-slate-500 italic">
                {collegeAddress || collegeTagline || "Quetta, Balochistan, Pakistan"}
              </p>
            </div>

            <div className="w-20 h-16 flex flex-col items-center justify-center border border-slate-300 rounded-lg p-1 bg-slate-50 text-center shrink-0">
              <span className="text-[7.5px] font-extrabold uppercase text-slate-400">Official</span>
              <span className="text-xs font-black text-slate-900">DMC</span>
              <span className="text-[7.5px] font-bold text-slate-500">BS 4-Year</span>
            </div>
          </div>

          <div className="mt-2.5 py-1 px-4 bg-slate-900 text-white rounded-lg flex items-center justify-between flex-wrap gap-2 text-[11px] font-black uppercase tracking-wider print:bg-slate-900 print:text-white">
            <span>Detailed Marks Certificate (DMC)</span>
            <span>Semester {semester} Examination</span>
          </div>
        </div>

        {/* Student Profile Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Student Name</span>
            <strong className="text-slate-950 text-xs font-black">{student.user?.name}</strong>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Father's Name</span>
            <strong className="text-slate-800 font-bold">{student.fatherName || "—"}</strong>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Roll Number</span>
            <strong className="text-blue-900 font-mono font-black text-xs">{student.rollNumber}</strong>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Degree Program</span>
            <strong className="text-slate-900 font-bold">{student.program?.name || programName}</strong>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Academic Session</span>
            <strong className="text-slate-800 font-bold">{student.session || session}</strong>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Admission Mode</span>
            <strong className="text-slate-800 font-bold">
              {student.bsAdmissionType === "BRIDGING_5TH" ? "Bridging (5th Sem Intake)" : "Regular (4-Year)"}
            </strong>
          </div>
        </div>

        {/* Marks Table */}
        <div className="border border-slate-300 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-800 text-white font-black uppercase tracking-wider text-[9px] print:bg-slate-800 print:text-white">
              <tr>
                <th className="p-2 text-center w-8">#</th>
                <th className="p-2 w-20">Code</th>
                <th className="p-2">Course Title</th>
                <th className="p-2 text-center w-14">Cr. Hrs</th>
                <th className="p-2 text-center w-14">Max</th>
                <th className="p-2 text-center w-16">Obtained</th>
                <th className="p-2 text-center w-12">%</th>
                <th className="p-2 text-center w-12">GP</th>
                <th className="p-2 text-center w-12">Grade</th>
                <th className="p-2 text-center w-16">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {coursesDetails.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-5 text-center text-slate-400 font-bold text-xs">
                    No examination records found for Semester {semester}.
                  </td>
                </tr>
              ) : (
                coursesDetails.map((c) => (
                  <tr key={c.sr} className={c.isAbsent ? "bg-rose-50/50" : "hover:bg-slate-50/60"}>
                    <td className="p-2 text-center font-bold text-slate-400">{c.sr}</td>
                    <td className="p-2 font-mono font-bold text-slate-700">{c.code}</td>
                    <td className="p-2 font-bold text-slate-900">{c.title}</td>
                    <td className="p-2 text-center font-bold text-slate-800">{c.credit}</td>
                    <td className="p-2 text-center font-bold text-slate-600">{c.max}</td>
                    <td className={`p-2 text-center font-black ${c.isAbsent ? "text-rose-700" : "text-slate-900"}`}>
                      {c.obtained}
                    </td>
                    <td className="p-2 text-center font-bold text-slate-700">{c.isAbsent ? "—" : c.pct}</td>
                    <td className="p-2 text-center font-bold text-slate-800">{c.gp}</td>
                    <td className={`p-2 text-center font-black ${c.grade.startsWith("F") ? "text-rose-600" : "text-emerald-700"}`}>
                      {c.grade}
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase ${
                        c.remarks === "Pass"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {c.remarks}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {coursesDetails.length > 0 && (
              <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400 text-xs">
                <tr>
                  <td colSpan={3} className="p-2 uppercase tracking-wider text-right">
                    Semester Total / Performance:
                  </td>
                  <td className="p-2 text-center font-black">{totalCredits}</td>
                  <td className="p-2 text-center">{totalMax}</td>
                  <td className="p-2 text-center font-black text-blue-900">{isAllAbsent ? "A" : totalObtained}</td>
                  <td className="p-2 text-center">{isAllAbsent ? "—" : `${semPct}%`}</td>
                  <td className="p-2 text-center text-blue-900">{sgpa}</td>
                  <td colSpan={2} className="p-2 text-center">
                    SGPA: <span className="text-blue-900 font-black text-sm">{sgpa}</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Academic Status & Summary Callout */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
          <div className="border-r border-slate-200 last:border-none p-1">
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Semester GPA (SGPA)</span>
            <span className="text-base font-black text-blue-900">{sgpa}</span>
          </div>
          <div className="border-r border-slate-200 last:border-none p-1">
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Cumulative GPA (CGPA)</span>
            <span className="text-base font-black text-indigo-900">{cgpa.toFixed(2)}</span>
          </div>
          <div className="border-r border-slate-200 last:border-none p-1">
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Credit Hours</span>
            <span className="text-base font-black text-slate-900">{totalCredits} Cr</span>
          </div>
          <div className="p-1">
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Semester Standing</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider mt-0.5 ${
              status === "PROMOTED"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : status === "PROBATION"
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-rose-100 text-rose-800 border border-rose-300"
            }`}>
              {status}
            </span>
          </div>
        </div>

        {/* Grading Key Note */}
        <div className="text-[8px] text-slate-500 border border-slate-200 bg-slate-50/50 p-1.5 rounded-lg leading-relaxed">
          <strong className="text-slate-700">HEC Linear Grading Policy (4.0 Scale):</strong> A+ (85%+ / 4.00), A (80-84% / 3.50-3.90), B+ (75-79% / 3.00-3.40), B (65-74% / 2.50-2.90), C (58-64% / 2.00-2.40), D (50-57% / 1.00-1.90), F / Absent (&lt;50% / 0.00). SGPA/CGPA calculated as Sum(GP * Credits) / Sum(Credits).
        </div>
      </div>

      {/* Official Signatures Footer */}
      <div className="mt-6 pt-5 border-t-2 border-slate-900 grid grid-cols-4 gap-4 text-center text-[9.5px] font-black uppercase tracking-wider text-slate-800 relative z-10">
        <div>
          <div className="h-9 border-b border-dashed border-slate-400 mb-1"></div>
          <span>Prepared By</span>
        </div>
        <div>
          <div className="h-9 border-b border-dashed border-slate-400 mb-1"></div>
          <span>Checked By (Tabulator)</span>
        </div>
        <div>
          <div className="h-9 border-b border-dashed border-slate-400 mb-1"></div>
          <span>Incharge Exams</span>
        </div>
        <div>
          <div className="h-9 border-b border-dashed border-slate-400 mb-1 flex items-center justify-center">
            <span className="text-[7px] text-slate-300 uppercase tracking-widest">[ College Seal ]</span>
          </div>
          <span>Principal / Head</span>
        </div>
      </div>

      <div className="mt-2.5 flex justify-between items-center text-[7.5px] text-slate-400 font-semibold border-t border-slate-200 pt-1">
        <span>Generated from Official Results Gazette &bull; Errors and Omissions Excepted (E&amp;OE)</span>
        <span>Issue Date: {issueDate}</span>
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OFFICIAL ACADEMIC DEGREE TRANSCRIPT PRINT CARD
 * Dynamically generated from Live Gazette Results Data — Zero Hardcoding
 * ═══════════════════════════════════════════════════════════════════════════
 */
function TranscriptPrintCard({
  student,
  maxSemester,
  collegeName,
  collegeLogo,
  collegeTagline,
  collegeAddress,
  programName,
  session,
}: {
  student: StudentData;
  maxSemester: number;
  collegeName: string;
  collegeLogo?: string;
  collegeTagline?: string;
  collegeAddress?: string;
  programName: string;
  session: string;
}) {
  // Extract all distinct semesters present in student.marks
  const semestersMap: Record<number, MarkEntry[]> = {};
  (student.marks || []).forEach((m) => {
    const sem = m.course?.semester ?? m.semester ?? 1;
    if (sem <= maxSemester) {
      if (!semestersMap[sem]) semestersMap[sem] = [];
      semestersMap[sem].push(m);
    }
  });

  const availableSemesters = Object.keys(semestersMap)
    .map(Number)
    .sort((a, b) => a - b);

  if (availableSemesters.length === 0) {
    availableSemesters.push(1);
  }

  let grandTotalCredits = 0;
  let grandTotalMax = 0;
  let grandTotalObtained = 0;
  let grandTotalGPPoints = 0;

  const semesterCards = availableSemesters.map((sem) => {
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
      const grade = isAbsent ? "F (A)" : getGrade(gp, pct);

      semCredits += credit;
      semMax += max;
      semObt += obt;
      semGPPoints += gp * credit;

      return {
        sr: idx + 1,
        code: m.course?.code || `BS-${sem}0${idx + 1}`,
        title: m.course?.title || "Subject",
        credit,
        max,
        obt: isAbsent ? "A" : obt,
        isAbsent,
        grade,
        gp: gp.toFixed(2),
      };
    });

    const sgpa = semCredits > 0 ? (semGPPoints / semCredits).toFixed(2) : "0.00";

    grandTotalCredits += semCredits;
    grandTotalMax += semMax;
    grandTotalObtained += semObt;
    grandTotalGPPoints += semGPPoints;

    return {
      semester: sem,
      items,
      semCredits,
      semMax,
      semObt,
      sgpa,
    };
  });

  // Calculate CGPA across relevant semesters
  const semestersData = semesterCards.map((sc) => ({
    semester: sc.semester,
    gpa: parseFloat(sc.sgpa),
    creditHours: sc.semCredits,
  }));

  const { cgpa, totalCredits } = calculateStudentCGPA(
    { bsAdmissionType: student.bsAdmissionType },
    semestersData
  );

  const overallPct = grandTotalMax > 0 ? ((grandTotalObtained / grandTotalMax) * 100).toFixed(1) : "0.0";
  const issueDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="page-break-student bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-slate-900 shadow-md print:shadow-none print:border-2 print:border-slate-900 print:rounded-none relative overflow-hidden font-sans">
      <div className="space-y-4 relative z-10">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              {collegeLogo ? (
                <img src={collegeLogo} alt="Logo" className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
                  🏛️
                </div>
              )}
            </div>

            <div className="text-center flex-1">
              <div className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">
                Government of Balochistan
              </div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Department of Higher &amp; Technical Education
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight mt-0.5">
                {collegeName}
              </h1>
              <p className="text-[9.5px] font-semibold text-slate-500 italic">
                {collegeAddress || collegeTagline || "Quetta, Balochistan, Pakistan"}
              </p>
            </div>

            <div className="w-20 h-16 flex flex-col items-center justify-center border border-slate-300 rounded-lg p-1 bg-slate-50 text-center shrink-0">
              <span className="text-[7px] font-extrabold uppercase text-slate-400">Official</span>
              <span className="text-xs font-black text-purple-900">Transcript</span>
              <span className="text-[7px] font-bold text-slate-500">Degree Record</span>
            </div>
          </div>

          <div className="mt-2.5 py-1 px-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-lg flex items-center justify-between flex-wrap gap-2 text-[11px] font-black uppercase tracking-wider print:bg-slate-900 print:text-white">
            <span>Official Academic Degree Transcript</span>
            <span>Bachelor of Science (BS 4-Year)</span>
          </div>
        </div>

        {/* Student Profile Info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Student Name</span>
            <strong className="text-slate-950 text-xs font-black">{student.user?.name}</strong>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Father's Name</span>
            <strong className="text-slate-800 font-bold">{student.fatherName || "—"}</strong>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Roll Number</span>
            <strong className="text-purple-900 font-mono font-black text-xs">{student.rollNumber}</strong>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Degree Program</span>
            <strong className="text-slate-900 font-bold">{student.program?.name || programName}</strong>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Batch / Session</span>
            <strong className="text-slate-800 font-bold">{student.session || session}</strong>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Admission Mode</span>
            <strong className="text-slate-800 font-bold">
              {student.bsAdmissionType === "BRIDGING_5TH" ? "Bridging (5th Sem Intake)" : "Regular (4-Year)"}
            </strong>
          </div>
        </div>

        {/* Semester-by-Semester Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {semesterCards.map((sc) => (
            <div key={sc.semester} className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="bg-slate-800 text-white px-2.5 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider print:bg-slate-800 print:text-white">
                <span>Semester {sc.semester}</span>
                <span className="text-[9px] font-semibold text-slate-300">SGPA: {sc.sgpa} &bull; {sc.semCredits} Cr</span>
              </div>
              <table className="w-full text-[9.5px] text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[8px] border-b">
                  <tr>
                    <th className="p-1 w-14">Code</th>
                    <th className="p-1">Course Title</th>
                    <th className="p-1 text-center w-8">Cr</th>
                    <th className="p-1 text-center w-10">Obt</th>
                    <th className="p-1 text-center w-10">GP</th>
                    <th className="p-1 text-center w-10">Grd</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sc.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-2.5 text-center text-slate-400 font-semibold italic text-[8.5px]">
                        No courses recorded
                      </td>
                    </tr>
                  ) : (
                    sc.items.map((item) => (
                      <tr key={item.sr} className={item.isAbsent ? "bg-rose-50/50" : ""}>
                        <td className="p-1 font-mono text-slate-600 font-bold">{item.code}</td>
                        <td className="p-1 font-semibold text-slate-900 truncate max-w-[130px]">{item.title}</td>
                        <td className="p-1 text-center text-slate-700">{item.credit}</td>
                        <td className={`p-1 text-center font-bold ${item.isAbsent ? "text-rose-700" : "text-slate-900"}`}>{item.obt}</td>
                        <td className="p-1 text-center font-bold text-slate-800">{item.gp}</td>
                        <td className={`p-1 text-center font-black ${item.grade.startsWith("F") ? "text-rose-600" : "text-emerald-700"}`}>{item.grade}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Cumulative Degree Summary */}
        <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
          <div>
            <span className="block text-[9px] font-extrabold text-purple-700 uppercase">Total Completed Credits</span>
            <span className="text-sm font-black text-purple-950">{totalCredits} Credit Hours</span>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-purple-700 uppercase">Cumulative Marks</span>
            <span className="text-sm font-black text-purple-950">{grandTotalObtained} / {grandTotalMax}</span>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-purple-700 uppercase">Overall Percentage</span>
            <span className="text-sm font-black text-purple-950">{overallPct}%</span>
          </div>
          <div>
            <span className="block text-[9px] font-extrabold text-purple-700 uppercase">Final CGPA</span>
            <span className="text-lg font-black text-purple-900">{cgpa.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Official Signatures Footer */}
      <div className="mt-6 pt-5 border-t-2 border-slate-900 grid grid-cols-4 gap-4 text-center text-[9.5px] font-black uppercase tracking-wider text-slate-800 relative z-10">
        <div>
          <div className="h-9 border-b border-dashed border-slate-400 mb-1"></div>
          <span>Tabulator / Clerk</span>
        </div>
        <div>
          <div className="h-9 border-b border-dashed border-slate-400 mb-1"></div>
          <span>Assistant Controller</span>
        </div>
        <div>
          <div className="h-9 border-b border-dashed border-slate-400 mb-1"></div>
          <span>Controller of Examinations</span>
        </div>
        <div>
          <div className="h-9 border-b border-dashed border-slate-400 mb-1 flex items-center justify-center">
            <span className="text-[7px] text-slate-300 uppercase tracking-widest">[ College Stamp ]</span>
          </div>
          <span>Principal</span>
        </div>
      </div>

      <div className="mt-2.5 flex justify-between items-center text-[7.5px] text-slate-400 font-semibold border-t border-slate-200 pt-1">
        <span>Verified from Official Results Gazette &bull; University of Balochistan Affiliated Standards</span>
        <span>Issue Date: {issueDate}</span>
      </div>
    </div>
  );
}

export default function GazetteCompilerPage() {
  const { collegeName, collegeLogo, collegeTagline, collegeAddress, settings } = useSettings();

  const [allStudents, setAllStudents] = useState<StudentData[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessionOptions, setSessionOptions] = useState<string[]>([
    "2024-2028", "2025-2029", "2026-2030", "2023-2027", "2022-2026",
    "2024-2026", "2025-2027", "2026-2028", "2023-2025", "2022-2024"
  ]);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedSession, setSelectedSession] = useState<string>("ALL");
  const [selectedProgram, setSelectedProgram] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedRemarks, setExpandedRemarks] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  // BS students pool loaded from DB for fast instant modal filtering
  const [allDbStudents, setAllDbStudents] = useState<StudentData[]>([]);

  // Certificate Modal State: Single or Bulk DMC / Transcript with Live Filtering & Interactive Checklist
  const [certModal, setCertModal] = useState<{
    isOpen: boolean;
    type: "dmc" | "transcript";
    mode: "single" | "bulk";
    session: string;
    programId: string;
    semester: number;
    rollSearch: string;
    selectedStudentId: string | null;
    bulkSelectedIds: string[];
  } | null>(null);

  const openCertModal = (
    type: "dmc" | "transcript",
    mode: "single" | "bulk" = "single",
    preselectedStudent?: StudentData
  ) => {
    const pool = allDbStudents.length > 0 ? allDbStudents : allStudents;
    const initSession = preselectedStudent?.session || selectedSession;
    const initProgId = preselectedStudent?.programId || selectedProgram;
    const initSemester = selectedSemester;

    // Filter students matching initial session & program
    const candidates = pool.filter((s) => {
      if (initSession !== "ALL") {
        if (!s.session) return false;
        const sSess = s.session.toLowerCase().trim();
        const tSess = initSession.toLowerCase().trim();
        if (sSess !== tSess && !sSess.includes(tSess) && !tSess.includes(sSess)) return false;
      }
      if (initProgId !== "ALL") {
        if (s.programId !== initProgId) return false;
      }
      return true;
    });

    // Do NOT auto-select student unless explicitly passed in preselectedStudent
    setCertModal({
      isOpen: true,
      type,
      mode,
      session: initSession,
      programId: initProgId,
      semester: initSemester,
      rollSearch: preselectedStudent ? preselectedStudent.rollNumber : "",
      selectedStudentId: preselectedStudent ? preselectedStudent.id : null,
      bulkSelectedIds: [],
    });
  };

  const openSingleDMC = (student: StudentData, programName: string, session: string) => {
    openCertModal("dmc", "single", student);
  };

  const openSingleTranscript = (student: StudentData, programName: string, session: string) => {
    openCertModal("transcript", "single", student);
  };

  const openBulkDMC = (customCandidates?: Array<{ student: StudentData; programName: string; session: string }>) => {
    const first = customCandidates?.[0]?.student;
    const initSess = first?.session || selectedSession;
    const initProg = first?.programId || selectedProgram;
    const candidateIds = customCandidates ? customCandidates.map((c) => c.student.id) : [];

    setCertModal({
      isOpen: true,
      type: "dmc",
      mode: "bulk",
      session: initSess,
      programId: initProg,
      semester: selectedSemester,
      rollSearch: "",
      selectedStudentId: first ? first.id : null,
      bulkSelectedIds: candidateIds.length > 0 ? candidateIds : allStudents.map((s) => s.id),
    });
  };

  const openBulkTranscript = (customCandidates?: Array<{ student: StudentData; programName: string; session: string }>) => {
    const first = customCandidates?.[0]?.student;
    const initSess = first?.session || selectedSession;
    const initProg = first?.programId || selectedProgram;
    const candidateIds = customCandidates ? customCandidates.map((c) => c.student.id) : [];

    setCertModal({
      isOpen: true,
      type: "transcript",
      mode: "bulk",
      session: initSess,
      programId: initProg,
      semester: selectedSemester,
      rollSearch: "",
      selectedStudentId: first ? first.id : null,
      bulkSelectedIds: candidateIds.length > 0 ? candidateIds : allStudents.map((s) => s.id),
    });
  };

  const toggleStudentExpand = (id: string) => {
    setExpandedRemarks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllRemarks = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    if (nextState) {
      const map: Record<string, boolean> = {};
      allStudents.forEach((s) => {
        map[s.id] = true;
      });
      setExpandedRemarks(map);
    } else {
      setExpandedRemarks({});
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = (ids: string[]) =>
    setSelectedIds((prev) => (prev.length === ids.length ? [] : ids));

  // Fetch BS programs and distinct sessions on load
  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data))
          setPrograms(data.filter((p: Program) => p.educationLevel === "BS"));
      });

    // Extract sessions from database students
    fetch("/api/students?educationLevel=BS")
      .then((r) => r.json())
      .then(async (data) => {
        const { filterValidSessions, DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        if (Array.isArray(data)) {
          setAllDbStudents(data);
          const dbSessions = Array.from(new Set(data.map((s: any) => s.session).filter(Boolean))) as string[];
          const settingSessions = settings.ACADEMIC_SESSIONS
            ? settings.ACADEMIC_SESSIONS.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [];
          const combined = filterValidSessions([...dbSessions, ...settingSessions, ...DEFAULT_ALL_SESSIONS]).sort().reverse();
          setSessionOptions(combined);
        }
      });
  }, [settings.ACADEMIC_SESSIONS]);

  // Fetch students whenever filters change — API handles educationLevel, session, programId
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ educationLevel: "BS" });
    if (selectedSession !== "ALL") params.set("session", selectedSession);
    if (selectedProgram !== "ALL") params.set("programId", selectedProgram);

    fetch(`/api/students?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          let list = data;
          if (selectedSession !== "ALL") {
            list = data.filter((s: StudentData) => {
              if (!s.session) return false;
              const sSess = s.session.toLowerCase().trim();
              const target = selectedSession.toLowerCase().trim();
              return sSess === target || sSess.includes(target) || target.includes(sSess);
            });
          }
          setAllStudents(list);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedSession, selectedProgram]);

  // Standard semesters 1-8
  const standardSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const detectedSemesters = Array.from(
    new Set(
      allStudents.flatMap((s) => (s.marks || []).map((m) => m.course?.semester ?? m.semester ?? 1))
    )
  ).sort((a, b) => a - b);

  const semesterOptions = Array.from(new Set([...standardSemesters, ...detectedSemesters])).sort((a, b) => a - b);

  // Group students by Program & Session so each program has its own dedicated official table
  const programSessionGroups: ProgramSessionGroup[] = [];
  const groupMap = new Map<string, ProgramSessionGroup>();

  allStudents.forEach((s) => {
    const progId = s.programId || "unknown";
    const progName = s.program?.name || (programs.find((p) => p.id === progId)?.name) || "General BS";
    const sess = s.session || "2025";
    const groupKey = `${progId}__${sess}`;

    if (!groupMap.has(groupKey)) {
      const group: ProgramSessionGroup = {
        programId: progId,
        programName: progName,
        session: sess,
        students: [],
        courses: [],
        courseMaxMarks: {},
        grandTotalMax: 0,
        theme: getProgramColor(progName),
      };
      groupMap.set(groupKey, group);
      programSessionGroups.push(group);
    }

    groupMap.get(groupKey)!.students.push(s);
  });

  // For each group, extract only its specific courses for the selected semester
  programSessionGroups.forEach((group) => {
    const seenTitles = new Set<string>();
    group.students.forEach((s) => {
      (s.marks || [])
        .filter((m) => (m.course?.semester ?? m.semester ?? 1) === selectedSemester)
        .forEach((m) => {
          const t = m.course?.title || "Subject";
          if (!seenTitles.has(t)) {
            seenTitles.add(t);
            group.courses.push({
              id: m.course?.id,
              title: t,
              code: m.course?.code,
              creditHours: m.course?.creditHours || 3,
            });
          }
          if (!group.courseMaxMarks[t] || m.totalMarks > group.courseMaxMarks[t]) {
            group.courseMaxMarks[t] = m.totalMarks;
          }
        });
    });

    group.courses.sort((a, b) => a.title.localeCompare(b.title));
    group.grandTotalMax = group.courses.reduce((sum, c) => sum + (group.courseMaxMarks[c.title] || 0), 0);
  });

  return (
    <div className="space-y-8 font-sans">
      <style>{`
        @media print {
          ${certModal && certModal.isOpen ? `
            @page { size: A4 portrait; margin: 8mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
            body * { visibility: hidden !important; }
            #printable-docs, #printable-docs * { visibility: visible !important; }
            #printable-docs {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .page-break-student {
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              min-height: 98vh !important;
            }
            .page-break-student:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
          ` : `
            @page { size: A4 landscape; margin: 8mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
            th, td { font-size: 8px !important; padding: 3px 4px !important; }
            .gazette-section { page-break-after: always; margin-bottom: 20px; }
            .gazette-section:last-child { page-break-after: avoid; }
          `}
        }
      `}</style>

      {/* Page Header (Web only) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Official Results Gazette</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Program-wise structured results gazette compiled for semesters and batches.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={toggleAllRemarks}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 shadow-xs"
            title="Expand or Collapse failed papers in all student rows"
          >
            <span>{allExpanded ? "🔼 Collapse Papers" : "🔽 Expand Papers"}</span>
          </button>
          <button
            type="button"
            onClick={() => openCertModal("dmc", "single")}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5"
            title="Open Detailed Marks Certificate (DMC) generator"
          >
            <span>📄</span>
            <span>DMC</span>
          </button>
          <button
            type="button"
            onClick={() => openCertModal("transcript", "single")}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5"
            title="Open Academic Transcript generator"
          >
            <span>📜</span>
            <span>Transcript</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCertModal(null);
              setTimeout(() => window.print(), 100);
            }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>🖨️</span>
            <span>Print Gazette</span>
          </button>
        </div>
      </div>

      {/* Filters (Web only) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <div className="flex flex-wrap gap-5 items-end">
          {/* Semester */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none bg-slate-50 min-w-[150px]"
            >
              {semesterOptions.map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {/* Session */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none bg-slate-50 min-w-[160px]"
            >
              <option value="ALL">All Sessions</option>
              {sessionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Program */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none bg-slate-50 min-w-[200px]"
            >
              <option value="ALL">All Programs (Grouped Gazette)</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {!loading && (
            <div className="ml-auto flex items-center gap-2 self-end">
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                {allStudents.length} total student(s)
              </span>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold">
                {programSessionGroups.length} program section(s)
              </span>
              {selectedIds.length > 0 && (
                <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">
                  {selectedIds.length} selected
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Compiling Program Gazettes...</p>
        </div>
      ) : programSessionGroups.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
            No students found for the selected filters
          </p>
        </div>
      ) : (
        /* Render each Program & Session as its own dedicated section */
        programSessionGroups.map((group, groupIdx) => {
          const { programName, session, students, courses, courseMaxMarks, grandTotalMax, theme } = group;

          return (
            <div key={`${group.programId}-${session}-${groupIdx}`} className="gazette-section space-y-4">
              {/* Official Print & Web Section Banner */}
              <div className={`rounded-2xl p-5 bg-gradient-to-r ${theme.bannerBg} text-white shadow-md border flex flex-wrap items-center justify-between gap-4 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-900 print:p-2 print:rounded-none print:shadow-none print:mb-3`}>
                <div className="flex items-center gap-3">
                  {collegeLogo ? (
                    <img src={collegeLogo} alt="Logo" className="w-11 h-11 object-contain print:w-10 print:h-10" />
                  ) : (
                    <div className="w-3.5 h-8 rounded-full bg-blue-500 print:hidden" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black tracking-wide uppercase print:text-sm">{programName}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${theme.badgeBg}`}>
                        Session: {session}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/10 text-white border border-white/20 print:bg-slate-100 print:text-slate-800">
                        Semester {selectedSemester}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold mt-0.5 print:text-slate-600 print:text-[9px]">
                      {collegeName} &nbsp;|&nbsp; {students.length} Student(s) &nbsp;|&nbsp; {courses.length} Exam Paper(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 print:hidden flex-wrap">
                  <button
                    type="button"
                    onClick={() => openBulkDMC(students.map((st) => ({ student: st, programName, session })))}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-black border border-white/25 transition-all flex items-center gap-1 shadow-xs"
                    title={`Print DMCs for all ${students.length} students in ${programName}`}
                  >
                    <span>📄</span>
                    <span>Section DMCs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openBulkTranscript(students.map((st) => ({ student: st, programName, session })))}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-black border border-white/25 transition-all flex items-center gap-1 shadow-xs"
                    title={`Print Transcripts for all ${students.length} students in ${programName}`}
                  >
                    <span>📜</span>
                    <span>Section Transcripts</span>
                  </button>
                  <span className="text-xs font-bold text-slate-300 ml-1">Total Marks:</span>
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-black text-white border border-white/20">
                    {grandTotalMax || 0}
                  </span>
                </div>
              </div>

              {/* Dedicated Table for this Program & Session */}
              <div className="bg-white rounded-2xl print:rounded-none shadow-sm print:shadow-none border border-slate-200 print:border-none overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white print:bg-slate-100 print:text-slate-900">
                        <th rowSpan={2} className="px-3 py-3 w-10 text-center align-middle border-r border-slate-700 print:border-slate-300 print:hidden">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                            checked={students.every((s) => selectedIds.includes(s.id)) && students.length > 0}
                            onChange={() => {
                              const groupStudentIds = students.map((s) => s.id);
                              const allSelected = groupStudentIds.every((id) => selectedIds.includes(id));
                              if (allSelected) {
                                setSelectedIds((prev) => prev.filter((id) => !groupStudentIds.includes(id)));
                              } else {
                                setSelectedIds((prev) => Array.from(new Set([...prev, ...groupStudentIds])));
                              }
                            }}
                          />
                        </th>
                        <th rowSpan={2} className="px-4 py-3 font-black uppercase text-[10px] tracking-wider text-center align-middle border-r border-slate-700 print:border-slate-300">#</th>
                        <th rowSpan={2} className="px-4 py-3 font-black uppercase text-[10px] tracking-wider align-middle border-r border-slate-700 print:border-slate-300">Roll No</th>
                        <th rowSpan={2} className="px-4 py-3 font-black uppercase text-[10px] tracking-wider align-middle border-r border-slate-700 print:border-slate-300">Name</th>

                        {/* Program-specific Papers */}
                        {courses.map((course, i) => (
                          <th
                            key={`hdr-${group.programId}-${course.title}-${i}`}
                            className={`px-3 py-2 font-black uppercase text-[9px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 transition-colors ${theme.headerBg}`}
                            title={`${course.title} ${course.code ? `(${course.code})` : ""}`}
                          >
                            <div className="font-black text-[10px]">Paper {i + 1}</div>
                            <div className="font-semibold text-slate-200 print:text-slate-700 text-[8.5px] truncate max-w-[85px] mx-auto">
                              {course.title.length > 18 ? course.title.slice(0, 16) + "…" : course.title}
                            </div>
                            <div className="text-slate-400 print:text-slate-500 text-[8px]">
                              / {courseMaxMarks[course.title] ?? "—"}
                            </div>
                          </th>
                        ))}

                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle bg-slate-800 print:bg-slate-200 whitespace-nowrap">
                          Total<br />
                          <span className="text-slate-400 text-[8px] font-semibold">
                            out of {grandTotalMax || "—"}
                          </span>
                        </th>
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle">%age</th>
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle">GPA</th>
                        {selectedSemester > 1 && (
                          <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle">CGPA</th>
                        )}
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle">Grade</th>
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle bg-slate-800 print:bg-slate-200 whitespace-nowrap">
                          Overall Total &amp; Cr. Hrs<br />
                          <span className="text-slate-400 text-[8px] font-semibold">
                            (Sem 1 to {selectedSemester})
                          </span>
                        </th>
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle">Status</th>
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle">Remarks</th>
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:hidden align-middle bg-slate-800">Print Cards</th>
                      </tr>
                      {/* Empty second row for rowspan alignment */}
                      <tr className="bg-slate-800 print:bg-slate-50 h-0">
                        {courses.map((c, i) => <th key={`sp-${group.programId}-${c.title}-${i}`} className="p-0 border-none"></th>)}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {students.map((s, idx) => {
                        const {
                          gpa,
                          cgpa,
                          status,
                          grade,
                          pct,
                          totalObtained,
                          totalMax,
                          totalAbsentCount,
                          semPaperCount,
                          courseMarksById,
                          courseMarksByTitle,
                          failedCourses,
                          remarks,
                          cumObtained,
                          cumMax,
                        } = buildStudentResults(s, selectedSemester);
                        const isAllPass = failedCourses.length === 0;

                        return (
                          <tr
                            key={s.id}
                            className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"} ${
                              selectedIds.includes(s.id) ? "!bg-blue-50" : ""
                            } hover:bg-blue-50/30 transition-colors`}
                          >
                            <td className="px-3 py-2.5 text-center border-r border-slate-100 print:border-slate-300 print:hidden">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                checked={selectedIds.includes(s.id)}
                                onChange={() => toggleSelect(s.id)}
                              />
                            </td>
                            <td className="px-4 py-2.5 text-xs font-bold text-slate-400 text-center border-r border-slate-100 print:border-slate-300">{idx + 1}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-700 border-r border-slate-100 print:border-slate-300 whitespace-nowrap text-xs">{s.rollNumber}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-900 border-r border-slate-100 print:border-slate-300 whitespace-nowrap text-xs">{s.user?.name}</td>

                            {courses.map((course) => {
                              const obtained = (course.id && courseMarksById[course.id] !== undefined)
                                ? courseMarksById[course.id]
                                : courseMarksByTitle[course.title.trim().toLowerCase()];
                              const isAbsentPaper = obtained === "A";
                              const maxMark = courseMaxMarks[course.title] || 0;
                              const paperPct = !isAbsentPaper && maxMark > 0 && typeof obtained === "number" ? (obtained / maxMark) * 100 : -1;
                              const isFail = isAbsentPaper || (paperPct >= 0 && paperPct < 50);
                              return (
                                <td
                                  key={`${s.id}-${course.title}`}
                                  className={`px-3 py-2.5 text-center font-bold text-xs border-l border-slate-100 print:border-slate-300 ${
                                    isAbsentPaper
                                      ? "text-rose-700 bg-rose-50/70 font-black print:text-rose-900"
                                      : isFail
                                      ? "text-rose-600 bg-rose-50/40 print:bg-transparent"
                                      : obtained !== undefined
                                      ? "text-slate-800"
                                      : "text-slate-300"
                                  }`}
                                >
                                  {isAbsentPaper ? (
                                    <span className="px-1.5 py-0.5 bg-rose-100 border border-rose-300 text-rose-700 rounded font-black text-[11px]">
                                      A
                                    </span>
                                  ) : obtained !== undefined ? (
                                    obtained
                                  ) : (
                                    "—"
                                  )}
                                </td>
                              );
                            })}

                            <td className="px-3 py-2.5 text-center font-bold text-slate-800 border-l border-slate-100 print:border-slate-300 text-xs whitespace-nowrap">
                              {totalMax === 0 ? "—" : totalAbsentCount > 0 && totalAbsentCount === semPaperCount ? (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-300 rounded font-black text-xs">
                                  A
                                </span>
                              ) : (
                                totalObtained
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-700 border-l border-slate-100 print:border-slate-300 text-xs">
                              {totalMax > 0 ? pct.toFixed(1) : "—"}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-700 border-l border-slate-100 print:border-slate-300 text-xs">
                              {gpa.toFixed(2)}
                            </td>
                            {selectedSemester > 1 && (
                              <td className="px-3 py-2.5 text-center font-black text-blue-700 border-l border-slate-100 print:border-slate-300 bg-blue-50/20 print:bg-transparent text-xs">
                                {cgpa.toFixed(2)}
                              </td>
                            )}
                            <td className="px-3 py-2.5 text-center font-black text-slate-800 border-l border-slate-100 print:border-slate-300 text-xs">
                              {grade}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-800 border-l border-slate-100 print:border-slate-300 text-xs whitespace-nowrap">
                              {cumMax > 0 ? (
                                <span>
                                  {cumObtained}{" "}
                                  <span className="text-slate-400 text-[10px] font-normal">/ {cumMax}</span>
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center border-l border-slate-100 print:border-slate-300">
                              <span className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                                status === "PROMOTED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 print:border-none print:p-0"
                                  : status === "PROBATION"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 print:border-none print:p-0"
                                  : status === "DROPOUT"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 print:border-none print:p-0"
                                  : "bg-slate-100 text-slate-600 border-slate-200 print:border-none print:p-0"
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs font-semibold border-l border-slate-100 print:border-slate-300 align-middle">
                              {isAllPass ? (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-xs">
                                  <span className="text-emerald-500 font-bold">✓</span> Passed
                                </span>
                              ) : (
                                (() => {
                                  const isDropout = status === "DROPOUT";
                                  const isAbsent = status === "ABSENT";
                                  const isRed = isDropout || isAbsent;

                                  // Promoted / Probation with failed papers in Orange (amber), Dropout / Absent in Red (rose)
                                  const colorScheme = isRed
                                    ? {
                                        btnBg: "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300",
                                        headerText: "text-rose-700",
                                        numColor: "text-rose-800",
                                        linkColor: "text-rose-700 hover:text-rose-900",
                                        borderColor: "border-rose-200",
                                        dotColor: "bg-rose-500",
                                      }
                                    : {
                                        btnBg: "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300",
                                        headerText: "text-amber-800",
                                        numColor: "text-amber-900",
                                        linkColor: "text-amber-700 hover:text-amber-950",
                                        borderColor: "border-amber-200",
                                        dotColor: "bg-amber-500",
                                      };

                                  const isExpanded = Boolean(expandedRemarks[s.id]);

                                  return (
                                    <div className="min-w-[155px]">
                                      {/* Uniform height collapse/expand button to keep all rows same height */}
                                      <button
                                        type="button"
                                        onClick={() => toggleStudentExpand(s.id)}
                                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition-all flex items-center justify-between w-full shadow-xs ${colorScheme.btnBg} print:hidden`}
                                        title="Click to Expand / Collapse Failed Papers"
                                      >
                                        <span className="flex items-center gap-1.5 truncate">
                                          <span className={`w-1.5 h-1.5 rounded-full ${colorScheme.dotColor}`}></span>
                                          <span>Failed in {failedCourses.length} Paper{failedCourses.length > 1 ? "s" : ""}</span>
                                        </span>
                                        <span className="text-[9px] font-mono ml-1 shrink-0 opacity-80">
                                          {isExpanded ? "▲" : "▼"}
                                        </span>
                                      </button>

                                      {/* Expanded paper details (or print view) */}
                                      <div className={`${isExpanded ? "block mt-1.5 pt-1.5 border-t " + colorScheme.borderColor : "hidden"} print:block print:border-none print:p-0`}>
                                        <div className={`font-bold text-[9px] mb-1 ${colorScheme.headerText} hidden print:block`}>
                                          Failed in {failedCourses.length} Paper(s):
                                        </div>
                                        <div className="space-y-1 text-[10px]">
                                          {failedCourses.map((c, i) => {
                                            const targetUrl = c.id
                                              ? `/bs/marks?courseId=${c.id}&programId=${c.programId || s.programId || ""}&semester=${selectedSemester}&session=${s.session || ""}`
                                              : `/bs/marks?courseTitle=${encodeURIComponent(c.title)}&programId=${s.programId || ""}&semester=${selectedSemester}&session=${s.session || ""}`;

                                            return (
                                              <div key={i} className="flex items-center gap-1">
                                                <span className={`font-black ${colorScheme.numColor}`}>{i + 1}.</span>
                                                <a
                                                  href={targetUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  title={`Click to enter/edit marks for ${c.title}`}
                                                  className={`${colorScheme.linkColor} hover:underline font-semibold transition-colors inline-flex items-center gap-0.5 group print:no-underline print:text-slate-800`}
                                                >
                                                  <span>{c.title}</span>
                                                  <span className="text-[9px] opacity-60 group-hover:opacity-100 font-mono print:hidden">↗</span>
                                                </a>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()
                              )}
                            </td>

                            {/* Actions Column: Single DMC & Transcript buttons */}
                            <td className="px-2 py-2 text-center border-l border-slate-100 print:hidden whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openSingleDMC(s, group.programName, group.session)}
                                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-lg text-[10px] font-black transition-all shadow-xs flex items-center gap-1"
                                  title={`Print Detailed Marks Certificate (DMC) for ${s.user?.name}`}
                                >
                                  <span>📄</span>
                                  <span>DMC</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openSingleTranscript(s, group.programName, group.session)}
                                  className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 border border-purple-200 rounded-lg text-[10px] font-black transition-all shadow-xs flex items-center gap-1"
                                  title={`Print Official Academic Transcript for ${s.user?.name}`}
                                >
                                  <span>📜</span>
                                  <span>Transcript</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Print Footer per Program */}
                <div className="hidden print:flex mt-8 p-4 justify-between items-end text-[9px] font-bold text-slate-800 uppercase tracking-widest border-t border-slate-300">
                  <div className="text-center">
                    <div className="w-40 border-b border-slate-800 mb-1"></div>
                    Prepared By (Clerk)
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b border-slate-800 mb-1"></div>
                    Controller of Examinations
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b border-slate-800 mb-1"></div>
                    Principal Signature
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Certificate Generator Modal (DMC & Transcript with Single / Bulk Modes, Filters & Interactive Checklist) */}
      {certModal && certModal.isOpen && (() => {
        const pool = allDbStudents.length > 0 ? allDbStudents : allStudents;

        // Filter all candidates matching modal session & program filters
        const modalCandidates = pool.filter((s) => {
          if (certModal.session !== "ALL") {
            if (!s.session) return false;
            const sSess = s.session.toLowerCase().trim();
            const tSess = certModal.session.toLowerCase().trim();
            if (sSess !== tSess && !sSess.includes(tSess) && !tSess.includes(sSess)) return false;
          }
          if (certModal.programId !== "ALL") {
            if (s.programId !== certModal.programId) return false;
          }
          return true;
        });

        // Search within candidates (for Single roll search)
        const rollSearchTrim = (certModal.rollSearch || "").trim().toLowerCase();
        const searchCandidates = rollSearchTrim
          ? modalCandidates.filter(
              (s) =>
                s.rollNumber.toLowerCase().includes(rollSearchTrim) ||
                s.user?.name.toLowerCase().includes(rollSearchTrim)
            )
          : modalCandidates;

        // Only resolve a student if user explicitly selected them
        const currentSingleStudent = certModal.selectedStudentId
          ? modalCandidates.find((s) => s.id === certModal.selectedStudentId) || null
          : null;

        // Current students in Bulk Mode
        const bulkSelectedStudents = modalCandidates.filter((s) => certModal.bulkSelectedIds.includes(s.id));

        const handleModalSessionChange = (newSession: string) => {
          setCertModal({
            ...certModal,
            session: newSession,
            selectedStudentId: null, // Clear selection so nothing shows until user chooses
            bulkSelectedIds: [],    // Clear bulk selection
            rollSearch: "",
          });
        };

        const handleModalProgramChange = (newProgramId: string) => {
          setCertModal({
            ...certModal,
            programId: newProgramId,
            selectedStudentId: null, // Clear selection so nothing shows until user chooses
            bulkSelectedIds: [],    // Clear bulk selection
            rollSearch: "",
          });
        };

        const toggleBulkStudent = (id: string) => {
          setCertModal((prev) => {
            if (!prev) return null;
            const exists = prev.bulkSelectedIds.includes(id);
            return {
              ...prev,
              bulkSelectedIds: exists
                ? prev.bulkSelectedIds.filter((x) => x !== id)
                : [...prev.bulkSelectedIds, id],
            };
          });
        };

        const selectAllBulk = () => {
          setCertModal((prev) =>
            prev ? { ...prev, bulkSelectedIds: modalCandidates.map((s) => s.id) } : null
          );
        };

        const clearAllBulk = () => {
          setCertModal((prev) => (prev ? { ...prev, bulkSelectedIds: [] } : null));
        };

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex flex-col items-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setCertModal(null);
            }}
          >
            {/* Control Panel (Hidden on Print) */}
            <div className="w-full max-w-5xl shrink-0 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 print:hidden mb-6 z-20">
              {/* Header Action Bar */}
              <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-slate-800 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-3xl shrink-0">{certModal.type === "dmc" ? "📄" : "📜"}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black tracking-wide text-white">
                        {certModal.type === "dmc"
                          ? "Detailed Marks Certificate (DMC) Generator"
                          : "Official Academic Degree Transcript Generator"}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white border border-blue-400">
                        {certModal.mode === "single" ? "👤 Single Student Mode" : `👥 Bulk Mode (${bulkSelectedStudents.length} Selected)`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {certModal.mode === "single"
                        ? "Select session, program, semester, and choose a student or enter roll number to generate certificate."
                        : "Filter by session, program, semester and select students from the checklist below to print in bulk."}
                    </p>
                  </div>
                </div>

                {/* Mode Switcher, Document Switcher & Print / Close */}
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  {/* Mode Tabs */}
                  <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setCertModal((prev) => (prev ? { ...prev, mode: "single" } : null))}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                        certModal.mode === "single"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      👤 Single
                    </button>
                    <button
                      type="button"
                      onClick={() => setCertModal((prev) => (prev ? { ...prev, mode: "bulk" } : null))}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                        certModal.mode === "bulk"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      👥 Bulk
                    </button>
                  </div>

                  {/* Document Switcher */}
                  <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setCertModal((prev) => (prev ? { ...prev, type: "dmc" } : null))}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                        certModal.type === "dmc"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      📄 DMC
                    </button>
                    <button
                      type="button"
                      onClick={() => setCertModal((prev) => (prev ? { ...prev, type: "transcript" } : null))}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                        certModal.type === "transcript"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      📜 Transcript
                    </button>
                  </div>

                  {/* Print Button */}
                  <button
                    type="button"
                    disabled={certModal.mode === "single" ? !currentSingleStudent : bulkSelectedStudents.length === 0}
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2"
                  >
                    <span>🖨️</span>
                    <span>
                      {certModal.mode === "single"
                        ? `Print Single ${certModal.type.toUpperCase()}`
                        : `Print Selected (${bulkSelectedStudents.length})`}
                    </span>
                  </button>

                  {/* Close Window Button */}
                  <button
                    type="button"
                    onClick={() => setCertModal(null)}
                    className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-black transition-all border border-rose-500/40 flex items-center gap-1.5"
                    title="Close generator window"
                  >
                    <span>✕</span>
                    <span>Close</span>
                  </button>
                </div>
              </div>

              {/* Shared Dedicated Filter Bar (Session, Program, Semester) */}
              <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center gap-4 text-xs">
                {/* Session Filter */}
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Academic Session
                  </label>
                  <select
                    value={certModal.session}
                    onChange={(e) => handleModalSessionChange(e.target.value)}
                    className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ALL">All Sessions</option>
                    {sessionOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Program Filter */}
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Degree Program
                  </label>
                  <select
                    value={certModal.programId}
                    onChange={(e) => handleModalProgramChange(e.target.value)}
                    className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ALL">All Programs</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester Filter */}
                <div className="flex flex-col gap-1 min-w-[130px]">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Semester
                  </label>
                  <select
                    value={certModal.semester}
                    onChange={(e) =>
                      setCertModal((prev) => (prev ? { ...prev, semester: parseInt(e.target.value) } : null))
                    }
                    className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {semesterOptions.map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Single Mode: Roll Number Search & Dropdown Picker */}
                {certModal.mode === "single" && (
                  <>
                    <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Roll Number / Search
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={certModal.rollSearch}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCertModal((prev) => {
                              if (!prev) return null;
                              if (!val.trim()) {
                                return {
                                  ...prev,
                                  rollSearch: "",
                                  selectedStudentId: null,
                                };
                              }
                              const matching = modalCandidates.find(
                                (s) =>
                                  s.rollNumber.toLowerCase() === val.toLowerCase().trim() ||
                                  s.rollNumber.toLowerCase().includes(val.toLowerCase().trim())
                              );
                              return {
                                ...prev,
                                rollSearch: val,
                                selectedStudentId: matching ? matching.id : null,
                              };
                            });
                          }}
                          placeholder="Search / Type Roll Number..."
                          className="w-full bg-slate-800 text-white placeholder-slate-500 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {certModal.rollSearch && (
                          <button
                            type="button"
                            onClick={() =>
                              setCertModal((prev) =>
                                prev ? { ...prev, rollSearch: "", selectedStudentId: null } : null
                              )
                            }
                            className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-white"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 min-w-[220px]">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Select Student ({searchCandidates.length})
                      </label>
                      <select
                        value={certModal.selectedStudentId || ""}
                        onChange={(e) => {
                          const sId = e.target.value;
                          setCertModal((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedStudentId: sId ? sId : null,
                                  rollSearch: sId
                                    ? modalCandidates.find((s) => s.id === sId)?.rollNumber || ""
                                    : "",
                                }
                              : null
                          );
                        }}
                        className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">
                          -- Choose Student to View {certModal.type.toUpperCase()} ({searchCandidates.length} Available) --
                        </option>
                        {searchCandidates.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.rollNumber} — {s.user?.name} ({s.program?.name || "BS"})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Single Mode Student Status Ribbon */}
              {certModal.mode === "single" && currentSingleStudent && (
                <div className="px-5 py-2.5 bg-blue-950/40 border-b border-blue-900/50 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-emerald-400 font-black">● ACTIVE STUDENT:</span>
                    <strong className="text-white font-bold">{currentSingleStudent.user?.name}</strong>
                    <span className="font-mono text-blue-300 font-bold">({currentSingleStudent.rollNumber})</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-300">
                      {currentSingleStudent.program?.name ||
                        programs.find((p) => p.id === currentSingleStudent.programId)?.name ||
                        "General BS"}
                    </span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-300">Session: {currentSingleStudent.session || certModal.session}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-amber-300 font-bold">Exam Semester: {certModal.semester}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow transition-all flex items-center gap-1.5"
                  >
                    <span>🖨️</span>
                    <span>Print This {certModal.type.toUpperCase()}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Printable Documents & Main Content Container */}
            <div id="printable-docs" className="w-full max-w-5xl space-y-8 print:space-y-0 print:max-w-none print:w-full">
              {/* Single Mode View */}
              {certModal.mode === "single" && (
                <>
                  {!currentSingleStudent ? (
                    <div className="bg-slate-900 border border-slate-800 text-white p-12 rounded-3xl text-center space-y-4 print:hidden max-w-2xl mx-auto shadow-2xl">
                      <div className="w-16 h-16 rounded-2xl bg-blue-900/40 border border-blue-500/30 text-blue-400 flex items-center justify-center text-3xl mx-auto">
                        {certModal.type === "dmc" ? "📄" : "📜"}
                      </div>
                      <div>
                        <h4 className="font-black text-lg text-white">
                          Select Student to Generate {certModal.type === "dmc" ? "DMC" : "Transcript"}
                        </h4>
                        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                          Upar diye gaye dropdown se student choose karein ya unka Roll Number enter karein.
                          <br />
                          Jab tak aap student khud select nahi karein ge, koi certificate preview ya print nahi hoga.
                        </p>
                      </div>
                      <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 border-t border-slate-800 flex-wrap">
                        <span>Session: {certModal.session}</span>
                        <span>&bull;</span>
                        <span>Semester: {certModal.semester}</span>
                        <span>&bull;</span>
                        <span>Available Candidates: {modalCandidates.length}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-4 py-1.5 rounded-xl print:hidden">
                        <span className="font-bold text-slate-300">
                          {certModal.type === "dmc" ? "📄 DMC Preview" : "📜 Academic Transcript Preview"} &bull;{" "}
                          {currentSingleStudent.user?.name}{" "}
                          <span className="font-mono text-slate-500">({currentSingleStudent.rollNumber})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline"
                        >
                          🖨️ Print This Certificate
                        </button>
                      </div>

                      {certModal.type === "dmc" ? (
                        <DMCPrintCard
                          student={currentSingleStudent}
                          semester={certModal.semester}
                          collegeName={collegeName}
                          collegeLogo={collegeLogo}
                          collegeTagline={collegeTagline}
                          collegeAddress={collegeAddress}
                          programName={
                            currentSingleStudent.program?.name ||
                            programs.find((p) => p.id === currentSingleStudent.programId)?.name ||
                            "General BS"
                          }
                          session={currentSingleStudent.session || certModal.session}
                        />
                      ) : (
                        <TranscriptPrintCard
                          student={currentSingleStudent}
                          maxSemester={certModal.semester}
                          collegeName={collegeName}
                          collegeLogo={collegeLogo}
                          collegeTagline={collegeTagline}
                          collegeAddress={collegeAddress}
                          programName={
                            currentSingleStudent.program?.name ||
                            programs.find((p) => p.id === currentSingleStudent.programId)?.name ||
                            "General BS"
                          }
                          session={currentSingleStudent.session || certModal.session}
                        />
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Bulk Mode View: Prominent Checklist Card + Preview Cards */}
              {certModal.mode === "bulk" && (
                <div className="space-y-6">
                  {/* Interactive Student Checklist Card */}
                  <div className="bg-slate-900 border border-slate-700 text-white p-6 rounded-2xl shadow-2xl print:hidden">
                    <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-black text-white flex items-center gap-2">
                            <span>📋</span>
                            <span>Student Checklist for Bulk {certModal.type.toUpperCase()}</span>
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white border border-blue-400">
                            {bulkSelectedStudents.length} of {modalCandidates.length} Selected
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Neeche diye gaye students ko check karein ya <strong>"Select All"</strong> par click karein.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={selectAllBulk}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow transition-all"
                        >
                          ☑ Select All ({modalCandidates.length})
                        </button>
                        <button
                          type="button"
                          onClick={clearAllBulk}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-all"
                        >
                          ☐ Clear All
                        </button>
                      </div>
                    </div>

                    {/* Student Checklist Grid */}
                    {modalCandidates.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 font-bold text-xs">
                        No students found matching Session: {certModal.session} and Program:{" "}
                        {programs.find((p) => p.id === certModal.programId)?.name || certModal.programId}.
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
                        {modalCandidates.map((s) => {
                          const isChecked = certModal.bulkSelectedIds.includes(s.id);
                          const prog =
                            s.program?.name ||
                            programs.find((p) => p.id === s.programId)?.name ||
                            "General BS";
                          return (
                            <button
                              key={`chk-${s.id}`}
                              type="button"
                              onClick={() => toggleBulkStudent(s.id)}
                              className={`p-3 rounded-xl text-left border text-xs font-bold transition-all flex items-center gap-3 shadow-xs ${
                                isChecked
                                  ? "bg-blue-600 text-white border-blue-400 shadow-md ring-1 ring-blue-400"
                                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              <span className="text-lg shrink-0">{isChecked ? "☑" : "☐"}</span>
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-black text-sm">{s.user?.name}</div>
                                <div className="font-mono text-[10.5px] opacity-80">{s.rollNumber}</div>
                                <div className="text-[10px] opacity-70 truncate">{prog}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Render Selected Student Cards Below */}
                  {bulkSelectedStudents.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 text-white p-8 rounded-2xl text-center space-y-2 print:hidden max-w-xl mx-auto">
                      <p className="text-xs text-slate-400 font-medium">
                        Upar checklist se jin students ko aap print karna chahte hain unhein check karein, ya <strong>"Select All"</strong> dabayein.
                      </p>
                    </div>
                  ) : (
                    bulkSelectedStudents.map((student) => {
                      const progName =
                        student.program?.name ||
                        programs.find((p) => p.id === student.programId)?.name ||
                        "General BS";
                      const sess = student.session || certModal.session;

                      return (
                        <div key={`${certModal.type}-${student.id}`} className="space-y-2 mb-8 print:mb-0">
                          {/* On-Screen Action Strip */}
                          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-4 py-1.5 rounded-xl print:hidden">
                            <span className="font-bold text-slate-300">
                              📄 {student.user?.name} <span className="font-mono text-slate-500">({student.rollNumber})</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setCertModal((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          mode: "single",
                                          selectedStudentId: student.id,
                                          rollSearch: student.rollNumber,
                                        }
                                      : null
                                  )
                                }
                                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline"
                                title="Switch to Single mode for this student"
                              >
                                View Single
                              </button>
                              <span className="text-slate-600">&bull;</span>
                              <button
                                type="button"
                                onClick={() => toggleBulkStudent(student.id)}
                                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 underline"
                                title="Remove from print list"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          </div>

                          {certModal.type === "dmc" ? (
                            <DMCPrintCard
                              student={student}
                              semester={certModal.semester}
                              collegeName={collegeName}
                              collegeLogo={collegeLogo}
                              collegeTagline={collegeTagline}
                              collegeAddress={collegeAddress}
                              programName={progName}
                              session={sess}
                            />
                          ) : (
                            <TranscriptPrintCard
                              student={student}
                              maxSemester={certModal.semester}
                              collegeName={collegeName}
                              collegeLogo={collegeLogo}
                              collegeTagline={collegeTagline}
                              collegeAddress={collegeAddress}
                              programName={progName}
                              session={sess}
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
