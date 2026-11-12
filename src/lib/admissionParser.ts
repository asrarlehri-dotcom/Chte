/**
 * Admission CSV/TSV Parser, Normalizer & Template Generator
 */

export const DEFAULT_ADMISSION_HEADERS = [
  "studentName",
  "fatherName",
  "cnic",
  "contactNumber",
  "email",
  "dateOfBirth",
  "gender",
  "program",
  "session",
  "bsAdmissionType",
  "residentAddress"
];

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r\n|\r|\n/)[0] || "";
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) return "\t";
  if (semiCount > commaCount && semiCount > tabCount) return ";";
  return ",";
}

export function isLikelyAdmissionHeader(str: string): boolean {
  if (!str) return false;
  const c = canonicalizeAdmissionHeader(str);
  return DEFAULT_ADMISSION_HEADERS.includes(c) || [
    "status", "challanNumber", "feeStatus", "sscGroup", "hsscGroup"
  ].includes(c);
}

export function parseCSVToRows(csvText: string, customDelimiter?: string): Record<string, string>[] {
  if (!csvText) return [];
  // Strip BOM
  const cleanText = csvText.replace(/^\uFEFF/, "").trim();
  if (!cleanText) return [];

  // Check if text is single-column vertical (each field on its own line)
  const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const tabLines = lines.filter(l => l.includes("\t")).length;
  const commaLines = lines.filter(l => l.includes(",")).length;

  // Case 1: Single-column vertical paste (e.g. copying from web preview or table column)
  if (tabLines === 0 && commaLines === 0 && lines.length >= 11) {
    const headerCandidates = lines.slice(0, 11).filter(isLikelyAdmissionHeader);
    if (headerCandidates.length >= 4) {
      // First 11 lines are headers!
      const headerKeys = lines.slice(0, 11).map(canonicalizeAdmissionHeader);
      const dataLines = lines.slice(11);
      const records: Record<string, string>[] = [];
      for (let i = 0; i < dataLines.length; i += 11) {
        const chunk = dataLines.slice(i, i + 11);
        const obj: Record<string, string> = {};
        for (let j = 0; j < 11; j++) {
          const key = headerKeys[j] || DEFAULT_ADMISSION_HEADERS[j];
          obj[key] = chunk[j] || "";
        }
        records.push(obj);
      }
      return records;
    } else {
      // Headerless vertical paste: starts directly with student #1 data
      const records: Record<string, string>[] = [];
      for (let i = 0; i < lines.length; i += 11) {
        const chunk = lines.slice(i, i + 11);
        const obj: Record<string, string> = {};
        for (let j = 0; j < 11; j++) {
          const key = DEFAULT_ADMISSION_HEADERS[j];
          obj[key] = chunk[j] || "";
        }
        records.push(obj);
      }
      return records;
    }
  }

  // Case 2: Multi-column rows (tab, comma, semicolon)
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

  if (rows.length === 0) return [];

  // Check if Row 0 contains headers or is raw data!
  const row0HeadersMatchCount = rows[0].filter(isLikelyAdmissionHeader).length;
  const row0IsHeaders = row0HeadersMatchCount >= Math.min(3, Math.max(2, Math.floor(rows[0].length * 0.4)));

  let headerKeys: string[] = [];
  let startIdx = 1;

  if (row0IsHeaders) {
    headerKeys = rows[0].map(h => canonicalizeAdmissionHeader(h.replace(/^["']|["']$/g, "").trim()));
    startIdx = 1;
  } else {
    // User pasted rows without a header row! Use default headers and keep Row 0 as student #1!
    headerKeys = DEFAULT_ADMISSION_HEADERS;
    startIdx = 0;
  }

  const result: Record<string, string>[] = [];
  for (let r = startIdx; r < rows.length; r++) {
    const values = rows[r];
    const obj: Record<string, string> = {};
    for (let c = 0; c < headerKeys.length; c++) {
      const key = headerKeys[c] || DEFAULT_ADMISSION_HEADERS[c];
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

  if (s.startsWith("student") || ["name", "fullname", "applicantname", "applicant"].includes(s)) return "studentName";
  if (s.startsWith("father") || ["guardian", "guardianname"].includes(s)) return "fatherName";
  if (s.startsWith("cnic") || s.startsWith("bform") || ["nic", "identity", "idcard", "id"].includes(s)) return "cnic";
  if (s.startsWith("contact") || s.startsWith("phone") || s.startsWith("mobile") || s.startsWith("cell")) return "contactNumber";
  if (s.startsWith("email") || s === "mail") return "email";
  if (s.startsWith("dateof") || s.startsWith("dob") || s.startsWith("birth")) return "dateOfBirth";
  if (s.startsWith("program") || s.startsWith("deg") || s.startsWith("dept") || ["course", "department"].includes(s)) return "program";
  if (s.startsWith("session") || s.startsWith("batch") || s.startsWith("academicsession")) return "session";
  if (s.startsWith("gender") || s === "sex") return "gender";
  if (s.startsWith("admission") || ["type", "mode", "bsadmissiontype"].includes(s)) return "bsAdmissionType";
  if (s.startsWith("status") || ["admissionstatus", "appstatus"].includes(s)) return "status";
  if (s.startsWith("challan") || ["challanno", "slip"].includes(s)) return "challanNumber";
  if (s.startsWith("fee") || ["paymentstatus"].includes(s)) return "feeStatus";
  if (s.startsWith("address") || ["residentaddress", "domicile", "city"].includes(s)) return "residentAddress";
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

  // Handle 4-digit district prefix: e.g. 5440-1234567-1 -> 54400-1234567-1
  const fourDigitMatch = s.match(/^(\d{4})-(\d{7})-(\d+)$/);
  if (fourDigitMatch) {
    return `${fourDigitMatch[1]}0-${fourDigitMatch[2]}-${fourDigitMatch[3].slice(-1)}`;
  }

  // If already formatted like XXXXX-XXXXXXX-X (or XXXXX-XXXXXXX-XX from Excel auto-fill drag)
  const dashedMatch = s.match(/^(\d{5})-(\d{7})-(\d+)$/);
  if (dashedMatch) {
    return `${dashedMatch[1]}-${dashedMatch[2]}-${dashedMatch[3].slice(-1)}`;
  }

  const digits = s.replace(/\D/g, "");
  // 12 digits: e.g. 544012345671 (missing 5th digit of district prefix)
  if (digits.length === 12) {
    return `${digits.slice(0, 4)}0-${digits.slice(4, 11)}-${digits.slice(11)}`;
  }
  if (digits.length === 13) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  }
  if (digits.length > 13) {
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
  } else if (digits.length === 8 && digits.startsWith("300")) {
    digits = "0" + digits;
  }

  if (digits.length === 11) {
    return digits;
  }
  if (digits.length >= 7 && digits.length <= 13) {
    return digits;
  }

  return "03000000000";
}

export function sanitizeEmail(val: string | null | undefined): string | null {
  if (!val) return null;
  let s = val.trim().toLowerCase();

  // Strip markdown link formatting: [email@domain.com](mailto:email@domain.com) or [text](mailto:email@domain.com)
  const mdMatch = s.match(/\[.*?\]\((?:mailto:)?([^)]+)\)/i);
  if (mdMatch) {
    s = mdMatch[1].trim();
  } else {
    s = s.replace(/^mailto:/i, "").trim();
  }

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
    if (digits.length === 12 && rawCnic.match(/^(\d{4})-(\d{7})-(\d+)$/)) {
      // 4-digit district code auto-padded to 5 digits (e.g. 5440 -> 54400)
      warnings.push({
        field: "CNIC",
        code: "WARNING_NOTICE",
        message: `CNIC '${rawCnic}' has 4-digit district prefix. Auto-padded to standard 13-digit format: ${sanitizedCnic}.`,
        tip: "Pakistani CNIC standard is 5-7-1 digits (e.g. 54400-1234567-1).",
        value: rawCnic
      });
    } else if (digits.length < 13) {
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
  } else if (contactDigits.length === 10 && contactDigits.startsWith("3")) {
    warnings.push({
      field: "Contact Number",
      code: "WARNING_NOTICE",
      message: `Contact Number '${rawContact}' missing leading 0 (Excel number format). Auto-prefixed to 0${contactDigits}.`,
      tip: "Standard mobile format is 03001234567.",
      value: rawContact
    });
  } else if (contactDigits.length >= 7 && contactDigits.length < 11) {
    warnings.push({
      field: "Contact Number",
      code: "WARNING_NOTICE",
      message: `Contact Number '${rawContact}' is short (${contactDigits.length} digits). Accepted with auto-formatting.`,
      tip: "Format: 03001234567 or 0333-8905018.",
      value: rawContact
    });
  } else if (contactDigits.length > 13) {
    errors.push({
      field: "Contact Number",
      code: "INVALID_CONTACT",
      message: `Invalid Contact Number: '${rawContact}' (${contactDigits.length} digits) is too long. Standard mobile number must be 11 digits.`,
      tip: "Format: 03001234567 or 0333-8905018.",
      value: rawContact
    });
  }

  // 5. Program
  let rawProg = (raw.program || raw.programName || raw.course || "").trim();
  const cleanProg = rawProg.replace(/^(department\s+of|dept\s+of|department|dept)\s+/i, "").trim().toLowerCase();

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
    let matched = programs.find(p =>
      p.id.toLowerCase() === rawLower ||
      p.code?.toLowerCase() === rawLower ||
      p.name.toLowerCase() === rawLower ||
      p.name.toLowerCase() === cleanProg ||
      p.name.toLowerCase().includes(rawLower) ||
      rawLower.includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(cleanProg) ||
      cleanProg.includes(p.name.toLowerCase()) ||
      (p.code && rawLower.includes(p.code.toLowerCase()))
    );

    if (!matched) {
      // Soft fuzzy match: words and prefixes
      const words = cleanProg.split(/\s+/).filter(w => w.length > 2 && !["bs", "fsc", "and", "the", "for", "in"].includes(w));
      matched = programs.find(p => {
        const pLower = p.name.toLowerCase();
        return words.some(w => pLower.includes(w) || (w.length >= 4 && pLower.includes(w.slice(0, 4))));
      });
    }

    if (matched) {
      if (matched.name.toLowerCase() !== rawLower) {
        warnings.push({
          field: "Program",
          code: "WARNING_NOTICE",
          message: `Program '${rawProg}' matched to college program '${matched.name}'.`,
          tip: `Auto-mapping to '${matched.name}'.`,
          value: rawProg
        });
      }
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
  const cleanedEmail = sanitizeEmail(rawEmail);
  if (rawEmail && !cleanedEmail) {
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
    email: cleanedEmail || rawEmail || null,
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


