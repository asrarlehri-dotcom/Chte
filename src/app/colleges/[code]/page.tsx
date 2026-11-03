"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  BookOpen,
  Building2,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  LogIn,
  ChevronDown,
  Landmark,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Sparkles,
  Quote,
  Award
} from "lucide-react";

type Department = {
  id: string;
  name: string;
  code: string;
  hodName: string | null;
  _count?: { programs: number; faculty: number };
};

type Program = {
  id: string;
  name: string;
  code: string | null;
  educationLevel: string;
  department?: { id: string; name: string; code: string } | null;
  _count?: { courses: number; students: number };
};

type FacultyMember = {
  id: string;
  designation: string | null;
  qualification: string | null;
  educationLevel: string | null;
  user: { name: string; email: string };
  department?: { name: string } | null;
};

type DatesheetNotice = {
  id: string;
  examType: string;
  date: string;
  startTime: string;
  endTime: string;
  course?: { title: string; code: string } | null;
  program?: { name: string } | null;
};

export type FeaturedProfile = {
  id: string;
  name: string;
  designation: string;
  department?: string;
  category: "PRINCIPAL" | "DEAN" | "FACULTY" | "ALUMNI";
  photoUrl: string;
  quote?: string;
  message?: string;
  email?: string;
  phone?: string;
  order?: number;
};

type PortalSettings = {
  heroBgType: "IMAGE" | "VIDEO";
  heroBgUrl: string;
  heroImgZoom?: number;
  heroImgPosX?: number;
  heroImgPosY?: number;
  primaryColor: string;
  ribbonColor: string; // The "red patii"
  bodyBgColor: string;
  textColor: string;
  noticeTickerShow: boolean;
  noticeBadge: string;
  noticeTickerText: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  socialLinks: {
    x?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
    instagram?: string;
  };
  ribbonLinks: Array<{ label: string; link: string }>;
  topNavLinks: Array<{ label: string; link: string }>;
  featuredProfiles?: FeaturedProfile[];
};

type CollegeData = {
  id: string;
  name: string;
  code: string;
  slug: string;
  logoUrl: string | null;
  tagline: string | null;
  district: string | null;
  division: string | null;
  address: string | null;
  principalName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  bankName: string | null;
  bankAccount: string | null;
  branchCode: string | null;
  accountTitle: string | null;
  departments: Department[];
  programs: Program[];
  faculty: FacultyMember[];
  datesheets: DatesheetNotice[];
  portalSettings: PortalSettings;
  _count: {
    students: number;
    faculty: number;
    programs: number;
    departments: number;
  };
};

