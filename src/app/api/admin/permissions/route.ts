import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MODULES, ACTIONS } from "@/lib/permissions";

// GET /api/admin/permissions — full matrix for all roles
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!["SUPER_ADMIN", "CHTE_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL"].includes(role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rolePerms = await prisma.rolePermission.findMany({
      include: { permission: true },
      orderBy: [{ role: "asc" }],
    });

    let permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    // Auto-seed permission catalog if empty so modules and actions exist in DB
    if (permissions.length === 0) {
      const toCreate: { module: string; action: string; description: string }[] = [];
      for (const mod of Object.values(MODULES)) {
        for (const act of Object.values(ACTIONS)) {
          toCreate.push({
            module: mod,
            action: act,
            description: `${mod} - ${act}`,
          });
        }
      }
      await prisma.permission.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      permissions = await prisma.permission.findMany({
        orderBy: [{ module: "asc" }, { action: "asc" }],
      });
    }

    return NextResponse.json({ rolePerms, permissions });
  } catch (e) {
    console.error("GET /api/admin/permissions error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/admin/permissions — bulk upsert for a role
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!["SUPER_ADMIN", "CHTE_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL"].includes(userRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, updates } = await req.json();
    // updates: Array<{ module: string, action: string, isGranted: boolean }>

    // Restrict College Admin / Principal from tampering with central CHTE roles
    if (["COLLEGE_ADMIN", "PRINCIPAL"].includes(userRole) && ["SUPER_ADMIN", "CHTE_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Unauthorized to edit central CHTE roles" }, { status: 403 });
    }

    if (!role || !Array.isArray(updates))
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    for (const { module, action, isGranted } of updates) {
      if (!module || !action) continue;
      let perm = await prisma.permission.findUnique({
        where: { module_action: { module, action } },
      });
      if (!perm) {
        perm = await prisma.permission.create({
          data: { module, action, description: `${module} - ${action}` },
        });
      }
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId: perm.id } },
        update: { isGranted: Boolean(isGranted) },
        create: { role, permissionId: perm.id, isGranted: Boolean(isGranted) },
      });
    }

    await prisma.auditLog.create({
      data: {
        userEmail: session?.user?.email,
        userName: session?.user?.name,
        action: "UPDATE",
        entity: "RolePermission",
        description: `Permissions updated for role "${role}" by ${userRole}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/admin/permissions error:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
