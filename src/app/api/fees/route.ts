import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER"].includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedCollegeId = searchParams.get("collegeId");

    let collegeFilter: string | undefined = undefined;
    if (sessionCollegeId && sessionRole !== "CHTE_ADMIN" && sessionRole !== "SUPER_ADMIN") {
      collegeFilter = sessionCollegeId;
    } else if (requestedCollegeId) {
      collegeFilter = requestedCollegeId;
    }

    const fees = await prisma.fee.findMany({
      where: collegeFilter ? { collegeId: collegeFilter } : undefined,
      include: {
        college: { select: { id: true, name: true, code: true } },
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(fees);
  } catch (error) {
    console.error("Error fetching fees:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** POST /api/fees — manually create a fee record for a student */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    if (!session || !["CHTE_ADMIN", "COLLEGE_ADMIN", "SUPER_ADMIN", "ADMIN", "BS_CONTROLLER"].includes(sessionRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, amount, dueDate, feeType, semester, educationLevel, collegeId } = body;

    if (!studentId || !amount || !dueDate || !feeType) {
      return NextResponse.json({ error: "Missing required fields: studentId, amount, dueDate, feeType" }, { status: 400 });
    }

    const studentRecord = await prisma.student.findUnique({ where: { id: studentId }, select: { collegeId: true } });
    const targetCollegeId = sessionCollegeId || collegeId || studentRecord?.collegeId || null;

    // Generate unique challan number using sequence setting
    const seqSetting = await prisma.systemSetting.findUnique({ where: { key: "CHALLAN_SEQUENCE_CURRENT" } });
    const currentSeq = Number(seqSetting?.value || "135622565");
    await prisma.systemSetting.update({
      where: { key: "CHALLAN_SEQUENCE_CURRENT" },
      data: { value: String(currentSeq + 1) },
    });
    const challanNumber = `FEE-${currentSeq}`;

    const fee = await prisma.fee.create({
      data: {
        studentId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: "UNPAID",
        challanNumber,
        feeType: feeType || null,
        semester: semester ? parseInt(semester) : null,
        educationLevel: educationLevel || null,
        collegeId: targetCollegeId,
      },
      include: { student: { include: { user: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "CREATE",
        entity: "Fee",
        entityId: fee.id,
        description: `Manual fee created for student — Rs ${fee.amount} (${fee.feeType || "General"})`,
        collegeId: targetCollegeId,
      },
    });

    return NextResponse.json(fee, { status: 201 });
  } catch (error: any) {
    console.error("Error creating fee:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
