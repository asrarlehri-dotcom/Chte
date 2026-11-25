import { FillConfig } from "./theme-fill-compiler";

export interface ModuleBannerOverride {
  pageBannerBg?: string | FillConfig;
  pageBannerWaveColor?: string | FillConfig;
  pageBannerWaveOpacity?: number;
  pageBannerWaveShow?: boolean;
  pageBannerHeight?: number;
  pageBannerImgWidth?: number;
  pageBannerFade?: number;
}

export type ModuleBannerOverridesMap = Record<string, ModuleBannerOverride>;

export interface PortalBannerConfig {
  pageBannerBg: string | FillConfig;
  pageBannerWaveColor: string | FillConfig;
  pageBannerWaveOpacity: number;
  pageBannerWaveShow: boolean;
  pageBannerHeight: number;
  pageBannerImgWidth: number;
  pageBannerFade: number;
}

export const DEFAULT_PORTAL_BANNER_CONFIG: PortalBannerConfig = {
  pageBannerBg: "/gpgcq-campus-banner.jpg",
  pageBannerWaveColor: "#047857",
  pageBannerWaveOpacity: 100,
  pageBannerWaveShow: true,
  pageBannerHeight: 170,
  pageBannerImgWidth: 100,
  pageBannerFade: 85,
};

export interface PortalBannerModuleMeta {
  path: string;
  label: string;
  subtitle: string;
  group: "Dashboard" | "BS Program" | "Intermediate" | "Admin" | "Faculty" | "CHTE";
}

export const PORTAL_BANNER_MODULES: PortalBannerModuleMeta[] = [
  { path: "/dashboard", label: "Dashboard Overview", subtitle: "Institutional overview, quick metrics & recent announcements.", group: "Dashboard" },

  { path: "/bs/admissions", label: "BS Admissions", subtitle: "BS applicant verification, merit list & admission intake.", group: "BS Program" },
  { path: "/bs/students", label: "BS Students", subtitle: "Enrollments, sections, rolls & student records.", group: "BS Program" },
  { path: "/bs/faculty", label: "BS Faculty", subtitle: "Faculty workload, subject allocation & campus duties.", group: "BS Program" },
  { path: "/bs/courses", label: "BS Courses & Syllabus", subtitle: "Curriculum subjects, credit hours & semester schemes.", group: "BS Program" },
  { path: "/bs/timetable-datesheet", label: "BS Timetable & Datesheet", subtitle: "Class schedules, exam datesheets & room plans.", group: "BS Program" },
  { path: "/bs/attendance", label: "BS Attendance", subtitle: "Daily lecture attendance & shortage tracking.", group: "BS Program" },
  { path: "/bs/exams-results", label: "Examinations & Results", subtitle: "Manage Exam Paper Attendance, Student Marks Entry, Result Compilation, and Promotions.", group: "BS Program" },
  { path: "/bs/marks", label: "BS Marks Entry", subtitle: "Sessional, midterm & terminal marks evaluation.", group: "BS Program" },
  { path: "/bs/gpa-cgpa", label: "BS GPA / CGPA", subtitle: "Semester GPA and cumulative CGPA calculations.", group: "BS Program" },
  { path: "/bs/dmc", label: "BS DMC Generator", subtitle: "Official Detailed Marks Certificates.", group: "BS Program" },
  { path: "/bs/gazette", label: "BS Gazette", subtitle: "Consolidated semester examination gazettes.", group: "BS Program" },
  { path: "/bs/transcript", label: "BS Transcript", subtitle: "Complete degree transcripts & academic history.", group: "BS Program" },
  { path: "/bs/promotions", label: "BS Promotions", subtitle: "Semester progression & batch promotions.", group: "BS Program" },
  { path: "/bs/graduation", label: "BS Graduation", subtitle: "Graduating batches, degree clearance & awards.", group: "BS Program" },
  { path: "/bs/student-actions", label: "BS Student Actions", subtitle: "Freeze, migration NOC, quit & academic branch actions.", group: "BS Program" },
  { path: "/bs/fees", label: "BS Fees & Challans", subtitle: "Generate & verify BS fee vouchers and challans.", group: "BS Program" },

  { path: "/intermediate/admissions", label: "Intermediate Admissions", subtitle: "HSSC Part-I/II intake & merit processing.", group: "Intermediate" },
  { path: "/intermediate/students", label: "Intermediate Students", subtitle: "HSSC student profiles, sections & groups.", group: "Intermediate" },
  { path: "/intermediate/attendance", label: "Intermediate Attendance", subtitle: "Daily intermediate classroom attendance.", group: "Intermediate" },
  { path: "/intermediate/timetable-datesheet", label: "Intermediate Timetable & Datesheet", subtitle: "HSSC timetables & exam schedules.", group: "Intermediate" },

  { path: "/admin/admissions", label: "Admin Admissions", subtitle: "Central college admission oversight & approvals.", group: "Admin" },
  { path: "/admin/students", label: "Admin Students", subtitle: "Master student registry & filters.", group: "Admin" },
  { path: "/admin/faculty", label: "Admin Faculty", subtitle: "Faculty profiles, departments & appointments.", group: "Admin" },
  { path: "/admin/departments-programs", label: "Departments & Programs", subtitle: "Manage academic departments, BS & HSSC programs.", group: "Admin" },
  { path: "/admin/fees", label: "Admin Fee Management", subtitle: "Manage student fee challans and payments.", group: "Admin" },
  { path: "/admin/expenses", label: "Admin Expenses", subtitle: "Institutional expenditure & budget vouchers.", group: "Admin" },
  { path: "/admin/users", label: "User Management", subtitle: "Manage portal accounts & credentials.", group: "Admin" },
  { path: "/admin/permissions", label: "Role Permissions", subtitle: "Configure module-wise access rights.", group: "Admin" },
  { path: "/admin/audit-logs", label: "Audit Logs", subtitle: "Security trail of system & academic updates.", group: "Admin" },
  { path: "/admin/settings", label: "College & Portal Settings", subtitle: "Configure theme colors, banners, waves & campus branding.", group: "Admin" },

  { path: "/faculty/attendance", label: "Faculty Attendance", subtitle: "Mark daily attendance for Intermediate & BS classes.", group: "Faculty" },

  { path: "/chte", label: "CHTE Central Dashboard", subtitle: "Balochistan Higher & Technical Education Department Governance.", group: "CHTE" },
  { path: "/chte/colleges", label: "CHTE Central Colleges", subtitle: "Provision colleges across Balochistan & manage master portals.", group: "CHTE" },
];

