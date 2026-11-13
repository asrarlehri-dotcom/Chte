import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL"].includes(sessionRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const requestedCollegeId = searchParams.get("collegeId");

    let collegeFilter: string | undefined = undefined;
    if (sessionCollegeId && sessionRole !== "CHTE_ADMIN" && sessionRole !== "SUPER_ADMIN") {
      collegeFilter = sessionCollegeId;
    } else if (requestedCollegeId) {
      collegeFilter = requestedCollegeId;
    }

    const faculty = await prisma.faculty.findMany({
      where: collegeFilter ? { collegeId: collegeFilter } : undefined,
      include: {
        user: true,
        department: true,
        courses: true,
        college: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(faculty);
  } catch {
    return NextResponse.json({ error: "Failed to fetch faculty" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL"].includes(sessionRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, email, password, fatherName, designation, qualification, contactNumber, departmentId, educationLevel, collegeId } = body;
    if (!name || !email || !password)
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });

    const targetCollegeId = sessionCollegeId || collegeId || null;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "FACULTY",
        collegeId: targetCollegeId,
      },
    });

    const faculty = await prisma.faculty.create({
      data: {
        userId: user.id,
        fatherName: fatherName || null,
        designation: designation || null,
        qualification: qualification || null,
        contactNumber: contactNumber || null,
        departmentId: departmentId || null,
        educationLevel: educationLevel || "BS",
        collegeId: targetCollegeId,
      } as any,
      include: { user: true, department: true },
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "CREATE",
        entity: "Faculty",
        entityId: faculty.id,
        description: `Faculty "${name}" (${designation || 'Faculty Member'}) registered`,
        collegeId: targetCollegeId,
      },
    });

    return NextResponse.json(faculty, { status: 201 });
  } catch (error: any) {
    console.error("Create faculty error:", error);
    return NextResponse.json({ error: "Failed to register faculty member" }, { status: 500 });
  }
}
