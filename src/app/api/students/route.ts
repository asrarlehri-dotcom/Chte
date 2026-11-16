import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { sortStudentsByRoll } from "@/lib/domainParsers";

function isStudentPromotedFromSem(s: any, fromSem: number): boolean {
  const semMarks = (s.marks || []).filter((m: any) => {
    const sSem = m.course?.semester ?? m.semester;
    return sSem === fromSem;
  });
  if (semMarks.length === 0) return false;

  let qualityPoints = 0;
  let totalCredits = 0;
  let totalAbsent = 0;
  let totalMax = 0;

  for (const m of semMarks) {
    const cr = m.course?.creditHours || 3;
    const isAbs = m.status === "ABSENT" || m.status === "A";
    const obt = isAbs ? 0 : typeof m.obtainedMarks === "number" ? m.obtainedMarks : 0;
    const max = typeof m.totalMarks === "number" && m.totalMarks > 0 ? m.totalMarks : 100;

    if (isAbs) {
      totalAbsent++;
    } else {
      const pct = (obt / max) * 100;
      let gp = 0;
      if (pct >= 85) gp = 4.0;
      else if (pct >= 80) gp = 3.66;
      else if (pct >= 75) gp = 3.33;
      else if (pct >= 71) gp = 3.0;
      else if (pct >= 68) gp = 2.66;
      else if (pct >= 64) gp = 2.33;
      else if (pct >= 61) gp = 2.0;
      else if (pct >= 58) gp = 1.66;
      else if (pct >= 54) gp = 1.3;
      else if (pct >= 50) gp = 1.0;
      else gp = 0.0;

      qualityPoints += gp * cr;
    }
    totalMax += max;
    totalCredits += cr;
  }

  // If student was absent in all papers of that semester, they are NOT promoted
  if (totalAbsent > 0 && totalAbsent === semMarks.length) return false;
  if (totalMax === 0 || totalCredits === 0) return false;

  const gpa = qualityPoints / totalCredits;
  return gpa >= 1.00;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (
      !session ||
      !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "FACULTY", "BS_FACULTY", "INTER_FACULTY", "TEACHER", "BS_CONTROLLER", "PRINCIPAL"].includes(
        sessionRole
      )
    )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const educationLevel = searchParams.get("educationLevel") || undefined;
    const programId = searchParams.get("programId") || undefined;
    const sessionParam = searchParams.get("session") || undefined;
    const currentSemesterParam = searchParams.get("currentSemester") || searchParams.get("semester") || undefined;
    const courseId = searchParams.get("courseId") || undefined;
    const requestedCollegeId = searchParams.get("collegeId") || undefined;
    const includeInactive = searchParams.get("includeInactive") === "true";

    let collegeFilter: string | undefined = undefined;
    if (sessionCollegeId && sessionRole !== "CHTE_ADMIN" && sessionRole !== "SUPER_ADMIN") {
      collegeFilter = sessionCollegeId;
    } else if (requestedCollegeId) {
      collegeFilter = requestedCollegeId;
    }

    const requestedSem = currentSemesterParam ? parseInt(currentSemesterParam) : undefined;

    // ── Auto-Push Promoted Students to Next Semester ────────────────────────
    if (requestedSem && requestedSem > 1) {
      const fromSem = requestedSem - 1;
      try {
        const prevCandidates = await prisma.student.findMany({
          where: {
            ...(!includeInactive ? { isActive: true } : {}),
            ...(collegeFilter && { collegeId: collegeFilter }),
            ...(educationLevel && { educationLevel }),
            ...(programId && { programId }),
            currentSemester: fromSem,
            ...(sessionParam && sessionParam !== "ALL" && {
              OR: [
                { session: sessionParam },
                { session: { contains: sessionParam } },
              ],
            }),
          },
          include: {
            marks: { include: { course: true } },
          },
        });

        const eligibleToAutoPush = prevCandidates.filter((s) => isStudentPromotedFromSem(s, fromSem));
        if (eligibleToAutoPush.length > 0) {
          const eligibleIds = eligibleToAutoPush.map((s) => s.id);

          // 1. Advance currentSemester to requestedSem
          await prisma.student.updateMany({
            where: { id: { in: eligibleIds } },
            data: { currentSemester: requestedSem },
          });

          // 2. Insert Promotion history
          await prisma.promotion.createMany({
            data: eligibleToAutoPush.map((s) => ({
              studentId: s.id,
              fromSemester: fromSem,
              toSemester: requestedSem,
              status: "PROMOTED",
              promotedBy: "System (Auto-Promoted on Results Completion)",
            })),
            skipDuplicates: true,
          });

          // 3. Auto-enroll in requestedSem courses
          const nextCourses = await prisma.course.findMany({
            where: {
              ...(programId ? { programId } : {}),
              semester: requestedSem,
            },
            select: { id: true, semester: true },
          });

          if (nextCourses.length > 0) {
            const enrollmentsToCreate: any[] = [];
            for (const st of eligibleToAutoPush) {
              for (const c of nextCourses) {
                enrollmentsToCreate.push({
                  studentId: st.id,
                  courseId: c.id,
                  semester: requestedSem,
                  status: "ACTIVE",
                  isActive: true,
                });
              }
            }
            await prisma.enrollment.createMany({
              data: enrollmentsToCreate,
              skipDuplicates: true,
            });
          }
        }
      } catch (autoErr) {
        console.warn("Auto-push background execution warning:", autoErr);
      }
    }

    // ── Enrollment-based filtering ───────────────────────────────────────────
    if (courseId) {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          courseId,
          status: "ACTIVE",
          student: {
            ...(!includeInactive ? { isActive: true } : {}),
            ...(collegeFilter && { collegeId: collegeFilter }),
            ...(sessionParam && sessionParam !== "ALL" && {
              OR: [
                { session: sessionParam },
                { session: { contains: sessionParam } },
              ],
            }),
          },
        },
        include: {
          student: {
            include: { user: true, program: true, group: true, statuses: true, promotions: true, college: true },
          },
        },
        orderBy: { student: { rollNumber: "asc" } },
      });
      let students = enrollments.map((e) => e.student).filter(Boolean);

      // Fallback: If no explicit enrollments exist yet for this course,
      // fallback to active students matching this course's program and semester!
      if (students.length === 0) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { id: true, semester: true, programId: true, session: true },
        });

        if (course) {
          // If course is semester > 1, check if any previous semester students need auto-promotion
          if (course.semester > 1) {
            try {
              const cFromSem = course.semester - 1;
              const prevCandidates = await prisma.student.findMany({
                where: {
                  ...(!includeInactive ? { isActive: true } : {}),
                  ...(collegeFilter && { collegeId: collegeFilter }),
                  programId: course.programId,
                  currentSemester: cFromSem,
                },
                include: { marks: { include: { course: true } } },
              });
              const eligible = prevCandidates.filter((s) => isStudentPromotedFromSem(s, cFromSem));
              if (eligible.length > 0) {
                const elIds = eligible.map((s) => s.id);
                await prisma.student.updateMany({
                  where: { id: { in: elIds } },
                  data: { currentSemester: course.semester },
                });
                await prisma.promotion.createMany({
                  data: eligible.map((s) => ({
                    studentId: s.id,
                    fromSemester: cFromSem,
                    toSemester: course.semester,
                    status: "PROMOTED",
                    promotedBy: "System (Auto-Promoted on Results Completion)",
                  })),
                  skipDuplicates: true,
                });
              }
            } catch (courseAutoErr) {
              console.warn("Course auto-promote warning:", courseAutoErr);
            }
          }

          const matchingStudents = await prisma.student.findMany({
            where: {
              ...(!includeInactive ? { isActive: true } : {}),
              ...(collegeFilter && { collegeId: collegeFilter }),
              programId: course.programId,
              OR: [
                { currentSemester: course.semester },
                { currentSemester: { gte: course.semester } },
                { enrollments: { some: { courseId: course.id } } },
                { marks: { some: { courseId: course.id } } },
              ],
              ...(sessionParam && sessionParam !== "ALL"
                ? {
                    OR: [
                      { session: sessionParam },
                      { session: { contains: sessionParam } },
                    ],
                  }
                : course.session
                ? {
                    OR: [
                      { session: course.session },
                      { session: { contains: course.session } },
                    ],
                  }
                : {}),
            },
            include: {
              user: true,
              program: true,
              group: true,
              statuses: true,
              promotions: true,
              college: true,
            },
            orderBy: { rollNumber: "asc" },
          });

          if (matchingStudents.length > 0) {
            // Auto-enroll them in the background so future queries find them directly
            try {
              await prisma.enrollment.createMany({
                data: matchingStudents.map((st) => ({
                  studentId: st.id,
                  courseId: course.id,
                  semester: course.semester,
                  status: "ACTIVE",
                  isActive: true,
                })),
                skipDuplicates: true,
              });
            } catch (err) {
              console.warn("Auto-enrollment fallback notice:", err);
            }

            return NextResponse.json(sortStudentsByRoll(matchingStudents));
          }
        }
      }

      return NextResponse.json(sortStudentsByRoll(students));
    }

    // ── Standard filter (no courseId) ────────────────────────────────────────
    const students = await prisma.student.findMany({
      where: {
        ...(!includeInactive ? { isActive: true } : {}),
        ...(collegeFilter && { collegeId: collegeFilter }),
        ...(educationLevel && { educationLevel }),
        ...(programId && { programId }),
        ...(sessionParam && sessionParam !== "ALL" && {
          OR: [
            { session: sessionParam },
            { session: { contains: sessionParam } },
          ],
        }),
        // Crucial: A student remains visible in their previous semesters (gte) as well as current/enrolled/graded semesters!
        ...(currentSemesterParam && (() => {
          const targetSem = parseInt(currentSemesterParam);
          return {
            OR: [
              { currentSemester: targetSem },
              { currentSemester: { gte: targetSem } },
              { enrollments: { some: { semester: targetSem } } },
              { marks: { some: { course: { semester: targetSem } } } },
              { promotions: { some: { OR: [{ fromSemester: targetSem }, { toSemester: targetSem }] } } },
            ],
          };
        })()),
      },
      include: {
        user: true,
        program: true,
        group: true,
        statuses: true,
        promotions: true,
        college: { select: { id: true, name: true, code: true } },
        marks: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { rollNumber: "asc" },
    });

    return NextResponse.json(sortStudentsByRoll(students));
  } catch {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN"].includes(sessionRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, email, password, rollNumber, educationLevel, programId, groupId, currentSemester, bsAdmissionType, collegeId } = body;

    if (!name || !email || !password || !rollNumber || !educationLevel)
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });

    const targetCollegeId = sessionCollegeId || collegeId || null;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    const existingRoll = await prisma.student.findUnique({ where: { rollNumber } });
    if (existingRoll) return NextResponse.json({ error: "Roll number already exists" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "STUDENT",
        collegeId: targetCollegeId,
      }
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        rollNumber,
        educationLevel,
        programId: programId || null,
        groupId: groupId || null,
        currentSemester: currentSemester ? parseInt(currentSemester) : null,
        bsAdmissionType: bsAdmissionType || null,
        collegeId: targetCollegeId,
      },
      include: { user: true, program: true, group: true },
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "CREATE",
        entity: "Student",
        entityId: student.id,
        description: `Student "${name}" (${rollNumber}) registered`,
        collegeId: targetCollegeId,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to register student" }, { status: 500 });
  }
}
