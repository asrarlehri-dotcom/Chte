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
      return NextResponse.json({ error: "No course records provided to import." }, { status: 400 });
    }

    const targetProgramId = body.programId || null;

    // Fetch active programs for matching
    const allPrograms = await prisma.program.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, educationLevel: true }
    });

    // Fetch departments for matching
    const allDepts = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true }
    });

    let importedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const errors: { row: number; item: string; reason: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const rowIdx = i + 1;
      const raw = records[i];

      const code = (raw.code || raw.coursecode || "").trim().toUpperCase();
      const title = (raw.title || raw.coursetitle || "").trim();

      if (!code) {
        failedCount++;
        errors.push({ row: rowIdx, item: title || "Unknown Course", reason: "Missing Course Code: Course code is required." });
        continue;
      }

      if (!title) {
        failedCount++;
        errors.push({ row: rowIdx, item: code, reason: "Missing Course Title: Course title is required." });
        continue;
      }

      // Match program
      let matchedProgramId = targetProgramId;
      const rawProg = (raw.program || raw.programname || "").trim().toLowerCase();
      if (!matchedProgramId && rawProg) {
        const found = allPrograms.find(p =>
          p.id.toLowerCase() === rawProg ||
          p.code?.toLowerCase() === rawProg ||
          p.name.toLowerCase() === rawProg ||
          p.name.toLowerCase().includes(rawProg) ||
          rawProg.includes(p.name.toLowerCase())
        );
        if (found) matchedProgramId = found.id;
      }
      if (!matchedProgramId && allPrograms.length > 0) {
        matchedProgramId = allPrograms[0].id;
      }

      // Match department
      let matchedDeptId: string | null = null;
      const rawDept = (raw.department || raw.dept || "").trim().toLowerCase();
      if (rawDept) {
        const foundDept = allDepts.find(d =>
          d.id.toLowerCase() === rawDept ||
          d.code?.toLowerCase() === rawDept ||
          d.name.toLowerCase().includes(rawDept)
        );
        if (foundDept) matchedDeptId = foundDept.id;
      }

      const creditHours = parseInt(raw.creditHours || "3") || 3;
      const creditHoursFormat = raw.creditHoursFormat || `${creditHours}(${creditHours}-0)`;
      const semester = parseInt(raw.semester || "1") || 1;
      const courseType = raw.courseType || "CORE";
      const sessionYear = raw.session || "2024-2028";

      try {
        // Upsert matching existing course by programId, code and title/semester
        const existing = await prisma.course.findFirst({
          where: {
            programId: matchedProgramId,
            OR: [
              { code, title: { equals: title, mode: "insensitive" } },
              { code, semester }
            ]
          }
        });

        if (existing) {
          await prisma.course.update({
            where: { id: existing.id },
            data: {
              title,
              creditHours,
              creditHoursFormat,
              semester,
              courseType,
              session: sessionYear,
              departmentId: matchedDeptId || existing.departmentId
            }
          });
          updatedCount++;
        } else {
          await prisma.course.create({
            data: {
              code,
              title,
              creditHours,
              creditHoursFormat,
              semester,
              courseType,
              session: sessionYear,
              programId: matchedProgramId!,
              departmentId: matchedDeptId,
              isActive: true
            }
          });
          importedCount++;
        }
      } catch (err: any) {
        failedCount++;
        errors.push({
          row: rowIdx,
          item: `${code} - ${title}`,
          reason: err?.message || "Database insert error."
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: records.length,
      imported: importedCount,
      updated: updatedCount,
      failed: failedCount,
      errors
    });
  } catch (err: any) {
    console.error("Courses import error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

