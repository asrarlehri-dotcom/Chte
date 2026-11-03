import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Default fee structure to seed on first load
const DEFAULT_FEES = [
  { key: "BS_ADMISSION",     label: "BS Admission Fee",          amount: 8500,  category: "BS",           description: "One-time admission processing fee for BS programs" },
  { key: "BS_SEMESTER",      label: "BS Semester Fee",           amount: 3500,  category: "BS",           description: "Per-semester tuition fee for BS students" },
  { key: "BS_EXAM",          label: "BS Examination Fee",        amount: 1500,  category: "BS",           description: "Per-semester examination fee for BS students" },
  { key: "BS_REGISTRATION",  label: "BS Registration Fee",       amount: 500,   category: "BS",           description: "Annual registration/enrollment fee" },
  { key: "INTER_ADMISSION",  label: "Intermediate Admission Fee",amount: 5000,  category: "INTERMEDIATE", description: "One-time admission fee for Intermediate" },
  { key: "INTER_SEMESTER",   label: "Intermediate Semester Fee", amount: 2000,  category: "INTERMEDIATE", description: "Per-semester fee for Intermediate students" },
  { key: "INTER_EXAM",       label: "Intermediate Exam Fee",     amount: 1000,  category: "INTERMEDIATE", description: "Per-semester examination fee" },
  { key: "MIGRATION",        label: "Migration Fee",             amount: 3000,  category: "OTHER",        description: "Fee charged on student migration" },
  { key: "LIBRARY",          label: "Library / Development Fee", amount: 500,   category: "OTHER",        description: "Annual library and development fee" },
];

export async function GET() {
  try {
    let fees = await prisma.feeSettings.findMany({ orderBy: { category: "asc" } });

    // Auto-seed defaults if table is empty
    if (fees.length === 0) {
      await prisma.feeSettings.createMany({ data: DEFAULT_FEES });
      fees = await prisma.feeSettings.findMany({ orderBy: { category: "asc" } });
    }

    return NextResponse.json(fees);
  } catch (error) {
    console.error("Error fetching fee settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "CHTE_ADMIN", "COLLEGE_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, amount, isLocked, isActive, description, key, label, category } = await request.json();

    // Check if fee is locked
    const existing = await prisma.feeSettings.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Fee not found" }, { status: 404 });

    const isEditingLockedFields = (
      (amount !== undefined && Number(amount) !== existing.amount) ||
      (key !== undefined && key !== existing.key) ||
      (label !== undefined && label !== existing.label) ||
      (category !== undefined && category !== existing.category)
    );

    if (existing.isLocked && isEditingLockedFields) {
      return NextResponse.json({ error: "This fee is locked. Core fields cannot be modified." }, { status: 403 });
    }

    const updated = await prisma.feeSettings.update({
      where: { id },
      data: {
        ...(amount !== undefined ? { amount: Number(amount) } : {}),
        ...(isLocked !== undefined ? { isLocked } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(key !== undefined ? { key } : {}),
        ...(label !== undefined ? { label } : {}),
        ...(category !== undefined ? { category } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating fee setting:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "CHTE_ADMIN", "COLLEGE_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, session: targetSession, amount, label, category, description } = await request.json();

    if (!key || amount === undefined || !label) {
      return NextResponse.json({ error: "Key, Label and Amount are required fields" }, { status: 400 });
    }

    const cleanSession = targetSession ? String(targetSession).trim() : null;

    // Check if a fee setting with the same key and session already exists
    const existing = await prisma.feeSettings.findFirst({
      where: {
        key,
        session: cleanSession ? cleanSession : null
      }
    });

    if (existing) {
      return NextResponse.json({
        error: cleanSession
          ? `Fee override for key '${key}' and session '${cleanSession}' already exists.`
          : `Base fee item with key '${key}' already exists.`
      }, { status: 400 });
    }

    const created = await prisma.feeSettings.create({
      data: {
        key,
        session: cleanSession ? cleanSession : null,
        amount: Number(amount),
        label,
        category: category || "OTHER",
        description: description || null,
        isLocked: false,
        isActive: true,
        collegeId: (session.user as any)?.collegeId || null,
      }
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating fee setting:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "CHTE_ADMIN", "COLLEGE_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const existing = await prisma.feeSettings.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Fee setting not found" }, { status: 404 });
    }

    if (existing.isLocked) {
      return NextResponse.json({ error: "Locked fee configurations cannot be deleted." }, { status: 400 });
    }

    await prisma.feeSettings.update({ where: { id }, data: { isActive: false } });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any)?.id,
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "DEACTIVATE",
        entity: "FeeSettings",
        entityId: id,
        description: `Fee setting deactivated`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating fee setting override:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
