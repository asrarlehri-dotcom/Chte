import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/exam-duty/generate
 * Auto-generate exam duties for a finalized datesheet scope.
 *
 * Rules:
 *  1. For each datesheet entry, the faculty assigned to that course in the
 *     FINALIZED timetable gets a MANDATORY duty on that exam date.
 *  2. Remaining invigilator slots are filled from eligible faculty
 *     (not already assigned on the same date).
 *  3. Conflicts are detected and returned as warnings.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["SUPER_ADMIN", "BS_CONTROLLER", "PRINCIPAL"].includes((session.user as any)?.role)
    )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { programId, session: sess, semester, examType, maxInvigilatorsPerPaper = 2 } =
      await req.json();

    // 1. Fetch all finalized datesheet entries in scope
    const datesheets = await prisma.datesheet.findMany({
      where: {
        isFinalized: true,
        ...(programId && programId !== "ALL" ? { programId } : {}),
        ...(sess && sess !== "ALL" ? { session: sess } : {}),
        ...(semester && semester !== 0 ? { semester: parseInt(semester) } : {}),
        ...(examType && examType !== "ALL" ? { examType } : {}),
      },
      include: {
        course: { include: { faculty: { include: { user: true } } } },
        program: true,
        duties: true,
      },
      orderBy: { date: "asc" },
    });

    if (datesheets.length === 0)
      return NextResponse.json({ error: "No finalized datesheet entries found for the given filters." }, { status: 404 });

    // 2. Fetch all active teaching faculty (exclude non-teaching ministerial/support staff)
    const allFaculty = await prisma.faculty.findMany({
      where: {
        isActive: true,
        OR: [{ educationLevel: null }, { educationLevel: { not: "NON_TEACHING" } }],
      },
      include: { user: true },
    });

    const created: any[] = [];
    const skipped: any[] = [];
    const warnings: string[] = [];

    // Track faculty assignments per date (to avoid double-booking)
    // Map: "facultyId|date" -> true
    const assignedOnDate: Map<string, boolean> = new Map();

    // Pre-populate from existing duties in the system (outside this run)
    const existingDuties = await prisma.examDuty.findMany({
      where: {
        datesheet: {
          ...(programId && programId !== "ALL" ? { programId } : {}),
          ...(sess && sess !== "ALL" ? { session: sess } : {}),
        },
      },
      include: { datesheet: true },
    });
    for (const d of existingDuties) {
      const dateKey = d.datesheet.date.toISOString().split("T")[0];
      assignedOnDate.set(`${d.facultyId}|${dateKey}`, true);
    }

    for (const ds of datesheets) {
      const dateKey = ds.date.toISOString().split("T")[0];
      const shiftTime = `${ds.startTime}-${ds.endTime}`;

      // STEP A: Mandatory duty — faculty who teaches this course
      const mandatoryFacultyId = ds.course?.facultyId;
      if (mandatoryFacultyId) {
        const alreadyAssigned = ds.duties.some((d) => d.facultyId === mandatoryFacultyId);
        if (!alreadyAssigned) {
          try {
            // Check cross-date conflict
            const dutyKey = `${mandatoryFacultyId}|${dateKey}`;
            const hasConflict = assignedOnDate.has(dutyKey);

            if (hasConflict) {
              warnings.push(
                `Mandatory duty conflict: ${ds.course?.faculty?.user?.name || mandatoryFacultyId} is already assigned on ${dateKey} for another paper. ` +
                `Forced mandatory duty created for "${ds.course?.title}".`
              );
            }

            await prisma.examDuty.upsert({
              where: { datesheetId_facultyId: { datesheetId: ds.id, facultyId: mandatoryFacultyId } },
              update: { dutyType: "MANDATORY", isMandatory: true, shiftTime, isOverride: hasConflict },
              create: {
                datesheetId: ds.id,
                facultyId: mandatoryFacultyId,
                dutyType: "MANDATORY",
                isMandatory: true,
                shiftTime,
                isOverride: hasConflict,
              },
            });

            assignedOnDate.set(`${mandatoryFacultyId}|${dateKey}`, true);
            created.push({ type: "MANDATORY", datesheetId: ds.id, facultyId: mandatoryFacultyId, dateKey });
          } catch (e: any) {
            skipped.push({ reason: e.message, datesheetId: ds.id, facultyId: mandatoryFacultyId });
          }
        }
      } else {
        warnings.push(`Course "${ds.course?.title}" has no assigned faculty. No mandatory duty created.`);
      }

      // STEP B: Fill invigilator slots (up to maxInvigilatorsPerPaper)
      const currentDutyCount = ds.duties.length + (mandatoryFacultyId ? 1 : 0);
      const slotsNeeded = Math.max(0, maxInvigilatorsPerPaper - currentDutyCount);

      let filled = 0;
      for (const fac of allFaculty) {
        if (filled >= slotsNeeded) break;
        if (fac.id === mandatoryFacultyId) continue; // Skip mandatory faculty
        if (ds.duties.some((d) => d.facultyId === fac.id)) continue; // Already assigned

        const dutyKey = `${fac.id}|${dateKey}`;
        if (assignedOnDate.has(dutyKey)) continue; // Busy on this date

        try {
          await prisma.examDuty.create({
            data: {
              datesheetId: ds.id,
              facultyId: fac.id,
              dutyType: "INVIGILATOR",
              isMandatory: false,
              shiftTime,
            },
          });
          assignedOnDate.set(dutyKey, true);
          created.push({ type: "INVIGILATOR", datesheetId: ds.id, facultyId: fac.id, dateKey });
          filled++;
        } catch {
          // Unique constraint violation — skip silently
        }
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      skipped: skipped.length,
      warnings,
      details: { created, skipped },
    });
  } catch (e: any) {
    console.error("Generate duties error:", e);
    return NextResponse.json({ error: e.message || "Failed to generate duties" }, { status: 500 });
  }
}
