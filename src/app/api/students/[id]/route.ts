import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_STUDENT_ROLES = ["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "PRINCIPAL", "BS_CONTROLLER"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;
    const sessionUserId = (session?.user as any)?.id;

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true, program: true, group: true, enrollments: { include: { course: true } } },
    });
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Authorization check: student can view their own profile, college staff can view within college, apex admins can view all
    if (sessionRole === "STUDENT") {
      if (student.userId !== sessionUserId) {
        return NextResponse.json({ error: "Forbidden: You can only view your own profile" }, { status: 403 });
      }
    } else if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (student.collegeId && student.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot access students of another college" }, { status: 403 });
      }
    }

    return NextResponse.json(student);
  } catch (error: any) {
    console.error("Fetch student error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_STUDENT_ROLES.includes(sessionRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingStudent = await prisma.student.findUnique({ where: { id } });
    if (!existingStudent) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // College scoping check
    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (existingStudent.collegeId && existingStudent.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot modify students of another college" }, { status: 403 });
      }
    }

    const { currentSemester, programId, groupId, isActive, rollNumber } = await req.json();

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(currentSemester !== undefined && { currentSemester: parseInt(currentSemester) }),
        ...(programId !== undefined && { programId: programId || null }),
        ...(groupId !== undefined && { groupId: groupId || null }),
        ...(isActive !== undefined && { isActive }),
        ...(rollNumber !== undefined && { rollNumber }),
      },
      include: { user: true, program: true, group: true },
    });
    return NextResponse.json(student);
  } catch (error: any) {
    console.error("Update student error:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_STUDENT_ROLES.includes(sessionRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // College scoping check
    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (student.collegeId && student.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot delete students of another college" }, { status: 403 });
      }
    }

    await prisma.$transaction(async (tx) => {
      // Soft-delete the student record
      await tx.student.update({ where: { id }, data: { isActive: false } });

      // Soft-delete the user record
      if (student.userId) {
        await tx.user.update({ where: { id: student.userId }, data: { isActive: false } });
      }
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email, 
        userName: session.user?.name,
        action: "DEACTIVATE", 
        entity: "Student", 
        entityId: id,
        description: `Student "${student.user?.name}" (${student.rollNumber}) deactivated`,
        collegeId: student.collegeId || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete student error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
