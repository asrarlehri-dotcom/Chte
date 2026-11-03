import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// All application modules
const MODULES = [
  "INTERMEDIATE.ADMISSIONS", "INTERMEDIATE.STUDENTS", "INTERMEDIATE.FEES",
  "INTERMEDIATE.ATTENDANCE", "INTERMEDIATE.TIMETABLE", "INTERMEDIATE.FACULTY",
  "INTERMEDIATE.REPORTS",
  "BS.ADMISSIONS", "BS.ACADEMIC_SETUP", "BS.STUDENTS", "BS.COURSES",
  "BS.ENROLLMENTS", "BS.FEES", "BS.ATTENDANCE", "BS.TIMETABLE", "BS.EXAMS",
  "BS.MARKS", "BS.RESULTS", "BS.GPA_CGPA", "BS.PROMOTIONS", "BS.DMC",
  "BS.TRANSCRIPT", "BS.GAZETTE", "BS.STUDENT_ACTIONS", "BS.GRADUATION",
  "ADMIN.USERS", "ADMIN.PERMISSIONS", "ADMIN.AUDIT_LOGS", "ADMIN.SETTINGS", "ADMIN.EXPENSES"
];

const ACTIONS = [
  "VIEW", "ADD", "EDIT", "DELETE", "GENERATE", "PRINT", "DOWNLOAD", "EXPORT", "APPROVE", "LOCK"
];

const DEFAULT_PERMISSIONS: Record<string, Record<string, string[]>> = {
  GUEST: {
    "INTERMEDIATE.ADMISSIONS": ["VIEW"],
    "BS.ADMISSIONS": ["VIEW"],
  },
  BS_CONTROLLER: {
    "BS.ADMISSIONS": ["VIEW", "ADD", "EDIT", "DELETE", "APPROVE"],
    "BS.ACADEMIC_SETUP": ["VIEW", "ADD", "EDIT", "DELETE"],
    "BS.STUDENTS": ["VIEW", "ADD", "EDIT", "DELETE"],
    "BS.COURSES": ["VIEW", "ADD", "EDIT", "DELETE"],
    "BS.ENROLLMENTS": ["VIEW", "ADD", "EDIT", "DELETE"],
    "BS.FEES": ["VIEW", "ADD", "EDIT", "DELETE", "GENERATE", "PRINT"],
    "BS.ATTENDANCE": ["VIEW", "EXPORT"],
    "BS.TIMETABLE": ["VIEW", "ADD", "EDIT", "DELETE", "GENERATE", "PRINT"],
    "BS.EXAMS": ["VIEW", "ADD", "EDIT", "DELETE", "GENERATE"],
    "BS.MARKS": ["VIEW", "ADD", "EDIT", "LOCK"],
    "BS.RESULTS": ["VIEW", "GENERATE", "LOCK", "PRINT", "DOWNLOAD", "EXPORT"],
    "BS.GPA_CGPA": ["VIEW", "GENERATE"],
    "BS.PROMOTIONS": ["VIEW", "ADD", "EDIT", "APPROVE"],
    "BS.DMC": ["VIEW", "GENERATE", "PRINT", "DOWNLOAD"],
    "BS.TRANSCRIPT": ["VIEW", "GENERATE", "PRINT", "DOWNLOAD"],
    "BS.GAZETTE": ["VIEW", "GENERATE", "PRINT", "DOWNLOAD"],
    "BS.STUDENT_ACTIONS": ["VIEW", "ADD", "EDIT", "APPROVE"],
    "BS.GRADUATION": ["VIEW", "GENERATE", "APPROVE"],
    "ADMIN.AUDIT_LOGS": ["VIEW"],
  },
  BS_FACULTY: {
    "BS.STUDENTS": ["VIEW"],
    "BS.COURSES": ["VIEW"],
    "BS.ATTENDANCE": ["VIEW", "ADD", "EDIT"],
    "BS.TIMETABLE": ["VIEW"],
    "BS.EXAMS": ["VIEW"],
    "BS.MARKS": ["VIEW", "ADD", "EDIT"],
    "BS.RESULTS": ["VIEW"],
  },
  INTER_FACULTY: {
    "INTERMEDIATE.STUDENTS": ["VIEW"],
    "INTERMEDIATE.ATTENDANCE": ["VIEW", "ADD", "EDIT"],
    "INTERMEDIATE.TIMETABLE": ["VIEW"],
    "INTERMEDIATE.FEES": ["VIEW"],
  },
  PRINCIPAL: {
    "INTERMEDIATE.ADMISSIONS": ["VIEW"],
    "INTERMEDIATE.STUDENTS": ["VIEW"],
    "INTERMEDIATE.FEES": ["VIEW"],
    "INTERMEDIATE.ATTENDANCE": ["VIEW"],
    "INTERMEDIATE.TIMETABLE": ["VIEW"],
    "INTERMEDIATE.FACULTY": ["VIEW"],
    "INTERMEDIATE.REPORTS": ["VIEW", "PRINT", "DOWNLOAD", "EXPORT"],
    "BS.ADMISSIONS": ["VIEW"],
    "BS.ACADEMIC_SETUP": ["VIEW"],
    "BS.STUDENTS": ["VIEW"],
    "BS.COURSES": ["VIEW"],
    "BS.ENROLLMENTS": ["VIEW"],
    "BS.FEES": ["VIEW"],
    "BS.ATTENDANCE": ["VIEW"],
    "BS.TIMETABLE": ["VIEW"],
    "BS.EXAMS": ["VIEW"],
    "BS.MARKS": ["VIEW"],
    "BS.RESULTS": ["VIEW"],
    "BS.GPA_CGPA": ["VIEW"],
    "BS.PROMOTIONS": ["VIEW"],
    "BS.DMC": ["VIEW", "PRINT"],
    "BS.TRANSCRIPT": ["VIEW", "PRINT"],
    "BS.GAZETTE": ["VIEW", "PRINT"],
    "BS.STUDENT_ACTIONS": ["VIEW"],
    "BS.GRADUATION": ["VIEW"],
    "ADMIN.AUDIT_LOGS": ["VIEW"],
    "ADMIN.EXPENSES": ["VIEW"],
  },
  STUDENT: {
    "BS.COURSES": ["VIEW"],
    "BS.TIMETABLE": ["VIEW"],
    "BS.EXAMS": ["VIEW"],
    "BS.RESULTS": ["VIEW"],
    "BS.GPA_CGPA": ["VIEW"],
    "BS.DMC": ["VIEW", "DOWNLOAD"],
    "BS.TRANSCRIPT": ["VIEW", "DOWNLOAD"],
    "INTERMEDIATE.TIMETABLE": ["VIEW"],
  },
};

// Helper for Grade Point Calculation
function getGP(pct: number): number {
  if (pct >= 80) return 4.0;
  if (pct < 50) return 0.0;
  return parseFloat((1.0 + (Math.round(pct) - 50) * 0.1).toFixed(2));
}

