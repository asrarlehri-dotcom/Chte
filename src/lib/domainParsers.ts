import { detectDelimiter } from "./admissionParser";

export type UniversalFieldDiagnostic = {
  field: string;
  code: string;
  message: string;
  tip?: string;
  value?: string;
};

export type UniversalRowValidation = {
  row: number;
  primaryTitle: string;
  secondaryTitle?: string;
  columns: Array<{ label: string; value: string }>;
  isValid: boolean;
  errors: UniversalFieldDiagnostic[];
  warnings: UniversalFieldDiagnostic[];
  raw: Record<string, string>;
};

export type UniversalBatchResult = {
  total: number;
  validCount: number;
  errorCount: number;
  warningCount: number;
  results: UniversalRowValidation[];
};

// -------------------------------------------------------------
// Helper: Generic CSV line tokenizer handling quotes & delimiters
// -------------------------------------------------------------
export function parseGenericCSV(csvText: string, customDelimiter?: string): Record<string, string>[] {
  if (!csvText || !csvText.trim()) return [];

  const cleanText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleanText.split("\n").filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  let firstLine = lines[0].trim();
  if ((firstLine.startsWith('"') && firstLine.endsWith('"')) || (firstLine.startsWith("'") && firstLine.endsWith("'"))) {
    const inner = firstLine.slice(1, -1);
    if (inner.includes("\t") || inner.includes(",") || inner.includes(";")) {
      firstLine = inner;
    }
  }
  const delimiter = customDelimiter || detectDelimiter(firstLine);

  const parseLine = (rawLine: string): string[] => {
    let line = rawLine.trim();
    // If the entire line is wrapped in quotes and has delimiters inside, unwrap outer quotes
    if ((line.startsWith('"') && line.endsWith('"')) || (line.startsWith("'") && line.endsWith("'"))) {
      const inner = line.slice(1, -1);
      if (inner.includes("\t") || inner.includes(",") || inner.includes(";")) {
        line = inner;
      }
    }

    const entries: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        entries.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    entries.push(current.trim());
    return entries;
  };

  const parsedRows = lines.map(parseLine);
  if (parsedRows.length === 0) return [];

  // Determine if row 0 is headers or data
  const row0 = parsedRows[0].map(h => h.replace(/^["']|["']$/g, "").trim());
  const row0Clean = row0.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const isHeaderWord = (s: string) => [
    "title", "coursetitle", "name", "coursename", "code", "coursecode", "subjectcode",
    "credithours", "credits", "ch", "coursetype", "type", "session", "semester", "program", "programname",
    "faculty", "teacher", "instructor", "department", "dept", "room", "slot", "timeslot", "day",
    "examdate", "date", "midterm", "assignment", "final", "totalmarks", "marks", "rollno", "rollnumber", "cnic"
  ].includes(s);

  const headerMatches = row0Clean.filter(isHeaderWord).length;
  const row0IsHeaders = headerMatches >= Math.min(2, Math.max(1, Math.floor(row0.length * 0.3)));

  let headers: string[] = [];
  let startIdx = 1;

  if (row0IsHeaders) {
    headers = row0;
    startIdx = 1;
  } else {
    // Row 0 is raw course data without headers!
    headers = ["Course Title", "Course Code", "Credit Hours", "Course Type", "Session", "Semester", "Program", "Faculty"];
    startIdx = 0;
  }

  const rows: Record<string, string>[] = [];
  for (let i = startIdx; i < parsedRows.length; i++) {
    const values = parsedRows[i];
    if (values.every(v => v === "")) continue;
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
      obj[cleanHeader] = (values[idx] || "").replace(/^["']|["']$/g, "").trim();
      obj[header] = (values[idx] || "").replace(/^["']|["']$/g, "").trim();
    });
    rows.push(obj);
  }

  return rows;
}

// =============================================================
// 1. COURSES PARSER & VALIDATOR
// =============================================================
export function validateCourseBatch(
  rows: Record<string, string>[],
  programs: Array<{ id: string; name: string; code?: string }> = [],
  departments: Array<{ id: string; name: string; code?: string }> = []
): UniversalBatchResult {
  const results: UniversalRowValidation[] = [];
  const seenCodes = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const rowIdx = i + 1;
    const raw = rows[i];
    const errors: UniversalFieldDiagnostic[] = [];
    const warnings: UniversalFieldDiagnostic[] = [];

    // Course Code
    const code = (raw.code || raw.coursecode || raw["course code"] || raw.subjectcode || "").trim().toUpperCase();
    if (!code) {
      errors.push({
        field: "Course Code",
        code: "MISSING_CODE",
        message: "Course Code is required (e.g. CS-101, ENG-201, MATH-102).",
        tip: "Provide a unique course code in the 'Code' column.",
        value: ""
      });
    } else if (code.length < 2) {
      errors.push({
        field: "Course Code",
        code: "INVALID_CODE",
        message: `Course code '${code}' is too short.`,
        tip: "Standard format: CS-101 or MATH-201.",
        value: code
      });
    }

    // Duplicate check in same file: Warning so import is not blocked
    if (code) {
      if (seenCodes.has(code)) {
        warnings.push({
          field: "Course Code",
          code: "DUPLICATE_CODE",
          message: `Notice: Course Code '${code}' appears in both Row ${seenCodes.get(code)} and Row ${rowIdx}. Ensure unique codes if these are different subjects.`,
          tip: "Each course in the scheme should ideally have a distinct code.",
          value: code
        });
      } else {
        seenCodes.set(code, rowIdx);
      }
    }

    // Title
    const title = (raw.title || raw.coursetitle || raw["course title"] || raw.name || raw.coursename || "").trim();
    if (!title) {
      errors.push({
        field: "Course Title",
        code: "MISSING_TITLE",
        message: "Course Title is required (e.g. Data Structures & Algorithms).",
        tip: "Enter the official full title of the subject.",
        value: ""
      });
    }

    // Credit Hours
    const rawCredits = (raw.credithours || raw.credits || raw["credit hours"] || raw.ch || raw.credithoursformat || "").trim();
    let parsedCreditTotal = 3;
    let creditFormat = "3(3-0)";

    if (!rawCredits) {
      warnings.push({
        field: "Credit Hours",
        code: "DEFAULT_CREDITS",
        message: "Credit Hours blank; system will default to 3 Credit Hours '3(3-0)'.",
        tip: "Standard formats: 3, 4, 3(3-0), 4(3-1).",
        value: ""
      });
    } else {
      const match = rawCredits.match(/^(\d+)\s*\(\s*(\d+)\s*[\-\/]\s*(\d+)\s*\)$/);
      if (match) {
        parsedCreditTotal = parseInt(match[1]);
        creditFormat = `${match[1]}(${match[2]}-${match[3]})`;
      } else {
        const num = parseInt(rawCredits);
        if (isNaN(num) || num <= 0 || num > 12) {
          errors.push({
            field: "Credit Hours",
            code: "INVALID_CREDITS",
            message: `Credit hours '${rawCredits}' is invalid. Must be between 1 and 12.`,
            tip: "Use numbers like 3 or 4, or formatted like 4(3-1).",
            value: rawCredits
          });
        } else {
          parsedCreditTotal = num;
          creditFormat = `${num}(${num}-0)`;
        }
      }
    }

    // Semester
    const rawSem = (raw.semester || raw.sem || "").trim();
    let semNum = parseInt(rawSem);
    if (!rawSem) {
      warnings.push({
        field: "Semester",
        code: "DEFAULT_SEMESTER",
        message: "Semester was empty; defaulting to Semester 1.",
        tip: "Specify semester from 1 to 8.",
        value: ""
      });
      semNum = 1;
    } else if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      errors.push({
        field: "Semester",
        code: "INVALID_SEMESTER",
        message: `Semester '${rawSem}' is invalid. Must be a number between 1 and 8.`,
        tip: "Enter a digit from 1 to 8 (e.g. 1, 2, 3).",
        value: rawSem
      });
    }

    // Program matching
    const rawProg = (raw.program || raw.programname || raw.programcode || "").trim();
    if (!rawProg && programs.length > 0) {
      warnings.push({
        field: "Program",
        code: "DEFAULT_PROGRAM",
        message: `Program left blank; will assign to active program '${programs[0].name}'.`,
        tip: "Specify target program name or code.",
        value: ""
      });
    } else if (rawProg && programs.length > 0) {
      const rawLower = rawProg.toLowerCase();
      const matched = programs.find(p =>
        p.id.toLowerCase() === rawLower ||
        p.code?.toLowerCase() === rawLower ||
        p.name.toLowerCase() === rawLower ||
        p.name.toLowerCase().includes(rawLower) ||
        rawLower.includes(p.name.toLowerCase())
      );
      if (!matched) {
        warnings.push({
          field: "Program",
          code: "UNRECOGNIZED_PROGRAM",
          message: `Program '${rawProg}' not exact match; will associate with '${programs[0].name}'.`,
          tip: `Available: ${programs.map(p => p.name).slice(0, 3).join(", ")}...`,
          value: rawProg
        });
      }
    }

    // Course Type
    const rawType = (raw.coursetype || raw.type || "").trim().toUpperCase();
    const courseType = ["CORE", "FOUNDATION_ALLIED", "GENERAL_MINOR", "COMPULSORY_GENED", "ELECTIVE_MAJOR", "LAB_PRACTICAL", "CAPSTONE_THESIS", "THEORY", "PRACTICAL"].includes(rawType)
      ? rawType
      : "CORE";

    results.push({
      row: rowIdx,
      primaryTitle: title || code || "Untitled Course",
      secondaryTitle: `Code: ${code || "—"} • Sem: ${semNum || 1} • Credits: ${creditFormat}`,
      columns: [
        { label: "Code", value: code || "—" },
        { label: "Title", value: title || "—" },
        { label: "Credits", value: creditFormat },
        { label: "Semester", value: String(semNum || 1) },
        { label: "Type", value: courseType }
      ],
      isValid: errors.length === 0,
      errors,
      warnings,
      raw: {
        ...raw,
        code,
        title,
        creditHours: String(parsedCreditTotal),
        creditHoursFormat: creditFormat,
        semester: String(semNum || 1),
        courseType
      }
    });
  }

  return {
    total: rows.length,
    validCount: results.filter(r => r.isValid).length,
    errorCount: results.filter(r => !r.isValid).length,
    warningCount: results.filter(r => r.warnings.length > 0 && r.isValid).length,
    results
  };
}

export function getCourseSampleCSV(): string {
  return `Code,Title,Credit Hours,Semester,Type,Program
CS-101,Introduction to Information Technology,3(3-0),1,CORE,BS Computer Science
CS-102,Programming Fundamentals,4(3-1),1,CORE,BS Computer Science
ENG-101,English Composition & Comprehension,3(3-0),1,COMPULSORY_GENED,BS Computer Science
MATH-101,Calculus & Analytical Geometry,3(3-0),1,FOUNDATION_ALLIED,BS Computer Science
PHY-101,Applied Physics,3(3-0),1,GENERAL_MINOR,BS Computer Science`;
}

// =============================================================
// 2. DEPARTMENTS & PROGRAMS PARSER & VALIDATOR
// =============================================================
export function validateDepartmentBatch(
  rows: Record<string, string>[]
): UniversalBatchResult {
  const results: UniversalRowValidation[] = [];
  const seenCodes = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const rowIdx = i + 1;
    const raw = rows[i];
    const errors: UniversalFieldDiagnostic[] = [];
    const warnings: UniversalFieldDiagnostic[] = [];

    // Department Name
    const name = (raw.name || raw.departmentname || raw["department name"] || raw.dept || "").trim();
    if (!name) {
      errors.push({
        field: "Department Name",
        code: "MISSING_NAME",
        message: "Department Name is required (e.g. Department of Computer Science).",
        tip: "Provide full official department name in 'Department Name' column.",
        value: ""
      });
    }

    // Department Code
    const code = (raw.code || raw.departmentcode || raw["department code"] || raw.shortcode || "").trim().toUpperCase();
    if (!code) {
      errors.push({
        field: "Department Code",
        code: "MISSING_CODE",
        message: "Department Code is required (e.g. CS, MATH, CHEM, ENG).",
        tip: "Enter a 2-5 letter short acronym for the department.",
        value: ""
      });
    } else if (seenCodes.has(code)) {
      errors.push({
        field: "Department Code",
        code: "DUPLICATE_CODE",
        message: `Duplicate Department Code '${code}' found in both Row ${seenCodes.get(code)} and Row ${rowIdx}.`,
        tip: "Each department must have a unique short code.",
        value: code
      });
    } else {
      seenCodes.set(code, rowIdx);
    }

    // HOD Name
    const hod = (raw.hod || raw.hodname || raw["head of department"] || "").trim();
    if (!hod) {
      warnings.push({
        field: "HOD Name",
        code: "BLANK_HOD",
        message: "Head of Department is blank (can be assigned later).",
        tip: "Optional: name of Chairman / HOD.",
        value: ""
      });
    }

    // Email
    const email = (raw.email || raw.deptemail || "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        field: "Email",
        code: "INVALID_EMAIL",
        message: `Department email '${email}' is not formatted correctly.`,
        tip: "Use format: dept@college.edu.pk",
        value: email
      });
    }

    results.push({
      row: rowIdx,
      primaryTitle: name || "Untitled Department",
      secondaryTitle: `Code: ${code || "—"} • HOD: ${hod || "Not Assigned"}`,
      columns: [
        { label: "Code", value: code || "—" },
        { label: "Department Name", value: name || "—" },
        { label: "HOD", value: hod || "—" },
        { label: "Email", value: email || "—" }
      ],
      isValid: errors.length === 0,
      errors,
      warnings,
      raw: {
        ...raw,
        name,
        code,
        hodName: hod || "—",
        email
      }
    });
  }

  return {
    total: rows.length,
    validCount: results.filter(r => r.isValid).length,
    errorCount: results.filter(r => !r.isValid).length,
    warningCount: results.filter(r => r.warnings.length > 0 && r.isValid).length,
    results
  };
}

