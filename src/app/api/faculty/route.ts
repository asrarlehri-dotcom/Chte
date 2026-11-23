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

    // Fetch dynamic extended profile fields (CNIC, Personal No, First Appointment, Previous College, Division, District, Photo)
    const extraSettings = await prisma.systemSetting.findMany({
      where: {
        key: { startsWith: "FACULTY_EXTRA_" },
      },
    });

    const extraMap: Record<string, any> = {};
    for (const s of extraSettings) {
      try {
        const facId = s.key.replace("FACULTY_EXTRA_", "");
        extraMap[facId] = JSON.parse(s.value);
      } catch {}
    }

    const enrichedFaculty = faculty.map((f) => {
      const extra = extraMap[f.id] || {};
      return {
        ...f,
        cnic: extra.cnic || null,
        personalNo: extra.personalNo || null,
        firstAppointmentDate: extra.firstAppointmentDate || null,
        previousCollege: extra.previousCollege || null,
        division: extra.division || null,
        district: extra.district || null,
        photo: extra.photo || null,
        additionalCharge: extra.additionalCharge || null,
        leaveDossier: extra.leaveDossier || null,
      };
    });

    return NextResponse.json(enrichedFaculty);
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
    const {
      name,
      email,
      password,
      fatherName,
      designation,
      qualification,
      contactNumber,
      departmentId,
      educationLevel,
      collegeId,
      cnic,
      personalNo,
      firstAppointmentDate,
      previousCollege,
      division,
      district,
      photo,
      additionalCharge,
      leaveDossier,
    } = body;

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

    // Save extended dossier profile fields
    const extraProfile = {
      cnic: cnic || "",
      personalNo: personalNo || "",
      firstAppointmentDate: firstAppointmentDate || "",
      previousCollege: previousCollege || "",
      division: division || "Quetta Division",
      district: district || "Quetta",
      photo: photo || "",
      additionalCharge: additionalCharge || null,
      leaveDossier: leaveDossier || null,
    };

    await prisma.systemSetting.upsert({
      where: { key: `FACULTY_EXTRA_${faculty.id}` },
      update: { value: JSON.stringify(extraProfile) },
      create: {
        key: `FACULTY_EXTRA_${faculty.id}`,
        value: JSON.stringify(extraProfile),
        collegeId: targetCollegeId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "CREATE",
        entity: "Faculty",
        entityId: faculty.id,
        description: `Faculty "${name}" (${designation || 'Faculty Member'}) registered with Personal No: ${personalNo || 'N/A'}, CNIC: ${cnic || 'N/A'}`,
        collegeId: targetCollegeId,
      },
    });

    return NextResponse.json({
      ...faculty,
      ...extraProfile,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create faculty error:", error);
    return NextResponse.json({ error: "Failed to register faculty member" }, { status: 500 });
  }
}
