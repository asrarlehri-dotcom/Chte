import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_PROGRAM_ROLES = ["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL"];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    const { searchParams } = new URL(request.url);
    const requestedCollegeId = searchParams.get("collegeId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    let collegeFilter: string | undefined = undefined;
    if (sessionCollegeId && sessionRole !== "CHTE_ADMIN" && sessionRole !== "SUPER_ADMIN") {
      collegeFilter = sessionCollegeId;
    } else if (requestedCollegeId) {
      collegeFilter = requestedCollegeId;
    }

    const programs = await prisma.program.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(collegeFilter ? { collegeId: collegeFilter } : {}),
      },
      include: {
        department: true,
        college: { select: { id: true, name: true, code: true } },
        groups: {
          include: {
            subjects: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_PROGRAM_ROLES.includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, educationLevel, departmentId, collegeId } = body;

    if (!name || !code || !educationLevel) {
      return NextResponse.json({ error: "Name, Code, and Education Level are required" }, { status: 400 });
    }

    const targetCollegeId = sessionCollegeId || collegeId || null;

    const program = await prisma.program.create({
      data: {
        name,
        code: code.trim().toUpperCase(),
        educationLevel,
        departmentId: departmentId || null,
        collegeId: targetCollegeId,
      },
    });
    
    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error("Error creating program:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_PROGRAM_ROLES.includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, code, educationLevel, departmentId, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existingProgram = await prisma.program.findUnique({ where: { id } });
    if (!existingProgram) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // College scoping check
    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (existingProgram.collegeId && existingProgram.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot modify programs of another college" }, { status: 403 });
      }
    }

    const updated = await prisma.program.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code: code.trim().toUpperCase() }),
        ...(educationLevel !== undefined && { educationLevel }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating program:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_PROGRAM_ROLES.includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
    }

    const existingProgram = await prisma.program.findUnique({ where: { id } });
    if (!existingProgram) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // College scoping check
    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (existingProgram.collegeId && existingProgram.collegeId !== sessionCollegeId) {
        return NextResponse.json({ error: "Forbidden: You cannot delete programs of another college" }, { status: 403 });
      }
    }

    // Soft delete the program by setting isActive to false
    await prisma.program.update({
      where: { id },
      data: { isActive: false },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any)?.id,
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "DEACTIVATE",
        entity: "Program",
        entityId: id,
        description: `Program "${existingProgram.name}" (${existingProgram.code}) deactivated`,
        collegeId: existingProgram.collegeId || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deactivating program:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
