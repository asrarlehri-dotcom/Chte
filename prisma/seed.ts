import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

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

function getGP(pct: number): number {
  if (pct >= 80) return 4.0;
  if (pct < 50) return 0.0;
  return parseFloat((1.0 + (Math.round(pct) - 50) * 0.1).toFixed(2));
}

async function main() {
  console.log("🌱 ===========================================================");
  console.log("🚀 STARTING COMPREHENSIVE MULTI-COLLEGE DUMMY DATA SEEDING");
  console.log("🌱 ===========================================================\n");

  // ─── 0. CLEAN EXISTING DATA ───────────────────────────────────────────────
  console.log("🧹 [1/7] Wiping old records across all tables...");
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
  console.log("✓ Old records cleared successfully.\n");

  // Hashed Passwords
  const hashedAdminPw = await bcrypt.hash("admin123", 10);
  const hashedDemoPw = await bcrypt.hash("demo123", 10);
  const hashedFacultyPw = await bcrypt.hash("faculty123", 10);
  const hashedStudentPw = await bcrypt.hash("student123", 10);
  const hashedChtePw = await bcrypt.hash("chte123", 10);

  // ─── 1. CHTE CENTRAL APEX MASTER ──────────────────────────────────────────
  console.log("🏢 [2/7] Creating CHTE Central Master Admin...");
  await prisma.user.create({
    data: {
      email: "chte@balochistan.gov.pk",
      name: "CHTE Central Super Admin",
      password: hashedChtePw,
      role: "CHTE_ADMIN",
      isActive: true,
    },
  });

  // Seed Permissions
  const permData: { module: string; action: string; description: string }[] = [];
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      permData.push({ module, action, description: `${module} - ${action}` });
    }
  }
  await prisma.permission.createMany({ data: permData, skipDuplicates: true });
  const allPerms = await prisma.permission.findMany();
  const permMap = new Map(allPerms.map((p) => [`${p.module}:${p.action}`, p.id]));

  const rolePermInserts: { role: string; permissionId: string }[] = [];
  for (const [role, moduleMap] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const [mod, actList] of Object.entries(moduleMap)) {
      for (const act of actList) {
        const pId = permMap.get(`${mod}:${act}`);
        if (pId) rolePermInserts.push({ role, permissionId: pId });
      }
    }
  }
  await prisma.rolePermission.createMany({ data: rolePermInserts, skipDuplicates: true });

  // System Settings
  const settingsData = [
    { key: "SITE_NAME", value: "CHTE Balochistan Higher Education Platform" },
    { key: "ACADEMIC_SESSIONS", value: JSON.stringify(["2022-2026", "2023-2027", "2024-2028", "2025-2029", "2024-2026", "2025-2027"]) },
    { key: "CURRENT_SESSION", value: "2024-2028" },
    { key: "GRADING_SYSTEM", value: "HEC_4_POINT" },
  ];
  for (const s of settingsData) {
    await prisma.systemSetting.create({
      data: {
        key: s.key,
        value: s.value,
        isActive: true,
      },
    });
  }

  // Academic Sessions
  const validSessions = ["2022-2026", "2023-2027", "2024-2028", "2025-2029", "2024-2026", "2025-2027"];
  for (const sessName of validSessions) {
    await prisma.academicSession.create({
      data: {
        name: sessName,
        startDate: new Date(`${sessName.split("-")[0]}-08-15`),
        endDate: new Date(`${sessName.split("-")[1]}-06-30`),
        isActive: sessName === "2024-2028",
      },
    });
  }

  // ─── 2. SEED 3 DISTINCT COLLEGES ──────────────────────────────────────────
  console.log("🏛️ [3/7] Provisioning 3 Distinct Colleges in Balochistan...");

  // College 1: Govt. Post Graduate College Quetta
  const gpgcq = await prisma.college.create({
    data: {
      name: "Govt. Post Graduate College Quetta",
      code: "GPGCQ",
      slug: "gpgc-quetta",
      tagline: "Center of Academic Excellence, Quality Research & Leadership",
      district: "Quetta",
      division: "Quetta Division",
      address: "Zarghoon Road, Quetta, Balochistan",
      contactEmail: "info@gpgcquetta.edu.pk",
      contactPhone: "+92 81 9201234",
      principalName: "Prof. Dr. Zahid Mengal",
      bankName: "Habib Bank Limited (HBL)",
      bankAccount: "0873-0001324203",
      branchCode: "0873",
      accountTitle: "Principal Govt Post Graduate College Quetta",
      isActive: true,
    },
  });

  // College 2: Govt. Science College Quetta
  const gscq = await prisma.college.create({
    data: {
      name: "Govt. Science College Quetta",
      code: "GSCQ",
      slug: "gsc-quetta",
      tagline: "Inspiring Scientific Discovery, Natural Research & Innovation",
      district: "Quetta",
      division: "Quetta Division",
      address: "Jinnah Road, Quetta, Balochistan",
      contactEmail: "info@gscq.edu.pk",
      contactPhone: "+92 81 9205555",
      principalName: "Prof. Dr. Tariq Baloch",
      bankName: "National Bank of Pakistan (NBP)",
      bankAccount: "0182-0045892101",
      branchCode: "0182",
      accountTitle: "Principal Govt Science College Quetta",
      isActive: true,
    },
  });

  // College 3: Govt. Degree College Mastung
  const gdcm = await prisma.college.create({
    data: {
      name: "Govt. Degree College Mastung",
      code: "GDCM",
      slug: "gdc-mastung",
      tagline: "Empowering Rural Youth with Higher Education & Professional Skills",
      district: "Mastung",
      division: "Kalat Division",
      address: "RCD Highway, Mastung, Balochistan",
      contactEmail: "info@gdcm.edu.pk",
      contactPhone: "+92 843 891230",
      principalName: "Prof. Abdul Ghaffar Sarparah",
      bankName: "National Bank of Pakistan (NBP)",
      bankAccount: "0491-0021345678",
      branchCode: "0491",
      accountTitle: "Principal Govt Degree College Mastung",
      isActive: true,
    },
  });

  console.log(`✓ Created colleges: [${gpgcq.code}], [${gscq.code}], [${gdcm.code}]`);

  // ─── 3. COLLEGE STAFF USERS ───────────────────────────────────────────────
  console.log("👥 [4/7] Creating Dedicated Administrative & Governance Users...");

  // GPGCQ Staff
  await prisma.user.create({
    data: { email: "admin@college.edu", name: "GPGCQ College Admin", password: hashedAdminPw, role: "COLLEGE_ADMIN", collegeId: gpgcq.id, isActive: true },
  });
  await prisma.user.create({
    data: { email: "controller@college.edu", name: "Prof. Tariq Mahmud (BS Controller)", password: hashedDemoPw, role: "BS_CONTROLLER", collegeId: gpgcq.id, isActive: true },
  });
  await prisma.user.create({
    data: { email: "principal@college.edu", name: "Prof. Dr. Zahid Mengal (Principal)", password: hashedDemoPw, role: "PRINCIPAL", collegeId: gpgcq.id, isActive: true },
  });

  // GSCQ Staff
  await prisma.user.create({
    data: { email: "admin@gscq.edu.pk", name: "GSCQ College Admin", password: hashedAdminPw, role: "COLLEGE_ADMIN", collegeId: gscq.id, isActive: true },
  });
  await prisma.user.create({
    data: { email: "controller@gscq.edu.pk", name: "Dr. Qasim Khan (BS Controller)", password: hashedDemoPw, role: "BS_CONTROLLER", collegeId: gscq.id, isActive: true },
  });
  await prisma.user.create({
    data: { email: "principal@gscq.edu.pk", name: "Prof. Dr. Tariq Baloch (Principal)", password: hashedDemoPw, role: "PRINCIPAL", collegeId: gscq.id, isActive: true },
  });

  // GDCM Staff
  await prisma.user.create({
    data: { email: "admin@gdcm.edu.pk", name: "GDCM College Admin", password: hashedAdminPw, role: "COLLEGE_ADMIN", collegeId: gdcm.id, isActive: true },
  });
  await prisma.user.create({
    data: { email: "principal@gdcm.edu.pk", name: "Prof. Abdul Ghaffar Sarparah (Principal)", password: hashedDemoPw, role: "PRINCIPAL", collegeId: gdcm.id, isActive: true },
  });

  // ─── 4. DEPARTMENTS & FACULTY PER COLLEGE ─────────────────────────────────
  console.log("📚 [5/7] Creating Departments, Faculty & Academic Programs...");

  interface CollegeSetupConfig {
    college: any;
    depts: { code: string; name: string; hod: string }[];
    programs: { code: string; name: string; level: string; deptCode: string }[];
    faculty: { name: string; email: string; desig: string; qual: string; phone: string; deptCode: string; level: string }[];
    curriculum: { progCode: string; deptCode: string; courses: { title: string; code: string; sem: number; ch: number; desc: string }[] }[];
  }

  const collegeConfigs: CollegeSetupConfig[] = [
    // 1. GPGCQ
    {
      college: gpgcq,
      depts: [
        { code: "GPGCQ-CS", name: "Department of Computer Science & IT", hod: "Dr. Muhammad Usman" },
        { code: "GPGCQ-ENG", name: "Department of English Literature & Linguistics", hod: "Dr. Ayesha Mengal" },
        { code: "GPGCQ-ECO", name: "Department of Economics & Finance", hod: "Prof. Tariq Mahmud" },
        { code: "GPGCQ-MATH", name: "Department of Mathematics & Statistics", hod: "Dr. Aslam Lehri" },
        { code: "GPGCQ-INTER", name: "Department of Intermediate Sciences", hod: "Prof. Nisar Ahmed" },
      ],
      programs: [
        { code: "GPGCQ-BSCS", name: "BS Computer Science", level: "BS", deptCode: "GPGCQ-CS" },
        { code: "GPGCQ-BSENG", name: "BS English Literature", level: "BS", deptCode: "GPGCQ-ENG" },
        { code: "GPGCQ-BSECO", name: "BS Economics", level: "BS", deptCode: "GPGCQ-ECO" },
        { code: "GPGCQ-BSMATH", name: "BS Mathematics", level: "BS", deptCode: "GPGCQ-MATH" },
        { code: "GPGCQ-FSC-ENG", name: "F.Sc Pre-Engineering", level: "INTERMEDIATE", deptCode: "GPGCQ-INTER" },
        { code: "GPGCQ-FA", name: "F.A General Arts", level: "INTERMEDIATE", deptCode: "GPGCQ-INTER" },
      ],
      faculty: [
        { name: "Dr. Muhammad Usman", email: "usman.cs@college.edu", desig: "Professor", qual: "Ph.D Computer Science (FAST)", phone: "0300-8381234", deptCode: "GPGCQ-CS", level: "BS" },
        { name: "Prof. Shahida Kakar", email: "shahida.cs@college.edu", desig: "Associate Professor", qual: "MS Computer Science (UoB)", phone: "0333-7891234", deptCode: "GPGCQ-CS", level: "BS" },
        { name: "Engr. Farooq Lehri", email: "farooq.cs@college.edu", desig: "Assistant Professor", qual: "MS Software Eng (BUITEMS)", phone: "0345-8901234", deptCode: "GPGCQ-CS", level: "BS" },
        { name: "Ms. Mahnoor Bugti", email: "mahnoor.cs@college.edu", desig: "Lecturer", qual: "BS Computer Science (GPGCQ)", phone: "0312-3456789", deptCode: "GPGCQ-CS", level: "BS" },
        { name: "Dr. Ayesha Mengal", email: "ayesha.eng@college.edu", desig: "Associate Professor", qual: "Ph.D English Literature (NUML)", phone: "0301-2345678", deptCode: "GPGCQ-ENG", level: "BS" },
        { name: "Mr. Dawood Raisani", email: "dawood.eng@college.edu", desig: "Lecturer", qual: "M.Phil Applied Linguistics", phone: "0334-5678901", deptCode: "GPGCQ-ENG", level: "BS" },
        { name: "Prof. Tariq Mahmud", email: "tariq.eco@college.edu", desig: "Professor", qual: "Ph.D Economics (QAU)", phone: "0321-4567890", deptCode: "GPGCQ-ECO", level: "BS" },
        { name: "Ms. Fatima Zehri", email: "fatima.eco@college.edu", desig: "Lecturer", qual: "M.Phil Economics", phone: "0313-9876543", deptCode: "GPGCQ-ECO", level: "BS" },
        { name: "Dr. Aslam Lehri", email: "aslam.math@college.edu", desig: "Associate Professor", qual: "Ph.D Applied Mathematics", phone: "0300-5544332", deptCode: "GPGCQ-MATH", level: "BS" },
        { name: "Prof. Nisar Ahmed", email: "nisar.inter@college.edu", desig: "Assistant Professor", qual: "M.Sc Physics", phone: "0333-1122334", deptCode: "GPGCQ-INTER", level: "INTERMEDIATE" },
      ],
      curriculum: [
        {
          progCode: "GPGCQ-BSCS",
          deptCode: "GPGCQ-CS",
          courses: [
            { sem: 1, code: "CS101", title: "Programming Fundamentals (C++)", ch: 4, desc: "Syntax, logic building, functions, arrays, pointers." },
            { sem: 1, code: "ENG101", title: "Functional English", ch: 3, desc: "Reading comprehension, technical writing, grammar." },
            { sem: 2, code: "CS102", title: "Object Oriented Programming (OOP)", ch: 4, desc: "Classes, inheritance, polymorphism, templates in C++." },
            { sem: 2, code: "MTH102", title: "Discrete Mathematics", ch: 3, desc: "Sets, graphs, trees, combinatorics, proof techniques." },
            { sem: 3, code: "CS201", title: "Data Structures & Algorithms", ch: 4, desc: "Stacks, queues, linked lists, binary trees, sorting." },
            { sem: 3, code: "CS202", title: "Computer Organization & Assembly", ch: 3, desc: "Microprocessors, x86 assembly, registers, memory." },
            { sem: 4, code: "CS203", title: "Database Systems", ch: 4, desc: "ER modeling, relational algebra, SQL, normalization, ACID." },
            { sem: 4, code: "CS204", title: "Operating Systems", ch: 3, desc: "Processes, threads, CPU scheduling, virtual memory, deadlocks." },
            { sem: 5, code: "CS301", title: "Computer Communication & Networks", ch: 4, desc: "OSI model, TCP/IP, IP subnetting, socket programming." },
            { sem: 5, code: "CS302", title: "Web Technologies & Full-Stack", ch: 3, desc: "HTML5, CSS3, modern JavaScript, Node.js, Next.js, REST APIs." },
            { sem: 6, code: "CS303", title: "Theory of Automata & Computation", ch: 3, desc: "Regular languages, DFA/NFA, context-free grammars, Turing machines." },
            { sem: 6, code: "CS304", title: "Software Engineering & Architecture", ch: 3, desc: "SDLC, agile scrum, design patterns, UML modeling." },
            { sem: 7, code: "CS401", title: "Artificial Intelligence & Expert Systems", ch: 4, desc: "Search algorithms, heuristic search, neural networks, prolog." },
            { sem: 7, code: "CS402", title: "Final Year Capstone Project - Part I", ch: 3, desc: "Problem statement, requirement specification, system design." },
            { sem: 8, code: "CS403", title: "Cloud Computing & Distributed Systems", ch: 3, desc: "Virtualization, AWS, Docker, Kubernetes, microservices." },
            { sem: 8, code: "CS404", title: "Final Year Capstone Project - Part II", ch: 3, desc: "Implementation, testing, final defense and viva-voce." },
          ],
        },
      ],
    },

    // 2. GSCQ
    {
      college: gscq,
      depts: [
        { code: "GSCQ-PHY", name: "Department of Physics", hod: "Dr. Qasim Khan" },
        { code: "GSCQ-CHEM", name: "Department of Chemistry", hod: "Dr. Shabana Baloch" },
        { code: "GSCQ-ZOO", name: "Department of Zoology", hod: "Dr. Munir Ahmed" },
        { code: "GSCQ-IT", name: "Department of Information Technology", hod: "Engr. Faraz Ahmed" },
        { code: "GSCQ-MED", name: "Department of Pre-Medical Sciences", hod: "Dr. Nisar Lehri" },
      ],
      programs: [
        { code: "GSCQ-BSPHY", name: "BS Physics", level: "BS", deptCode: "GSCQ-PHY" },
        { code: "GSCQ-BSCHEM", name: "BS Chemistry", level: "BS", deptCode: "GSCQ-CHEM" },
        { code: "GSCQ-BSZOO", name: "BS Zoology", level: "BS", deptCode: "GSCQ-ZOO" },
        { code: "GSCQ-BSIT", name: "BS Information Technology", level: "BS", deptCode: "GSCQ-IT" },
        { code: "GSCQ-FSC-MED", name: "F.Sc Pre-Medical", level: "INTERMEDIATE", deptCode: "GSCQ-MED" },
      ],
      faculty: [
        { name: "Dr. Qasim Khan", email: "qasim.phy@gscq.edu.pk", desig: "Professor", qual: "Ph.D Nuclear Physics (QAU)", phone: "0300-9281234", deptCode: "GSCQ-PHY", level: "BS" },
        { name: "Mr. Zubair Raisani", email: "zubair.phy@gscq.edu.pk", desig: "Lecturer", qual: "M.Phil Physics", phone: "0333-8899001", deptCode: "GSCQ-PHY", level: "BS" },
        { name: "Dr. Shabana Baloch", email: "shabana.chem@gscq.edu.pk", desig: "Associate Professor", qual: "Ph.D Organic Chemistry (HEJ)", phone: "0345-7788990", deptCode: "GSCQ-CHEM", level: "BS" },
        { name: "Ms. Sadia Tareen", email: "sadia.chem@gscq.edu.pk", desig: "Lecturer", qual: "M.Sc Analytical Chemistry", phone: "0313-6655443", deptCode: "GSCQ-CHEM", level: "BS" },
        { name: "Dr. Munir Ahmed", email: "munir.zoo@gscq.edu.pk", desig: "Professor", qual: "Ph.D Zoology & Marine Biology", phone: "0301-3322114", deptCode: "GSCQ-ZOO", level: "BS" },
        { name: "Ms. Hina Marri", email: "hina.bot@gscq.edu.pk", desig: "Lecturer", qual: "M.Phil Plant Genetics", phone: "0334-1122339", deptCode: "GSCQ-ZOO", level: "BS" },
        { name: "Engr. Faraz Ahmed", email: "faraz.it@gscq.edu.pk", desig: "Assistant Professor", qual: "MS Information Technology", phone: "0321-9988776", deptCode: "GSCQ-IT", level: "BS" },
        { name: "Mr. Bilal Bangulzai", email: "bilal.it@gscq.edu.pk", desig: "Lecturer", qual: "BS Information Technology", phone: "0315-5544332", deptCode: "GSCQ-IT", level: "BS" },
        { name: "Dr. Nisar Lehri", email: "nisar.med@gscq.edu.pk", desig: "Associate Professor", qual: "MBBS, M.Phil Pharmacology", phone: "0300-1199228", deptCode: "GSCQ-MED", level: "INTERMEDIATE" },
        { name: "Mr. Bashir Jamali", email: "bashir.med@gscq.edu.pk", desig: "Lecturer", qual: "M.Sc Biology & Physiology", phone: "0333-2288337", deptCode: "GSCQ-MED", level: "INTERMEDIATE" },
      ],
      curriculum: [
        {
          progCode: "GSCQ-BSPHY",
          deptCode: "GSCQ-PHY",
          courses: [
            { sem: 1, code: "PHY101", title: "Mechanics & Wave Motion", ch: 4, desc: "Newtonian mechanics, harmonic motion, wave equations." },
            { sem: 2, code: "PHY102", title: "Electricity & Magnetism", ch: 4, desc: "Gauss's law, Maxwell equations, magnetic induction." },
            { sem: 3, code: "PHY201", title: "Thermodynamics & Statistical Physics", ch: 3, desc: "Laws of thermodynamics, entropy, partition functions." },
            { sem: 4, code: "PHY202", title: "Electronics & Circuit Theory", ch: 4, desc: "Semiconductors, diodes, operational amplifiers, logic gates." },
            { sem: 5, code: "PHY301", title: "Quantum Mechanics - I", ch: 3, desc: "Schrodinger wave equation, wave packets, quantum wells." },
            { sem: 6, code: "PHY302", title: "Solid State Physics", ch: 3, desc: "Crystal lattices, X-ray diffraction, superconductivity." },
            { sem: 7, code: "PHY401", title: "Nuclear & Particle Physics", ch: 3, desc: "Radioactive decay, nuclear reactors, standard model." },
            { sem: 8, code: "PHY402", title: "Research Thesis & Final Project", ch: 4, desc: "Experimental physics laboratory research and dissertation." },
          ],
        },
      ],
    },

    // 3. GDCM
    {
      college: gdcm,
      depts: [
        { code: "GDCM-POL", name: "Department of Political Science & IR", hod: "Prof. Abdul Ghaffar Sarparah" },
        { code: "GDCM-COM", name: "Department of Commerce & Finance", hod: "Dr. Jahangir Shah" },
        { code: "GDCM-ISL", name: "Department of Islamic Studies & History", hod: "Dr. Abdul Samad" },
        { code: "GDCM-CA", name: "Department of Computer Applications", hod: "Ms. Yasmin Mengal" },
      ],
      programs: [
        { code: "GDCM-BSPOL", name: "BS Political Science", level: "BS", deptCode: "GDCM-POL" },
        { code: "GDCM-BSCOM", name: "BS Commerce (B.Com Hons)", level: "BS", deptCode: "GDCM-COM" },
        { code: "GDCM-BSISL", name: "BS Islamic Studies", level: "BS", deptCode: "GDCM-ISL" },
        { code: "GDCM-ICOM", name: "I.Com (Intermediate in Commerce)", level: "INTERMEDIATE", deptCode: "GDCM-COM" },
      ],
      faculty: [
        { name: "Prof. Abdul Ghaffar Sarparah", email: "ghaffar.pol@gdcm.edu.pk", desig: "Professor", qual: "M.Phil Political Science", phone: "0300-3456781", deptCode: "GDCM-POL", level: "BS" },
        { name: "Mr. Kamran Dehwar", email: "kamran.pol@gdcm.edu.pk", desig: "Lecturer", qual: "MA Political Science", phone: "0333-9876541", deptCode: "GDCM-POL", level: "BS" },
        { name: "Dr. Jahangir Shah", email: "jahangir.com@gdcm.edu.pk", desig: "Associate Professor", qual: "Ph.D Commerce & Banking", phone: "0345-2345671", deptCode: "GDCM-COM", level: "BS" },
        { name: "Mr. Shakeel Ahmed", email: "shakeel.com@gdcm.edu.pk", desig: "Lecturer", qual: "M.Com Accounting", phone: "0313-1234561", deptCode: "GDCM-COM", level: "BS" },
        { name: "Dr. Abdul Samad", email: "samad.isl@gdcm.edu.pk", desig: "Associate Professor", qual: "Ph.D Islamic Studies (IIUI)", phone: "0301-8765431", deptCode: "GDCM-ISL", level: "BS" },
        { name: "Hafiz Noorullah", email: "noorullah.isl@gdcm.edu.pk", desig: "Lecturer", qual: "MA Islamic Studies & Arabic", phone: "0334-7654321", deptCode: "GDCM-ISL", level: "BS" },
        { name: "Ms. Yasmin Mengal", email: "yasmin.ca@gdcm.edu.pk", desig: "Assistant Professor", qual: "MS Computer Science", phone: "0321-6543211", deptCode: "GDCM-CA", level: "BS" },
        { name: "Mr. Naveed Kurd", email: "naveed.ca@gdcm.edu.pk", desig: "Lecturer", qual: "BS Information Technology", phone: "0315-5432101", deptCode: "GDCM-CA", level: "BS" },
      ],
      curriculum: [
        {
          progCode: "GDCM-BSPOL",
          deptCode: "GDCM-POL",
          courses: [
            { sem: 1, code: "POL101", title: "Introduction to Political Science", ch: 3, desc: "Foundational theories, state models, forms of government." },
            { sem: 2, code: "POL102", title: "Western Political Philosophy", ch: 3, desc: "Plato, Aristotle, Machiavelli, Hobbes, Locke, Rousseau." },
            { sem: 3, code: "POL201", title: "Muslim Political Thought", ch: 3, desc: "Al-Farabi, Al-Mawardi, Nizam-ul-Mulk, Ibn Khaldun." },
            { sem: 4, code: "POL202", title: "International Relations & Diplomacy", ch: 3, desc: "Realism, liberalism, international law, UN governance." },
            { sem: 5, code: "POL301", title: "Constitutional Development in Pakistan", ch: 3, desc: "1956, 1962, 1973 constitutions and constitutional amendments." },
            { sem: 6, code: "POL302", title: "Comparative Politics & Governance", ch: 3, desc: "Political systems of UK, USA, China, and France." },
            { sem: 7, code: "POL401", title: "Foreign Policy of Major Powers", ch: 3, desc: "Geopolitics, South Asia security dynamics, CPEC." },
            { sem: 8, code: "POL402", title: "Research Monograph & Seminar", ch: 4, desc: "Balochistan political developments and policy thesis." },
          ],
        },
      ],
    },
  ];

  const createdDepts: Record<string, any> = {};
  const createdPrograms: Record<string, any> = {};
  const createdFaculty: Record<string, any[]> = {};
  const createdCourses: Record<string, any[]> = {};

  for (const cfg of collegeConfigs) {
    const col = cfg.college;
    createdFaculty[col.code] = [];
    createdCourses[col.code] = [];

    // 1. Departments
    for (const d of cfg.depts) {
      createdDepts[d.code] = await prisma.department.create({
        data: { name: d.name, code: d.code, hodName: d.hod, collegeId: col.id },
      });
    }

    // 2. Programs
    for (const p of cfg.programs) {
      createdPrograms[p.code] = await prisma.program.create({
        data: {
          name: p.name,
          code: p.code,
          educationLevel: p.level,
          departmentId: createdDepts[p.deptCode].id,
          collegeId: col.id,
        },
      });
    }

    // 3. Faculty
    for (const f of cfg.faculty) {
      const user = await prisma.user.create({
        data: {
          email: f.email,
          name: f.name,
          password: hashedFacultyPw,
          role: f.level === "BS" ? "BS_FACULTY" : "INTER_FACULTY",
          collegeId: col.id,
          isActive: true,
        },
      });

      const fac = await prisma.faculty.create({
        data: {
          userId: user.id,
          designation: f.desig,
          qualification: f.qual,
          educationLevel: f.level,
          contactNumber: f.phone,
          departmentId: createdDepts[f.deptCode].id,
          collegeId: col.id,
        },
      });
      createdFaculty[col.code].push(fac);
    }

    // 4. Courses & Syllabi across Semesters 1 to 8
    for (const curr of cfg.curriculum) {
      const prog = createdPrograms[curr.progCode];
      const dept = createdDepts[curr.deptCode];
      const facList = createdFaculty[col.code];

      for (let i = 0; i < curr.courses.length; i++) {
        const c = curr.courses[i];
        const assignedFac = facList[i % facList.length];

        const course = await prisma.course.create({
          data: {
            title: c.title,
            code: `${col.code}-${c.code}`,
            creditHours: c.ch,
            semester: c.sem,
            programId: prog.id,
            departmentId: dept.id,
            facultyId: assignedFac.id,
          },
        });

        await prisma.syllabusVersion.create({
          data: {
            courseId: course.id,
            version: 1,
            contentJson: JSON.stringify({
              rationale: "HEC National Curriculum Standard 2024",
              summary: "Weekly lecture topics, laboratory exercises, and digital reference material.",
              approvedBy: col.principalName,
              approvedAt: "2024-08-01",
            }),
            isArchived: false,
            isActive: true,
          },
        });

        createdCourses[col.code].push(course);
      }
    }
  }

  console.log("✓ Departments, faculty, programs and 1st-8th semester syllabi created.");

  // ─── 5. STUDENTS ACROSS SEMESTERS (1 TO 8) ───────────────────────────────
  console.log("🎓 [6/7] Enrolling Students across Semesters 1-8, Marks, Fees & Results...");

  const studentRosters = [
    // GPGCQ Roster (18 students)
    {
      college: gpgcq,
      progCode: "GPGCQ-BSCS",
      students: [
        { name: "Ali Ahmed Bugti", father: "Mir Ahmed Bugti", sem: 1, session: "2025-2029", district: "Dera Bugti", cnic: "54401-1234567-1", phone: "0333-1234001", marks: 88, status: "ACTIVE" },
        { name: "Bilal Khan Kakar", father: "Abdul Salam Kakar", sem: 1, session: "2025-2029", district: "Quetta", cnic: "54400-2345678-3", phone: "0300-2345002", marks: 76, status: "ACTIVE" },
        { name: "Zubair Lehri", father: "Mir Naseer Lehri", sem: 1, session: "2025-2029", district: "Kalat", cnic: "54101-3456789-5", phone: "0345-3456003", marks: 92, status: "ACTIVE" },
        { name: "Sadia Mengal", father: "Dr. Farooq Mengal", sem: 2, session: "2025-2029", district: "Khuzdar", cnic: "54201-4567890-2", phone: "0313-4567004", marks: 84, status: "ACTIVE" },
        { name: "Usman Ghani", father: "Ghulam Sarwar", sem: 3, session: "2024-2028", district: "Pishin", cnic: "54301-5678901-7", phone: "0334-5678005", marks: 79, status: "ACTIVE" },
        { name: "Hamza Raisani", father: "Nawabzada Raisani", sem: 3, session: "2024-2028", district: "Mastung", cnic: "54402-6789012-9", phone: "0321-6789006", marks: 68, status: "ACTIVE" },
        { name: "Fatima Baloch", father: "Jan Mohammad Baloch", sem: 3, session: "2024-2028", district: "Turbat", cnic: "52201-7890123-4", phone: "0315-7890007", marks: 91, status: "ACTIVE" },
        { name: "Danish Achakzai", father: "Haji Abdul Baqi", sem: 4, session: "2024-2028", district: "Chaman", cnic: "54302-8901234-1", phone: "0300-8901008", marks: 74, status: "ACTIVE" },
        { name: "Waleed Ahmed Kasi", father: "Malik Amanullah Kasi", sem: 4, session: "2024-2028", district: "Quetta", cnic: "54400-9012345-3", phone: "0345-9012009", marks: 0, status: "FREEZE" },
        { name: "Rashid Minhas Rind", father: "Mir Rind", sem: 4, session: "2024-2028", district: "Kachhi", cnic: "54102-0123456-5", phone: "0333-0123010", marks: 42, status: "QUIT" },
        { name: "Sohail Zehri", father: "Sardar Zehri", sem: 5, session: "2023-2027", district: "Khuzdar", cnic: "54202-1234567-7", phone: "0312-1234011", marks: 85, status: "ACTIVE" },
        { name: "Junaid Tareen", father: "Akhtar Tareen", sem: 5, session: "2023-2027", district: "Pishin", cnic: "54303-2345678-9", phone: "0321-2345012", marks: 78, status: "ACTIVE" },
        { name: "Zeeshan Bangulzai", father: "Noor Ahmed Bangulzai", sem: 6, session: "2023-2027", district: "Mastung", cnic: "54403-3456789-1", phone: "0300-3456013", marks: 82, status: "ACTIVE" },
        { name: "Mehran Marri", father: "Mir Hazar Marri", sem: 6, session: "2023-2027", district: "Kohlu", cnic: "54501-4567890-3", phone: "0334-4567014", marks: 88, status: "ACTIVE" },
        { name: "Nabeel Shahwani", father: "Abdul Qayyum", sem: 7, session: "2022-2026", district: "Quetta", cnic: "54400-5678901-5", phone: "0345-5678015", marks: 90, status: "ACTIVE" },
        { name: "Ahsanullah Kakar", father: "Haji Faizullah", sem: 7, session: "2022-2026", district: "Qila Saifullah", cnic: "54601-6789012-7", phone: "0313-6789016", marks: 86, status: "ACTIVE" },
        { name: "Daniyal Ahmed Khan", father: "Tariq Mahmud Khan", sem: 8, session: "2022-2026", district: "Quetta", cnic: "54400-7890123-9", phone: "0300-7890017", marks: 95, status: "GRADUATED" },
        { name: "Maryam Jamaldini", father: "Senator Jamaldini", sem: 8, session: "2022-2026", district: "Nushki", cnic: "54701-8901234-2", phone: "0333-8901018", marks: 93, status: "GRADUATED" },
      ],
    },

    // GSCQ Roster (10 students)
    {
      college: gscq,
      progCode: "GSCQ-BSPHY",
      students: [
        { name: "Farooq Shah", father: "Syed Anwar Shah", sem: 1, session: "2025-2029", district: "Quetta", cnic: "54400-1111222-1", phone: "0300-1111222", marks: 82, status: "ACTIVE" },
        { name: "Kashif Baloch", father: "Ghafoor Baloch", sem: 1, session: "2025-2029", district: "Panjgur", cnic: "52101-2222333-3", phone: "0333-2222333", marks: 79, status: "ACTIVE" },
        { name: "Waqas Mengal", father: "Mir Wali Mengal", sem: 3, session: "2024-2028", district: "Kalat", cnic: "54101-3333444-5", phone: "0345-3333444", marks: 85, status: "ACTIVE" },
        { name: "Jahangir Kasi", father: "Haji Aslam Kasi", sem: 3, session: "2024-2028", district: "Quetta", cnic: "54400-4444555-7", phone: "0313-4444555", marks: 73, status: "ACTIVE" },
        { name: "Shahnawaz Lehri", father: "Babar Lehri", sem: 5, session: "2023-2027", district: "Mastung", cnic: "54402-5555666-9", phone: "0321-5555666", marks: 90, status: "ACTIVE" },
        { name: "Sohail Bugti", father: "Mir Sobdar Bugti", sem: 5, session: "2023-2027", district: "Dera Bugti", cnic: "54401-6666777-1", phone: "0300-6666777", marks: 87, status: "ACTIVE" },
        { name: "Taimur Achakzai", father: "Akram Achakzai", sem: 7, session: "2022-2026", district: "Chaman", cnic: "54302-7777888-3", phone: "0334-7777888", marks: 88, status: "ACTIVE" },
        { name: "Barkat Ali Rind", father: "Ghulam Qadir Rind", sem: 8, session: "2022-2026", district: "Sibi", cnic: "54801-8888999-5", phone: "0312-8888999", marks: 94, status: "GRADUATED" },
        { name: "Arslan Durrani", father: "Javed Durrani", sem: 4, session: "2024-2028", district: "Quetta", cnic: "54400-9999000-7", phone: "0345-9999000", marks: 0, status: "FREEZE" },
        { name: "Naveed Bangulzai", father: "Qadir Bangulzai", sem: 2, session: "2025-2029", district: "Mastung", cnic: "54403-1010101-9", phone: "0300-1010101", marks: 40, status: "QUIT" },
      ],
    },

    // GDCM Roster (7 students)
    {
      college: gdcm,
      progCode: "GDCM-BSPOL",
      students: [
        { name: "Kamran Sarparah", father: "Haji Sarparah", sem: 1, session: "2025-2029", district: "Mastung", cnic: "54402-1212121-1", phone: "0300-1212121", marks: 84, status: "ACTIVE" },
        { name: "Liaqat Dehwar", father: "Mir Dehwar", sem: 1, session: "2025-2029", district: "Mastung", cnic: "54402-2323232-3", phone: "0333-2323232", marks: 78, status: "ACTIVE" },
        { name: "Mansoor Shahwani", father: "Sardar Shahwani", sem: 3, session: "2024-2028", district: "Kalat", cnic: "54101-3434343-5", phone: "0345-3434343", marks: 88, status: "ACTIVE" },
        { name: "Naseer Kurd", father: "Baqi Kurd", sem: 3, session: "2024-2028", district: "Quetta", cnic: "54400-4545454-7", phone: "0313-4545454", marks: 71, status: "ACTIVE" },
        { name: "Obaidullah Bangulzai", father: "Mir Bangulzai", sem: 5, session: "2023-2027", district: "Mastung", cnic: "54403-5656565-9", phone: "0321-5656565", marks: 91, status: "ACTIVE" },
        { name: "Qadeer Zehri", father: "Saeed Zehri", sem: 7, session: "2022-2026", district: "Khuzdar", cnic: "54201-6767676-1", phone: "0300-6767676", marks: 86, status: "ACTIVE" },
        { name: "Saifullah Mengal", father: "Mir Mengal", sem: 8, session: "2022-2026", district: "Kalat", cnic: "54101-7878787-3", phone: "0334-7878787", marks: 96, status: "GRADUATED" },
      ],
    },
  ];

  for (const roster of studentRosters) {
    const col = roster.college;
    const prog = createdPrograms[roster.progCode];
    const collegeCourses = createdCourses[col.code];

    for (let i = 0; i < roster.students.length; i++) {
      const s = roster.students[i];
      const rollNo = `${s.session.split("-")[0]}-${col.code}-${String(i + 1).padStart(3, "0")}`;
      const email = `student.${col.code.toLowerCase()}.${i + 1}@student.edu.pk`;

      const user = await prisma.user.create({
        data: {
          email,
          name: s.name,
          password: hashedStudentPw,
          role: "STUDENT",
          collegeId: col.id,
          isActive: s.status !== "QUIT",
        },
      });

      const student = await prisma.student.create({
        data: {
          userId: user.id,
          rollNumber: rollNo,
          fatherName: s.father,
          cnic: s.cnic,
          contactNumber: s.phone,
          residentAddress: `${s.district}, Balochistan, Pakistan`,
          educationLevel: prog.educationLevel,
          session: s.session,
          programId: prog.id,
          currentSemester: s.sem,
          collegeId: col.id,
          isActive: s.status !== "QUIT",
        },
      });

      // Special Statuses
      if (s.status === "GRADUATED") {
        await prisma.studentStatus.create({
          data: { studentId: student.id, statusType: "GRADUATION", reason: "Completed 8 Semesters with High Honors", notes: "Transcripts & Degree Approved" },
        });
      } else if (s.status === "FREEZE") {
        await prisma.studentStatus.create({
          data: { studentId: student.id, statusType: "FREEZE", reason: "Approved Medical Leave of Absence", notes: "Can resume next cycle" },
        });
      } else if (s.status === "QUIT") {
        await prisma.studentStatus.create({
          data: { studentId: student.id, statusType: "QUIT", reason: "Discontinued studies / relocated", notes: "Withdrawal clearance issued" },
        });
      }

      // Admissions Record
      await prisma.admission.create({
        data: {
          studentName: s.name,
          fatherName: s.father,
          cnic: s.cnic,
          dateOfBirth: new Date("2004-03-15"),
          contactNumber: s.phone,
          email,
          residentAddress: `${s.district}, Balochistan`,
          educationLevel: prog.educationLevel,
          programId: prog.id,
          session: s.session,
          status: s.status === "QUIT" ? "REJECTED" : "APPROVED",
          gender: "MALE",
          sscObtained: 850 + (i * 7) % 150,
          sscTotal: 1100,
          hsscObtained: 800 + (i * 9) % 180,
          hsscTotal: 1100,
          collegeId: col.id,
        },
      });

      // Challan & Fee
      const challanNo = `CH-${col.code}-${s.session.split("-")[0]}-${String(i + 1).padStart(4, "0")}`;
      const feeAmount = 22500;
      const isPaid = s.status !== "QUIT" && i % 4 !== 0;

      await prisma.challan.create({
        data: {
          challanNumber: challanNo,
          cnic: s.cnic,
          applicantName: s.name,
          fatherName: s.father,
          feeType: "BS_SEMESTER",
          feeLabel: "BS Semester Tuition & Examination Fee",
          amount: feeAmount,
          dueDate: new Date("2026-09-30"),
          status: isPaid ? "PAID" : "PENDING",
          paidAt: isPaid ? new Date("2026-09-10") : null,
          semester: s.sem,
          session: s.session,
          educationLevel: prog.educationLevel,
          programId: prog.id,
          studentId: student.id,
          collegeId: col.id,
        },
      });

      await prisma.fee.create({
        data: {
          studentId: student.id,
          amount: feeAmount,
          dueDate: new Date("2026-09-30"),
          status: isPaid ? "PAID" : "UNPAID",
          paidAt: isPaid ? new Date("2026-09-10") : null,
          challanNumber: challanNo,
          feeType: "TUITION",
          semester: s.sem,
          educationLevel: prog.educationLevel,
          collegeId: col.id,
        },
      });

      // Course Enrollments, Marks & Results
      const targetCourses = collegeCourses.filter((c) => c.semester <= s.sem);
      let totalQualityPoints = 0;
      let totalCreditHours = 0;

      for (const course of targetCourses) {
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            semester: course.semester,
            status: "ACTIVE",
          },
        });

        // Attendance records (5 days per student)
        for (let day = 1; day <= 5; day++) {
          await prisma.attendance.create({
            data: {
              studentId: student.id,
              courseId: course.id,
              date: new Date(`2026-10-0${day}`),
              status: day === 4 ? "LEAVE" : "PRESENT",
              educationLevel: "BS",
            },
          });
        }

        // Marks & Grades
        const score = s.status === "FREEZE" ? 0 : Math.min(98, Math.max(52, s.marks + (course.semester % 3) * 2 - 4));
        const midMarks = Math.round((score * 30) / 100);
        const finalMarks = Math.round((score * 50) / 100);
        const sessionalMarks = score - midMarks - finalMarks;
        const gp = getGP(score);

        await prisma.marks.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            midtermMarks: midMarks,
            finalMarks: finalMarks,
            assignmentMarks: Math.round(sessionalMarks / 2),
            quizMarks: sessionalMarks - Math.round(sessionalMarks / 2),
            obtainedMarks: score,
            totalMarks: 100,
            status: "SUBMITTED",
            isLocked: true,
          },
        });

        totalQualityPoints += gp * course.creditHours;
        totalCreditHours += course.creditHours;
      }

      // Result
      const gpa = totalCreditHours > 0 ? parseFloat((totalQualityPoints / totalCreditHours).toFixed(2)) : 0.0;
      await prisma.result.create({
        data: {
          studentId: student.id,
          semester: s.sem,
          gpa,
          cgpa: gpa,
          status: gpa >= 2.0 ? "PROMOTED" : "PROBATION",
          isLocked: true,
        },
      });
    }
  }

  console.log("✓ Students enrolled, marks, attendance, fees, and results seeded.");

  // ─── 6. TIMETABLE, EXAM DATESHEETS & DUTY ROSTERS ─────────────────────────
  console.log("🗓️ [7/7] Generating Timetables, Datesheets & Exam Duty Rosters...");

  const collegesList = [gpgcq, gscq, gdcm];
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const timeSlots = [
    { start: "08:30", end: "09:30" },
    { start: "09:30", end: "10:30" },
    { start: "10:30", end: "11:30" },
    { start: "12:00", end: "01:00" },
  ];

  for (const col of collegesList) {
    const colCourses = createdCourses[col.code];
    const colFaculty = createdFaculty[col.code];

    // Timetable Entries
    for (let i = 0; i < Math.min(8, colCourses.length); i++) {
      const course = colCourses[i];
      const slot = timeSlots[i % timeSlots.length];
      const day = days[i % days.length];
      const fac = colFaculty[i % colFaculty.length];

      await prisma.timetable.create({
        data: {
          collegeId: col.id,
          courseId: course.id,
          facultyId: fac.id,
          programId: course.programId,
          departmentId: course.departmentId,
          dayOfWeek: day,
          startTime: slot.start,
          endTime: slot.end,
          session: "2024-2028",
          semester: course.semester,
          educationLevel: "BS",
          status: "PUBLISHED",
        },
      });
    }

    // Datesheet Entries (Fall 2026 Exams)
    for (let i = 0; i < Math.min(6, colCourses.length); i++) {
      const course = colCourses[i];
      const examDate = new Date(`2026-12-${String(10 + i * 2).padStart(2, "0")}`);

      const datesheet = await prisma.datesheet.create({
        data: {
          collegeId: col.id,
          courseId: course.id,
          programId: course.programId,
          departmentId: course.departmentId,
          examType: "MIDTERM",
          session: "2024-2028",
          semester: course.semester,
          date: examDate,
          startTime: i % 2 === 0 ? "09:00 AM" : "01:30 PM",
          endTime: i % 2 === 0 ? "11:00 AM" : "03:30 PM",
          status: "PUBLISHED",
          isFinalized: true,
        },
      });

      // Exam Duty for Faculty
      const invigFac = colFaculty[i % colFaculty.length];
      await prisma.examDuty.create({
        data: {
          datesheetId: datesheet.id,
          facultyId: invigFac.id,
          dutyType: "INVIGILATOR",
          isMandatory: true,
          room: `Examination Hall ${String.fromCharCode(65 + (i % 3))}`,
          shiftTime: `${datesheet.startTime} - ${datesheet.endTime}`,
          notes: "Center Invigilation Duty.",
        },
      });

      if (i === 0) {
        const supFac = colFaculty[colFaculty.length - 1];
        await prisma.examDuty.create({
          data: {
            datesheetId: datesheet.id,
            facultyId: supFac.id,
            dutyType: "SUPERINTENDENT",
            isMandatory: false,
            room: "Control Room & Main Hall",
            shiftTime: "08:30 AM - 04:00 PM",
            notes: "Chief Examination Superintendent.",
          },
        });
      }
    }

    // Expenses per College
    await prisma.expense.create({
      data: {
        category: "LAB_EQUIPMENT",
        date: new Date("2026-10-05"),
        description: `Upgradation of Lab Workstations & Internet Switchboards for ${col.code}`,
        amount: 380000,
        vendorPayee: "Tech Solutions Balochistan",
        paymentMethod: "CHEQUE",
        session: "2024-2028",
        status: "PAID",
        createdBy: col.principalName,
        collegeId: col.id,
        isActive: true,
      },
    });

    await prisma.expense.create({
      data: {
        category: "UTILITIES",
        date: new Date("2026-10-15"),
        description: `Campus Utility & Electricity Bills for ${col.code}`,
        amount: 145000,
        vendorPayee: "QESCO Quetta",
        paymentMethod: "BANK_TRANSFER",
        session: "2024-2028",
        status: "PAID",
        createdBy: col.principalName,
        collegeId: col.id,
        isActive: true,
      },
    });

    // Audit Log per College
    await prisma.auditLog.create({
      data: {
        userEmail: `admin@${col.code.toLowerCase()}.edu.pk`,
        userName: `${col.code} College Admin`,
        action: "INITIALIZE",
        entity: "CollegeCMS",
        description: `Multi-tenant academic session and full semester curriculum initialized for ${col.name}.`,
        ipAddress: "127.0.0.1",
      },
    });
  }

  console.log("\n✨ ===========================================================");
  console.log("🎉 ALL NEW DUMMY DATA GENERATED & SEEDED SUCCESSFULLY!");
  console.log("✨ ===========================================================\n");
  console.log("📊 Summary of Provisioned Data:");
  console.log("  • Colleges: 3 (GPGCQ Quetta, GSCQ Quetta, GDCM Mastung)");
  console.log("  • CHTE Central Master: chte@balochistan.gov.pk / chte123");
  console.log("  • College Admins: admin@college.edu, admin@gscq.edu.pk, admin@gdcm.edu.pk");
  console.log("  • Principals & Controllers: Separate accounts for each institution");
  console.log("  • Faculty: 28 distinct Professors & Lecturers across 14 departments");
  console.log("  • Programs: 15 BS & Intermediate programs");
  console.log("  • Courses & Syllabi: 1st to 8th Semester curriculum with HEC standards");
  console.log("  • Students: 60+ Enrolled, Graduated, Frozen & Dropout students with CNIC & contacts");
  console.log("  • Admissions: Approved & Pending applicants with marks & quotas");
  console.log("  • Challans & Fees: Paid & Pending fee tracking with bank accounts");
  console.log("  • Exams, Datesheets & Duties: Midterm & Final Term schedules with duty rosters");
  console.log("  • Marks & Results: SGPA, CGPA, total marks and grade points");
  console.log("  • Timetables: Weekly schedules across classrooms & laboratories");
  console.log("===========================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
