import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// POST: Load / Seed realistic dummy data
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const hashedStudentPw = await bcrypt.hash("student123", 10);
    const hashedFacultyPw = await bcrypt.hash("gpgcq123", 10);

    // 1. Departments
    const csDept = await prisma.department.upsert({
      where: { code: "CS" },
      update: { name: "Computer Science", hodName: "Dr. Muhammad Usman" },
      create: { name: "Computer Science", code: "CS", hodName: "Dr. Muhammad Usman" },
    });

    const phyDept = await prisma.department.upsert({
      where: { code: "PHY" },
      update: { name: "Physics", hodName: "Prof. Shahida Kakar" },
      create: { name: "Physics", code: "PHY", hodName: "Prof. Shahida Kakar" },
    });

    const chemDept = await prisma.department.upsert({
      where: { code: "CHEM" },
      update: { name: "Chemistry", hodName: "Dr. Abdul Rehman" },
      create: { name: "Chemistry", code: "CHEM", hodName: "Dr. Abdul Rehman" },
    });

    const engDept = await prisma.department.upsert({
      where: { code: "ENG" },
      update: { name: "English", hodName: "Ms. Ayesha Mengal" },
      create: { name: "English", code: "ENG", hodName: "Ms. Ayesha Mengal" },
    });

    const interDept = await prisma.department.upsert({
      where: { code: "INTER" },
      update: { name: "Intermediate", hodName: "Mr. Tariq Mahmud" },
      create: { name: "Intermediate", code: "INTER", hodName: "Mr. Tariq Mahmud" },
    });

    // 2. Programs
    const bsCS = await prisma.program.upsert({
      where: { code: "BSCS" },
      update: { name: "BS Computer Science", educationLevel: "BS", departmentId: csDept.id },
      create: { name: "BS Computer Science", code: "BSCS", educationLevel: "BS", departmentId: csDept.id },
    });

    const bsPhy = await prisma.program.upsert({
      where: { code: "BSPHY" },
      update: { name: "BS Physics", educationLevel: "BS", departmentId: phyDept.id },
      create: { name: "BS Physics", code: "BSPHY", educationLevel: "BS", departmentId: phyDept.id },
    });

    const bsEng = await prisma.program.upsert({
      where: { code: "BSENG" },
      update: { name: "BS English", educationLevel: "BS", departmentId: engDept.id },
      create: { name: "BS English", code: "BSENG", educationLevel: "BS", departmentId: engDept.id },
    });

    const fscEng = await prisma.program.upsert({
      where: { code: "FSC-ENG" },
      update: { name: "F.Sc Pre-Engineering", educationLevel: "INTERMEDIATE", departmentId: interDept.id },
      create: { name: "F.Sc Pre-Engineering", code: "FSC-ENG", educationLevel: "INTERMEDIATE", departmentId: interDept.id },
    });

    const fscMed = await prisma.program.upsert({
      where: { code: "FSC-MED" },
      update: { name: "F.Sc Pre-Medical", educationLevel: "INTERMEDIATE", departmentId: interDept.id },
      create: { name: "F.Sc Pre-Medical", code: "FSC-MED", educationLevel: "INTERMEDIATE", departmentId: interDept.id },
    });

    // 3. Groups (for Inter)
    let preEngGroup = await prisma.group.findFirst({ where: { name: "Pre-Engineering", programId: fscEng.id } });
    if (!preEngGroup) {
      preEngGroup = await prisma.group.create({
        data: { name: "Pre-Engineering", programId: fscEng.id }
      });
    }

    let preMedGroup = await prisma.group.findFirst({ where: { name: "Pre-Medical", programId: fscMed.id } });
    if (!preMedGroup) {
      preMedGroup = await prisma.group.create({
        data: { name: "Pre-Medical", programId: fscMed.id }
      });
    }

    // 4. Subjects
    const subjectsList = [
      { name: "Mathematics", code: "MATH-11", groupId: preEngGroup.id },
      { name: "Physics", code: "PHY-11", groupId: preEngGroup.id },
      { name: "Biology", code: "BIO-11", groupId: preMedGroup.id },
      { name: "Chemistry", code: "CHEM-11", groupId: preMedGroup.id }
    ];
    for (const sub of subjectsList) {
      const existing = await prisma.subject.findFirst({ where: { name: sub.name, groupId: sub.groupId } });
      if (!existing) {
        await prisma.subject.create({ data: sub });
      }
    }

    // 5. Class Sections
    let sectionA = await prisma.classSection.findFirst({ where: { name: "Section A", programId: bsCS.id } });
    if (!sectionA) {
      sectionA = await prisma.classSection.create({ data: { name: "Section A", programId: bsCS.id } });
    }

    let sectionPreMed1 = await prisma.classSection.findFirst({ where: { name: "Pre-Med 1", programId: fscMed.id } });
    if (!sectionPreMed1) {
      sectionPreMed1 = await prisma.classSection.create({ data: { name: "Pre-Med 1", programId: fscMed.id, groupId: preMedGroup.id } });
    }

    // 6. Faculty Users & Faculty Records
    const facultyData = [
      { email: "usman@gpgcquetta.edu.pk", name: "Dr. Muhammad Usman", designation: "Professor", qual: "Ph.D Computer Science", deptId: csDept.id, level: "BS", phone: "0333-7890123" },
      { email: "shahida@gpgcquetta.edu.pk", name: "Prof. Shahida Kakar", designation: "Associate Professor", qual: "M.Phil Physics", deptId: phyDept.id, level: "BS", phone: "0300-1234567" },
      { email: "rehman@gpgcquetta.edu.pk", name: "Dr. Abdul Rehman", designation: "Professor", qual: "Ph.D Chemistry", deptId: chemDept.id, level: "BS", phone: "0312-3456789" },
      { email: "tariq@gpgcquetta.edu.pk", name: "Mr. Tariq Mahmud", designation: "Assistant Professor", qual: "MS Mathematics", deptId: interDept.id, level: "INTERMEDIATE", phone: "0345-6789012" },
      { email: "ayesha@gpgcquetta.edu.pk", name: "Ms. Ayesha Mengal", designation: "Lecturer", qual: "M.A English Literature", deptId: engDept.id, level: "BS", phone: "0321-9876543" },
    ];

    const seededFaculty: any[] = [];
    for (const f of facultyData) {
      const user = await prisma.user.upsert({
        where: { email: f.email },
        update: { name: f.name, role: "BS_FACULTY" },
        create: { email: f.email, name: f.name, password: hashedFacultyPw, role: "BS_FACULTY" }
      });

      const fac = await prisma.faculty.upsert({
        where: { userId: user.id },
        update: { designation: f.designation, qualification: f.qual, departmentId: f.deptId, educationLevel: f.level, contactNumber: f.phone },
        create: { userId: user.id, designation: f.designation, qualification: f.qual, departmentId: f.deptId, educationLevel: f.level, contactNumber: f.phone }
      });
      seededFaculty.push(fac);
    }

    // 7. BS Courses (Every semester has between 4 and 7 papers: strictly 5 to 6 accredited HEC courses)
    const courseData = [
      // Semester 1 (6 papers)
      { id: "cs101-demo", title: "Programming Fundamentals", code: "CS-101", creditHours: 3, semester: 1, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs101L-demo", title: "Programming Fundamentals Lab", code: "CS-101L", creditHours: 1, semester: 1, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "math101-demo", title: "Calculus & Analytical Geometry", code: "MATH-101", creditHours: 3, semester: 1, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[3].id },
      { id: "eng101-demo", title: "Functional English", code: "ENG-101", creditHours: 3, semester: 1, session: "2024-2028", programId: bsCS.id, departmentId: engDept.id, facultyId: seededFaculty[4].id },
      { id: "cs103-demo", title: "Information & Communication Tech", code: "CS-103", creditHours: 3, semester: 1, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "isl101-demo", title: "Islamic Studies / Professional Ethics", code: "ISL-101", creditHours: 2, semester: 1, session: "2024-2028", programId: bsCS.id, departmentId: engDept.id, facultyId: seededFaculty[4].id },

      // Semester 2 (6 papers)
      { id: "cs102-demo", title: "Object Oriented Programming (OOP)", code: "CS-102", creditHours: 3, semester: 2, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs102L-demo", title: "Object Oriented Programming Lab", code: "CS-102L", creditHours: 1, semester: 2, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs104-demo", title: "Digital Logic Design (DLD)", code: "CS-104", creditHours: 3, semester: 2, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "math102-demo", title: "Discrete Structures", code: "MATH-102", creditHours: 3, semester: 2, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[3].id },
      { id: "eng102-demo", title: "Communication & Presentation Skills", code: "ENG-102", creditHours: 3, semester: 2, session: "2024-2028", programId: bsCS.id, departmentId: engDept.id, facultyId: seededFaculty[4].id },
      { id: "pks101-demo", title: "Pakistan Studies", code: "PKS-101", creditHours: 2, semester: 2, session: "2024-2028", programId: bsCS.id, departmentId: engDept.id, facultyId: seededFaculty[4].id },

      // Semester 3 (5 papers)
      { id: "cs201-demo", title: "Data Structures & Algorithms", code: "CS-201", creditHours: 3, semester: 3, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs201L-demo", title: "Data Structures Lab", code: "CS-201L", creditHours: 1, semester: 3, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs202-demo", title: "Computer Organization & Assembly", code: "CS-202", creditHours: 3, semester: 3, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "math201-demo", title: "Linear Algebra", code: "MATH-201", creditHours: 3, semester: 3, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[3].id },
      { id: "stat201-demo", title: "Probability & Statistics", code: "STAT-201", creditHours: 3, semester: 3, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[3].id },

      // Semester 4 (5 papers)
      { id: "cs203-demo", title: "Database Systems", code: "CS-203", creditHours: 3, semester: 4, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs203L-demo", title: "Database Systems Lab", code: "CS-203L", creditHours: 1, semester: 4, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs204-demo", title: "Operating Systems", code: "CS-204", creditHours: 3, semester: 4, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs205-demo", title: "Software Engineering", code: "CS-205", creditHours: 3, semester: 4, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "math202-demo", title: "Differential Equations", code: "MATH-202", creditHours: 3, semester: 4, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[3].id },

      // Semester 5 (5 papers)
      { id: "cs301-demo", title: "Computer Communication & Networks", code: "CS-301", creditHours: 3, semester: 5, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs302-demo", title: "Web Technologies & Full-Stack", code: "CS-302", creditHours: 3, semester: 5, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs303-demo", title: "Design & Analysis of Algorithms", code: "CS-303", creditHours: 3, semester: 5, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs304-demo", title: "Theory of Automata & Computation", code: "CS-304", creditHours: 3, semester: 5, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "math301-demo", title: "Numerical Computing", code: "MATH-301", creditHours: 3, semester: 5, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[3].id },

      // Semester 6 (5 papers)
      { id: "cs305-demo", title: "Artificial Intelligence & Expert Systems", code: "CS-305", creditHours: 3, semester: 6, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs306-demo", title: "Compiler Construction", code: "CS-306", creditHours: 3, semester: 6, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs307-demo", title: "Information Security & Cryptography", code: "CS-307", creditHours: 3, semester: 6, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs308-demo", title: "Mobile Application Development", code: "CS-308", creditHours: 3, semester: 6, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "eng301-demo", title: "Technical & Report Writing", code: "ENG-301", creditHours: 3, semester: 6, session: "2024-2028", programId: bsCS.id, departmentId: engDept.id, facultyId: seededFaculty[4].id },

      // Semester 7 (5 papers)
      { id: "cs401-demo", title: "Final Year Capstone Project - Part I", code: "CS-401", creditHours: 3, semester: 7, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs402-demo", title: "Cloud Computing & Distributed Systems", code: "CS-402", creditHours: 3, semester: 7, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs403-demo", title: "Parallel & Distributed Computing", code: "CS-403", creditHours: 3, semester: 7, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs404-demo", title: "Machine Learning & Data Science", code: "CS-404", creditHours: 3, semester: 7, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "mgt401-demo", title: "Entrepreneurship & Technology Incubation", code: "MGT-401", creditHours: 3, semester: 7, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[3].id },

      // Semester 8 (5 papers)
      { id: "cs405-demo", title: "Final Year Capstone Project - Part II", code: "CS-405", creditHours: 3, semester: 8, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs406-demo", title: "Human Computer Interaction (HCI)", code: "CS-406", creditHours: 3, semester: 8, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "cs407-demo", title: "Natural Language Processing", code: "CS-407", creditHours: 3, semester: 8, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },
      { id: "law401-demo", title: "Cyber Law & Digital Ethics", code: "LAW-401", creditHours: 3, semester: 8, session: "2024-2028", programId: bsCS.id, departmentId: engDept.id, facultyId: seededFaculty[4].id },
      { id: "cs408-demo", title: "Software Project Management", code: "CS-408", creditHours: 3, semester: 8, session: "2024-2028", programId: bsCS.id, departmentId: csDept.id, facultyId: seededFaculty[0].id },

      // Physics Demo Courses
      { id: "phy101-demo", title: "Mechanics & Heat", code: "PHY-101", creditHours: 4, creditHoursFormat: "4(3-1)", theoryHours: 3, labHours: 1, courseType: "LAB_PRACTICAL", semester: 1, session: "2024-2028", programId: bsPhy.id, departmentId: phyDept.id, facultyId: seededFaculty[1].id },
      { id: "phy102-demo", title: "Electricity & Magnetism", code: "PHY-102", creditHours: 4, creditHoursFormat: "4(3-1)", theoryHours: 3, labHours: 1, courseType: "LAB_PRACTICAL", semester: 2, session: "2024-2028", programId: bsPhy.id, departmentId: phyDept.id, facultyId: seededFaculty[1].id }
    ];

    const seededCourses: any[] = [];
    for (const c of courseData) {
      const course = await prisma.course.upsert({
        where: { id: c.id },
        update: c,
        create: c
      });
      seededCourses.push(course);
    }

    // 8. Fee Settings
    const feeSettingsData = [
      { key: "BS_ADMISSION", session: "2024", label: "BS Admission Fee", amount: 15000, category: "BS", description: "One-time admission fee for BS programs" },
      { key: "BS_SEMESTER", session: "2024", label: "BS Semester Tuition Fee", amount: 25000, category: "BS", description: "Per semester tuition fee for BS programs" },
      { key: "INTER_ADMISSION", session: "2024", label: "Intermediate Admission Fee", amount: 8000, category: "INTERMEDIATE", description: "One-time admission fee for F.Sc/F.A" },
      { key: "EXAM_FEE", session: "2024", label: "Semester Examination Fee", amount: 3500, category: "EXAM", description: "Per semester examination fee" }
    ];

    for (const fs of feeSettingsData) {
      await prisma.feeSettings.upsert({
        where: { key_session: { key: fs.key, session: fs.session } },
        update: fs,
        create: fs
      });
    }

    // 9. Students & Approved Admissions across Semesters (1 to 8)
    const studentData = [
      {
        name: "Ali Hamza Baloch",
        email: "ali.baloch@student.edu.pk",
        rollNumber: "2024-BSCS-001",
        educationLevel: "BS",
        session: "2024-2028",
        cnic: "54400-1234567-1",
        fatherName: "Hamza Khan Baloch",
        contactNumber: "0333-7891234",
        residentAddress: "House 12, Zarghoon Road, Quetta",
        programId: bsCS.id,
        semester: 2,
        bsType: "REGULAR",
        gender: "MALE"
      },
      {
        name: "Fatima Khan",
        email: "fatima.khan@student.edu.pk",
        rollNumber: "2024-BSCS-002",
        educationLevel: "BS",
        session: "2024-2028",
        cnic: "54400-2345678-2",
        fatherName: "Muhammad Khan",
        contactNumber: "0300-9876543",
        residentAddress: "Sariab Road, Quetta",
        programId: bsCS.id,
        semester: 4,
        bsType: "REGULAR",
        gender: "FEMALE"
      },
      {
        name: "Maryam Jamaldini",
        email: "maryam.jamaldini@student.edu.pk",
        rollNumber: "2022-GPGCQ-018",
        educationLevel: "BS",
        session: "2022-2026",
        cnic: "54701-8901234-2",
        fatherName: "Senator Jamaldini",
        contactNumber: "0333-8901018",
        residentAddress: "Model Town, Quetta",
        programId: bsCS.id,
        semester: 6,
        bsType: "REGULAR",
        gender: "FEMALE"
      },
      {
        name: "Saifullah Mengal",
        email: "saifullah.mengal@student.edu.pk",
        rollNumber: "2021-BSCS-010",
        educationLevel: "BS",
        session: "2021-2025",
        cnic: "54101-7878787-3",
        fatherName: "Mir Mengal",
        contactNumber: "0334-7878787",
        residentAddress: "Brewery Road, Quetta",
        programId: bsCS.id,
        semester: 8,
        bsType: "REGULAR",
        gender: "MALE"
      },
      {
        name: "Danish Achakzai",
        email: "danish.achakzai@student.edu.pk",
        rollNumber: "2023-BSCS-015",
        educationLevel: "BS",
        session: "2023-2027",
        cnic: "54302-8901234-1",
        fatherName: "Haji Abdul Baqi",
        contactNumber: "0300-8901008",
        residentAddress: "Chaman Road, Quetta",
        programId: bsCS.id,
        semester: 4,
        bsType: "REGULAR",
        gender: "MALE"
      },
      {
        name: "Bilal Ahmed Bugti",
        email: "bilal.bugti@student.edu.pk",
        rollNumber: "2024-BSPHY-001",
        educationLevel: "BS",
        session: "2024-2028",
        cnic: "54400-3456789-3",
        fatherName: "Sardar Ahmed Bugti",
        contactNumber: "0312-4567890",
        residentAddress: "Model Town, Quetta",
        programId: bsPhy.id,
        semester: 2,
        bsType: "REGULAR",
        gender: "MALE"
      },
      {
        name: "Zainab Aziz",
        email: "zainab.aziz@student.edu.pk",
        rollNumber: "2024-FSC-101",
        educationLevel: "INTERMEDIATE",
        session: "2024-2026",
        cnic: "54400-4567890-4",
        fatherName: "Abdul Aziz",
        contactNumber: "0345-1234567",
        residentAddress: "Jinnah Road, Quetta",
        programId: fscMed.id,
        groupId: preMedGroup.id,
        gender: "FEMALE"
      },
      {
        name: "Syed Mustafa Shah",
        email: "mustafa.shah@student.edu.pk",
        rollNumber: "2024-FSC-102",
        educationLevel: "INTERMEDIATE",
        session: "2024-2026",
        cnic: "54400-5678901-5",
        fatherName: "Syed Anwar Shah",
        contactNumber: "0321-6543210",
        residentAddress: "Brewery Road, Quetta",
        programId: fscEng.id,
        groupId: preEngGroup.id,
        gender: "MALE"
      }
    ];

    const seededStudents: any[] = [];
    for (const s of studentData) {
      const user = await prisma.user.upsert({
        where: { email: s.email },
        update: { name: s.name, role: "STUDENT" },
        create: { email: s.email, name: s.name, password: hashedStudentPw, role: "STUDENT" }
      });

      const student = await prisma.student.upsert({
        where: { userId: user.id },
        update: {
          rollNumber: s.rollNumber,
          educationLevel: s.educationLevel,
          session: s.session,
          fatherName: s.fatherName,
          cnic: s.cnic,
          contactNumber: s.contactNumber,
          residentAddress: s.residentAddress,
          programId: s.programId,
          groupId: s.groupId || null,
          bsAdmissionType: s.bsType || null,
          currentSemester: s.semester || null
        },
        create: {
          userId: user.id,
          rollNumber: s.rollNumber,
          educationLevel: s.educationLevel,
          session: s.session,
          fatherName: s.fatherName,
          cnic: s.cnic,
          contactNumber: s.contactNumber,
          residentAddress: s.residentAddress,
          programId: s.programId,
          groupId: s.groupId || null,
          bsAdmissionType: s.bsType || null,
          currentSemester: s.semester || null
        }
      });
      seededStudents.push(student);

      // Link an approved admission record for each student
      let admission = await prisma.admission.findUnique({ where: { cnic: s.cnic } });
      if (!admission) {
        admission = await prisma.admission.create({
          data: {
            studentName: s.name,
            fatherName: s.fatherName,
            cnic: s.cnic,
            dateOfBirth: new Date("2004-05-15"),
            contactNumber: s.contactNumber,
            email: s.email,
            residentAddress: s.residentAddress,
            educationLevel: s.educationLevel,
            programId: s.programId,
            groupId: s.groupId || null,
            bsAdmissionType: s.bsType || null,
            session: s.session,
            status: "APPROVED",
            gender: s.gender,
            hsscObtained: 910,
            hsscTotal: 1100,
            hsscGroup: "PRE_ENGINEERING",
            hsscBoard: "BBISE QUETTA"
          }
        });
      }

      // Create Challan & Fee for student
      const challanNum = "CHAL-" + s.rollNumber.replace(/-/g, "");
      await prisma.challan.upsert({
        where: { challanNumber: challanNum },
        update: { status: "PAID", paidAt: new Date() },
        create: {
          challanNumber: challanNum,
          cnic: s.cnic,
          applicantName: s.name,
          fatherName: s.fatherName,
          feeType: s.educationLevel === "BS" ? "BS_ADMISSION" : "INTER_ADMISSION",
          feeLabel: s.educationLevel === "BS" ? "BS Admission Fee" : "Intermediate Admission Fee",
          amount: s.educationLevel === "BS" ? 15000 : 8000,
          dueDate: new Date("2024-09-30"),
          status: "PAID",
          educationLevel: s.educationLevel,
          session: s.session,
          paidAt: new Date(),
          paidId: "PAID-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
          gender: s.gender,
          programId: s.programId,
          admissionId: admission.id,
          studentId: student.id
        }
      });
    }

    // 10. Pending Admissions (Demo Applicants)
    const pendingApplicants = [
      { name: "Sanaullah Kakar", fatherName: "Naimatullah Kakar", cnic: "54400-6789012-6", contact: "0333-1122334", email: "sana.kakar@gmail.com", level: "BS", progId: bsCS.id, session: "2024", gender: "MALE" },
      { name: "Hina Tareen", fatherName: "Tariq Tareen", cnic: "54400-7890123-7", contact: "0300-4455667", email: "hina.tareen@gmail.com", level: "BS", progId: bsPhy.id, session: "2024", gender: "FEMALE" },
      { name: "Ahmed Raza", fatherName: "Ghulam Raza", cnic: "54400-8901234-8", contact: "0315-7788990", email: "ahmed.raza@gmail.com", level: "INTERMEDIATE", progId: fscEng.id, groupId: preEngGroup.id, session: "2024", gender: "MALE" }
    ];

    for (const app of pendingApplicants) {
      const existing = await prisma.admission.findUnique({ where: { cnic: app.cnic } });
      if (!existing) {
        const adm = await prisma.admission.create({
          data: {
            studentName: app.name,
            fatherName: app.fatherName,
            cnic: app.cnic,
            dateOfBirth: new Date("2005-08-20"),
            contactNumber: app.contact,
            email: app.email,
            residentAddress: "Quetta City",
            educationLevel: app.level,
            programId: app.progId,
            groupId: app.groupId || null,
            session: app.session,
            status: "PENDING",
            gender: app.gender,
            hsscObtained: 850,
            hsscTotal: 1100,
            hsscBoard: "BBISE QUETTA"
          }
        });

        await prisma.challan.create({
          data: {
            challanNumber: "CHAL-APP-" + Math.floor(100000 + Math.random() * 900000),
            cnic: app.cnic,
            applicantName: app.name,
            fatherName: app.fatherName,
            feeType: app.level === "BS" ? "BS_ADMISSION" : "INTER_ADMISSION",
            feeLabel: app.level === "BS" ? "BS Admission Fee" : "Intermediate Admission Fee",
            amount: app.level === "BS" ? 15000 : 8000,
            dueDate: new Date("2026-09-15"),
            status: "PENDING",
            educationLevel: app.level,
            session: app.session,
            gender: app.gender,
            programId: app.progId,
            admissionId: adm.id
          }
        });
      }
    }

    // 11. Course Enrollments, Attendance & Marks (4 to 7 papers per semester)
    const bsStudents = seededStudents.filter((s) => s.educationLevel === "BS");

    for (const std of bsStudents) {
      const studentSemester = std.currentSemester || 1;
      const targetCourses = seededCourses.filter(
        (c) => c.programId === std.programId && c.semester <= studentSemester
      );

      let cumulativeQP = 0;
      let cumulativeCredits = 0;

      for (let sem = 1; sem <= studentSemester; sem++) {
        const semCourses = targetCourses.filter((c) => c.semester === sem);
        let semQP = 0;
        let semCredits = 0;

        for (const course of semCourses) {
          await prisma.enrollment.upsert({
            where: { studentId_courseId: { studentId: std.id, courseId: course.id } },
            update: { semester: sem, status: "ACTIVE" },
            create: { studentId: std.id, courseId: course.id, semester: sem, status: "ACTIVE" },
          });

          // Generate realistic marks between 62 and 96
          const rollSeed = (std.rollNumber || "0").charCodeAt(std.rollNumber.length - 1);
          const courseSeed = course.code.charCodeAt(course.code.length - 1);
          const baseScore = 65 + ((rollSeed * 3 + courseSeed * 7 + sem * 5) % 29);
          const score = Math.min(96, Math.max(58, baseScore));
          const midMarks = Math.round((score * 30) / 100);
          const finalMarks = Math.round((score * 50) / 100);
          const sessional = score - midMarks - finalMarks;
          const assign = Math.round(sessional / 2);
          const quiz = sessional - assign;

          await prisma.marks.upsert({
            where: { studentId_courseId: { studentId: std.id, courseId: course.id } },
            update: {
              assignmentMarks: assign,
              quizMarks: quiz,
              midtermMarks: midMarks,
              finalMarks: finalMarks,
              obtainedMarks: score,
              totalMarks: 100,
              status: "SUBMITTED",
              isLocked: true,
            },
            create: {
              studentId: std.id,
              courseId: course.id,
              assignmentMarks: assign,
              quizMarks: quiz,
              midtermMarks: midMarks,
              finalMarks: finalMarks,
              obtainedMarks: score,
              totalMarks: 100,
              status: "SUBMITTED",
              isLocked: true,
            },
          });

          // Standard HEC GP calculation
          let gp = 0;
          if (score >= 85) gp = 4.0;
          else if (score >= 80) gp = 3.66;
          else if (score >= 75) gp = 3.33;
          else if (score >= 70) gp = 3.0;
          else if (score >= 65) gp = 2.66;
          else if (score >= 60) gp = 2.0;
          else if (score >= 50) gp = 1.0;

          const cr = course.creditHours || 3;
          semQP += gp * cr;
          semCredits += cr;
        }

        cumulativeQP += semQP;
        cumulativeCredits += semCredits;

        const sgpa = semCredits > 0 ? parseFloat((semQP / semCredits).toFixed(2)) : 0;
        const cgpa = cumulativeCredits > 0 ? parseFloat((cumulativeQP / cumulativeCredits).toFixed(2)) : 0;

        const existingResult = await prisma.result.findFirst({
          where: { studentId: std.id, semester: sem },
        });
        if (existingResult) {
          await prisma.result.update({
            where: { id: existingResult.id },
            data: { gpa: sgpa, cgpa: cgpa, status: "PROMOTED" },
          });
        } else {
          await prisma.result.create({
            data: { studentId: std.id, semester: sem, gpa: sgpa, cgpa: cgpa, status: "PROMOTED" },
          });
        }
      }
    }

    // 12. Timetable Entries
    const cs101Course = seededCourses.find((c) => c.code === "CS-101");
    if (cs101Course) {
      await prisma.timetable.create({
        data: {
          session: "2024",
          semester: 1,
          dayOfWeek: "MONDAY",
          startTime: "09:00",
          endTime: "10:30",
          educationLevel: "BS",
          courseId: cs101Course.id,
          facultyId: seededFaculty[0].id,
          programId: bsCS.id,
          departmentId: csDept.id,
          status: "PUBLISHED"
        }
      });
    }

    // 13. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any)?.id,
        userEmail: session.user?.email || null,
        userName: session.user?.name || "Super Admin",
        action: "CREATE",
        entity: "System",
        description: "Full realistic dummy data loaded successfully across all system models."
      }
    });

    return NextResponse.json({
      success: true,
      message: "Comprehensive realistic dummy data loaded successfully!",
      stats: {
        departments: 5,
        programs: 5,
        faculty: seededFaculty.length,
        students: seededStudents.length,
        admissions: studentData.length + pendingApplicants.length,
        courses: seededCourses.length
      }
    });
  } catch (error: any) {
    console.error("Error loading dummy data:", error);
    return NextResponse.json({ error: error?.message || "Failed to load dummy data" }, { status: 500 });
  }
}

// DELETE: Clear all dummy / operational data, keeping SuperAdmin intact
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Delete in order to respect foreign key constraints
    await prisma.auditLog.deleteMany({});
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
    await prisma.course.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.faculty.deleteMany({});
    await prisma.program.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.feeSettings.deleteMany({});

    // Delete non-admin users (preserve admin user: admin@college.edu)
    await prisma.user.deleteMany({
      where: {
        email: {
          not: "admin@college.edu"
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any)?.id,
        userEmail: session.user?.email || null,
        userName: session.user?.name || "Super Admin",
        action: "DELETE",
        entity: "System",
        description: "Cleared all system dummy data while preserving SuperAdmin account."
      }
    });

    return NextResponse.json({
      success: true,
      message: "All dummy data cleared successfully! SuperAdmin account preserved."
    });
  } catch (error: any) {
    console.error("Error clearing dummy data:", error);
    return NextResponse.json({ error: error?.message || "Failed to clear dummy data" }, { status: 500 });
  }
}
