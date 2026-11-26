"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { daysOverlap } from "@/lib/timetable-days";
import {
  COMBINED_CLASS_PREFIX,
  buildCombinedClassTag,
  normalizeSubjectKey,
  parseCombinedClassTag,
} from "@/lib/timetable-recommendations";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMETABLE_SLOTS = [
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" }
];

export async function getFilterData() {
  const programs = await prisma.program.findMany({ where: { isActive: true } });
  const departments = await prisma.department.findMany({ where: { isActive: true } });
  const faculties = await prisma.faculty.findMany({
    where: {
      isActive: true,
      OR: [{ educationLevel: null }, { educationLevel: { not: "NON_TEACHING" } }],
    },
    include: { user: true, department: true }
  });
  const supportStaff = await prisma.faculty.findMany({
    where: {
      isActive: true,
      educationLevel: "NON_TEACHING",
    },
    include: { user: true, department: true }
  });
  const studentGroups = await prisma.student.groupBy({
    by: ["programId", "currentSemester"],
    where: { educationLevel: "BS", isActive: true },
    _count: { id: true }
  });
  const studentCounts = studentGroups.map((g) => ({
    programId: g.programId,
    semester: g.currentSemester,
    count: g._count.id
  }));
  return { programs, departments, faculties, supportStaff, rooms: [], studentCounts };
}

