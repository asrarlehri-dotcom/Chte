import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function extractSafeHexColor(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed || trimmed.includes("[object")) return null;
    if (trimmed.startsWith("{")) {
      try {
        return extractSafeHexColor(JSON.parse(trimmed));
      } catch {
        return null;
      }
    }
    return trimmed;
  }
  if (typeof val === "object") {
    const obj = val as Record<string, any>;
    if (obj.mode === "solid" && typeof obj.solid === "string") return obj.solid;
    if (obj.mode === "gradient" && Array.isArray(obj.gradient?.stops) && obj.gradient.stops[0]?.color) {
      return obj.gradient.stops[0].color;
    }
    if (obj.mode === "texture" && typeof obj.texture?.baseColor === "string") return obj.texture.baseColor;
    if (obj.mode === "image") return obj.image?.tintColor || obj.solid || null;
  }
  return null;
}

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
        const rawColor = parsed.ribbonColor || parsed.primaryColor;
        const safeColor = extractSafeHexColor(rawColor);
        if (safeColor) {
          const idOrCode = s.key.split(":")[0].replace("PORTAL_SETTINGS_", "").toLowerCase();
          themeMap[idOrCode] = safeColor;
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
