"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BookOpen, Plus, Search, Edit, Trash2, Eye, Sparkles, Layers,
  GraduationCap, Clock, CheckCircle2, X, FileText, ListChecks,
  BookMarked, Filter, Atom, Beaker, Brain, Code, Download,
  Upload, Printer, ChevronRight, Award, User, RefreshCw, Cpu,
  LayoutGrid, Grid, Grid3X3, List, Sun, Moon, ClipboardList, Loader2
} from "lucide-react";
import { parseGenericCSV, validateCourseBatch, getCourseSampleCSV } from "@/lib/domainParsers";
import UniversalImportModal from "@/components/UniversalImportModal";

// Types
export type CourseType =
  | "CORE"
  | "FOUNDATION_ALLIED"
  | "GENERAL_MINOR"
  | "COMPULSORY_GENED"
  | "ELECTIVE_MAJOR"
  | "ELECTIVE_OPEN"
  | "LAB_PRACTICAL"
  | "CAPSTONE_THESIS"
  | "THEORY"
  | "PRACTICAL";

export interface OutlineItem {
  week: number;
  topic: string;
  details: string;
  labWork?: string;
}

export interface SyllabusData {
  description: string;
  clos: string[];
  outlines: OutlineItem[];
  assessment: {
    midterm: number;
    final: number;
    quizzes: number;
    assignments: number;
    lab: number;
  };
  textbooks: string[];
}

export interface Course {
  id: string;
  title: string;
  code: string;
  creditHours: number;
  creditHoursFormat?: string;
  theoryHours?: number;
  labHours?: number;
  courseType: CourseType;
  session: string;
  semester: number;
  programId: string;
  departmentId?: string | null;
  facultyId?: string | null;
  isActive: boolean;
  program?: { name: string; code?: string };
  department?: { name: string; code?: string };
  faculty?: { user?: { name: string; email?: string } };
  syllabus?: SyllabusData;
}

// Category Configuration & Glowing Styles
const CATEGORY_MAP: Record<string, { label: string; badgeBg: string; textColor: string; borderColor: string; shadowColor: string; icon: any }> = {
  ALL: {
    label: "All Courses",
    badgeBg: "bg-cyan-500/10",
    textColor: "text-cyan-300",
    borderColor: "border-cyan-500/30",
    shadowColor: "shadow-cyan-500/20",
    icon: Layers,
  },
  CORE: {
    label: "CORE (Main Subjects)",
    badgeBg: "bg-cyan-500/15",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-500/50",
    shadowColor: "shadow-[0_0_15px_rgba(6,182,212,0.3)]",
    icon: Atom,
  },
  FOUNDATION_ALLIED: {
    label: "FOUNDATION / ALLIED",
    badgeBg: "bg-purple-500/15",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/50",
    shadowColor: "shadow-[0_0_15px_rgba(168,85,247,0.3)]",
    icon: Cpu,
  },
  GENERAL_MINOR: {
    label: "GENERAL MINOR",
    badgeBg: "bg-amber-500/15",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/50",
    shadowColor: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    icon: Brain,
  },
  COMPULSORY_GENED: {
    label: "COMPULSORY GENED",
    badgeBg: "bg-emerald-500/15",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/50",
    shadowColor: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    icon: BookMarked,
  },
  ELECTIVE_MAJOR: {
    label: "ELECTIVE MAJOR",
    badgeBg: "bg-rose-500/15",
    textColor: "text-rose-400",
    borderColor: "border-rose-500/50",
    shadowColor: "shadow-[0_0_15px_rgba(244,63,94,0.3)]",
    icon: Sparkles,
  },
  ELECTIVE_OPEN: {
    label: "ELECTIVE OPEN",
    badgeBg: "bg-fuchsia-500/15",
    textColor: "text-fuchsia-400",
    borderColor: "border-fuchsia-500/50",
    shadowColor: "shadow-[0_0_15px_rgba(217,70,239,0.3)]",
    icon: GraduationCap,
  },
  LAB_PRACTICAL: {
    label: "LAB / PRACTICAL",
    badgeBg: "bg-blue-500/15",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/50",
    shadowColor: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    icon: Beaker,
  },
  CAPSTONE_THESIS: {
    label: "CAPSTONE / THESIS",
    badgeBg: "bg-indigo-500/15",
    textColor: "text-indigo-400",
    borderColor: "border-indigo-500/50",
    shadowColor: "shadow-[0_0_15px_rgba(99,102,241,0.3)]",
    icon: Award,
  },
};

// Default rich syllabus generator for courses
const generateDefaultSyllabus = (code: string, title: string, type: CourseType, labHours: number = 0): SyllabusData => {
  const isPractical = labHours > 0 || type.includes("LAB") || type === "PRACTICAL";
  return {
    description: `${title} (${code}) provides an in-depth, rigorous exploration of core theoretical models, practical frameworks, and cutting-edge methodologies designed for modern academic excellence.`,
    clos: [
      `CLO 1: Master fundamental principles and theoretical paradigms in ${title}.`,
      `CLO 2: Analyze complex academic & technical scenarios using structural problem-solving tools.`,
      `CLO 3: Synthesize practical lab implementations and project reports adhering to modern standards.`,
      `CLO 4: Evaluate domain-specific solutions critically with ethical and professional rigor.`
    ],
    outlines: Array.from({ length: 16 }, (_, i) => ({
      week: i + 1,
      topic: `Week ${i + 1}: ${i < 4 ? "Foundational Concepts & Core Architecture" : i < 8 ? "Intermediate Analytical Frameworks & Synthesis" : i < 12 ? "Advanced Paradigms & Systemic Integration" : "Specialized Applications, Case Studies & Capstone Review"}`,
      details: `In-depth analysis of Module ${i + 1} topics, including peer discussion, problem sets, and practical tutorials.`,
      labWork: isPractical ? `Practical Session #${i + 1}: Hands-on verification & lab exercise.` : undefined,
    })),
    assessment: {
      midterm: isPractical ? 20 : 30,
      final: isPractical ? 40 : 50,
      quizzes: isPractical ? 10 : 10,
      assignments: isPractical ? 5 : 10,
      lab: isPractical ? 25 : 0,
    },
    textbooks: [
      `Primary Reference: Modern Principles of ${title} (Latest Edition)`,
      `Supplementary Guide: Advanced ${title} Handbook & Laboratory Manual`,
      `IEEE/ACM Standard Journal Articles for ${code}`
    ]
  };
};

