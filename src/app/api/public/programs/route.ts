import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — no auth required.
// Returns only active BS programs for the public admission form.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get("collegeId");

    const programs = await prisma.program.findMany({
      where: {
        educationLevel: "BS",
        ...(collegeId ? { collegeId } : {}),
      },
      select: {
        id: true,
        name: true,
        code: true,
        educationLevel: true,
        collegeId: true,
        college: { select: { id: true, name: true, code: true } }
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error("Error fetching public programs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
