import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DEFAULT_CHTE_SETTINGS, ChteHomepageSettings, ChteFeaturedProfile } from "@/lib/chte-settings";

export async function GET() {
  try {
    const record = await prisma.systemSetting.findFirst({
      where: { key: "CHTE_HOMEPAGE_SETTINGS" },
    });

    let custom = {};
    if (record?.value) {
      try {
        custom = JSON.parse(record.value);
      } catch (e) {
        console.error("Failed to parse CHTE settings JSON:", e);
      }
    }

    const merged = {
      ...DEFAULT_CHTE_SETTINGS,
      ...custom,
    };

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Error loading CHTE settings:", error);
    return NextResponse.json({ error: "Failed to load CHTE settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please sign in first" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const isChteAdmin = userRole === "SUPER_ADMIN" || userRole === "CHTE_ADMIN";

    if (!isChteAdmin) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only CHTE Super Admins are authorized to modify CHTE Central Homepage settings and rules. College administrators cannot modify central provincial settings.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const settingsJson = JSON.stringify(body);
    const key = "CHTE_HOMEPAGE_SETTINGS";

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: settingsJson },
      create: { key, value: settingsJson },
    });

    return NextResponse.json({
      success: true,
      message: "CHTE Homepage, background colors, scenery photo, and featured profiles saved successfully!",
    });
  } catch (error) {
    console.error("Error saving CHTE settings:", error);
    return NextResponse.json({ error: "Failed to save CHTE settings" }, { status: 500 });
  }
}
