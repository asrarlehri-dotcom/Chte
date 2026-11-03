import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      studentName, 
      fatherName, 
      cnic, 
      dateOfBirth, 
      contactNumber, 
      email, 
      residentAddress,
      customFields,
      educationLevel,
      programId,
      groupId,
      bsAdmissionType,
      migrationSemester,
      session,
      gender,
      sscGroup,
      sscObtained,
      sscTotal,
      sscYear,
      sscBoard,
      hsscGroup,
      hsscObtained,
      hsscTotal,
      hsscYear,
      hsscBoard,
      bscGroup,
      bscObtained,
      bscTotal,
      bscYear,
      bscBoard,
      previousMarksJson,
      collegeId,
    } = data;

    // Fetch system settings for validation
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ["ADMISSION_REQUIRED_FIELDS", "ADMISSION_CNIC_LENGTH", "ADMISSION_CONTACT_LENGTH"] } }
    });
    
    let requiredFieldsStr = "studentName,fatherName,cnic,dateOfBirth,contactNumber,email";
    let cnicLenStr = "15";
    let contactLenStr = "11";
    
    settings.forEach(s => {
      if (s.key === "ADMISSION_REQUIRED_FIELDS") requiredFieldsStr = s.value;
      if (s.key === "ADMISSION_CNIC_LENGTH") cnicLenStr = s.value;
      if (s.key === "ADMISSION_CONTACT_LENGTH") contactLenStr = s.value;
    });

    const requiredFields = requiredFieldsStr.split(",").map(f => f.trim()).filter(Boolean);
    const cnicLen = parseInt(cnicLenStr) || 15;
    const contactLen = parseInt(contactLenStr) || 11;

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === "") {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    if (cnic && cnic.length !== cnicLen) {
      return NextResponse.json({ error: `CNIC must be exactly ${cnicLen} characters long.` }, { status: 400 });
    }
    
    if (contactNumber && contactNumber.length !== contactLen) {
      return NextResponse.json({ error: `Contact Number must be exactly ${contactLen} characters long.` }, { status: 400 });
    }

    // Basic validation
    if (cnic) {
      const existingAdmissionByCnic = await prisma.admission.findUnique({
        where: { cnic }
      });
      if (existingAdmissionByCnic) {
        return NextResponse.json({ error: "Admission with this CNIC already exists" }, { status: 400 });
      }
    }

    if (!studentName || !fatherName || !dateOfBirth || !contactNumber || !educationLevel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (email) {
      const existingAdmissionByEmail = await prisma.admission.findUnique({
        where: { email }
      });
      if (existingAdmissionByEmail) {
        return NextResponse.json({ error: "Admission with this Email address already exists" }, { status: 400 });
      }
    }

    // Resolve target College ID
    let targetCollegeId: string | null = collegeId || null;
    if (!targetCollegeId && programId) {
      const prog = await prisma.program.findUnique({ where: { id: programId }, select: { collegeId: true } });
      if (prog?.collegeId) targetCollegeId = prog.collegeId;
    }
    if (!targetCollegeId) {
      const defaultCollege = await prisma.college.findFirst({ where: { isActive: true }, select: { id: true } });
      targetCollegeId = defaultCollege?.id || null;
    }

    // Ensure session is strictly a 4-year or 2-year span, never a single year
    const { isValidSession, calculateSessionFromYear } = await import("@/lib/sessionHelper");
    let computedSession = session;
    if (!isValidSession(computedSession)) {
      const year = session && /^\d{4}$/.test(session) ? session : new Date().getFullYear();
      const type = educationLevel === "INTERMEDIATE" ? "INTERMEDIATE" : (bsAdmissionType || "REGULAR");
      computedSession = calculateSessionFromYear(year, type as any, migrationSemester);
    }

    const result = await prisma.$transaction(async (tx) => {
      const admission = await tx.admission.create({
        data: {
          studentName,
          fatherName,
          cnic: cnic || null,
          dateOfBirth: new Date(dateOfBirth),
          contactNumber,
          email: email || null,
          residentAddress: residentAddress || null,
          customFields: customFields || null,
          educationLevel,
          programId: programId || null,
          groupId: groupId || null,
          bsAdmissionType: bsAdmissionType || null,
          migrationSemester: bsAdmissionType === "MIGRATION" ? (migrationSemester ?? null) : null,
          session: computedSession || null,
          gender: gender || null,
          sscGroup: sscGroup || null,
          sscObtained: sscObtained ? Number(sscObtained) : null,
          sscTotal: sscTotal ? Number(sscTotal) : null,
          sscYear: sscYear ? Number(sscYear) : null,
          sscBoard: sscBoard || "BBISE QUETTA",
          hsscGroup: hsscGroup || null,
          hsscObtained: hsscObtained ? Number(hsscObtained) : null,
          hsscTotal: hsscTotal ? Number(hsscTotal) : null,
          hsscYear: hsscYear ? Number(hsscYear) : null,
          hsscBoard: hsscBoard || "BBISE QUETTA",
          bscGroup: bsAdmissionType === "BRIDGING_5TH" ? (bscGroup || null) : null,
          bscObtained: bsAdmissionType === "BRIDGING_5TH" ? (bscObtained ? Number(bscObtained) : null) : null,
          bscTotal: bsAdmissionType === "BRIDGING_5TH" ? (bscTotal ? Number(bscTotal) : null) : null,
          bscYear: bsAdmissionType === "BRIDGING_5TH" ? (bscYear ? Number(bscYear) : null) : null,
          bscBoard: bsAdmissionType === "BRIDGING_5TH" ? (bscBoard || "UNIVERSITY OF BALOCHISTAN") : null,
          previousMarksJson: previousMarksJson || null,
          collegeId: targetCollegeId,
        },
      });

      // Get sequence settings for Challan number
      let sequenceSetting = await tx.systemSetting.findUnique({ where: { key: "CHALLAN_SEQUENCE_CURRENT" } });
      if (!sequenceSetting) {
        await tx.systemSetting.create({ data: { key: "CHALLAN_SEQUENCE_CURRENT", value: "135622565" } });
        sequenceSetting = await tx.systemSetting.findUnique({ where: { key: "CHALLAN_SEQUENCE_CURRENT" } });
      }
      const currentSequence = Number(sequenceSetting?.value || "135622565");
      await tx.systemSetting.update({
        where: { key: "CHALLAN_SEQUENCE_CURRENT" },
        data: { value: String(currentSequence + 1) },
      });

      const feeKey = admission.educationLevel === "BS" ? "BS_ADMISSION" : "INTER_ADMISSION";
      let feeSetting = null;
      const admissionSessionNum = Number(admission.session);
      if (admissionSessionNum) {
        const overrides = await tx.feeSettings.findMany({
          where: { key: feeKey, session: { not: null } }
        });
        const validOverrides = overrides
          .filter(o => o.session && !isNaN(Number(o.session)) && Number(o.session) <= admissionSessionNum)
          .sort((a, b) => Number(b.session) - Number(a.session));
        if (validOverrides.length > 0) {
          feeSetting = validOverrides[0];
        }
      }
      if (!feeSetting) {
        feeSetting = await tx.feeSettings.findFirst({
          where: { key: feeKey, OR: [{ session: null }, { session: "" }] }
        });
      }
      const feeAmount = feeSetting?.amount ?? (admission.educationLevel === "BS" ? 8500 : 5000);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 14 days valid for admission fee

      const challan = await tx.challan.create({
        data: {
          challanNumber: String(currentSequence),
          cnic: admission.cnic || "N/A",
          applicantName: admission.studentName,
          fatherName: admission.fatherName,
          feeType: feeKey,
          feeLabel: feeSetting?.label || (admission.educationLevel === "BS" ? "BS Admission Fee" : "Intermediate Admission Fee"),
          amount: feeAmount,
          dueDate,
          educationLevel: admission.educationLevel,
          semester: 1,
          session: admission.session,
          gender: admission.gender,
          programId: admission.programId,
          admissionId: admission.id,
          collegeId: targetCollegeId,
        }
      });

      return { admission, challan };
    });
    
    return NextResponse.json({ success: true, admission: result.admission, challanId: result.challan.id }, { status: 201 });
  } catch (error) {
    console.error("Error submitting admission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionCollegeId = (session?.user as any)?.collegeId;
    const sessionRole = (session?.user as any)?.role;

    const { searchParams } = new URL(request.url);
    const educationLevel = searchParams.get("educationLevel");
    const requestedCollegeId = searchParams.get("collegeId");

    let collegeFilter: string | undefined = undefined;
    if (sessionCollegeId && sessionRole !== "CHTE_ADMIN" && sessionRole !== "SUPER_ADMIN") {
      collegeFilter = sessionCollegeId;
    } else if (requestedCollegeId) {
      collegeFilter = requestedCollegeId;
    }

    const admissions = await prisma.admission.findMany({
      where: {
        ...(educationLevel ? { educationLevel } : {}),
        ...(collegeFilter ? { collegeId: collegeFilter } : {}),
      },
      include: {
        program: { select: { name: true } },
        group:   { select: { name: true } },
        college: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch all matched students by CNIC
    const cnics = admissions.map(a => a.cnic).filter(Boolean) as string[];
    const students = await prisma.student.findMany({
      where: { cnic: { in: cnics } },
      select: { cnic: true, rollNumber: true }
    });

    const studentMap = students.reduce<Record<string, string>>((acc, s) => {
      if (s.cnic) {
        acc[s.cnic] = s.rollNumber;
      }
      return acc;
    }, {});

    // Attach rollNumber to admissions payload
    const resAdmissions = admissions.map((a: any) => ({
      ...a,
      rollNumber: studentMap[a.cnic] || null
    }));

    return NextResponse.json(resAdmissions);
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
