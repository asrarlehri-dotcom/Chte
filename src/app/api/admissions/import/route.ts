import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  parseCSVToRows,
  parseDateSafe,
  sanitizeCNIC,
  sanitizeContact,
  sanitizeEmail,
  sanitizeGender,
} from "@/lib/admissionParser";
import { calculateSessionFromYear, isValidSession } from "@/lib/sessionHelper";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const sessionCollegeId = (session.user as any)?.collegeId;
    const body = await request.json();

    let rawRecords: Record<string, string>[] = [];
    if (body.csvText) {
      rawRecords = parseCSVToRows(body.csvText);
    } else if (Array.isArray(body.records)) {
      rawRecords = body.records;
    }

    if (!rawRecords || rawRecords.length === 0) {
      return NextResponse.json({ error: "No valid admission records found to import." }, { status: 400 });
    }

    const educationLevel = (body.educationLevel || "BS").toUpperCase();

    // Determine target college
    let targetCollegeId: string | null = sessionCollegeId || body.collegeId || null;
    if (!targetCollegeId) {
      const defaultCollege = await prisma.college.findFirst({
        where: { isActive: true },
        select: { id: true }
      });
      targetCollegeId = defaultCollege?.id || null;
    }

    // Pre-fetch programs for matching
    const programs = await prisma.program.findMany({
      where: {
        ...(targetCollegeId ? { collegeId: targetCollegeId } : {}),
        isActive: true,
      },
      select: { id: true, name: true, code: true, collegeId: true }
    });

    // Pre-fetch all active CNICs in this college to check duplicates
    const cnicsInPayload = rawRecords
      .map(r => sanitizeCNIC(r.cnic))
      .filter(Boolean) as string[];

    const existingByCnic = await prisma.admission.findMany({
      where: { cnic: { in: cnicsInPayload } },
      select: { cnic: true }
    });
    const existingCnicSet = new Set(existingByCnic.map(e => e.cnic));

    // Pre-fetch existing emails
    const emailsInPayload = rawRecords
      .map(r => sanitizeEmail(r.email))
      .filter(Boolean) as string[];

    const existingByEmail = await prisma.admission.findMany({
      where: { email: { in: emailsInPayload } },
      select: { email: true }
    });
    const existingEmailSet = new Set(existingByEmail.map(e => e.email));

    // Sequence for challans
    let sequenceSetting = await prisma.systemSetting.findUnique({
      where: { key: "CHALLAN_SEQUENCE_CURRENT" }
    });
    if (!sequenceSetting) {
      await prisma.systemSetting.create({
        data: { key: "CHALLAN_SEQUENCE_CURRENT", value: "135622565" }
      });
      sequenceSetting = await prisma.systemSetting.findUnique({
        where: { key: "CHALLAN_SEQUENCE_CURRENT" }
      });
    }
    let currentSequence = Number(sequenceSetting?.value || "135622565");

    // Fee settings
    const feeKey = educationLevel === "BS" ? "BS_ADMISSION" : "INTER_ADMISSION";
    const defaultFee = await prisma.feeSettings.findFirst({
      where: { key: feeKey, OR: [{ session: null }, { session: "" }] }
    });
    const feeAmount = defaultFee?.amount ?? (educationLevel === "BS" ? 8500 : 5000);
    const feeLabel = defaultFee?.label || (educationLevel === "BS" ? "BS Admission Fee" : "Intermediate Admission Fee");

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors: { row: number; student: string; reason: string }[] = [];

    // Process each record with resilience
    for (let i = 0; i < rawRecords.length; i++) {
      const rowIdx = i + 1;
      const raw = rawRecords[i];

      const studentName = (raw.studentName || raw.name || raw.applicantName || "").trim();
      const fatherName = (raw.fatherName || raw.father || "—").trim();

      if (!studentName) {
        failedCount++;
        errors.push({ row: rowIdx, student: "Unknown", reason: "Student name is required." });
        continue;
      }

      // Sanitize CNIC
      let cnic = sanitizeCNIC(raw.cnic);
      if (cnic && existingCnicSet.has(cnic)) {
        skippedCount++;
        errors.push({ row: rowIdx, student: studentName, reason: `CNIC ${cnic} already exists in admissions.` });
        continue;
      }

      // If CNIC is empty, generate an official placeholder
      if (!cnic) {
        const randomMid = Math.floor(1000000 + Math.random() * 9000000);
        const randomEnd = Math.floor(1 + Math.random() * 9);
        cnic = `54400-${randomMid}-${randomEnd}`;
      }
      existingCnicSet.add(cnic);

      // Contact
      const contactNumber = sanitizeContact(raw.contactNumber || raw.contact || raw.phone);

      // Date of Birth
      const dateOfBirth = parseDateSafe(raw.dateOfBirth || raw.dob);

      // Email
      let email = sanitizeEmail(raw.email);
      if (email && existingEmailSet.has(email)) {
        // Append unique suffix so import does not break
        const [userPart, domainPart] = email.split("@");
        email = `${userPart}+${Date.now().toString().slice(-4)}${i}@${domainPart}`;
      } else if (!email) {
        const cleanName = studentName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanCnicDigits = cnic.replace(/\D/g, "").slice(-4);
        email = `${cleanName || "student"}.${cleanCnicDigits || i}@college.edu.pk`;
      }
      existingEmailSet.add(email);

      // Match Program
      const rawProg = (raw.program || raw.programName || raw.course || "").trim().toLowerCase();
      let matchedProgram = programs.find(p =>
        p.id.toLowerCase() === rawProg ||
        p.code?.toLowerCase() === rawProg ||
        p.name.toLowerCase() === rawProg
      );

      if (!matchedProgram && rawProg) {
        // Fuzzy contains
        matchedProgram = programs.find(p =>
          p.name.toLowerCase().includes(rawProg) ||
          rawProg.includes(p.name.toLowerCase()) ||
          (p.code && rawProg.includes(p.code.toLowerCase()))
        );
      }

      // Fallback to first program if not matched
      if (!matchedProgram && programs.length > 0) {
        matchedProgram = programs[0];
      }

      // Session
      let sessionVal = (raw.session || "").trim();
      if (!isValidSession(sessionVal)) {
        const year = /^\d{4}$/.test(sessionVal) ? sessionVal : new Date().getFullYear();
        sessionVal = calculateSessionFromYear(year, educationLevel === "INTERMEDIATE" ? "INTERMEDIATE" : "REGULAR");
      }

      const gender = sanitizeGender(raw.gender);
      const bsAdmissionType = raw.bsAdmissionType || "REGULAR";
      const residentAddress = raw.residentAddress || raw.address || null;

      try {
        currentSequence++;
        const challanNumber = String(currentSequence);

        await prisma.$transaction(async (tx) => {
          const admission = await tx.admission.create({
            data: {
              studentName,
              fatherName,
              cnic,
              dateOfBirth,
              contactNumber,
              email,
              residentAddress,
              educationLevel,
              programId: matchedProgram?.id || null,
              bsAdmissionType: educationLevel === "BS" ? bsAdmissionType : null,
              session: sessionVal,
              gender,
              collegeId: targetCollegeId,
              status: "PENDING",
            }
          });

          await tx.challan.create({
            data: {
              challanNumber,
              cnic,
              applicantName: studentName,
              fatherName,
              feeType: feeKey,
              feeLabel,
              amount: feeAmount,
              dueDate,
              educationLevel,
              semester: 1,
              session: sessionVal,
              gender,
              programId: matchedProgram?.id || null,
              admissionId: admission.id,
              collegeId: targetCollegeId,
            }
          });
        });

        importedCount++;
      } catch (err: any) {
        failedCount++;
        errors.push({
          row: rowIdx,
          student: studentName,
          reason: err?.message || "Database insert error."
        });
      }
    }

    // Persist latest challan sequence
    await prisma.systemSetting.update({
      where: { key: "CHALLAN_SEQUENCE_CURRENT" },
      data: { value: String(currentSequence + 1) }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      total: rawRecords.length,
      imported: importedCount,
      skipped: skippedCount,
      failed: failedCount,
      errors
    });
  } catch (error: any) {
    console.error("Bulk admission import error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