export function normalizeModulePath(pathname: string | null | undefined): string {
  if (!pathname) return "";
  const clean = pathname.trim().toLowerCase().replace(/\/+$/, "");
  return clean || "/";
}

export function resolveBannerForPath(
  globalCfg: PortalBannerConfig,
  overrides: ModuleBannerOverridesMap | null | undefined,
  pathname: string | null | undefined
): PortalBannerConfig {
  const key = normalizeModulePath(pathname);
  if (!key || !overrides || typeof overrides !== "object") return globalCfg;
  const ov = overrides[key];
  if (!ov || typeof ov !== "object") return globalCfg;

  return {
    pageBannerBg: ov.pageBannerBg !== undefined ? ov.pageBannerBg : globalCfg.pageBannerBg,
    pageBannerWaveColor:
      ov.pageBannerWaveColor !== undefined ? ov.pageBannerWaveColor : globalCfg.pageBannerWaveColor,
    pageBannerWaveOpacity:
      typeof ov.pageBannerWaveOpacity === "number"
        ? ov.pageBannerWaveOpacity
        : globalCfg.pageBannerWaveOpacity,
    pageBannerWaveShow:
      typeof ov.pageBannerWaveShow === "boolean"
        ? ov.pageBannerWaveShow
        : globalCfg.pageBannerWaveShow,
    pageBannerHeight:
      typeof ov.pageBannerHeight === "number" ? ov.pageBannerHeight : globalCfg.pageBannerHeight,
    pageBannerImgWidth:
      typeof ov.pageBannerImgWidth === "number"
        ? ov.pageBannerImgWidth
        : globalCfg.pageBannerImgWidth,
    pageBannerFade:
      typeof ov.pageBannerFade === "number" ? ov.pageBannerFade : globalCfg.pageBannerFade,
  };
}

export function parseStoredModuleOverrides(raw: string | null): ModuleBannerOverridesMap {
  if (!raw || raw.includes("[object")) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

