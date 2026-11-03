"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleStudentStatus(id: string, isActive: boolean) {
  await prisma.student.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/students");
}

export async function toggleFacultyStatus(id: string, isActive: boolean) {
  await prisma.faculty.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/faculty");
}

export async function toggleCourseStatus(id: string, isActive: boolean) {
  await prisma.course.update({ where: { id }, data: { isActive } });
  revalidatePath("/bs/courses");
}

export async function getDashboardStats(collegeId?: string | null) {
  const collegeFilter = collegeId ? { collegeId } : {};
  const syllabusCourses = await prisma.course.count({
    where: collegeId ? { program: { collegeId } } : {}
  });
  const autoTimetables = await prisma.timetable.count({ where: { generationMode: "AUTO", ...collegeFilter } });
  const manualTimetables = await prisma.timetable.count({ where: { generationMode: "MANUAL", ...collegeFilter } });
  const totalTimetables = autoTimetables + manualTimetables;
  
  const autoDatesheets = await prisma.datesheet.count({ where: { generationMode: "AUTO", ...collegeFilter } });
  const manualDatesheets = await prisma.datesheet.count({ where: { generationMode: "MANUAL", ...collegeFilter } });
  const publishedDatesheets = await prisma.datesheet.count({ where: { status: "PUBLISHED", ...collegeFilter } });
  const totalDatesheets = autoDatesheets + manualDatesheets;

  return {
    syllabusCourses,
    totalTimetables,
    autoTimetables,
    manualTimetables,
    totalDatesheets,
    autoDatesheets,
    manualDatesheets,
    publishedDatesheets
  };
}

