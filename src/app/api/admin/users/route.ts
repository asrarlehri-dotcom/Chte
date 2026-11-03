import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/admin/users
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionRole = (session?.user as any)?.role;
  const sessionCollegeId = (session?.user as any)?.collegeId;

  if (!session || !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN"].includes(sessionRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedCollegeId = searchParams.get("collegeId");

  let collegeFilter: string | undefined = undefined;
  if (sessionCollegeId && sessionRole !== "CHTE_ADMIN" && sessionRole !== "SUPER_ADMIN") {
    collegeFilter = sessionCollegeId;
  } else if (requestedCollegeId) {
    collegeFilter = requestedCollegeId;
  }

  const users = await prisma.user.findMany({
    where: collegeFilter ? { collegeId: collegeFilter } : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      collegeId: true,
      college: { select: { id: true, name: true, code: true } }
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
