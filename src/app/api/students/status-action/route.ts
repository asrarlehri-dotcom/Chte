import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_STATUS_ROLES = ["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL", "HOD", "EXAM_CONTROLLER"];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_STATUS_ROLES.includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusType = searchParams.get("statusType");
    const collegeId = searchParams.get("collegeId") || sessionCollegeId;

    const where: any = {};
    if (statusType) {
      if (statusType === "MIGRATION") {
        where.statusType = { in: ["MIGRATION", "MIGRATION_OUT"] };
      } else if (statusType === "QUIT") {
        where.statusType = { in: ["QUIT", "ADP"] };
      } else if (statusType === "FREEZE") {
        where.statusType = "FREEZE";
      } else {
        where.statusType = statusType;
      }
    }

    if (collegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      where.student = {
        OR: [
          { collegeId },
          { collegeId: null }
        ]
      };
    }

    const records = await prisma.studentStatus.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            program: { select: { id: true, name: true, code: true } },
            college: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, records });
  } catch (error: any) {
    console.error("Fetch status records error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch status records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_STATUS_ROLES.includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      studentId,
      statusType,
      reason,
      notes,
      memoNo,
      relievingNo,
      fromSem,
      toSem,
      destinationCollege,
      adaDegreeType,
      adaCreditHours,
      adaCgpa,
      adaMeetingDate,
      adaMeetingVenue,
      adaLiaisonUniv,
    } = body;

    const effectiveMemoNo = memoNo || relievingNo || "";

    if (!studentId || !statusType) {
      return NextResponse.json({ error: "Student ID and Status Type are required" }, { status: 400 });
    }

    // Verify student exists and college scoping check
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        program: true,
        college: true,
      },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (student.collegeId && student.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot modify students of another college" }, { status: 403 });
      }
    }

    const isUnfreezing = ["ACTIVE", "UNFREEZE", "REACTIVATE"].includes(statusType.toUpperCase());

    // Prepare rich formatted notes storing all institutional dispatch details
    const metaParts: string[] = [];
    if (effectiveMemoNo) metaParts.push(`Memo No: ${effectiveMemoNo}`);
    if (fromSem && toSem) metaParts.push(`Freeze Duration: Sem ${fromSem} to Sem ${toSem}`);
    if (destinationCollege) metaParts.push(`Destination: ${destinationCollege}`);
    if (adaDegreeType) metaParts.push(`Degree: ${adaDegreeType}`);
    if (adaCreditHours) metaParts.push(`Credits: ${adaCreditHours}`);
    if (adaCgpa) metaParts.push(`CGPA: ${adaCgpa}`);
    if (adaMeetingDate) metaParts.push(`Meeting Date: ${adaMeetingDate}`);
    if (adaMeetingVenue) metaParts.push(`Venue: ${adaMeetingVenue}`);
    if (adaLiaisonUniv) metaParts.push(`University: ${adaLiaisonUniv}`);

    let compiledNotes = notes || reason || "";
    if (metaParts.length > 0) {
      const headerStr = metaParts.join(" • ");
      if (notes && !notes.includes(effectiveMemoNo)) {
        compiledNotes = `${headerStr} • Remarks: ${notes}`;
      } else {
        compiledNotes = headerStr;
      }
    }

    // 1. Create StudentStatus record
    const statusRecord = await prisma.studentStatus.create({
      data: {
        studentId,
        statusType: isUnfreezing ? "ACTIVE" : statusType,
        reason: reason || destinationCollege || (adaDegreeType ? `Quit for ${adaDegreeType}` : isUnfreezing ? "Resumed semester studies" : null),
        notes: compiledNotes || null,
        approvedBy: session.user?.name || session.user?.email || "Admin",
      },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            program: { select: { id: true, name: true, code: true } },
            college: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    // 2. Update Student model activity status
    const shouldDeactivate = !isUnfreezing && ["FREEZE", "QUIT", "ADP", "DROPOUT", "MIGRATION_OUT", "MIGRATION"].includes(statusType.toUpperCase());
    
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
          statusType: { in: ["FREEZE", "DROPOUT", "QUIT", "ADP", "MIGRATION_OUT", "MIGRATION"] },
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
        description: isUnfreezing
          ? `Student ${student.rollNumber} status restored to ACTIVE (Unfrozen / resumed studies)`
          : `Student ${student.rollNumber} status updated to ${statusType} (Memo: ${effectiveMemoNo || 'N/A'}, Reason: ${reason || 'N/A'})`,
        collegeId: student.collegeId || null,
      },
    });

    return NextResponse.json({ success: true, statusRecord });
  } catch (error: any) {
    console.error("Status action error:", error);
    return NextResponse.json({ error: error.message || "Failed to update status" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_STATUS_ROLES.includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    const record = await prisma.studentStatus.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (record.student?.collegeId && record.student.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Delete the status record
    await prisma.studentStatus.delete({ where: { id } });

    // Check if the student has any other active freeze/quit/migration records
    const remainingActive = await prisma.studentStatus.findFirst({
      where: {
        studentId: record.studentId,
        statusType: { in: ["FREEZE", "QUIT", "ADP", "DROPOUT", "MIGRATION_OUT", "MIGRATION"] },
        isActive: true,
      },
    });

    if (!remainingActive) {
      await prisma.student.update({
        where: { id: record.studentId },
        data: { isActive: true },
      });
      if (record.student?.userId) {
        await prisma.user.update({
          where: { id: record.student.userId },
          data: { isActive: true },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Status record removed and student status recalculated" });
  } catch (error: any) {
    console.error("Delete status record error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete record" }, { status: 500 });
  }
}
