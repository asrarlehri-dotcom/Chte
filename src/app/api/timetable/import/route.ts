import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await request.json();
    const records: Record<string, string>[] = body.records || [];

    if (!records || records.length === 0) {
      return NextResponse.json({ error: "No timetable records provided to import." }, { status: 400 });
    }

    const educationLevel = body.educationLevel || "BS";
    const defaultSession = body.session || "2024";

    // Pre-fetch courses, programs, faculties
    const allCourses = await prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, title: true, code: true, programId: true, semester: true }
    });

    const allPrograms = await prisma.program.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, departmentId: true }
    });

    const allFaculties = await prisma.faculty.findMany({
      where: { isActive: true },
      include: { user: true }
    });

    let importedCount = 0;
    let failedCount = 0;
    const errors: { row: number; item: string; reason: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const rowIdx = i + 1;
      const raw = records[i];

      const dayOfWeek = raw.dayOfWeek || raw.day || "Monday";
      const startTime = raw.startTime || "09:00";
      const endTime = raw.endTime || "10:00";
      const semester = parseInt(raw.semester || "1") || 1;
      const rawCourse = (raw.course || "").trim();

      if (!rawCourse) {
        failedCount++;
        errors.push({ row: rowIdx, item: `${dayOfWeek} ${startTime}`, reason: "Missing Course: Course code or title is required." });
        continue;
      }

      // Match course
      const rawCourseLower = rawCourse.toLowerCase();
      let matchedCourse = allCourses.find(c =>
        c.code.toLowerCase() === rawCourseLower ||
        c.title.toLowerCase() === rawCourseLower ||
        rawCourseLower.includes(c.code.toLowerCase()) ||
        c.title.toLowerCase().includes(rawCourseLower)
      );

      // Match Program
      let matchedProgramId: string | null = matchedCourse?.programId || null;
      if (!matchedProgramId && raw.program) {
        const rawProgLower = raw.program.toLowerCase();
        const foundProg = allPrograms.find(p =>
          p.id.toLowerCase() === rawProgLower ||
          p.code?.toLowerCase() === rawProgLower ||
          p.name.toLowerCase().includes(rawProgLower)
        );
        if (foundProg) matchedProgramId = foundProg.id;
      }
      if (!matchedProgramId && allPrograms.length > 0) {
        matchedProgramId = allPrograms[0].id;
      }

      // Match faculty
      let matchedFacultyId: string | null = null;
      const rawTeacher = (raw.teacher || "").toLowerCase();
      if (rawTeacher && rawTeacher !== "—") {
        const foundFaculty = allFaculties.find(f =>
          f.user.name.toLowerCase().includes(rawTeacher) ||
          rawTeacher.includes(f.user.name.toLowerCase())
        );
        if (foundFaculty) matchedFacultyId = foundFaculty.id;
      }

      const progObj = allPrograms.find(p => p.id === matchedProgramId);

      try {
        await prisma.timetable.create({
          data: {
            dayOfWeek,
            startTime,
            endTime,
            semester,
            session: raw.session || defaultSession,
            educationLevel,
            generationMode: "MANUAL",
            status: "PUBLISHED",
            courseId: matchedCourse?.id || null,
            programId: matchedProgramId,
            departmentId: progObj?.departmentId || null,
            facultyId: matchedFacultyId
          }
        });
        importedCount++;
      } catch (err: any) {
        failedCount++;
        errors.push({
          row: rowIdx,
          item: `${dayOfWeek} ${startTime} - ${rawCourse}`,
          reason: err?.message || "Database insert error."
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: records.length,
      imported: importedCount,
      updated: 0,
      failed: failedCount,
      errors
    });
  } catch (err: any) {
    console.error("Timetable import error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

