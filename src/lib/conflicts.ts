import { prisma } from "./prisma";
import { daysOverlap } from "./timetable-days";
import { normalizeSubjectKey, parseCombinedClassTag } from "./timetable-recommendations";

export async function checkTimetableConflicts({
  facultyId,
  semester,
  programId,
  session,
  dayOfWeek,
  startTime,
  endTime,
  excludeTimetableId,
  excludeTimetableIds,
  allowCombinedSharedClass = false,
  combinedGroupId = null,
  allowOptionalParallel = false,
  courseTitle,
  courseCode,
}: {
  facultyId: string;
  semester: number;
  programId: string;
  session?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  excludeTimetableId?: string;
  excludeTimetableIds?: string[];
  allowCombinedSharedClass?: boolean;
  combinedGroupId?: string | null;
  allowOptionalParallel?: boolean;
  courseTitle?: string;
  courseCode?: string;
}) {
  const errors: string[] = [];

  // Helper to check if two time slots overlap ("HH:mm")
  const checkOverlap = (st1: string, et1: string, st2: string, et2: string) => {
    return (st1 < et2 && et1 > st2);
  };

  const excludedIds = Array.from(
    new Set([
      ...(excludeTimetableId ? [excludeTimetableId] : []),
      ...(excludeTimetableIds || []),
    ])
  );
  const incomingSubjectKey = courseTitle || courseCode ? normalizeSubjectKey(courseTitle, courseCode) : "";

  // 1. Faculty Conflict: Same Faculty + Overlapping Day + Overlapping Time
  // Allows legitimate combined/joint classes sharing the same group OR matching shared subject when explicitly enabled.
  if (facultyId) {
    const facultyTimetables = await prisma.timetable.findMany({
      where: {
        facultyId,
        isActive: true,
        ...(excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {}),
      },
      include: { course: true, program: true, faculty: { include: { user: true } } },
    });

    for (const t of facultyTimetables) {
      if (daysOverlap(dayOfWeek, t.dayOfWeek) && checkOverlap(startTime, endTime, t.startTime, t.endTime)) {
        const existingMeta = parseCombinedClassTag(t.classSectionId);
        const sameCombinedGroup = Boolean(combinedGroupId && existingMeta.groupId === combinedGroupId);
        const existingSubjectKey = normalizeSubjectKey(t.course?.title, t.course?.code);
        const sameNormalizedSubject = Boolean(incomingSubjectKey && existingSubjectKey && incomingSubjectKey === existingSubjectKey);

        if (sameCombinedGroup || (allowCombinedSharedClass && sameNormalizedSubject)) {
          continue;
        }

        const facName = t.faculty?.user?.name || "This faculty";
        const courseName = t.course?.title || "another course";
        errors.push(`Faculty Conflict: ${facName} is already assigned to "${courseName}" (${t.program?.code || 'Class'} Sem ${t.semester} • ${t.session}) from ${t.startTime} to ${t.endTime} on ${t.dayOfWeek}.`);
        break;
      }
    }
  }

  // 2. Semester Conflict: Same Program + Same Semester + Same Session + Overlapping Day + Overlapping Time
  // Skipped when both incoming and existing slots are explicitly marked as optional/elective parallel subjects.
  if (programId && semester) {
    const semesterTimetables = await prisma.timetable.findMany({
      where: {
        programId,
        semester,
        ...(session ? { session } : {}),
        isActive: true,
        ...(excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {}),
      },
      include: { course: true },
    });

    for (const t of semesterTimetables) {
      if (daysOverlap(dayOfWeek, t.dayOfWeek) && checkOverlap(startTime, endTime, t.startTime, t.endTime)) {
        if (allowOptionalParallel) {
          continue;
        }

        const courseName = t.course?.title || "another course";
        errors.push(`Cohort Conflict: ${session ? `(${session}) ` : ""}Semester ${semester} already has "${courseName}" scheduled from ${t.startTime} to ${t.endTime} on ${t.dayOfWeek}.`);
        break;
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" | "));
  }

  return true;
}


export async function checkDatesheetConflicts({
  semester,
  programId,
  date,
  startTime,
  endTime,
  excludeDatesheetId,
}: {
  semester: number;
  programId: string;
  date: Date;
  startTime: string;
  endTime: string;
  excludeDatesheetId?: string;
}) {
  const errors: string[] = [];

  const checkOverlap = (st1: string, et1: string, st2: string, et2: string) => {
    return (st1 < et2 && et1 > st2);
  };

  // 1. Exam Conflict: Same Semester + Same Program + Same Date + Overlapping Time
  const semesterExams = await prisma.datesheet.findMany({
    where: { programId, semester, date, id: { not: excludeDatesheetId } }
  });

  for (const e of semesterExams) {
    if (checkOverlap(startTime, endTime, e.startTime, e.endTime)) {
      errors.push(`Exam Conflict: Semester ${semester} already has an exam scheduled on this date from ${e.startTime} to ${e.endTime}.`);
      break;
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" | "));
  }

  return true;
}
