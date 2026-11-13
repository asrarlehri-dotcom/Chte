import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    const sessionCollegeId = (session?.user as any)?.collegeId;
    const requestedCollegeId = searchParams.get("collegeId") || sessionCollegeId;

    let college = null;
    if (requestedCollegeId) {
      college = await prisma.college.findUnique({ where: { id: requestedCollegeId } });
    }

    if (!college) {
      college = await prisma.college.findFirst({ where: { isActive: true } });
    }

    // Default configuration base
    const config: Record<string, string> = {
      COLLEGE_NAME: college?.name || "Government Post Graduate College Quetta",
      COLLEGE_LOGO: college?.logoUrl || "",
      COLLEGE_BACKGROUND: "",
      COLLEGE_WATERMARK: "",
      COLLEGE_TAGLINE: college?.tagline || "College of Higher Education & Research",
      COLLEGE_ADDRESS: college?.address || "Quetta, Balochistan, Pakistan",
      COLLEGE_CODE: college?.code || "GPGCQ",
      CHALLAN_BANK_ACCOUNT: college?.bankAccount || "08730001324203",
      CHALLAN_BANK_NAME: college?.bankName || "Habib Bank Limited (HBL)",
      CHALLAN_BRANCH_CODE: college?.branchCode || "0873",
      CHALLAN_ACCOUNT_TITLE: college?.accountTitle || (college ? `Principal ${college.name}` : "Principal Govt College"),
      CHALLAN_SEQUENCE_START: "100000",
      CHALLAN_SEQUENCE_CURRENT: "135622565",
      ROLL_NUMBER_PATTERN: "[YEAR]-[CODE]-[SEQ]",
      ROLL_SEQUENCE_CURRENT: "1",
      ACADEMIC_SESSIONS: "2024-2028, 2025-2029, 2026-2030, 2023-2027, 2022-2026, 2024-2026, 2025-2027, 2026-2028, 2023-2025, 2022-2024",
      DEFAULT_FACULTY_PASSWORD: "college123",
      FACULTY_EMAIL_DOMAIN: college ? `@${college.code.toLowerCase()}.edu.pk` : "@gpgcquetta.edu.pk",
    };

    // 1. Load global settings (collegeId: null)
    const globalSettings = await prisma.systemSetting.findMany({
      where: { collegeId: null },
    });
    for (const item of globalSettings) {
      // Identity and bank fields of a specific college must NOT be overwritten by generic global settings
      if (college && [
        "COLLEGE_NAME",
        "COLLEGE_LOGO",
        "COLLEGE_TAGLINE",
        "COLLEGE_ADDRESS",
        "COLLEGE_CODE",
        "CHALLAN_BANK_ACCOUNT",
        "CHALLAN_BANK_NAME",
        "CHALLAN_BRANCH_CODE",
        "CHALLAN_ACCOUNT_TITLE"
      ].includes(item.key)) {
        continue;
      }
      config[item.key] = item.value;
    }

    // 2. Load college-specific settings and overlay them
    if (college?.id) {
      const collegeSettings = await prisma.systemSetting.findMany({
        where: { collegeId: college.id },
      });
      for (const item of collegeSettings) {
        config[item.key] = item.value;
      }
      // Guarantee institutional identity fields always match the College record if present
      if (college.name) config.COLLEGE_NAME = college.name;
      if (college.logoUrl) config.COLLEGE_LOGO = college.logoUrl;
      if (college.tagline) config.COLLEGE_TAGLINE = college.tagline;
      if (college.address) config.COLLEGE_ADDRESS = college.address;
      if (college.code) config.COLLEGE_CODE = college.code;
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userCollegeId = (session?.user as any)?.collegeId;

    if (!session || !["SUPER_ADMIN", "CHTE_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL", "BS_CONTROLLER"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let targetCollegeId = body.collegeId || userCollegeId;
    if (!targetCollegeId) {
      const defaultCollege = await prisma.college.findFirst({ where: { isActive: true } });
      targetCollegeId = defaultCollege?.id || null;
    }

    // Always update target College record directly if identity/banking fields are provided
    if (targetCollegeId && (
      body.COLLEGE_NAME !== undefined ||
      body.COLLEGE_LOGO !== undefined ||
      body.COLLEGE_TAGLINE !== undefined ||
      body.COLLEGE_ADDRESS !== undefined ||
      body.CHALLAN_BANK_ACCOUNT !== undefined ||
      body.CHALLAN_BANK_NAME !== undefined ||
      body.CHALLAN_BRANCH_CODE !== undefined ||
      body.CHALLAN_ACCOUNT_TITLE !== undefined
    )) {
      await prisma.college.update({
        where: { id: targetCollegeId },
        data: {
          ...(body.COLLEGE_NAME !== undefined ? { name: String(body.COLLEGE_NAME).trim() } : {}),
          ...(body.COLLEGE_LOGO !== undefined ? { logoUrl: String(body.COLLEGE_LOGO).trim() } : {}),
          ...(body.COLLEGE_TAGLINE !== undefined ? { tagline: String(body.COLLEGE_TAGLINE).trim() } : {}),
          ...(body.COLLEGE_ADDRESS !== undefined ? { address: String(body.COLLEGE_ADDRESS).trim() } : {}),
          ...(body.CHALLAN_BANK_ACCOUNT !== undefined ? { bankAccount: String(body.CHALLAN_BANK_ACCOUNT).trim() } : {}),
          ...(body.CHALLAN_BANK_NAME !== undefined ? { bankName: String(body.CHALLAN_BANK_NAME).trim() } : {}),
          ...(body.CHALLAN_BRANCH_CODE !== undefined ? { branchCode: String(body.CHALLAN_BRANCH_CODE).trim() } : {}),
          ...(body.CHALLAN_ACCOUNT_TITLE !== undefined ? { accountTitle: String(body.CHALLAN_ACCOUNT_TITLE).trim() } : {}),
        }
      });
    }

    for (let [key, value] of Object.entries(body)) {
      if (key === "collegeId") continue;
      let stringValue = String(value);
      if (key === "ACADEMIC_SESSIONS") {
        const { filterValidSessions } = await import("@/lib/sessionHelper");
        stringValue = filterValidSessions(stringValue).join(", ");
      }

      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: stringValue, ...(targetCollegeId ? { collegeId: targetCollegeId } : {}) },
        create: { key, value: stringValue, ...(targetCollegeId ? { collegeId: targetCollegeId } : {}) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving system settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
