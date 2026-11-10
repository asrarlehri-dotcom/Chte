/**
 * Admission CSV Parser, Normalizer & Template Generator
 */

export function parseCSVToRows(csvText: string): Record<string, string>[] {
  if (!csvText) return [];
  // Strip BOM
  const cleanText = csvText.replace(/^\uFEFF/, "").trim();
  if (!cleanText) return [];

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
    } else if (char === ',' && !inQuotes) {
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

  const digits = s.replace(/\D/g, "");
  if (digits.length === 13) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  }
  if (digits.length === 15) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  }
  if (/^\d{5}-\d{7}-\d{1}$/.test(s)) {
    return s;
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

