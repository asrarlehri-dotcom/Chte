import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateRollNumber } from "@/app/shared-actions";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN"].includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { admissionId } = await request.json();

    if (!admissionId) {
      return NextResponse.json({ error: "Admission ID is required" }, { status: 400 });
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId }
    });

    if (!admission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }

    if (admission.status !== "APPROVED") {
      return NextResponse.json({ error: "Admission must be approved first" }, { status: 400 });
    }

    // Check if student already exists for this admission
    const existingStudent = await prisma.student.findUnique({
      where: { rollNumber: `ROLL-${admission.cnic}` } // Simplified logic for demo
    });

    if (existingStudent) {
      return NextResponse.json({ error: "Student is already registered" }, { status: 400 });
    }

    const targetCollegeId = admission.collegeId || sessionCollegeId || null;

    // Wrap in a transaction to ensure both user, student, and fee are created
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User account for student
      const user = await tx.user.create({
        data: {
          email: admission.email || `${admission.studentName.replace(/\s+/g, "").toLowerCase()}_${Date.now().toString().slice(-4)}@cms.local`,
          name: admission.studentName,
          password: "password123", // default password
          role: "STUDENT",
          collegeId: targetCollegeId,
        }
      });

      // Get the program first since generateRollNumber needs it
      const admissionWithProgram = await tx.admission.findUnique({
        where: { id: admission.id },
        include: { program: true }
      });
      const rollNumber = await generateRollNumber(tx, admissionWithProgram || admission);

      // 2. Create Student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          rollNumber,
          educationLevel: admission.educationLevel,
          programId: admission.programId,
          groupId: admission.groupId,
          bsAdmissionType: admission.bsAdmissionType,
          session: admission.session,
          currentSemester: admission.educationLevel === "BS" 
            ? (admission.bsAdmissionType === "BRIDGING_5TH" ? 5 : (admission.bsAdmissionType === "MIGRATION" ? (admission.migrationSemester || 1) : 1))
            : null,
          bscGroup: admission.bscGroup,
          bscObtained: admission.bscObtained,
          bscTotal: admission.bscTotal,
          bscYear: admission.bscYear,
          bscBoard: admission.bscBoard,
          collegeId: targetCollegeId,
        }
      });

      // 2.5 If Migrated Student, insert previous semesters marks to DB
      if (admission.bsAdmissionType === "MIGRATION" && admission.previousMarksJson) {
        try {
          const list = JSON.parse(admission.previousMarksJson);
          for (const item of list) {
            await tx.marks.upsert({
              where: {
                studentId_courseId: {
                  studentId: student.id,
                  courseId: item.courseId
                }
              },
              update: {
                obtainedMarks: Number(item.obtainedMarks),
                totalMarks: Number(item.totalMarks),
                isLocked: true
              },
              create: {
                studentId: student.id,
                courseId: item.courseId,
                obtainedMarks: Number(item.obtainedMarks),
                totalMarks: Number(item.totalMarks),
                isLocked: true
              }
            });
          }
        } catch (err) {
          console.error("Error writing migration previous marks:", err);
        }
      }

      // 3. Generate initial admission fee challan
      const feeAmount = admission.educationLevel === "BS" ? 50000 : 25000;
      
      const fee = await tx.fee.create({
        data: {
          studentId: student.id,
          amount: feeAmount,
          dueDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          challanNumber: `CHL-${Date.now()}`,
          status: "UNPAID",
        }
      });

      return { student, fee, user };
    });
    
    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (error) {
    console.error("Error registering student:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