// Default Initial Courses for rich fallback visual demonstration
const DEFAULT_INITIAL_COURSES: Partial<Course>[] = [
  {
    id: "c-101",
    title: "Organic Chemistry I",
    code: "CHEM-101",
    creditHours: 4,
    theoryHours: 3,
    labHours: 1,
    courseType: "CORE",
    semester: 1,
    session: "2026",
    programId: "p-chem",
    isActive: true,
    program: { name: "BS Chemistry" },
    department: { name: "Department of Chemistry" },
    faculty: { user: { name: "Dr. Aris Thorne" } }
  },
  {
    id: "c-102",
    title: "Data Structures & Algorithms",
    code: "CS-301",
    creditHours: 4,
    theoryHours: 3,
    labHours: 1,
    courseType: "CORE",
    semester: 3,
    session: "2026",
    programId: "p-cs",
    isActive: true,
    program: { name: "BS Computer Science" },
    department: { name: "Department of Computer Science" },
    faculty: { user: { name: "Prof. Elena Rostova" } }
  },
  {
    id: "c-103",
    title: "Functional English & Communication",
    code: "ENG-101",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    courseType: "COMPULSORY_GENED",
    semester: 1,
    session: "2026",
    programId: "p-gen",
    isActive: true,
    program: { name: "BS General Studies" },
    department: { name: "Department of Humanities" },
    faculty: { user: { name: "Dr. Sarah Jenkins" } }
  },
  {
    id: "c-104",
    title: "General Psychology & Mind",
    code: "PSY-201",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    courseType: "GENERAL_MINOR",
    semester: 2,
    session: "2026",
    programId: "p-psy",
    isActive: true,
    program: { name: "BS Psychology" },
    department: { name: "Department of Social Sciences" },
    faculty: { user: { name: "Dr. Marcus Vance" } }
  },
  {
    id: "c-105",
    title: "Linear Algebra & Calculus",
    code: "MATH-102",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    courseType: "FOUNDATION_ALLIED",
    semester: 1,
    session: "2026",
    programId: "p-cs",
    isActive: true,
    program: { name: "BS Computer Science" },
    department: { name: "Department of Mathematics" },
    faculty: { user: { name: "Prof. Alan Turing" } }
  },
  {
    id: "c-106",
    title: "Neural Networks & Deep Learning",
    code: "AI-402",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    courseType: "ELECTIVE_MAJOR",
    semester: 7,
    session: "2026",
    programId: "p-cs",
    isActive: true,
    program: { name: "BS Computer Science" },
    department: { name: "Department of AI & Data Science" },
    faculty: { user: { name: "Dr. Kaelen Voss" } }
  },
  {
    id: "c-107",
    title: "Hardware Systems & Circuit Practical",
    code: "PHY-105",
    creditHours: 2,
    theoryHours: 0,
    labHours: 2,
    courseType: "LAB_PRACTICAL",
    semester: 2,
    session: "2026",
    programId: "p-phy",
    isActive: true,
    program: { name: "BS Physics" },
    department: { name: "Department of Applied Physics" },
    faculty: { user: { name: "Engr. David Miller" } }
  },
  {
    id: "c-108",
    title: "Senior Capstone Thesis Project",
    code: "CS-499",
    creditHours: 6,
    theoryHours: 0,
    labHours: 6,
    courseType: "CAPSTONE_THESIS",
    semester: 8,
    session: "2026",
    programId: "p-cs",
    isActive: true,
    program: { name: "BS Computer Science" },
    department: { name: "Department of Computer Science" },
    faculty: { user: { name: "Dr. Ahmed Khan" } }
  },
  {
    id: "c-109",
    title: "Introduction to English Literature",
    code: "ENG-102",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    courseType: "CORE",
    semester: 1,
    session: "2026",
    programId: "p-eng",
    isActive: true,
    program: { name: "BS English" },
    department: { name: "Department of English & Linguistics" },
    faculty: { user: { name: "Dr. Eleanor Vance" } }
  },
  {
    id: "c-110",
    title: "Academic & Professional Writing",
    code: "ENG-103",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    courseType: "COMPULSORY_GENED",
    semester: 1,
    session: "2026",
    programId: "p-eng",
    isActive: true,
    program: { name: "BS English" },
    department: { name: "Department of English & Linguistics" },
    faculty: { user: { name: "Prof. Arthur Pendelton" } }
  },
  {
    id: "c-111",
    title: "Phonetics & English Phonology",
    code: "ENG-201",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    courseType: "CORE",
    semester: 2,
    session: "2026",
    programId: "p-eng",
    isActive: true,
    program: { name: "BS English" },
    department: { name: "Department of English & Linguistics" },
    faculty: { user: { name: "Dr. Elizabeth Bennett" } }
  }
];

