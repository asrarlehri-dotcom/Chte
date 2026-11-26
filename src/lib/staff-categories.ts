export type StaffCategory = "TEACHING" | "NON_TEACHING";

export interface StaffPostPreset {
  id: string;
  designation: string;
  category: StaffCategory;
  defaultBps: string;
  bpsOptions: string[];
  defaultOfficeOrSubject: string;
  defaultQualification: string;
}

export const ALL_BPS_SCALES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "B-21", label: "B-21 (BPS-21)" },
  { value: "B-20", label: "B-20 (Professor)" },
  { value: "B-19", label: "B-19 (Associate Professor)" },
  { value: "B-18", label: "B-18 (Assistant Professor / Senior Officer)" },
  { value: "B-17", label: "B-17 (Lecturer / Superintendent / Librarian)" },
  { value: "B-16", label: "B-16 (Assistant / IT Officer)" },
  { value: "B-15", label: "B-15 (BPS-15)" },
  { value: "B-14", label: "B-14 (Senior Clerk / Lab Assistant)" },
  { value: "B-13", label: "B-13 (BPS-13)" },
  { value: "B-12", label: "B-12 (Computer Operator / Technician)" },
  { value: "B-11", label: "B-11 (Junior Clerk)" },
  { value: "B-10", label: "B-10 (BPS-10)" },
  { value: "B-09", label: "B-09 (Lab Assistant / Store Keeper)" },
  { value: "B-08", label: "B-08 (BPS-08)" },
  { value: "B-07", label: "B-07 (Lab Assistant / Driver)" },
  { value: "B-06", label: "B-06 (Driver / Electrician)" },
  { value: "B-05", label: "B-05 (Driver / Lab Attendant)" },
  { value: "B-04", label: "B-04 (Driver / Helper)" },
  { value: "B-03", label: "B-03 (Mali / Naib Qasid / Chowkidar)" },
  { value: "B-02", label: "B-02 (Lab Attendant / Support Staff)" },
  { value: "B-01", label: "B-01 (Mali / Naib Qasid / Chowkidar / Sweeper)" },
  { value: "Visiting", label: "Visiting / Contract / Fixed Pay" },
];

export const TEACHING_POST_PRESETS: ReadonlyArray<StaffPostPreset> = [
  {
    id: "professor",
    designation: "Professor",
    category: "TEACHING",
    defaultBps: "B-20",
    bpsOptions: ["B-20", "B-21"],
    defaultOfficeOrSubject: "Academic Department",
    defaultQualification: "Ph.D.",
  },
  {
    id: "associate-professor",
    designation: "Associate Professor",
    category: "TEACHING",
    defaultBps: "B-19",
    bpsOptions: ["B-19"],
    defaultOfficeOrSubject: "Academic Department",
    defaultQualification: "Ph.D. / M.Phil",
  },
  {
    id: "assistant-professor",
    designation: "Assistant Professor",
    category: "TEACHING",
    defaultBps: "B-18",
    bpsOptions: ["B-18"],
    defaultOfficeOrSubject: "Academic Department",
    defaultQualification: "M.Phil / Ph.D.",
  },
  {
    id: "lecturer",
    designation: "Lecturer",
    category: "TEACHING",
    defaultBps: "B-17",
    bpsOptions: ["B-17"],
    defaultOfficeOrSubject: "Academic Department",
    defaultQualification: "M.A. / M.Sc. / BS (Hons) / M.Phil",
  },
  {
    id: "dpe",
    designation: "Director Physical Education",
    category: "TEACHING",
    defaultBps: "B-17",
    bpsOptions: ["B-17", "B-18", "B-19"],
    defaultOfficeOrSubject: "Physical Education & Sports",
    defaultQualification: "M.Sc. Physical Education",
  },
  {
    id: "visiting",
    designation: "Visiting Faculty",
    category: "TEACHING",
    defaultBps: "Visiting",
    bpsOptions: ["Visiting"],
    defaultOfficeOrSubject: "Academic Department",
    defaultQualification: "M.Phil / MS / BS",
  },
];

