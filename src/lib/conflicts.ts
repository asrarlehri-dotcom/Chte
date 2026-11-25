import { prisma } from "./prisma";
import { daysOverlap } from "./timetable-days";

export async function checkTimetableConflicts({
  facultyId,
  semester,
  programId,
  dayOfWeek,
  startTime,
  endTime,
  excludeTimetableId,
}: {
  facultyId: string;
  semester: number;
  programId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  excludeTimetableId?: string;
}) {
  const errors: string[] = [];

  // Helper to check if two time slots overlap
  // Time format expected: "HH:mm"
  const checkOverlap = (st1: string, et1: string, st2: string, et2: string) => {
    return (st1 < et2 && et1 > st2);
  };

  // 1. Faculty Conflict: Same Faculty + Overlapping Day + Overlapping Time
  if (facultyId) {
    const facultyTimetables = await prisma.timetable.findMany({
      where: { facultyId, ...(excludeTimetableId ? { id: { not: excludeTimetableId } } : {}) },
      include: { course: true, program: true, faculty: { include: { user: true } } }
    });
    
    for (const t of facultyTimetables) {
      if (daysOverlap(dayOfWeek, t.dayOfWeek) && checkOverlap(startTime, endTime, t.startTime, t.endTime)) {
        const facName = t.faculty?.user?.name || "This faculty";
        const courseName = t.course?.title || "another course";
        errors.push(`Faculty Conflict: ${facName} is already assigned to "${courseName}" (${t.program?.code || 'Class'} Sem ${t.semester}) from ${t.startTime} to ${t.endTime} on ${t.dayOfWeek}.`);
        break;
      }
    }
  }

  // 2. Semester Conflict: Same Semester + Same Program + Overlapping Day + Overlapping Time
  if (programId && semester) {
    const semesterTimetables = await prisma.timetable.findMany({
      where: { programId, semester, ...(excludeTimetableId ? { id: { not: excludeTimetableId } } : {}) },
      include: { course: true }
    });

    for (const t of semesterTimetables) {
      if (daysOverlap(dayOfWeek, t.dayOfWeek) && checkOverlap(startTime, endTime, t.startTime, t.endTime)) {
        const courseName = t.course?.title || "another course";
        errors.push(`Semester Conflict: Semester ${semester} already has "${courseName}" scheduled from ${t.startTime} to ${t.endTime} on ${t.dayOfWeek}.`);
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
