/**
 * Shared & Combined Class Recommendation Helpers for BS Timetables
 * Supports:
 * 1. Same teacher teaching one common subject across 4-6 programs (e.g. Functional English)
 * 2. Cross-semester & cross-session combined classes (e.g. Pak Study: 1st Sem 2022-2026 + 2nd Sem 2023-2027)
 * 3. Optional / Elective parallel subject recommendations within the same or across semesters
 */

export const COMBINED_CLASS_PREFIX = "COMBINED:";
export const OPTIONAL_PARALLEL_MARKER = "|OPTIONAL";

export interface CombinedClassMeta {
  isCombined: boolean;
  groupId: string | null;
  isOptionalParallel: boolean;
}

export function buildCombinedClassTag(groupId: string, isOptionalParallel = false): string {
  const cleanId = (groupId || "").trim();
  if (!cleanId) return isOptionalParallel ? OPTIONAL_PARALLEL_MARKER.slice(1) : "";
  return `${COMBINED_CLASS_PREFIX}${cleanId}${isOptionalParallel ? OPTIONAL_PARALLEL_MARKER : ""}`;
}

export function parseCombinedClassTag(classSectionId?: string | null): CombinedClassMeta {
  const raw = (classSectionId || "").trim();
  if (!raw) {
    return { isCombined: false, groupId: null, isOptionalParallel: false };
  }
  const isOptionalParallel = raw.includes("OPTIONAL");
  if (raw.startsWith(COMBINED_CLASS_PREFIX)) {
    const withoutPrefix = raw.slice(COMBINED_CLASS_PREFIX.length);
    const groupId = withoutPrefix.split("|")[0]?.trim() || null;
    return {
      isCombined: Boolean(groupId),
      groupId,
      isOptionalParallel,
    };
  }
  return { isCombined: false, groupId: null, isOptionalParallel };
}

/**
 * Formats course label cleanly without repeating "(CODE)" if the title already contains the code.
 */
export function formatCourseLabel(title?: string | null, code?: string | null): string {
  const t = (title || "").trim();
  const c = (code || "").trim();
  if (!t) return c || "Course";
  if (!c) return t;
  if (t.toLowerCase().includes(c.toLowerCase())) return t;
  return `${t} (${c})`;
}

const COMMON_SUBJECT_ALIASES: Array<{ key: string; displayTitle: string; patterns: RegExp[]; preferredDepts: string[] }> = [
  {
    key: "functional-english",
    displayTitle: "Functional English",
    patterns: [/\bfunctional\s+english\b/i, /\bfun\.?\s+english\b/i, /\benglish[\s-]*(?:i|1)\b/i],
    preferredDepts: ["english"],
  },
  {
    key: "pakistan-studies",
    displayTitle: "Pakistan Studies",
    patterns: [/\bpak(?:istan)?\.?\s*stud(?:y|ies)\b/i, /\bpk[\s-]*101\b/i],
    preferredDepts: ["pakistan", "history", "political", "social"],
  },
  {
    key: "islamic-studies",
    displayTitle: "Islamic Studies / Ethics",
    patterns: [/\bislami(?:c|at)\s*(?:stud(?:y|ies)|education)?\b/i, /\bethics\b/i],
    preferredDepts: ["islamic", "islamiat"],
  },
  {
    key: "ict-computing",
    displayTitle: "Applications of ICT / Computer",
    patterns: [/\bintro(?:duction)?\s+to\s+(?:computer|ict|computing|it)\b/i, /\bict\b/i, /\bcomputer\s+applications\b/i],
    preferredDepts: ["computer", "cs", "it"],
  },
  {
    key: "quantitative-reasoning",
    displayTitle: "Quantitative Reasoning / Mathematics",
    patterns: [/\bquantitative\s+reasoning\b/i, /\bbasic\s+math(?:ematics)?\b/i, /\bgeneral\s+math\b/i],
    preferredDepts: ["math", "statistics"],
  },
];

/**
 * Normalizes a course title into a canonical subject grouping key so shared courses across
 * departments/programs/semesters are accurately paired for combined scheduling recommendations.
 */
