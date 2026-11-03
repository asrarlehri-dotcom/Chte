import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("=== Starting College Dummy Data Seeding ===");
  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Setup College 2: Govt. Science College Quetta (GSCQ)
  // ID: ba34e4a2-2eae-448f-8bf2-ec154b760748
  // ──────────────────────────────────────────────────────────────────────────
  const gscqCollege = await prisma.college.upsert({
    where: { id: "ba34e4a2-2eae-448f-8bf2-ec154b760748" },
    update: {
      name: "Govt. Science College Quetta",
      code: "GSCQ",
      slug: "gsc-quetta",
      district: "Quetta",
      division: "Quetta Division",
      tagline: "Inspiring Scientific Discovery & Academic Excellence",
      address: "Jinnah Road, Quetta, Balochistan",
      contactEmail: "info@gscq.edu.pk",
      contactPhone: "+92 81 9201452",
      principalName: "Prof. Dr. Zahid Mengal",
      bankName: "National Bank of Pakistan (NBP)",
      bankAccount: "0182-0045892101",
      branchCode: "0182",
      accountTitle: "Principal Govt Science College Quetta"
    },
    create: {
      id: "ba34e4a2-2eae-448f-8bf2-ec154b760748",
      name: "Govt. Science College Quetta",
      code: "GSCQ",
      slug: "gsc-quetta",
      district: "Quetta",
      division: "Quetta Division",
      tagline: "Inspiring Scientific Discovery & Academic Excellence",
      address: "Jinnah Road, Quetta, Balochistan",
      contactEmail: "info@gscq.edu.pk",
      contactPhone: "+92 81 9201452",
      principalName: "Prof. Dr. Zahid Mengal"
    }
  });
  console.log(`✓ College confirmed: [${gscqCollege.code}] ${gscqCollege.name}`);

  // Departments for GSCQ
  const gscqDeptsData = [
    { name: "Department of Computer Science & IT", code: "GSCQ-CS", hod: "Dr. Tariq Mansoor" },
    { name: "Department of Physics", code: "GSCQ-PHY", hod: "Dr. Qasim Khan" },
    { name: "Department of Chemistry", code: "GSCQ-CHEM", hod: "Dr. Shabana Baloch" },
    { name: "Department of Mathematics", code: "GSCQ-MATH", hod: "Prof. Jahangir Khan" },
    { name: "Department of Natural Sciences", code: "GSCQ-NAT", hod: "Dr. Nisar Lehri" }
  ];

  const gscqDepts: Record<string, any> = {};
  for (const d of gscqDeptsData) {
    gscqDepts[d.code] = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, hodName: d.hod, collegeId: gscqCollege.id },
      create: { name: d.name, code: d.code, hodName: d.hod, collegeId: gscqCollege.id }
    });
  }
  console.log(`✓ Created 5 departments for GSCQ`);

  // Programs for GSCQ (4 BS + 2 Intermediate = 6 Programs)
  const gscqProgData = [
    { name: "BS Computer Science", code: "GSCQ-BSCS", level: "BS", dept: "GSCQ-CS" },
    { name: "BS Physics", code: "GSCQ-BSPHY", level: "BS", dept: "GSCQ-PHY" },
    { name: "BS Chemistry", code: "GSCQ-BSCHEM", level: "BS", dept: "GSCQ-CHEM" },
    { name: "BS Mathematics", code: "GSCQ-BSMATH", level: "BS", dept: "GSCQ-MATH" },
    { name: "F.Sc Pre-Medical", code: "GSCQ-FSC-MED", level: "INTERMEDIATE", dept: "GSCQ-NAT" },
    { name: "F.Sc Pre-Engineering", code: "GSCQ-FSC-ENG", level: "INTERMEDIATE", dept: "GSCQ-NAT" }
  ];

  const gscqPrograms: Record<string, any> = {};
  for (const p of gscqProgData) {
    gscqPrograms[p.code] = await prisma.program.upsert({
      where: { code: p.code },
      update: { name: p.name, educationLevel: p.level, departmentId: gscqDepts[p.dept].id, collegeId: gscqCollege.id },
      create: { name: p.name, code: p.code, educationLevel: p.level, departmentId: gscqDepts[p.dept].id, collegeId: gscqCollege.id }
    });
  }
  console.log(`✓ Created 6 programs for GSCQ`);

  // Faculty for GSCQ (15 faculty members)
  const gscqFacultyData = [
    { name: "Dr. Tariq Mansoor", email: "tariq.cs@gscq.edu.pk", desig: "Professor", qual: "Ph.D Computer Science", dept: "GSCQ-CS", level: "BS" },
    { name: "Prof. Naseem Shah", email: "naseem.cs@gscq.edu.pk", desig: "Associate Professor", qual: "MS Software Eng", dept: "GSCQ-CS", level: "BS" },
    { name: "Engr. Faraz Ahmed", email: "faraz.cs@gscq.edu.pk", desig: "Assistant Professor", qual: "MS Data Science", dept: "GSCQ-CS", level: "BS" },
    { name: "Ms. Ayesha Mengal", email: "ayesha.cs@gscq.edu.pk", desig: "Lecturer", qual: "BS Computer Science", dept: "GSCQ-CS", level: "BS" },
    { name: "Dr. Qasim Khan", email: "qasim.phy@gscq.edu.pk", desig: "Professor", qual: "Ph.D Nuclear Physics", dept: "GSCQ-PHY", level: "BS" },
    { name: "Dr. Munir Ahmed", email: "munir.phy@gscq.edu.pk", desig: "Associate Professor", qual: "Ph.D Solid State", dept: "GSCQ-PHY", level: "BS" },
    { name: "Mr. Zubair Raisani", email: "zubair.phy@gscq.edu.pk", desig: "Lecturer", qual: "M.Phil Physics", dept: "GSCQ-PHY", level: "BS" },
    { name: "Dr. Shabana Baloch", email: "shabana.chem@gscq.edu.pk", desig: "Professor", qual: "Ph.D Organic Chem", dept: "GSCQ-CHEM", level: "BS" },
    { name: "Mr. Dawood Shah", email: "dawood.chem@gscq.edu.pk", desig: "Assistant Professor", qual: "M.Phil Chem", dept: "GSCQ-CHEM", level: "BS" },
    { name: "Ms. Mahnoor Tareen", email: "mahnoor.chem@gscq.edu.pk", desig: "Lecturer", qual: "M.Sc Chemistry", dept: "GSCQ-CHEM", level: "BS" },
    { name: "Prof. Jahangir Khan", email: "jahangir.math@gscq.edu.pk", desig: "Associate Professor", qual: "Ph.D Mathematics", dept: "GSCQ-MATH", level: "BS" },
    { name: "Mr. Asif Rind", email: "asif.math@gscq.edu.pk", desig: "Lecturer", qual: "M.Phil Pure Math", dept: "GSCQ-MATH", level: "BS" },
    { name: "Dr. Nisar Lehri", email: "nisar.med@gscq.edu.pk", desig: "Associate Professor", qual: "MBBS, M.Phil", dept: "GSCQ-NAT", level: "INTERMEDIATE" },
    { name: "Ms. Sadia Bugti", email: "sadia.med@gscq.edu.pk", desig: "Lecturer", qual: "M.Sc Biology", dept: "GSCQ-NAT", level: "INTERMEDIATE" },
    { name: "Mr. Bashir Jamali", email: "bashir.eng@gscq.edu.pk", desig: "Lecturer", qual: "M.Sc Physics", dept: "GSCQ-NAT", level: "INTERMEDIATE" }
  ];

  const gscqFacultyList: any[] = [];
  for (const f of gscqFacultyData) {
    const user = await prisma.user.upsert({
      where: { email: f.email },
      update: { name: f.name, role: f.level === "BS" ? "BS_FACULTY" : "INTER_FACULTY", collegeId: gscqCollege.id },
      create: { email: f.email, name: f.name, password: defaultPasswordHash, role: f.level === "BS" ? "BS_FACULTY" : "INTER_FACULTY", collegeId: gscqCollege.id }
    });

    const fac = await prisma.faculty.upsert({
      where: { userId: user.id },
      update: { designation: f.desig, qualification: f.qual, educationLevel: f.level, departmentId: gscqDepts[f.dept].id, collegeId: gscqCollege.id },
      create: { userId: user.id, designation: f.desig, qualification: f.qual, educationLevel: f.level, departmentId: gscqDepts[f.dept].id, collegeId: gscqCollege.id }
    });
    gscqFacultyList.push(fac);
  }
  console.log(`✓ Created 15 faculty members for GSCQ`);

  // Courses for GSCQ (10 courses)
  const gscqCoursesData = [
    { title: "Programming Fundamentals", code: "GSCQ-CS101", ch: 4, prog: "GSCQ-BSCS", dept: "GSCQ-CS", sem: 1, facIdx: 0 },
    { title: "Data Structures & Algorithms", code: "GSCQ-CS102", ch: 4, prog: "GSCQ-BSCS", dept: "GSCQ-CS", sem: 2, facIdx: 1 },
    { title: "Database Systems", code: "GSCQ-CS201", ch: 3, prog: "GSCQ-BSCS", dept: "GSCQ-CS", sem: 3, facIdx: 2 },
    { title: "Mechanics & Wave Motion", code: "GSCQ-PHY101", ch: 4, prog: "GSCQ-BSPHY", dept: "GSCQ-PHY", sem: 1, facIdx: 4 },
    { title: "Electricity & Magnetism", code: "GSCQ-PHY102", ch: 4, prog: "GSCQ-BSPHY", dept: "GSCQ-PHY", sem: 2, facIdx: 5 },
    { title: "Inorganic Chemistry-I", code: "GSCQ-CH101", ch: 4, prog: "GSCQ-BSCHEM", dept: "GSCQ-CHEM", sem: 1, facIdx: 7 },
    { title: "Organic Chemistry-I", code: "GSCQ-CH102", ch: 4, prog: "GSCQ-BSCHEM", dept: "GSCQ-CHEM", sem: 2, facIdx: 8 },
    { title: "Calculus-I", code: "GSCQ-MTH101", ch: 3, prog: "GSCQ-BSMATH", dept: "GSCQ-MATH", sem: 1, facIdx: 10 },
    { title: "Linear Algebra", code: "GSCQ-MTH102", ch: 3, prog: "GSCQ-BSMATH", dept: "GSCQ-MATH", sem: 2, facIdx: 11 },
    { title: "Biology Part-I (Pre-Med)", code: "GSCQ-BIO101", ch: 4, prog: "GSCQ-FSC-MED", dept: "GSCQ-NAT", sem: 1, facIdx: 12 }
  ];

  const gscqCourses: any[] = [];
  for (const c of gscqCoursesData) {
    const course = await prisma.course.upsert({
      where: { id: `c-${c.code.toLowerCase()}` },
      update: {
        title: c.title,
        code: c.code,
        creditHours: c.ch,
        semester: c.sem,
        programId: gscqPrograms[c.prog].id,
        departmentId: gscqDepts[c.dept].id,
        facultyId: gscqFacultyList[c.facIdx].id
      },
      create: {
        id: `c-${c.code.toLowerCase()}`,
        title: c.title,
        code: c.code,
        creditHours: c.ch,
        semester: c.sem,
        programId: gscqPrograms[c.prog].id,
        departmentId: gscqDepts[c.dept].id,
        facultyId: gscqFacultyList[c.facIdx].id
      }
    });
    gscqCourses.push(course);
  }
  console.log(`✓ Created 10 courses for GSCQ`);

  // Students for GSCQ (36 students across programs & sessions)
  const studentNames = [
    "Zeeshan Ahmed", "Kashif Baloch", "Farooq Mengal", "Waqas Kakar",
    "Junaid Tareen", "Naveed Bangulzai", "Hamid Bugti", "Sohail Zehri",
    "Irfan Jamali", "Arslan Shah", "Adnan Lehri", "Bilal Marri",
    "Rashid Rind", "Shahmeer Kasi", "Nabeel Achakzai", "Mehran Raisani",
    "Samiullah Durrani", "Ahsanullah Kakar", "Barkat Ali", "Ehsan Raisani",
    "Ghulam Mustafa", "Habibullah Khan", "Inamullah Shah", "Jan Mohammad",
    "Kamran Mengal", "Liaqat Baloch", "Mansoor Ahmed", "Naseer Jamali",
    "Obaidullah Kasi", "Pervaiz Lehri", "Qadeer Zehri", "Rahmatullah",
    "Saifullah Bugti", "Tanveer Rind", "Umair Tareen", "Waleed Bangulzai"
  ];

  const gscqStudents: any[] = [];
  const programKeys = ["GSCQ-BSCS", "GSCQ-BSPHY", "GSCQ-BSCHEM", "GSCQ-BSMATH", "GSCQ-FSC-MED", "GSCQ-FSC-ENG"];
  const sessions = ["2024-2028", "2024-2028", "2023-2027", "2024-2026"];

  for (let i = 0; i < studentNames.length; i++) {
    const sName = studentNames[i];
    const sEmail = `student.gscq.${i + 1}@gscq.edu.pk`;
    const sRoll = `2024-GSCQ-${String(i + 1).padStart(3, "0")}`;
    const pKey = programKeys[i % programKeys.length];
    const prog = gscqPrograms[pKey];
    const session = prog.educationLevel === "INTERMEDIATE" ? "2024-2026" : sessions[i % sessions.length];

    const user = await prisma.user.upsert({
      where: { email: sEmail },
      update: { name: sName, role: "STUDENT", collegeId: gscqCollege.id },
      create: { email: sEmail, name: sName, password: defaultPasswordHash, role: "STUDENT", collegeId: gscqCollege.id }
    });

    const isDropout = i === 30 || i === 31;
    const isGrad = i === 32 || i === 33;
    const isMig = i === 34;
    const isFreeze = i === 35;

    const student = await prisma.student.upsert({
      where: { rollNumber: sRoll },
      update: {
        userId: user.id,
        educationLevel: prog.educationLevel,
        session: session,
        programId: prog.id,
        currentSemester: (i % 4) + 1,
        collegeId: gscqCollege.id,
        isActive: !isDropout
      },
      create: {
        userId: user.id,
        rollNumber: sRoll,
        educationLevel: prog.educationLevel,
        session: session,
        programId: prog.id,
        currentSemester: (i % 4) + 1,
        collegeId: gscqCollege.id,
        fatherName: `Father of ${sName}`,
        cnic: `54400-${1000000 + i}-1`,
        contactNumber: `0300-${2000000 + i}`,
        residentAddress: "Quetta, Balochistan",
        isActive: !isDropout
      }
    });

    // Seed student status records
    if (isGrad) {
      await prisma.studentStatus.create({
        data: { studentId: student.id, statusType: "GRADUATION", reason: "Successfully completed program" }
      });
    } else if (isDropout) {
      await prisma.studentStatus.create({
        data: { studentId: student.id, statusType: "QUIT", reason: "Discontinued studies" }
      });
    } else if (isMig) {
      await prisma.studentStatus.create({
        data: { studentId: student.id, statusType: "MIGRATION", reason: "Migrated to another university" }
      });
    } else if (isFreeze) {
      await prisma.studentStatus.create({
        data: { studentId: student.id, statusType: "FREEZE", reason: "Medical leave approved" }
      });
    }

    gscqStudents.push(student);
  }
  console.log(`✓ Created 36 students with statuses for GSCQ`);

  // Fees & Challans for GSCQ
  // 36 fees: 27 Paid (PKR 20,000 each = 540,000), 9 Pending (PKR 20,000 each = 180,000). Total: 720,000
  for (let i = 0; i < gscqStudents.length; i++) {
    const s = gscqStudents[i];
    const isPaid = i < 27;
    const challanNum = `CH-GSCQ-${2024000 + i}`;

    await prisma.fee.upsert({
      where: { challanNumber: challanNum },
      update: {
        amount: 20000,
        status: isPaid ? "PAID" : "UNPAID",
        collegeId: gscqCollege.id,
        paidAt: isPaid ? new Date() : null
      },
      create: {
        studentId: s.id,
        challanNumber: challanNum,
        amount: 20000,
        dueDate: new Date(Date.now() + 15 * 86400000),
        status: isPaid ? "PAID" : "UNPAID",
        collegeId: gscqCollege.id,
        paidAt: isPaid ? new Date() : null,
        feeType: "SEMESTER_TUITION",
        semester: s.currentSemester || 1,
        educationLevel: s.educationLevel
      }
    });

    await prisma.challan.upsert({
      where: { challanNumber: challanNum },
      update: {
        amount: 20000,
        status: isPaid ? "PAID" : "PENDING",
        collegeId: gscqCollege.id
      },
      create: {
        challanNumber: challanNum,
        cnic: s.cnic || "54400-0000000-1",
        applicantName: studentNames[i],
        feeType: "BS_SEMESTER",
        feeLabel: "BS Regular Semester Fee",
        amount: 20000,
        dueDate: new Date(Date.now() + 15 * 86400000),
        status: isPaid ? "PAID" : "PENDING",
        collegeId: gscqCollege.id,
        programId: s.programId,
        studentId: s.id
      }
    });
  }
  console.log(`✓ Created fees and challans for GSCQ (PKR 720k expected, PKR 540k collected)`);

  // Today's Timetables for GSCQ
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const times = [
    { start: "08:30 AM", end: "09:45 AM" },
    { start: "09:50 AM", end: "11:05 AM" },
    { start: "11:15 AM", end: "12:30 PM" },
    { start: "12:35 PM", end: "01:50 PM" },
    { start: "02:00 PM", end: "03:15 PM" }
  ];

  // Create 6 classes for today (Wednesday) + other days
  const todayName = "Wednesday";
  for (let idx = 0; idx < 6; idx++) {
    const course = gscqCourses[idx % gscqCourses.length];
    const time = times[idx % times.length];
    await prisma.timetable.create({
      data: {
        dayOfWeek: todayName,
        startTime: time.start,
        endTime: time.end,
        session: "2024-2028",
        semester: 1,
        courseId: course.id,
        programId: course.programId,
        departmentId: course.departmentId,
        facultyId: course.facultyId,
        collegeId: gscqCollege.id,
        status: "PUBLISHED",
        generationMode: "AUTO"
      }
    });
  }
  console.log(`✓ Created 6 timetable classes for today at GSCQ`);

  // Datesheets / Notices for GSCQ
  const gscqDatesheetsData = [
    { title: "Midterm Examinations", type: "MIDTERM", courseIdx: 0, date: new Date(Date.now() + 5 * 86400000) },
    { title: "Practical Lab Assessment", type: "LAB_EXAM", courseIdx: 1, date: new Date(Date.now() + 12 * 86400000) },
    { title: "Final Semester Examinations", type: "FINAL_TERM", courseIdx: 3, date: new Date(Date.now() + 25 * 86400000) }
  ];

  for (const ds of gscqDatesheetsData) {
    const course = gscqCourses[ds.courseIdx];
    await prisma.datesheet.create({
      data: {
        examType: ds.type,
        date: ds.date,
        startTime: "09:00 AM",
        endTime: "12:00 PM",
        collegeId: gscqCollege.id,
        courseId: course.id,
        programId: course.programId,
        departmentId: course.departmentId,
        session: "2024-2028",
        semester: 1,
        status: "PUBLISHED"
      }
    });
  }
  console.log(`✓ Created 3 upcoming datesheets/notices for GSCQ`);

  // Audit Logs for GSCQ
  const gscqLogs = [
    { action: "PUBLISH", entity: "Timetable", desc: "Automated Spring 2026 Timetable published for all departments" },
    { action: "GENERATE", entity: "Challan", desc: "Semester Tuition Challans batch generated for 36 students" },
    { action: "APPROVE", entity: "Admission", desc: "Batch verified 36 student enrollment records" },
    { action: "CREATE", entity: "Course", desc: "BS Computer Science updated syllabus accredited" }
  ];
  for (const l of gscqLogs) {
    await prisma.auditLog.create({
      data: {
        action: l.action,
        entity: l.entity,
        description: l.desc,
        collegeId: gscqCollege.id,
        userName: "GSCQ Admin",
        userEmail: "admin@gscq.edu.pk"
      }
    });
  }
  console.log(`✓ Created audit logs for GSCQ`);


  // ──────────────────────────────────────────────────────────────────────────
  // 2. Setup College 3: Govt. Postgraduate Science College (GPSCQ)
  // ID: a4a28fc3-c6dc-4fd1-9363-2fbe73de9973
  // ──────────────────────────────────────────────────────────────────────────
  const gpscqCollege = await prisma.college.upsert({
    where: { id: "a4a28fc3-c6dc-4fd1-9363-2fbe73de9973" },
    update: {
      name: "Govt. Postgraduate Science College Quetta",
      code: "GPSCQ",
      slug: "gpsc-quetta",
      district: "Quetta",
      division: "Quetta Division",
      tagline: "Dedicated to Natural & Biological Sciences Research",
      address: "Chiltan Road, Quetta, Balochistan",
      contactEmail: "info@g.edu.pk",
      contactPhone: "+92 81 9202811",
      principalName: "Prof. Dr. Akbar Shah"
    },
    create: {
      id: "a4a28fc3-c6dc-4fd1-9363-2fbe73de9973",
      name: "Govt. Postgraduate Science College Quetta",
      code: "GPSCQ",
      slug: "gpsc-quetta",
      district: "Quetta",
      division: "Quetta Division",
      tagline: "Dedicated to Natural & Biological Sciences Research",
      address: "Chiltan Road, Quetta, Balochistan",
      contactEmail: "info@g.edu.pk",
      contactPhone: "+92 81 9202811",
      principalName: "Prof. Dr. Akbar Shah"
    }
  });
  console.log(`✓ College confirmed: [${gpscqCollege.code}] ${gpscqCollege.name}`);

  // Departments for GPSCQ (3 departments)
  const gpscqDeptsData = [
    { name: "Department of Botany", code: "GPSCQ-BOT", hod: "Dr. Akbar Shah" },
    { name: "Department of Zoology", code: "GPSCQ-ZOO", hod: "Dr. Parveen Kasi" },
    { name: "Department of English Literature", code: "GPSCQ-ENG", hod: "Prof. Khalid Tareen" }
  ];

  const gpscqDepts: Record<string, any> = {};
  for (const d of gpscqDeptsData) {
    gpscqDepts[d.code] = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, hodName: d.hod, collegeId: gpscqCollege.id },
      create: { name: d.name, code: d.code, hodName: d.hod, collegeId: gpscqCollege.id }
    });
  }

  // Programs for GPSCQ (3 BS programs)
  const gpscqProgData = [
    { name: "BS Botany", code: "GPSCQ-BSBOT", level: "BS", dept: "GPSCQ-BOT" },
    { name: "BS Zoology", code: "GPSCQ-BSZOO", level: "BS", dept: "GPSCQ-ZOO" },
    { name: "BS English", code: "GPSCQ-BSENG", level: "BS", dept: "GPSCQ-ENG" }
  ];

  const gpscqPrograms: Record<string, any> = {};
  for (const p of gpscqProgData) {
    gpscqPrograms[p.code] = await prisma.program.upsert({
      where: { code: p.code },
      update: { name: p.name, educationLevel: p.level, departmentId: gpscqDepts[p.dept].id, collegeId: gpscqCollege.id },
      create: { name: p.name, code: p.code, educationLevel: p.level, departmentId: gpscqDepts[p.dept].id, collegeId: gpscqCollege.id }
    });
  }
  console.log(`✓ Created 3 programs for GPSCQ`);

  // Faculty for GPSCQ (7 faculty)
  const gpscqFacData = [
    { name: "Dr. Akbar Shah", email: "akbar.bot@g.edu.pk", desig: "Professor", qual: "Ph.D Plant Genetics", dept: "GPSCQ-BOT" },
    { name: "Dr. Samina Kakar", email: "samina.bot@g.edu.pk", desig: "Associate Professor", qual: "Ph.D Flora Studies", dept: "GPSCQ-BOT" },
    { name: "Dr. Parveen Kasi", email: "parveen.zoo@g.edu.pk", desig: "Professor", qual: "Ph.D Marine Zoology", dept: "GPSCQ-ZOO" },
    { name: "Mr. Imran Mengal", email: "imran.zoo@g.edu.pk", desig: "Assistant Professor", qual: "M.Phil Zoology", dept: "GPSCQ-ZOO" },
    { name: "Prof. Khalid Tareen", email: "khalid.eng@g.edu.pk", desig: "Associate Professor", qual: "M.Phil Linguistics", dept: "GPSCQ-ENG" },
    { name: "Ms. Nazia Bugti", email: "nazia.eng@g.edu.pk", desig: "Lecturer", qual: "M.A English", dept: "GPSCQ-ENG" },
    { name: "Mr. Sheraz Jamali", email: "sheraz.bot@g.edu.pk", desig: "Lecturer", qual: "M.Sc Botany", dept: "GPSCQ-BOT" }
  ];

  const gpscqFacultyList: any[] = [];
  for (const f of gpscqFacData) {
    const user = await prisma.user.upsert({
      where: { email: f.email },
      update: { name: f.name, role: "BS_FACULTY", collegeId: gpscqCollege.id },
      create: { email: f.email, name: f.name, password: defaultPasswordHash, role: "BS_FACULTY", collegeId: gpscqCollege.id }
    });

    const fac = await prisma.faculty.upsert({
      where: { userId: user.id },
      update: { designation: f.desig, qualification: f.qual, educationLevel: "BS", departmentId: gpscqDepts[f.dept].id, collegeId: gpscqCollege.id },
      create: { userId: user.id, designation: f.desig, qualification: f.qual, educationLevel: "BS", departmentId: gpscqDepts[f.dept].id, collegeId: gpscqCollege.id }
    });
    gpscqFacultyList.push(fac);
  }
  console.log(`✓ Created 7 faculty members for GPSCQ`);

  // Courses for GPSCQ (6 courses)
  const gpscqCoursesData = [
    { title: "Diversity of Plants", code: "GPSCQ-BOT101", ch: 3, prog: "GPSCQ-BSBOT", dept: "GPSCQ-BOT", sem: 1, facIdx: 0 },
    { title: "Plant Physiology & Ecology", code: "GPSCQ-BOT102", ch: 4, prog: "GPSCQ-BSBOT", dept: "GPSCQ-BOT", sem: 2, facIdx: 1 },
    { title: "Animal Diversity: Invertebrates", code: "GPSCQ-ZOO101", ch: 4, prog: "GPSCQ-BSZOO", dept: "GPSCQ-ZOO", sem: 1, facIdx: 2 },
    { title: "Animal Physiology", code: "GPSCQ-ZOO102", ch: 3, prog: "GPSCQ-BSZOO", dept: "GPSCQ-ZOO", sem: 2, facIdx: 3 },
    { title: "Academic Reading & Writing", code: "GPSCQ-ENG101", ch: 3, prog: "GPSCQ-BSENG", dept: "GPSCQ-ENG", sem: 1, facIdx: 4 },
    { title: "Classical Poetry", code: "GPSCQ-ENG102", ch: 3, prog: "GPSCQ-BSENG", dept: "GPSCQ-ENG", sem: 2, facIdx: 5 }
  ];

  const gpscqCourses: any[] = [];
  for (const c of gpscqCoursesData) {
    const course = await prisma.course.upsert({
      where: { id: `c-${c.code.toLowerCase()}` },
      update: {
        title: c.title,
        code: c.code,
        creditHours: c.ch,
        semester: c.sem,
        programId: gpscqPrograms[c.prog].id,
        departmentId: gpscqDepts[c.dept].id,
        facultyId: gpscqFacultyList[c.facIdx].id
      },
      create: {
        id: `c-${c.code.toLowerCase()}`,
        title: c.title,
        code: c.code,
        creditHours: c.ch,
        semester: c.sem,
        programId: gpscqPrograms[c.prog].id,
        departmentId: gpscqDepts[c.dept].id,
        facultyId: gpscqFacultyList[c.facIdx].id
      }
    });
    gpscqCourses.push(course);
  }
  console.log(`✓ Created 6 courses for GPSCQ`);

  // Students for GPSCQ (18 students)
  const gpscqStudentNames = [
    "Dawood Shah", "Naimatullah", "Shahnawaz Baloch", "Khadim Hussain",
    "Zubair Ahmed", "Faizullah Khan", "Sardar Ali", "Mujeeb Ur Rehman",
    "Hikmatullah", "Jamil Ahmed", "Sajid Mengal", "Babar Azam Khan",
    "Rozi Khan", "Bismillah Khan", "Amanullah", "Noor Mohammad",
    "Sultan Ahmed", "Yousaf Baloch"
  ];

  const gpscqStudents: any[] = [];
  const gpscqProgKeys = ["GPSCQ-BSBOT", "GPSCQ-BSZOO", "GPSCQ-BSENG"];

  for (let i = 0; i < gpscqStudentNames.length; i++) {
    const sName = gpscqStudentNames[i];
    const sEmail = `student.gpscq.${i + 1}@g.edu.pk`;
    const sRoll = `2024-GPSCQ-${String(i + 1).padStart(3, "0")}`;
    const pKey = gpscqProgKeys[i % gpscqProgKeys.length];
    const prog = gpscqPrograms[pKey];

    const user = await prisma.user.upsert({
      where: { email: sEmail },
      update: { name: sName, role: "STUDENT", collegeId: gpscqCollege.id },
      create: { email: sEmail, name: sName, password: defaultPasswordHash, role: "STUDENT", collegeId: gpscqCollege.id }
    });

    const isGrad = i === 15;
    const isDropout = i === 16;
    const isFreeze = i === 17;

    const student = await prisma.student.upsert({
      where: { rollNumber: sRoll },
      update: {
        userId: user.id,
        educationLevel: "BS",
        session: "2024-2028",
        programId: prog.id,
        currentSemester: (i % 2) + 1,
        collegeId: gpscqCollege.id,
        isActive: !isDropout
      },
      create: {
        userId: user.id,
        rollNumber: sRoll,
        educationLevel: "BS",
        session: "2024-2028",
        programId: prog.id,
        currentSemester: (i % 2) + 1,
        collegeId: gpscqCollege.id,
        fatherName: `Father of ${sName}`,
        cnic: `54300-${2000000 + i}-1`,
        contactNumber: `0333-${3000000 + i}`,
        residentAddress: "Quetta, Balochistan",
        isActive: !isDropout
      }
    });

    if (isGrad) {
      await prisma.studentStatus.create({
        data: { studentId: student.id, statusType: "GRADUATION", reason: "Passed examinations" }
      });
    } else if (isDropout) {
      await prisma.studentStatus.create({
        data: { studentId: student.id, statusType: "QUIT", reason: "Personal reasons" }
      });
    } else if (isFreeze) {
      await prisma.studentStatus.create({
        data: { studentId: student.id, statusType: "FREEZE", reason: "Semester freeze requested" }
      });
    }

    gpscqStudents.push(student);
  }
  console.log(`✓ Created 18 students for GPSCQ`);

  // Fees & Challans for GPSCQ (18 fees: 14 Paid = PKR 210,000, 4 Unpaid = PKR 60,000. Total = 270,000)
  for (let i = 0; i < gpscqStudents.length; i++) {
    const s = gpscqStudents[i];
    const isPaid = i < 14;
    const challanNum = `CH-GPSCQ-${2024000 + i}`;

    await prisma.fee.upsert({
      where: { challanNumber: challanNum },
      update: {
        amount: 15000,
        status: isPaid ? "PAID" : "UNPAID",
        collegeId: gpscqCollege.id,
        paidAt: isPaid ? new Date() : null
      },
      create: {
        studentId: s.id,
        challanNumber: challanNum,
        amount: 15000,
        dueDate: new Date(Date.now() + 15 * 86400000),
        status: isPaid ? "PAID" : "UNPAID",
        collegeId: gpscqCollege.id,
        paidAt: isPaid ? new Date() : null,
        feeType: "SEMESTER_TUITION",
        semester: s.currentSemester || 1,
        educationLevel: "BS"
      }
    });

    await prisma.challan.upsert({
      where: { challanNumber: challanNum },
      update: {
        amount: 15000,
        status: isPaid ? "PAID" : "PENDING",
        collegeId: gpscqCollege.id
      },
      create: {
        challanNumber: challanNum,
        cnic: s.cnic || "54300-0000000-1",
        applicantName: gpscqStudentNames[i],
        feeType: "BS_SEMESTER",
        feeLabel: "BS Semester Fee",
        amount: 15000,
        dueDate: new Date(Date.now() + 15 * 86400000),
        status: isPaid ? "PAID" : "PENDING",
        collegeId: gpscqCollege.id,
        programId: s.programId,
        studentId: s.id
      }
    });
  }
  console.log(`✓ Created fees and challans for GPSCQ (PKR 270k expected, PKR 210k collected)`);

  // 4 Timetable slots for today (Wednesday) at GPSCQ
  for (let idx = 0; idx < 4; idx++) {
    const course = gpscqCourses[idx % gpscqCourses.length];
    const time = times[idx % times.length];
    await prisma.timetable.create({
      data: {
        dayOfWeek: todayName,
        startTime: time.start,
        endTime: time.end,
        session: "2024-2028",
        semester: 1,
        courseId: course.id,
        programId: course.programId,
        departmentId: course.departmentId,
        facultyId: course.facultyId,
        collegeId: gpscqCollege.id,
        status: "PUBLISHED",
        generationMode: "MANUAL"
      }
    });
  }
  console.log(`✓ Created 4 timetable classes for today at GPSCQ`);

  // Datesheets / Notices for GPSCQ
  for (let idx = 0; idx < 2; idx++) {
    const course = gpscqCourses[idx];
    await prisma.datesheet.create({
      data: {
        examType: "MIDTERM",
        date: new Date(Date.now() + (idx + 7) * 86400000),
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        collegeId: gpscqCollege.id,
        courseId: course.id,
        programId: course.programId,
        departmentId: course.departmentId,
        session: "2024-2028",
        semester: 1,
        status: "PUBLISHED"
      }
    });
  }
  console.log(`✓ Created 2 datesheets for GPSCQ`);

  // Audit logs for GPSCQ
  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entity: "Timetable",
      description: "Class timetable generated for Botany and Zoology labs",
      collegeId: gpscqCollege.id,
      userName: "GPSCQ Admin",
      userEmail: "admin@g.edu.pk"
    }
  });

  console.log("\n=== ALL DUMMY DATA SEEDED SUCCESSFULLY! ===");
}

main()
  .catch((err) => {
    console.error("Seeding error:", err);
  })
  .finally(() => prisma.$disconnect());