export function getDepartmentSampleCSV(): string {
  return `Department Name,Department Code,HOD Name,Email,Phone
Department of Computer Science,CS,Dr. Muhammad Usman,cs@college.edu.pk,03001234567
Department of Mathematics,MATH,Prof. Tariq Baloch,math@college.edu.pk,03337654321
Department of Chemistry,CHEM,Dr. Fatima Zahra,chem@college.edu.pk,03129876543
Department of English Literature,ENG,Prof. Ayesha Lehri,english@college.edu.pk,03456789012`;
}

// =============================================================
// 3. TIMETABLE PARSER & VALIDATOR
// =============================================================
const VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function validateTimetableBatch(
  rows: Record<string, string>[],
  programs: Array<{ id: string; name: string; code?: string }> = [],
  courses: Array<{ id: string; title: string; code: string; programId?: string }> = []
): UniversalBatchResult {
  const results: UniversalRowValidation[] = [];
  const seenSlots = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const rowIdx = i + 1;
    const raw = rows[i];
    const errors: UniversalFieldDiagnostic[] = [];
    const warnings: UniversalFieldDiagnostic[] = [];

    // Day of Week
    let rawDay = (raw.day || raw.dayofweek || raw["day of week"] || "").trim();
    if (!rawDay) {
      errors.push({
        field: "Day",
        code: "MISSING_DAY",
        message: "Day of week is required (e.g. Monday, Tuesday).",
        tip: "Valid days: Monday through Saturday.",
        value: ""
      });
    } else {
      const matchedDay = VALID_DAYS.find(d => d.toLowerCase() === rawDay.toLowerCase());
      if (matchedDay) {
        rawDay = matchedDay;
      } else {
        errors.push({
          field: "Day",
          code: "INVALID_DAY",
          message: `Day '${rawDay}' is invalid.`,
          tip: "Use full day name: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.",
          value: rawDay
        });
      }
    }

    // Start & End Time
    let startTime = (raw.starttime || raw["start time"] || raw.time || "").trim();
    let endTime = (raw.endtime || raw["end time"] || "").trim();

    if (startTime.includes("-") && !endTime) {
      const parts = startTime.split("-").map(p => p.trim());
      startTime = parts[0];
      endTime = parts[1] || "";
    }

    if (!startTime) {
      errors.push({
        field: "Time Slot",
        code: "MISSING_TIME",
        message: "Start Time is required (format HH:MM, e.g. 09:00).",
        tip: "Format: 09:00 or 10:30.",
        value: ""
      });
    } else if (!/^\d{1,2}:\d{2}$/.test(startTime)) {
      errors.push({
        field: "Time Slot",
        code: "INVALID_TIME_FORMAT",
        message: `Start Time '${startTime}' is not formatted as HH:MM.`,
        tip: "Example: 09:00, 10:00, 11:30.",
        value: startTime
      });
    }

    if (!endTime) {
      // Default to +1 hour
      if (/^\d{1,2}:\d{2}$/.test(startTime)) {
        const [h, m] = startTime.split(":").map(Number);
        const endH = String((h + 1) % 24).padStart(2, "0");
        endTime = `${endH}:${String(m).padStart(2, "0")}`;
        warnings.push({
          field: "End Time",
          code: "AUTO_END_TIME",
          message: `End time missing; auto-calculated as 1-hour slot '${endTime}'.`,
          tip: "Specify end time in 'End Time' column.",
          value: endTime
        });
      }
    }

    // Semester
    const rawSem = (raw.semester || raw.sem || "1").trim();
    const semNum = parseInt(rawSem) || 1;

    // Course
    const rawCourse = (raw.course || raw.coursecode || raw.subject || raw.title || "").trim();
    if (!rawCourse) {
      errors.push({
        field: "Course",
        code: "MISSING_COURSE",
        message: "Course code or title is required.",
        tip: "Enter course code (e.g. CS-101) or title.",
        value: ""
      });
    }

    // Faculty & Room
    const teacher = (raw.teacher || raw.faculty || raw.instructor || "—").trim();
    const room = (raw.room || raw.hall || raw.classroom || "Room 1").trim();

    // Conflict detection in file (same day, same room, overlapping time)
    const slotKey = `${rawDay}_${startTime}_${room}`.toLowerCase();
    if (seenSlots.has(slotKey)) {
      warnings.push({
        field: "Room Conflict",
        code: "ROOM_CONFLICT",
        message: `Room '${room}' has multiple classes at ${rawDay} ${startTime} (Rows ${seenSlots.get(slotKey)} & ${rowIdx}).`,
        tip: "Assign different rooms to avoid overlap.",
        value: room
      });
    } else {
      seenSlots.set(slotKey, rowIdx);
    }

    results.push({
      row: rowIdx,
      primaryTitle: `${rawCourse} (${rawDay})`,
      secondaryTitle: `Time: ${startTime} - ${endTime} • Room: ${room} • Teacher: ${teacher}`,
      columns: [
        { label: "Day", value: rawDay || "—" },
        { label: "Time", value: `${startTime} - ${endTime}` },
        { label: "Course", value: rawCourse || "—" },
        { label: "Semester", value: String(semNum) },
        { label: "Teacher", value: teacher },
        { label: "Room", value: room }
      ],
      isValid: errors.length === 0,
      errors,
      warnings,
      raw: {
        ...raw,
        dayOfWeek: rawDay,
        startTime,
        endTime,
        semester: String(semNum),
        course: rawCourse,
        teacher,
        room
      }
    });
  }

  return {
    total: rows.length,
    validCount: results.filter(r => r.isValid).length,
    errorCount: results.filter(r => !r.isValid).length,
    warningCount: results.filter(r => r.warnings.length > 0 && r.isValid).length,
    results
  };
}

