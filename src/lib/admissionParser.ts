/**
 * Admission CSV/TSV Parser, Normalizer & Template Generator
 */

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r\n|\r|\n/)[0] || "";
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) return "\t";
  if (semiCount > commaCount && semiCount > tabCount) return ";";
  return ",";
}

export function parseCSVToRows(csvText: string, customDelimiter?: string): Record<string, string>[] {
  if (!csvText) return [];
  // Strip BOM
  const cleanText = csvText.replace(/^\uFEFF/, "").trim();
  if (!cleanText) return [];

  const delimiter = customDelimiter || detectDelimiter(cleanText);

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentField.trim());
      currentField = "";
      if (currentRow.some(col => col !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(col => col !== "")) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const rawHeaders = rows[0].map(h => h.replace(/^["']|["']$/g, "").trim());
  const headerKeys = rawHeaders.map(canonicalizeAdmissionHeader);

  const result: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const values = rows[r];
    const obj: Record<string, string> = {};
    for (let c = 0; c < headerKeys.length; c++) {
      const key = headerKeys[c];
      if (key) {
        obj[key] = (values[c] || "").replace(/^["']|["']$/g, "").trim();
      }
    }
    result.push(obj);
  }

  return result;
}

export function canonicalizeAdmissionHeader(raw: string): string {
  if (!raw) return "";
  const s = raw.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (["studentname", "student", "name", "fullname", "applicantname", "applicant"].includes(s)) return "studentName";
  if (["fathername", "father", "guardian", "guardianname"].includes(s)) return "fatherName";
  if (["cnic", "cnicno", "bform", "bformno", "nic", "identity", "idcard", "id"].includes(s)) return "cnic";
  if (["contact", "contactnumber", "contactno", "phone", "phonenumber", "mobile", "mobileno", "cell", "cellno"].includes(s)) return "contactNumber";
  if (["email", "emailaddress", "mail"].includes(s)) return "email";
  if (["dateofbirth", "dob", "birthdate", "birth"].includes(s)) return "dateOfBirth";
  if (["program", "programname", "programcode", "degree", "course", "department"].includes(s)) return "program";
  if (["session", "batch", "academicsession"].includes(s)) return "session";
  if (["gender", "sex"].includes(s)) return "gender";
  if (["admissiontype", "type", "mode", "bsadmissiontype"].includes(s)) return "bsAdmissionType";
  if (["status", "admissionstatus", "appstatus"].includes(s)) return "status";
  if (["challanno", "challannumber", "challan", "challanslip"].includes(s)) return "challanNumber";
  if (["feestatus", "fee", "paymentstatus"].includes(s)) return "feeStatus";
  if (["address", "residentaddress", "domicile", "city"].includes(s)) return "residentAddress";
  if (["sscgroup", "matricgroup"].includes(s)) return "sscGroup";
  if (["sscobtained", "matricobtained", "matricmarks"].includes(s)) return "sscObtained";
  if (["ssctotal", "matrictotal"].includes(s)) return "sscTotal";
  if (["sscyear", "matricyear"].includes(s)) return "sscYear";
  if (["sscboard", "matricboard"].includes(s)) return "sscBoard";
  if (["hsscgroup", "intergroup"].includes(s)) return "hsscGroup";
  if (["hsscobtained", "interobtained", "intermarks"].includes(s)) return "hsscObtained";
  if (["hssctotal", "intertotal"].includes(s)) return "hsscTotal";
  if (["hsscyear", "interyear"].includes(s)) return "hsscYear";
  if (["hsscboard", "interboard"].includes(s)) return "hsscBoard";

  return raw;
}

export function parseDateSafe(val: string | null | undefined): Date {
  if (!val || val === "N/A" || val === "-" || val === "null") {
    return new Date("2004-01-01");
  }

  const trimmed = val.trim();

  // Excel serial number (e.g. 38122 or 39000)
  if (/^\d{5}$/.test(trimmed)) {
    const excelDays = parseInt(trimmed, 10);
    const date = new Date((excelDays - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) return date;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    if (month > 12 && day <= 12) {
      const d = new Date(year, day - 1, month);
      if (!isNaN(d.getTime())) return d;
    } else {
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Standard YYYY-MM-DD
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime()) && isoDate.getFullYear() > 1900 && isoDate.getFullYear() < 2100) {
    return isoDate;
  }

  return new Date("2004-01-01");
}

export function sanitizeCNIC(val: string | null | undefined): string | null {
  if (!val) return null;
  const s = val.trim().toUpperCase();
  if (s === "N/A" || s === "-" || s === "NONE" || s === "NULL") return null;

  // If already formatted like XXXXX-XXXXXXX-X (or XXXXX-XXXXXXX-XX from Excel auto-fill drag)
  const dashedMatch = s.match(/^(\d{5})-(\d{7})-(\d+)$/);
  if (dashedMatch) {
    return `${dashedMatch[1]}-${dashedMatch[2]}-${dashedMatch[3].slice(-1)}`;
  }

  const digits = s.replace(/\D/g, "");
  if (digits.length === 13) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  }
  if (digits.length >= 13) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  }

  return null;
}

export function sanitizeContact(val: string | null | undefined): string {
  if (!val) return "03000000000";
  const s = val.trim();
  if (s === "N/A" || s === "-" || s === "NONE" || s === "NULL") return "03000000000";

  let digits = s.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) {
    digits = "0" + digits.slice(2);
  } else if (digits.length === 10 && digits.startsWith("3")) {
    digits = "0" + digits;
  }

  if (digits.length === 11) {
    return digits;
  }

  return "03000000000";
}

export function sanitizeEmail(val: string | null | undefined): string | null {
  if (!val) return null;
  const s = val.trim().toLowerCase();
  if (s === "n/a" || s === "-" || s === "none" || s === "null") return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    return s;
  }
  return null;
}

export function sanitizeGender(val: string | null | undefined): string {
  if (!val) return "MALE";
  const s = val.trim().toUpperCase();
  if (s.startsWith("F") || s === "GIRL" || s === "WOMAN") return "FEMALE";
  return "MALE";
}

export function getSampleCSV(educationLevel: "BS" | "INTERMEDIATE" = "BS", programSample = "BS Computer Science"): string {
  if (educationLevel === "BS") {
    return `Student Name,Father Name,CNIC,Contact,Email,Date of Birth,Gender,Program,Session,Admission Type,Address
Muhammad Ali,Ghulam Ali,54400-1234567-1,03001234567,m.ali@example.com,2004-03-15,MALE,${programSample},2026-2030,REGULAR,Sariab Road Quetta
Fatima Zahra,Ahmed Khan,54400-7654321-2,03337654321,fatima@example.com,2005-07-20,FEMALE,BS English,2026-2030,REGULAR,Nawan Killi Quetta`;
  } else {
    return `Student Name,Father Name,CNIC,Contact,Email,Date of Birth,Gender,Program,Session,Address
Bilal Ahmed,Tariq Mehmood,54400-9876543-1,03129876543,bilal@example.com,2007-04-10,MALE,F.Sc Pre-Medical,2026-2028,Brewery Road Quetta
Zainab Baloch,Abdul Qadir,54400-3456789-2,03453456789,zainab@example.com,2007-09-25,FEMALE,ICS,2026-2028,Smungli Road Quetta`;
  }
}

export type FieldDiagnostic = {
  field: "Student Name" | "Father Name" | "CNIC" | "Contact Number" | "Email" | "Program" | "Session" | "Date of Birth" | "General";
  code: "MISSING_NAME" | "INVALID_NAME" | "MISSING_CNIC" | "INVALID_CNIC" | "DUPLICATE_CNIC" | "MISSING_CONTACT" | "INVALID_CONTACT" | "MISSING_PROGRAM" | "UNRECOGNIZED_PROGRAM" | "INVALID_SESSION" | "INVALID_EMAIL" | "WARNING_NOTICE";
  message: string;
  tip?: string;
  value?: string;
};

export type RowValidationResult = {
  row: number;
  studentName: string;
  fatherName: string;
  cnic: string | null;
  contactNumber: string;
  email: string | null;
  program: string;
  session: string;
  isValid: boolean;
  errors: FieldDiagnostic[];
  warnings: FieldDiagnostic[];
  raw: Record<string, string>;
};

export function validateAdmissionRow(
  raw: Record<string, string>,
  rowIdx: number,
  programs: Array<{ id: string; name: string; code?: string }> = [],
  educationLevel: "BS" | "INTERMEDIATE" = "BS"
): RowValidationResult {
  const errors: FieldDiagnostic[] = [];
  const warnings: FieldDiagnostic[] = [];

  // 1. Student Name
  const rawStudent = (raw.studentName || raw.name || raw.applicantName || "").trim();
  if (!rawStudent) {
    errors.push({
      field: "Student Name",
      code: "MISSING_NAME",
      message: "Missing Student Name: Student name is required but was left empty.",
      tip: "Ensure the 'Student Name' column contains the applicant's full legal name.",
      value: ""
    });
  } else if (rawStudent.length < 2) {
    errors.push({
      field: "Student Name",
      code: "INVALID_NAME",
      message: `Invalid Student Name: '${rawStudent}' is too short (min 2 characters).`,
      tip: "Please enter the applicant's complete legal name.",
      value: rawStudent
    });
  }

  // 2. Father Name
  const rawFather = (raw.fatherName || raw.father || "").trim();
  if (!rawFather) {
    warnings.push({
      field: "Father Name",
      code: "WARNING_NOTICE",
      message: "Father Name is blank (will default to '—').",
      tip: "Recommended for registration and degree transcripts.",
      value: ""
    });
  }

  // 3. CNIC / B-Form
  const rawCnic = (raw.cnic || "").trim();
  let sanitizedCnic = sanitizeCNIC(rawCnic);

  if (!rawCnic || rawCnic.toUpperCase() === "N/A" || rawCnic === "-" || rawCnic === "NONE") {
    errors.push({
      field: "CNIC",
      code: "MISSING_CNIC",
      message: "Missing CNIC: CNIC / B-Form number is required but was left empty.",
      tip: "Provide a 13-digit CNIC formatted as 54400-1234567-1.",
      value: rawCnic
    });
  } else {
    const digits = rawCnic.replace(/\D/g, "");
    if (digits.length < 13) {
      errors.push({
        field: "CNIC",
        code: "INVALID_CNIC",
        message: `Invalid CNIC: '${rawCnic}' has only ${digits.length} digits. Standard CNIC requires 13 digits.`,
        tip: "Example valid format: 54400-1234567-1.",
        value: rawCnic
      });
    } else if (rawCnic.match(/-\d{2,}$/)) {
      warnings.push({
        field: "CNIC",
        code: "WARNING_NOTICE",
        message: `Auto-formatted CNIC: '${rawCnic}' has 2 digits after last hyphen (Excel auto-fill artifact).`,
        tip: `Formatted cleanly to standard 15-character CNIC: ${sanitizedCnic}.`,
        value: rawCnic
      });
    }
  }

  // 4. Contact Number
  const rawContact = (raw.contactNumber || raw.contact || raw.phone || "").trim();
  const contactDigits = rawContact.replace(/\D/g, "");
  if (!rawContact || rawContact.toUpperCase() === "N/A" || rawContact === "-") {
    errors.push({
      field: "Contact Number",
      code: "MISSING_CONTACT",
      message: "Missing Contact Number: Student mobile phone number is required but was left blank.",
      tip: "Provide an 11-digit mobile number like 03001234567.",
      value: rawContact
    });
  } else if (contactDigits.length < 10 || contactDigits.length > 13) {
    errors.push({
      field: "Contact Number",
      code: "INVALID_CONTACT",
      message: `Invalid Contact Number: '${rawContact}' (${contactDigits.length} digits). Standard mobile number must be 11 digits.`,
      tip: "Format: 03001234567 or 0333-8905018.",
      value: rawContact
    });
  }

  // 5. Program
  const rawProg = (raw.program || raw.programName || raw.course || "").trim();
  if (!rawProg) {
    errors.push({
      field: "Program",
      code: "MISSING_PROGRAM",
      message: "Missing Program: Program / Degree name is required.",
      tip: "Specify program name (e.g. 'BS Mathematics' or 'F.Sc Pre-Medical').",
      value: ""
    });
  } else if (programs && programs.length > 0) {
    const rawLower = rawProg.toLowerCase();
    const matched = programs.find(p =>
      p.id.toLowerCase() === rawLower ||
      p.code?.toLowerCase() === rawLower ||
      p.name.toLowerCase() === rawLower ||
      p.name.toLowerCase().includes(rawLower) ||
      rawLower.includes(p.name.toLowerCase()) ||
      (p.code && rawLower.includes(p.code.toLowerCase()))
    );

    if (!matched) {
      // Soft fuzzy match
      const words = rawLower.split(/\s+/).filter(w => w.length > 2 && !["bs", "fsc", "and", "the"].includes(w));
      const softMatched = programs.find(p => {
        const pLower = p.name.toLowerCase();
        return words.some(w => pLower.includes(w));
      });

      if (softMatched) {
        warnings.push({
          field: "Program",
          code: "WARNING_NOTICE",
          message: `Program '${rawProg}' matched to college program '${softMatched.name}'.`,
          tip: `Auto-mapping to '${softMatched.name}'.`,
          value: rawProg
        });
      } else {
        errors.push({
          field: "Program",
          code: "UNRECOGNIZED_PROGRAM",
          message: `Unrecognized Program: '${rawProg}' is not active in this college.`,
          tip: `Available programs: ${programs.map(p => p.name).slice(0, 4).join(", ")}...`,
          value: rawProg
        });
      }
    }
  }

  // 6. Session
  const rawSession = (raw.session || "").trim();
  if (!rawSession) {
    warnings.push({
      field: "Session",
      code: "WARNING_NOTICE",
      message: "Session is blank; system will auto-assign current academic session.",
      tip: "Recommended format: 2022-2026.",
      value: ""
    });
  } else {
    const spanMatch = rawSession.match(/^(\d{4})-(\d{4})$/);
    if (!spanMatch) {
      if (/^\d{4}$/.test(rawSession)) {
        warnings.push({
          field: "Session",
          code: "WARNING_NOTICE",
          message: `Session '${rawSession}' is a single year. System will convert to '${rawSession}-${parseInt(rawSession) + (educationLevel === "INTERMEDIATE" ? 2 : 4)}'.`,
          tip: "Use span format like 2022-2026.",
          value: rawSession
        });
      } else {
        errors.push({
          field: "Session",
          code: "INVALID_SESSION",
          message: `Invalid Session Format: '${rawSession}' is invalid.`,
          tip: "Session must be formatted as YYYY-YYYY (e.g. 2022-2026).",
          value: rawSession
        });
      }
    } else {
      const diff = Math.abs(parseInt(spanMatch[2]) - parseInt(spanMatch[1]));
      const expectedDiff = educationLevel === "INTERMEDIATE" ? 2 : 4;
      if (diff !== expectedDiff && diff !== 2 && diff !== 4) {
        warnings.push({
          field: "Session",
          code: "WARNING_NOTICE",
          message: `Session '${rawSession}' span is ${diff} years instead of expected ${expectedDiff} years.`,
          tip: `Typically ${expectedDiff} years for ${educationLevel} programs.`,
          value: rawSession
        });
      }
    }
  }

  // 7. Email
  const rawEmail = (raw.email || "").trim();
  if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    errors.push({
      field: "Email",
      code: "INVALID_EMAIL",
      message: `Invalid Email: '${rawEmail}' is not formatted correctly.`,
      tip: "Provide a valid email (e.g. name@gmail.com) or leave blank for auto-generation.",
      value: rawEmail
    });
  }

  return {
    row: rowIdx,
    studentName: rawStudent || "—",
    fatherName: rawFather || "—",
    cnic: sanitizedCnic || rawCnic || null,
    contactNumber: rawContact || "—",
    email: rawEmail || null,
    program: rawProg || "—",
    session: rawSession || "—",
    isValid: errors.length === 0,
    errors,
    warnings,
    raw
  };
}

