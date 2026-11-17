"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateStudentCGPA } from "@/lib/cgpa";

export async function getPrograms() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const programs = await prisma.program.findMany({
    where: { educationLevel: "BS" },
    orderBy: { name: "asc" },
  });
  
  return programs;
}

export async function getGazetteData(programId: string, semester: number) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Fetch all students for the selected program
  const students = await prisma.student.findMany({
    where: { 
      programId,
      educationLevel: "BS"
    },
    include: {
      user: true,
      marks: {
        include: {
          course: true
        }
      }
    },
    orderBy: {
      rollNumber: "asc"
    }
  });

  const formattedData = students.map(student => {
    // Collect all unique courses taken in the selected semester
    const targetSemesterMarks = student.marks.filter(m => m.course.semester === semester);
    
    // Group marks by semester for CGPA calculation
    const semestersMap: Record<number, { gpPoints: number; credits: number }> = {};
    let failedCourses: string[] = [];
    let semesterTotalMarks = 0;
    let semesterObtainedMarks = 0;

    student.marks.forEach(m => {
      const sem = m.course.semester;
      if (sem > semester) return; // Only count semesters up to target semester!

      const credit = m.course.creditHours || 3;
      const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
      // Protect against division by zero
      const pct = !isAbsent && m.totalMarks > 0 ? (m.obtainedMarks / m.totalMarks) * 100 : 0;
      
      let gp = 0;
      if (isAbsent) {
        gp = 0;
        if (sem === semester) {
          failedCourses.push(`${m.course.title} (${m.course.code}) [A - Absent]`);
        }
      } else if (pct >= 80) {
        gp = 4.0;
      } else if (pct >= 50) {
        gp = 1.0 + (Math.round(pct) - 50) * 0.1;
      } else {
        // Failed
        if (sem === semester) {
          failedCourses.push(`${m.course.title} (${m.course.code})`);
        }
      }

      if (sem === semester) {
        semesterTotalMarks += m.totalMarks;
        if (!isAbsent) {
          semesterObtainedMarks += m.obtainedMarks;
        }
      }

      if (!semestersMap[sem]) {
        semestersMap[sem] = { gpPoints: 0, credits: 0 };
      }
      semestersMap[sem].gpPoints += gp * credit;
      semestersMap[sem].credits += credit;
    });

    const semestersData = Object.entries(semestersMap).map(([semStr, d]) => ({
      semester: parseInt(semStr),
      gpa: d.credits > 0 ? parseFloat((d.gpPoints / d.credits).toFixed(2)) : 0,
      creditHours: d.credits,
    }));

    const hasTargetMarks = targetSemesterMarks.length > 0;
    const { cgpa } = hasTargetMarks
      ? calculateStudentCGPA(
          { bsAdmissionType: student.bsAdmissionType },
          semestersData
        )
      : { cgpa: 0 };

    const targetSem = semestersData.find((sd) => sd.semester === semester);
    const sgpa = targetSem && hasTargetMarks ? targetSem.gpa : 0;

    let status = "PROMOTED";
    if (sgpa < 2.0 && sgpa >= 1.0) status = "PROBATION";
    else if (sgpa < 1.0 && targetSem) status = "DROPOUT";

    // Format specific paper marks for this student
    const paperMarks = targetSemesterMarks.map(m => {
      const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
      return {
        courseId: m.courseId,
        courseTitle: m.course.title,
        courseCode: m.course.code,
        obtained: isAbsent ? "A" : m.obtainedMarks,
        total: m.totalMarks,
        isAbsent,
        percentage: !isAbsent && m.totalMarks > 0 ? ((m.obtainedMarks / m.totalMarks) * 100).toFixed(1) : "0"
      };
    });

    return {
      id: student.id,
      rollNumber: student.rollNumber,
      name: student.user.name,
      sgpa,
      cgpa,
      failedCourses,
      status,
      semesterTotalMarks,
      semesterObtainedMarks,
      semesterPercentage: semesterTotalMarks > 0 ? ((semesterObtainedMarks / semesterTotalMarks) * 100).toFixed(1) : "0",
      paperMarks
    };
  });

  // Extract all unique courses for the dynamic table headers
  const uniqueCoursesMap = new Map();
  formattedData.forEach(student => {
    student.paperMarks.forEach(paper => {
      if (!uniqueCoursesMap.has(paper.courseId)) {
        uniqueCoursesMap.set(paper.courseId, {
          title: paper.courseTitle,
          code: paper.courseCode,
          id: paper.courseId
        });
      }
    });
  });
  
  const uniqueCourses = Array.from(uniqueCoursesMap.values());

  return {
    students: formattedData,
    courses: uniqueCourses
  };
}