export function getTimetableSampleCSV(): string {
  return `Day,Start Time,End Time,Course,Semester,Teacher,Room,Program
Monday,09:00,10:00,CS-101 Programming Fundamentals,1,Prof. Tariq Mehmood,Lab 1,BS Computer Science
Monday,10:00,11:00,ENG-101 English Composition,1,Dr. Ayesha Lehri,Room 102,BS Computer Science
Tuesday,09:00,10:00,MATH-101 Calculus,1,Prof. Bilal Ahmed,Room 101,BS Computer Science
Wednesday,11:00,12:00,PHY-101 Applied Physics,1,Dr. Fatima Zahra,Physics Lab,BS Computer Science
Thursday,10:00,11:00,CS-102 Database Systems,3,Prof. Usman Khan,Lab 2,BS Computer Science`;
}

// =============================================================
// 4. DATESHEET PARSER & VALIDATOR
// =============================================================
export function validateDatesheetBatch(
  rows: Record<string, string>[],
  programs: Array<{ id: string; name: string; code?: string }> = [],
  courses: Array<{ id: string; title: string; code: string }> = []
): UniversalBatchResult {
  const results: UniversalRowValidation[] = [];
  const seenExams = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const rowIdx = i + 1;
    const raw = rows[i];
    const errors: UniversalFieldDiagnostic[] = [];
    const warnings: UniversalFieldDiagnostic[] = [];

    // Exam Date
    const rawDate = (raw.date || raw.examdate || raw["exam date"] || raw.day || "").trim();
    let parsedDate: Date | null = null;
    let formattedDateStr = "";

    if (!rawDate) {
      errors.push({
        field: "Exam Date",
        code: "MISSING_DATE",
        message: "Exam Date is required (format YYYY-MM-DD or DD/MM/YYYY).",
        tip: "Enter date e.g. 2026-06-15 or 15/06/2026.",
        value: ""
      });
    } else {
      const dmy = rawDate.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      const ymd = rawDate.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
      if (ymd) {
        parsedDate = new Date(`${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`);
      } else if (dmy) {
        parsedDate = new Date(`${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`);
      } else {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) parsedDate = d;
      }

      if (!parsedDate || isNaN(parsedDate.getTime())) {
        errors.push({
          field: "Exam Date",
          code: "INVALID_DATE_FORMAT",
          message: `Date '${rawDate}' could not be parsed.`,
          tip: "Use format YYYY-MM-DD (e.g. 2026-06-15).",
          value: rawDate
        });
      } else {
        formattedDateStr = parsedDate.toISOString().split("T")[0];
      }
    }

    // Start & End Time
    let startTime = (raw.starttime || raw["start time"] || raw.time || "09:30").trim();
    let endTime = (raw.endtime || raw["end time"] || "12:30").trim();

    if (startTime.includes("-") && !endTime) {
      const parts = startTime.split("-").map(p => p.trim());
      startTime = parts[0];
      endTime = parts[1] || "";
    }

    if (!startTime) {
      errors.push({
        field: "Time",
        code: "MISSING_TIME",
        message: "Exam start time is required (e.g. 09:30).",
        tip: "Format: 09:30 or 14:00.",
        value: ""
      });
    }

    // Course
    const rawCourse = (raw.course || raw.coursecode || raw.subject || raw.title || "").trim();
    if (!rawCourse) {
      errors.push({
        field: "Course",
        code: "MISSING_COURSE",
        message: "Exam subject / course name is required.",
        tip: "Enter course title or course code.",
        value: ""
      });
    }

    // Exam Type
    let examType = (raw.examtype || raw.type || raw["exam type"] || "FINAL_TERM").trim().toUpperCase();
    if (!["MIDTERM", "FINAL", "FINAL_TERM", "SUPPLEMENTARY"].includes(examType)) {
      examType = examType.includes("MID") ? "MIDTERM" : "FINAL_TERM";
    }

    const semNum = parseInt(raw.semester || raw.sem || "1") || 1;
    const room = (raw.room || raw.hall || raw["exam hall"] || "Main Hall").trim();

    // Check duplicate subject on same date & semester
    const examKey = `${formattedDateStr}_${rawCourse}_${semNum}`.toLowerCase();
    if (seenExams.has(examKey)) {
      errors.push({
        field: "Exam Schedule",
        code: "DUPLICATE_EXAM",
        message: `Same paper '${rawCourse}' already scheduled on ${formattedDateStr} (Row ${seenExams.get(examKey)}).`,
        tip: "Avoid scheduling the same course twice in the same exam session.",
        value: rawCourse
      });
    } else {
      seenExams.set(examKey, rowIdx);
    }

    results.push({
      row: rowIdx,
      primaryTitle: `${rawCourse} (${examType.replace("_", " ")})`,
      secondaryTitle: `Date: ${formattedDateStr || rawDate} • Time: ${startTime} - ${endTime} • Sem: ${semNum}`,
      columns: [
        { label: "Date", value: formattedDateStr || rawDate },
        { label: "Course", value: rawCourse || "—" },
        { label: "Type", value: examType },
        { label: "Time", value: `${startTime} - ${endTime}` },
        { label: "Semester", value: String(semNum) },
        { label: "Room", value: room }
      ],
      isValid: errors.length === 0,
      errors,
      warnings,
      raw: {
        ...raw,
        date: formattedDateStr,
        startTime,
        endTime,
        course: rawCourse,
        examType,
        semester: String(semNum),
        room
      }
    });
  }

  return {
    total: rows.length,
    validCount: results.filter(r => r.isValid).length,
    errorCount: results.filter(r => !r.isValid).length,
    warningCount: results.filter(r => r.warnings.length > 0 && r.isValid).length,
    results
  };
}

