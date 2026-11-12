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
    const targetCourseId = body.courseId;

    if (!targetCourseId) {
      return NextResponse.json({ error: "Target Course is required to import marks." }, { status: 400 });
    }

    if (!records || records.length === 0) {
      return NextResponse.json({ error: "No marks records provided to import." }, { status: 400 });
    }

    // Fetch enrolled students or all active students in college
    const allStudents = await prisma.student.findMany({
      where: { isActive: true },
      select: { id: true, rollNumber: true, cnic: true, user: { select: { name: true } } }
    });

    let importedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const errors: { row: number; item: string; reason: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const rowIdx = i + 1;
      const raw = records[i];

      const roll = (raw.rollNumber || raw.rollno || raw.roll || "").trim();
      const cnic = (raw.cnic || "").trim();
      const studentName = (raw.studentName || raw.name || "Student").trim();

      // Find student
      let student = allStudents.find(s =>
        (roll && s.rollNumber && s.rollNumber.toLowerCase() === roll.toLowerCase()) ||
        (cnic && s.cnic && s.cnic.replace(/\D/g, "") === cnic.replace(/\D/g, "")) ||
        (studentName && s.user?.name && s.user.name.toLowerCase() === studentName.toLowerCase())
      );

      if (!student) {
        failedCount++;
        errors.push({
          row: rowIdx,
          item: roll || studentName || `Row ${rowIdx}`,
          reason: `Student '${roll || studentName}' could not be found in active student records.`
        });
        continue;
      }

      const midtermMarks = parseFloat(raw.midtermMarks || "0") || 0;
      const finalMarks = parseFloat(raw.finalMarks || "0") || 0;
      const assignmentMarks = parseFloat(raw.assignmentMarks || "0") || 0;
      const practicalMarks = parseFloat(raw.practicalMarks || "0") || 0;
      const totalMarks = parseFloat(raw.totalMarks || "100") || 100;

      let obtainedMarks = parseFloat(raw.obtainedMarks || "0") || 0;
      if (obtainedMarks === 0 && (midtermMarks > 0 || finalMarks > 0 || assignmentMarks > 0 || practicalMarks > 0)) {
        obtainedMarks = midtermMarks + finalMarks + assignmentMarks + practicalMarks;
      }

      try {
        const existingMark = await prisma.marks.findUnique({
          where: {
            studentId_courseId: {
              studentId: student.id,
              courseId: targetCourseId
            }
          }
        });

        if (existingMark) {
          await prisma.marks.update({
            where: { id: existingMark.id },
            data: {
              midtermMarks,
              finalMarks,
              assignmentMarks,
              practicalMarks,
              obtainedMarks,
              totalMarks,
              status: "SAVED"
            }
          });
          updatedCount++;
        } else {
          await prisma.marks.create({
            data: {
              studentId: student.id,
              courseId: targetCourseId,
              midtermMarks,
              finalMarks,
              assignmentMarks,
              practicalMarks,
              obtainedMarks,
              totalMarks,
              status: "SAVED"
            }
          });
          importedCount++;
        }
      } catch (err: any) {
        failedCount++;
        errors.push({
          row: rowIdx,
          item: `${student.rollNumber || studentName}`,
          reason: err?.message || "Failed to save marks."
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
    console.error("Marks import error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

