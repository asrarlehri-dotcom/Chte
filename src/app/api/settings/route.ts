import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DEFAULT_SETTINGS = [
  { key: "COLLEGE_NAME", value: "Government Post Graduate College Quetta" },
  { key: "COLLEGE_LOGO", value: "" },
  { key: "COLLEGE_TAGLINE", value: "College of Higher Education & Research" },
  { key: "COLLEGE_ADDRESS", value: "Quetta, Balochistan, Pakistan" },
  { key: "CHALLAN_BANK_ACCOUNT", value: "08730001324203" },
  { key: "CHALLAN_BANK_NAME", value: "Habib Bank Limited (HBL)" },
  { key: "CHALLAN_BRANCH_CODE", value: "0873" },
  { key: "CHALLAN_ACCOUNT_TITLE", value: "Principal Govt College" },
  { key: "CHALLAN_SEQUENCE_START", value: "100000" },
  { key: "CHALLAN_SEQUENCE_CURRENT", value: "135622565" },
  { key: "ROLL_NUMBER_PATTERN", value: "[YEAR]-[CODE]-[SEQ]" },
  { key: "ROLL_SEQUENCE_CURRENT", value: "1" },
  { key: "ACADEMIC_SESSIONS", value: "2024-2028, 2025-2029, 2026-2030, 2023-2027, 2022-2026, 2024-2026, 2025-2027, 2026-2028, 2023-2025, 2022-2024" },
  { key: "DEFAULT_FACULTY_PASSWORD", value: "gpgcq123" },
  { key: "FACULTY_EMAIL_DOMAIN", value: "@gpgcquetta.edu.pk" },
];

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

    // Load any custom college-specific SystemSettings
    const settings = await prisma.systemSetting.findMany({
      where: college?.id ? { collegeId: college.id } : { collegeId: null },
    });

    for (const item of settings) {
      config[item.key] = item.value;
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
    const targetCollegeId = body.collegeId || userCollegeId;

    // If updating college base info directly
    if (targetCollegeId && (body.COLLEGE_NAME || body.COLLEGE_LOGO || body.COLLEGE_TAGLINE || body.CHALLAN_BANK_ACCOUNT)) {
      await prisma.college.update({
        where: { id: targetCollegeId },
        data: {
          ...(body.COLLEGE_NAME ? { name: body.COLLEGE_NAME } : {}),
          ...(body.COLLEGE_LOGO !== undefined ? { logoUrl: body.COLLEGE_LOGO } : {}),
          ...(body.COLLEGE_TAGLINE !== undefined ? { tagline: body.COLLEGE_TAGLINE } : {}),
          ...(body.COLLEGE_ADDRESS !== undefined ? { address: body.COLLEGE_ADDRESS } : {}),
          ...(body.CHALLAN_BANK_ACCOUNT ? { bankAccount: body.CHALLAN_BANK_ACCOUNT } : {}),
          ...(body.CHALLAN_BANK_NAME ? { bankName: body.CHALLAN_BANK_NAME } : {}),
          ...(body.CHALLAN_BRANCH_CODE ? { branchCode: body.CHALLAN_BRANCH_CODE } : {}),
          ...(body.CHALLAN_ACCOUNT_TITLE ? { accountTitle: body.CHALLAN_ACCOUNT_TITLE } : {}),
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