export function getDatesheetSampleCSV(): string {
  return `Exam Date,Start Time,End Time,Course,Semester,Exam Type,Room,Program
2026-06-15,09:30,12:30,CS-101 Programming Fundamentals,1,FINAL_TERM,Examination Hall A,BS Computer Science
2026-06-17,09:30,12:30,ENG-101 English Composition,1,FINAL_TERM,Examination Hall A,BS Computer Science
2026-06-19,09:30,12:30,MATH-101 Calculus,1,FINAL_TERM,Examination Hall B,BS Computer Science
2026-06-22,09:30,12:30,PHY-101 Applied Physics,1,FINAL_TERM,Examination Hall B,BS Computer Science
2026-06-24,09:30,12:30,CS-102 Database Systems,3,FINAL_TERM,Auditorium,BS Computer Science`;
}

// =============================================================
// 5. MARKS & RESULTS PARSER & VALIDATOR
// =============================================================
export function validateMarksBatch(
  rows: Record<string, string>[],
  courseTotalMarks: number = 100,
  enrolledStudents: Array<{ id: string; rollNumber?: string; cnic?: string; user?: { name: string } }> = []
): UniversalBatchResult {
  const results: UniversalRowValidation[] = [];
  const seenStudents = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const rowIdx = i + 1;
    const raw = rows[i];
    const errors: UniversalFieldDiagnostic[] = [];
    const warnings: UniversalFieldDiagnostic[] = [];

    // Student identifier (Roll Number or CNIC)
    const roll = (raw.rollno || raw.roll || raw.rollnumber || raw["roll no"] || raw["roll number"] || raw.registrationno || raw.regno || "").trim();
    const cnic = (raw.cnic || raw.cnicno || raw.nic || "").trim();
    const name = (raw.name || raw.studentname || raw["student name"] || "").trim();

    if (!roll && !cnic && !name) {
      errors.push({
        field: "Student Identifier",
        code: "MISSING_STUDENT",
        message: "Student Roll No, CNIC, or Name is required to assign marks.",
        tip: "Provide student Roll Number or CNIC in the first column.",
        value: ""
      });
    }

    const studentKey = (roll || cnic || name).toLowerCase();
    if (studentKey) {
      if (seenStudents.has(studentKey)) {
        errors.push({
          field: "Duplicate Student",
          code: "DUPLICATE_STUDENT",
          message: `Student '${roll || name}' appears multiple times in file (Rows ${seenStudents.get(studentKey)} & ${rowIdx}).`,
          tip: "Each student must only have one score row per exam.",
          value: roll || name
        });
      } else {
        seenStudents.set(studentKey, rowIdx);
      }
    }

    // Match enrolled student if list provided
    let matchedStudentId: string | null = null;
    if (enrolledStudents.length > 0) {
      const found = enrolledStudents.find(s =>
        (roll && s.rollNumber && s.rollNumber.toLowerCase() === roll.toLowerCase()) ||
        (cnic && s.cnic && s.cnic.replace(/\D/g, "") === cnic.replace(/\D/g, "")) ||
        (name && s.user?.name && s.user.name.toLowerCase() === name.toLowerCase())
      );
      if (found) {
        matchedStudentId = found.id;
      } else {
        warnings.push({
          field: "Enrollment",
          code: "UNENROLLED_NOTICE",
          message: `Student '${roll || name}' was not found in enrolled student list for this course.`,
          tip: "Verify roll number matches enrollment records.",
          value: roll || name
        });
      }
    }

    // Parse Marks
    const parseMarksVal = (val: string | undefined): number => {
      if (!val || val === "A" || val === "ABSENT") return 0;
      const num = parseFloat(val);
      return isNaN(num) ? 0 : Math.max(0, num);
    };

    const mid = parseMarksVal(raw.midterm || raw.mid || raw["mid term"] || raw.midtermmarks);
    const finalM = parseMarksVal(raw.final || raw.finalmarks || raw["final term"]);
    const sessional = parseMarksVal(raw.assignment || raw.quiz || raw.sessional || raw.assessment || raw["assignment marks"]);
    const practical = parseMarksVal(raw.practical || raw.lab || raw["practical marks"]);

    let obtained = parseMarksVal(raw.obtained || raw.totalobtained || raw["obtained marks"]);
    if (obtained === 0 && (mid > 0 || finalM > 0 || sessional > 0 || practical > 0)) {
      obtained = mid + finalM + sessional + practical;
    }

    const total = parseMarksVal(raw.total || raw.totalmarks || raw["total marks"]) || courseTotalMarks || 100;

    if (obtained > total) {
      errors.push({
        field: "Obtained Marks",
        code: "MARKS_EXCEED_TOTAL",
        message: `Obtained marks (${obtained}) exceed total marks (${total}).`,
        tip: `Obtained score cannot be higher than ${total}.`,
        value: String(obtained)
      });
    }

    // Grade preview
    const pct = total > 0 ? (obtained / total) * 100 : 0;
    let grade = "F";
    if (pct >= 85) grade = "A";
    else if (pct >= 70) grade = "B";
    else if (pct >= 55) grade = "C";
    else if (pct >= 50) grade = "D";

    results.push({
      row: rowIdx,
      primaryTitle: name || roll || "Student",
      secondaryTitle: `Roll: ${roll || "—"} • Score: ${obtained} / ${total} (${pct.toFixed(1)}% - Grade ${grade})`,
      columns: [
        { label: "Roll No", value: roll || "—" },
        { label: "Name", value: name || "—" },
        { label: "Midterm", value: String(mid) },
        { label: "Final", value: String(finalM) },
        { label: "Sessional", value: String(sessional) },
        { label: "Obtained", value: String(obtained) },
        { label: "Total", value: String(total) },
        { label: "Grade", value: grade }
      ],
      isValid: errors.length === 0,
      errors,
      warnings,
      raw: {
        ...raw,
        studentId: matchedStudentId || "",
        rollNumber: roll,
        studentName: name,
        midtermMarks: String(mid),
        finalMarks: String(finalM),
        assignmentMarks: String(sessional),
        practicalMarks: String(practical),
        obtainedMarks: String(obtained),
        totalMarks: String(total),
        grade
      }
    });
  }

  return {
    total: rows.length,
    validCount: results.filter(r => r.isValid).length,
    errorCount: results.filter(r => !r.isValid).length,
    warningCount: results.filter(r => r.warnings.length > 0 && r.isValid).length,
    results
  };
}

