import { prisma } from "@/lib/prisma";

export function isStudentPromotedFromSem(s: any, fromSem: number): boolean {
  const semMarks = (s.marks || []).filter((m: any) => {
    const sSem = m.course?.semester ?? m.semester;
    return sSem === fromSem;
  });
  if (semMarks.length === 0) return false;

  let qualityPoints = 0;
  let totalCredits = 0;
  let totalAbsent = 0;
  let totalMax = 0;

  for (const m of semMarks) {
    const cr = m.course?.creditHours || 3;
    const isAbs = m.status === "ABSENT" || m.status === "A";
    const obt = isAbs ? 0 : typeof m.obtainedMarks === "number" ? m.obtainedMarks : 0;
    const max = typeof m.totalMarks === "number" && m.totalMarks > 0 ? m.totalMarks : 100;

    if (isAbs) {
      totalAbsent++;
    } else {
      const pct = (obt / max) * 100;
      let gp = 0;
      if (pct >= 85) gp = 4.0;
      else if (pct >= 80) gp = 3.66;
      else if (pct >= 75) gp = 3.33;
      else if (pct >= 71) gp = 3.0;
      else if (pct >= 68) gp = 2.66;
      else if (pct >= 64) gp = 2.33;
      else if (pct >= 61) gp = 2.0;
      else if (pct >= 58) gp = 1.66;
      else if (pct >= 54) gp = 1.3;
      else if (pct >= 50) gp = 1.0;
      else gp = 0.0;

      qualityPoints += gp * cr;
    }
    totalMax += max;
    totalCredits += cr;
  }

  // If student was absent in all papers of that semester, they are NOT promoted
  if (totalAbsent > 0 && totalAbsent === semMarks.length) return false;
  if (totalMax === 0 || totalCredits === 0) return false;

  const gpa = qualityPoints / totalCredits;
  return gpa >= 1.00;
}

export interface AutoPromoteOptions {
  courseId?: string;
  studentId?: string;
  programId?: string;
  session?: string;
  semester?: number;
  promotedBy?: string;
}

export async function autoPromoteStudentsForCourseOrSemester({
  courseId,
  studentId,
  programId: propProgramId,
  session: propSession,
  semester: propSemester,
  promotedBy = "System (Auto-Promoted on Results Publish)",
}: AutoPromoteOptions) {
  let targetSemester = propSemester;
  let targetProgramId = propProgramId;
  let targetSession = propSession;

  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, semester: true, programId: true, session: true },
    });
    if (course) {
      if (!targetSemester) targetSemester = course.semester;
      if (!targetProgramId) targetProgramId = course.programId;
      if (!targetSession && course.session) targetSession = course.session;
    }
  }

  if (!targetSemester || targetSemester < 1 || targetSemester >= 8) {
    return { promotedCount: 0, promotedStudentIds: [], nextCoursesCount: 0 };
  }

  const fromSem = targetSemester;
  const toSem = fromSem + 1;

  // Find candidate students whose current semester is at or below fromSem
  const candidates = await prisma.student.findMany({
    where: {
      isActive: true,
      ...(studentId ? { id: studentId } : {}),
      ...(targetProgramId && targetProgramId !== "ALL" ? { programId: targetProgramId } : {}),
      ...(targetSession && targetSession !== "ALL"
        ? {
            OR: [
              { session: targetSession },
              { session: { contains: targetSession } },
            ],
          }
        : {}),
      currentSemester: { lte: fromSem },
    },
    include: {
      marks: {
        include: { course: true },
      },
    },
  });

  const eligible = candidates.filter((s) => isStudentPromotedFromSem(s, fromSem));
  if (eligible.length === 0) {
    return { promotedCount: 0, promotedStudentIds: [], nextCoursesCount: 0 };
  }

  const eligibleIds = eligible.map((s) => s.id);

  // 1. Advance currentSemester to toSem
  await prisma.student.updateMany({
    where: { id: { in: eligibleIds } },
    data: { currentSemester: toSem },
  });

  // 2. Insert Promotion history
  await prisma.promotion.createMany({
    data: eligible.map((s) => ({
      studentId: s.id,
      fromSemester: fromSem,
      toSemester: toSem,
      status: "PROMOTED",
      promotedBy,
    })),
    skipDuplicates: true,
  });

  // 3. Auto-enroll in next semester courses for each student's program
  const nextCourses = await prisma.course.findMany({
    where: {
      semester: toSem,
      ...(targetProgramId && targetProgramId !== "ALL" ? { programId: targetProgramId } : {}),
    },
    select: { id: true, programId: true, session: true },
  });

  if (nextCourses.length > 0) {
    const enrollmentsToCreate: Array<{
      studentId: string;
      courseId: string;
      semester: number;
      status: string;
      isActive: boolean;
    }> = [];

    for (const st of eligible) {
      // Find courses for this student's program
      const studentCourses = nextCourses.filter((c) => {
        if (c.programId && st.programId && c.programId !== st.programId) return false;
        if (c.session && st.session && c.session !== st.session && !st.session.includes(c.session)) return false;
        return true;
      });

      for (const nc of studentCourses) {
        enrollmentsToCreate.push({
          studentId: st.id,
          courseId: nc.id,
          semester: toSem,
          status: "ACTIVE",
          isActive: true,
        });
      }
    }

    if (enrollmentsToCreate.length > 0) {
      await prisma.enrollment.createMany({
        data: enrollmentsToCreate,
        skipDuplicates: true,
      });
    }
  }

  return {
    promotedCount: eligible.length,
    promotedStudentIds: eligibleIds,
    nextCoursesCount: nextCourses.length,
  };
}