export async function getTimetables(
  session?: string,
  programId?: string,
  semester?: number,
  departmentId?: string
) {
  const cleanSession = session && session !== "ALL" ? session : undefined;
  const cleanProgramId = programId && programId !== "ALL" ? programId : undefined;
  const cleanSemester = semester && semester !== 0 ? semester : undefined;
  const cleanDeptId = departmentId && departmentId !== "ALL" ? departmentId : undefined;

  return prisma.timetable.findMany({
    where: {
      isActive: true,
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
      ...(cleanDeptId ? { departmentId: cleanDeptId } : {}),
    },
    include: { course: true, faculty: { include: { user: true, department: true } }, program: true, department: true },
    orderBy: [{ session: 'desc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });
}

import { checkTimetableConflicts } from "@/lib/conflicts";

// Single program & semester timetable generation helper
export async function generateTimetable(session: string, programId: string, departmentId: string, semester: number, level: string = "BS") {
  const sess = session && session !== "ALL" ? session : "2024";
  const targetSemesters = semester && semester > 0 ? [semester] : [1, 2, 3, 4, 5, 6, 7, 8];

  let targetPrograms: any[] = [];
  if (programId && programId !== "ALL") {
    const p = await prisma.program.findUnique({ where: { id: programId } });
    if (p) targetPrograms = [p];
  } else {
    targetPrograms = await prisma.program.findMany({ where: { educationLevel: level, isActive: true } });
  }

  const progIds = targetPrograms.map(p => p.id);

  // 1. Delete existing DRAFT timetables for target programs and semesters
  await prisma.timetable.deleteMany({
    where: {
      programId: { in: progIds },
      semester: { in: targetSemesters },
      status: "DRAFT"
    }
  });

  // 2. Fetch all existing active timetables across the system to avoid faculty & semester conflicts
  const existingTimetables = await prisma.timetable.findMany({
    where: {
      isActive: true,
      NOT: {
        AND: [
          { programId: { in: progIds } },
          { semester: { in: targetSemesters } }
        ]
      }
    }
  });

  // Keep track of all occupied slots in memory during generation
  const busySlots: { facultyId: string; programId: string; semester: number; dayOfWeek: string; startTime: string; endTime: string }[] = existingTimetables.map(t => ({
    facultyId: t.facultyId || "",
    programId: t.programId || "",
    semester: t.semester || 1,
    dayOfWeek: t.dayOfWeek,
    startTime: t.startTime,
    endTime: t.endTime
  }));

  const checkOverlap = (st1: string, et1: string, st2: string, et2: string) => (st1 < et2 && et1 > st2);

  const facultyMembers = await prisma.faculty.findMany({
    where: {
      isActive: true,
      OR: [{ educationLevel: null }, { educationLevel: { not: "NON_TEACHING" } }],
    },
    include: { user: true }
  });

  let totalCount = 0;
  const errors: string[] = [];

  for (const prog of targetPrograms) {
    for (const sem of targetSemesters) {
      let courses = await prisma.course.findMany({
        where: { programId: prog.id, semester: sem, isActive: true },
        include: { faculty: { include: { user: true } }, department: true }
      });

      if (courses.length === 0) {
        const defaultCourseNames = [
          { title: `Core Course I (${prog.code || "BS"}-${sem}01)`, code: `${prog.code || "BS"}-${sem}01`, creditHours: 3 },
          { title: `Applied Theory II (${prog.code || "BS"}-${sem}02)`, code: `${prog.code || "BS"}-${sem}02`, creditHours: 3 },
          { title: `Lab & Practical (${prog.code || "BS"}-${sem}03)`, code: `${prog.code || "BS"}-${sem}03`, creditHours: 3 },
          { title: `Elective Subject (${prog.code || "BS"}-${sem}04)`, code: `${prog.code || "BS"}-${sem}04`, creditHours: 3 },
        ];

        for (let idx = 0; idx < defaultCourseNames.length; idx++) {
          const c = defaultCourseNames[idx];
          const assignedFac = facultyMembers.length > 0 ? facultyMembers[idx % facultyMembers.length] : null;
          await prisma.course.create({
            data: {
              title: c.title,
              code: c.code,
              creditHours: c.creditHours,
              semester: sem,
              session: sess,
              programId: prog.id,
              departmentId: departmentId && departmentId !== "ALL" ? departmentId : (prog.departmentId || null),
              facultyId: assignedFac ? assignedFac.id : null,
            }
          });
        }

        courses = await prisma.course.findMany({
          where: { programId: prog.id, semester: sem, isActive: true },
          include: { faculty: { include: { user: true } }, department: true }
        });
      }

      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        let assignedFacultyId = course.facultyId;
        if (!assignedFacultyId && facultyMembers.length > 0) {
          assignedFacultyId = facultyMembers[i % facultyMembers.length].id;
        }
        if (!assignedFacultyId) continue;

        // Search for a conflict-free slot for this faculty member & semester
        let chosenDay = DAYS[0];
        let chosenSlot = TIMETABLE_SLOTS[0];
        let slotFound = false;

        for (let dayIdx = 0; dayIdx < DAYS.length; dayIdx++) {
          const day = DAYS[(i + dayIdx) % DAYS.length];
          for (let slotIdx = 0; slotIdx < TIMETABLE_SLOTS.length; slotIdx++) {
            const slot = TIMETABLE_SLOTS[(i + slotIdx) % TIMETABLE_SLOTS.length];

            // Faculty non-overlap check
            const isFacultyBusy = busySlots.some(s =>
              s.facultyId === assignedFacultyId &&
              daysOverlap(s.dayOfWeek, day) &&
              checkOverlap(slot.start, slot.end, s.startTime, s.endTime)
            );

            // Semester non-overlap check
            const isSemesterBusy = busySlots.some(s =>
              s.programId === prog.id &&
              s.semester === sem &&
              daysOverlap(s.dayOfWeek, day) &&
              checkOverlap(slot.start, slot.end, s.startTime, s.endTime)
            );

            if (!isFacultyBusy && !isSemesterBusy) {
              chosenDay = day;
              chosenSlot = slot;
              slotFound = true;
              break;
            }
          }
          if (slotFound) break;
        }

        if (!slotFound) {
          const slotIdx = i % TIMETABLE_SLOTS.length;
          const dayIdx = Math.floor(i / TIMETABLE_SLOTS.length) % DAYS.length;
          chosenDay = DAYS[dayIdx];
          chosenSlot = TIMETABLE_SLOTS[slotIdx];
        }

        await prisma.timetable.create({
          data: {
            session: sess,
            programId: prog.id,
            departmentId: course.departmentId || (departmentId && departmentId !== "ALL" ? departmentId : null),
            semester: sem,
            courseId: course.id,
            facultyId: assignedFacultyId,
            dayOfWeek: chosenDay,
            startTime: chosenSlot.start,
            endTime: chosenSlot.end,
            educationLevel: level,
            generationMode: "AUTO",
            status: "DRAFT"
          }
        });

        busySlots.push({
          facultyId: assignedFacultyId,
          programId: prog.id,
          semester: sem,
          dayOfWeek: chosenDay,
          startTime: chosenSlot.start,
          endTime: chosenSlot.end
        });

        totalCount++;
      }
    }
  }

  revalidatePath("/bs/timetable-datesheet");
  revalidatePath("/intermediate/timetable-datesheet");
  return { success: true, count: totalCount, errors };
}

export async function saveManualTimetable(data: any) {
  const {
    id,
    session,
    programId,
    departmentId,
    semester,
    courseId,
    facultyId,
    dayOfWeek,
    startTime,
    endTime,
    allowCombinedSharedClass = false,
    allowOptionalParallel = false,
    combinedGroupId = null,
    applyToCombinedGroup = false,
    cohorts,
  } = data;

  try {
    const primaryCourse = courseId
      ? await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true, code: true, departmentId: true } })
      : null;

    // ─── MULTI-COHORT COMBINED / JOINT CLASS SAVE ───
    if (Array.isArray(cohorts) && cohorts.length > 0) {
      // Deduplicate cohorts cleanly by (programId, session, semester)
      const uniqueCohorts: Array<{ programId: string; session: string; semester: number; courseId: string; departmentId?: string | null }> = [];
      const seenKey = new Set<string>();

      for (const rawCohort of cohorts) {
        const cProgId = String(rawCohort.programId || "").trim();
        const cSess = String(rawCohort.session || session || "2024-2028").trim();
        const cSem = parseInt(String(rawCohort.semester || semester || "1"), 10) || 1;
        const cCourseId = String(rawCohort.courseId || courseId || "").trim();
        if (!cProgId || !cCourseId) continue;

        const key = `${cProgId}__${cSess}__${cSem}`;
        if (seenKey.has(key)) continue;
        seenKey.add(key);

        uniqueCohorts.push({
          programId: cProgId,
          session: cSess,
          semester: cSem,
          courseId: cCourseId,
          departmentId: rawCohort.departmentId || null,
        });
      }

      if (uniqueCohorts.length === 0) {
        return { success: false, error: "Please select at least one program/semester cohort for the combined class." };
      }

      const activeGroupId =
        combinedGroupId ||
        `grp-${crypto.randomUUID().slice(0, 8)}`;
      const combinedTag =
        uniqueCohorts.length > 1 || allowCombinedSharedClass
          ? buildCombinedClassTag(activeGroupId, Boolean(allowOptionalParallel))
          : allowOptionalParallel
            ? "OPTIONAL"
            : null;

      const existingGroupRows =
        applyToCombinedGroup && combinedGroupId
          ? await prisma.timetable.findMany({
              where: {
                isActive: true,
                classSectionId: { startsWith: `${COMBINED_CLASS_PREFIX}${combinedGroupId}` },
              },
            })
          : [];
      const excludeIds = Array.from(
        new Set([
          ...(id ? [id] : []),
          ...existingGroupRows.map((r) => r.id),
        ])
      );

      // Fetch course metadata for subject validation across cohorts
      const cohortCourses = await prisma.course.findMany({
        where: { id: { in: Array.from(new Set(uniqueCohorts.map((c) => c.courseId))) } },
        select: { id: true, title: true, code: true, departmentId: true },
      });
      const courseMap = new Map(cohortCourses.map((c) => [c.id, c]));

      const programsList = await prisma.program.findMany({
        where: { id: { in: uniqueCohorts.map((c) => c.programId) } },
        select: { id: true, departmentId: true, educationLevel: true },
      });
      const programMap = new Map(programsList.map((p) => [p.id, p]));

      // Validate all cohorts against unrelated teacher / cohort slots
      for (const cohort of uniqueCohorts) {
        const cMeta = courseMap.get(cohort.courseId) || primaryCourse;
        if (facultyId) {
          await checkTimetableConflicts({
            facultyId,
            semester: cohort.semester,
            programId: cohort.programId,
            session: cohort.session,
            dayOfWeek,
            startTime,
            endTime,
            excludeTimetableIds: excludeIds,
            allowCombinedSharedClass: true,
            combinedGroupId: activeGroupId,
            allowOptionalParallel: Boolean(allowOptionalParallel),
            courseTitle: cMeta?.title,
            courseCode: cMeta?.code,
          });
        }
      }

      const matchedRowIdsToKeep = new Set<string>();

      await prisma.$transaction(async (tx) => {
        for (const cohort of uniqueCohorts) {
          const progMeta = programMap.get(cohort.programId);
          const cMeta = courseMap.get(cohort.courseId);
          const resolvedDeptId =
            cohort.departmentId ||
            cMeta?.departmentId ||
            progMeta?.departmentId ||
            (departmentId && departmentId !== "ALL" ? departmentId : null);

          const existingMatch = existingGroupRows.find(
            (r) =>
              !matchedRowIdsToKeep.has(r.id) &&
              r.programId === cohort.programId &&
              r.semester === cohort.semester &&
              r.session === cohort.session
          );

          if (existingMatch) {
            matchedRowIdsToKeep.add(existingMatch.id);
            await tx.timetable.update({
              where: { id: existingMatch.id },
              data: {
                courseId: cohort.courseId,
                facultyId: facultyId || null,
                dayOfWeek,
                startTime,
                endTime,
                departmentId: resolvedDeptId,
                classSectionId: combinedTag,
                educationLevel: progMeta?.educationLevel || "BS",
              },
            });
          } else {
            await tx.timetable.create({
              data: {
                session: cohort.session,
                programId: cohort.programId,
                departmentId: resolvedDeptId,
                semester: cohort.semester,
                courseId: cohort.courseId,
                facultyId: facultyId || null,
                dayOfWeek,
                startTime,
                endTime,
                classSectionId: combinedTag,
                educationLevel: progMeta?.educationLevel || "BS",
                generationMode: "MANUAL",
                status: "DRAFT",
              },
            });
          }
        }

        // Deactivate any cohorts removed from an edited combined group
        if (existingGroupRows.length > 0) {
          const removedIds = existingGroupRows
            .filter((r) => !matchedRowIdsToKeep.has(r.id))
            .map((r) => r.id);
          if (removedIds.length > 0) {
            await tx.timetable.updateMany({
              where: { id: { in: removedIds } },
              data: { isActive: false },
            });
          }
        }
      });

      revalidatePath("/bs/timetable-datesheet");
      revalidatePath("/intermediate/timetable-datesheet");
      return {
        success: true,
        count: uniqueCohorts.length,
        combinedGroupId: activeGroupId,
      };
    }

    // ─── SINGLE COHORT SAVE / EDIT ───
    const cleanProgId =
      programId && programId !== "ALL"
        ? programId
        : (await prisma.program.findFirst({ where: { isActive: true } }))?.id;
    if (!cleanProgId) return { success: false, error: "No active program found." };

    const cleanSession = session || "2024-2028";
    const cleanSem = parseInt(semester) || 1;
    const progObj = await prisma.program.findUnique({
      where: { id: cleanProgId },
      select: { departmentId: true, educationLevel: true },
    });

    // If explicitly marked combined in Single Mode, inherit existing matching combined groupId on this teacher/time/subject if present
    let effectiveGroupId: string | null = combinedGroupId || null;
    if (allowCombinedSharedClass && facultyId && !effectiveGroupId) {
      const siblingCandidates = await prisma.timetable.findMany({
        where: {
          facultyId,
          isActive: true,
          ...(id ? { id: { not: id } } : {}),
        },
        include: { course: true },
      });
      const incomingSubKey = normalizeSubjectKey(primaryCourse?.title, primaryCourse?.code);
      const matchingSibling = siblingCandidates.find(
        (t) =>
          daysOverlap(dayOfWeek, t.dayOfWeek) &&
          startTime < t.endTime &&
          endTime > t.startTime &&
          incomingSubKey &&
          normalizeSubjectKey(t.course?.title, t.course?.code) === incomingSubKey
      );
      if (matchingSibling) {
        const siblingMeta = parseCombinedClassTag(matchingSibling.classSectionId);
        effectiveGroupId = siblingMeta.groupId || `grp-${crypto.randomUUID().slice(0, 8)}`;
        if (!siblingMeta.groupId) {
          await prisma.timetable.update({
            where: { id: matchingSibling.id },
            data: {
              classSectionId: buildCombinedClassTag(effectiveGroupId, siblingMeta.isOptionalParallel),
            },
          });
        }
      } else {
        effectiveGroupId = `grp-${crypto.randomUUID().slice(0, 8)}`;
      }
    }

    if (facultyId) {
      await checkTimetableConflicts({
        facultyId,
        semester: cleanSem,
        programId: cleanProgId,
        session: cleanSession,
        dayOfWeek,
        startTime,
        endTime,
        excludeTimetableId: id || undefined,
        allowCombinedSharedClass: Boolean(allowCombinedSharedClass),
        combinedGroupId: effectiveGroupId,
        allowOptionalParallel: Boolean(allowOptionalParallel),
        courseTitle: primaryCourse?.title,
        courseCode: primaryCourse?.code,
      });
    }

    const singleTag =
      allowCombinedSharedClass && effectiveGroupId
        ? buildCombinedClassTag(effectiveGroupId, Boolean(allowOptionalParallel))
        : allowOptionalParallel
          ? "OPTIONAL"
          : null;

    if (id) {
      await prisma.timetable.update({
        where: { id },
        data: {
          session: cleanSession,
          programId: cleanProgId,
          departmentId:
            departmentId && departmentId !== "ALL"
              ? departmentId
              : progObj?.departmentId || primaryCourse?.departmentId || null,
          semester: cleanSem,
          courseId,
          facultyId,
          dayOfWeek,
          startTime,
          endTime,
          classSectionId: singleTag,
          educationLevel: progObj?.educationLevel || "BS",
        },
      });
    } else {
      await prisma.timetable.create({
        data: {
          session: cleanSession,
          programId: cleanProgId,
          departmentId:
            departmentId && departmentId !== "ALL"
              ? departmentId
              : progObj?.departmentId || primaryCourse?.departmentId || null,
          semester: cleanSem,
          courseId,
          facultyId,
          dayOfWeek,
          startTime,
          endTime,
          classSectionId: singleTag,
          educationLevel: progObj?.educationLevel || "BS",
          generationMode: "MANUAL",
          status: "DRAFT",
        },
      });
    }

    revalidatePath("/bs/timetable-datesheet");
    revalidatePath("/intermediate/timetable-datesheet");
    return { success: true, count: 1 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function publishTimetable(session: string, programId: string, semester: number) {
  const cleanSession = session && session !== "ALL" ? session : undefined;
  const cleanProgramId = programId && programId !== "ALL" ? programId : undefined;
  const cleanSemester = semester && semester !== 0 ? semester : undefined;

  await prisma.timetable.updateMany({
    where: {
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
      status: "DRAFT"
    },
    data: { status: "PUBLISHED" }
  });
  revalidatePath("/bs/timetable-datesheet");
  revalidatePath("/intermediate/timetable-datesheet");
}

export async function deleteTimetableEntry(id: string) {
  await prisma.timetable.delete({ where: { id } });
  revalidatePath("/bs/timetable-datesheet");
  revalidatePath("/intermediate/timetable-datesheet");
}

// ---------------- DATESHEET ----------------

export async function getDatesheets(
  session?: string,
  programId?: string,
  semester?: number,
  examType?: string,
  departmentId?: string
) {
  const cleanSession = session && session !== "ALL" ? session : undefined;
  const cleanProgramId = programId && programId !== "ALL" ? programId : undefined;
  const cleanSemester = semester && semester !== 0 ? semester : undefined;
  const cleanExamType = examType && examType !== "ALL" ? examType : undefined;
  const cleanDeptId = departmentId && departmentId !== "ALL" ? departmentId : undefined;

  return prisma.datesheet.findMany({
    where: {
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
      ...(cleanExamType ? { examType: cleanExamType } : {}),
      ...(cleanDeptId ? { departmentId: cleanDeptId } : {}),
    },
    include: { course: { include: { faculty: { include: { user: true } } } }, program: true },
    orderBy: [{ session: 'desc' }, { date: 'asc' }, { startTime: 'asc' }]
  });
}

function isDateExcluded(d: Date, excludedStrList: string[]) {
  // Sunday is always excluded by default (0)
  if (d.getDay() === 0) return true;
  const isoStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
  return excludedStrList.some(ex => ex.trim() === isoStr);
}

export async function generateDatesheet(
  session: string,
  programId: string,
  departmentId: string,
  semester: number,
  examType: string,
  examSession: string,
  level: string = "BS",
  excludedDatesStr: string = "",
  startDateStr: string = ""
) {
  const sess = session && session !== "ALL" ? session : "2024";
  const eType = examType && examType !== "ALL" ? examType : "TERMINAL";
  const targetSemesters = semester && semester > 0 ? [semester] : [1, 2, 3, 4, 5, 6, 7, 8];
  const excludedDatesList = excludedDatesStr.split(",").map(s => s.trim()).filter(Boolean);

  let targetPrograms: any[] = [];
  if (programId && programId !== "ALL") {
    const p = await prisma.program.findUnique({ where: { id: programId } });
    if (p) targetPrograms = [p];
  } else {
    targetPrograms = await prisma.program.findMany({ where: { educationLevel: level, isActive: true } });
  }

  const progIds = targetPrograms.map(p => p.id);

  // 1. Delete existing DRAFT datesheets for target programs, semesters, examType
  await prisma.datesheet.deleteMany({
    where: {
      programId: { in: progIds },
      semester: { in: targetSemesters },
      examType: eType,
      status: "DRAFT"
    }
  });

  // 2. Fetch courses ONLY from FINALIZED timetable entries (enforced source of truth)
  const finalizedTimetables = await prisma.timetable.findMany({
    where: {
      programId: { in: progIds },
      ...(targetSemesters.length > 0 ? { semester: { in: targetSemesters } } : {}),
      status: "PUBLISHED",
      isFinalized: true,
    },
    include: { course: true }
  });

  if (finalizedTimetables.length === 0) {
    return {
      success: false,
      count: 0,
      errors: [
        `No FINALIZED timetable entries found for the selected program/semester. ` +
        `Please publish and FINALIZE the timetable before generating the date sheet.`
      ]
    };
  }

  const finalizedCourseIds = finalizedTimetables.map(t => t.courseId).filter(Boolean) as string[];

  const allTargetCourses = await prisma.course.findMany({
    where: {
      id: { in: finalizedCourseIds },
      isActive: true,
    },
    include: { faculty: { include: { user: true } }, program: true }
  });

  // 3. Group courses by normalized Course Code / Title AND Faculty
  // Same course / same teacher across multiple programs get grouped together!
  const groups: Map<string, typeof allTargetCourses> = new Map();

  for (const course of allTargetCourses) {
    const normTitle = (course.code || course.title).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const teacherId = course.facultyId || "no_fac";
    // Group key combines normalized title/code and assigned teacher
    const key = `${normTitle}_${teacherId}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(course);
  }

  // 4. Assign synchronized exam dates and shift times for each course group
  let currentDate = startDateStr ? new Date(startDateStr) : new Date();
  if (!startDateStr) {
    currentDate.setDate(currentDate.getDate() + 7);
  }

  let groupIndex = 0;
  let totalCount = 0;

  for (const [key, groupCourses] of Array.from(groups.entries())) {
    // Skip Sunday and any excluded dates
    while (isDateExcluded(currentDate, excludedDatesList)) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const examDate = new Date(currentDate);
    const startTime = groupIndex % 2 === 0 ? "09:00" : "13:00";
    const endTime = groupIndex % 2 === 0 ? "12:00" : "16:00";

    // Schedule ALL courses in this group on the EXACT SAME EXAM DATE & SHIFT!
    for (const course of groupCourses) {
      const matchingTt = finalizedTimetables.find(t => t.courseId === course.id);
      await prisma.datesheet.create({
        data: {
          session: course.session || sess,
          programId: course.programId,
          departmentId: course.departmentId || departmentId || null,
          semester: course.semester,
          examType: eType,
          examSession: examSession || sess,
          courseId: course.id,
          timetableId: matchingTt?.id || null,
          date: examDate,
          startTime,
          endTime,
          generationMode: "AUTO",
          status: "DRAFT"
        }
      });
      totalCount++;
    }

    groupIndex++;
    // Advance 2 days for next paper group and skip Sundays/excluded dates
    currentDate.setDate(currentDate.getDate() + 2);
    while (isDateExcluded(currentDate, excludedDatesList)) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  revalidatePath("/bs/timetable-datesheet");
  revalidatePath("/intermediate/timetable-datesheet");
  return { success: true, count: totalCount, errors: [] };
}

export async function saveManualDatesheet(data: any) {
  const { id, session, programId, departmentId, semester, examType, courseId, date, startTime, endTime } = data;
  try {
    const cleanProgId = programId && programId !== "ALL" ? programId : (await prisma.program.findFirst({ where: { isActive: true } }))?.id;
    if (!cleanProgId) return { success: false, error: "No active program found." };

    if (id) {
      await prisma.datesheet.update({
        where: { id },
        data: {
          session: session || "2024",
          programId: cleanProgId,
          departmentId: departmentId && departmentId !== "ALL" ? departmentId : null,
          semester: parseInt(semester) || 1,
          examType: examType && examType !== "ALL" ? examType : "TERMINAL",
          courseId,
          date: new Date(date),
          startTime,
          endTime
        }
      });
    } else {
      await prisma.datesheet.create({
        data: {
          session: session || "2024",
          programId: cleanProgId,
          departmentId: departmentId && departmentId !== "ALL" ? departmentId : null,
          semester: parseInt(semester) || 1,
          examType: examType && examType !== "ALL" ? examType : "TERMINAL",
          courseId,
          date: new Date(date),
          startTime,
          endTime,
          generationMode: "MANUAL",
          status: "DRAFT"
        }
      });
    }
    revalidatePath("/bs/timetable-datesheet");
    revalidatePath("/intermediate/timetable-datesheet");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function publishDatesheet(session: string, programId: string, semester: number, examType: string) {
  const cleanSession = session && session !== "ALL" ? session : undefined;
  const cleanProgramId = programId && programId !== "ALL" ? programId : undefined;
  const cleanSemester = semester && semester !== 0 ? semester : undefined;
  const cleanExamType = examType && examType !== "ALL" ? examType : undefined;

  await prisma.datesheet.updateMany({
    where: {
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
      ...(cleanExamType ? { examType: cleanExamType } : {}),
      status: "DRAFT"
    },
    data: { status: "PUBLISHED" }
  });
  revalidatePath("/bs/timetable-datesheet");
  revalidatePath("/intermediate/timetable-datesheet");
}

export async function deleteDatesheetEntry(id: string) {
  const entry = await prisma.datesheet.findUnique({ where: { id } });
  if (entry?.isFinalized) {
    throw new Error("Cannot delete a finalized datesheet entry.");
  }
  await prisma.datesheet.delete({ where: { id } });
  revalidatePath("/bs/timetable-datesheet");
  revalidatePath("/intermediate/timetable-datesheet");
}

// ─────────────────────────────────────────────────────────────────────────────
// FINALIZATION ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function finalizeTimetable(session: string, programId: string, semester: number) {
  const cleanSession = session && session !== "ALL" ? session : undefined;
  const cleanProgramId = programId && programId !== "ALL" ? programId : undefined;
  const cleanSemester = semester && semester !== 0 ? semester : undefined;

  // Validate all entries have faculty
  const entries = await prisma.timetable.findMany({
    where: {
      status: "PUBLISHED",
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
    }
  });

  const missing = entries.filter(e => !e.facultyId);
  if (missing.length > 0) {
    return { success: false, error: `${missing.length} entries have no faculty assigned. Assign faculty to all entries before finalizing.` };
  }

  if (entries.length === 0) {
    return { success: false, error: "No PUBLISHED timetable entries found. Publish the timetable first." };
  }

  await prisma.timetable.updateMany({
    where: {
      status: "PUBLISHED",
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
    },
    data: { isFinalized: true }
  });

  revalidatePath("/bs/timetable-datesheet");
  return { success: true, count: entries.length };
}

export async function unfinalizeTimetable(session: string, programId: string, semester: number) {
  const cleanSession = session && session !== "ALL" ? session : undefined;
  const cleanProgramId = programId && programId !== "ALL" ? programId : undefined;
  const cleanSemester = semester && semester !== 0 ? semester : undefined;

  // Prevent if finalized datesheets exist
  const depDatesheets = await prisma.datesheet.findMany({
    where: {
      isFinalized: true,
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
    }
  });
  if (depDatesheets.length > 0) {
    return { success: false, error: `Cannot un-finalize: ${depDatesheets.length} finalized datesheets depend on this timetable. Un-finalize the datesheet first.` };
  }

  await prisma.timetable.updateMany({
    where: {
      isFinalized: true,
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
    },
    data: { isFinalized: false }
  });

  revalidatePath("/bs/timetable-datesheet");
  return { success: true };
}

export async function finalizeDatesheet(
  session: string,
  programId: string,
  semester: number,
  examType: string
) {
  const cleanSession = session && session !== "ALL" ? session : undefined;
  const cleanProgramId = programId && programId !== "ALL" ? programId : undefined;
  const cleanSemester = semester && semester !== 0 ? semester : undefined;
  const cleanExamType = examType && examType !== "ALL" ? examType : undefined;

  const entries = await prisma.datesheet.findMany({
    where: {
      status: "PUBLISHED",
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
      ...(cleanExamType ? { examType: cleanExamType } : {}),
    }
  });

  if (entries.length === 0) {
    return { success: false, error: "No PUBLISHED datesheet entries found. Publish the datesheet first." };
  }

  await prisma.datesheet.updateMany({
    where: {
      status: "PUBLISHED",
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
      ...(cleanExamType ? { examType: cleanExamType } : {}),
    },
    data: { isFinalized: true }
  });

  revalidatePath("/bs/timetable-datesheet");
  return { success: true, count: entries.length };
}

export async function unfinalizeDatesheet(
  session: string,
  programId: string,
  semester: number,
  examType: string
) {
  const cleanSession = session && session !== "ALL" ? session : undefined;
  const cleanProgramId = programId && programId !== "ALL" ? programId : undefined;
  const cleanSemester = semester && semester !== 0 ? semester : undefined;
  const cleanExamType = examType && examType !== "ALL" ? examType : undefined;

  // Prevent if duties exist
  const datesheets = await prisma.datesheet.findMany({
    where: {
      isFinalized: true,
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
      ...(cleanExamType ? { examType: cleanExamType } : {}),
    },
    select: { id: true }
  });
  const dsIds = datesheets.map(d => d.id);
  const existingDuties = await prisma.examDuty.count({ where: { datesheetId: { in: dsIds } } });
  if (existingDuties > 0) {
    return { success: false, error: `Cannot un-finalize: ${existingDuties} duty assignments exist. Remove duties first.` };
  }

  await prisma.datesheet.updateMany({
    where: {
      isFinalized: true,
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
      ...(cleanExamType ? { examType: cleanExamType } : {}),
    },
    data: { isFinalized: false }
  });

  revalidatePath("/bs/timetable-datesheet");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAM DUTY ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

function normalizeMultiStringFilter(val?: string | string[]): string[] | undefined {
  if (!val) return undefined;
  const list = Array.isArray(val) ? val : [val];
  const cleaned = list.map((x) => (x || "").trim()).filter((x) => x && x !== "ALL");
  return cleaned.length > 0 ? cleaned : undefined;
}

function normalizeMultiNumberFilter(val?: number | number[]): number[] | undefined {
  if (val === undefined || val === null) return undefined;
  const list = Array.isArray(val) ? val : [val];
  const cleaned = list.map((n) => Number(n)).filter((n) => !Number.isNaN(n) && n > 0);
  return cleaned.length > 0 ? cleaned : undefined;
}

export async function getDuties(
  session?: string | string[],
  programId?: string | string[],
  semester?: number | number[],
  examType?: string
) {
  const cleanSessions = normalizeMultiStringFilter(session);
  const cleanProgramIds = normalizeMultiStringFilter(programId);
  const cleanSemesters = normalizeMultiNumberFilter(semester);
  const cleanExamType = examType && examType !== "ALL" ? examType : undefined;

  const datesheets = await prisma.datesheet.findMany({
    where: {
      isActive: true,
      ...(cleanSessions ? { session: { in: cleanSessions } } : {}),
      ...(cleanProgramIds ? { programId: { in: cleanProgramIds } } : {}),
      ...(cleanSemesters ? { semester: { in: cleanSemesters } } : {}),
      ...(cleanExamType ? { examType: cleanExamType } : {}),
    },
    select: { id: true }
  });
  const dsIds = datesheets.map(d => d.id);
  if (dsIds.length === 0) return [];

  return prisma.examDuty.findMany({
    where: { datesheetId: { in: dsIds }, isActive: true },
    include: {
      faculty: { include: { user: true, department: true } },
      datesheet: { include: { course: true, program: true } }
    },
    orderBy: [{ datesheet: { date: "asc" } }, { isMandatory: "desc" }]
  });
}

export async function generateDutiesAction(
  programId: string | string[],
  session: string | string[],
  semester: number | number[],
  examType: string,
  maxInvigilatorsPerPaper: number = 2,
  defaultHall?: string,
  excludeFacultyIds: string[] = []
) {
  const cleanSessions = normalizeMultiStringFilter(session);
  const cleanProgramIds = normalizeMultiStringFilter(programId);
  const cleanSemesters = normalizeMultiNumberFilter(semester);
  const cleanExamType = examType && examType !== "ALL" ? examType : undefined;

  const datesheets = await prisma.datesheet.findMany({
    where: {
      isActive: true,
      isFinalized: true,
      ...(cleanSessions ? { session: { in: cleanSessions } } : {}),
      ...(cleanProgramIds ? { programId: { in: cleanProgramIds } } : {}),
      ...(cleanSemesters ? { semester: { in: cleanSemesters } } : {}),
      ...(cleanExamType ? { examType: cleanExamType } : {}),
    },
    include: {
      course: { include: { faculty: { include: { user: true } } } },
      duties: { where: { isActive: true } },
    },
    orderBy: { date: "asc" },
  });

  if (datesheets.length === 0) {
    return { success: false, error: "No finalized datesheet entries found for the selected Exam / Session / Semester / Program(s). Finalize the Date Sheet first." };
  }

  const excludedFacSet = new Set((excludeFacultyIds || []).filter(Boolean));
  const allFaculty = await prisma.faculty.findMany({
    where: {
      isActive: true,
      OR: [{ educationLevel: null }, { educationLevel: { not: "NON_TEACHING" } }],
    },
    include: { user: true },
  });

  const created: Array<{ type: string; course?: string; date: string; faculty?: string | null }> = [];
  const warnings: string[] = [];
  const assignedOnDate = new Map<string, boolean>();

  // Pre-load existing assignments
  const existingAllDuties = await prisma.examDuty.findMany({
    where: { isActive: true },
    include: { datesheet: true }
  });
  for (const d of existingAllDuties) {
    const dk = d.datesheet.date.toISOString().split("T")[0];
    const shift = d.shiftTime || `${d.datesheet.startTime}-${d.datesheet.endTime}`;
    assignedOnDate.set(`${d.facultyId}|${dk}|${shift}`, true);
  }

  for (const ds of datesheets) {
    const dateKey = ds.date.toISOString().split("T")[0];
    const shiftTime = `${ds.startTime}-${ds.endTime}`;
    const mandatoryFacultyId = ds.course?.facultyId;
    const roomVal = (defaultHall || "").trim() || null;

    // Step A: Mandatory duty (course instructor)
    if (mandatoryFacultyId) {
      const alreadyAssigned = ds.duties.some(d => d.facultyId === mandatoryFacultyId);
      if (!alreadyAssigned) {
        const hasConflict = assignedOnDate.has(`${mandatoryFacultyId}|${dateKey}|${shiftTime}`);
        if (hasConflict) {
          warnings.push(`Mandatory conflict: ${ds.course?.faculty?.user?.name || mandatoryFacultyId} already assigned on ${dateKey} (${shiftTime}). Forced for "${ds.course?.title}".`);
        }
        try {
          await prisma.examDuty.upsert({
            where: { datesheetId_facultyId: { datesheetId: ds.id, facultyId: mandatoryFacultyId } },
            update: { dutyType: "MANDATORY", isMandatory: true, shiftTime, room: roomVal, isOverride: hasConflict, isActive: true },
            create: { datesheetId: ds.id, facultyId: mandatoryFacultyId, dutyType: "MANDATORY", isMandatory: true, shiftTime, room: roomVal, isOverride: hasConflict },
          });
          assignedOnDate.set(`${mandatoryFacultyId}|${dateKey}|${shiftTime}`, true);
          created.push({ type: "MANDATORY", course: ds.course?.title, date: dateKey });
        } catch { /* skip */ }
      }
    } else {
      warnings.push(`No faculty assigned to course "${ds.course?.title}" — no mandatory duty created.`);
    }

    // Step B: Fill remaining invigilator slots (skipping Superintendent / Inspection Team unless no one else)
    const currentCount = ds.duties.length + (mandatoryFacultyId && !ds.duties.some(d => d.facultyId === mandatoryFacultyId) ? 1 : 0);
    const slotsNeeded = Math.max(0, maxInvigilatorsPerPaper - currentCount);
    let filled = 0;

    for (const fac of allFaculty) {
      if (filled >= slotsNeeded) break;
      if (fac.id === mandatoryFacultyId) continue;
      if (excludedFacSet.has(fac.id)) continue;
      if (ds.duties.some(d => d.facultyId === fac.id)) continue;
      if (assignedOnDate.has(`${fac.id}|${dateKey}|${shiftTime}`)) continue;

      try {
        await prisma.examDuty.upsert({
          where: { datesheetId_facultyId: { datesheetId: ds.id, facultyId: fac.id } },
          update: { dutyType: "INVIGILATOR", isMandatory: false, shiftTime, room: roomVal, isActive: true },
          create: { datesheetId: ds.id, facultyId: fac.id, dutyType: "INVIGILATOR", isMandatory: false, shiftTime, room: roomVal },
        });
        assignedOnDate.set(`${fac.id}|${dateKey}|${shiftTime}`, true);
        created.push({ type: "INVIGILATOR", course: ds.course?.title, date: dateKey, faculty: fac.user?.name });
        filled++;
      } catch { /* unique constraint */ }
    }
  }

  revalidatePath("/bs/timetable-datesheet");
  return { success: true, created: created.length, warnings };
}

export async function saveManualDuty(data: {
  id?: string;
  datesheetId: string;
  facultyId: string;
  dutyType?: string;
  room?: string;
  shiftTime?: string;
  notes?: string;
  isOverride?: boolean;
}) {
  const { id, datesheetId, facultyId, dutyType, room, shiftTime, notes, isOverride } = data;
  try {
    if (!datesheetId || !facultyId) return { success: false, error: "Exam Paper and Faculty member are required." };

    const targetDs = await prisma.datesheet.findUnique({ where: { id: datesheetId } });
    if (!targetDs) return { success: false, error: "Selected datesheet paper not found." };

    const resolvedShift = shiftTime || `${targetDs.startTime}-${targetDs.endTime}`;
    const targetDateStr = targetDs.date.toISOString().split("T")[0];

    // Check faculty duty conflict on same exam date & overlapping shift unless override is approved
    if (!isOverride) {
      const sameFacDuties = await prisma.examDuty.findMany({
        where: {
          facultyId,
          isActive: true,
          ...(id ? { id: { not: id } } : {}),
          datesheetId: { not: datesheetId },
        },
        include: { datesheet: { include: { course: true } }, faculty: { include: { user: true } } },
      });

      const conflictDuty = sameFacDuties.find((d) => {
        const dStr = d.datesheet.date.toISOString().split("T")[0];
        if (dStr !== targetDateStr) return false;
        const existShift = d.shiftTime || `${d.datesheet.startTime}-${d.datesheet.endTime}`;
        return existShift === resolvedShift;
      });

      if (conflictDuty) {
        return {
          success: false,
          hasConflict: true,
          error: `${conflictDuty.faculty?.user?.name || "This faculty"} already has a duty for "${conflictDuty.datesheet?.course?.title || "another paper"}" on ${targetDateStr} (${resolvedShift}). Enable "Override Conflict" to force assign.`,
        };
      }
    }

    const isMandatoryRole = dutyType === "MANDATORY";

    if (id) {
      await prisma.examDuty.update({
        where: { id },
        data: {
          datesheetId,
          facultyId,
          dutyType: dutyType || "INVIGILATOR",
          isMandatory: isMandatoryRole,
          room,
          shiftTime: resolvedShift,
          notes,
          isOverride: Boolean(isOverride),
          isActive: true,
        }
      });
    } else {
      await prisma.examDuty.upsert({
        where: { datesheetId_facultyId: { datesheetId, facultyId } },
        update: {
          dutyType: dutyType || "INVIGILATOR",
          isMandatory: isMandatoryRole,
          room,
          shiftTime: resolvedShift,
          notes,
          isOverride: Boolean(isOverride),
          isActive: true,
        },
        create: {
          datesheetId,
          facultyId,
          dutyType: dutyType || "INVIGILATOR",
          isMandatory: isMandatoryRole,
          room,
          shiftTime: resolvedShift,
          notes,
          isOverride: Boolean(isOverride),
        },
      });
    }
    revalidatePath("/bs/timetable-datesheet");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save duty." };
  }
}

export async function deleteDutyEntry(id: string) {
  await prisma.examDuty.delete({ where: { id } });
  revalidatePath("/bs/timetable-datesheet");
}
