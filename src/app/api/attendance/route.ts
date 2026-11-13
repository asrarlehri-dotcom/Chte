import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { compareRollNumbers } from "@/lib/domainParsers";

// GET /api/attendance?educationLevel=BS&date=2026-08-06&courseId=...
// GET /api/attendance?educationLevel=INTERMEDIATE&date=2026-08-06&programId=...&groupId=...
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const educationLevel = searchParams.get("educationLevel");
    const dateStr = searchParams.get("date");

    if (!educationLevel || !dateStr) {
      return NextResponse.json({ error: "Missing educationLevel or date parameter" }, { status: 400 });
    }

    const startOfDay = new Date(dateStr + "T00:00:00.000Z");
    const endOfDay = new Date(dateStr + "T23:59:59.999Z");

    if (educationLevel === "BS") {
      const courseId = searchParams.get("courseId");
      if (!courseId) {
        return NextResponse.json({ error: "Missing courseId parameter" }, { status: 400 });
      }

      // 1. Fetch enrolled students
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId, status: "ACTIVE" },
        include: {
          student: {
            include: {
              user: { select: { name: true } }
            }
          }
        }
      });

      const students = enrollments.map(e => ({
        id: e.student.id,
        rollNumber: e.student.rollNumber,
        name: e.student.user.name,
      })).sort((a, b) => compareRollNumbers(a.rollNumber, b.rollNumber));

      // 2. Fetch existing attendance records
      const attendance = await prisma.attendance.findMany({
        where: {
          courseId,
          educationLevel: "BS",
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      const records = students.map(s => {
        const att = attendance.find(a => a.studentId === s.id);
        return {
          studentId: s.id,
          rollNumber: s.rollNumber,
          name: s.name,
          status: att ? att.status : "PRESENT"
        };
      });

      return NextResponse.json(records);
    } else {
      const programId = searchParams.get("programId");
      const groupId = searchParams.get("groupId");
      if (!programId || !groupId) {
        return NextResponse.json({ error: "Missing programId or groupId parameter" }, { status: 400 });
      }

      // 1. Fetch students in program/group
      const list = await prisma.student.findMany({
        where: {
          educationLevel: "INTERMEDIATE",
          programId,
          groupId,
          isActive: true
        },
        include: {
          user: { select: { name: true } }
        }
      });

      const students = list.map(s => ({
        id: s.id,
        rollNumber: s.rollNumber,
        name: s.user.name
      })).sort((a, b) => compareRollNumbers(a.rollNumber, b.rollNumber));

      // 2. Fetch existing attendance records
      const attendance = await prisma.attendance.findMany({
        where: {
          educationLevel: "INTERMEDIATE",
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          student: {
            programId,
            groupId
          }
        }
      });

      const records = students.map(s => {
        const att = attendance.find(a => a.studentId === s.id);
        return {
          studentId: s.id,
          rollNumber: s.rollNumber,
          name: s.name,
          status: att ? att.status : "PRESENT"
        };
      });

      return NextResponse.json(records);
    }
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/attendance
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { educationLevel, date: dateStr, courseId, programId, groupId, records } = body;

    if (!educationLevel || !dateStr || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const startOfDay = new Date(dateStr + "T00:00:00.000Z");
    const endOfDay = new Date(dateStr + "T23:59:59.999Z");
    const midDay = new Date(dateStr + "T12:00:00.000Z");

    await prisma.$transaction(async (tx) => {
      // 1. Find existing records to delete to prevent duplicate entries
      const existing = await tx.attendance.findMany({
        where: {
          educationLevel,
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          ...(educationLevel === "BS" 
            ? { courseId } 
            : { student: { programId, groupId } }
          )
        },
        select: { id: true }
      });

      const ids = existing.map(e => e.id);
      if (ids.length > 0) {
        await tx.attendance.deleteMany({
          where: { id: { in: ids } }
        });
      }

      // 2. Create new attendance records
      if (records.length > 0) {
        await tx.attendance.createMany({
          data: records.map((r: any) => ({
            studentId: r.studentId,
            status: r.status, // "PRESENT" | "ABSENT" | "LEAVE"
            date: midDay,
            educationLevel,
            ...(educationLevel === "BS" ? { courseId } : {})
          }))
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving attendance:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
