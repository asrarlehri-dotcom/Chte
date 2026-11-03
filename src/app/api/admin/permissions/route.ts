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
    if (!["SUPER_ADMIN", "CHTE_ADMIN"].includes(role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rolePerms = await prisma.rolePermission.findMany({
      include: { permission: true },
      orderBy: [{ role: "asc" }],
    });

    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    return NextResponse.json({ rolePerms, permissions });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/admin/permissions — bulk upsert for a role
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!["SUPER_ADMIN", "CHTE_ADMIN"].includes(userRole))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, updates } = await req.json();
    // updates: Array<{ module: string, action: string, isGranted: boolean }>

    if (!role || !Array.isArray(updates))
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    for (const { module, action, isGranted } of updates) {
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
        update: { isGranted },
        create: { role, permissionId: perm.id, isGranted },
      });
    }

    await prisma.auditLog.create({
      data: {
        userEmail: session?.user?.email,
        userName: session?.user?.name,
        action: "UPDATE",
        entity: "RolePermission",
        description: `Permissions updated for role "${role}"`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
