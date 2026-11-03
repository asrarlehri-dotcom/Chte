import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function parseCreditHoursHelper(input: any, theoryInput?: any, labInput?: any, courseType?: string) {
  const str = String(input || "").trim();
  const match = str.match(/^(\d+)\s*\(\s*(\d+)\s*[\-\/]\s*(\d+)\s*\)$/);
  if (match) {
    const total = parseInt(match[1]);
    const theory = parseInt(match[2]);
    const lab = parseInt(match[3]);
    return {
      total,
      theory,
      lab,
      format: `${total}(${theory}-${lab})`
    };
  }

  const total = parseInt(str) || 3;
  let theory = theoryInput !== undefined && theoryInput !== null && theoryInput !== "" ? parseInt(String(theoryInput)) : NaN;
  let lab = labInput !== undefined && labInput !== null && labInput !== "" ? parseInt(String(labInput)) : NaN;

  if (isNaN(theory) || isNaN(lab)) {
    if (courseType === "LAB_PRACTICAL" || courseType === "PRACTICAL") {
      lab = 1;
      theory = Math.max(0, total - lab);
    } else {
      lab = 0;
      theory = total;
    }
  }

  return {
    total,
    theory,
    lab,
    format: `${total}(${theory}-${lab})`
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId") || undefined;
    const semester = searchParams.get("semester");
    const session_year = searchParams.get("session") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;

    const courses = await prisma.course.findMany({
      where: {
        ...(programId && { programId }),
        ...(semester && { semester: parseInt(semester) }),
        ...(session_year && { session: session_year }),
        ...(departmentId && { departmentId }),
      },
      include: { program: true, department: true, faculty: { include: { user: true } } },
      orderBy: [{ semester: "asc" }, { title: "asc" }],
    });
    return NextResponse.json(courses);
  } catch {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER"].includes(sessionRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, code, creditHours, creditHoursFormat, theoryHours, labHours, courseType, session: sess, semester, programId, departmentId, facultyId } = body;

    if (!title || !code || !creditHours || !semester || !programId)
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });

    const parsedCredits = parseCreditHoursHelper(creditHoursFormat || creditHours, theoryHours, labHours, courseType);

    const course = await prisma.course.create({
      data: {
        title,
        code,
        creditHours: parsedCredits.total,
        creditHoursFormat: parsedCredits.format,
        theoryHours: parsedCredits.theory,
        labHours: parsedCredits.lab,
        courseType: courseType || (parsedCredits.lab > 0 ? "LAB_PRACTICAL" : "THEORY"),
        session: sess || "2026",
        semester: parseInt(semester),
        programId,
        departmentId: departmentId || null,
        facultyId: facultyId || null,
      },
      include: { program: true, faculty: { include: { user: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "CREATE",
        entity: "Course",
        entityId: course.id,
        description: `Course "${title}" (${code}) created with ${parsedCredits.format} credits for Semester ${semester}`,
        collegeId: sessionCollegeId || null,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error("Course create error:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
