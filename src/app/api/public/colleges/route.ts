import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");

    const colleges = await prisma.college.findMany({
      where: {
        isActive: true,
        ...(district && district !== "ALL" ? { district } : {}),
      },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        logoUrl: true,
        tagline: true,
        district: true,
        division: true,
        address: true,
        principalName: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
        _count: {
          select: {
            students: true,
            faculty: true,
            programs: true,
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(colleges);
  } catch (error) {
    console.error("Error fetching public colleges list:", error);
    return NextResponse.json({ error: "Failed to fetch colleges" }, { status: 500 });
  }
}
