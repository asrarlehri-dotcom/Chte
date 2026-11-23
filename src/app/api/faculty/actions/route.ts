import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_ROLES = ["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "PRINCIPAL", "HOD"];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_ROLES.includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get("facultyId");
    const collegeId = searchParams.get("collegeId") || sessionCollegeId;

    const storeKey = collegeId ? `FACULTY_ACTIONS_${collegeId}` : "FACULTY_ACTIONS_GLOBAL";

    const record = await prisma.systemSetting.findUnique({
      where: { key: storeKey },
    });

    let actionsMap: Record<string, any> = {};
    if (record?.value) {
      try {
        actionsMap = JSON.parse(record.value);
      } catch {
        actionsMap = {};
      }
    }

    if (facultyId) {
      return NextResponse.json({ success: true, data: actionsMap[facultyId] || null });
    }

    return NextResponse.json({ success: true, data: actionsMap });
  } catch (error: any) {
    console.error("Fetch faculty actions error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch faculty actions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !ALLOWED_ROLES.includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      facultyId,
      actionType, // "JOINING" | "RELIEVED"
      notificationNo,
      notificationDate,
      effectiveDate,
      timeOfDay, // "before noon" | "afternoon"
      designation,
      bpsScale,
      subject,
      memoNo,
      station,
      cashNo,
      opiumDated,
      collegeName,
      destinationTransfer,
      notes,
    } = body;

    if (!facultyId || !actionType) {
      return NextResponse.json({ error: "facultyId and actionType are required" }, { status: 400 });
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { user: true, department: true, college: true },
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty member not found" }, { status: 404 });
    }

    const targetCollegeId = sessionCollegeId || faculty.collegeId;
    const storeKey = targetCollegeId ? `FACULTY_ACTIONS_${targetCollegeId}` : "FACULTY_ACTIONS_GLOBAL";

    // Read existing store
    const existingRecord = await prisma.systemSetting.findUnique({
      where: { key: storeKey },
    });

    let actionsMap: Record<string, any> = {};
    if (existingRecord?.value) {
      try {
        actionsMap = JSON.parse(existingRecord.value);
      } catch {
        actionsMap = {};
      }
    }

    const existingFacultyAction = actionsMap[facultyId] || {};

    const updatedAction = {
      ...existingFacultyAction,
      facultyId,
      facultyName: faculty.user?.name || "Faculty Member",
      fatherName: faculty.fatherName || "",
      department: faculty.department?.name || subject || "General",
      collegeName: collegeName || faculty.college?.name || "Govt. Postgraduate College Sariab Road Quetta",
      currentStatus: actionType === "RELIEVED" ? "RELIEVED" : "JOINED",
      lastUpdated: new Date().toISOString(),
      ...(actionType === "JOINING"
        ? {
            joiningDate: effectiveDate || new Date().toISOString().slice(0, 10),
            joiningNotificationNo: notificationNo || "SOC- 1/1-1(5)2008/1796-1807",
            joiningNotificationDate: notificationDate || "07/Sep:/2020",
            joiningTimeOfDay: timeOfDay || "before noon",
            joiningDesignation: designation || faculty.designation || "Lecturer",
            joiningBpsScale: bpsScale || "B-17",
            joiningSubject: subject || faculty.department?.name || "Psychology",
            joiningStation: station || "Quetta",
            joiningMemoNo: memoNo || `1042/${faculty.college?.code || "GCQ"}`,
            joiningCashNo: cashNo || "",
            joiningOpiumDated: opiumDated || "2020",
            joiningNotes: notes || "",
          }
        : {
            relievedDate: effectiveDate || new Date().toISOString().slice(0, 10),
            relievedNotificationNo: notificationNo || "SOC. 11/1-1 (5) /2008/Edn::/2012-17/",
            relievedNotificationDate: notificationDate || "21/September /2020",
            relievedTimeOfDay: timeOfDay || "before noon",
            relievedDesignation: designation || faculty.designation || "Associate Professor",
            relievedBpsScale: bpsScale || "B-19",
            relievedSubject: subject || faculty.department?.name || "Mathematics",
            relievedMemoNo: memoNo || "1042",
            relievedStation: station || "Quetta",
            relievedDestination: destinationTransfer || "",
            relievedNotes: notes || "",
          }),
    };

    actionsMap[facultyId] = updatedAction;

    // Upsert into SystemSetting
    await prisma.systemSetting.upsert({
      where: { key: storeKey },
      update: {
        value: JSON.stringify(actionsMap),
        collegeId: targetCollegeId || null,
      },
      create: {
        key: storeKey,
        value: JSON.stringify(actionsMap),
        collegeId: targetCollegeId || null,
      },
    });

    // Update faculty isActive state in database (Relieved faculty is marked inactive)
    await prisma.faculty.update({
      where: { id: facultyId },
      data: { isActive: actionType === "JOINING" },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: actionType === "JOINING" ? "FACULTY_JOINING" : "FACULTY_RELIEVED",
        entity: "Faculty",
        entityId: facultyId,
        description: `Faculty "${faculty.user?.name}" marked as ${actionType === "JOINING" ? "Joined (Form T.R.I Issued)" : "Relieved (Form T.R.1 Issued)"}`,
        collegeId: targetCollegeId || null,
      },
    });

    return NextResponse.json({ success: true, data: updatedAction });
  } catch (error: any) {
    console.error("Save faculty action error:", error);
    return NextResponse.json({ error: error.message || "Failed to save faculty action" }, { status: 500 });
  }
}