export const NON_TEACHING_POST_PRESETS: ReadonlyArray<StaffPostPreset> = [
  {
    id: "superintendent",
    designation: "Superintendent",
    category: "NON_TEACHING",
    defaultBps: "B-17",
    bpsOptions: ["B-17"],
    defaultOfficeOrSubject: "Administration / Establishment",
    defaultQualification: "M.A. / B.A. (Ministerial Cadre)",
  },
  {
    id: "librarian",
    designation: "Librarian",
    category: "NON_TEACHING",
    defaultBps: "B-17",
    bpsOptions: ["B-17", "B-18"],
    defaultOfficeOrSubject: "College Central Library",
    defaultQualification: "M.LIS / BS Library Science",
  },
  {
    id: "assistant",
    designation: "Assistant",
    category: "NON_TEACHING",
    defaultBps: "B-16",
    bpsOptions: ["B-16"],
    defaultOfficeOrSubject: "Administration / Establishment",
    defaultQualification: "B.A. / B.Sc. / Graduate",
  },
  {
    id: "senior-clerk",
    designation: "Senior Clerk",
    category: "NON_TEACHING",
    defaultBps: "B-14",
    bpsOptions: ["B-14"],
    defaultOfficeOrSubject: "Establishment / Clerical Branch",
    defaultQualification: "F.A. / B.A.",
  },
  {
    id: "junior-clerk",
    designation: "Junior Clerk",
    category: "NON_TEACHING",
    defaultBps: "B-11",
    bpsOptions: ["B-11"],
    defaultOfficeOrSubject: "Clerical / General Branch",
    defaultQualification: "F.A. / Matric",
  },
  {
    id: "lab-assistant",
    designation: "Laboratory Assistant",
    category: "NON_TEACHING",
    defaultBps: "B-07",
    bpsOptions: ["B-07", "B-09", "B-14"],
    defaultOfficeOrSubject: "Science Laboratory",
    defaultQualification: "F.Sc. / B.Sc.",
  },
  {
    id: "driver",
    designation: "Driver",
    category: "NON_TEACHING",
    defaultBps: "B-05",
    bpsOptions: ["B-04", "B-05", "B-06", "B-07"],
    defaultOfficeOrSubject: "College Transport",
    defaultQualification: "Matric / LTV-HTV License",
  },
  {
    id: "mali",
    designation: "Mali",
    category: "NON_TEACHING",
    defaultBps: "B-01",
    bpsOptions: ["B-01", "B-02", "B-03"],
    defaultOfficeOrSubject: "Campus Horticulture & Grounds",
    defaultQualification: "Middle / Primary",
  },
  {
    id: "computer-operator",
    designation: "Computer Operator",
    category: "NON_TEACHING",
    defaultBps: "B-16",
    bpsOptions: ["B-12", "B-14", "B-16"],
    defaultOfficeOrSubject: "IT / Examination Cell",
    defaultQualification: "BCS / BS IT / DIT",
  },
  {
    id: "accountant",
    designation: "Accountant / Cashier",
    category: "NON_TEACHING",
    defaultBps: "B-14",
    bpsOptions: ["B-14", "B-16"],
    defaultOfficeOrSubject: "Accounts & Fee Branch",
    defaultQualification: "B.Com / BBA",
  },
  {
    id: "lab-attendant",
    designation: "Laboratory Attendant",
    category: "NON_TEACHING",
    defaultBps: "B-02",
    bpsOptions: ["B-01", "B-02", "B-03", "B-05"],
    defaultOfficeOrSubject: "Science Laboratory",
    defaultQualification: "Matric / Middle",
  },
  {
    id: "naib-qasid",
    designation: "Naib Qasid",
    category: "NON_TEACHING",
    defaultBps: "B-01",
    bpsOptions: ["B-01", "B-02", "B-03"],
    defaultOfficeOrSubject: "General Administration",
    defaultQualification: "Middle / Primary",
  },
  {
    id: "chowkidar",
    designation: "Chowkidar / Security Guard",
    category: "NON_TEACHING",
    defaultBps: "B-01",
    bpsOptions: ["B-01", "B-02", "B-03"],
    defaultOfficeOrSubject: "Campus Security",
    defaultQualification: "Middle / Primary",
  },
  {
    id: "sweeper",
    designation: "Sanitary Worker / Sweeper",
    category: "NON_TEACHING",
    defaultBps: "B-01",
    bpsOptions: ["B-01", "B-02"],
    defaultOfficeOrSubject: "Campus Sanitation",
    defaultQualification: "Literate / Primary",
  },
];

export const NON_TEACHING_OFFICE_SECTIONS: ReadonlyArray<string> = [
  "Administration / Establishment",
  "Accounts & Cash Branch",
  "Clerical / General Branch",
  "College Central Library",
  "Science Laboratory",
  "Physics Laboratory",
  "Chemistry Laboratory",
  "Botany / Zoology Laboratory",
  "IT & Computer Laboratory",
  "Examination & Record Cell",
  "College Transport",
  "Campus Horticulture & Grounds",
  "Campus Security",
  "Campus Sanitation & Maintenance",
];

export const BALOCHISTAN_DIVISIONS: ReadonlyArray<string> = [
  "Quetta",
  "Kalat",
  "Makran",
  "Nasirabad",
  "Sibi",
  "Zhob",
  "Rakhshan",
  "Loralai",
  "Other / Outside Balochistan",
];

