"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  const faculties = await prisma.faculty.findMany({ where: { isActive: true }, include: { user: true } });
  return { programs, departments, faculties, rooms: [] };
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
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
      ...(cleanDeptId ? { departmentId: cleanDeptId } : {}),
    },
    include: { course: true, faculty: { include: { user: true } }, program: true, department: true },
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
    where: { isActive: true },
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
              s.dayOfWeek === day &&
              checkOverlap(slot.start, slot.end, s.startTime, s.endTime)
            );

            // Semester non-overlap check
            const isSemesterBusy = busySlots.some(s =>
              s.programId === prog.id &&
              s.semester === sem &&
              s.dayOfWeek === day &&
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
  const { id, session, programId, departmentId, semester, courseId, facultyId, dayOfWeek, startTime, endTime } = data;
  try {
    const cleanProgId = programId && programId !== "ALL" ? programId : (await prisma.program.findFirst({ where: { isActive: true } }))?.id;
    if (!cleanProgId) return { success: false, error: "No active program found." };

    if (facultyId) {
      await checkTimetableConflicts({
        facultyId,
        semester: parseInt(semester) || 1,
        programId: cleanProgId,
        dayOfWeek,
        startTime,
        endTime,
        excludeTimetableId: id || undefined
      });
    }

    if (id) {
      await prisma.timetable.update({
        where: { id },
        data: { session: session || "2024", programId: cleanProgId, departmentId: departmentId && departmentId !== "ALL" ? departmentId : null, semester: parseInt(semester) || 1, courseId, facultyId, dayOfWeek, startTime, endTime }
      });
    } else {
      await prisma.timetable.create({
        data: {
          session: session || "2024",
          programId: cleanProgId,
          departmentId: departmentId && departmentId !== "ALL" ? departmentId : null,
          semester: parseInt(semester) || 1,
          courseId,
          facultyId,
          dayOfWeek,
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

export async function getDuties(
  session?: string,
  programId?: string,
  semester?: number,
  examType?: string
) {
  const cleanSession = session && session !== "ALL" ? session : undefined;
  const cleanProgramId = programId && programId !== "ALL" ? programId : undefined;
  const cleanSemester = semester && semester !== 0 ? semester : undefined;
  const cleanExamType = examType && examType !== "ALL" ? examType : undefined;

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

  return prisma.examDuty.findMany({
    where: { datesheetId: { in: dsIds } },
    include: {
      faculty: { include: { user: true } },
      datesheet: { include: { course: true, program: true } }
    },
    orderBy: [{ datesheet: { date: "asc" } }, { isMandatory: "desc" }]
  });
}

export async function generateDutiesAction(
  programId: string,
  session: string,
  semester: number,
  examType: string,
  maxInvigilatorsPerPaper: number = 2
) {
  const cleanSession = session && session !== "ALL" ? session : undefined;
  const cleanProgramId = programId && programId !== "ALL" ? programId : undefined;
  const cleanSemester = semester && semester !== 0 ? semester : undefined;
  const cleanExamType = examType && examType !== "ALL" ? examType : undefined;

  const datesheets = await prisma.datesheet.findMany({
    where: {
      isFinalized: true,
      ...(cleanSession ? { session: cleanSession } : {}),
      ...(cleanProgramId ? { programId: cleanProgramId } : {}),
      ...(cleanSemester ? { semester: cleanSemester } : {}),
      ...(cleanExamType ? { examType: cleanExamType } : {}),
    },
    include: {
      course: { include: { faculty: { include: { user: true } } } },
      duties: true,
    },
    orderBy: { date: "asc" },
  });

  if (datesheets.length === 0) {
    return { success: false, error: "No finalized datesheet entries found. Finalize the datesheet first." };
  }

  const allFaculty = await prisma.faculty.findMany({
    where: { isActive: true },
    include: { user: true },
  });

  const created: any[] = [];
  const warnings: string[] = [];
  const assignedOnDate = new Map<string, boolean>();

  // Pre-load existing assignments
  const existingAllDuties = await prisma.examDuty.findMany({
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

    // Step A: Mandatory duty
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
            update: { dutyType: "MANDATORY", isMandatory: true, shiftTime, isOverride: hasConflict },
            create: { datesheetId: ds.id, facultyId: mandatoryFacultyId, dutyType: "MANDATORY", isMandatory: true, shiftTime, isOverride: hasConflict },
          });
          assignedOnDate.set(`${mandatoryFacultyId}|${dateKey}|${shiftTime}`, true);
          created.push({ type: "MANDATORY", course: ds.course?.title, date: dateKey });
        } catch { /* skip */ }
      }
    } else {
      warnings.push(`No faculty assigned to course "${ds.course?.title}" — no mandatory duty created.`);
    }

    // Step B: Fill invigilator slots
    const currentCount = ds.duties.length + (mandatoryFacultyId ? 1 : 0);
    const slotsNeeded = Math.max(0, maxInvigilatorsPerPaper - currentCount);
    let filled = 0;

    for (const fac of allFaculty) {
      if (filled >= slotsNeeded) break;
      if (fac.id === mandatoryFacultyId) continue;
      if (ds.duties.some(d => d.facultyId === fac.id)) continue;
      if (assignedOnDate.has(`${fac.id}|${dateKey}|${shiftTime}`)) continue;

      try {
        await prisma.examDuty.create({
          data: { datesheetId: ds.id, facultyId: fac.id, dutyType: "INVIGILATOR", isMandatory: false, shiftTime },
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

export async function saveManualDuty(data: any) {
  const { id, datesheetId, facultyId, dutyType, room, shiftTime, notes, isOverride } = data;
  try {
    if (!datesheetId || !facultyId) return { success: false, error: "datesheetId and facultyId required" };

    if (id) {
      await prisma.examDuty.update({
        where: { id },
        data: { facultyId, dutyType: dutyType || "INVIGILATOR", room, shiftTime, notes, isOverride: Boolean(isOverride) }
      });
    } else {
      await prisma.examDuty.upsert({
        where: { datesheetId_facultyId: { datesheetId, facultyId } },
        update: { dutyType: dutyType || "INVIGILATOR", room, shiftTime, notes, isOverride: Boolean(isOverride) },
        create: { datesheetId, facultyId, dutyType: dutyType || "INVIGILATOR", room, shiftTime, notes, isOverride: Boolean(isOverride) },
      });
    }
    revalidatePath("/bs/timetable-datesheet");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteDutyEntry(id: string) {
  await prisma.examDuty.delete({ where: { id } });
  revalidatePath("/bs/timetable-datesheet");
}
