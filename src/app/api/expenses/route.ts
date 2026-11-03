import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, MODULES, ACTIONS } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const role = (session.user as any).role;
    const canView = await checkPermission(role, MODULES.ADMIN_EXPENSES, ACTIONS.VIEW);
    if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const departmentId = searchParams.get("departmentId");
    const requestedCollegeId = searchParams.get("collegeId");

    const sessionCollegeId = (session.user as any)?.collegeId;
    let collegeFilter: string | undefined = undefined;
    if (sessionCollegeId && role !== "CHTE_ADMIN" && role !== "SUPER_ADMIN") {
      collegeFilter = sessionCollegeId;
    } else if (requestedCollegeId) {
      collegeFilter = requestedCollegeId;
    }
    
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (departmentId) where.departmentId = departmentId;
    if (collegeFilter) where.collegeId = collegeFilter;

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        department: true,
      },
      orderBy: { date: "desc" }
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const role = (session.user as any).role;
    const canAdd = await checkPermission(role, MODULES.ADMIN_EXPENSES, ACTIONS.ADD);
    if (!canAdd) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { category, date, description, amount, vendorPayee, paymentMethod, departmentId, session: academicSession, receipt, status } = body;

    const expense = await prisma.expense.create({
      data: {
        category,
        date: new Date(date),
        description,
        amount: parseFloat(amount),
        vendorPayee,
        paymentMethod,
        departmentId,
        session: academicSession,
        receipt,
        status: status || "PAID",
        createdBy: session.user?.email || "unknown",
        collegeId: (session.user as any)?.collegeId || body.collegeId || null,
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
