import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { autoPromoteStudentsForCourseOrSemester } from "@/lib/promotionHelper";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, studentId, programId, session: sessionBatch, semester } = body;

    const sessionUserName = session.user?.name || session.user?.email || "Admin";
    const sessionUserRole = (session.user as any)?.role || "User";

    const result = await autoPromoteStudentsForCourseOrSemester({
      courseId,
      studentId,
      programId,
      session: sessionBatch,
      semester: semester ? parseInt(String(semester)) : undefined,
      promotedBy: `${sessionUserName} (${sessionUserRole})`,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Auto promote error:", error);
    return NextResponse.json({ error: error.message || "Failed to auto promote" }, { status: 500 });
  }
}

