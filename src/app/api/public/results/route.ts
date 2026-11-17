import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGPValue, getGrade, calculateStudentCGPA } from "@/lib/cgpa";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collegeId = searchParams.get("collegeId")?.trim() || "";
    const session = searchParams.get("session")?.trim() || "";
    const programId = searchParams.get("programId")?.trim() || "";
    const semesterParam = searchParams.get("semester")?.trim() || "";
    const query = searchParams.get("query")?.trim() || "";

    // Require at least a search query or a combination of college + program + session
    if (!query && (!collegeId || !programId)) {
      return NextResponse.json(
        { error: "Please enter a Roll No, CNIC, Reg No, or Student Name to search." },
        { status: 400 }
      );
    }

    const whereConditions: any = {
      isActive: true,
    };

    if (collegeId && collegeId !== "ALL") {
      whereConditions.collegeId = collegeId;
    }

    if (session && session !== "ALL") {
      whereConditions.session = session;
    }

    if (programId && programId !== "ALL") {
      whereConditions.programId = programId;
    }

    if (query) {
      const cleanDigits = query.replace(/[^0-9]/g, "");
      const orClauses: any[] = [
        { rollNumber: { contains: query, mode: "insensitive" } },
        { user: { name: { contains: query, mode: "insensitive" } } },
        { fatherName: { contains: query, mode: "insensitive" } },
        { cnic: { contains: query, mode: "insensitive" } },
      ];

      // If digits provided (e.g. CNIC without dashes or roll number digits)
      if (cleanDigits.length >= 4) {
        orClauses.push({ cnic: { contains: cleanDigits, mode: "insensitive" } });
        orClauses.push({ rollNumber: { contains: cleanDigits, mode: "insensitive" } });
      }

      // If custom dynamic registration number
      orClauses.push({ customFields: { contains: query, mode: "insensitive" } });

      whereConditions.OR = orClauses;
    }

    const students = await prisma.student.findMany({
      where: whereConditions,
      include: {
        user: { select: { id: true, name: true, email: true } },
        college: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
            district: true,
          },
        },
        program: { select: { id: true, name: true, code: true } },
        marks: {
          where: { isActive: true },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                code: true,
                creditHours: true,
                semester: true,
                session: true,
                programId: true,
              },
            },
          },
        },
      },
      take: 15,
      orderBy: { rollNumber: "asc" },
    });

    if (students.length === 0) {
      return NextResponse.json({
        students: [],
        message: "No student result records found matching your search.",
      });
    }

    const results = students.map((s) => {
      // 1. Identify all semesters where marks actually exist
      const semWithMarks = Array.from(
        new Set((s.marks || []).map((m) => m.course?.semester || 1))
      ).sort((a, b) => a - b);

      // Determine target semester:
      // If user passed a specific semester, use it.
      // Otherwise, default to the latest semester that HAS MARKS (so we don't show an empty semester like Sem 8 when marks are in Sem 3)!
      let targetSemester = semesterParam && semesterParam !== "ALL" ? parseInt(semesterParam) : 0;
      if (!targetSemester || isNaN(targetSemester)) {
        if (semWithMarks.length > 0) {
          targetSemester = semWithMarks[semWithMarks.length - 1]; // latest semester with actual exam marks
        } else if (s.currentSemester) {
          targetSemester = s.currentSemester;
        } else {
          targetSemester = 1;
        }
      }

      // 2. Track all failed / unpassed courses across the student's entire degree history
      const allFailedCourses: Array<{
        semester: number;
        courseTitle: string;
        courseCode: string;
        obtainedMarks: number;
        totalMarks: number;
        gp: string;
        grade: string;
        isAbsent: boolean;
      }> = [];

      // Build multi-semester data for GPA & CGPA calculation
      const semestersMap: Record<
        number,
        { gpPoints: number; credits: number; obtained: number; total: number }
      > = {};

      (s.marks || []).forEach((m) => {
        const sem = m.course?.semester || 1;
        const credit = m.course?.creditHours || 3;
        const isAbsent = m.status === "ABSENT" || m.status === "A";
        const gp = isAbsent ? 0.0 : getGPValue(m.obtainedMarks, m.totalMarks);
        const isPass = !isAbsent && gp >= 1.0;

        if (!isPass) {
          allFailedCourses.push({
            semester: sem,
            courseTitle: m.course?.title || "Subject",
            courseCode: m.course?.code || "SUBJ",
            obtainedMarks: isAbsent ? 0 : m.obtainedMarks,
            totalMarks: m.totalMarks || 100,
            gp: gp.toFixed(2),
            grade: isAbsent ? "F (A)" : getGrade(m.obtainedMarks, m.totalMarks),
            isAbsent,
          });
        }

        if (!semestersMap[sem]) {
          semestersMap[sem] = { gpPoints: 0, credits: 0, obtained: 0, total: 0 };
        }
        semestersMap[sem].gpPoints += gp * credit;
        semestersMap[sem].credits += credit;
        if (!isAbsent) {
          semestersMap[sem].obtained += m.obtainedMarks;
        }
        semestersMap[sem].total += m.totalMarks;
      });

      const semestersData = Object.entries(semestersMap).map(([semStr, d]) => ({
        semester: parseInt(semStr),
        gpa: d.credits > 0 ? parseFloat((d.gpPoints / d.credits).toFixed(2)) : 0,
        creditHours: d.credits,
        qualityPoints: d.gpPoints,
        obtained: d.obtained,
        total: d.total,
      }));

      const targetMarks = (s.marks || [])
        .filter((m) => (m.course?.semester || 1) === targetSemester)
        .map((m, idx) => {
          const isAbsent = m.status === "ABSENT" || m.status === "A";
          const gp = isAbsent ? 0.0 : getGPValue(m.obtainedMarks, m.totalMarks);
          const isPass = !isAbsent && gp >= 1.0;
          const letterGrade = isAbsent ? "F (A)" : getGrade(m.obtainedMarks, m.totalMarks);

          return {
            paperNo: `Paper-${idx + 1}`,
            courseId: m.courseId,
            courseTitle: m.course?.title || "Subject",
            courseCode: m.course?.code || "SUBJ-101",
            creditHours: m.course?.creditHours || 3,
            obtainedMarks: isAbsent ? 0 : m.obtainedMarks,
            totalMarks: m.totalMarks || 100,
            midtermMarks: m.midtermMarks || 0,
            finalMarks: m.finalMarks || 0,
            assignmentMarks: m.assignmentMarks || 0,
            quizMarks: m.quizMarks || 0,
            gp: gp.toFixed(2),
            grade: letterGrade,
            isPass,
            isAbsent,
          };
        });

      const hasTargetMarks = targetMarks.length > 0;

      // Calculate CGPA up to target semester ONLY IF target semester has marks or student has appeared
      // If student has no examination records in targetSemester (e.g. Sem 3, 4, 5, 6, 7),
      // we do not carry forward previous semester's CGPA into un-enrolled / un-announced semesters!
      const relevantSemestersForCGPA = semestersData.filter(
        (sd) => sd.semester <= targetSemester
      );
      const { cgpa } = (hasTargetMarks && relevantSemestersForCGPA.length > 0)
        ? calculateStudentCGPA(
            { bsAdmissionType: s.bsAdmissionType },
            relevantSemestersForCGPA
          )
        : { cgpa: 0 };

      const targetSemData = semestersData.find((sd) => sd.semester === targetSemester);
      const semGPA = targetSemData && hasTargetMarks ? targetSemData.gpa : 0;

      // 4. Failed courses in target semester vs previous backlogs
      const failedCoursesInTargetSem = targetMarks.filter((tm) => !tm.isPass);
      const previousBacklogs = allFailedCourses.filter(
        (fc) => fc.semester < targetSemester
      );

      // Semester totals
      const semTotalObtained = targetMarks.reduce(
        (acc, curr) => acc + (curr.isAbsent ? 0 : curr.obtainedMarks),
        0
      );
      const semTotalMax = targetMarks.reduce((acc, curr) => acc + curr.totalMarks, 0);
      const semPercentage =
        semTotalMax > 0 ? parseFloat(((semTotalObtained / semTotalMax) * 100).toFixed(2)) : 0;

      // Cumulative totals up to target semester (only if target semester has marks)
      const cumTotalObtained = hasTargetMarks
        ? relevantSemestersForCGPA.reduce((acc, curr) => acc + curr.obtained, 0)
        : 0;
      const cumTotalMax = hasTargetMarks
        ? relevantSemestersForCGPA.reduce((acc, curr) => acc + curr.total, 0)
        : 0;

      // 5. Official Promotion Status Logic:
      // 1st Sem: GPA >= 1.00 => PROMOTED, else DROPOUT
      // 2nd Sem: CGPA >= 1.50 => PROMOTED, 1.00 - 1.49 => PROBATION, < 1.00 => DROPOUT
      // 3rd Sem: CGPA >= 1.75 => PROMOTED, 1.00 - 1.74 => PROBATION, < 1.00 => DROPOUT
      // 4th to 8th: CGPA >= 2.00 => PROMOTED, 1.50 - 1.99 => PROBATION, < 1.50 => DROPOUT
      let academicStatus = "PROMOTED";
      if (targetMarks.length === 0) {
        academicStatus = "RESULT_AWAITED";
      } else if (targetMarks.every((m) => m.isAbsent)) {
        academicStatus = "ABSENT";
      } else if (targetSemester === 1) {
        if (semGPA >= 1.0) academicStatus = "PROMOTED";
        else academicStatus = "DROPOUT";
      } else if (targetSemester === 2) {
        if (cgpa >= 1.5) academicStatus = "PROMOTED";
        else if (cgpa >= 1.0) academicStatus = "PROBATION";
        else academicStatus = "DROPOUT";
      } else if (targetSemester === 3) {
        if (cgpa >= 1.75) academicStatus = "PROMOTED";
        else if (cgpa >= 1.0) academicStatus = "PROBATION";
        else academicStatus = "DROPOUT";
      } else {
        // Semesters 4 to 8
        if (cgpa >= 2.0) academicStatus = "PROMOTED";
        else if (cgpa >= 1.5) academicStatus = "PROBATION";
        else academicStatus = "DROPOUT";
      }

      // Generate standardized Registration No
      const sessionStr = s.session || "2024-2028";
      const sessionShort = sessionStr.slice(2, 4);
      const progCode = s.program?.code || "BS";
      const rollNumeric = s.rollNumber.replace(/\D/g, "").slice(-3).padStart(3, "0") || "001";
      const registrationNo = `REG/BS-${sessionShort}/${progCode}-${rollNumeric}`;

      return {
        studentId: s.id,
        studentName: s.user.name,
        fatherName: s.fatherName || "—",
        rollNumber: s.rollNumber,
        registrationNo,
        cnic: s.cnic || "—",
        session: s.session || "2024-2028",
        semester: targetSemester,
        availableSemesters: semWithMarks,
        educationLevel: s.educationLevel || "BS",
        bsAdmissionType: s.bsAdmissionType || "REGULAR",
        college: {
          id: s.college?.id || "",
          name: s.college?.name || "Govt. Degree College",
          code: s.college?.code || "GDC",
          logoUrl: s.college?.logoUrl || null,
          district: s.college?.district || "Balochistan",
        },
        program: {
          id: s.program?.id || "",
          name: s.program?.name || "BS Degree Program",
          code: s.program?.code || "BS",
        },
        semesterGPA: semGPA,
        cumulativeCGPA: cgpa,
        semesterMarks: {
          obtained: semTotalObtained,
          total: semTotalMax,
          percentage: semPercentage,
        },
        cumulativeMarks: {
          obtained: cumTotalObtained,
          total: cumTotalMax,
        },
        academicStatus,
        failedCoursesCount: failedCoursesInTargetSem.length,
        failedCourses: failedCoursesInTargetSem,
        previousBacklogsCount: previousBacklogs.length,
        previousBacklogs,
        totalLifetimeFailedCount: allFailedCourses.length,
        allFailedCourses,
        courses: targetMarks,
      };
    });

    return NextResponse.json({
      students: results,
      totalMatches: results.length,
    });
  } catch (error: any) {
    console.error("Public result search error:", error);
    return NextResponse.json(
      { error: "Failed to search results. Please try again later." },
      { status: 500 }
    );
  }
}

