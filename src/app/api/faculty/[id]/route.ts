import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const FACULTY_MANAGE_ROLES = ["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !FACULTY_MANAGE_ROLES.includes(sessionRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const facultyRecord = await prisma.faculty.findUnique({ where: { id }, include: { user: true } });
    if (!facultyRecord) return NextResponse.json({ error: "Faculty not found" }, { status: 404 });

    // College scoping check
    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (facultyRecord.collegeId && facultyRecord.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot modify faculty of another college" }, { status: 403 });
      }
    }

    const body = await req.json();
    const {
      name,
      fatherName,
      designation,
      qualification,
      contactNumber,
      departmentId,
      educationLevel,
      isActive,
      cnic,
      personalNo,
      firstAppointmentDate,
      previousCollege,
      division,
      district,
      photo,
    } = body;

    // Update associated User model name if provided
    if (name && facultyRecord.userId) {
      await prisma.user.update({
        where: { id: facultyRecord.userId },
        data: { name },
      });
    }

    const faculty = await prisma.faculty.update({
      where: { id },
      data: {
        ...(fatherName !== undefined && { fatherName: fatherName || null }),
        ...(designation !== undefined && { designation: designation || null }),
        ...(qualification !== undefined && { qualification: qualification || null }),
        ...(contactNumber !== undefined && { contactNumber: contactNumber || null }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(educationLevel !== undefined && { educationLevel: educationLevel || "BS" }),
        ...(isActive !== undefined && { isActive }),
      } as any,
      include: { user: true, department: true },
    });

    // Update extended dossier profile fields if any supplied
    let existingExtra: any = {};
    const settingRec = await prisma.systemSetting.findUnique({ where: { key: `FACULTY_EXTRA_${id}` } });
    if (settingRec?.value) {
      try {
        existingExtra = JSON.parse(settingRec.value);
      } catch {}
    }

    const updatedExtra = {
      ...existingExtra,
      ...(cnic !== undefined && { cnic }),
      ...(personalNo !== undefined && { personalNo }),
      ...(firstAppointmentDate !== undefined && { firstAppointmentDate }),
      ...(previousCollege !== undefined && { previousCollege }),
      ...(division !== undefined && { division }),
      ...(district !== undefined && { district }),
      ...(photo !== undefined && { photo }),
    };

    await prisma.systemSetting.upsert({
      where: { key: `FACULTY_EXTRA_${id}` },
      update: { value: JSON.stringify(updatedExtra) },
      create: { key: `FACULTY_EXTRA_${id}`, value: JSON.stringify(updatedExtra), collegeId: facultyRecord.collegeId },
    });

    return NextResponse.json({
      ...faculty,
      ...updatedExtra,
    });
  } catch (error: any) {
    console.error("Update faculty error:", error);
    return NextResponse.json({ error: "Failed to update faculty details" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !FACULTY_MANAGE_ROLES.includes(sessionRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const faculty = await prisma.faculty.findUnique({ where: { id }, include: { user: true } });
    if (!faculty) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // College scoping check
    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (faculty.collegeId && faculty.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot delete faculty of another college" }, { status: 403 });
      }
    }

    // Deactivate faculty record and associated user account safely
    await prisma.$transaction(async (tx) => {
      // Soft-delete Faculty record
      await tx.faculty.update({ where: { id }, data: { isActive: false } });

      // Soft-delete User record
      if (faculty.userId) {
        await tx.user.update({ where: { id: faculty.userId }, data: { isActive: false } });
      }
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "DEACTIVATE",
        entity: "Faculty",
        entityId: id,
        description: `Faculty member "${faculty.user?.name}" deactivated`,
        collegeId: faculty.collegeId || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete faculty error:", error);
    return NextResponse.json({ error: "Failed to delete faculty member" }, { status: 500 });
  }
}