export function validateAdmissionsBatch(
  rows: Record<string, string>[],
  programs: Array<{ id: string; name: string; code?: string }> = [],
  educationLevel: "BS" | "INTERMEDIATE" = "BS"
) {
  const results: RowValidationResult[] = [];
  const seenCnics = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const rowIdx = i + 1;
    const res = validateAdmissionRow(rows[i], rowIdx, programs, educationLevel);

    // Cross-row file check: Duplicate CNIC within same file
    if (res.cnic) {
      const cleanKey = res.cnic.replace(/\D/g, "");
      if (seenCnics.has(cleanKey)) {
        res.errors.push({
          field: "CNIC",
          code: "DUPLICATE_CNIC",
          message: `Duplicate CNIC in File: '${res.cnic}' appears in both Row ${seenCnics.get(cleanKey)} and Row ${rowIdx}.`,
          tip: "Each student in the import file must have a unique CNIC.",
          value: res.cnic
        });
        res.isValid = false;
      } else {
        seenCnics.set(cleanKey, rowIdx);
      }
    }

    results.push(res);
  }

  const validCount = results.filter(r => r.isValid).length;
  const errorCount = results.filter(r => !r.isValid).length;
  const warningCount = results.filter(r => r.warnings.length > 0 && r.isValid).length;

  return {
    total: rows.length,
    validCount,
    errorCount,
    warningCount,
    results
  };
}


