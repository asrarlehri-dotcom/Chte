// ─── Permission Modules ───────────────────────────────────────────────────────
export const MODULES = {
  // Intermediate
  INTER_ADMISSIONS:  "INTERMEDIATE.ADMISSIONS",
  INTER_STUDENTS:    "INTERMEDIATE.STUDENTS",
  INTER_FEES:        "INTERMEDIATE.FEES",
  INTER_ATTENDANCE:  "INTERMEDIATE.ATTENDANCE",
  INTER_TIMETABLE:   "INTERMEDIATE.TIMETABLE",
  INTER_FACULTY:     "INTERMEDIATE.FACULTY",
  INTER_REPORTS:     "INTERMEDIATE.REPORTS",
  // BS
  BS_ADMISSIONS:     "BS.ADMISSIONS",
  BS_ACADEMIC_SETUP: "BS.ACADEMIC_SETUP",
  BS_STUDENTS:       "BS.STUDENTS",
  BS_COURSES:        "BS.COURSES",
  BS_ENROLLMENTS:    "BS.ENROLLMENTS",
  BS_FEES:           "BS.FEES",
  BS_ATTENDANCE:     "BS.ATTENDANCE",
  BS_TIMETABLE:      "BS.TIMETABLE",
  BS_EXAMS:          "BS.EXAMS",
  BS_MARKS:          "BS.MARKS",
  BS_RESULTS:        "BS.RESULTS",
  BS_GPA_CGPA:       "BS.GPA_CGPA",
  BS_PROMOTIONS:     "BS.PROMOTIONS",
  BS_DMC:            "BS.DMC",
  BS_TRANSCRIPT:     "BS.TRANSCRIPT",
  BS_GAZETTE:        "BS.GAZETTE",
  BS_STUDENT_ACTIONS:"BS.STUDENT_ACTIONS",
  BS_GRADUATION:     "BS.GRADUATION",
  // Admin
  ADMIN_USERS:        "ADMIN.USERS",
  ADMIN_PERMISSIONS:  "ADMIN.PERMISSIONS",
  ADMIN_AUDIT_LOGS:   "ADMIN.AUDIT_LOGS",
  ADMIN_SETTINGS:     "ADMIN.SETTINGS",
  ADMIN_EXPENSES:     "ADMIN.EXPENSES",
} as const;

export type ModuleKey = typeof MODULES[keyof typeof MODULES];

// ─── Permission Actions ───────────────────────────────────────────────────────
export const ACTIONS = {
  VIEW:     "VIEW",
  ADD:      "ADD",
  EDIT:     "EDIT",
  DELETE:   "DELETE",
  GENERATE: "GENERATE",
  PRINT:    "PRINT",
  DOWNLOAD: "DOWNLOAD",
  EXPORT:   "EXPORT",
  APPROVE:  "APPROVE",
  LOCK:     "LOCK",
} as const;

export type ActionKey = typeof ACTIONS[keyof typeof ACTIONS];

// ─── All roles ────────────────────────────────────────────────────────────────
export const ROLES = {
  CHTE_ADMIN:    "CHTE_ADMIN",
  COLLEGE_ADMIN: "COLLEGE_ADMIN",
  SUPER_ADMIN:   "SUPER_ADMIN",
  BS_CONTROLLER: "BS_CONTROLLER",
  BS_FACULTY:    "BS_FACULTY",
  INTER_FACULTY: "INTER_FACULTY",
  PRINCIPAL:     "PRINCIPAL",
  STUDENT:       "STUDENT",
  GUEST:         "GUEST",
} as const;

export type RoleKey = typeof ROLES[keyof typeof ROLES];

// ─── Server-side permission checker ──────────────────────────────────────────
import { prisma } from "@/lib/prisma";

/**
 * Check if a role has a specific permission.
 * CHTE_ADMIN, SUPER_ADMIN, COLLEGE_ADMIN, and PRINCIPAL have full authority over college modules.
 * BS_CONTROLLER has full authority over all BS academic and exam modules.
 */
export async function checkPermission(
  role: string,
  module: ModuleKey,
  action: ActionKey
): Promise<boolean> {
  if (
    role === ROLES.SUPER_ADMIN || 
    role === ROLES.CHTE_ADMIN || 
    role === ROLES.COLLEGE_ADMIN || 
    role === ROLES.PRINCIPAL
  ) {
    return true;
  }

  if (role === ROLES.BS_CONTROLLER && module.startsWith("BS.")) {
    return true;
  }

  try {
    const rp = await prisma.rolePermission.findFirst({
      where: {
        role,
        isGranted: true,
        permission: { module, action },
      },
    });
    return !!rp;
  } catch {
    return false;
  }
}

/**
 * Get the full permission map for a role.
 * Returns: { "MODULE.ACTION": boolean }
 */
export async function getPermissionsForRole(
  role: string
): Promise<Record<string, boolean>> {
  if (
    role === ROLES.SUPER_ADMIN || 
    role === ROLES.CHTE_ADMIN || 
    role === ROLES.COLLEGE_ADMIN || 
    role === ROLES.PRINCIPAL
  ) {
    const all: Record<string, boolean> = {};
    for (const mod of Object.values(MODULES)) {
      for (const act of Object.values(ACTIONS)) {
        all[`${mod}.${act}`] = true;
      }
    }
    return all;
  }

  try {
    const rps = await prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });

    const map: Record<string, boolean> = {};
    for (const rp of rps) {
      map[`${rp.permission.module}.${rp.permission.action}`] = rp.isGranted;
    }

    if (role === ROLES.BS_CONTROLLER) {
      for (const mod of Object.values(MODULES)) {
        if (mod.startsWith("BS.")) {
          for (const act of Object.values(ACTIONS)) {
            map[`${mod}.${act}`] = true;
          }
        }
      }
    }

    return map;
  } catch {
    return {};
  }
}
