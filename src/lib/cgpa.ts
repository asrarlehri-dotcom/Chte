import { Student } from "@prisma/client";

/**
 * linear HEC-compatible GP calculation (4.0 scale):
 * 50% = 1.0, 51% = 1.1, ..., 79% = 3.9, 80%+ = 4.0
 */
export function getGPValue(obtained: number, total: number): number {
  if (total <= 0) return 0.00;
  const pct = (obtained / total) * 100;
  const rounded = Math.round(pct);

  if (rounded < 50) return 0.00; // Fail
  if (rounded >= 80) return 4.00; // Max GP is 4.0 starts at 80%

  return parseFloat((1.00 + (rounded - 50) * 0.10).toFixed(2));
}

/**
 * Standard HEC Grade Letter derivation from percentage or 4.0 GPA scale.
 */
export function getGradeLetter(score: number, isPercent: boolean = true): string {
  const pct = isPercent ? score : score * 25;
  const rounded = Math.round(pct);
  if (rounded >= 85) return "A+";
  if (rounded >= 80) return "A";
  if (rounded >= 75) return "B+";
  if (rounded >= 70) return "B";
  if (rounded >= 65) return "B-";
  if (rounded >= 60) return "C+";
  if (rounded >= 55) return "C";
  if (rounded >= 50) return "D";
  return "F";
}

/**
 * Convenience helper to calculate letter grade directly from obtained and total marks.
 */
export function getGrade(obtained: number, total: number): string {
  if (total <= 0) return "F";
  const pct = (obtained / total) * 100;
  return getGradeLetter(pct, true);
}

/**
 * Calculates GPA of a single semester.
 * GPA = Sum( GP * CreditHours ) / Sum( CreditHours )
 */
export function calculateSemesterGPA(
  courses: Array<{ creditHours: number; obtainedMarks: number; totalMarks: number }>
): number {
  let totalGradePoints = 0;
  let totalCredits = 0;

  for (const course of courses) {
    const gp = getGPValue(course.obtainedMarks, course.totalMarks);
    totalGradePoints += gp * course.creditHours;
    totalCredits += course.creditHours;
  }

  if (totalCredits === 0) return 0.0;
  return parseFloat((totalGradePoints / totalCredits).toFixed(2));
}

/**
 * Calculates CGPA for a student.
 * Special Rule: If the student is a Bridging/5th Semester admission type,
 * we ONLY consider semesters 5-8. Any marks from semesters 1-4 do not affect their CGPA.
 */
export function calculateStudentCGPA(
  student: { bsAdmissionType: string | null },
  semestersData: Array<{ semester: number; gpa: number; creditHours: number }>
): { cgpa: number; totalCredits: number } {
  let totalGP = 0;
  let totalCredits = 0;

  // Filter semesters based on admission type
  const relevantSemesters = semestersData.filter((item) => {
    if (student.bsAdmissionType === "BRIDGING_5TH") {
      // For Bridging, ignore Semesters 1 to 4 entirely
      return item.semester >= 5 && item.semester <= 8;
    }
    return item.semester >= 1 && item.semester <= 8;
  });

  for (const item of relevantSemesters) {
    totalGP += item.gpa * item.creditHours;
    totalCredits += item.creditHours;
  }

  if (totalCredits === 0) return { cgpa: 0.0, totalCredits: 0 };
  return {
    cgpa: parseFloat((totalGP / totalCredits).toFixed(2)),
    totalCredits
  };
}
