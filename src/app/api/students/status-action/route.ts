import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_STATUS_ROLES = ["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL"];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_STATUS_ROLES.includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, statusType, reason, notes, relievingNo } = await req.json();

    if (!studentId || !statusType) {
      return NextResponse.json({ error: "Student ID and Status Type are required" }, { status: 400 });
    }

    // Verify student exists and college scoping check
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (student.collegeId && student.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot modify students of another college" }, { status: 403 });
      }
    }

    // 1. Create StudentStatus record
    const statusRecord = await prisma.studentStatus.create({
      data: {
        studentId,
        statusType,
        reason: reason || null,
        notes: notes || (relievingNo ? `NOC / Relieving Cert No: ${relievingNo}` : null),
        approvedBy: session.user?.name || session.user?.email || "Admin",
      },
    });

    // 2. Update Student model activity status
    const shouldDeactivate = ["FREEZE", "QUIT", "ADP", "DROPOUT", "MIGRATION_OUT"].includes(statusType.toUpperCase());
    
    await prisma.student.update({
      where: { id: studentId },
      data: {
        isActive: !shouldDeactivate,
      },
    });

    if (student.userId) {
      await prisma.user.update({
        where: { id: student.userId },
        data: {
          isActive: !shouldDeactivate,
        },
      });
    }

    if (!shouldDeactivate) {
      await prisma.studentStatus.updateMany({
        where: {
          studentId,
          statusType: { in: ["FREEZE", "DROPOUT", "QUIT", "ADP", "MIGRATION_OUT"] },
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    // 3. Audit Log
    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "STATUS_CHANGE",
        entity: "Student",
        entityId: studentId,
        description: `Student status updated to ${statusType} (${reason || 'No reason specified'})`,
        collegeId: student.collegeId || null,
      },
    });

    return NextResponse.json({ success: true, statusRecord });
  } catch (error: any) {
    console.error("Status action error:", error);
    return NextResponse.json({ error: error.message || "Failed to update status" }, { status: 500 });
  }
}
