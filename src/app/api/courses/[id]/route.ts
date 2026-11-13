import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_COURSE_ROLES = ["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_COURSE_ROLES.includes(sessionRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: { program: true },
    });
    if (!existingCourse) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // College scoping check
    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (existingCourse.program?.collegeId && existingCourse.program.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot modify courses of another college" }, { status: 403 });
      }
    }

    const data = await req.json();

    let parsedCredits: any = undefined;
    if (data.creditHours || data.creditHoursFormat || data.theoryHours !== undefined || data.labHours !== undefined) {
      const match = String(data.creditHoursFormat || data.creditHours || "").match(/^(\d+)\s*\(\s*(\d+)\s*[\-\/]\s*(\d+)\s*\)$/);
      if (match) {
        parsedCredits = {
          total: parseInt(match[1]),
          theory: parseInt(match[2]),
          lab: parseInt(match[3]),
          format: `${parseInt(match[1])}(${parseInt(match[2])}-${parseInt(match[3])})`
        };
      } else {
        const total = parseInt(data.creditHours) || 3;
        const theory = data.theoryHours !== undefined && data.theoryHours !== null ? parseInt(data.theoryHours) : total;
        const lab = data.labHours !== undefined && data.labHours !== null ? parseInt(data.labHours) : 0;
        parsedCredits = {
          total,
          theory,
          lab,
          format: `${total}(${theory}-${lab})`
        };
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.code && { code: data.code }),
        ...(parsedCredits && {
          creditHours: parsedCredits.total,
          creditHoursFormat: parsedCredits.format,
          theoryHours: parsedCredits.theory,
          labHours: parsedCredits.lab,
        }),
        ...(data.courseType && { courseType: data.courseType }),
        ...(data.semester && { semester: parseInt(data.semester) }),
        ...(data.facultyId !== undefined && { facultyId: data.facultyId || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { program: true, faculty: { include: { user: true } } },
    });
    return NextResponse.json(course);
  } catch (error: any) {
    console.error("Failed to update course:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_COURSE_ROLES.includes(sessionRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: { program: true },
    });
    if (!existingCourse) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // College scoping check
    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (existingCourse.program?.collegeId && existingCourse.program.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot delete courses of another college" }, { status: 403 });
      }
    }

    try {
      await prisma.course.delete({ where: { id } });
    } catch {
      await prisma.course.update({ where: { id }, data: { isActive: false } });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete course:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
