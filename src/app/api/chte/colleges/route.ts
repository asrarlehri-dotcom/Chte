import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !["CHTE_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden: CHTE Master Access Required" }, { status: 403 });
    }

    const colleges = await prisma.college.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            students: true,
            faculty: true,
            programs: true,
            departments: true,
          }
        },
        users: {
          where: { role: { in: ["COLLEGE_ADMIN", "SUPER_ADMIN"] } },
          select: { id: true, email: true, name: true, role: true, isActive: true },
          take: 1
        }
      }
    });

    return NextResponse.json(colleges);
  } catch (error) {
    console.error("Error fetching colleges in CHTE route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !["CHTE_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden: CHTE Master Access Required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      code,
      logoUrl,
      district,
      division,
      address,
      contactEmail,
      contactPhone,
      principalName,
      adminEmail,
      adminPassword,
      bankName,
      bankAccount,
      branchCode,
      accountTitle,
      tagline,
    } = body;

    if (!name || !code || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "College Name, Unique Code, Admin Email, and Admin Password are required." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanSlug = cleanCode.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Check if code or slug already exists
    const existing = await prisma.college.findFirst({
      where: {
        OR: [
          { code: cleanCode },
          { slug: cleanSlug },
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: `A college with code '${cleanCode}' already exists.` },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail.trim().toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `User with email '${adminEmail}' already exists in system.` },
        { status: 400 }
      );
    }

    // 1. Create College record
    const college = await prisma.college.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        slug: cleanSlug,
        tagline: tagline?.trim() || "Center of Excellence & Quality Education",
        logoUrl: logoUrl?.trim() || "",
        district: district?.trim() || "Quetta",
        division: division?.trim() || "Quetta Division",
        address: address?.trim() || "",
        contactEmail: contactEmail?.trim() || adminEmail.trim(),
        contactPhone: contactPhone?.trim() || "",
        principalName: principalName?.trim() || "",
        bankName: bankName?.trim() || "Habib Bank Limited (HBL)",
        bankAccount: bankAccount?.trim() || "",
        branchCode: branchCode?.trim() || "",
        accountTitle: accountTitle?.trim() || `Principal ${name.trim()}`,
        isActive: true,
      }
    });

    // 2. Create College Admin Account
    const hashedPassword = await bcrypt.hash(adminPassword.trim(), 10);
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail.trim().toLowerCase(),
        password: hashedPassword,
        name: principalName?.trim() ? `${principalName.trim()} (Admin)` : `${name.trim()} Admin`,
        role: "COLLEGE_ADMIN",
        collegeId: college.id,
        isActive: true,
      }
    });

    // 3. Initialize default foundational departments for the new college
    const defaultDepts = [
      { code: `${cleanCode}-CS`, name: "Department of Computer Science" },
      { code: `${cleanCode}-ENG`, name: "Department of English" },
      { code: `${cleanCode}-MATH`, name: "Department of Mathematics" },
      { code: `${cleanCode}-INTER`, name: "Department of Intermediate Studies" },
    ];

    for (const dept of defaultDepts) {
      await prisma.department.create({
        data: {
          code: dept.code,
          name: dept.name,
          collegeId: college.id,
          isActive: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `College '${college.name}' (${college.code}) generated successfully.`,
      college,
      credentials: {
        collegeName: college.name,
        collegeCode: college.code,
        adminEmail: adminUser.email,
        adminPassword: adminPassword.trim(),
        loginUrl: "/login"
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating college in CHTE:", error);
    return NextResponse.json({ error: error.message || "Failed to create college." }, { status: 500 });
  }
}
