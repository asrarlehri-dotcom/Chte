import { prisma } from "@/lib/prisma";
import { getGPValue } from "@/lib/cgpa";

export interface StudentPromotionEvaluation {
  isEligible: boolean;
  status: "PROMOTED" | "PROBATION" | "DROPOUT" | "ABSENT";
  gpa: number;
  cgpa: number;
}

/**
 * Official University & HEC Semester Promotion Rules:
 * - 1st Semester: GPA >= 1.00 is PROMOTED and eligible for next semester. (GPA < 1.00 is DROPOUT)
 * - 2nd Semester: CGPA >= 1.50 is PROMOTED. (CGPA 1.00-1.49 is PROBATION, eligible for next semester. < 1.00 is DROPOUT)
 * - 3rd Semester: CGPA >= 1.75 is PROMOTED. (CGPA 1.00-1.74 is PROBATION, eligible for next semester. < 1.00 is DROPOUT)
 * - 4th to 8th Semester: CGPA >= 2.00 is PROMOTED. (CGPA 1.00-1.99 is PROBATION, eligible for next semester. < 1.00 is DROPOUT)
 * 
 * NOTE: Number of failed papers in current or previous semesters does NOT block promotion
 * as long as the student's GPA/CGPA satisfies the academic criteria.
 */
export function evaluateStudentPromotion(s: any, fromSem: number): StudentPromotionEvaluation {
  const allMarks = s.marks || [];

  // Marks in target semester fromSem
  const semMarks = allMarks.filter((m: any) => {
    const sSem = m.course?.semester ?? m.semester ?? 1;
    return sSem === fromSem;
  });

  if (semMarks.length === 0) {
    return { isEligible: false, status: "DROPOUT", gpa: 0, cgpa: 0 };
  }

  let semQualityPoints = 0;
  let semCredits = 0;
  let semAbsentCount = 0;

  for (const m of semMarks) {
    const cr = m.course?.creditHours || 3;
    const isAbs = m.status === "ABSENT" || m.status === "A";
    const obt = isAbs ? 0 : typeof m.obtainedMarks === "number" ? m.obtainedMarks : 0;
    const max = typeof m.totalMarks === "number" && m.totalMarks > 0 ? m.totalMarks : 100;

    if (isAbs) {
      semAbsentCount++;
    } else {
      const gp = getGPValue(obt, max);
      semQualityPoints += gp * cr;
    }
    semCredits += cr;
  }

  // Absent in all papers of fromSem
  if (semAbsentCount > 0 && semAbsentCount === semMarks.length) {
    return { isEligible: false, status: "ABSENT", gpa: 0, cgpa: 0 };
  }

  const gpa = semCredits > 0 ? parseFloat((semQualityPoints / semCredits).toFixed(2)) : 0;

  // Calculate Cumulative GPA (CGPA) up to fromSem
  const minSem = s.bsAdmissionType === "BRIDGING_5TH" ? 5 : 1;
  let cumQualityPoints = 0;
  let cumCredits = 0;

  allMarks.forEach((m: any) => {
    const sem = m.course?.semester ?? m.semester ?? 1;
    if (sem >= minSem && sem <= fromSem) {
      const cr = m.course?.creditHours || 3;
      const isAbs = m.status === "ABSENT" || m.status === "A";
      const obt = isAbs ? 0 : typeof m.obtainedMarks === "number" ? m.obtainedMarks : 0;
      const max = typeof m.totalMarks === "number" && m.totalMarks > 0 ? m.totalMarks : 100;
      const gp = isAbs ? 0.0 : getGPValue(obt, max);
      cumQualityPoints += gp * cr;
      cumCredits += cr;
    }
  });

  const cgpa = cumCredits > 0 ? parseFloat((cumQualityPoints / cumCredits).toFixed(2)) : gpa;

  // Evaluation by semester based on official formula
  if (fromSem === 1) {
    if (gpa >= 1.00) {
      return { isEligible: true, status: "PROMOTED", gpa, cgpa };
    }
    return { isEligible: false, status: "DROPOUT", gpa, cgpa };
  }

  if (fromSem === 2) {
    if (cgpa >= 1.50) {
      return { isEligible: true, status: "PROMOTED", gpa, cgpa };
    }
    if (cgpa >= 1.00) {
      return { isEligible: false, status: "PROBATION", gpa, cgpa };
    }
    return { isEligible: false, status: "DROPOUT", gpa, cgpa };
  }

  if (fromSem === 3) {
    if (cgpa >= 1.75) {
      return { isEligible: true, status: "PROMOTED", gpa, cgpa };
    }
    if (cgpa >= 1.00) {
      return { isEligible: false, status: "PROBATION", gpa, cgpa };
    }
    return { isEligible: false, status: "DROPOUT", gpa, cgpa };
  }

  // Semesters 4 to 8: Minimum CGPA 2.00 is PROMOTED, CGPA 1.00-1.99 is PROBATION
  if (cgpa >= 2.00) {
    return { isEligible: true, status: "PROMOTED", gpa, cgpa };
  }
  if (cgpa >= 1.00) {
    return { isEligible: false, status: "PROBATION", gpa, cgpa };
  }
  return { isEligible: false, status: "DROPOUT", gpa, cgpa };
}

export function isStudentPromotedFromSem(s: any, fromSem: number): boolean {
  return evaluateStudentPromotion(s, fromSem).isEligible;
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

  const evaluations = candidates.map((s) => ({
    student: s,
    eval: evaluateStudentPromotion(s, fromSem),
  }));

  const eligibleList = evaluations.filter((e) => e.eval.isEligible);
  if (eligibleList.length === 0) {
    return { promotedCount: 0, promotedStudentIds: [], nextCoursesCount: 0 };
  }

  const eligibleIds = eligibleList.map((e) => e.student.id);

  // 1. Advance currentSemester to toSem
  await prisma.student.updateMany({
    where: { id: { in: eligibleIds } },
    data: { currentSemester: toSem },
  });

  // 2. Insert Promotion history records with evaluated status and GPAs
  await prisma.promotion.createMany({
    data: eligibleList.map(({ student, eval: ev }) => ({
      studentId: student.id,
      fromSemester: fromSem,
      toSemester: toSem,
      status: ev.status,
      gpa: ev.gpa,
      cgpa: ev.cgpa,
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

    for (const { student: st } of eligibleList) {
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
    promotedCount: eligibleList.length,
    promotedStudentIds: eligibleIds,
    nextCoursesCount: nextCourses.length,
  };
}
