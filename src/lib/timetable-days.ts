export const TIMETABLE_WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type TimetableWeekday = (typeof TIMETABLE_WEEKDAYS)[number];

export const DAY_ABBREV: Record<TimetableWeekday, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
};

export interface TimetableDayPreset {
  value: string;
  label: string;
  shortHint: string;
  days: readonly TimetableWeekday[];
}

export const TIMETABLE_DAY_PRESETS: readonly TimetableDayPreset[] = [
  {
    value: "First 3 Days (Mon, Tue, Wed)",
    label: "First 3 Days (Mon, Tue, Wed)",
    shortHint: "Mon, Tue, Wed",
    days: ["Monday", "Tuesday", "Wednesday"],
  },
  {
    value: "Last 3 Days (Thu, Fri, Sat)",
    label: "Last 3 Days (Thu, Fri, Sat)",
    shortHint: "Thu, Fri, Sat",
    days: ["Thursday", "Friday", "Saturday"],
  },
  {
    value: "First 2 Days (Mon, Tue)",
    label: "First 2 Days (Mon, Tue)",
    shortHint: "Mon, Tue",
    days: ["Monday", "Tuesday"],
  },
  {
    value: "Last 2 Days (Fri, Sat)",
    label: "Last 2 Days (Fri, Sat)",
    shortHint: "Fri, Sat",
    days: ["Friday", "Saturday"],
  },
] as const;

const TOKEN_TO_WEEKDAY: Record<string, TimetableWeekday> = {
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wednesday",
  wednesday: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
};

/**
 * Expands any single day ("Monday"), preset ("First 3 Days (Mon, Tue, Wed)"),
 * or custom multi-day label ("Mon, Tue, Thu") into ordered full weekday names.
 */
export function expandTimetableDays(daySpec: string): TimetableWeekday[] {
  const raw = (daySpec || "").trim();
  if (!raw) return [];

  const lower = raw.toLowerCase();

  // Extract explicit parenthesized list if present (e.g. "First 3 Days (Mon, Tue, Wed)")
  const parenMatch = /\(([^)]+)\)/.exec(raw);
  const tokenSource = parenMatch ? parenMatch[1] : raw;

  const found = new Set<TimetableWeekday>();
  const tokens = tokenSource
    .split(/[\s,/&+|]+/)
    .map((t) => t.replace(/[^a-z]/gi, "").toLowerCase())
    .filter(Boolean);

  for (const tok of tokens) {
    const mapped = TOKEN_TO_WEEKDAY[tok];
    if (mapped) found.add(mapped);
  }

  if (found.size > 0) {
    return TIMETABLE_WEEKDAYS.filter((d) => found.has(d));
  }

  // Fallback to preset keyword matching when no explicit day tokens appear
  if (lower.startsWith("first 3")) return ["Monday", "Tuesday", "Wednesday"];
  if (lower.startsWith("last 3")) return ["Thursday", "Friday", "Saturday"];
  if (lower.startsWith("first 2")) return ["Monday", "Tuesday"];
  if (lower.startsWith("last 2")) return ["Friday", "Saturday"];

  return [];
}

/**
 * Returns true if two timetable day specifications share at least one weekday.
 */
export function daysOverlap(daySpecA: string, daySpecB: string): boolean {
  const daysA = expandTimetableDays(daySpecA);
  const daysB = expandTimetableDays(daySpecB);

  if (daysA.length === 0 || daysB.length === 0) {
    return (daySpecA || "").trim().toLowerCase() === (daySpecB || "").trim().toLowerCase();
  }

  return daysA.some((d) => daysB.includes(d));
}

/**
 * Checks whether a daySpec matches one of the built-in single weekdays or day-group presets.
 */
export function isSingleOrPresetDay(daySpec: string): boolean {
  const val = (daySpec || "").trim();
  if ((TIMETABLE_WEEKDAYS as readonly string[]).includes(val)) return true;
  return TIMETABLE_DAY_PRESETS.some((p) => p.value === val);
}

/**
 * Formats an array of selected weekdays into a single day name, matching preset,
 * or compact multi-day label such as "Mon, Tue, Thu".
 */
export function formatSelectedDaysValue(selected: TimetableWeekday[]): string {
  const ordered = TIMETABLE_WEEKDAYS.filter((d) => selected.includes(d));
  if (ordered.length === 0) return "Monday";
  if (ordered.length === 1) return ordered[0];

  const matchingPreset = TIMETABLE_DAY_PRESETS.find(
    (p) => p.days.length === ordered.length && p.days.every((d, idx) => d === ordered[idx])
  );
  if (matchingPreset) return matchingPreset.value;

  return ordered.map((d) => DAY_ABBREV[d]).join(", ");
}

/**
 * Normalizes imported CSV/Excel day text into a canonical weekday, preset, or multi-day string.
 */
export function normalizeImportedTimetableDay(rawDay: string): string | null {
  const expanded = expandTimetableDays(rawDay);
  if (expanded.length === 0) return null;
  return formatSelectedDaysValue(expanded);
}
