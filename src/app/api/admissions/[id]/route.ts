import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateRollNumber } from "@/app/shared-actions";

async function autoRegisterStudent(admissionId: string) {
  return await prisma.$transaction(async (tx) => {
    const admission = await tx.admission.findUnique({
      where: { id: admissionId },
      include: { program: true }
    });
    if (!admission) throw new Error("Admission not found");
    if (admission.status === "APPROVED") return; // already registered

    const rollNumber = await generateRollNumber(tx, admission);

    // 2. Create User account for student
    const user = await tx.user.create({
      data: {
        email: admission.email || `${rollNumber.toLowerCase()}@cms.local`,
        name: admission.studentName,
        password: "password123", // default password
        role: "STUDENT",
        collegeId: admission.collegeId || null,
      }
    });

    // Determine current semester
    let currentSemester: number | null = null;
    if (admission.educationLevel === "BS") {
      if (admission.bsAdmissionType === "BRIDGING_5TH") {
        currentSemester = 5;
      } else if (admission.bsAdmissionType === "MIGRATION") {
        currentSemester = admission.migrationSemester || 1;
      } else {
        currentSemester = 1;
      }
    }

    // 3. Create Student profile
    const student = await tx.student.create({
      data: {
        userId: user.id,
        rollNumber,
        educationLevel: admission.educationLevel,
        programId: admission.programId,
        groupId: admission.groupId,
        bsAdmissionType: admission.bsAdmissionType,
        currentSemester,
        cnic: admission.cnic,
        fatherName: admission.fatherName,
        contactNumber: admission.contactNumber,
        residentAddress: admission.residentAddress,
        session: admission.session,
        bscGroup: admission.bscGroup,
        bscObtained: admission.bscObtained,
        bscTotal: admission.bscTotal,
        bscYear: admission.bscYear,
        bscBoard: admission.bscBoard,
        collegeId: admission.collegeId || null,
      }
    });

    // 4. Look up configured admission fee from FeeSettings (checking most recent session override <= admission.session)
    const feeKey = admission.educationLevel === "BS" ? "BS_ADMISSION" : "INTER_ADMISSION";
    let feeSetting = null;
    const admissionSessionNum = Number(admission.session);
    if (admission.session && !isNaN(admissionSessionNum)) {
      const overrides = await tx.feeSettings.findMany({
        where: {
          key: feeKey,
          NOT: [{ session: null }, { session: "" }]
        }
      });
      const validOverrides = overrides
        .filter(o => o.session && !isNaN(Number(o.session)) && Number(o.session) <= admissionSessionNum)
        .sort((a, b) => Number(b.session) - Number(a.session));
      if (validOverrides.length > 0) {
        feeSetting = validOverrides[0];
      }
    }
    if (!feeSetting) {
      feeSetting = await tx.feeSettings.findFirst({
        where: { key: feeKey, OR: [{ session: null }, { session: "" }] }
      });
    }
    const feeAmount = feeSetting?.amount ?? (admission.educationLevel === "BS" ? 8500 : 5000);

    // Check if an admission fee challan already exists for this applicant
    const existingChallan = await tx.challan.findFirst({
      where: { admissionId: admission.id, feeType: feeKey }
    });

    if (existingChallan) {
      await tx.challan.update({
        where: { id: existingChallan.id },
        data: { studentId: student.id }
      });
    } else {
      // Fallback: Generate Challan record if it wasn't created on submission
      let sequenceSetting = await tx.systemSetting.findUnique({ where: { key: "CHALLAN_SEQUENCE_CURRENT" } });
      if (!sequenceSetting) {
        await tx.systemSetting.create({ data: { key: "CHALLAN_SEQUENCE_CURRENT", value: "135622565" } });
        sequenceSetting = await tx.systemSetting.findUnique({ where: { key: "CHALLAN_SEQUENCE_CURRENT" } });
      }
      const currentSequence = Number(sequenceSetting?.value || "135622565");
      await tx.systemSetting.update({
        where: { key: "CHALLAN_SEQUENCE_CURRENT" },
        data: { value: String(currentSequence + 1) },
      });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 14 days valid

      await tx.challan.create({
        data: {
          challanNumber: String(currentSequence),
          cnic: admission.cnic || "N/A",
          applicantName: admission.studentName,
          fatherName: admission.fatherName,
          feeType: feeKey,
          feeLabel: feeSetting?.label || "Admission Fee",
          amount: feeAmount,
          dueDate,
          educationLevel: admission.educationLevel,
          semester: currentSemester,
          session: admission.session,
          gender: admission.gender,
          programId: admission.programId,
          admissionId: admission.id,
          studentId: student.id,
          status: "PENDING",
          collegeId: admission.collegeId || null,
        }
      });
    }

    // 5.5 If Migrated Student, insert previous semesters marks to DB
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
        console.error("Error writing migration previous marks inside autoRegisterStudent transaction:", err);
      }
    }

    // 6. Set Admission Status to APPROVED
    await tx.admission.update({
      where: { id: admissionId },
      data: { status: "APPROVED" }
    });
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "INTER_FACULTY", "PRINCIPAL"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (status === "APPROVED") {
      await autoRegisterStudent(id);
      return NextResponse.json({ success: true, status: "APPROVED" });
    }

    const updatedAdmission = await prisma.admission.update({
      where: { id },
      data: { status },
    });
    
    return NextResponse.json(updatedAdmission);
  } catch (error: any) {
    console.error("Error updating admission:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "INTER_FACULTY", "PRINCIPAL"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.status !== undefined) {
      const { status } = body;
      if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      if (status === "APPROVED") {
        await autoRegisterStudent(id);
        return NextResponse.json({ success: true, status: "APPROVED" });
      }

      const updatedAdmission = await prisma.admission.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json(updatedAdmission);
    }

    const {
      studentName,
      fatherName,
      cnic,
      contactNumber,
      email,
      session: admissionSession,
      programId,
      groupId,
      bsAdmissionType,
      migrationSemester,
      gender,
      sscGroup,
      sscObtained,
      sscTotal,
      sscYear,
      sscBoard,
      hsscGroup,
      hsscObtained,
      hsscTotal,
      hsscYear,
      hsscBoard,
      bscGroup,
      bscObtained,
      bscTotal,
      bscYear,
      bscBoard,
    } = body;

    const updatedAdmission = await prisma.admission.update({
      where: { id },
      data: {
        ...(studentName !== undefined && { studentName }),
        ...(fatherName !== undefined && { fatherName }),
        ...(cnic !== undefined && { cnic }),
        ...(contactNumber !== undefined && { contactNumber }),
        ...(email !== undefined && { email }),
        ...(admissionSession !== undefined && { session: admissionSession }),
        ...(programId !== undefined && { programId: programId || null }),
        ...(groupId !== undefined && { groupId: groupId || null }),
        ...(bsAdmissionType !== undefined && { bsAdmissionType: bsAdmissionType || null }),
        ...(migrationSemester !== undefined && { migrationSemester: migrationSemester ? Number(migrationSemester) : null }),
        ...(gender !== undefined && { gender }),
        ...(sscGroup !== undefined && { sscGroup }),
        ...(sscObtained !== undefined && { sscObtained: sscObtained ? Number(sscObtained) : null }),
        ...(sscTotal !== undefined && { sscTotal: sscTotal ? Number(sscTotal) : null }),
        ...(sscYear !== undefined && { sscYear: sscYear ? Number(sscYear) : null }),
        ...(sscBoard !== undefined && { sscBoard }),
        ...(hsscGroup !== undefined && { hsscGroup }),
        ...(hsscObtained !== undefined && { hsscObtained: hsscObtained ? Number(hsscObtained) : null }),
        ...(hsscTotal !== undefined && { hsscTotal: hsscTotal ? Number(hsscTotal) : null }),
        ...(hsscYear !== undefined && { hsscYear: hsscYear ? Number(hsscYear) : null }),
        ...(hsscBoard !== undefined && { hsscBoard }),
        ...(bscGroup !== undefined && { bscGroup }),
        ...(bscObtained !== undefined && { bscObtained: bscObtained ? Number(bscObtained) : null }),
        ...(bscTotal !== undefined && { bscTotal: bscTotal ? Number(bscTotal) : null }),
        ...(bscYear !== undefined && { bscYear: bscYear ? Number(bscYear) : null }),
        ...(bscBoard !== undefined && { bscBoard }),
      }
    });

    // Update associated student profile and user details if student is already created
    const associatedStudent = await prisma.student.findFirst({
      where: {
        OR: [
          ...(cnic ? [{ cnic }] : []),
          ...(email ? [{ user: { email } }] : [])
        ]
      },
      include: { user: true }
    });

    if (associatedStudent) {
      await prisma.student.update({
        where: { id: associatedStudent.id },
        data: {
          ...(fatherName !== undefined && { fatherName }),
          ...(cnic !== undefined && { cnic }),
          ...(contactNumber !== undefined && { contactNumber }),
          ...(admissionSession !== undefined && { session: admissionSession }),
          ...(programId !== undefined && { programId: programId || null }),
          ...(groupId !== undefined && { groupId: groupId || null }),
          ...(bsAdmissionType !== undefined && { bsAdmissionType: bsAdmissionType || null }),
          ...(bscGroup !== undefined && { bscGroup }),
          ...(bscObtained !== undefined && { bscObtained: bscObtained ? Number(bscObtained) : null }),
          ...(bscTotal !== undefined && { bscTotal: bscTotal ? Number(bscTotal) : null }),
          ...(bscYear !== undefined && { bscYear: bscYear ? Number(bscYear) : null }),
          ...(bscBoard !== undefined && { bscBoard }),
        }
      });

      if (associatedStudent.user) {
        await prisma.user.update({
          where: { id: associatedStudent.userId },
          data: {
            ...(studentName !== undefined && { name: studentName }),
            ...(email !== undefined && { email }),
          }
        });
      }
    }

    return NextResponse.json(updatedAdmission);
  } catch (error: any) {
    console.error("Error updating admission:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "INTER_FACULTY", "PRINCIPAL"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admission = await prisma.admission.findUnique({
      where: { id }
    });
    if (!admission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }

    // Verify college scope for college-level users
    const sessionCollegeId = (session.user as any)?.collegeId;
    if (sessionCollegeId && userRole !== "CHTE_ADMIN" && userRole !== "SUPER_ADMIN") {
      if (admission.collegeId && admission.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Unauthorized: You can only delete admissions belonging to your college." }, { status: 403 });
      }
    }

    // 1. Delete associated challans first
    await prisma.challan.deleteMany({
      where: { admissionId: id }
    });

    // 2. Permanently delete the admission record
    await prisma.admission.delete({
      where: { id }
    });

    // 3. Log the audit
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any)?.id,
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "DELETE",
        entity: "Admission",
        entityId: id,
        description: `Admission deleted: ${admission.studentName} (${admission.cnic || "No CNIC"})`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Application deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting admission:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
