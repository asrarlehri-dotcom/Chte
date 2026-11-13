"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getDepartments() {
  const session = await getServerSession(authOptions);
  const sessionRole = (session?.user as any)?.role;
  const sessionCollegeId = (session?.user as any)?.collegeId;

  let collegeFilter: string | undefined = undefined;
  if (sessionCollegeId && sessionRole !== "CHTE_ADMIN" && sessionRole !== "SUPER_ADMIN") {
    collegeFilter = sessionCollegeId;
  }

  const depts = await prisma.department.findMany({
    where: {
      isActive: true,
      ...(collegeFilter ? { collegeId: collegeFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      college: { select: { id: true, name: true, code: true } },
      programs: {
        where: { isActive: true },
        include: {
          students: { select: { id: true } }
        }
      }
    }
  });

  return depts.map(d => {
    const studentCount = d.programs.reduce((acc, p) => acc + (p.students?.length || 0), 0);
    return {
      ...d,
      studentCount,
      hasData: studentCount > 0
    };
  });
}

export async function addDepartment(data: { 
  name: string; 
  code: string; 
  hodName: string; 
  phone?: string; 
  email?: string; 
  startingYear?: number; 
  studentCapacity?: number;
  collegeId?: string;
}) {
  const session = await getServerSession(authOptions);
  const sessionRole = (session?.user as any)?.role;
  const sessionCollegeId = (session?.user as any)?.collegeId;

  const targetCollegeId = sessionCollegeId || data.collegeId || null;

  await prisma.department.create({ 
    data: {
      name: data.name,
      code: data.code.trim().toUpperCase(),
      hodName: data.hodName || null,
      collegeId: targetCollegeId,
    } 
  });
  revalidatePath("/admin/departments-programs");
}

export async function toggleDepartmentStatus(id: string, isActive: boolean) {
  await prisma.department.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/departments-programs");
}

export async function getPrograms() {
  const session = await getServerSession(authOptions);
  const sessionRole = (session?.user as any)?.role;
  const sessionCollegeId = (session?.user as any)?.collegeId;

  let collegeFilter: string | undefined = undefined;
  if (sessionCollegeId && sessionRole !== "CHTE_ADMIN" && sessionRole !== "SUPER_ADMIN") {
    collegeFilter = sessionCollegeId;
  }

  const progs = await prisma.program.findMany({
    where: {
      isActive: true,
      ...(collegeFilter ? { collegeId: collegeFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      department: true,
      college: { select: { id: true, name: true, code: true } },
      students: { select: { id: true } },
      courses: {
        where: { isActive: true },
        select: {
          id: true,
          marks: { select: { id: true } }
        }
      }
    }
  });

  return progs.map(p => {
    const studentCount = p.students?.length || 0;
    const marksCount = p.courses?.reduce((acc, c) => acc + (c.marks?.length || 0), 0) || 0;
    return {
      ...p,
      studentCount,
      marksCount,
      hasData: (studentCount + marksCount) > 0
    };
  });
}

export async function addProgram(data: { name: string; code: string; educationLevel: string; departmentId: string; collegeId?: string }) {
  const session = await getServerSession(authOptions);
  const sessionRole = (session?.user as any)?.role;
  const sessionCollegeId = (session?.user as any)?.collegeId;

  const targetCollegeId = sessionCollegeId || data.collegeId || null;

  await prisma.program.create({ 
    data: {
      name: data.name,
      code: data.code.trim().toUpperCase(),
      educationLevel: data.educationLevel,
      departmentId: data.departmentId || null,
      collegeId: targetCollegeId,
    } 
  });
  revalidatePath("/admin/departments-programs");
}

export async function toggleProgramStatus(id: string, isActive: boolean) {
  await prisma.program.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/departments-programs");
}

export async function updateDepartment(id: string, data: { name: string; code: string; hodName: string }) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    const existingDept = await prisma.department.findUnique({ where: { id } });
    if (!existingDept) return { success: false, error: "Department not found" };

    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (existingDept.collegeId && existingDept.collegeId !== sessionCollegeId) {
        return { success: false, error: "Forbidden: You cannot modify departments of another college" };
      }
    }

    await prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code.trim().toUpperCase(),
        hodName: data.hodName || null
      }
    });
    revalidatePath("/admin/departments-programs");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update department" };
  }
}

export async function deleteDepartment(id: string) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    const existingDept = await prisma.department.findUnique({ where: { id } });
    if (!existingDept) return { success: false, error: "Department not found" };

    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (existingDept.collegeId && existingDept.collegeId !== sessionCollegeId) {
        return { success: false, error: "Forbidden: You cannot delete departments of another college" };
      }
    }

    try {
      await prisma.department.delete({ where: { id } });
    } catch {
      await prisma.department.update({ where: { id }, data: { isActive: false } });
    }

    revalidatePath("/admin/departments-programs");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete department" };
  }
}

export async function updateProgram(id: string, data: { name: string; code: string; educationLevel: string; departmentId: string }) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    const existingProg = await prisma.program.findUnique({ where: { id } });
    if (!existingProg) return { success: false, error: "Program not found" };

    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (existingProg.collegeId && existingProg.collegeId !== sessionCollegeId) {
        return { success: false, error: "Forbidden: You cannot modify programs of another college" };
      }
    }

    await prisma.program.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code.trim().toUpperCase(),
        educationLevel: data.educationLevel,
        departmentId: data.departmentId || null
      }
    });
    revalidatePath("/admin/departments-programs");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update program" };
  }
}

export async function deleteProgram(id: string) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = (session?.user as any)?.role;
    const sessionCollegeId = (session?.user as any)?.collegeId;

    const existingProg = await prisma.program.findUnique({ where: { id } });
    if (!existingProg) return { success: false, error: "Program not found" };

    if (sessionCollegeId && sessionRole !== "SUPER_ADMIN" && sessionRole !== "CHTE_ADMIN") {
      if (existingProg.collegeId && existingProg.collegeId !== sessionCollegeId) {
        return { success: false, error: "Forbidden: You cannot delete programs of another college" };
      }
    }

    try {
      await prisma.program.delete({ where: { id } });
    } catch {
      await prisma.program.update({ where: { id }, data: { isActive: false } });
    }

    revalidatePath("/admin/departments-programs");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete program" };
  }
}