export const DISTRICTS_BY_DIVISION: Record<string, string[]> = {
  Quetta: ["Quetta", "Pishin", "Killa Abdullah", "Chaman"],
  Kalat: ["Kalat", "Mastung", "Khuzdar", "Lasbela", "Hub", "Surab", "Awaran"],
  Makran: ["Kech (Turbat)", "Gwadar", "Panjgur"],
  Nasirabad: ["Nasirabad", "Jafarabad", "Sohbatpur", "Jhal Magsi", "Kachhi (Bolan)", "Usta Muhammad"],
  Sibi: ["Sibi", "Ziarat", "Harnai", "Kohlu", "Dera Bugti"],
  Zhob: ["Zhob", "Sherani", "Killa Saifullah"],
  Rakhshan: ["Nushki", "Chagai", "Kharan", "Washuk"],
  Loralai: ["Loralai", "Barkhan", "Duki", "Musakhail"],
};

export const ALL_BALOCHISTAN_DISTRICTS: ReadonlyArray<string> = Array.from(
  new Set(Object.values(DISTRICTS_BY_DIVISION).flat())
).sort();

export function inferStaffCategory(designation?: string | null, explicitCategory?: string | null): StaffCategory {
  if (explicitCategory === "NON_TEACHING" || explicitCategory === "TEACHING") {
    return explicitCategory;
  }
  const d = (designation || "").trim().toLowerCase();
  if (!d) return "TEACHING";
  const matchesNonTeaching = NON_TEACHING_POST_PRESETS.some(
    (p) => p.designation.toLowerCase() === d || d.includes("clerk") || d.includes("superintendent") || d.includes("librarian") || d.includes("driver") || d.includes("mali") || d.includes("naib qasid") || d.includes("chowkidar") || d.includes("sweeper") || d.includes("lab assistant") || d.includes("laboratory") || d.includes("attendant") || d.includes("accountant") || d.includes("cashier") || d.includes("operator") || d === "assistant"
  );
  return matchesNonTeaching ? "NON_TEACHING" : "TEACHING";
}

export function inferBpsFromDesignation(designation?: string | null, explicitBps?: string | null): string {
  if (explicitBps && explicitBps.trim()) return explicitBps.trim();
  const d = (designation || "").trim().toLowerCase();
  if (!d) return "B-17";

  const preset =
    NON_TEACHING_POST_PRESETS.find((p) => p.designation.toLowerCase() === d) ||
    TEACHING_POST_PRESETS.find((p) => p.designation.toLowerCase() === d);
  if (preset) return preset.defaultBps;

  if (d.includes("associate professor")) return "B-19";
  if (d.includes("assistant professor")) return "B-18";
  if (d.includes("professor")) return "B-20";
  if (d.includes("superintendent")) return "B-17";
  if (d.includes("librarian")) return "B-17";
  if (d.includes("senior clerk")) return "B-14";
  if (d.includes("junior clerk")) return "B-11";
  if (d.includes("laboratory assistant") || d.includes("lab assistant")) return "B-07";
  if (d.includes("driver")) return "B-05";
  if (d.includes("mali") || d.includes("naib qasid") || d.includes("chowkidar") || d.includes("sweeper")) return "B-01";
  if (d.includes("assistant")) return "B-16";
  return "B-17";
}

export function getSuggestedDistricts(division?: string | null): string[] {
  if (!division) return [...ALL_BALOCHISTAN_DISTRICTS];
  const clean = division.replace(/\s*Division\s*$/i, "").trim();
  return DISTRICTS_BY_DIVISION[clean] || [...ALL_BALOCHISTAN_DISTRICTS];
}

export function formatOfficialChargePosition(opts: {
  designation: string;
  subjectOrOffice?: string;
  bpsScale?: string;
  staffCategory?: StaffCategory;
}): { rolePhrase: string; signatureSubLine: string } {
  const desig = opts.designation || "Lecturer";
  const subj = (opts.subjectOrOffice || "").trim();
  const bps = opts.bpsScale ? ` (${opts.bpsScale})` : "";
  const isNonTeaching = opts.staffCategory === "NON_TEACHING";

  if (isNonTeaching) {
    const branchPart = subj ? ` (${subj})` : "";
    return {
      rolePhrase: `${desig}${branchPart}${bps}`,
      signatureSubLine: subj ? `${desig} — ${subj}${bps}` : `${desig}${bps}`,
    };
  }

  const subjectPart = subj ? ` of (${subj})` : "";
  return {
    rolePhrase: `${desig}${subjectPart}${bps}`,
    signatureSubLine: subj ? `${desig} in (${subj})${bps}` : `${desig}${bps}`,
  };
}
