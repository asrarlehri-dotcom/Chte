import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/marks/unlock-request -> returns all pending unlock requests & summary metrics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch raw Marks records directly from SQLite to guarantee status column values
    let rawMarks: any[] = [];
    try {
      rawMarks = await prisma.$queryRawUnsafe(
        `SELECT "id", "courseId", "studentId", "status", "isLocked", "updatedAt" FROM "Marks"`
      );
    } catch {
      rawMarks = [];
    }

    const courses = await prisma.course.findMany({
      include: { program: true, faculty: { include: { user: true } } }
    });

    const courseMap: Record<string, any> = {};

    for (const c of courses) {
      courseMap[c.id] = {
        courseId: c.id,
        courseTitle: c.title,
        courseCode: c.code,
        programName: c.program?.name || "BS Program",
        facultyName: c.faculty?.user?.name || "Faculty Member",
        facultyEmail: c.faculty?.user?.email || "",
        status: "SAVED",
        isLocked: false,
        totalStudents: 0,
        updatedAt: c.updatedAt
      };
    }

    for (const m of rawMarks) {
      const cId = m.courseId;
      if (courseMap[cId]) {
        courseMap[cId].totalStudents += 1;
        if (m.updatedAt) courseMap[cId].updatedAt = m.updatedAt;
        if (m.isLocked === 1 || m.isLocked === true) courseMap[cId].isLocked = true;

        const st = (m.status || "").toUpperCase();
        if (st === "UNLOCK_REQUESTED") {
          courseMap[cId].status = "UNLOCK_REQUESTED";
        } else if (st === "PENDING_APPROVAL" && courseMap[cId].status !== "UNLOCK_REQUESTED") {
          courseMap[cId].status = "PENDING_APPROVAL";
        } else if ((st === "APPROVED" || m.isLocked === 1) && courseMap[cId].status !== "UNLOCK_REQUESTED" && courseMap[cId].status !== "PENDING_APPROVAL") {
          courseMap[cId].status = "APPROVED";
        }
      }
    }

    const allCoursesList = Object.values(courseMap);
    const unlockRequestsOnly = allCoursesList.filter(c => c.status === "UNLOCK_REQUESTED");

    const counts = {
      saved: allCoursesList.filter(c => c.status === "SAVED").length,
      pending: allCoursesList.filter(c => c.status === "PENDING_APPROVAL").length,
      unlockRequested: unlockRequestsOnly.length,
      approved: allCoursesList.filter(c => c.status === "APPROVED").length,
    };

    return NextResponse.json({ summaryList: unlockRequestsOnly, allCoursesList, counts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch unlock requests" }, { status: 500 });
  }
}

// POST /api/marks/unlock-request -> Faculty submits an unlock request with reason
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId, reason } = await req.json();
    if (!courseId || !reason) {
      return NextResponse.json({ error: "courseId and reason are required" }, { status: 400 });
    }

    const userName = session.user?.name || session.user?.email || "Faculty Member";

    // Update all marks records for this course to UNLOCK_REQUESTED
    await prisma.marks.updateMany({
      where: { courseId },
      data: { status: "UNLOCK_REQUESTED" },
    });

    // Create Audit Log
    const course = await prisma.course.findUnique({ where: { id: courseId }, include: { program: true } });
    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: userName,
        action: "REQUEST_UNLOCK",
        entity: "Marks",
        entityId: courseId,
        description: `Faculty "${userName}" requested Result Unlock for Course "${course?.title || courseId}" (${course?.program?.name || 'BS'}). Reason: "${reason}"`,
      }
    });

    return NextResponse.json({ success: true, message: "Unlock request submitted to Admin successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit unlock request" }, { status: 500 });
  }
}

// PATCH /api/marks/unlock-request -> Admin approves or rejects unlock request
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role || "";
    const isAdmin = ["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL", "HOD"].includes(userRole);
    if (!session || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
    }

    const { courseId, action, adminNotes } = await req.json(); // action: "APPROVE" | "REJECT"
    if (!courseId || !action) {
      return NextResponse.json({ error: "courseId and action are required" }, { status: 400 });
    }

    const adminName = session.user?.name || session.user?.email || "Admin";

    if (action === "APPROVE") {
      // Unlock all marks records for this course
      await prisma.marks.updateMany({
        where: { courseId },
        data: { isLocked: false, status: "UNLOCKED_FOR_EDIT" }
      });

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      await prisma.auditLog.create({
        data: {
          userEmail: session.user?.email,
          userName: adminName,
          action: "APPROVE_UNLOCK",
          entity: "Marks",
          entityId: courseId,
          description: `Admin "${adminName}" APPROVED Result Unlock for Course "${course?.title || courseId}". Notes: "${adminNotes || 'Approved for editing'}"`,
        }
      });

      return NextResponse.json({ success: true, message: "Result Unlocked! Faculty can now edit marks." });
    } else {
      // Reject unlock request - keep locked
      await prisma.marks.updateMany({
        where: { courseId },
        data: { status: "APPROVED" }
      });

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      await prisma.auditLog.create({
        data: {
          userEmail: session.user?.email,
          userName: adminName,
          action: "REJECT_UNLOCK",
          entity: "Marks",
          entityId: courseId,
          description: `Admin "${adminName}" REJECTED Result Unlock for Course "${course?.title || courseId}". Notes: "${adminNotes || 'Unlock request declined'}"`,
        }
      });

      return NextResponse.json({ success: true, message: "Unlock request rejected. Result remains locked." });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process unlock request" }, { status: 500 });
  }
}