export function getMarksSampleCSV(): string {
  return `Roll Number,Student Name,Midterm (20),Final (60),Sessional (20),Total (100)
S17/Zoo-13,Muhammad Akber,18,52,17,100
S17/Zoo-14,Abdul Baseer,16,48,15,100
S17/Zoo-15,Zaheer Ahmed,19,55,18,100
S17/Zoo-16,Umair Ahmed,14,40,14,100
S17/Zoo-17,Saif Ullah,17,50,16,100`;
}

// -------------------------------------------------------------
// Natural Roll Number Ordering Utilities
// -------------------------------------------------------------
export function compareRollNumbers(rollA?: string | null, rollB?: string | null): number {
  const a = (rollA || "").trim();
  const b = (rollB || "").trim();
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export function sortStudentsByRoll<T extends { rollNumber?: string | null; roll?: string | null; name?: string | null; user?: { name?: string | null } | null }>(
  list: T[]
): T[] {
  return [...list].sort((a, b) => {
    const rA = a.rollNumber || a.roll || "";
    const rB = b.rollNumber || b.roll || "";
    const diff = compareRollNumbers(rA, rB);
    if (diff !== 0) return diff;
    const nA = a.user?.name || a.name || "";
    const nB = b.user?.name || b.name || "";
    return nA.localeCompare(nB, undefined, { sensitivity: "base" });
  });
}

// -------------------------------------------------------------
// Auto-Distribute Total Marks into Breakdown Components
// -------------------------------------------------------------
export interface DistributeOptions {
  isPracticalCourse?: boolean;
  examScheme?: "MID_FINAL" | "TERMINAL";
  courseTotalMarks?: number;
}

export function distributeTotalMarks(
  total: number,
  options?: DistributeOptions
): { assignment: number; quiz: number; practical: number; mid: number; final: number } {
  const maxTotal = options?.courseTotalMarks || 100;
  const clampedTotal = Math.max(0, Math.min(total, maxTotal));

  if (clampedTotal === 0) {
    return { assignment: 0, quiz: 0, practical: 0, mid: 0, final: 0 };
  }

  const isPractical = Boolean(options?.isPracticalCourse);
  const isTerminal = options?.examScheme === "TERMINAL";

  if (isTerminal) {
    if (isPractical) {
      const sessionalCap = 5;
      const practicalCap = 25;
      const finalCap = 70;
      const ratio = clampedTotal / maxTotal;

      let practical = Math.round(practicalCap * ratio + (Math.random() * 2 - 1));
      practical = Math.max(0, Math.min(practical, practicalCap));

      let sessional = Math.round(sessionalCap * ratio + (Math.random() * 1 - 0.5));
      sessional = Math.max(0, Math.min(sessional, sessionalCap));

      let quiz = Math.round(sessional / 2);
      let assignment = sessional - quiz;

      let final = clampedTotal - (practical + quiz + assignment);
      if (final > finalCap) {
        const excess = final - finalCap;
        final = finalCap;
        practical = Math.min(practicalCap, practical + excess);
      } else if (final < 0) {
        practical = Math.max(0, practical + final);
        final = 0;
      }
      return { assignment, quiz, practical, mid: 0, final };
    } else {
      const sessionalCap = 30;
      const finalCap = 70;
      const ratio = clampedTotal / maxTotal;

      let sessional = Math.round(sessionalCap * ratio + (Math.random() * 4 - 2));
      sessional = Math.max(0, Math.min(sessional, sessionalCap));

      let quiz = Math.round(sessional / 2 + (Math.random() * 2 - 1));
      quiz = Math.max(0, Math.min(quiz, sessional));
      let assignment = sessional - quiz;

      let final = clampedTotal - (quiz + assignment);
      if (final > finalCap) {
        const excess = final - finalCap;
        final = finalCap;
        const addSessional = Math.min(sessionalCap - (quiz + assignment), excess);
        quiz += Math.round(addSessional / 2);
        assignment = clampedTotal - final - quiz;
      } else if (final < 0) {
        quiz = Math.max(0, quiz + final);
        final = 0;
      }
      return { assignment, quiz, practical: 0, mid: 0, final };
    }
  }

  // ── Standard Mid + Final Scheme ──
  if (isPractical) {
    const sessionalCap = 15;
    const practicalCap = 25;
    const midCap = 20;
    const finalCap = 40;
    const ratio = clampedTotal / maxTotal;

    let sessional = Math.round(sessionalCap * ratio + (Math.random() * 2 - 1));
    sessional = Math.max(0, Math.min(sessional, sessionalCap));
    let quiz = Math.round(sessional / 2);
    let assignment = sessional - quiz;

    let practical = Math.round(practicalCap * ratio + (Math.random() * 2 - 1));
    practical = Math.max(0, Math.min(practical, practicalCap));

    let mid = Math.round(midCap * ratio + (Math.random() * 2 - 1));
    mid = Math.max(0, Math.min(mid, midCap));

    let final = clampedTotal - (assignment + quiz + practical + mid);
    if (final > finalCap) {
      const excess = final - finalCap;
      final = finalCap;
      mid = Math.min(midCap, mid + Math.round(excess / 2));
      practical = Math.min(practicalCap, clampedTotal - (assignment + quiz + mid + final));
    } else if (final < 0) {
      mid = Math.max(0, mid + final);
      final = clampedTotal - (assignment + quiz + practical + mid);
    }
    return { assignment, quiz, practical, mid, final: Math.max(0, final) };
  } else {
    const sessionalCap = 30;
    const midCap = 30;
    const finalCap = 40;
    const ratio = clampedTotal / maxTotal;

    let sessional = Math.round(sessionalCap * ratio + (Math.random() * 4 - 2));
    sessional = Math.max(0, Math.min(sessional, sessionalCap));
    let quiz = Math.round(sessional / 2 + (Math.random() * 2 - 1));
    quiz = Math.max(0, Math.min(quiz, sessional));
    let assignment = sessional - quiz;

    let mid = Math.round(midCap * ratio + (Math.random() * 4 - 2));
    mid = Math.max(0, Math.min(mid, midCap));

    let final = clampedTotal - (assignment + quiz + mid);
    if (final > finalCap) {
      const excess = final - finalCap;
      final = finalCap;
      mid = Math.min(midCap, mid + Math.round(excess / 2));
      const rem = clampedTotal - (final + mid);
      quiz = Math.min(sessionalCap, Math.round(rem / 2));
      assignment = Math.max(0, rem - quiz);
    } else if (final < 0) {
      mid = Math.max(0, mid + final);
      final = clampedTotal - (assignment + quiz + mid);
    }

    // Exact reconciliation so the sum strictly matches total
    const currentSum = assignment + quiz + mid + final;
    const diff = clampedTotal - currentSum;
    if (diff !== 0) {
      if (diff > 0) {
        if (final + diff <= finalCap) final += diff;
        else if (mid + diff <= midCap) mid += diff;
        else quiz += diff;
      } else {
        if (final + diff >= 0) final += diff;
        else if (mid + diff >= 0) mid += diff;
        else quiz = Math.max(0, quiz + diff);
      }
    }

    return { assignment, quiz, practical: 0, mid, final };
  }
}

// -------------------------------------------------------------
// Excel / TSV Bulk Paste Marks Parser
// -------------------------------------------------------------
export interface ParsedStudentMark {
  studentId: string;
  roll: string;
  name?: string;
  marks: number | "A";
  assignment?: number;
  quiz?: number;
  practical?: number;
  mid?: number;
  final?: number;
}

export function parsePastedMarksText(
  text: string,
  currentStudents: Array<{ id: string; roll?: string; rollNumber?: string; name?: string }>
): ParsedStudentMark[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const isMultiColumn = lines.some((l) => l.includes("\t") || l.includes(","));

  if (isMultiColumn) {
    const results: ParsedStudentMark[] = [];
    for (const line of lines) {
      const parts = line.split(/[\t,]+/).map((p) => p.trim());
      if (parts.length >= 2) {
        const rollCandidate = parts[0];
        const markCandidate = parts[1];

        // Match student by roll number
        const matched = currentStudents.find((s) => {
          const sRoll = (s.roll || s.rollNumber || "").toLowerCase().trim();
          const cand = rollCandidate.toLowerCase().trim();
          if (!sRoll || !cand) return false;
          if (sRoll === cand) return true;
          if (sRoll.endsWith(cand) || cand.endsWith(sRoll)) return true;
          const sDigits = sRoll.replace(/[^0-9]/g, "");
          const cDigits = cand.replace(/[^0-9]/g, "");
          return sDigits.length > 0 && sDigits === cDigits;
        });

        const isAbsent = ["A", "ABSENT", "ABS", "AB"].includes(markCandidate.toUpperCase());
        const num = parseFloat(markCandidate);

        if (matched) {
          if (parts.length >= 5) {
            results.push({
              studentId: matched.id,
              roll: matched.roll || matched.rollNumber || "",
              name: matched.name,
              marks: isAbsent ? "A" : isNaN(num) ? 0 : num,
              assignment: parseFloat(parts[1]) || 0,
              quiz: parseFloat(parts[2]) || 0,
              mid: parseFloat(parts[3]) || 0,
              final: parseFloat(parts[4]) || 0,
            });
          } else {
            results.push({
              studentId: matched.id,
              roll: matched.roll || matched.rollNumber || "",
              name: matched.name,
              marks: isAbsent ? "A" : isNaN(num) ? 0 : num,
            });
          }
        }
      }
    }
    if (results.length > 0) return results;
  }

  // Single column pasted: sequential mapping to currentStudents in order
  const results: ParsedStudentMark[] = [];
  lines.forEach((line, idx) => {
    if (idx < currentStudents.length) {
      const st = currentStudents[idx];
      const isAbsent = ["A", "ABSENT", "ABS", "AB"].includes(line.toUpperCase());
      const num = parseFloat(line);
      results.push({
        studentId: st.id,
        roll: st.roll || st.rollNumber || "",
        name: st.name,
        marks: isAbsent ? "A" : isNaN(num) ? 0 : num,
      });
    }
  });

  return results;
}


