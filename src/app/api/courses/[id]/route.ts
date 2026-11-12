import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN", "BS_CONTROLLER"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  } catch {
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL"].includes(userRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      await prisma.course.delete({ where: { id } });
    } catch {
      await prisma.course.update({ where: { id }, data: { isActive: false } });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
