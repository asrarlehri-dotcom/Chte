import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Exact Percentage-to-GP lookup based on provided grading policy
// Percentage-to-GP lookup based on new linear grading policy:
// 50% = 1.0, 51% = 1.1, ..., 79% = 3.9, 80%+ = 4.0
function calcGPA(obtained: number, total: number): number {
  if (total <= 0) return 0.00;
  const pct = (obtained / total) * 100;
  const rounded = Math.round(pct);

  if (rounded < 50) return 0.00; // Fail
  if (rounded >= 80) return 4.00; // Max GP is 4.0 (starts at 80%)

  // Formula: 1.00 + (rounded - 50) * 0.10
  return parseFloat((1.00 + (rounded - 50) * 0.10).toFixed(2));
}

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
      const gp = calcGPA(m.obtainedMarks, m.totalMarks);
      const credits = m.course?.creditHours ?? 3;
      semesterCreditHours += credits;
      semesterQualityPoints += (gp * credits);
    });

    const gpa = semesterCreditHours > 0
      ? parseFloat((semesterQualityPoints / semesterCreditHours).toFixed(2))
      : 0.00;

    // 4. CGPA Calculation: Sum(Course Credit Hours * GP of all Semesters) / Total Credit Hours of all Semesters
    const allMarks = await prisma.marks.findMany({
      where: { studentId },
      include: { course: true },
    });

    let cumulativeCreditHours = 0;
    let cumulativeQualityPoints = 0;

    allMarks.forEach(m => {
      const gp = calcGPA(m.obtainedMarks, m.totalMarks);
      const credits = m.course?.creditHours ?? 3;
      cumulativeCreditHours += credits;
      cumulativeQualityPoints += (gp * credits);
    });

    const cgpa = cumulativeCreditHours > 0
      ? parseFloat((cumulativeQualityPoints / cumulativeCreditHours).toFixed(2))
      : 0.00;

    // Determine academic status based on semester GP
    const status = gpa >= 1.7 ? "PROMOTED" : gpa > 0 ? "PROBATION" : "DROPOUT";

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