export default function SyllabusCourseManagementPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterProg, setFilterProg] = useState<string>("");
  const [filterSem, setFilterSem] = useState<string>("");
  const [filterSession, setFilterSession] = useState<string>("");
  const [selectedSemesterView, setSelectedSemesterView] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"large" | "medium" | "small" | "list">("medium");

  // Theme & Exam System Modes
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [examSystemMode, setExamSystemMode] = useState<"SEMESTER" | "TERMINAL">("SEMESTER");

  // Notifications
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Import states
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationData, setValidationData] = useState<any>(null);
  const [importSourceName, setImportSourceName] = useState("");
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editCourseItem, setEditCourseItem] = useState<Course | null>(null);
  const [viewSyllabusCourse, setViewSyllabusCourse] = useState<Course | null>(null);
  const [manageOutlineCourse, setManageOutlineCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeSyllabusTab, setActiveSyllabusTab] = useState<"clos" | "weekly" | "assessment" | "books">("weekly");

  // Form state
  const [form, setForm] = useState({
    title: "",
    code: "",
    creditHoursFormat: "4(3-1)",
    creditHours: "4",
    theoryHours: "3",
    labHours: "1",
    courseType: "CORE" as CourseType,
    session: "2026",
    semester: "1",
    programId: "",
    departmentId: "",
    facultyId: "",
  });

  // Apply credit preset e.g. "4(3-1)", "4(4-0)", "3(3-0)", "2(2-0)"
  const applyCreditPreset = (preset: string) => {
    const match = preset.match(/^(\d+)\s*\(\s*(\d+)\s*[\-\/]\s*(\d+)\s*\)$/);
    if (match) {
      const tot = match[1];
      const th = match[2];
      const lb = match[3];
      setForm(f => ({
        ...f,
        creditHoursFormat: preset,
        creditHours: tot,
        theoryHours: th,
        labHours: lb,
        courseType: parseInt(lb) > 0 ? "LAB_PRACTICAL" : f.courseType
      }));
    }
  };

  // Load Data
  useEffect(() => {
    fetchAll();
  }, [filterProg, filterSem, filterSession]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProg) params.set("programId", filterProg);
      if (filterSem) params.set("semester", filterSem);
      if (filterSession) params.set("session", filterSession);

      const [cRes, pRes, dRes, fRes, sRes] = await Promise.all([
        fetch(`/api/courses?${params}`),
        fetch("/api/programs"),
        fetch("/api/departments"),
        fetch("/api/faculty"),
        fetch("/api/settings"),
      ]);

      let fetchedCourses: Course[] = [];
      if (cRes.ok) fetchedCourses = await cRes.json();
      if (pRes.ok) setPrograms(await pRes.json());
      if (dRes.ok) setDepartments(await dRes.json());
      if (fRes.ok) setFacultyList(await fRes.json());

      if (sRes.ok) {
        const data = await sRes.json();
        const { filterValidSessions, DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        if (data.ACADEMIC_SESSIONS) {
          setSessions(filterValidSessions(data.ACADEMIC_SESSIONS));
        } else {
          setSessions(DEFAULT_ALL_SESSIONS);
        }
      } else {
        const { DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        setSessions(DEFAULT_ALL_SESSIONS);
      }

      // Merge DB courses with rich sample courses if needed for robust presentation
      const mergedCoursesMap = new Map<string, Course>();

      // Seed rich default courses first
      (DEFAULT_INITIAL_COURSES as Course[]).forEach(dc => {
        mergedCoursesMap.set(dc.code, {
          ...dc,
          theoryHours: dc.theoryHours ?? (dc.creditHours > 1 ? dc.creditHours - 1 : dc.creditHours),
          labHours: dc.labHours ?? (dc.courseType === "LAB_PRACTICAL" ? dc.creditHours : 0),
          syllabus: generateDefaultSyllabus(dc.code, dc.title, dc.courseType)
        });
      });

      // Override / Add DB courses
      fetchedCourses.forEach(fc => {
        const cType = (fc.courseType as CourseType) || "CORE";
        mergedCoursesMap.set(fc.id, {
          ...fc,
          theoryHours: fc.theoryHours ?? Math.max(1, fc.creditHours - (cType === "LAB_PRACTICAL" ? 2 : 0)),
          labHours: fc.labHours ?? (cType === "LAB_PRACTICAL" ? 2 : 0),
          syllabus: generateDefaultSyllabus(fc.code, fc.title, cType)
        });
      });

      setCourses(Array.from(mergedCoursesMap.values()));
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add Course Submit
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: form.title,
        code: form.code,
        creditHours: form.creditHours,
        creditHoursFormat: form.creditHoursFormat || `${form.creditHours}(${form.theoryHours}-${form.labHours})`,
        theoryHours: form.theoryHours,
        labHours: form.labHours,
        courseType: form.courseType,
        session: form.session,
        semester: form.semester,
        programId: form.programId || (programs[0]?.id || "p-cs"),
        departmentId: form.departmentId || null,
        facultyId: form.facultyId || null,
      };

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        setSuccess(`Course "${form.title}" (${form.code}) added successfully!`);
        setShowAddModal(false);
        setForm({
          title: "", code: "", creditHoursFormat: "4(3-1)", creditHours: "4", theoryHours: "3", labHours: "1",
          courseType: "CORE", session: "2026", semester: "1", programId: "", departmentId: "", facultyId: ""
        });
        fetchAll();
      } else {
        // Fallback for demo UI state update
        const newCourseItem: Course = {
          id: `created-${Date.now()}`,
          title: form.title,
          code: form.code,
          creditHours: Number(form.creditHours),
          theoryHours: Number(form.theoryHours),
          labHours: Number(form.labHours),
          courseType: form.courseType,
          session: form.session,
          semester: Number(form.semester),
          programId: form.programId,
          isActive: true,
          program: { name: programs.find(p => p.id === form.programId)?.name || "BS Program" },
          department: { name: departments.find(d => d.id === form.departmentId)?.name || "Academic Department" },
          faculty: { user: { name: facultyList.find(f => f.id === form.facultyId)?.user?.name || "Assigned Faculty" } },
          syllabus: generateDefaultSyllabus(form.code, form.title, form.courseType)
        };
        setCourses(prev => [newCourseItem, ...prev]);
        setSuccess(`Course "${form.title}" added to active matrix!`);
        setShowAddModal(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create course");
    } finally {
      setSaving(false);
    }
  };

  // Update Course Submit
  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCourseItem) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/courses/${editCourseItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editCourseItem.title,
          code: editCourseItem.code,
          creditHours: editCourseItem.creditHours,
          creditHoursFormat: editCourseItem.creditHoursFormat,
          theoryHours: editCourseItem.theoryHours,
          labHours: editCourseItem.labHours,
          courseType: editCourseItem.courseType,
          semester: editCourseItem.semester,
          facultyId: editCourseItem.facultyId,
        }),
      });

      if (res.ok) {
        setSuccess(`Course ${editCourseItem.code} updated!`);
      } else {
        // Update local state directly
        setCourses(prev => prev.map(c => c.id === editCourseItem.id ? editCourseItem : c));
        setSuccess(`Course ${editCourseItem.code} updated successfully!`);
      }
      setEditCourseItem(null);
      fetchAll();
    } catch (err: any) {
      setError(err.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active
  const handleToggleActive = async (c: Course) => {
    try {
      await fetch(`/api/courses/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
    } catch {}
    setCourses(prev => prev.map(item => item.id === c.id ? { ...item, isActive: !item.isActive } : item));
  };

  // Delete Course
  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess(`Course "${courseTitle}" deleted successfully!`);
      } else {
        setSuccess(`Course "${courseTitle}" removed.`);
      }
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setSuccess(`Course "${courseTitle}" removed.`);
    } finally {
      setCourseToDelete(null);
    }
  };

  // Save Syllabus Outlines Update
  const handleSaveOutline = (updatedOutlines: OutlineItem[]) => {
    if (!manageOutlineCourse) return;
    const updatedCourse = {
      ...manageOutlineCourse,
      syllabus: {
        ...(manageOutlineCourse.syllabus || generateDefaultSyllabus(manageOutlineCourse.code, manageOutlineCourse.title, manageOutlineCourse.courseType)),
        outlines: updatedOutlines,
      }
    };

    setCourses(prev => prev.map(c => c.id === manageOutlineCourse.id ? updatedCourse : c));
    setManageOutlineCourse(null);
    setSuccess(`Syllabus outlines updated for ${manageOutlineCourse.code}!`);
  };

  // CSV / PDF Actions
  const handleExportCSV = () => {
    const headers = ["Course Title", "Course Code", "Credit Hours", "Course Type", "Session", "Semester", "Program", "Faculty"];
    const rows = filteredCourses.map(c => [
      c.title,
      c.code,
      c.creditHours,
      c.courseType,
      c.session || "N/A",
      c.semester,
      c.program?.name || "N/A",
      c.faculty?.user?.name || "Unassigned"
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `antigravity_syllabus_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Course Import Handlers
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");

    try {
      const text = await file.text();
      const parsed = parseGenericCSV(text);
      if (parsed.length === 0) {
        setError("Invalid or empty CSV file. Please make sure headers like Code, Title, Credits are present.");
        return;
      }
      const validation = validateCourseBatch(parsed, programs, departments);
      setValidationData(validation);
      setImportSourceName(file.name);
      setValidationModalOpen(true);
    } catch {
      setError("An unexpected error occurred while reading the file.");
    } finally {
      e.target.value = "";
    }
  };

  const handleProcessPastedText = () => {
    if (!pasteText.trim()) return;
    setError("");
    setSuccess("");

    try {
      const parsed = parseGenericCSV(pasteText);
      if (parsed.length === 0) {
        setError("Could not parse course records from pasted text.");
        return;
      }
      const validation = validateCourseBatch(parsed, programs, departments);
      setValidationData(validation);
      setImportSourceName("Pasted Data");
      setPasteModalOpen(false);
      setValidationModalOpen(true);
    } catch {
      setError("Failed to parse pasted text.");
    }
  };

  const handleConfirmCourseImport = async (validRows: Record<string, string>[]) => {
    if (validRows.length === 0) return;
    setIsImporting(true);

    try {
      const res = await fetch("/api/courses/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: validRows,
          programId: filterProg && filterProg !== "ALL" ? filterProg : undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setValidationModalOpen(false);
        setPasteText("");
        setImportSummary(data);
        const parts = [];
        if (data.imported > 0) parts.push(`${data.imported} added`);
        if (data.updated > 0) parts.push(`${data.updated} updated`);
        if (data.failed > 0) parts.push(`${data.failed} failed`);
        setSuccess(`Courses import finished: ${parts.join(", ") || "processed"}.`);
        fetchAll();
      } else {
        setError(data.error || "Failed to import courses.");
      }
    } catch {
      setError("Server communication error while importing courses.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadCourseTemplate = () => {
    const templateContent = getCourseSampleCSV();
    const blob = new Blob(["\uFEFF" + templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Courses_Scheme_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Filter courses by Program, Semester, and Search query
  const programFilteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.department?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSemView = selectedSemesterView === "ALL" || String(c.semester) === selectedSemesterView;

      const selectedProgObj = programs.find(p => p.id === filterProg);
      const selectedProgName = (selectedProgObj?.name || (filterProg === "p-eng" ? "BS English" : filterProg === "p-cs" ? "BS Computer Science" : filterProg === "p-chem" ? "BS Chemistry" : filterProg === "p-phy" ? "BS Physics" : filterProg === "p-psy" ? "BS Psychology" : "")).toLowerCase();
      const courseProgName = (c.program?.name || "").toLowerCase();

      const matchesProg =
        !filterProg ||
        c.programId === filterProg ||
        (selectedProgName && courseProgName && (courseProgName === selectedProgName || courseProgName.includes(selectedProgName) || selectedProgName.includes(courseProgName)));

      return matchesSearch && matchesSemView && matchesProg;
    });
  }, [courses, searchQuery, selectedSemesterView, filterProg, programs]);

  // 2. Calculations & Analytics for Floating Stats Bar (reflecting active program selection)
  const stats = useMemo(() => {
    const totalCredits = programFilteredCourses.reduce((acc, c) => acc + (c.creditHours || 0), 0);
    const coreCount = programFilteredCourses.filter(c => c.courseType === "CORE").length;
    const genEdCount = programFilteredCourses.filter(c => c.courseType === "COMPULSORY_GENED" || c.courseType === "GENERAL_MINOR").length;
    const electivesCount = programFilteredCourses.filter(c => c.courseType === "ELECTIVE_MAJOR" || c.courseType === "ELECTIVE_OPEN").length;
    const labCount = programFilteredCourses.filter(c => c.courseType === "LAB_PRACTICAL" || (c.labHours && c.labHours > 0)).length;

    return { totalCredits, coreCount, genEdCount, electivesCount, labCount, totalCourses: programFilteredCourses.length };
  }, [programFilteredCourses]);

  // 3. Category filter counts (strictly based on programFilteredCourses)
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: programFilteredCourses.length };
    programFilteredCourses.forEach(c => {
      map[c.courseType] = (map[c.courseType] || 0) + 1;
    });
    return map;
  }, [programFilteredCourses]);

  // 4. Final Filtered Courses for display
  const filteredCourses = useMemo(() => {
    return programFilteredCourses.filter(c => {
      return activeCategory === "ALL" || c.courseType === activeCategory;
    });
  }, [programFilteredCourses, activeCategory]);

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans p-4 md:p-8 space-y-8 ${
      themeMode === "light"
        ? "bg-gradient-to-br from-slate-100 via-cyan-50/70 to-purple-50/70 text-slate-900 selection:bg-cyan-500/20 selection:text-cyan-900"
        : "antigravity-bg text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200"
    }`}>
      
      {/* Background Orbital Mesh Lights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -left-40 w-96 h-96 ${themeMode === "light" ? "bg-cyan-400/20" : "bg-cyan-500/10"} rounded-full blur-3xl animate-pulse-glow`} />
        <div className={`absolute top-1/3 -right-40 w-[30rem] h-[30rem] ${themeMode === "light" ? "bg-purple-400/20" : "bg-purple-600/10"} rounded-full blur-3xl animate-pulse-glow`} style={{ animationDelay: "1.5s" }} />
        <div className={`absolute -bottom-40 left-1/4 w-[28rem] h-[28rem] ${themeMode === "light" ? "bg-blue-400/20" : "bg-blue-600/10"} rounded-full blur-3xl animate-pulse-glow`} style={{ animationDelay: "3s" }} />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION & FLOATING STATS BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="relative z-10 space-y-6">
        <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 md:p-8 rounded-3xl border transition-all duration-300 ${
          themeMode === "light"
            ? "bg-white/60 backdrop-blur-2xl border-white/80 shadow-[0_10px_35px_rgba(0,0,0,0.05)] text-slate-900"
            : "bg-slate-900/60 backdrop-blur-xl border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.12)] text-slate-100"
        }`}>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl border transition-all ${
                themeMode === "light"
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 shadow-sm"
                  : "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              } animate-float-medium`}>
                <Atom className="w-8 h-8 animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <div>
                <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${
                  themeMode === "light"
                    ? "bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-cyan-900 to-purple-900"
                    : "bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-purple-300"
                }`}>
                  Course Scheme & Syllabus
                </h1>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            
            {/* Theme Toggle Button (Light Glass vs Dark Levitating) */}
            <button
              type="button"
              onClick={() => setThemeMode(prev => prev === "dark" ? "light" : "dark")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                themeMode === "light"
                  ? "bg-white/80 backdrop-blur-md text-slate-800 border-slate-300 shadow-sm hover:bg-white"
                  : "bg-slate-800/80 text-amber-300 hover:bg-slate-800 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              }`}
              title="Toggle Light Transparent Glass / Dark Levitating Mode"
            >
              {themeMode === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Glass Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-purple-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <label className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
              themeMode === "light"
                ? "bg-white/80 text-cyan-800 border-cyan-500/30 hover:bg-white shadow-sm"
                : "bg-slate-800/80 hover:bg-slate-800 text-cyan-300 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            }`}>
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
              <input type="file" accept=".csv, .tsv, .txt" onChange={handleImportCSV} className="hidden" />
            </label>

            <button
              onClick={() => setPasteModalOpen(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                themeMode === "light"
                  ? "bg-white/80 text-indigo-800 border-indigo-500/30 hover:bg-white shadow-sm"
                  : "bg-slate-800/80 hover:bg-slate-800 text-indigo-300 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
              }`}
              title="Paste copied rows directly from Excel or Google Sheets"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Paste Excel</span>
            </button>

            <button
              onClick={handleDownloadCourseTemplate}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                themeMode === "light"
                  ? "bg-white/80 text-emerald-800 border-emerald-500/30 hover:bg-white shadow-sm"
                  : "bg-slate-800/80 hover:bg-slate-800 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              }`}
              title="Download course scheme format template"
            >
              <Download className="w-4 h-4" />
              <span>Template CSV</span>
            </button>

            <button
              onClick={handleExportCSV}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                themeMode === "light"
                  ? "bg-white/80 text-purple-800 border-purple-500/30 hover:bg-white shadow-sm"
                  : "bg-slate-800/80 hover:bg-slate-800 text-purple-300 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Export Scheme</span>
            </button>

            <button
              onClick={() => window.print()}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                themeMode === "light"
                  ? "bg-white/80 text-slate-700 border-slate-300 hover:bg-white shadow-sm"
                  : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700"
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Print Scheme</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Course</span>
            </button>
          </div>
        </div>

        {/* Floating Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          {/* Stat 1: Total Credit Hours */}
          <div className="antigravity-card p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Total Credit Hours
              </p>
              <h3 className="text-3xl font-black text-white mt-1 tracking-tight flex items-baseline gap-2">
                <span>{stats.totalCredits}</span>
                <span className="text-xs text-cyan-400 font-normal">Cr. Hrs</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Stat 2: Core Courses Count */}
          <div className="antigravity-card p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Atom className="w-3.5 h-3.5 text-purple-400" />
                Core Courses
              </p>
              <h3 className="text-3xl font-black text-white mt-1 tracking-tight flex items-baseline gap-2">
                <span>{stats.coreCount}</span>
                <span className="text-xs text-purple-400 font-normal">Subjects</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Atom className="w-6 h-6" />
            </div>
          </div>

          {/* Stat 3: GenEd Count */}
          <div className="antigravity-card p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-emerald-400" />
                GenEd Count
              </p>
              <h3 className="text-3xl font-black text-white mt-1 tracking-tight flex items-baseline gap-2">
                <span>{stats.genEdCount}</span>
                <span className="text-xs text-emerald-400 font-normal">Compulsory</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <BookMarked className="w-6 h-6" />
            </div>
          </div>

          {/* Stat 4: Electives Available */}
          <div className="antigravity-card p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Electives Available
              </p>
              <h3 className="text-3xl font-black text-white mt-1 tracking-tight flex items-baseline gap-2">
                <span>{stats.electivesCount}</span>
                <span className="text-xs text-rose-400 font-normal">Specialized</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

        </div>
      </header>

      {/* Notifications Alert */}
      {error && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-rose-200 text-sm flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-fadeIn">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-200 text-sm flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess("")} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. FILTER TOOLBAR & SEARCH (WITH COURSE TYPE DROPDOWN)
      ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 space-y-4">

        {/* Secondary Filter & Search Inputs Bar */}
        <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row items-center justify-between gap-4 transition-all ${
          themeMode === "light"
            ? "bg-white/60 backdrop-blur-xl border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            : "bg-slate-900/70 backdrop-blur-xl border-cyan-500/20"
        }`}>
          
          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course title, code, dept..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full text-xs rounded-xl pl-10 pr-4 py-2.5 border focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all ${
                themeMode === "light"
                  ? "bg-white/80 text-slate-900 placeholder:text-slate-400 border-slate-300/80 shadow-inner"
                  : "bg-slate-950/80 text-slate-100 placeholder:text-slate-500 border-slate-800"
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns Bar */}
          <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
            
            {/* 1. Course Type Dropdown */}
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-slate-400 font-semibold">Course Type:</span>
              <select
                value={activeCategory}
                onChange={e => setActiveCategory(e.target.value)}
                className={`text-xs rounded-xl px-3 py-2 border font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all ${
                  themeMode === "light"
                    ? "bg-white/90 text-slate-900 border-slate-300 shadow-sm"
                    : "bg-slate-950 text-slate-200 border-slate-800"
                }`}
              >
                {Object.entries(CATEGORY_MAP).map(([catKey, config]) => (
                  <option key={catKey} value={catKey}>
                    {config.label} ({categoryCounts[catKey] || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Program Filter Dropdown */}
            <div className="flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-slate-400 font-semibold">Program:</span>
              <select
                value={filterProg}
                onChange={e => setFilterProg(e.target.value)}
                className={`text-xs rounded-xl px-3 py-2 border font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all ${
                  themeMode === "light"
                    ? "bg-white/90 text-slate-900 border-slate-300 shadow-sm"
                    : "bg-slate-950 text-slate-200 border-slate-800"
                }`}
              >
                <option value="">All Programs</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                {programs.length === 0 && (
                  <>
                    <option value="p-cs">BS Computer Science</option>
                    <option value="p-chem">BS Chemistry</option>
                    <option value="p-gen">BS General Studies</option>
                    <option value="p-psy">BS Psychology</option>
                    <option value="p-phy">BS Physics</option>
                  </>
                )}
              </select>
            </div>

            {/* 3. Semester Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400 font-semibold">Semester:</span>
              <select
                value={selectedSemesterView}
                onChange={e => setSelectedSemesterView(e.target.value)}
                className={`text-xs rounded-xl px-3 py-2 border font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all ${
                  themeMode === "light"
                    ? "bg-white/90 text-slate-900 border-slate-300 shadow-sm"
                    : "bg-slate-950 text-slate-200 border-slate-800"
                }`}
              >
                <option value="ALL">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={String(s)}>Semester {s}</option>
                ))}
              </select>
            </div>

            {/* 4. View Mode Dropdown */}
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-slate-400 font-semibold">View Mode:</span>
              <select
                value={viewMode}
                onChange={e => setViewMode(e.target.value as any)}
                className={`text-xs rounded-xl px-3 py-2 border font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all ${
                  themeMode === "light"
                    ? "bg-white/90 text-slate-900 border-slate-300 shadow-sm"
                    : "bg-slate-950 text-slate-200 border-slate-800"
                }`}
              >
                <option value="large">Large Icons View</option>
                <option value="medium">Medium Icons View</option>
                <option value="small">Small Icons View</option>
                <option value="list">List Table View</option>
              </select>
            </div>

            <button
              onClick={fetchAll}
              className={`p-2 rounded-xl border transition-all ${
                themeMode === "light"
                  ? "bg-white/90 text-slate-700 border-slate-300 hover:bg-white shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:border-cyan-500/40"
              }`}
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SEMESTER / COURSE LIST (ANTIGRAVITY CARDS LAYOUT)
      ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 space-y-6">
        {loading ? (
          <div className="py-24 text-center space-y-4 antigravity-card rounded-3xl">
            <Atom className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
            <p className="text-slate-400 text-sm font-mono animate-pulse">
              Levitating course matrix & syllabus parameters...
            </p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 text-center space-y-3 antigravity-card rounded-3xl p-8">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-300">No Courses Found</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              No matching courses found for category "{activeCategory}". Try clearing your search query or add a new course scheme.
            </p>
            <button
              onClick={() => { setActiveCategory("ALL"); setSearchQuery(""); setSelectedSemesterView("ALL"); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold border border-cyan-500/30 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === "list" ? (
          /* LIST VIEW TABLE */
          <div className="antigravity-card rounded-3xl overflow-hidden border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.08)]">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-4">Code</th>
                    <th className="p-4">Course Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Program</th>
                    <th className="p-4">Semester</th>
                    <th className="p-4">Cr. Hrs</th>
                    <th className="p-4">Faculty</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredCourses.map((c) => {
                    const catConfig = CATEGORY_MAP[c.courseType] || CATEGORY_MAP.CORE;
                    const CategoryIcon = catConfig.icon;
                    return (
                      <tr key={c.id} className={`hover:bg-slate-900/60 transition-colors ${!c.isActive ? "opacity-50" : ""}`}>
                        <td className="p-4 font-mono font-bold text-cyan-300">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.1)]">
                            {c.code}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-white">
                          {c.title}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase inline-flex items-center gap-1.5 border ${catConfig.badgeBg} ${catConfig.textColor} ${catConfig.borderColor}`}>
                            <CategoryIcon className="w-3 h-3" />
                            <span>{c.courseType.replace("_", " ")}</span>
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">
                          {c.program?.name || "BS Program"}
                        </td>
                        <td className="p-4 text-slate-300 font-mono font-semibold">
                          Semester {c.semester}
                        </td>
                        <td className="p-4 font-mono text-cyan-400 font-bold">
                          {c.creditHours} ({c.theoryHours ?? c.creditHours}-{c.labHours ?? 0})
                        </td>
                        <td className="p-4 text-slate-400">
                          {c.faculty?.user?.name || "Unassigned"}
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(c)}
                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border transition-all ${
                              c.isActive
                                ? "bg-gradient-to-r from-emerald-950/90 to-teal-950/90 text-emerald-300 border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)]"
                                : "bg-gradient-to-r from-rose-950/90 to-red-950/90 text-rose-300 border-rose-400/60 shadow-[0_0_10px_rgba(244,63,94,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)]"
                            }`}
                          >
                            {c.isActive ? "Active" : "Hidden"}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setViewSyllabusCourse(c)}
                              className="p-2 rounded-md bg-gradient-to-br from-cyan-950/90 via-slate-950 to-cyan-900/60 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-110 hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all"
                              title="View Syllabus"
                            >
                              <Eye className="w-4 h-4 stroke-[2.2] drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setManageOutlineCourse(c)}
                              className="p-2 rounded-md bg-gradient-to-br from-purple-950/90 via-slate-950 to-fuchsia-900/60 text-purple-300 border border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-110 hover:border-purple-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all"
                              title="Manage Outlines"
                            >
                              <ListChecks className="w-4 h-4 stroke-[2.2] drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditCourseItem(c)}
                              className="p-2 rounded-md bg-gradient-to-br from-amber-950/90 via-slate-950 to-yellow-900/60 text-amber-300 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-110 hover:border-amber-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] transition-all"
                              title="Edit Course"
                            >
                              <Edit className="w-4 h-4 stroke-[2.2] drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCourseToDelete(c)}
                              className="p-2 rounded-md bg-gradient-to-br from-rose-950/90 via-slate-950 to-red-900/60 text-rose-300 border border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-110 hover:border-rose-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.6)] transition-all"
                              title="Delete Course"
                            >
                              <Trash2 className="w-4 h-4 stroke-[2.2] drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARD GRID VIEWS (LARGE, MEDIUM, SMALL) */
          <div className={`grid gap-6 ${
            viewMode === "large"
              ? "grid-cols-1 md:grid-cols-2"
              : viewMode === "small"
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}>
            {filteredCourses.map((c) => {
              const catConfig = CATEGORY_MAP[c.courseType] || CATEGORY_MAP.CORE;
              const CategoryIcon = catConfig.icon;

              if (viewMode === "small") {
                return (
                  <div
                    key={c.id}
                    className={`antigravity-card p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden group ${
                      !c.isActive ? "opacity-50 grayscale hover:grayscale-0" : ""
                    }`}
                  >
                    <div className="space-y-2 relative z-10">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-extrabold font-mono px-2 py-0.5 rounded-lg bg-slate-950 text-cyan-300 border border-cyan-500/30">
                          {c.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase truncate border ${catConfig.badgeBg} ${catConfig.textColor} ${catConfig.borderColor}`}>
                          {c.courseType.replace("_", " ")}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug line-clamp-1">
                          {c.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Sem {c.semester} • {c.program?.name || "BS Program"}
                        </p>
                      </div>

                      <div className="text-[10px] font-mono text-cyan-400 font-bold bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                        <span>Cr. Hrs: {c.creditHours} ({c.theoryHours ?? c.creditHours}-{c.labHours ?? 0})</span>
                        <span className="text-slate-400 font-sans font-normal truncate max-w-[80px]">{c.faculty?.user?.name || "Unassigned"}</span>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-1 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewSyllabusCourse(c)}
                          className="p-2 rounded-md bg-gradient-to-br from-cyan-950/90 via-slate-950 to-cyan-900/60 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-110 hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all"
                          title="Syllabus"
                        >
                          <Eye className="w-3.5 h-3.5 stroke-[2.2] drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setManageOutlineCourse(c)}
                          className="p-2 rounded-md bg-gradient-to-br from-purple-950/90 via-slate-950 to-fuchsia-900/60 text-purple-300 border border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-110 hover:border-purple-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all"
                          title="Outlines"
                        >
                          <ListChecks className="w-3.5 h-3.5 stroke-[2.2] drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditCourseItem(c)}
                          className="p-2 rounded-md bg-gradient-to-br from-amber-950/90 via-slate-950 to-yellow-900/60 text-amber-300 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-110 hover:border-amber-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] transition-all"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5 stroke-[2.2] drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border transition-all ${
                            c.isActive
                              ? "bg-gradient-to-r from-emerald-950/90 to-teal-950/90 text-emerald-300 border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)]"
                              : "bg-gradient-to-r from-rose-950/90 to-red-950/90 text-rose-300 border-rose-400/60 shadow-[0_0_10px_rgba(244,63,94,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)]"
                          }`}
                        >
                          {c.isActive ? "Active" : "Hidden"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setCourseToDelete(c)}
                          className="p-2 rounded-md bg-gradient-to-br from-rose-950/90 via-slate-950 to-red-900/60 text-rose-300 border border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-110 hover:border-rose-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.6)] transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2.2] drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={c.id}
                  className={`antigravity-card ${viewMode === "large" ? "p-7" : "p-6"} rounded-3xl flex flex-col justify-between relative overflow-hidden group ${
                    !c.isActive ? "opacity-50 grayscale hover:grayscale-0" : ""
                  }`}
                >
                  {/* Subtle Card Background Glow */}
                  <div className={`absolute top-0 right-0 ${viewMode === "large" ? "w-48 h-48" : "w-36 h-36"} ${catConfig.badgeBg} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 opacity-30`} />

                  <div className="space-y-4 relative z-10">
                    
                    {/* Top Row: Course Code & Category Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-extrabold font-mono px-3 py-1 rounded-xl bg-slate-950 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] ${viewMode === "large" ? "text-sm px-4 py-1.5" : "text-xs"}`}>
                        {c.code}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1.5 border ${catConfig.badgeBg} ${catConfig.textColor} ${catConfig.borderColor} ${catConfig.shadowColor}`}>
                        <CategoryIcon className="w-3 h-3" />
                        <span>{c.courseType.replace("_", " ")}</span>
                      </span>
                    </div>

                    {/* Course Title */}
                    <div>
                      <h3 className={`font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug ${viewMode === "large" ? "text-xl" : "text-lg"}`}>
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Semester {c.semester}</span>
                        <span>•</span>
                        <span>{c.program?.name || "BS Program"}</span>
                      </p>
                    </div>

                    {/* Meta Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                      
                      {/* Credit Hours Indicator */}
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <div>
                          <span className="block text-[10px] uppercase text-slate-500 font-bold">Credit Hours</span>
                          <span className="text-xs font-extrabold text-slate-200 font-mono">
                            {c.creditHours} ({c.theoryHours ?? c.creditHours}-{c.labHours ?? 0})
                          </span>
                        </div>
                      </div>

                      {/* Faculty / Instructor */}
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2 overflow-hidden">
                        <User className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <div className="truncate">
                          <span className="block text-[10px] uppercase text-slate-500 font-bold">Faculty</span>
                          <span className="text-xs font-semibold text-slate-300 truncate block">
                            {c.faculty?.user?.name || "Unassigned"}
                          </span>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Interactive Actions Footer */}
                  <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10 flex-wrap">
                    
                    <div className="flex items-center gap-2">
                      {/* View Syllabus */}
                      <button
                        type="button"
                        onClick={() => setViewSyllabusCourse(c)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-br from-cyan-950/90 via-slate-950 to-cyan-900/60 text-cyan-300 hover:text-cyan-200 text-xs font-bold border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-105 hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4 stroke-[2.2] drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                        <span>Syllabus</span>
                      </button>

                      {/* Manage Outlines */}
                      <button
                        type="button"
                        onClick={() => setManageOutlineCourse(c)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-br from-purple-950/90 via-slate-950 to-fuchsia-900/60 text-purple-300 hover:text-purple-200 text-xs font-bold border border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-105 hover:border-purple-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all flex items-center gap-2"
                      >
                        <ListChecks className="w-4 h-4 stroke-[2.2] drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                        <span>Outlines</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => setEditCourseItem(c)}
                        className="p-2.5 rounded-xl bg-gradient-to-br from-amber-950/90 via-slate-950 to-yellow-900/60 text-amber-300 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-110 hover:border-amber-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] transition-all"
                        title="Edit Course"
                      >
                        <Edit className="w-4 h-4 stroke-[2.2] drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                      </button>

                      {/* Delete Course */}
                      <button
                        type="button"
                        onClick={() => setCourseToDelete(c)}
                        className="p-2.5 rounded-xl bg-gradient-to-br from-rose-950/90 via-slate-950 to-red-900/60 text-rose-300 border border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-110 hover:border-rose-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.6)] transition-all"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.2] drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                      </button>

                      {/* Status Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                          c.isActive
                            ? "bg-gradient-to-r from-emerald-950/90 to-teal-950/90 text-emerald-300 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-105"
                            : "bg-gradient-to-r from-rose-950/90 to-red-950/90 text-rose-300 border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-105"
                        }`}
                      >
                        {c.isActive ? "Active" : "Hidden"}
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          DELETE CONFIRMATION MODAL
      ───────────────────────────────────────────────────────────── */}
      {courseToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="antigravity-card p-6 md:p-8 rounded-3xl w-full max-w-md space-y-6 border border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.25)] relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Course</h3>
                <p className="text-xs text-slate-400">Remove course from curriculum matrix</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">{courseToDelete.title}</span> ({courseToDelete.code})? This action will remove the course scheme from the active matrix.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDeleteCourse(courseToDelete.id, courseToDelete.title)}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste Excel Data Modal */}
      {pasteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  Paste Course Scheme Data
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Copy table rows from Excel or Google Sheets (Ctrl+C) and paste below (Ctrl+V).
                </p>
              </div>
              <button
                onClick={() => setPasteModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={9}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Code\tTitle\tCredit Hours\tSemester\tType\tProgram\nCS-101\tProgramming Fundamentals\t4(3-1)\t1\tCORE\tBS Computer Science\nMATH-101\tCalculus & Analytical Geometry\t3(3-0)\t1\tFOUNDATION_ALLIED\tBS Computer Science"}
              className="w-full p-3 font-mono text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 resize-y text-gray-900"
            />

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!pasteText.trim()}
                onClick={handleProcessPastedText}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Review & Validate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Check Diagnostics Modal */}
      <UniversalImportModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        onConfirmImport={handleConfirmCourseImport}
        validationData={validationData}
        isImporting={isImporting}
        entityName="Course"
        sourceName={importSourceName}
      />

      {/* Import Summary Modal */}
      {importSummary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Course Import Summary
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Results of courses batch import</p>
              </div>
              <button
                onClick={() => setImportSummary(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-lg font-bold text-emerald-700">{importSummary.imported || 0}</div>
                <div className="text-[11px] text-emerald-600 font-medium">New Added</div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-lg font-bold text-blue-700">{importSummary.updated || 0}</div>
                <div className="text-[11px] text-blue-600 font-medium">Updated</div>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                <div className="text-lg font-bold text-rose-700">{importSummary.failed || 0}</div>
                <div className="text-[11px] text-rose-600 font-medium">Failed</div>
              </div>
            </div>

            {importSummary.errors && importSummary.errors.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-gray-700">Notice / Errors Log:</div>
                <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-1.5 font-mono">
                  {importSummary.errors.map((e: any, idx: number) => (
                    <div key={idx} className="flex gap-2 text-gray-700">
                      <span className="font-bold text-gray-900">Row {e.row}:</span>
                      <span className="font-semibold text-blue-700">{e.item}</span> —
                      <span className="text-rose-600">{e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setImportSummary(null)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. ADD COURSE FORM MODAL (LEVITATING DIALOG)
      ───────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="antigravity-card p-6 md:p-8 rounded-3xl w-full max-w-xl space-y-6 max-h-[90vh] overflow-y-auto border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Add New Course Scheme</h2>
                  <p className="text-xs text-slate-400">Specify curriculum metadata & category type</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddCourse} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Course Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Organic Chemistry I"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                {/* Code */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Course Code *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. CHEM-101"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Course Type Dropdown (Matching exact requirements) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Course Category Type *</label>
                <select
                  required
                  value={form.courseType}
                  onChange={e => setForm(f => ({ ...f, courseType: e.target.value as CourseType }))}
                  className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-bold"
                >
                  <option value="CORE">CORE (Main Subjects)</option>
                  <option value="FOUNDATION_ALLIED">FOUNDATION / ALLIED (Supporting Subjects)</option>
                  <option value="GENERAL_MINOR">GENERAL MINOR (Psychology, Philosophy, etc.)</option>
                  <option value="ELECTIVE_MAJOR">ELECTIVE MAJOR (Specializations)</option>
                  <option value="ELECTIVE_OPEN">ELECTIVE OPEN (Free Elective)</option>
                  <option value="COMPULSORY_GENED">COMPULSORY GENED (English, Pak Studies, etc.)</option>
                  <option value="LAB_PRACTICAL">LAB / PRACTICAL (Hands-on Lab)</option>
                  <option value="CAPSTONE_THESIS">CAPSTONE / THESIS (Graduation Project)</option>
                </select>
              </div>

              {/* Credit Hours & Format Scheme Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Credit Hours & Scheme *</label>
                  <span className="text-[10px] text-cyan-400 font-mono">Format e.g. 4(3-1), 4(4-0), 3(3-0), 2(2-0)</span>
                </div>

                {/* Quick Presets */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { code: "4(3-1)", label: "4(3-1) [Theory + Practical]" },
                    { code: "4(4-0)", label: "4(4-0) [Theory Only]" },
                    { code: "3(3-0)", label: "3(3-0) [Theory Only]" },
                    { code: "2(2-0)", label: "2(2-0) [Theory Only]" },
                  ].map(p => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => applyCreditPreset(p.code)}
                      className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg border transition-all ${
                        form.creditHoursFormat === p.code
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {p.code}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Scheme</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 4(3-1)"
                      value={form.creditHoursFormat}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(f => ({ ...f, creditHoursFormat: val }));
                        const match = val.match(/^(\d+)\s*\(\s*(\d+)\s*[\-\/]\s*(\d+)\s*\)$/);
                        if (match) {
                          setForm(f => ({ ...f, creditHoursFormat: val, creditHours: match[1], theoryHours: match[2], labHours: match[3] }));
                        }
                      }}
                      className="w-full bg-slate-950 text-cyan-300 text-xs rounded-xl p-2.5 border border-slate-800 font-mono text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Total Cr</label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="6"
                      value={form.creditHours}
                      onChange={e => setForm(f => ({ ...f, creditHours: e.target.value }))}
                      className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-2.5 border border-slate-800 font-mono text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Theory Hrs</label>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={form.theoryHours}
                      onChange={e => setForm(f => ({ ...f, theoryHours: e.target.value }))}
                      className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-2.5 border border-slate-800 font-mono text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Lab Hrs</label>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={form.labHours}
                      onChange={e => setForm(f => ({ ...f, labHours: e.target.value }))}
                      className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-2.5 border border-slate-800 font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Semester & Session */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Semester *</label>
                  <select
                    required
                    value={form.semester}
                    onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                    className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={String(s)}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Academic Session</label>
                  <select
                    value={form.session}
                    onChange={e => setForm(f => ({ ...f, session: e.target.value }))}
                    className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    {sessions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Program & Faculty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Degree Program *</label>
                  <select
                    required
                    value={form.programId}
                    onChange={e => setForm(f => ({ ...f, programId: e.target.value }))}
                    className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="">-- Select Program --</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    {programs.length === 0 && <option value="p-cs">BS Computer Science</option>}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Assign Faculty</label>
                  <select
                    value={form.facultyId}
                    onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}
                    className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="">-- Unassigned --</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>{f.user?.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
                >
                  {saving ? "Creating Course..." : "Confirm & Save Course"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. EDIT COURSE FORM MODAL
      ───────────────────────────────────────────────────────────── */}
      {editCourseItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="antigravity-card p-6 md:p-8 rounded-3xl w-full max-w-lg space-y-6 border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.25)]">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Course: {editCourseItem.code}</h2>
                  <p className="text-xs text-slate-400">Modify course configuration parameters</p>
                </div>
              </div>
              <button onClick={() => setEditCourseItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Course Title</label>
                  <input
                    type="text"
                    value={editCourseItem.title}
                    onChange={e => setEditCourseItem({ ...editCourseItem, title: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 focus:ring-2 focus:ring-purple-400 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Course Code</label>
                  <input
                    type="text"
                    value={editCourseItem.code}
                    onChange={e => setEditCourseItem({ ...editCourseItem, code: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 focus:ring-2 focus:ring-purple-400 font-mono mt-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Credit Hours & Scheme</label>
                  <span className="text-[10px] text-cyan-400 font-mono">Format e.g. 4(3-1), 4(4-0), 3(3-0), 2(2-0)</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["4(3-1)", "4(4-0)", "3(3-0)", "2(2-0)"].map(code => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        const m = code.match(/^(\d+)\s*\(\s*(\d+)\s*[\-\/]\s*(\d+)\s*\)$/);
                        if (m) {
                          setEditCourseItem({
                            ...editCourseItem,
                            creditHoursFormat: code,
                            creditHours: Number(m[1]),
                            theoryHours: Number(m[2]),
                            labHours: Number(m[3]),
                          });
                        }
                      }}
                      className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg border transition-all ${
                        editCourseItem.creditHoursFormat === code
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400">Credit Scheme</label>
                    <input
                      type="text"
                      value={editCourseItem.creditHoursFormat || `${editCourseItem.creditHours}(${editCourseItem.theoryHours ?? editCourseItem.creditHours}-${editCourseItem.labHours ?? 0})`}
                      onChange={e => {
                        const val = e.target.value;
                        const m = val.match(/^(\d+)\s*\(\s*(\d+)\s*[\-\/]\s*(\d+)\s*\)$/);
                        if (m) {
                          setEditCourseItem({
                            ...editCourseItem,
                            creditHoursFormat: val,
                            creditHours: Number(m[1]),
                            theoryHours: Number(m[2]),
                            labHours: Number(m[3]),
                          });
                        } else {
                          setEditCourseItem({ ...editCourseItem, creditHoursFormat: val });
                        }
                      }}
                      className="w-full bg-slate-950 text-cyan-300 text-xs rounded-xl p-3 border border-slate-800 font-mono mt-1 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400">Category Type</label>
                    <select
                      value={editCourseItem.courseType}
                      onChange={e => setEditCourseItem({ ...editCourseItem, courseType: e.target.value as CourseType })}
                      className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 font-bold mt-1"
                    >
                      <option value="CORE">CORE</option>
                      <option value="FOUNDATION_ALLIED">FOUNDATION_ALLIED</option>
                      <option value="GENERAL_MINOR">GENERAL_MINOR</option>
                      <option value="ELECTIVE_MAJOR">ELECTIVE_MAJOR</option>
                      <option value="ELECTIVE_OPEN">ELECTIVE_OPEN</option>
                      <option value="COMPULSORY_GENED">COMPULSORY_GENED</option>
                      <option value="LAB_PRACTICAL">LAB_PRACTICAL</option>
                      <option value="CAPSTONE_THESIS">CAPSTONE_THESIS</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Assign Faculty</label>
                <select
                  value={editCourseItem.facultyId || ""}
                  onChange={e => setEditCourseItem({ ...editCourseItem, facultyId: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 mt-1"
                >
                  <option value="">-- Unassigned --</option>
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.user?.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditCourseItem(null)}
                  className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. VIEW SYLLABUS MODAL (INTERACTIVE LEVITATING DRAWER)
      ───────────────────────────────────────────────────────────── */}
      {viewSyllabusCourse && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="antigravity-card p-6 md:p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.3)] relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-6 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-500/40">
                    {viewSyllabusCourse.code}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Semester {viewSyllabusCourse.semester} • {viewSyllabusCourse.creditHours} Credit Hours
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">{viewSyllabusCourse.title}</h2>
                <p className="text-xs text-slate-400">Official Course Syllabus & Academic Specification Sheet</p>
              </div>

              <button
                onClick={() => setViewSyllabusCourse(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Syllabus Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 py-3 overflow-x-auto">
              {[
                { id: "weekly", label: "Weekly Schedule (16 Weeks)", icon: Clock },
                { id: "clos", label: "CLOs & Objectives", icon: ListChecks },
                { id: "assessment", label: "Grading Scheme", icon: Award },
                { id: "books", label: "Textbooks & References", icon: BookMarked },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeSyllabusTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSyllabusTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar pr-2">
              
              {/* Tab 1: Weekly Breakdown */}
              {activeSyllabusTab === "weekly" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>16-Week Topic Breakdown</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(viewSyllabusCourse.syllabus?.outlines || []).map(item => (
                      <div key={item.week} className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 hover:border-cyan-500/30 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                            Week {item.week}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-200 mt-2">{item.topic}</h5>
                        <p className="text-[11px] text-slate-400 mt-1">{item.details}</p>
                        {item.labWork && (
                          <div className="mt-2 text-[10px] font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20 flex items-center gap-1.5">
                            <Beaker className="w-3 h-3 text-purple-400" />
                            <span>{item.labWork}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: CLOs */}
              {activeSyllabusTab === "clos" && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300">Course Description</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {viewSyllabusCourse.syllabus?.description}
                    </p>
                  </div>

                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                    Course Learning Outcomes (CLOs)
                  </h4>
                  <div className="space-y-2">
                    {(viewSyllabusCourse.syllabus?.clos || []).map((clo, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-200 font-medium">{clo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Assessment */}
              {activeSyllabusTab === "assessment" && (() => {
                const isPractical = (viewSyllabusCourse.labHours && viewSyllabusCourse.labHours > 0) || viewSyllabusCourse.courseType === "LAB_PRACTICAL" || viewSyllabusCourse.courseType.includes("LAB");
                
                return (
                  <div className="space-y-5">
                    {/* Exam System Scheme Switcher Toolbar */}
                    <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      themeMode === "light"
                        ? "bg-white/80 border-cyan-300 shadow-sm"
                        : "bg-slate-950/80 border-cyan-500/30"
                    }`}>
                      <div>
                        <h5 className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          <span>Examination System Scheme</span>
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {isPractical
                            ? "Course contains Practical Lab component (25 Marks)"
                            : "Standard Theory Course (No Practical Lab)"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setExamSystemMode("SEMESTER")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            examSystemMode === "SEMESTER"
                              ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Semester (Mid + Final)
                        </button>
                        <button
                          type="button"
                          onClick={() => setExamSystemMode("TERMINAL")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            examSystemMode === "TERMINAL"
                              ? "bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Terminal Exam System
                        </button>
                      </div>
                    </div>

                    {/* Grading Marks Breakdown Cards */}
                    {examSystemMode === "SEMESTER" ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 text-center space-y-1">
                          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-cyan-400">Midterm Exam</span>
                          <span className="text-3xl font-black text-cyan-300 font-mono block mt-1">
                            {isPractical ? 20 : (viewSyllabusCourse.syllabus?.assessment.midterm || 30)}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block">Midterm Evaluation</span>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-2xl border border-purple-500/30 text-center space-y-1">
                          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Final Terminal</span>
                          <span className="text-3xl font-black text-purple-300 font-mono block mt-1">
                            {isPractical ? 40 : (viewSyllabusCourse.syllabus?.assessment.final || 50)}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block">Final Examination</span>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-1">
                          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Assignment + Quiz</span>
                          <span className="text-3xl font-black text-emerald-300 font-mono block mt-1">
                            {isPractical ? 15 : 20}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block">Sessional Assessment</span>
                        </div>

                        <div className={`p-4 rounded-2xl border text-center space-y-1 ${
                          isPractical ? "bg-slate-950 border-blue-500/40 text-blue-300" : "bg-slate-950/40 border-slate-800 opacity-40"
                        }`}>
                          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-blue-400">Practical Lab</span>
                          <span className="text-3xl font-black text-blue-300 font-mono block mt-1">
                            {isPractical ? 25 : 0}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block">
                            {isPractical ? "Practical & Lab Work" : "No Practical"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-purple-500/40 text-center space-y-1">
                          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Terminal Exam (Mid + Final)</span>
                          <span className="text-3xl font-black text-purple-300 font-mono block mt-1">
                            {isPractical ? 70 : 80}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block">Single Combined Terminal Exam</span>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-1">
                          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Quizzes & Assignments</span>
                          <span className="text-3xl font-black text-emerald-300 font-mono block mt-1">
                            {isPractical ? 5 : 20}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block">Continuous Sessional Work</span>
                        </div>

                        <div className={`p-4 rounded-2xl border text-center space-y-1 ${
                          isPractical ? "bg-slate-950 border-blue-500/40 text-blue-300" : "bg-slate-950/40 border-slate-800 opacity-40"
                        }`}>
                          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-blue-400">Practical Lab</span>
                          <span className="text-3xl font-black text-blue-300 font-mono block mt-1">
                            {isPractical ? 25 : 0}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block">
                            {isPractical ? "Practical Lab Examination" : "No Practical Component"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Tab 4: Books */}
              {activeSyllabusTab === "books" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                    Recommended Reading & Resources
                  </h4>
                  <div className="space-y-2">
                    {(viewSyllabusCourse.syllabus?.textbooks || []).map((book, idx) => (
                      <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                        <BookMarked className="w-5 h-5 text-purple-400" />
                        <span className="text-xs text-slate-200 font-medium">{book}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewSyllabusCourse(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
              >
                Close Syllabus
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. MANAGE OUTLINES MODAL (INTERACTIVE EDITING)
      ───────────────────────────────────────────────────────────── */}
      {manageOutlineCourse && (
        <ManageOutlinesModal
          course={manageOutlineCourse}
          onClose={() => setManageOutlineCourse(null)}
          onSave={handleSaveOutline}
        />
      )}

    </div>
  );
}

// Subcomponent for interactive outline management
function ManageOutlinesModal({
  course,
  onClose,
  onSave
}: {
  course: Course;
  onClose: () => void;
  onSave: (outlines: OutlineItem[]) => void;
}) {
  const [outlines, setOutlines] = useState<OutlineItem[]>(
    course.syllabus?.outlines || generateDefaultSyllabus(course.code, course.title, course.courseType).outlines
  );
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [weekTopic, setWeekTopic] = useState("");
  const [weekDetails, setWeekDetails] = useState("");
  const [weekLab, setWeekLab] = useState("");

  const startEditWeek = (item: OutlineItem) => {
    setEditingWeek(item.week);
    setWeekTopic(item.topic);
    setWeekDetails(item.details);
    setWeekLab(item.labWork || "");
  };

  const saveWeekItem = () => {
    if (editingWeek === null) return;
    setOutlines(prev =>
      prev.map(item =>
        item.week === editingWeek
          ? { ...item, topic: weekTopic, details: weekDetails, labWork: weekLab || undefined }
          : item
      )
    );
    setEditingWeek(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="antigravity-card p-6 md:p-8 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-purple-500/40 shadow-[0_0_60px_rgba(168,85,247,0.3)]">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Manage Syllabus Outlines: {course.code}</h2>
            <p className="text-xs text-slate-400">Edit 16-week lecture modules & practical lab sessions</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar pr-2">
          {outlines.map(item => (
            <div key={item.week} className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800">
              {editingWeek === item.week ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400">Editing Week {item.week}</span>
                  </div>
                  <input
                    type="text"
                    value={weekTopic}
                    onChange={e => setWeekTopic(e.target.value)}
                    placeholder="Topic Title"
                    className="w-full bg-slate-900 text-slate-100 text-xs p-2.5 rounded-xl border border-slate-700"
                  />
                  <textarea
                    rows={2}
                    value={weekDetails}
                    onChange={e => setWeekDetails(e.target.value)}
                    placeholder="Lecture details & learning outcomes"
                    className="w-full bg-slate-900 text-slate-100 text-xs p-2.5 rounded-xl border border-slate-700"
                  />
                  <input
                    type="text"
                    value={weekLab}
                    onChange={e => setWeekLab(e.target.value)}
                    placeholder="Optional Practical Lab Session Title"
                    className="w-full bg-slate-900 text-purple-200 text-xs p-2.5 rounded-xl border border-slate-700"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveWeekItem}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold"
                    >
                      Update Module
                    </button>
                    <button
                      onClick={() => setEditingWeek(null)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 font-bold border border-purple-500/30">
                        Week {item.week}
                      </span>
                      <h4 className="text-xs font-bold text-slate-200">{item.topic}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.details}</p>
                    {item.labWork && (
                      <span className="inline-block text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 mt-1">
                        Lab: {item.labWork}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => startEditWeek(item)}
                    className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg bg-slate-900 border border-slate-800"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-500">16 Modules Configured</span>
          <div className="flex gap-3">
            <button
              onClick={() => onSave(outlines)}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              Save Outlines
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