export default function CollegePortalHomePage() {
  const params = useParams();
  const codeParam = (params?.code as string) || "";

  const [college, setCollege] = useState<CollegeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "BS" | "INTERMEDIATE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [topSearch, setTopSearch] = useState("");

  useEffect(() => {
    if (!codeParam) return;
    setLoading(true);
    fetch(`/api/public/colleges/${codeParam}`)
      .then((res) => {
        if (!res.ok) throw new Error("College not found or could not be loaded");
        return res.json();
      })
      .then((data) => {
        setCollege(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load college details. Please verify the URL.");
      })
      .finally(() => setLoading(false));
  }, [codeParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-black tracking-tight">Connecting to College Portal...</h2>
        <p className="text-slate-400 text-xs mt-1">Loading customized theme, live records & campus structure</p>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-16 h-16 rounded-3xl bg-red-950/60 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-800">
          <Landmark className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black">College Portal Not Found</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
          {error || "The requested college profile does not exist or has been disabled."}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all"
        >
          <span>Back to Central Portal</span>
        </Link>
      </div>
    );
  }

  const s = college.portalSettings;
  const loginUrl = `/login?collegeId=${college.id}&institute=${college.code}`;
  const admissionUrl = `/admission?collegeId=${college.id}&institute=${college.code}`;

  const filteredPrograms = college.programs.filter((p) => {
    const matchesTab = activeTab === "ALL" ? true : p.educationLevel === activeTab;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.department?.name && p.department.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div
      className="min-h-screen text-slate-100 font-sans selection:bg-red-600 selection:text-white"
      style={{ backgroundColor: s.bodyBgColor || "#070d19" }}
    >
      {/* ── 1. TOP NAV BAR (DARK NAVY / PRIMARY) ── */}
      <div
        className="text-white text-xs font-bold py-2 px-4 sm:px-8 border-b border-white/10"
        style={{ backgroundColor: s.primaryColor || "#040d1a" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Top Left Nav Links */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] tracking-wider uppercase">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">
              HOME
            </Link>
            <Link href={loginUrl} className="text-amber-400 hover:text-amber-300 transition-colors font-black">
              CMS PORTAL
            </Link>
            <a href="#programs" className="text-slate-300 hover:text-white transition-colors">
              PROGRAMS
            </a>
            <a href="#notices" className="text-slate-300 hover:text-white transition-colors">
              TIMETABLE & DATESHEET
            </a>
            <Link href="/print/challan" className="text-slate-300 hover:text-white transition-colors">
              SELF-SERVICE
            </Link>
            <a href="#leadership" className="text-slate-300 hover:text-white transition-colors">
              PROFILE
            </a>
          </div>

          {/* Top Right Search Box */}
          <div className="relative flex items-center w-full md:w-72">
            <input
              type="text"
              placeholder={`Search ${college.code} College...`}
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              className="w-full bg-white text-slate-900 text-xs pl-3.5 pr-10 py-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-400"
            />
            <button className="absolute right-0 top-0 bottom-0 px-3 bg-amber-400 hover:bg-amber-500 text-slate-900 flex items-center justify-center transition-colors">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. "RED PATII" (ACCENT RIBBON / SUB-BAR) ── */}
      <div
        className="text-white text-xs py-2 px-4 sm:px-8 shadow-sm transition-colors"
        style={{ backgroundColor: s.ribbonColor || "#dc2626" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Ribbon Links */}
          <div className="flex flex-wrap items-center gap-5 sm:gap-7 font-bold text-[12px]">
            {s.ribbonLinks && s.ribbonLinks.length > 0 ? (
              s.ribbonLinks.map((item, idx) => (
                <a key={idx} href={item.link} className="hover:underline transition-opacity">
                  {item.label}
                </a>
              ))
            ) : (
              <>
                <a href="#about" className="hover:underline">Newsletters</a>
                <a href="#about" className="hover:underline">Annual Reports</a>
                <a href="#about" className="hover:underline">Convocation</a>
                <a href="#about" className="hover:underline">Media</a>
              </>
            )}
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3.5 text-white/90">
            {s.socialLinks?.x && (
              <a href={s.socialLinks.x} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="X (Twitter)">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {s.socialLinks?.facebook && (
              <a href={s.socialLinks.facebook} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="Facebook">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}
            {s.socialLinks?.youtube && (
              <a href={s.socialLinks.youtube} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="YouTube">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            )}
            {s.socialLinks?.linkedin && (
              <a href={s.socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="LinkedIn">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            )}
            {s.socialLinks?.instagram && (
              <a href={s.socialLinks.instagram} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="Instagram">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. MAIN COLLEGE BRAND HEADER ── */}
      <header
        className="py-4 px-4 sm:px-8 border-b border-white/10 backdrop-blur-md"
        style={{ backgroundColor: s.primaryColor || "#040d1a" }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & College Details */}
          <div className="flex items-center gap-3.5">
            {college.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={college.logoUrl}
                alt={college.name}
                className="w-16 h-16 object-contain rounded-2xl bg-white/10 p-1 border border-white/20 flex-shrink-0 shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.parentElement?.querySelector(".header-portal-badge") as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="header-portal-badge w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-lg border border-white/20 flex-shrink-0"
              style={{ display: college.logoUrl ? "none" : "flex" }}
            >
              {college.code.substring(0, 3)}
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase leading-tight">
                {college.name}
              </h1>
              <p className="text-[11px] sm:text-xs font-bold text-amber-300 uppercase tracking-widest mt-0.5">
                {college.address
                  ? `${college.address.toUpperCase()} • AFFILIATED INSTITUTION & CMS PORTAL`
                  : `${college.district?.toUpperCase() || "QUETTA, BALOCHISTAN"} • AFFILIATED INSTITUTION & CMS PORTAL`}
              </p>
            </div>
          </div>

          {/* Right Navigation Dropdowns & CTA */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold">
            <div className="hidden lg:flex items-center gap-5 text-slate-200">
              <a href="#about" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                <span>About</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a href="#programs" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                <span>Students</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a href="#faculty" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                <span>Faculty</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a href="#about" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                <span>Offices</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <Link href={admissionUrl} className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                <span>Admissions</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>

            {/* Direct Login CTA */}
            <Link
              href={loginUrl}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-white text-xs font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
              style={{ backgroundColor: s.ribbonColor || "#dc2626" }}
            >
              <LogIn className="w-4 h-4" />
              <span>Login to CMS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── 4. DEVELOPMENT NOTICE / FLASH TICKER BAR (RUNNING MARQUEE) ── */}
      {s.noticeTickerShow !== false && (
        <div className="bg-[#030914] text-white py-2 px-4 sm:px-8 border-y border-white/10 overflow-hidden shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-400 text-slate-900 text-[11px] font-black tracking-wider uppercase shadow-xs z-10">
              <Sparkles className="w-3.5 h-3.5 text-slate-900" />
              <span>{s.noticeBadge || "DEVELOPMENT NOTICE:"}</span>
            </div>

            <div className="min-w-0 flex-1 overflow-hidden relative">
              <div className="animate-marquee inline-block whitespace-nowrap text-xs text-slate-200 font-semibold tracking-wide py-0.5">
                <span className="mx-4">{s.noticeTickerText || "Demo Project | Under development by Israr Ahmed (Computer Programmer, Govt. Postgraduate College, Sariab Road, Quetta)"}</span>
                <span className="text-amber-400 font-bold mx-2">★★★</span>
                <span className="mx-4">{s.noticeTickerText || "Demo Project | Under development by Israr Ahmed (Computer Programmer, Govt. Postgraduate College, Sariab Road, Quetta)"}</span>
                <span className="text-amber-400 font-bold mx-2">★★★</span>
                <span className="mx-4">{s.noticeTickerText || "Demo Project | Under development by Israr Ahmed (Computer Programmer, Govt. Postgraduate College, Sariab Road, Quetta)"}</span>
                <span className="text-amber-400 font-bold mx-2">★★★</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. HERO SECTION WITH VIDEO OR IMAGE BACKGROUND + CAROUSEL CONTROLS ── */}
      <section className="relative min-h-[480px] sm:min-h-[560px] flex items-center justify-center text-center px-4 sm:px-8 overflow-hidden">
        {/* Background Layer: VIDEO or IMAGE with Custom Zoom & Position */}
        {s.heroBgType === "VIDEO" && s.heroBgUrl ? (
          <div className="absolute inset-0 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-all duration-300"
              style={{
                objectPosition: `${s.heroImgPosX ?? 50}% ${s.heroImgPosY ?? 50}%`,
                transform: `scale(${(s.heroImgZoom ?? 100) / 100})`,
                transformOrigin: `${s.heroImgPosX ?? 50}% ${s.heroImgPosY ?? 50}%`,
              }}
            >
              <source src={s.heroBgUrl} type="video/mp4" />
              <source src={s.heroBgUrl} type="video/webm" />
            </video>
          </div>
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.heroBgUrl || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80"}
              alt="Hero Backdrop"
              className="w-full h-full object-cover transition-all duration-300"
              style={{
                objectPosition: `${s.heroImgPosX ?? 50}% ${s.heroImgPosY ?? 50}%`,
                transform: `scale(${(s.heroImgZoom ?? 100) / 100})`,
                transformOrigin: `${s.heroImgPosX ?? 50}% ${s.heroImgPosY ?? 50}%`,
              }}
            />
          </div>
        )}

        {/* Dynamic Dark Gradient & Starfield Overlays */}
        <div className="absolute inset-0 bg-radial from-black/20 via-black/60 to-black/90 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070d19] via-transparent to-black/60 pointer-events-none" />

        {/* Carousel Arrow Controls (Visual Left & Right) */}
        <button
          onClick={() => setActiveTab(activeTab === "ALL" ? "BS" : activeTab === "BS" ? "INTERMEDIATE" : "ALL")}
          className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-all hover:scale-110 z-20"
          title="Previous View"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab(activeTab === "ALL" ? "BS" : activeTab === "BS" ? "INTERMEDIATE" : "ALL")}
          className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-all hover:scale-110 z-20"
          title="Next View"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Center Hero Content */}
        <div className="max-w-4xl mx-auto relative z-10 py-16 flex flex-col items-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-xs font-black tracking-wider uppercase shadow-xl mb-6 border border-white/20"
            style={{ backgroundColor: s.ribbonColor ? `${s.ribbonColor}cc` : "#dc2626cc" }}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{s.heroBadge || "EXCELLENCE IN HIGHER EDUCATION"}</span>
          </div>

          {/* Hero Title */}
          <h2 className="text-3xl sm:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
            {s.heroTitle || college.name}
          </h2>

          {/* Hero Subtitle */}
          <p className="mt-5 text-sm sm:text-base text-slate-200/95 max-w-2xl font-medium leading-relaxed drop-shadow">
            {s.heroSubtitle ||
              "A historic institution committed to academic excellence, higher research, and professional student development."}
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href={admissionUrl}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-black text-sm shadow-xl hover:scale-105 transition-all"
              style={{ backgroundColor: s.ribbonColor || "#dc2626" }}
            >
              <GraduationCap className="w-4.5 h-4.5" />
              <span>Apply for Online Admission</span>
            </Link>

            <Link
              href={loginUrl}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-900 font-black text-sm shadow-xl hover:bg-slate-100 transition-all hover:scale-105"
            >
              <LogIn className="w-4.5 h-4.5 text-red-600" />
              <span>Login by Institute / CMS</span>
            </Link>

            <Link
              href="/print/challan"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-md transition-all"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Fee Challan Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. INSTITUTIONAL METRICS STRIP ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0b1324] p-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white leading-none">
                {college._count.students.toLocaleString()}
              </div>
              <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                Enrolled Students
              </div>
            </div>
          </div>

          <div className="bg-[#0b1324] p-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 flex-shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white leading-none">
                {college._count.programs}
              </div>
              <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                Programs Offered
              </div>
            </div>
          </div>

          <div className="bg-[#0b1324] p-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white leading-none">
                {college._count.faculty}
              </div>
              <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                Faculty Members
              </div>
            </div>
          </div>

          <div className="bg-[#0b1324] p-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white leading-none">
                {college.departments.length}
              </div>
              <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                Departments
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6.5. FEATURED PROFILES & CAMPUS LEADERSHIP (فیچرڈ پروفائلز) ── */}
      <section id="leadership" className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>Campus Leadership & Profiles</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Featured Profiles & Institutional Messages
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Distinguished messages from leadership, faculty deans, and academic coordinators driving higher education excellence.
            </p>
          </div>
        </div>

        {(() => {
          const featuredList = (s.featuredProfiles && s.featuredProfiles.length > 0)
            ? s.featuredProfiles
            : [
              {
                id: "default-principal",
                name: college.principalName || "Prof. Dr. Zahid Mengal",
                designation: "Principal & Head of Institution",
                department: "Office of the Principal",
                category: "PRINCIPAL" as const,
                photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80",
                quote: "Committed to fostering academic distinction, critical inquiry, and character development for Balochistan's brightest minds.",
                message: `Welcome to ${college.name}. Our institution is dedicated to nurturing academic excellence, high ethical standards, and advanced career preparedness for all enrolled scholars.`,
                email: college.contactEmail || "principal@college.edu.pk",
                phone: college.contactPhone || "+92 81 9211000",
              }
            ];

          const principalProfile = featuredList.find((p) => p.category === "PRINCIPAL") || featuredList[0];
          const otherProfiles = featuredList.filter((p) => p.id !== principalProfile.id);

          return (
            <div className="space-y-8">
              {/* Principal Message Spotlight Card */}
              {principalProfile && (
                <div className="relative rounded-3xl bg-gradient-to-br from-[#0c1527] to-[#060a14] border border-white/10 p-6 sm:p-10 shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                    {/* Principal Avatar */}
                    <div className="flex flex-col items-center flex-shrink-0 text-center">
                      <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl p-1 bg-gradient-to-tr from-amber-400 via-red-500 to-amber-200 shadow-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={principalProfile.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80"}
                          alt={principalProfile.name}
                          className="w-full h-full object-cover rounded-[22px]"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80";
                          }}
                        />
                      </div>
                      <span className="mt-3.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/30">
                        Message from the Principal
                      </span>
                    </div>

                    {/* Principal Quote & Message */}
                    <div className="flex-1 text-center lg:text-left space-y-4">
                      {principalProfile.quote && (
                        <div className="flex items-start gap-3">
                          <Quote className="w-8 h-8 text-amber-400/40 flex-shrink-0 hidden sm:block" />
                          <blockquote className="text-base sm:text-lg font-medium italic text-slate-100 leading-relaxed">
                            "{principalProfile.quote}"
                          </blockquote>
                        </div>
                      )}

                      {principalProfile.message && (
                        <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                          {principalProfile.message}
                        </p>
                      )}

                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10">
                        <div>
                          <h4 className="text-lg font-black text-white">{principalProfile.name}</h4>
                          <p className="text-xs text-amber-300 font-semibold">{principalProfile.designation}</p>
                          {principalProfile.department && (
                            <p className="text-[11px] text-slate-400">{principalProfile.department}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 text-xs">
                          {principalProfile.email && (
                            <a
                              href={`mailto:${principalProfile.email}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10"
                            >
                              <Mail className="w-3.5 h-3.5 text-amber-400" />
                              <span>{principalProfile.email}</span>
                            </a>
                          )}
                          {principalProfile.phone && (
                            <a
                              href={`tel:${principalProfile.phone}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10"
                            >
                              <Phone className="w-3.5 h-3.5 text-amber-400" />
                              <span>{principalProfile.phone}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Featured Profiles Grid */}
              {otherProfiles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  {otherProfiles.map((prof) => (
                    <div
                      key={prof.id}
                      className="bg-[#0b1324] rounded-2xl border border-white/10 p-5 hover:border-amber-400/40 hover:shadow-xl transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3.5 mb-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={prof.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80"}
                            alt={prof.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-white/15 flex-shrink-0 shadow-md"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80";
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 inline-block mb-1">
                              {prof.category.replace("_", " ")}
                            </span>
                            <h4 className="text-sm font-bold text-white truncate">{prof.name}</h4>
                            <p className="text-[11px] text-amber-300 font-semibold truncate">{prof.designation}</p>
                          </div>
                        </div>

                        {prof.department && (
                          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{prof.department}</span>
                          </p>
                        )}

                        {prof.quote && (
                          <p className="text-xs text-slate-300 italic mb-2 line-clamp-2">
                            "{prof.quote}"
                          </p>
                        )}

                        {prof.message && (
                          <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                            {prof.message}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-[11px]">
                        {prof.email ? (
                          <a
                            href={`mailto:${prof.email}`}
                            className="text-amber-400 hover:text-amber-300 font-medium truncate flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{prof.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">Academic Leadership</span>
                        )}

                        {prof.phone && (
                          <a
                            href={`tel:${prof.phone}`}
                            className="text-slate-300 hover:text-white font-medium flex items-center gap-1 flex-shrink-0"
                          >
                            <Phone className="w-3 h-3 flex-shrink-0 text-slate-400" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* ── 7. ACADEMIC PROGRAMS SECTION ── */}
      <section id="programs" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Academic Curriculum</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Degree & Intermediate Programs
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Accredited degree paths governed under Higher Education Commission (HEC) and BBISE syllabus regulations.
            </p>
          </div>

          {/* Level Filter Tabs + Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-[#0b1324] p-1 rounded-xl border border-white/10 shadow-xs">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "ALL" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
              >
                All Programs ({college.programs.length})
              </button>
              <button
                onClick={() => setActiveTab("BS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "BS" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
              >
                BS 4-Year
              </button>
              <button
                onClick={() => setActiveTab("INTERMEDIATE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "INTERMEDIATE" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
              >
                Intermediate
              </button>
            </div>

            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0b1324] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Programs Grid */}
        {filteredPrograms.length === 0 ? (
          <div className="bg-[#0b1324] p-12 rounded-3xl border border-dashed border-white/10 text-center">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-300">No programs match your selection</h4>
            <p className="text-xs text-slate-500 mt-1">Try another search keyword or switch tab filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((prog) => (
              <div
                key={prog.id}
                className="bg-[#0b1324] rounded-2xl border border-white/10 p-5 hover:border-red-500/50 hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${prog.educationLevel === "BS"
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }`}
                    >
                      {prog.educationLevel === "BS" ? "BS 4-Year (8 Semesters)" : "Intermediate (2-Year)"}
                    </span>
                    {prog.code && (
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {prog.code}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {prog.name}
                  </h4>

                  {prog.department && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{prog.department.name}</span>
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Enrolled: <strong className="text-white">{prog._count?.students || 0}</strong></span>
                    <span>Curriculum: <strong className="text-white">{prog._count?.courses || 0}</strong> courses</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <Link
                    href={`${admissionUrl}&programId=${prog.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
                  >
                    <span>Apply for {prog.code || "Program"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Open for 2026
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 8. NOTICE BOARD & DATESHEETS ── */}
      <section id="notices" className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="bg-[#0b1324] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-red-500 uppercase tracking-wider mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Notice Board</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Upcoming Examinations & Timetables
              </h3>
            </div>
            <Link
              href={loginUrl}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Controller Portal</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {college.datesheets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-black/20 rounded-xl border border-white/5">
              No recent datesheets published. Check back during upcoming midterm/final exam sessions.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {college.datesheets.map((ds) => (
                <div
                  key={ds.id}
                  className="p-4 rounded-xl bg-black/30 border border-white/10 flex items-start gap-3.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black uppercase">
                      {new Date(ds.date).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="text-base font-black leading-none">{new Date(ds.date).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block text-xs font-bold text-white leading-snug truncate">
                      {ds.course?.title || ds.examType.replace("_", " ")}
                    </strong>
                    <span className="text-[11px] text-slate-400 font-medium block truncate mt-0.5">
                      {ds.program?.name || "All Departments"}
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold block mt-1">
                      {ds.startTime} - {ds.endTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 9. BANKING & CAMPUS INFO ── */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-8 py-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banking Details Card */}
          <div className="bg-[#0b1324] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Official Banking & Fee Challans</h4>
                <p className="text-xs text-slate-400">For semester tuition and admission barcode challans</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 bg-black/30 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Designated Bank</span>
                <span className="font-bold text-white">{college.bankName || "National Bank of Pakistan"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Account Title</span>
                <span className="font-bold text-white">{college.accountTitle || `Principal ${college.name}`}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Account Number</span>
                <span className="font-mono font-bold text-amber-400">{college.bankAccount || "0182-0045892101"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Branch Code</span>
                <span className="font-mono font-bold text-amber-400">{college.branchCode || "0182"}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              * Deposit fees only via system-generated barcode challans downloadable from the student portal.
            </p>
          </div>

          {/* Campus Location & Contact */}
          <div className="bg-[#0b1324] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Campus Contact & Leadership</h4>
                  <p className="text-xs text-slate-400">Government of Balochistan Institutional Campus</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                {college.principalName && (
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>Principal: <strong className="text-white">{college.principalName}</strong></span>
                  </div>
                )}
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <span>{college.address || `${college.district || "Quetta"}, Balochistan, Pakistan`}</span>
                </div>
                {college.contactEmail && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-amber-400">{college.contactEmail}</span>
                  </div>
                )}
                {college.contactPhone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>{college.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">College Code: {college.code}</span>
              <Link
                href={loginUrl}
                className="text-xs font-bold text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Login to {college.code} CMS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. FOOTER ── */}
      <footer className="bg-[#030914] text-slate-400 text-xs py-8 px-4 sm:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} {college.name} • Government of Balochistan. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">
              CHTE Balochistan
            </Link>
            <span>•</span>
            <Link href={loginUrl} className="hover:text-amber-400 font-bold transition-colors">
              Staff & Student Login
            </Link>
            <span>•</span>
            <Link href={admissionUrl} className="hover:text-white transition-colors">
              Online Admissions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