export function normalizeSubjectKey(title?: string | null, code?: string | null): string {
  const rawTitle = (title || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const alias of COMMON_SUBJECT_ALIASES) {
    if (alias.patterns.some((p) => p.test(rawTitle) || (code ? p.test(code) : false))) {
      return alias.key;
    }
  }

  return rawTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isOptionalSubjectCourse(course: { title?: string | null; code?: string | null; courseType?: string | null }): boolean {
  const text = `${course.title || ""} ${course.code || ""} ${course.courseType || ""}`.toLowerCase();
  return (
    text.includes("optional") ||
    text.includes("elective") ||
    text.includes("gened") ||
    text.includes("general")
  );
}

export interface SharedCohortCandidate {
  courseId: string;
  courseTitle: string;
  courseCode: string;
  programId: string;
  programName: string;
  session: string;
  semester: number;
  facultyId: string | null;
  facultyName: string | null;
  isOptional: boolean;
}

export interface SharedSubjectRecommendation {
  key: string;
  displayTitle: string;
  category: "MULTI_PROGRAM" | "CROSS_SEMESTER_SESSION" | "OPTIONAL_ELECTIVE";
  badgeLabel: string;
  recommendationNote: string;
  cohorts: SharedCohortCandidate[];
  distinctProgramCount: number;
  distinctSemesterCount: number;
  distinctSessionCount: number;
  hasOptionalCourse: boolean;
  suggestedFacultyId: string | null;
  suggestedFacultyName: string | null;
  alreadyScheduledCount: number;
}

export interface RecommendationProgramInput {
  id: string;
  name?: string | null;
  educationLevel?: string | null;
}

export interface RecommendationCourseInput {
  id: string;
  title?: string | null;
  code?: string | null;
  programId?: string | null;
  semester?: number | null;
  session?: string | null;
  courseType?: string | null;
  facultyId?: string | null;
  program?: { id?: string; name?: string | null; educationLevel?: string | null } | null;
  faculty?: { id?: string; user?: { name?: string | null } | null } | null;
}

export interface RecommendationFacultyInput {
  id: string;
  user?: { name?: string | null } | null;
  department?: { name?: string | null } | null;
}

export interface RecommendationTimetableInput {
  courseId?: string | null;
  facultyId?: string | null;
  course?: { title?: string | null; code?: string | null } | null;
  faculty?: { user?: { name?: string | null } | null } | null;
}

/**
 * Analyzes all BS courses across programs, semesters, and sessions to recommend
 * combined/shared classes where 1 faculty member can teach 4-6 programs together,
 * merge cross-semester/cross-session cohorts (e.g. Sem 1 S-22 + Sem 2 S-23),
 * or coordinate optional/elective subjects in the same semester.
 */
export function buildSharedSubjectRecommendations(params: {
  courses: RecommendationCourseInput[];
  programs: RecommendationProgramInput[];
  faculties: RecommendationFacultyInput[];
  timetables: RecommendationTimetableInput[];
}): SharedSubjectRecommendation[] {
  const { courses, programs, faculties, timetables } = params;
  const programMap = new Map<string, RecommendationProgramInput>();
  for (const p of programs) {
    if (p?.id) programMap.set(p.id, p);
  }

  const bsCourses = (courses || []).filter((c) => {
    const prog = c.program || (c.programId ? programMap.get(c.programId) : undefined);
    return !prog?.educationLevel || prog.educationLevel === "BS";
  });

  const groupMap = new Map<string, { displayTitle: string; cohorts: SharedCohortCandidate[] }>();

  for (const c of bsCourses) {
    if (!c.programId || !c.id) continue;
    const key = normalizeSubjectKey(c.title, c.code);
    if (!key || key.length < 3) continue;

    const prog = c.program || programMap.get(c.programId);
    const aliasMatch = COMMON_SUBJECT_ALIASES.find((a) => a.key === key);
    const cleanTitle =
      aliasMatch?.displayTitle ||
      (c.title || "").replace(/\([^)]*\)/g, "").trim() ||
      c.title ||
      c.code ||
      "Course";

    if (!groupMap.has(key)) {
      groupMap.set(key, { displayTitle: cleanTitle, cohorts: [] });
    }

    const bucket = groupMap.get(key)!;
    const cohortSession = (c.session || "2024-2028").trim();
    const cohortSem = Number(c.semester) || 1;

    // Avoid duplicate cohort entries inside the same group
    const alreadyInGroup = bucket.cohorts.some(
      (item) =>
        item.programId === c.programId &&
        item.semester === cohortSem &&
        item.session === cohortSession
    );
    if (!alreadyInGroup) {
      bucket.cohorts.push({
        courseId: c.id,
        courseTitle: c.title || cleanTitle,
        courseCode: c.code || "",
        programId: c.programId,
        programName: prog?.name || "BS Program",
        session: cohortSession,
        semester: cohortSem,
        facultyId: c.facultyId || null,
        facultyName: c.faculty?.user?.name || null,
        isOptional: isOptionalSubjectCourse(c),
      });
    }
  }

  const recommendations: SharedSubjectRecommendation[] = [];

  for (const [key, { displayTitle, cohorts }] of groupMap.entries()) {
    const distinctPrograms = new Set(cohorts.map((x) => x.programId));
    const distinctSemesters = new Set(cohorts.map((x) => x.semester));
    const distinctSessions = new Set(cohorts.map((x) => x.session));
    const hasOptionalCourse = cohorts.some((x) => x.isOptional);
    const isCommonSubject = COMMON_SUBJECT_ALIASES.some((a) => a.key === key);

    // Recommend when 2+ cohorts exist OR it's a recognized common/optional subject that could span 4-6 programs
    if (cohorts.length < 2 && !(cohorts.length === 1 && (isCommonSubject || hasOptionalCourse))) {
      continue;
    }

    const isCrossSemOrSession = distinctSemesters.size > 1 || distinctSessions.size > 1;
    let category: SharedSubjectRecommendation["category"] = "MULTI_PROGRAM";
    let badgeLabel = `${distinctPrograms.size} Programs Combine Ready`;
    let recommendationNote =
      distinctPrograms.size >= 4
        ? `1 teacher can teach all ${distinctPrograms.size} programs together in one combined timetable slot.`
        : `Combine ${cohorts.length} cohorts (or add up to 4–6 BS programs) under a single teacher slot.`;

    if (isCrossSemOrSession) {
      category = "CROSS_SEMESTER_SESSION";
      badgeLabel = "Cross-Sem / Session Joint Class";
      recommendationNote = `Spans ${distinctSemesters.size} semester(s) across ${distinctSessions.size} session(s) — schedule together as 1 joint class under 1 teacher.`;
    } else if (hasOptionalCourse) {
      category = "OPTIONAL_ELECTIVE";
      badgeLabel = "Optional / Elective Shared";
      recommendationNote = `Optional/Elective subject found across ${distinctPrograms.size} program(s) in Sem ${cohorts[0]?.semester || 1} — combine 4–6 programs under 1 teacher or allow parallel elective slot.`;
    }

    // Resolve best suggested faculty member
    let suggestedFacultyId: string | null = cohorts.find((x) => x.facultyId)?.facultyId || null;
    let suggestedFacultyName: string | null = cohorts.find((x) => x.facultyName)?.facultyName || null;

    const cohortCourseIds = new Set(cohorts.map((x) => x.courseId));
    const matchingTt = (timetables || []).find(
      (t) => (t.courseId && cohortCourseIds.has(t.courseId)) && t.facultyId
    );
    if (!suggestedFacultyId && matchingTt) {
      suggestedFacultyId = matchingTt.facultyId || null;
      suggestedFacultyName = matchingTt.faculty?.user?.name || null;
    }

    if (!suggestedFacultyId) {
      const alias = COMMON_SUBJECT_ALIASES.find((a) => a.key === key);
      if (alias && Array.isArray(faculties)) {
        const deptFac = faculties.find((f) => {
          const dName = (f.department?.name || "").toLowerCase();
          return alias.preferredDepts.some((kw) => dName.includes(kw));
        });
        if (deptFac) {
          suggestedFacultyId = deptFac.id;
          suggestedFacultyName = deptFac.user?.name || null;
        }
      }
    }

    const alreadyScheduledCount = (timetables || []).filter(
      (t) =>
        (t.courseId && cohortCourseIds.has(t.courseId)) ||
        normalizeSubjectKey(t.course?.title, t.course?.code) === key
    ).length;

    recommendations.push({
      key,
      displayTitle,
      category,
      badgeLabel,
      recommendationNote,
      cohorts: [...cohorts].sort((a, b) => a.programName.localeCompare(b.programName) || a.semester - b.semester),
      distinctProgramCount: distinctPrograms.size,
      distinctSemesterCount: distinctSemesters.size,
      distinctSessionCount: distinctSessions.size,
      hasOptionalCourse,
      suggestedFacultyId,
      suggestedFacultyName,
      alreadyScheduledCount,
    });
  }

  return recommendations.sort((a, b) => {
    if (b.cohorts.length !== a.cohorts.length) return b.cohorts.length - a.cohorts.length;
    return a.displayTitle.localeCompare(b.displayTitle);
  });
}
