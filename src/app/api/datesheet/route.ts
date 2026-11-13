import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId") || undefined;
    const programId = searchParams.get("programId") || undefined;
    const semester = searchParams.get("semester") ? parseInt(searchParams.get("semester")!) : undefined;
    const session_year = searchParams.get("session") || undefined;
    const requestedCollegeId = searchParams.get("collegeId");

    let collegeFilter: string | undefined = undefined;
    if (sessionCollegeId && sessionRole !== "CHTE_ADMIN" && sessionRole !== "SUPER_ADMIN") {
      collegeFilter = sessionCollegeId;
    } else if (requestedCollegeId) {
      collegeFilter = requestedCollegeId;
    }

    const datesheets = await prisma.datesheet.findMany({
      where: {
        ...(courseId && { courseId }),
        ...(programId && { programId }),
        ...(semester && { semester }),
        ...(session_year && { session: session_year }),
        ...(collegeFilter ? { program: { collegeId: collegeFilter } } : {}),
      },
      include: {
        course: true,
        program: { include: { college: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(datesheets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch datesheets" }, { status: 500 });
  }
}
