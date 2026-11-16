import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_PROMOTION_ROLES = [
  "CHTE_ADMIN",
  "COLLEGE_ADMIN",
  "SUPER_ADMIN",
  "ADMIN",
  "BS_CONTROLLER",
  "PRINCIPAL",
  "HOD",
];

interface StudentPromotionItem {
  studentId: string;
  status?: string;
  gpa?: number | null;
  cgpa?: number | null;
  remarks?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;
    const sessionUserEmail = session?.user?.email || "Admin";
    const sessionUserName = session?.user?.name || sessionUserEmail;

    if (!session || !ALLOWED_PROMOTION_ROLES.includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized: Insufficient permissions for student promotion." }, { status: 401 });
    }

    const body = await req.json();
    const {
      programId,
      session: sessionBatch,
      fromSemester,
      toSemester,
      students,
      studentIds,
      autoEnrollNextCourses = true,
    } = body;

    const fromSemInt = parseInt(String(fromSemester));
    const toSemInt = parseInt(String(toSemester));

    if (isNaN(fromSemInt) || isNaN(toSemInt) || toSemInt <= fromSemInt) {
      return NextResponse.json(
        { error: "Invalid semesters: Target semester must be greater than current semester." },
        { status: 400 }
      );
    }

    if (toSemInt > 8) {
      return NextResponse.json(
        { error: "Target semester cannot exceed Semester 8 (Degree Final Semester)." },
        { status: 400 }
      );
    }

    // Standardize promotion list
    let promotionItems: StudentPromotionItem[] = [];
    if (Array.isArray(students) && students.length > 0) {
      promotionItems = students;
    } else if (Array.isArray(studentIds) && studentIds.length > 0) {
      promotionItems = studentIds.map((id: string) => ({
        studentId: id,
        status: "PROMOTED",
      }));
    }

    if (promotionItems.length === 0) {
      return NextResponse.json({ error: "No students provided for promotion." }, { status: 400 });
    }

    const targetStudentIds = promotionItems.map((p) => p.studentId);

    // Fetch existing students to verify college scoping and existence
    const dbStudents = await prisma.student.findMany({
      where: {
        id: { in: targetStudentIds },
        ...(sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN"
          ? { collegeId: sessionCollegeId }
          : {}),
      },
      include: {
        user: true,
      },
    });

    if (dbStudents.length === 0) {
      return NextResponse.json({ error: "No valid students found matching the promotion criteria." }, { status: 404 });
    }

    const validStudentIds = dbStudents.map((s) => s.id);

    // 1. Update students to the next semester in DB
    await prisma.student.updateMany({
      where: { id: { in: validStudentIds } },
      data: { currentSemester: toSemInt },
    });

    // 2. Insert Promotion history records
    const promotionData = dbStudents.map((s) => {
      const match = promotionItems.find((p) => p.studentId === s.id);
      return {
        studentId: s.id,
        fromSemester: fromSemInt,
        toSemester: toSemInt,
        status: match?.status || "PROMOTED",
        gpa: match?.gpa !== undefined && match.gpa !== null ? parseFloat(String(match.gpa)) : null,
        cgpa: match?.cgpa !== undefined && match.cgpa !== null ? parseFloat(String(match.cgpa)) : null,
        promotedBy: `${sessionUserName} (${sessionRole})`,
      };
    });

    await prisma.promotion.createMany({
      data: promotionData,
    });

    // 3. Auto-enroll promoted students in next semester courses if requested and available
    let nextCoursesCount = 0;
    if (autoEnrollNextCourses) {
      // Find courses for the next semester
      const nextCourses = await prisma.course.findMany({
        where: {
          ...(programId ? { programId } : {}),
          semester: toSemInt,
          ...(sessionBatch && sessionBatch !== "ALL"
            ? {
                OR: [
                  { session: sessionBatch },
                  { session: { contains: sessionBatch } },
                ],
              }
            : {}),
        },
        select: { id: true, title: true, semester: true },
      });

      nextCoursesCount = nextCourses.length;

      if (nextCourses.length > 0) {
        const enrollmentsToCreate: Array<{
          studentId: string;
          courseId: string;
          semester: number;
          status: string;
          isActive: boolean;
        }> = [];

        for (const st of dbStudents) {
          for (const c of nextCourses) {
            enrollmentsToCreate.push({
              studentId: st.id,
              courseId: c.id,
              semester: toSemInt,
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
    }

    // 4. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: (session.user as any)?.id,
          userEmail: sessionUserEmail,
          userName: sessionUserName,
          action: "UPDATE",
          entity: "Promotion",
          description: `Batch promoted ${validStudentIds.length} student(s) from Semester ${fromSemInt} to Semester ${toSemInt}${programId ? ` in program ${programId}` : ""}.`,
        },
      });
    } catch (auditErr) {
      console.warn("Failed to write promotion audit log:", auditErr);
    }

    return NextResponse.json({
      success: true,
      promotedCount: validStudentIds.length,
      fromSemester: fromSemInt,
      toSemester: toSemInt,
      nextCoursesCount,
      message: `Successfully promoted ${validStudentIds.length} student(s) from Semester ${fromSemInt} to Semester ${toSemInt}!`,
    });
  } catch (error: any) {
    console.error("Batch promotion error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred during batch promotion." },
      { status: 500 }
    );
  }
}
