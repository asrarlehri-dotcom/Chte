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

    // Retrieve theme colors for colleges
    const portalSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          contains: "PORTAL_SETTINGS"
        }
      }
    });

    const themeMap: Record<string, string> = {};
    for (const s of portalSettings) {
      try {
        const parsed = JSON.parse(s.value);
        const color = parsed.ribbonColor || parsed.primaryColor;
        if (color) {
          const idOrCode = s.key.split(":")[0].replace("PORTAL_SETTINGS_", "").toLowerCase();
          themeMap[idOrCode] = color;
        }
      } catch {}
    }

    const collegesWithTheme = colleges.map((col) => {
      const codeKey = col.code.toLowerCase();
      const idKey = col.id.toLowerCase();
      const themeColor =
        themeMap[codeKey] ||
        themeMap[idKey] ||
        (codeKey.includes("gsc") || codeKey.includes("science")
          ? "#2563eb"
          : codeKey.includes("gdc") || codeKey.includes("mastung") || codeKey.includes("agri")
          ? "#059669"
          : "#dc2626");

      return {
        ...col,
        themeColor,
      };
    });

    return NextResponse.json(collegesWithTheme);
  } catch (error) {
    console.error("Error fetching public colleges list:", error);
    return NextResponse.json({ error: "Failed to fetch colleges" }, { status: 500 });
  }
}