export async function getCompleteDashboardData(
  educationLevel: string = "ALL",
  sessionFilter: string = "ALL",
  collegeId?: string | null
) {
  // Education Level filter condition
  const levelFilter: Record<string, any> = {};
  if (educationLevel !== "ALL") {
    levelFilter.educationLevel = educationLevel;
  }
  if (sessionFilter !== "ALL") {
    levelFilter.session = sessionFilter;
  }

  const collegeFilter = collegeId ? { collegeId } : {};

  // 1. Top Bar Metrics
  const totalStudents = await prisma.student.count({
    where: { ...levelFilter, ...collegeFilter }
  });
  const activePrograms = await prisma.program.count({
    where: {
      isActive: true,
      ...collegeFilter,
      ...(educationLevel !== "ALL" ? { educationLevel } : {})
    }
  });
  const totalFaculty = await prisma.faculty.count({
    where: { isActive: true, ...collegeFilter }
  });
  const totalCourses = await prisma.course.count({
    where: {
      isActive: true,
      ...(collegeId ? { program: { collegeId } } : {})
    }
  });
  
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDayName = daysOfWeek[new Date().getDay()];
  const todaysClasses = await prisma.timetable.count({
    where: {
      dayOfWeek: todayDayName,
      ...collegeFilter,
      ...(educationLevel !== "ALL" ? { educationLevel } : {})
    }
  });

  // 2. Student Status Distribution
  const activeStudentsCount = await prisma.student.count({
    where: { ...levelFilter, ...collegeFilter, isActive: true }
  });
  const graduatedCount = await prisma.studentStatus.count({
    where: {
      statusType: "GRADUATION",
      ...(collegeId ? { student: { collegeId } } : {})
    }
  });
  const dropoutCount = await prisma.studentStatus.count({
    where: {
      statusType: "QUIT",
      ...(collegeId ? { student: { collegeId } } : {})
    }
  });
  const migrationCount = await prisma.studentStatus.count({
    where: {
      statusType: "MIGRATION",
      ...(collegeId ? { student: { collegeId } } : {})
    }
  });
  const freezeCount = await prisma.studentStatus.count({
    where: {
      statusType: "FREEZE",
      ...(collegeId ? { student: { collegeId } } : {})
    }
  });
  
  const totalStatusRecorded = activeStudentsCount + graduatedCount + dropoutCount + migrationCount + freezeCount;

  // 3. Fee Collection Summary
  const feeSum = await prisma.fee.aggregate({
    _sum: { amount: true },
    where: collegeFilter
  });
  const challanSum = await prisma.challan.aggregate({
    _sum: { amount: true },
    where: collegeFilter
  });
  
  const paidFeeSum = await prisma.fee.aggregate({
    _sum: { amount: true },
    where: { ...collegeFilter, status: "PAID" }
  });
  const paidChallanSum = await prisma.challan.aggregate({
    _sum: { amount: true },
    where: { ...collegeFilter, status: "PAID" }
  });

  const totalExpected = (feeSum._sum.amount || 0) + (challanSum._sum.amount || 0);
  const totalCollected = (paidFeeSum._sum.amount || 0) + (paidChallanSum._sum.amount || 0);
  const pendingAmount = Math.max(0, totalExpected - totalCollected);
  const collectionRate = totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : "0.0";

  // 4. Program-Wise Enrollment
  const programsWithCount = await prisma.program.findMany({
    where: {
      isActive: true,
      ...collegeFilter,
      ...(educationLevel !== "ALL" ? { educationLevel } : {})
    },
    include: {
      _count: { select: { students: true } }
    },
    take: 5,
    orderBy: { students: { _count: "desc" } }
  });

  const programWiseEnrollment = programsWithCount.map((p) => ({
    name: p.name,
    count: p._count.students
  }));

  // 5. Recent Notices (Datesheets / Announcements)
  const recentDatesheets = await prisma.datesheet.findMany({
    where: collegeFilter,
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { course: true, program: true }
  });

  const recentNotices = recentDatesheets.map((ds) => ({
    id: ds.id,
    title: `${ds.examType.replace("_", " ")} - ${ds.course?.title || ds.program?.name || "Official Duty"}`,
    target: ds.program?.name || "All Faculty & Students",
    date: new Date(ds.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    type: ds.examType.includes("FINAL") ? "rose" : ds.examType.includes("MID") ? "indigo" : "amber"
  }));

  // 6. Academic Activity Logs
  const recentAuditLogs = await prisma.auditLog.findMany({
    where: collegeFilter,
    take: 5,
    orderBy: { createdAt: "desc" }
  });

  const academicActivities = recentAuditLogs.map((log) => ({
    id: log.id,
    activity: log.action,
    program: log.entity,
    details: log.description,
    time: new Date(log.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }));

  // 7. Upcoming Schedule
  const upcomingDatesheets = await prisma.datesheet.findMany({
    where: {
      ...collegeFilter,
      date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    },
    take: 5,
    orderBy: { date: "asc" },
    include: { course: true, program: true }
  });

  const upcomingSchedule = upcomingDatesheets.map((ds) => {
    const d = new Date(ds.date);
    return {
      id: ds.id,
      month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: d.getDate(),
      title: `${ds.course?.title || ds.examType.replace("_", " ")}`,
      sub: `${ds.program?.name || "All Departments"}`,
      time: `${ds.startTime} - ${ds.endTime}`
    };
  });

  // 8. Monthly Enrollment Trend
  const monthlyEnrollment = [
    { month: "Jul", current: Math.round(totalStudents * 0.2), previous: Math.round(totalStudents * 0.15) },
    { month: "Aug", current: Math.round(totalStudents * 0.35), previous: Math.round(totalStudents * 0.28) },
    { month: "Sep", current: Math.round(totalStudents * 0.55), previous: Math.round(totalStudents * 0.45) },
    { month: "Oct", current: Math.round(totalStudents * 0.68), previous: Math.round(totalStudents * 0.58) },
    { month: "Nov", current: Math.round(totalStudents * 0.72), previous: Math.round(totalStudents * 0.65) },
    { month: "Dec", current: Math.round(totalStudents * 0.78), previous: Math.round(totalStudents * 0.70) },
    { month: "Jan", current: Math.round(totalStudents * 0.82), previous: Math.round(totalStudents * 0.76) },
    { month: "Feb", current: Math.round(totalStudents * 0.86), previous: Math.round(totalStudents * 0.80) },
    { month: "Mar", current: Math.round(totalStudents * 0.90), previous: Math.round(totalStudents * 0.84) },
    { month: "Apr", current: Math.round(totalStudents * 0.94), previous: Math.round(totalStudents * 0.88) },
    { month: "May", current: Math.round(totalStudents * 0.98), previous: Math.round(totalStudents * 0.92) },
    { month: "Jun", current: totalStudents, previous: Math.round(totalStudents * 0.94) },
  ];

  return {
    topMetrics: {
      totalStudents,
      activePrograms,
      totalFaculty,
      totalCourses,
      todaysClasses,
      studentGrowth: totalStudents > 0 ? "+8.4%" : "0%"
    },
    statusOverview: {
      active: activeStudentsCount,
      graduated: graduatedCount,
      dropout: dropoutCount,
      migration: migrationCount,
      other: freezeCount,
      total: totalStatusRecorded || totalStudents
    },
    feeSummary: {
      totalExpected,
      totalCollected,
      pendingAmount,
      collectionRate
    },
    programWiseEnrollment,
    recentNotices,
    academicActivities,
    upcomingSchedule,
    monthlyEnrollment
  };
}

export async function generateRollNumber(tx: any, admission: {
  educationLevel: string;
  bsAdmissionType?: string | null;
  session?: string | null;
  programId?: string | null;
  program?: { code: string | null } | null;
}) {
  const isBridging = admission.educationLevel === "BS" && admission.bsAdmissionType === "BRIDGING_5TH";
  const isMigration = admission.educationLevel === "BS" && admission.bsAdmissionType === "MIGRATION";
  
  // 1. Fetch all students in the same session and program to extract used sequence IDs
  const sameCohortStudents = await tx.student.findMany({
    where: {
      programId: admission.programId,
      session: admission.session,
    },
    select: { rollNumber: true, bsAdmissionType: true }
  });

  // 2. Filter students and extract their sequence numbers based on isolation rules
  const usedIds = new Set<number>();
  for (const s of sameCohortStudents) {
    if (!s.rollNumber) continue;
    
    const isStudentBridging = s.bsAdmissionType === "BRIDGING_5TH" || s.rollNumber.includes("/Bridge/");
    
    if (isBridging) {
      // For Bridging target: only collect from Bridging students
      if (isStudentBridging) {
        const match = s.rollNumber.match(/:(\d+)$/);
        if (match) usedIds.add(parseInt(match[1], 10));
      }
    } else {
      // For Regular/Migration target: only collect from Regular/Migration students
      if (!isStudentBridging) {
        const match = s.rollNumber.match(/:(\d+)$/);
        if (match) usedIds.add(parseInt(match[1], 10));
      }
    }
  }

  // 3. Find the lowest unused integer starting from 1
  let currentRollSeq = 1;
  while (usedIds.has(currentRollSeq)) {
    currentRollSeq++;
  }

  // 4. Format roll number
  let yearPart = "";
  if (admission.session) {
    const parts = admission.session.split("-");
    const startYear = parts[0].trim();
    yearPart = startYear.slice(-2);
  } else {
    yearPart = new Date().getFullYear().toString().slice(-2);
  }

  const codePart = admission.program?.code ? admission.program.code.toUpperCase() : admission.educationLevel;
  const sequencePart = String(currentRollSeq).padStart(2, "0");
  
  let rollNumber = "";
  if (admission.educationLevel === "BS") {
    if (isBridging) {
      rollNumber = `S-${yearPart}/Bridge/${codePart}:${sequencePart}`;
    } else if (isMigration) {
      rollNumber = `S-${yearPart}/Migration/${codePart}:${sequencePart}`;
    } else {
      rollNumber = `S-${yearPart}/${codePart}:${sequencePart}`;
    }
  } else {
    // Intermediate
    rollNumber = `S-${yearPart}/${codePart}:${sequencePart}`;
  }

  return rollNumber;
}
