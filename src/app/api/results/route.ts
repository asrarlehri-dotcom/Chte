import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGPValue } from "@/lib/cgpa";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || undefined;
    const semester = searchParams.get("semester");

    const results = await prisma.result.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(semester && { semester: parseInt(semester) }),
      },
      include: { student: { include: { user: true } } },
      orderBy: [{ semester: "asc" }],
    });
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { studentId, semester } = await req.json();
    if (!studentId || !semester)
      return NextResponse.json({ error: "studentId and semester required" }, { status: 400 });

    const semesterInt = parseInt(semester);

    // 1. Fetch all semester enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId, semester: semesterInt },
      include: { course: true },
    });

    if (enrollments.length === 0)
      return NextResponse.json({ error: "No enrollments found for this student/semester" }, { status: 400 });

    // 2. Fetch marks for these enrolled courses
    const marksRecords = await prisma.marks.findMany({
      where: { studentId, courseId: { in: enrollments.map(e => e.courseId) } },
      include: { course: true },
    });

    // 3. GPA Calculation: Sum(Course Credit Hours * GP) / Total Semester Credit Hours
    let semesterCreditHours = 0;
    let semesterQualityPoints = 0;

    marksRecords.forEach(m => {
      const isAbsent = m.status === "ABSENT" || m.status === "A";
      const gp = isAbsent ? 0.0 : getGPValue(m.obtainedMarks, m.totalMarks);
      const credits = m.course?.creditHours ?? 3;
      semesterCreditHours += credits;
      semesterQualityPoints += (gp * credits);
    });

    const gpa = semesterCreditHours > 0
      ? parseFloat((semesterQualityPoints / semesterCreditHours).toFixed(2))
      : 0.00;

    // 4. Cumulative CGPA Calculation: Only up to this specific semester (semesterInt)
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { bsAdmissionType: true },
    });
    const minSem = student?.bsAdmissionType === "BRIDGING_5TH" ? 5 : 1;

    const cumulativeMarks = await prisma.marks.findMany({
      where: {
        studentId,
        course: {
          semester: {
            gte: minSem,
            lte: semesterInt,
          },
        },
      },
      include: { course: true },
    });

    let cumulativeCreditHours = 0;
    let cumulativeQualityPoints = 0;

    cumulativeMarks.forEach(m => {
      const isAbsent = m.status === "ABSENT" || m.status === "A";
      const gp = isAbsent ? 0.0 : getGPValue(m.obtainedMarks, m.totalMarks);
      const credits = m.course?.creditHours ?? 3;
      cumulativeCreditHours += credits;
      cumulativeQualityPoints += (gp * credits);
    });

    const cgpa = cumulativeCreditHours > 0
      ? parseFloat((cumulativeQualityPoints / cumulativeCreditHours).toFixed(2))
      : gpa;

    // Determine academic status based on official university/HEC rules
    let status = "PROMOTED";
    if (semesterInt === 1) {
      status = gpa >= 1.0 ? "PROMOTED" : "DROPOUT";
    } else if (semesterInt === 2) {
      status = cgpa >= 1.5 ? "PROMOTED" : cgpa >= 1.0 ? "PROBATION" : "DROPOUT";
    } else if (semesterInt === 3) {
      status = cgpa >= 1.75 ? "PROMOTED" : cgpa >= 1.0 ? "PROBATION" : "DROPOUT";
    } else {
      status = cgpa >= 2.0 ? "PROMOTED" : cgpa >= 1.0 ? "PROBATION" : "DROPOUT";
    }

    // 5. Upsert result record
    const existing = await prisma.result.findFirst({
      where: { studentId, semester: semesterInt },
    });

    const result = existing
      ? await prisma.result.update({
          where: { id: existing.id },
          data: { gpa, cgpa, status },
          include: { student: { include: { user: true } } },
        })
      : await prisma.result.create({
          data: { studentId, semester: semesterInt, gpa, cgpa, status },
          include: { student: { include: { user: true } } },
        });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Result generation failed:", error);
    return NextResponse.json({ error: "Failed to generate result" }, { status: 500 });
  }
}
