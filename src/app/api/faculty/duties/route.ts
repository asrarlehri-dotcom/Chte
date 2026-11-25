import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMETABLE_SLOTS = [
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" }
];

// Helper to fix any legacy overlapping auto-generated timetable entries for the same program & semester
async function cleanupConflictingTimetables() {
  try {
    const allTimetables = await prisma.timetable.findMany({
      where: { generationMode: "AUTO" },
      orderBy: [{ programId: "asc" }, { semester: "asc" }, { createdAt: "asc" }]
    });

    const grouped: Record<string, typeof allTimetables> = {};
    for (const tt of allTimetables) {
      const key = `${tt.programId}_${tt.semester}_${tt.session}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(tt);
    }

    for (const key of Object.keys(grouped)) {
      const list = grouped[key];
      const timeSlotsUsed: Record<string, boolean> = {};

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const slotIdx = i % TIMETABLE_SLOTS.length;
        const dayIdx = Math.floor(i / TIMETABLE_SLOTS.length) % DAYS.length;
        const newDay = DAYS[dayIdx];
        const newStart = TIMETABLE_SLOTS[slotIdx].start;
        const newEnd = TIMETABLE_SLOTS[slotIdx].end;

        const slotKey = `${newDay}_${newStart}`;
        if (item.dayOfWeek !== newDay || item.startTime !== newStart) {
          await prisma.timetable.update({
            where: { id: item.id },
            data: {
              dayOfWeek: newDay,
              startTime: newStart,
              endTime: newEnd,
            }
          });
        }
        timeSlotsUsed[slotKey] = true;
      }
    }
  } catch (err) {
    console.error("Timetable conflict cleanup error:", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role || "";
    const userEmail = session.user.email || "";
    const userName = session.user.name || "";
    const userId = (session.user as any).id || "";

    const isAdmin = ["SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL"].includes(role);
    const isBSFaculty = ["BS_FACULTY", "FACULTY", "TEACHER"].includes(role);
    const isInterFaculty = ["INTER_FACULTY"].includes(role);

    // Run automatic conflict cleanup for existing DB entries
    await cleanupConflictingTimetables();

    // Find faculty record in DB
    const faculty = await prisma.faculty.findFirst({
      where: {
        OR: [
          { userId: userId },
          { user: { email: { equals: userEmail } } },
          { user: { name: { equals: userName } } },
        ]
      },
      include: { user: true, department: true }
    });

    const facultyId = faculty?.id || null;

    // Fetch assigned courses for this logged-in faculty
    const assignedCourses = await prisma.course.findMany({
      where: {
        ...(facultyId && !isAdmin ? {
          OR: [
            { facultyId: facultyId },
            { faculty: { user: { email: userEmail } } },
            { faculty: { user: { name: userName } } }
          ]
        } : {})
      },
      include: {
        program: true,
        department: true,
        faculty: { include: { user: true } }
      },
      orderBy: [{ semester: "asc" }, { title: "asc" }]
    });

    const assignedCourseIds = assignedCourses.map(c => c.id);

    // Fetch published timetables specifically for THIS faculty member's assigned courses
    const allPublishedTimetables = await prisma.timetable.findMany({
      where: {
        status: "PUBLISHED"
      },
      include: {
        course: { include: { program: true, faculty: { include: { user: true } } } },
        program: true,
        department: true,
        faculty: { include: { user: true } }
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
    });

    // Filter timetables to only include entries assigned to this faculty
    const publishedTimetables = allPublishedTimetables.filter(tt => {
      if (isAdmin) return true;
      if (!facultyId && assignedCourseIds.length === 0) return false;
      if (tt.facultyId === facultyId) return true;
      if (tt.courseId && assignedCourseIds.includes(tt.courseId)) return true;
      if (tt.course?.facultyId === facultyId) return true;
      if (tt.faculty?.user?.email && userEmail && tt.faculty.user.email.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    });

    // Fetch published datesheets
    const allPublishedDatesheets = await prisma.datesheet.findMany({
      where: {
        status: "PUBLISHED",
      },
      include: {
        course: { include: { program: true, faculty: { include: { user: true } } } },
        program: true,
        department: true,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }]
    });

    // Filter datesheets relevant to faculty's assigned courses
    const publishedDatesheets = allPublishedDatesheets.filter(ds => {
      if (isAdmin) return true;
      if (!facultyId && assignedCourseIds.length === 0) return false;
      if (ds.courseId && assignedCourseIds.includes(ds.courseId)) return true;
      if (ds.course?.facultyId === facultyId) return true;
      return false;
    });

    // Build notifications
    const notifications: Array<{
      id: string;
      type: "TIMETABLE" | "DATESHEET" | "DUTY";
      title: string;
      message: string;
      educationLevel: "BS" | "INTERMEDIATE" | "ALL";
      createdAt: string;
    }> = [];

    if (publishedTimetables.length > 0) {
      notifications.push({
        id: `tt-${publishedTimetables[0].id}`,
        type: "TIMETABLE",
        title: "📅 Official Timetable Published",
        message: `Admin has published your class timetable! You have ${publishedTimetables.length} assigned class period(s).`,
        educationLevel: isInterFaculty ? "INTERMEDIATE" : "BS",
        createdAt: new Date().toISOString()
      });
    }

    if (publishedDatesheets.length > 0) {
      notifications.push({
        id: `ds-${publishedDatesheets[0].id}`,
        type: "DATESHEET",
        title: "📝 Exam Conduct & Invigilation Duties Published",
        message: `Exam Datesheet & Invigilation Duty List has been published with ${publishedDatesheets.length} exam duty session(s).`,
        educationLevel: isInterFaculty ? "INTERMEDIATE" : "BS",
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      role,
      educationLevel: isInterFaculty ? "INTERMEDIATE" : (isBSFaculty ? "BS" : "ALL"),
      faculty: faculty ? {
        id: faculty.id,
        name: faculty.user?.name,
        email: faculty.user?.email,
        designation: faculty.designation,
        department: faculty.department?.name,
      } : null,
      assignedCoursesCount: assignedCourses.length,
      assignedCourses,
      publishedTimetablesCount: publishedTimetables.length,
      publishedTimetables,
      publishedDatesheetsCount: publishedDatesheets.length,
      publishedDatesheets,
      notifications,
    });
  } catch (error: any) {
    console.error("Error in faculty duties API:", error);
    return NextResponse.json({ error: "Failed to load faculty duties" }, { status: 500 });
  }
}
