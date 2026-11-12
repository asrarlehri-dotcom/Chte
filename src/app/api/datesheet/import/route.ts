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
      return NextResponse.json({ error: "No datesheet records provided to import." }, { status: 400 });
    }

    const defaultSession = body.session || "2024-2028";

    // Pre-fetch courses and programs
    const allCourses = await prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, title: true, code: true, programId: true, semester: true }
    });

    const allPrograms = await prisma.program.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, departmentId: true }
    });

    let importedCount = 0;
    let failedCount = 0;
    const errors: { row: number; item: string; reason: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const rowIdx = i + 1;
      const raw = records[i];

      const rawDate = raw.date;
      const startTime = raw.startTime || "09:30";
      const endTime = raw.endTime || "12:30";
      const semester = parseInt(raw.semester || "1") || 1;
      const examType = raw.examType || "FINAL_TERM";
      const rawCourse = (raw.course || "").trim();

      if (!rawDate) {
        failedCount++;
        errors.push({ row: rowIdx, item: rawCourse || "Unknown Paper", reason: "Missing Exam Date: Exam date is required." });
        continue;
      }

      if (!rawCourse) {
        failedCount++;
        errors.push({ row: rowIdx, item: rawDate, reason: "Missing Course: Exam subject name is required." });
        continue;
      }

      const examDate = new Date(rawDate);
      if (isNaN(examDate.getTime())) {
        failedCount++;
        errors.push({ row: rowIdx, item: `${rawDate} - ${rawCourse}`, reason: "Invalid Exam Date: Date format is invalid." });
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

      const progObj = allPrograms.find(p => p.id === matchedProgramId);

      try {
        await prisma.datesheet.create({
          data: {
            date: examDate,
            startTime,
            endTime,
            semester,
            examType,
            session: raw.session || defaultSession,
            generationMode: "MANUAL",
            status: "PUBLISHED",
            courseId: matchedCourse?.id || null,
            programId: matchedProgramId,
            departmentId: progObj?.departmentId || null
          }
        });
        importedCount++;
      } catch (err: any) {
        failedCount++;
        errors.push({
          row: rowIdx,
          item: `${rawDate} - ${rawCourse}`,
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
    console.error("Datesheet import error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

