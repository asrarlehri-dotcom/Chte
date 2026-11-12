import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await request.json();
    const records: Record<string, string>[] = body.records || [];

    if (!records || records.length === 0) {
      return NextResponse.json({ error: "No department records provided to import." }, { status: 400 });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const errors: { row: number; item: string; reason: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const rowIdx = i + 1;
      const raw = records[i];

      const name = (raw.name || raw.departmentName || "").trim();
      const code = (raw.code || raw.departmentCode || "").trim().toUpperCase();
      const hodName = (raw.hodName || raw.hod || "").trim();

      if (!name) {
        failedCount++;
        errors.push({ row: rowIdx, item: code || "Unknown Dept", reason: "Missing Department Name: Department name is required." });
        continue;
      }

      if (!code) {
        failedCount++;
        errors.push({ row: rowIdx, item: name, reason: "Missing Department Code: Short acronym is required (e.g. CS, MATH)." });
        continue;
      }

      try {
        const existing = await prisma.department.findUnique({
          where: { code }
        });

        if (existing) {
          await prisma.department.update({
            where: { id: existing.id },
            data: {
              name,
              hodName: hodName || existing.hodName
            }
          });
          updatedCount++;
        } else {
          await prisma.department.create({
            data: {
              name,
              code,
              hodName: hodName || null,
              isActive: true
            }
          });
          importedCount++;
        }
      } catch (err: any) {
        failedCount++;
        errors.push({
          row: rowIdx,
          item: `${code} - ${name}`,
          reason: err?.message || "Database insert error."
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: records.length,
      imported: importedCount,
      updated: updatedCount,
      failed: failedCount,
      errors
    });
  } catch (err: any) {
    console.error("Department import error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

