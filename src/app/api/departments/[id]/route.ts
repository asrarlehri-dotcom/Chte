import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_ROLES = ["SUPER_ADMIN", "CHTE_ADMIN", "COLLEGE_ADMIN", "ADMIN", "PRINCIPAL", "BS_CONTROLLER"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_ROLES.includes(sessionRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingDept = await prisma.department.findUnique({ where: { id } });
    if (!existingDept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // College scoping check: College Admin / Principal / Controller can only edit their own college's department
    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (existingDept.collegeId && existingDept.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot modify departments of another college" }, { status: 403 });
      }
    }

    const { name, code, hodName, isActive } = await req.json();
    const dept = await prisma.department.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(hodName !== undefined && { hodName }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return NextResponse.json(dept);
  } catch {
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_ROLES.includes(sessionRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingDept = await prisma.department.findUnique({ where: { id } });
    if (!existingDept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // College scoping check
    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (existingDept.collegeId && existingDept.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot delete departments of another college" }, { status: 403 });
      }
    }

    await prisma.department.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true, message: "Department deactivated successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