async function main() {
  console.log("🌱 Starting Comprehensive Dummy Data Seeding...");

  // ─── 0. CLEAR EXISTING DATA (Clean Refresh) ──────────────────────────────
  console.log("🧹 Cleaning old records...");
  await prisma.auditLog.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.examDuty.deleteMany({});
  await prisma.datesheet.deleteMany({});
  await prisma.timetable.deleteMany({});
  await prisma.marks.deleteMany({});
  await prisma.result.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.studentStatus.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.challan.deleteMany({});
  await prisma.admission.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.classSection.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.syllabusVersion.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.program.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.feeSettings.deleteMany({});
  await prisma.systemSetting.deleteMany({});
  await prisma.academicSession.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.college.deleteMany({});

  const hashedAdminPw = await bcrypt.hash("admin123", 10);
  const hashedDemoPw = await bcrypt.hash("demo123", 10);
  const hashedFacultyPw = await bcrypt.hash("faculty123", 10);
  const hashedStudentPw = await bcrypt.hash("student123", 10);
  const hashedChtePw = await bcrypt.hash("chte123", 10);

  // ─── 1. COLLEGES & CHTE USERS ────────────────────────────────────────────
  console.log("🏢 Creating CHTE Central Master & Multi-Tenant Colleges...");

  const chteAdmin = await prisma.user.create({
    data: {
      email: "chte@balochistan.gov.pk",
      name: "CHTE Central Super Admin",
      password: hashedChtePw,
      role: "CHTE_ADMIN",
      isActive: true
    }
  });

  const gpgcqCollege = await prisma.college.create({
    data: {
      name: "Govt. Post Graduate College Quetta",
      code: "GPGCQ",
      slug: "gpgc-quetta",
      tagline: "Center of Excellence & Quality Education",
      logoUrl: "",
      district: "Quetta",
      division: "Quetta Division",
      address: "Zarghoon Road, Quetta, Balochistan, Pakistan",
      contactEmail: "info@gpgcquetta.edu.pk",
      contactPhone: "+92 81 9201234",
      principalName: "Prof. Dr. Zahid Mengal",
      bankName: "Habib Bank Limited (HBL)",
      bankAccount: "08730001324203",
      branchCode: "0873",
      accountTitle: "Principal Govt Post Graduate College Quetta",
      isActive: true
    }
  });

  const gscqCollege = await prisma.college.create({
    data: {
      name: "Govt. Science College Quetta",
      code: "GSCQ",
      slug: "gsc-quetta",
      tagline: "Pioneering Science & Technology Education",
      logoUrl: "",
      district: "Quetta",
      division: "Quetta Division",
      address: "Jinnah Road, Quetta, Balochistan, Pakistan",
      contactEmail: "info@gscq.edu.pk",
      contactPhone: "+92 81 9205555",
      principalName: "Prof. Dr. Tariq Baloch",
      bankName: "National Bank of Pakistan (NBP)",
      bankAccount: "11029384756201",
      branchCode: "0142",
      accountTitle: "Principal Govt Science College Quetta",
      isActive: true
    }
  });

  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@college.edu",
      name: "GPGCQ College Admin",
      password: hashedAdminPw,
      role: "COLLEGE_ADMIN",
      collegeId: gpgcqCollege.id,
      isActive: true
    }
  });

  await prisma.user.create({
    data: {
      email: "admin@gscq.edu.pk",
      name: "GSCQ College Admin",
      password: hashedAdminPw,
      role: "COLLEGE_ADMIN",
      collegeId: gscqCollege.id,
      isActive: true
    }
  });

  const demoStaff = [
    { email: "controller@college.edu", name: "Prof. Tariq Mahmud (BS Controller)", role: "BS_CONTROLLER" },
    { email: "bsfaculty@college.edu", name: "Dr. Muhammad Usman (BS Faculty)", role: "BS_FACULTY" },
    { email: "interfaculty@college.edu", name: "Prof. Aslam Lehri (Inter Faculty)", role: "INTER_FACULTY" },
    { email: "principal@college.edu", name: "Prof. Dr. Zahid Mengal (Principal)", role: "PRINCIPAL" },
  ];

  for (const u of demoStaff) {
    await prisma.user.create({
      data: { email: u.email, name: u.name, password: hashedDemoPw, role: u.role, collegeId: gpgcqCollege.id, isActive: true }
    });
  }

  // Seed Permissions with createMany
  const permData: { module: string; action: string; description: string }[] = [];
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      permData.push({ module, action, description: `${module} - ${action}` });
    }
  }
  await prisma.permission.createMany({ data: permData, skipDuplicates: true });

  const allPerms = await prisma.permission.findMany();
  const rolePermData: { role: string; permissionId: string; isGranted: boolean }[] = [];
  for (const [role, modulePerms] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const [module, actions] of Object.entries(modulePerms)) {
      for (const action of actions) {
        const p = allPerms.find(perm => perm.module === module && perm.action === action);
        if (p) {
          rolePermData.push({ role, permissionId: p.id, isGranted: true });
        }
      }
    }
  }
  await prisma.rolePermission.createMany({ data: rolePermData, skipDuplicates: true });

  // ─── 2. SYSTEM SETTINGS & SESSIONS ───────────────────────────────────────
  console.log("⚙️ Creating System Settings & Academic Sessions...");
  
  const sysSettings = [
    { key: "college_name", value: "Govt. Post Graduate College Quetta" },
    { key: "college_tagline", value: "Center of Excellence & Quality Education" },
    { key: "academic_session", value: "2024-2028" },
    { key: "active_semester", value: "Fall 2026" },
    { key: "contact_email", value: "info@gpgcquetta.edu.pk" },
    { key: "contact_phone", value: "+92 81 9201234" },
    { key: "address", value: "Zarghoon Road, Quetta, Balochistan, Pakistan" }
  ];
  await prisma.systemSetting.createMany({ data: sysSettings, skipDuplicates: true });

  const sessions = [
    { name: "2024-2028", startDate: new Date("2024-09-01"), endDate: new Date("2028-06-30"), status: "ACTIVE" },
    { name: "2025-2029", startDate: new Date("2025-09-01"), endDate: new Date("2029-06-30"), status: "ACTIVE" },
    { name: "2026-2030", startDate: new Date("2026-09-01"), endDate: new Date("2030-06-30"), status: "ACTIVE" },
    { name: "2023-2027", startDate: new Date("2023-09-01"), endDate: new Date("2027-06-30"), status: "ACTIVE" },
    { name: "2022-2026", startDate: new Date("2022-09-01"), endDate: new Date("2026-06-30"), status: "ACTIVE" },
    { name: "2024-2026", startDate: new Date("2024-09-01"), endDate: new Date("2026-06-30"), status: "ACTIVE" },
    { name: "2025-2027", startDate: new Date("2025-09-01"), endDate: new Date("2027-06-30"), status: "ACTIVE" },
    { name: "2026-2028", startDate: new Date("2026-09-01"), endDate: new Date("2028-06-30"), status: "ACTIVE" }
  ];
  await prisma.academicSession.createMany({ data: sessions, skipDuplicates: true });

  // ─── 3. DEPARTMENTS ──────────────────────────────────────────────────────
  console.log("🏛️ Creating Departments...");
  
  const deptsData = [
    { code: "CS", name: "Department of Computer Science", hodName: "Dr. Muhammad Usman" },
    { code: "ENG", name: "Department of English", hodName: "Dr. Sara Khan" },
    { code: "ECO", name: "Department of Economics", hodName: "Dr. Tariq Mansoor" },
    { code: "MATH", name: "Department of Mathematics", hodName: "Dr. Imran Qureshi" },
    { code: "PHY", name: "Department of Physics", hodName: "Prof. Shahida Kakar" },
    { code: "CHEM", name: "Department of Chemistry", hodName: "Dr. Abdul Rehman" },
    { code: "INTER", name: "Department of Intermediate Studies", hodName: "Prof. Aslam Lehri" },
  ];

  const depts: Record<string, any> = {};
  for (const d of deptsData) {
    depts[d.code] = await prisma.department.create({ data: { ...d, collegeId: gpgcqCollege.id } });
  }

  // ─── 4. PROGRAMS & GROUPS & SUBJECTS ─────────────────────────────────────
  console.log("🎓 Creating Programs, Groups, and Intermediate Subjects...");
  
  const programsData = [
    { code: "BSCS", name: "BS Computer Science", educationLevel: "BS", departmentId: depts["CS"].id, collegeId: gpgcqCollege.id },
    { code: "BSENG", name: "BS English", educationLevel: "BS", departmentId: depts["ENG"].id, collegeId: gpgcqCollege.id },
    { code: "BSECO", name: "BS Economics", educationLevel: "BS", departmentId: depts["ECO"].id, collegeId: gpgcqCollege.id },
    { code: "BSMATH", name: "BS Mathematics", educationLevel: "BS", departmentId: depts["MATH"].id, collegeId: gpgcqCollege.id },
    { code: "BSPHY", name: "BS Physics", educationLevel: "BS", departmentId: depts["PHY"].id, collegeId: gpgcqCollege.id },
    { code: "FSC-ENG", name: "F.Sc Pre-Engineering", educationLevel: "INTERMEDIATE", departmentId: depts["INTER"].id, collegeId: gpgcqCollege.id },
    { code: "FSC-MED", name: "F.Sc Pre-Medical", educationLevel: "INTERMEDIATE", departmentId: depts["INTER"].id, collegeId: gpgcqCollege.id },
    { code: "FA", name: "F.A Humanities", educationLevel: "INTERMEDIATE", departmentId: depts["INTER"].id, collegeId: gpgcqCollege.id }
  ];

  const progs: Record<string, any> = {};
  for (const p of programsData) {
    progs[p.code] = await prisma.program.create({ data: p });
  }

  // Groups
  const preEngGroup = await prisma.group.create({
    data: { name: "Pre-Engineering", programId: progs["FSC-ENG"].id }
  });
  const preMedGroup = await prisma.group.create({
    data: { name: "Pre-Medical", programId: progs["FSC-MED"].id }
  });
  const faGroup = await prisma.group.create({
    data: { name: "Humanities & Social Sciences", programId: progs["FA"].id }
  });

  // Subjects
  const subjectsData = [
    { name: "Mathematics", code: "MATH-11", groupId: preEngGroup.id },
    { name: "Physics", code: "PHY-11", groupId: preEngGroup.id },
    { name: "Chemistry", code: "CHEM-11", groupId: preEngGroup.id },
    { name: "English Compulsory", code: "ENG-11", groupId: preEngGroup.id },
    { name: "Biology", code: "BIO-11", groupId: preMedGroup.id },
    { name: "Physics", code: "PHY-MED-11", groupId: preMedGroup.id },
    { name: "Chemistry", code: "CHEM-MED-11", groupId: preMedGroup.id },
    { name: "Civics", code: "CIV-11", groupId: faGroup.id },
    { name: "Islamic Studies (Elective)", code: "ISL-E-11", groupId: faGroup.id },
    { name: "History of Pakistan", code: "HIS-11", groupId: faGroup.id }
  ];
  for (const s of subjectsData) {
    await prisma.subject.create({ data: s });
  }

  // Class Sections
  const sectionBS1 = await prisma.classSection.create({ data: { name: "Section BS-A", programId: progs["BSCS"].id } });
  const sectionBS2 = await prisma.classSection.create({ data: { name: "Section BS-B", programId: progs["BSCS"].id } });
  const sectionMed1 = await prisma.classSection.create({ data: { name: "Pre-Med 1", programId: progs["FSC-MED"].id, groupId: preMedGroup.id } });
  const sectionEng1 = await prisma.classSection.create({ data: { name: "Pre-Eng 1", programId: progs["FSC-ENG"].id, groupId: preEngGroup.id } });

  // ─── 5. FACULTY MEMBERS ──────────────────────────────────────────────────
  console.log("👨‍🏫 Creating Faculty Members...");
  
  const facultyData = [
    { name: "Dr. Muhammad Usman", email: "usman.cs@college.edu", dept: "CS", desig: "Professor", qual: "Ph.D Computer Science (UET)", phone: "0333-7890101", level: "BS" },
    { name: "Dr. Sara Khan", email: "sara.eng@college.edu", dept: "ENG", desig: "Professor", qual: "Ph.D English Literature (NUML)", phone: "0333-7890102", level: "BS" },
    { name: "Dr. Tariq Mansoor", email: "tariq.eco@college.edu", dept: "ECO", desig: "Associate Professor", qual: "Ph.D Economics (QAU)", phone: "0333-7890103", level: "BS" },
    { name: "Dr. Imran Qureshi", email: "imran.math@college.edu", dept: "MATH", desig: "Associate Professor", qual: "Ph.D Mathematics (UOB)", phone: "0333-7890104", level: "BS" },
    { name: "Prof. Shahida Kakar", email: "shahida.phy@college.edu", dept: "PHY", desig: "Associate Professor", qual: "M.Phil Physics (UOB)", phone: "0333-7890105", level: "BS" },
    { name: "Dr. Abdul Rehman", email: "rehman.chem@college.edu", dept: "CHEM", desig: "Professor", qual: "Ph.D Organic Chemistry (HEJ)", phone: "0333-7890106", level: "BS" },
    { name: "Prof. Aslam Lehri", email: "aslam.inter@college.edu", dept: "INTER", desig: "Assistant Professor", qual: "MS Education & Math", phone: "0333-7890107", level: "INTERMEDIATE" },
    { name: "Dr. Bilal Ahmed", email: "bilal.cs@college.edu", dept: "CS", desig: "Assistant Professor", qual: "Ph.D Data Science (LUMS)", phone: "0333-7890108", level: "BS" },
    { name: "Ms. Fatima Mengal", email: "fatima.cs@college.edu", dept: "CS", desig: "Lecturer", qual: "MS Software Engineering", phone: "0333-7890109", level: "BS" },
    { name: "Mr. Hamza Ali", email: "hamza.phy@college.edu", dept: "PHY", desig: "Lecturer", qual: "M.Sc Electronics", phone: "0333-7890110", level: "BS" },
    { name: "Ms. Zainab Kasi", email: "zainab.eng@college.edu", dept: "ENG", desig: "Lecturer", qual: "M.Phil Applied Linguistics", phone: "0333-7890111", level: "BS" },
    { name: "Mr. Kamran Bugti", email: "kamran.chem@college.edu", dept: "CHEM", desig: "Lecturer", qual: "M.Sc Inorganic Chemistry", phone: "0333-7890112", level: "BS" },
  ];

  const facultyList: any[] = [];
  for (const f of facultyData) {
    const user = await prisma.user.create({
      data: {
        email: f.email,
        name: f.name,
        password: hashedFacultyPw,
        role: f.level === "INTERMEDIATE" ? "INTER_FACULTY" : "BS_FACULTY",
        isActive: true
      }
    });

    const fac = await prisma.faculty.create({
      data: {
        userId: user.id,
        fatherName: "Ghulam Nabi",
        designation: f.desig,
        qualification: f.qual,
        contactNumber: f.phone,
        departmentId: depts[f.dept].id,
        educationLevel: f.level,
        isActive: true
      }
    });
    facultyList.push(fac);
  }

  // ─── 6. COURSES & DETAILED SYLLABI (Semesters 1-8 for BSCS, BSENG, BSECO) ─
  console.log("📚 Creating Complete 8-Semester Courses and Syllabi...");
  
  const bscsCoursesConfig = [
    // Sem 1
    { title: "Programming Fundamentals", code: "CS-101", ch: 4, chf: "4(3-1)", th: 3, lh: 1, type: "THEORY_LAB", sem: 1, fac: facultyList[0] },
    { title: "Calculus & Analytical Geometry", code: "MATH-101", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 1, fac: facultyList[3] },
    { title: "Functional English", code: "ENG-101", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 1, fac: facultyList[1] },
    { title: "Applied Physics", code: "PHY-101", ch: 3, chf: "3(2-1)", th: 2, lh: 1, type: "THEORY_LAB", sem: 1, fac: facultyList[4] },
    { title: "Islamic Studies / Ethics", code: "ISL-101", ch: 2, chf: "2(2-0)", th: 2, lh: 0, type: "THEORY", sem: 1, fac: facultyList[10] },

    // Sem 2
    { title: "Object Oriented Programming", code: "CS-102", ch: 4, chf: "4(3-1)", th: 3, lh: 1, type: "THEORY_LAB", sem: 2, fac: facultyList[7] },
    { title: "Discrete Structures", code: "CS-103", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 2, fac: facultyList[8] },
    { title: "Linear Algebra", code: "MATH-102", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 2, fac: facultyList[3] },
    { title: "Communication Skills", code: "ENG-102", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 2, fac: facultyList[10] },
    { title: "Pakistan Studies", code: "PS-101", ch: 2, chf: "2(2-0)", th: 2, lh: 0, type: "THEORY", sem: 2, fac: facultyList[1] },

    // Sem 3
    { title: "Data Structures & Algorithms", code: "CS-201", ch: 4, chf: "4(3-1)", th: 3, lh: 1, type: "THEORY_LAB", sem: 3, fac: facultyList[0] },
    { title: "Digital Logic Design", code: "CS-202", ch: 3, chf: "3(2-1)", th: 2, lh: 1, type: "THEORY_LAB", sem: 3, fac: facultyList[9] },
    { title: "Database Systems", code: "CS-203", ch: 4, chf: "4(3-1)", th: 3, lh: 1, type: "THEORY_LAB", sem: 3, fac: facultyList[8] },
    { title: "Differential Equations", code: "MATH-201", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 3, fac: facultyList[3] },
    { title: "Quantitative Reasoning", code: "QR-201", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 3, fac: facultyList[2] },

    // Sem 4
    { title: "Operating Systems", code: "CS-204", ch: 4, chf: "4(3-1)", th: 3, lh: 1, type: "THEORY_LAB", sem: 4, fac: facultyList[7] },
    { title: "Computer Networks", code: "CS-205", ch: 4, chf: "4(3-1)", th: 3, lh: 1, type: "THEORY_LAB", sem: 4, fac: facultyList[0] },
    { title: "Design & Analysis of Algorithms", code: "CS-206", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 4, fac: facultyList[7] },
    { title: "Probability & Statistics", code: "STAT-201", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 4, fac: facultyList[3] },
    { title: "Environmental Science", code: "ENV-201", ch: 2, chf: "2(2-0)", th: 2, lh: 0, type: "THEORY", sem: 4, fac: facultyList[5] },

    // Sem 5
    { title: "Software Engineering", code: "CS-301", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 5, fac: facultyList[8] },
    { title: "Theory of Automata", code: "CS-302", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 5, fac: facultyList[0] },
    { title: "Computer Architecture", code: "CS-303", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 5, fac: facultyList[9] },
    { title: "Web Technologies", code: "CS-304", ch: 3, chf: "3(2-1)", th: 2, lh: 1, type: "THEORY_LAB", sem: 5, fac: facultyList[7] },
    { title: "Entrepreneurship & Innovation", code: "ENT-301", ch: 2, chf: "2(2-0)", th: 2, lh: 0, type: "THEORY", sem: 5, fac: facultyList[2] },

    // Sem 6
    { title: "Artificial Intelligence", code: "CS-305", ch: 4, chf: "4(3-1)", th: 3, lh: 1, type: "THEORY_LAB", sem: 6, fac: facultyList[7] },
    { title: "Information Security", code: "CS-306", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 6, fac: facultyList[0] },
    { title: "Mobile Application Development", code: "CS-307", ch: 3, chf: "3(2-1)", th: 2, lh: 1, type: "THEORY_LAB", sem: 6, fac: facultyList[8] },
    { title: "Cloud Computing", code: "CS-308", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 6, fac: facultyList[7] },
    { title: "Research Methodology", code: "RM-301", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 6, fac: facultyList[1] },

    // Sem 7
    { title: "Compiler Construction", code: "CS-401", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 7, fac: facultyList[0] },
    { title: "Machine Learning", code: "CS-402", ch: 3, chf: "3(2-1)", th: 2, lh: 1, type: "THEORY_LAB", sem: 7, fac: facultyList[7] },
    { title: "Distributed Computing", code: "CS-403", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 7, fac: facultyList[8] },
    { title: "Final Year Capstone Project I", code: "CS-499", ch: 3, chf: "3(0-3)", th: 0, lh: 3, type: "PRACTICAL", sem: 7, fac: facultyList[0] },

    // Sem 8
    { title: "Big Data Analytics", code: "CS-404", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 8, fac: facultyList[7] },
    { title: "Cyber Security Operations", code: "CS-405", ch: 3, chf: "3(3-0)", th: 3, lh: 0, type: "THEORY", sem: 8, fac: facultyList[0] },
    { title: "Final Year Capstone Project II", code: "CS-500", ch: 3, chf: "3(0-3)", th: 0, lh: 3, type: "PRACTICAL", sem: 8, fac: facultyList[0] },
    { title: "Professional Internship", code: "INT-401", ch: 3, chf: "3(0-3)", th: 0, lh: 3, type: "PRACTICAL", sem: 8, fac: facultyList[8] },
  ];

  const allCreatedCourses: Record<string, any[]> = { BSCS: [] };

  for (let idx = 0; idx < bscsCoursesConfig.length; idx++) {
    const c = bscsCoursesConfig[idx];
    const syllabusObj = {
      description: `Comprehensive official syllabus for ${c.title} (${c.code}) aligned with Higher Education Commission (HEC) curriculum framework.`,
      clos: [
        `CLO 1: Understand fundamental concepts and theoretical foundations of ${c.title}.`,
        `CLO 2: Apply analytical and practical problem solving techniques in real-world scenarios.`,
        `CLO 3: Evaluate and design scalable systems according to industry best practices.`
      ],
      outlines: [
        { week: 1, topic: "Introduction, scope, course objectives and evaluation scheme" },
        { week: 2, topic: "Core foundational principles and basic architectures" },
        { week: 3, topic: "Practical implementation paradigms and design structures" },
        { week: 4, topic: "Algorithm modeling and structural analysis" },
        { week: 8, topic: "Midterm Assessment and case study review" },
        { week: 12, topic: "Advanced techniques, integration, and security concepts" },
        { week: 16, topic: "Final project presentations, reviews and conclusion" }
      ],
      assessment: {
        assignments: 15,
        quizzes: 10,
        midterm: 25,
        finalExam: 40,
        labWork: c.lh > 0 ? 10 : 0
      },
      textbooks: [
        `Standard Reference Book for ${c.title}, 5th Edition, Pearson/McGraw-Hill.`,
        `HEC Curriculum Guidelines for Computer Science & Information Technology.`
      ]
    };

    const course = await prisma.course.create({
      data: {
        title: c.title,
        code: c.code,
        creditHours: c.ch,
        creditHoursFormat: c.chf,
        theoryHours: c.th,
        labHours: c.lh,
        courseType: c.type,
        session: "2024-2028",
        semester: c.sem,
        programId: progs["BSCS"].id,
        departmentId: depts["CS"].id,
        facultyId: c.fac.id,
        syllabusOrder: idx + 1,
        syllabusJson: JSON.stringify(syllabusObj),
        isActive: true
      }
    });

    await prisma.syllabusVersion.create({
      data: {
        courseId: course.id,
        version: 1,
        contentJson: JSON.stringify(syllabusObj),
        isArchived: false,
        isActive: true
      }
    });

    allCreatedCourses.BSCS.push(course);
  }

  // Also create English, Economics and Physics courses for multi-program testing
  const otherProgramsConfig = [
    { progCode: "BSENG", deptCode: "ENG", prefix: "ENG", title: "Literature & Linguistics", fac: facultyList[1] },
    { progCode: "BSECO", deptCode: "ECO", prefix: "ECO", title: "Micro & Macro Economics", fac: facultyList[2] },
    { progCode: "BSPHY", deptCode: "PHY", prefix: "PHY", title: "Classical & Quantum Physics", fac: facultyList[4] },
    { progCode: "BSMATH", deptCode: "MATH", prefix: "MTH", title: "Pure & Applied Mathematics", fac: facultyList[3] },
  ];

  for (const op of otherProgramsConfig) {
    allCreatedCourses[op.progCode] = [];
    for (let sem = 1; sem <= 4; sem++) {
      for (let cNum = 1; cNum <= 4; cNum++) {
        const cCode = `${op.prefix}-${sem}0${cNum}`;
        const cTitle = `${op.title} (Part ${sem}.${cNum})`;
        const course = await prisma.course.create({
          data: {
            title: cTitle,
            code: cCode,
            creditHours: 3,
            creditHoursFormat: "3(3-0)",
            theoryHours: 3,
            labHours: 0,
            courseType: "THEORY",
            session: "2024-2028",
            semester: sem,
            programId: progs[op.progCode].id,
            departmentId: depts[op.deptCode].id,
            facultyId: op.fac.id,
            syllabusOrder: cNum,
            syllabusJson: JSON.stringify({
              description: `Standard syllabus for ${cTitle}`,
              clos: ["CLO 1: Foundation knowledge", "CLO 2: Critical analysis"],
              assessment: { assignments: 20, quizzes: 10, midterm: 30, finalExam: 40 }
            }),
            isActive: true
          }
        });
        allCreatedCourses[op.progCode].push(course);
      }
    }
  }

  // ─── 7. FEE SETTINGS ─────────────────────────────────────────────────────
  console.log("💳 Creating Fee Settings...");
  
  const feeSettingsData = [
    { key: "BS_ADMISSION", session: "2024-2028", label: "BS Admission Fee", amount: 15000, category: "BS", description: "One-time admission fee for regular BS programs" },
    { key: "BS_SEMESTER", session: "2024-2028", label: "BS Semester Tuition Fee", amount: 25000, category: "BS", description: "Per-semester academic tuition fee" },
    { key: "BS_BRIDGING", session: "2024-2026", label: "BS Bridging Admission Fee", amount: 18000, category: "BS", description: "5th semester bridging admission fee" },
    { key: "INTER_ADMISSION", session: "2024-2026", label: "Intermediate Admission Fee", amount: 8000, category: "INTERMEDIATE", description: "Admission fee for F.Sc / F.A" },
    { key: "INTER_SEMESTER", session: "2024-2026", label: "Intermediate Annual Fee", amount: 12000, category: "INTERMEDIATE", description: "Annual tuition and lab charges" },
    { key: "EXAM_FEE", session: "2024-2028", label: "Semester Examination Fee", amount: 3500, category: "EXAM", description: "Official examination & gazette fee" },
    { key: "DMC_FEE", session: "2024-2028", label: "Detailed Marks Certificate (DMC) Fee", amount: 1500, category: "OTHER", description: "Official transcript & DMC verification fee" },
    { key: "LATE_FINE", session: "2024-2028", label: "Late Submission Surcharge", amount: 1000, category: "OTHER", description: "Late fee penalty" }
  ];

  for (const fs of feeSettingsData) {
    await prisma.feeSettings.create({ data: fs });
  }

  // ─── 8. COMPREHENSIVE STUDENT PERSONAS ACROSS ALL MODULES ────────────────
  console.log("🎓 Creating Rich Student Personas (Graduated, Freeze, Dropout, Bridging, Migration, Active)...");

  // Helper to create a fully formed student
  async function createStudentPersona({
    name, email, rollNumber, cnic, phone, address, fatherName,
    educationLevel, programCode, currentSemester, bsAdmissionType,
    session, gender, statusType, statusReason, sscMarks, hsscMarks, bscDetails,
    isGraduated = false, feeStatus = "PAID"
  }: any) {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedStudentPw,
        role: "STUDENT",
        isActive: statusType !== "QUIT" && statusType !== "DROPOUT"
      }
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        rollNumber,
        educationLevel,
        session: session || "2024-2028",
        fatherName,
        cnic,
        contactNumber: phone,
        residentAddress: address,
        programId: progs[programCode]?.id || null,
        groupId: educationLevel === "INTERMEDIATE" ? (programCode === "FSC-MED" ? preMedGroup.id : preEngGroup.id) : null,
        bsAdmissionType: bsAdmissionType || (educationLevel === "BS" ? "REGULAR" : null),
        currentSemester: currentSemester || 1,
        bscGroup: bscDetails?.group || null,
        bscObtained: bscDetails?.obtained || null,
        bscTotal: bscDetails?.total || null,
        bscYear: bscDetails?.year || null,
        bscBoard: bscDetails?.board || null,
        isActive: statusType !== "QUIT" && statusType !== "DROPOUT"
      }
    });

    // Create matching Admission record
    const admission = await prisma.admission.create({
      data: {
        studentName: name,
        fatherName,
        cnic,
        dateOfBirth: new Date("2004-04-12"),
        contactNumber: phone,
        email,
        residentAddress: address,
        educationLevel,
        programId: progs[programCode]?.id || null,
        groupId: student.groupId,
        bsAdmissionType: student.bsAdmissionType,
        session: student.session,
        status: "APPROVED",
        gender: gender || "MALE",
        sscObtained: sscMarks || 920,
        sscTotal: 1100,
        sscYear: 2022,
        sscBoard: "BBISE QUETTA",
        hsscObtained: hsscMarks || 945,
        hsscTotal: 1100,
        hsscYear: 2024,
        hsscBoard: "BBISE QUETTA",
        bscGroup: student.bscGroup,
        bscObtained: student.bscObtained,
        bscTotal: student.bscTotal,
        bscYear: student.bscYear,
        bscBoard: student.bscBoard
      }
    });

    // Create StudentStatus if non-active or special status
    if (statusType) {
      await prisma.studentStatus.create({
        data: {
          studentId: student.id,
          statusType,
          reason: statusReason || `Official ${statusType} record`,
          fromDate: new Date("2026-09-01"),
          toDate: statusType === "FREEZE" ? new Date("2027-02-28") : null,
          approvedBy: "Prof. Tariq Mahmud (BS Controller)",
          notes: `Official status recorded in CMS under student actions ledger.`
        }
      });
    }

    // Create Challan & Fee records
    const challanNum = `CHL-${rollNumber.replace(/[^A-Za-z0-9]/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
    const feeAmount = educationLevel === "BS" ? 25000 : 12000;
    
    await prisma.challan.create({
      data: {
        challanNumber: challanNum,
        cnic,
        applicantName: name,
        fatherName,
        feeType: educationLevel === "BS" ? "BS_SEMESTER" : "INTER_SEMESTER",
        feeLabel: educationLevel === "BS" ? "BS Semester Fee" : "Intermediate Annual Fee",
        amount: feeAmount,
        dueDate: new Date(feeStatus === "PAID" ? "2026-08-30" : "2026-09-30"),
        status: feeStatus === "PAID" ? "PAID" : "PENDING",
        educationLevel,
        session: student.session,
        semester: currentSemester || 1,
        paidAt: feeStatus === "PAID" ? new Date("2026-08-15") : null,
        paidId: feeStatus === "PAID" ? `PAID-20260815-${Math.floor(10000 + Math.random() * 90000)}` : null,
        gender: gender || "MALE",
        programId: student.programId,
        admissionId: admission.id,
        studentId: student.id
      }
    });

    await prisma.fee.create({
      data: {
        studentId: student.id,
        amount: feeAmount,
        dueDate: new Date("2026-09-30"),
        status: feeStatus === "PAID" ? "PAID" : (feeStatus === "WAIVED" ? "WAIVED" : "UNPAID"),
        challanNumber: `FEE-${challanNum}`,
        feeType: "TUITION",
        semester: currentSemester || 1,
        educationLevel,
        paidAt: feeStatus === "PAID" ? new Date("2026-08-15") : null
      }
    });

    return { user, student, admission };
  }

  // --- A. GRADUATED STUDENTS (Completed all 8 Semesters!) ---
  console.log("  🎓 Seeding Graduated Alumni with 8-semester results...");
  const graduated1 = await createStudentPersona({
    name: "Daniyal Ahmed Khan (Graduate)",
    email: "daniyal.grad@student.edu.pk",
    rollNumber: "2020-BSCS-001",
    cnic: "54400-1111111-1",
    phone: "0333-1111111",
    address: "Al-Hamd Town, Quetta",
    fatherName: "Jahangir Khan",
    educationLevel: "BS",
    programCode: "BSCS",
    currentSemester: 8,
    session: "2020-2024",
    gender: "MALE",
    statusType: "GRADUATION",
    statusReason: "Successfully completed BS Degree in Computer Science with Honors (CGPA: 3.84)",
    isGraduated: true,
    feeStatus: "PAID"
  });

  const graduated2 = await createStudentPersona({
    name: "Ayesha Bibi Baloch (Graduate)",
    email: "ayesha.grad@student.edu.pk",
    rollNumber: "2020-BSCS-002",
    cnic: "54400-2222222-2",
    phone: "0333-2222222",
    address: "Brewery Road, Quetta",
    fatherName: "Sardar Sanaullah Baloch",
    educationLevel: "BS",
    programCode: "BSCS",
    currentSemester: 8,
    session: "2020-2024",
    gender: "FEMALE",
    statusType: "GRADUATION",
    statusReason: "Degree Awarded - 1st Division, Merit Position",
    isGraduated: true,
    feeStatus: "PAID"
  });

  // Populate all 8 semesters marks & results for Graduated Students (Daniyal & Ayesha)
  const bscsCourses = allCreatedCourses.BSCS;
  for (const grad of [graduated1, graduated2]) {
    let cumulativePoints = 0;
    let cumulativeCredits = 0;

    for (let sem = 1; sem <= 8; sem++) {
      const semCourses = bscsCourses.filter(c => c.semester === sem);
      let semPoints = 0;
      let semCredits = 0;

      for (const course of semCourses) {
        // Enroll
        await prisma.enrollment.create({
          data: {
            studentId: grad.student.id,
            courseId: course.id,
            semester: sem,
            status: "ACTIVE"
          }
        });

        // High marks for graduate (80-95)
        const obt = grad.user.name.includes("Daniyal") ? 88 : 84;
        const gp = getGP(obt);
        const cr = course.creditHours || 3;

        await prisma.marks.create({
          data: {
            studentId: grad.student.id,
            courseId: course.id,
            assignmentMarks: 18,
            quizMarks: 9,
            midtermMarks: 26,
            practicalMarks: course.labHours > 0 ? 18 : 0,
            finalMarks: 35,
            obtainedMarks: obt,
            totalMarks: 100,
            status: "LOCKED",
            isLocked: true
          }
        });

        semPoints += gp * cr;
        semCredits += cr;
      }

      cumulativePoints += semPoints;
      cumulativeCredits += semCredits;

      const semGPA = parseFloat((semPoints / (semCredits || 1)).toFixed(2));
      const cumCGPA = parseFloat((cumulativePoints / (cumulativeCredits || 1)).toFixed(2));

      await prisma.result.create({
        data: {
          studentId: grad.student.id,
          semester: sem,
          gpa: semGPA,
          cgpa: cumCGPA,
          status: "PROMOTED",
          isLocked: true,
          lockedBy: "Prof. Tariq Mahmud",
          lockedAt: new Date()
        }
      });

      if (sem < 8) {
        await prisma.promotion.create({
          data: {
            studentId: grad.student.id,
            fromSemester: sem,
            toSemester: sem + 1,
            status: "PROMOTED",
            gpa: semGPA,
            cgpa: cumCGPA,
            promotedBy: "BS Controller"
          }
        });
      }
    }
  }

  // --- B. FREEZE SEMESTER STUDENTS ---
  console.log("  ❄️ Seeding Frozen Semester Students...");
  const freeze1 = await createStudentPersona({
    name: "Waleed Ahmed Kasi (Frozen)",
    email: "waleed.freeze@student.edu.pk",
    rollNumber: "2024-BSCS-015",
    cnic: "54400-3333333-3",
    phone: "0333-3333333",
    address: "Kasi Road, Quetta",
    fatherName: "Mirza Ahmed Kasi",
    educationLevel: "BS",
    programCode: "BSCS",
    currentSemester: 3,
    session: "2024-2028",
    gender: "MALE",
    statusType: "FREEZE",
    statusReason: "Medical Leave: Underwent knee ligament surgery. Semester 3 frozen for Fall 2026.",
    feeStatus: "PAID"
  });

  const freeze2 = await createStudentPersona({
    name: "Hina Gul Mandokhail (Frozen)",
    email: "hina.freeze@student.edu.pk",
    rollNumber: "2023-BSENG-012",
    cnic: "54400-4444444-4",
    phone: "0333-4444444",
    address: "Airport Road, Quetta",
    fatherName: "Nawab Gul Mandokhail",
    educationLevel: "BS",
    programCode: "BSENG",
    currentSemester: 4,
    session: "2023-2027",
    gender: "FEMALE",
    statusType: "FREEZE",
    statusReason: "Domestic / Family relocation sabbatical approved for 6 months.",
    feeStatus: "PAID"
  });

  // --- C. QUIT & DROPOUT STUDENTS ---
  console.log("  🚪 Seeding Quit / Dropout Students...");
  await createStudentPersona({
    name: "Farhan Ullah Marwat (Quit)",
    email: "farhan.quit@student.edu.pk",
    rollNumber: "2024-BSCS-091",
    cnic: "54400-5555555-5",
    phone: "0333-5555555",
    address: "Samungli Road, Quetta",
    fatherName: "Ullah Khan Marwat",
    educationLevel: "BS",
    programCode: "BSCS",
    currentSemester: 2,
    session: "2024-2028",
    gender: "MALE",
    statusType: "QUIT",
    statusReason: "Moved to Islamabad for full-time job employment.",
    feeStatus: "PAID"
  });

  await createStudentPersona({
    name: "Noman Tariq Mengal",
    email: "noman.dropout@student.edu.pk",
    rollNumber: "2024-BSCS-092",
    cnic: "54400-6666666-6",
    phone: "0333-6666666",
    address: "Sariab Mill, Quetta",
    fatherName: "Tariq Mengal",
    educationLevel: "BS",
    programCode: "BSCS",
    currentSemester: 1,
    session: "2024-2028",
    gender: "MALE",
    statusType: "DROPOUT",
    statusReason: "Academic dismissal: SGPA below 1.0 in Semester 1.",
    feeStatus: "PAID"
  });

  // --- D. BRIDGING (5TH SEMESTER) STUDENTS ---
  console.log("  🌉 Seeding Bridging (5th Semester) Students...");
  const bridging1 = await createStudentPersona({
    name: "Babar Azam Lehri (Bridging 5th)",
    email: "babar.bridging@student.edu.pk",
    rollNumber: "2024-BSCS-B01",
    cnic: "54400-7777777-7",
    phone: "0333-7777777",
    address: "Patel Bagh, Quetta",
    fatherName: "Azam Khan Lehri",
    educationLevel: "BS",
    programCode: "BSCS",
    currentSemester: 5,
    bsAdmissionType: "BRIDGING_5TH",
    session: "2024-2026",
    gender: "MALE",
    bscDetails: { group: "ADP_CS", obtained: 850, total: 1000, year: 2024, board: "University of Balochistan" },
    feeStatus: "PAID"
  });

  const bridging2 = await createStudentPersona({
    name: "Maria Kakar (Bridging 5th)",
    email: "maria.bridging@student.edu.pk",
    rollNumber: "2024-BSENG-B02",
    cnic: "54400-8888888-8",
    phone: "0333-8888888",
    address: "Nawa Killi, Quetta",
    fatherName: "Sher Muhammad Kakar",
    educationLevel: "BS",
    programCode: "BSENG",
    currentSemester: 5,
    bsAdmissionType: "BRIDGING_5TH",
    session: "2024-2026",
    gender: "FEMALE",
    bscDetails: { group: "ADP_ARTS", obtained: 790, total: 1000, year: 2024, board: "Sardar Bahadur Khan Women University" },
    feeStatus: "PAID"
  });

  // --- E. MIGRATION STUDENTS (MIGRATION IN & OUT) ---
  console.log("  🔄 Seeding Migration Students...");
  const migrationIn = await createStudentPersona({
    name: "Zeeshan Haider (Migration In)",
    email: "zeeshan.migin@student.edu.pk",
    rollNumber: "2024-BSCS-M01",
    cnic: "54400-9999999-9",
    phone: "0333-9999999",
    address: "Chaman Phatak, Quetta",
    fatherName: "Haider Ali",
    educationLevel: "BS",
    programCode: "BSCS",
    currentSemester: 5,
    bsAdmissionType: "MIGRATION",
    session: "2024-2028",
    gender: "MALE",
    statusType: "MIGRATION",
    statusReason: "Migrated from BUITEMS Quetta with 64 transfer credit hours approved by Academic Council.",
    feeStatus: "PAID"
  });

  // --- F. ACTIVE REGULAR BS & INTERMEDIATE STUDENTS (Across Semesters 1, 2, 3, 4) ---
  console.log("  👥 Seeding Active Cohorts for BS and Intermediate...");
  
  const activeCohorts = [
    // BSCS Sem 1
    { name: "Ali Hamza Bugti", email: "ali.bugti@student.edu.pk", roll: "2024-BSCS-003", cnic: "54400-1000001-1", sem: 1, prog: "BSCS", fee: "PAID", gender: "MALE" },
    { name: "Fatima Noor Mengal", email: "fatima.noor@student.edu.pk", roll: "2024-BSCS-004", cnic: "54400-1000002-2", sem: 1, prog: "BSCS", fee: "PAID", gender: "FEMALE" },
    { name: "Muhammad Bilal Achakzai", email: "bilal.achakzai@student.edu.pk", roll: "2024-BSCS-005", cnic: "54400-1000003-3", sem: 1, prog: "BSCS", fee: "UNPAID", gender: "MALE" },
    { name: "Zainab Tariq", email: "zainab.tariq@student.edu.pk", roll: "2024-BSCS-006", cnic: "54400-1000004-4", sem: 1, prog: "BSCS", fee: "PAID", gender: "FEMALE" },
    { name: "Sikandar Hayat", email: "sikandar.hayat@student.edu.pk", roll: "2024-BSCS-007", cnic: "54400-1000005-5", sem: 1, prog: "BSCS", fee: "PAID", gender: "MALE" },

    // BSCS Sem 2
    { name: "Hamid Raza Baloch", email: "hamid.raza@student.edu.pk", roll: "2024-BSCS-008", cnic: "54400-1000006-6", sem: 2, prog: "BSCS", fee: "PAID", gender: "MALE" },
    { name: "Sobia Karim", email: "sobia.karim@student.edu.pk", roll: "2024-BSCS-009", cnic: "54400-1000007-7", sem: 2, prog: "BSCS", fee: "PAID", gender: "FEMALE" },
    { name: "Asadullah Khan", email: "asad.khan@student.edu.pk", roll: "2024-BSCS-010", cnic: "54400-1000008-8", sem: 2, prog: "BSCS", fee: "UNPAID", gender: "MALE" },

    // BSCS Sem 3
    { name: "Shahid Afridi Kakar", email: "shahid.kakar@student.edu.pk", roll: "2024-BSCS-011", cnic: "54400-1000009-9", sem: 3, prog: "BSCS", fee: "PAID", gender: "MALE" },
    { name: "Noreen Zehri", email: "noreen.zehri@student.edu.pk", roll: "2024-BSCS-012", cnic: "54400-1000010-0", sem: 3, prog: "BSCS", fee: "PAID", gender: "FEMALE" },

    // BS English Sem 1 & 2
    { name: "Kamran Bangulzai", email: "kamran.bangul@student.edu.pk", roll: "2024-BSENG-001", cnic: "54400-2000001-1", sem: 1, prog: "BSENG", fee: "PAID", gender: "MALE" },
    { name: "Sadia Rind", email: "sadia.rind@student.edu.pk", roll: "2024-BSENG-002", cnic: "54400-2000002-2", sem: 1, prog: "BSENG", fee: "UNPAID", gender: "FEMALE" },
    { name: "Mehmood Khan", email: "mehmood.khan@student.edu.pk", roll: "2024-BSENG-003", cnic: "54400-2000003-3", sem: 2, prog: "BSENG", fee: "PAID", gender: "MALE" },

    // BS Economics Sem 1
    { name: "Ghulam Mustafa", email: "mustafa.eco@student.edu.pk", roll: "2024-BSECO-001", cnic: "54400-3000001-1", sem: 1, prog: "BSECO", fee: "PAID", gender: "MALE" },
    { name: "Nazia Perveen", email: "nazia.eco@student.edu.pk", roll: "2024-BSECO-002", cnic: "54400-3000002-2", sem: 1, prog: "BSECO", fee: "PAID", gender: "FEMALE" },

    // Intermediate Students (Pre-Engineering & Pre-Medical)
    { name: "Syed Hassan Shah", email: "hassan.inter@student.edu.pk", roll: "2024-FSC-101", cnic: "54400-4000001-1", sem: 1, prog: "FSC-ENG", fee: "PAID", gender: "MALE", level: "INTERMEDIATE" },
    { name: "Tahir Mahmood", email: "tahir.inter@student.edu.pk", roll: "2024-FSC-102", cnic: "54400-4000002-2", sem: 1, prog: "FSC-ENG", fee: "UNPAID", gender: "MALE", level: "INTERMEDIATE" },
    { name: "Zubeda Bibi", email: "zubeda.inter@student.edu.pk", roll: "2024-FSC-201", cnic: "54400-4000003-3", sem: 1, prog: "FSC-MED", fee: "PAID", gender: "FEMALE", level: "INTERMEDIATE" },
    { name: "Mahnoor Baloch", email: "mahnoor.inter@student.edu.pk", roll: "2024-FSC-202", cnic: "54400-4000004-4", sem: 2, prog: "FSC-MED", fee: "PAID", gender: "FEMALE", level: "INTERMEDIATE" },
    { name: "Rashid Ali", email: "rashid.fa@student.edu.pk", roll: "2024-FA-301", cnic: "54400-4000005-5", sem: 1, prog: "FA", fee: "PAID", gender: "MALE", level: "INTERMEDIATE" },
  ];

  const activeStudents: any[] = [];

  for (const ac of activeCohorts) {
    const sObj = await createStudentPersona({
      name: ac.name,
      email: ac.email,
      rollNumber: ac.roll,
      cnic: ac.cnic,
      phone: `0333-${Math.floor(1000000 + Math.random() * 9000000)}`,
      address: "Model Town, Quetta",
      fatherName: "Muhammad " + ac.name.split(" ").slice(-1)[0],
      educationLevel: ac.level || "BS",
      programCode: ac.prog,
      currentSemester: ac.sem,
      session: ac.level === "INTERMEDIATE" ? "2024-2026" : "2024-2028",
      gender: ac.gender,
      feeStatus: ac.fee
    });
    activeStudents.push({ ...sObj, sem: ac.sem, prog: ac.prog, level: ac.level || "BS" });
  }

  // --- G. ENROLLMENTS, MARKS, RESULTS & ATTENDANCE FOR ACTIVE STUDENTS ---
  console.log("  📝 Populating Enrollments, Marks, Results, and Attendance...");
  
  for (const s of activeStudents) {
    if (s.level === "BS") {
      const progCourses = allCreatedCourses[s.prog] || [];
      const semCourses = progCourses.filter(c => c.semester === s.sem);

      let totalPoints = 0;
      let totalCr = 0;

      for (let i = 0; i < semCourses.length; i++) {
        const course = semCourses[i];
        
        // Enrollment
        await prisma.enrollment.create({
          data: {
            studentId: s.student.id,
            courseId: course.id,
            semester: s.sem,
            status: "ACTIVE"
          }
        });

        // Attendance (Recent dates)
        for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
          const attDate = new Date();
          attDate.setDate(attDate.getDate() - dayOffset);
          await prisma.attendance.create({
            data: {
              studentId: s.student.id,
              courseId: course.id,
              date: attDate,
              status: dayOffset === 3 ? "ABSENT" : "PRESENT",
              educationLevel: "BS"
            }
          });
        }

        // Marks (Varied for realistic grading & probation testing)
        // Some students get distinction, some pass, some on probation (obt < 50)
        let obt = 75 + (i * 3) % 20;
        if (s.user.name.includes("Bilal Achakzai") && i === 0) obt = 45; // Fail 1 course to test probation in gazette
        if (s.user.name.includes("Ali Hamza")) obt = 92; // 4.0 topper

        const gp = getGP(obt);
        const cr = course.creditHours || 3;
        totalPoints += gp * cr;
        totalCr += cr;

        await prisma.marks.create({
          data: {
            studentId: s.student.id,
            courseId: course.id,
            assignmentMarks: Math.round(obt * 0.18),
            quizMarks: Math.round(obt * 0.10),
            midtermMarks: Math.round(obt * 0.28),
            practicalMarks: course.labHours > 0 ? Math.round(obt * 0.15) : 0,
            finalMarks: Math.round(obt * 0.44),
            obtainedMarks: obt,
            totalMarks: 100,
            status: "LOCKED",
            isLocked: true
          }
        });
      }

      const gpa = totalCr > 0 ? parseFloat((totalPoints / totalCr).toFixed(2)) : 3.0;
      await prisma.result.create({
        data: {
          studentId: s.student.id,
          semester: s.sem,
          gpa: gpa,
          cgpa: gpa,
          status: gpa >= 2.0 ? "PROMOTED" : (gpa >= 1.0 ? "PROBATION" : "DROPOUT"),
          isLocked: true,
          lockedBy: "Prof. Tariq Mahmud",
          lockedAt: new Date()
        }
      });
    } else {
      // Intermediate attendance
      for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
        const attDate = new Date();
        attDate.setDate(attDate.getDate() - dayOffset);
        await prisma.attendance.create({
          data: {
            studentId: s.student.id,
            classSectionId: sectionMed1.id,
            date: attDate,
            status: "PRESENT",
            educationLevel: "INTERMEDIATE"
          }
        });
      }
    }
  }

  // --- H. PENDING & REJECTED ADMISSIONS (For Testing Admission Approval Flow) ---
  console.log("  📋 Seeding Pending & Rejected Admission Applicants...");
  
  const applicants = [
    { name: "Sanaullah Kakar", father: "Naimatullah Kakar", cnic: "54400-6000001-1", phone: "0333-6000001", email: "sana.kakar@gmail.com", prog: "BSCS", status: "PENDING", gender: "MALE", type: "REGULAR" },
    { name: "Hina Tareen", father: "Tariq Tareen", cnic: "54400-6000002-2", phone: "0300-6000002", email: "hina.tareen@gmail.com", prog: "BSPHY", status: "PENDING", gender: "FEMALE", type: "REGULAR" },
    { name: "Imran Khan Mengal", father: "Sardar Mengal", cnic: "54400-6000003-3", phone: "0312-6000003", email: "imran.mengal@gmail.com", prog: "BSCS", status: "PENDING", gender: "MALE", type: "BRIDGING_5TH" },
    { name: "Shahzaman Bugti", father: "Bugti Khan", cnic: "54400-6000004-4", phone: "0345-6000004", email: "shahzaman.bugti@gmail.com", prog: "FSC-ENG", status: "PENDING", gender: "MALE", level: "INTERMEDIATE" },
    { name: "Rukhsana Bibi", father: "Allah Dad", cnic: "54400-6000005-5", phone: "0321-6000005", email: "rukhsana.bibi@gmail.com", prog: "BSCS", status: "REJECTED", gender: "FEMALE", type: "REGULAR" },
  ];

  for (const app of applicants) {
    const adm = await prisma.admission.create({
      data: {
        studentName: app.name,
        fatherName: app.father,
        cnic: app.cnic,
        dateOfBirth: new Date("2005-06-15"),
        contactNumber: app.phone,
        email: app.email,
        residentAddress: "Zarghoon Road, Quetta",
        educationLevel: app.level || "BS",
        programId: progs[app.prog]?.id || null,
        groupId: app.level === "INTERMEDIATE" ? preEngGroup.id : null,
        bsAdmissionType: app.type || (app.level === "INTERMEDIATE" ? null : "REGULAR"),
        session: app.level === "INTERMEDIATE" ? "2024-2026" : "2024-2028",
        status: app.status,
        gender: app.gender,
        sscObtained: 890,
        sscTotal: 1100,
        sscYear: 2022,
        sscBoard: "BBISE QUETTA",
        hsscObtained: 880,
        hsscTotal: 1100,
        hsscYear: 2024,
        hsscBoard: "BBISE QUETTA",
        bscGroup: app.type === "BRIDGING_5TH" ? "ADP_CS" : null,
        bscObtained: app.type === "BRIDGING_5TH" ? 780 : null,
        bscTotal: app.type === "BRIDGING_5TH" ? 1000 : null,
        bscYear: app.type === "BRIDGING_5TH" ? 2024 : null,
        bscBoard: app.type === "BRIDGING_5TH" ? "UOB" : null
      }
    });

    const chNum = `CHL-APP-${Math.floor(100000 + Math.random() * 900000)}`;
    await prisma.challan.create({
      data: {
        challanNumber: chNum,
        cnic: app.cnic,
        applicantName: app.name,
        fatherName: app.father,
        feeType: app.level === "INTERMEDIATE" ? "INTER_ADMISSION" : "BS_ADMISSION",
        feeLabel: app.level === "INTERMEDIATE" ? "Intermediate Admission Challan" : "BS Admission Challan",
        amount: app.level === "INTERMEDIATE" ? 8000 : 15000,
        dueDate: new Date("2026-09-20"),
        status: app.status === "REJECTED" ? "REJECTED" : "PENDING",
        educationLevel: app.level || "BS",
        session: adm.session,
        gender: app.gender,
        programId: adm.programId,
        admissionId: adm.id
      }
    });
  }

  // ─── 9. TIMETABLE, DATESHEET & FACULTY EXAM DUTIES ──────────────────────
  console.log("📅 Creating Timetable, Datesheets & Exam Duty Rosters...");

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const timeSlots = [
    { start: "08:30", end: "10:00" },
    { start: "10:00", end: "11:30" },
    { start: "11:30", end: "01:00" },
    { start: "01:30", end: "03:00" }
  ];

  const sem1BscsCourses = bscsCourses.filter(c => c.semester === 1);
  const createdTimetables: any[] = [];

  for (let i = 0; i < sem1BscsCourses.length; i++) {
    const course = sem1BscsCourses[i];
    const fac = facultyList[i % facultyList.length];
    const slot = timeSlots[i % timeSlots.length];

    const tt = await prisma.timetable.create({
      data: {
        session: "2024-2028",
        semester: 1,
        dayOfWeek: days[i % days.length],
        startTime: slot.start,
        endTime: slot.end,
        educationLevel: "BS",
        generationMode: "MANUAL",
        status: "PUBLISHED",
        isFinalized: true,
        courseId: course.id,
        facultyId: fac.id,
        programId: progs["BSCS"].id,
        departmentId: depts["CS"].id
      }
    });
    createdTimetables.push(tt);

    // Datesheet for this course
    const examDate = new Date("2026-10-10");
    examDate.setDate(examDate.getDate() + (i * 2));

    const ds = await prisma.datesheet.create({
      data: {
        session: "2024-2028",
        semester: 1,
        examType: "FINAL_TERM",
        examSession: "Fall 2026",
        date: examDate,
        startTime: "09:00 AM",
        endTime: "12:00 PM",
        generationMode: "MANUAL",
        status: "PUBLISHED",
        isFinalized: true,
        timetableId: tt.id,
        courseId: course.id,
        programId: progs["BSCS"].id,
        departmentId: depts["CS"].id
      }
    });

    // Mandatory Subject Teacher Duty
    await prisma.examDuty.create({
      data: {
        datesheetId: ds.id,
        facultyId: fac.id,
        dutyType: "MANDATORY",
        isMandatory: true,
        room: `Room ${101 + i} (CS Block)`,
        shiftTime: "09:00 AM - 12:00 PM",
        notes: "Subject course instructor in-charge of paper delivery."
      }
    });

    // Secondary Invigilator Duty
    const invigFac = facultyList[(i + 3) % facultyList.length];
    await prisma.examDuty.create({
      data: {
        datesheetId: ds.id,
        facultyId: invigFac.id,
        dutyType: "INVIGILATOR",
        isMandatory: false,
        room: `Room ${101 + i} (CS Block)`,
        shiftTime: "09:00 AM - 12:00 PM",
        notes: "Hall invigilation duty."
      }
    });

    // Superintendent Duty
    if (i === 0) {
      const supFac = facultyList[2]; // Dr. Tariq Mansoor
      await prisma.examDuty.create({
        data: {
          datesheetId: ds.id,
          facultyId: supFac.id,
          dutyType: "SUPERINTENDENT",
          isMandatory: false,
          room: "Main Examination Center - Control Room",
          shiftTime: "08:30 AM - 01:00 PM",
          notes: "Chief Center Superintendent."
        }
      });
    }
  }

  // ─── 10. EXPENSES MODULE ─────────────────────────────────────────────────
  console.log("💰 Creating Expenses Records...");

  const expensesData = [
    { category: "SALARY", date: new Date("2026-08-01"), desc: "Visiting Faculty Monthly Honorarium (Fall 2026)", amount: 350000, vendor: "Visiting Faculty Pool", method: "BANK_TRANSFER", dept: depts["CS"].id, status: "PAID" },
    { category: "UTILITIES", date: new Date("2026-08-05"), desc: "Main Campus Electricity Bill (QESCO)", amount: 185000, vendor: "QESCO Quetta", method: "BANK_TRANSFER", dept: depts["CS"].id, status: "PAID" },
    { category: "LAB_EQUIPMENT", date: new Date("2026-08-10"), desc: "Procurement of 20 Core i7 Workstations for CS Lab 2", amount: 950000, vendor: "Dell Technologies Authorized Vendor", method: "CHEQUE", dept: depts["CS"].id, status: "PAID" },
    { category: "MAINTENANCE", date: new Date("2026-08-12"), desc: "Physics Lab Solar Inverter Battery Replacement", amount: 85000, vendor: "Balochistan Solar Solutions", method: "CASH", dept: depts["PHY"].id, status: "PAID" },
    { category: "STATIONERY", date: new Date("2026-08-14"), desc: "Examination Answer Booklets and Official Gazette Printing", amount: 65000, vendor: "Al-Falah Printing Press", method: "CHEQUE", dept: depts["INTER"].id, status: "PAID" },
    { category: "EVENTS", date: new Date("2026-08-18"), desc: "Annual Convocation Stage & Degree Folders", amount: 120000, vendor: "Royal Event Management", method: "CHEQUE", dept: depts["CS"].id, status: "PAID" }
  ];

  for (const exp of expensesData) {
    await prisma.expense.create({
      data: {
        category: exp.category,
        date: exp.date,
        description: exp.desc,
        amount: exp.amount,
        vendorPayee: exp.vendor,
        paymentMethod: exp.method,
        departmentId: exp.dept,
        session: "2024-2028",
        status: exp.status,
        createdBy: "Prof. Dr. Zahid Mengal",
        isActive: true
      }
    });
  }

  // ─── 11. AUDIT LOGS ──────────────────────────────────────────────────────
  console.log("📜 Creating Audit Trail Logs...");

  const auditData = [
    { action: "LOGIN", entity: "User", desc: "Super Admin logged into College CMS portal.", email: "admin@college.edu", name: "Super Admin" },
    { action: "APPROVE", entity: "Graduation", desc: "Graduation status approved for Daniyal Ahmed Khan (2020-BSCS-001).", email: "controller@college.edu", name: "BS Controller" },
    { action: "UPDATE", entity: "StudentStatus", desc: "Freeze status approved for Waleed Ahmed Kasi (2024-BSCS-015).", email: "controller@college.edu", name: "BS Controller" },
    { action: "LOCK", entity: "Marks", desc: "Semester 1 Final Marks locked and signed by HOD Computer Science.", email: "usman.cs@college.edu", name: "Dr. Muhammad Usman" },
    { action: "PUBLISH", entity: "Timetable", desc: "Fall 2026 BS Computer Science timetable published.", email: "controller@college.edu", name: "BS Controller" },
    { action: "CREATE", entity: "Datesheet", desc: "Fall 2026 Final Term exam datesheet generated and verified.", email: "controller@college.edu", name: "BS Controller" }
  ];

  for (const a of auditData) {
    await prisma.auditLog.create({
      data: {
        userEmail: a.email,
        userName: a.name,
        action: a.action,
        entity: a.entity,
        description: a.desc,
        ipAddress: "127.0.0.1"
      }
    });
  }

  console.log("\n✨ ======================================================= ✨");
  console.log("🚀 ALL COMPREHENSIVE DUMMY DATA SEEDED SUCCESSFULLY!");
  console.log("✨ ======================================================= ✨");
  console.log("\n📊 Summary of Loaded Records:");
  console.log("  • Users & Staff: SuperAdmin, Controller, Principal, 12 Faculty members");
  console.log("  • Departments: 7 (CS, ENG, ECO, MATH, PHY, CHEM, INTER)");
  console.log("  • Programs: 8 (BSCS, BSENG, BSECO, BSMATH, BSPHY, FSC-ENG, FSC-MED, FA)");
  console.log("  • Courses & Syllabi: 40+ courses across Semesters 1-8 with detailed learning outcomes & breakdown");
  console.log("  • Graduated Students: 2 (8 semesters completed, CGPA > 3.6, transcripts & DMCs ready)");
  console.log("  • Frozen Semester Students: 2 (medical/relocation reasons, freeze ledger ready)");
  console.log("  • Quit & Dropout Students: 2 (dismissal / relocation testing)");
  console.log("  • Bridging (5th Sem) Students: 2 (ADP / B.Sc background scores)");
  console.log("  • Migration Students: 1 (BUITEMS transfer with credit hours)");
  console.log("  • Active BS & Inter Students: 20+ (with full enrollments, marks, results, attendance)");
  console.log("  • Admissions: 5 Pending & 1 Rejected applicants");
  console.log("  • Challans & Fees: Paid, Pending (Dues), Waived records");
  console.log("  • Timetable & Datesheet: Published Fall 2026 schedules");
  console.log("  • Faculty Exam Duty: Mandatory, Invigilator, and Superintendent rosters");
  console.log("  • Expenses & Audit Logs: Complete operational data");
  console.log("\n🔑 Test Credentials:");
  console.log("  Super Admin:   admin@college.edu      / admin123");
  console.log("  BS Controller: controller@college.edu / demo123");
  console.log("  BS Faculty:    usman.cs@college.edu   / faculty123");
  console.log("  Principal:     principal@college.edu  / demo123");
  console.log("  Student:       ali.bugti@student.edu.pk / student123");
  console.log("  Grad Student:  daniyal.grad@student.edu.pk / student123");
  console.log("─────────────────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
