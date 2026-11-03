import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !["CHTE_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden: CHTE Master Access Required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const college = await prisma.college.findUnique({ where: { id } });
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    // Status toggle (Active / Suspended)
    if (body.isActive !== undefined) {
      const updated = await prisma.college.update({
        where: { id },
        data: { isActive: Boolean(body.isActive) }
      });
      return NextResponse.json({ success: true, college: updated });
    }

    // Reset College Admin Password
    if (body.newAdminPassword) {
      const adminUser = await prisma.user.findFirst({
        where: { collegeId: id, role: { in: ["COLLEGE_ADMIN", "SUPER_ADMIN"] } }
      });

      if (!adminUser) {
        return NextResponse.json({ error: "No admin user found for this college." }, { status: 404 });
      }

      const hashedPassword = await bcrypt.hash(body.newAdminPassword.trim(), 10);
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashedPassword }
      });

      return NextResponse.json({
        success: true,
        message: `Password reset successfully for ${adminUser.email}`,
      });
    }

    // Update general fields
    const updated = await prisma.college.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl.trim() } : {}),
        ...(body.tagline !== undefined ? { tagline: body.tagline.trim() } : {}),
        ...(body.district ? { district: body.district.trim() } : {}),
        ...(body.division ? { division: body.division.trim() } : {}),
        ...(body.address !== undefined ? { address: body.address.trim() } : {}),
        ...(body.principalName !== undefined ? { principalName: body.principalName.trim() } : {}),
        ...(body.contactPhone !== undefined ? { contactPhone: body.contactPhone.trim() } : {}),
        ...(body.bankName !== undefined ? { bankName: body.bankName.trim() } : {}),
        ...(body.bankAccount !== undefined ? { bankAccount: body.bankAccount.trim() } : {}),
        ...(body.branchCode !== undefined ? { branchCode: body.branchCode.trim() } : {}),
        ...(body.accountTitle !== undefined ? { accountTitle: body.accountTitle.trim() } : {}),
      }
    });

    return NextResponse.json({ success: true, college: updated });
  } catch (error: any) {
    console.error("Error updating college:", error);
    return NextResponse.json({ error: error.message || "Failed to update college." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !["CHTE_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden: CHTE Master Access Required" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.college.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "College deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting college:", error);
    return NextResponse.json({ error: error.message || "Failed to delete college." }, { status: 500 });
  }
}
