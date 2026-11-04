"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  GraduationCap,
  Users,
  Search,
  School,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Cloud,
  Share2,
  Target,
  Info,
  User,
  Sun,
  Moon,
  ChevronDown,
  Layers,
  Landmark,
  Sparkles,
  Quote,
  Award
} from "lucide-react";
import { ChteFeaturedProfile, DEFAULT_CHTE_SETTINGS, ChteHomepageSettings } from "@/lib/chte-settings";

interface PublicCollege {
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
  _count: {
    students: number;
    faculty: number;
    programs: number;
  };
}

export default function ChteHomePage() {
  const [colleges, setColleges] = useState<PublicCollege[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [activeTab, setActiveTab] = useState("home");
  const [currentDateStr, setCurrentDateStr] = useState("Wednesday, 28 May 2025");
  const [urduMode, setUrduMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [chteSettings, setChteSettings] = useState<ChteHomepageSettings>(DEFAULT_CHTE_SETTINGS);

  useEffect(() => {
    // Set formatted client date after mount asynchronously
    const timer = setTimeout(() => {
      try {
        const today = new Date();
        const formatted = today.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric"
        });
        setCurrentDateStr(formatted);
      } catch {
        // Keep default
      }
    }, 0);

    fetch("/api/public/colleges")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setColleges(data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    fetch("/api/chte-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setChteSettings((prev: ChteHomepageSettings) => ({
            ...prev,
            ...data,
            featuredProfiles: Array.isArray(data.featuredProfiles) ? data.featuredProfiles : prev.featuredProfiles,
          }));
        }
      })
      .catch((err) => console.error("Error fetching CHTE settings:", err));

    return () => clearTimeout(timer);
  }, []);

  const districts = Array.from(
    new Set(colleges.map((c) => c.district).filter((d): d is string => Boolean(d)))
  );
  const totalStudents = colleges.reduce((sum, c) => sum + (c._count?.students || 0), 0);
  const totalFaculty = colleges.reduce((sum, c) => sum + (c._count?.faculty || 0), 0);

  const filteredColleges = colleges.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.principalName && c.principalName.toLowerCase().includes(q)) ||
      (c.district && c.district.toLowerCase().includes(q));
    const matchesDistrict = selectedDistrict === "ALL" || c.district === selectedDistrict;
    return matchesQuery && matchesDistrict;
  });

  return (
    <div
      className={`min-h-screen text-slate-800 flex flex-col font-sans selection:bg-[#0c5938] selection:text-white ${darkMode ? "bg-slate-900 text-slate-100" : ""}`}
      style={!darkMode ? { backgroundColor: chteSettings.pageBgColor || "#f8faf9" } : undefined}
    >
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. TOP OFFICIAL ANNOUNCEMENT & GOVERNMENT BAR               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#0b3829] text-white px-4 sm:px-8 py-2 text-xs border-b border-[#082b1f]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Government of Balochistan Motto */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2">
              <Image
                src="/balochistan-seal.png"
                alt="Government of Balochistan"
                width={20}
                height={20}
                className="w-5 h-5 object-contain rounded-full bg-white/10 p-0.5"
              />
              <span className="font-bold tracking-wide text-white text-xs">
                Government of Balochistan
              </span>
            </div>
            <span className="text-emerald-400/50">|</span>
            <div className="text-[11px] sm:text-xs text-emerald-100/90 italic font-serif flex items-center gap-2">
              {(chteSettings.topMottoText || "Education | Development | Prosperity")
                .split("|")
                .map((word: string, idx: number, arr: string[]) => (
                  <span key={idx} className="flex items-center gap-2">
                    <span>{word.trim()}</span>
                    {idx < arr.length - 1 && <span className="text-emerald-400/50">|</span>}
                  </span>
                ))}
            </div>
          </div>

          {/* Right: Date, Urdu Switch, Theme Toggle */}
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-emerald-100">
            {/* Calendar Date */}
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentDateStr}</span>
            </div>

            <span className="text-emerald-400/50">|</span>

            {/* Urdu Language Switch */}
            <button
              onClick={() => setUrduMode(!urduMode)}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-semibold"
            >
              <span>{urduMode ? "English" : "اردو"}</span>
              <ChevronDown className="w-3 h-3 text-emerald-300" />
            </button>

            <span className="text-emerald-400/50">|</span>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Theme"
              className="w-5 h-5 rounded-full flex items-center justify-center text-amber-300 hover:text-white hover:scale-110 transition-all cursor-pointer"
            >
              {darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. OFFICIAL NAVIGATION HEADER                               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-emerald-900/10 shadow-xs px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & CHTE Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/balochistan-seal.png"
              alt="CHTE Balochistan Seal"
              width={56}
              height={56}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain flex-shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col justify-center">
              <div className="text-sm sm:text-base md:text-lg font-black text-[#0a3826] tracking-tight leading-tight uppercase">
                CHTE
              </div>
              <div className="text-[10px] sm:text-[11px] font-extrabold text-[#15803d] tracking-wider uppercase leading-none mt-0.5">
                HIGHER & TECHNICAL EDUCATION
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-[0.22em] uppercase leading-none mt-0.5">
                BALOCHISTAN
              </div>
            </div>
          </Link>

          {/* Navigation Links with Icons */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* Home Link (Active) */}
            <a
              href="#"
              onClick={() => setActiveTab("home")}
              className="flex flex-col items-center justify-center px-4 py-1 text-center group cursor-pointer"
            >
              <School className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === "home" ? "text-[#0c5938]" : "text-slate-600"}`} />
              <span className={`text-xs font-bold mt-1 ${activeTab === "home" ? "text-[#0c5938]" : "text-slate-700"}`}>Home</span>
              <span className={`w-full h-1 rounded-full mt-1 ${activeTab === "home" ? "bg-[#0c5938]" : "bg-transparent"}`} />
            </a>

            <div className="h-8 w-px bg-slate-200 mx-1" />

            {/* Colleges Directory */}
            <a
              href="#institutes"
              onClick={() => setActiveTab("institutes")}
              className="flex flex-col items-center justify-center px-3 py-1 text-center text-slate-700 hover:text-[#0c5938] transition-colors group cursor-pointer"
            >
              <Landmark className="w-5 h-5 text-slate-600 group-hover:text-[#0c5938] group-hover:scale-110 transition-all" />
              <span className="text-xs font-semibold mt-1">Colleges Directory</span>
              <span className={`w-full h-1 rounded-full mt-1 ${activeTab === "institutes" ? "bg-[#0c5938]" : "bg-transparent"}`} />
            </a>

            {/* Academic Structure */}
            <a
              href="#academic-structure"
              onClick={() => setActiveTab("academic")}
              className="flex flex-col items-center justify-center px-3 py-1 text-center text-slate-700 hover:text-[#0c5938] transition-colors group cursor-pointer"
            >
              <GraduationCap className="w-5 h-5 text-slate-600 group-hover:text-[#0c5938] group-hover:scale-110 transition-all" />
              <span className="text-xs font-semibold mt-1">Academic Structure</span>
              <span className={`w-full h-1 rounded-full mt-1 ${activeTab === "academic" ? "bg-[#0c5938]" : "bg-transparent"}`} />
            </a>

            {/* Department Info */}
            <a
              href="#department-info"
              onClick={() => setActiveTab("department")}
              className="flex flex-col items-center justify-center px-3 py-1 text-center text-slate-700 hover:text-[#0c5938] transition-colors group cursor-pointer"
            >
              <Info className="w-5 h-5 text-slate-600 group-hover:text-[#0c5938] group-hover:scale-110 transition-all" />
              <span className="text-xs font-semibold mt-1">Department Info</span>
              <span className={`w-full h-1 rounded-full mt-1 ${activeTab === "department" ? "bg-[#0c5938]" : "bg-transparent"}`} />
            </a>

            {/* CHTE Portal Team / Officials */}
            <Link
              href="/login?mode=chte"
              className="flex flex-col items-center justify-center px-3 py-1 text-center text-slate-700 hover:text-[#0c5938] transition-colors group cursor-pointer"
            >
              <Users className="w-5 h-5 text-slate-600 group-hover:text-[#0c5938] group-hover:scale-110 transition-all" />
              <span className="text-xs font-semibold mt-1">CHTE Portal</span>
              <span className="w-full h-1 bg-transparent rounded-full mt-1" />
            </Link>
          </nav>

          {/* Right Action: Login by Institute Pill Button */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/login?mode=institute"
              className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#0c5938] hover:bg-[#09472d] text-white shadow-md shadow-[#0c5938]/25 hover:shadow-lg hover:shadow-[#0c5938]/30 hover:scale-[1.02] active:scale-[0.98] transition-all group"
            >
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left leading-tight">
                <span className="block text-[11px] font-medium opacity-90">Login by</span>
                <span className="block text-xs font-extrabold uppercase tracking-wide">Institute</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* OFFICIAL DEMO PROJECT DEVELOPMENT TICKER (RUNNING MARQUEE)  */}
      {/* ─────────────────────────────────────────────────────────── */}
      {chteSettings.tickerShow !== false && (
        <div className="bg-[#030914] text-white py-2 px-4 sm:px-8 border-y border-emerald-900/20 overflow-hidden shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-400 text-slate-900 text-[11px] font-black tracking-wider uppercase shadow-xs z-10">
              <Sparkles className="w-3.5 h-3.5 text-slate-900" />
              <span>{chteSettings.tickerBadge || "DEVELOPMENT NOTICE:"}</span>
            </div>

            <div className="min-w-0 flex-1 overflow-hidden relative">
              <div className="animate-marquee inline-block whitespace-nowrap text-xs text-slate-200 font-semibold tracking-wide py-0.5">
                <span className="mx-4">{chteSettings.tickerText}</span>
                <span className="text-amber-400 font-bold mx-2">★★★</span>
                <span className="mx-4">{chteSettings.tickerText}</span>
                <span className="text-amber-400 font-bold mx-2">★★★</span>
                <span className="mx-4">{chteSettings.tickerText}</span>
                <span className="text-amber-400 font-bold mx-2">★★★</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. HERO SECTION (WITH BALOCHISTAN SCENERY & GREEN FRAMING)  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-b border-emerald-900/10"
        style={{
          background: `linear-gradient(to right, ${chteSettings.heroBgGradientStart || "#eef8f3"}, #ffffff, ${chteSettings.heroBgGradientEnd || "#eff8f3"})`,
        }}
      >
        {/* Right Scenery Backdrop (Balochistan Mountains, Fort & Calligraphy) */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[56%] pointer-events-none select-none z-0 overflow-hidden">
          {chteSettings.heroSceneryImage && (
            <img
              src={chteSettings.heroSceneryImage}
              alt="Balochistan Landscape"
              className="w-full h-full object-cover transition-transform duration-300"
              style={{
                objectPosition: `${chteSettings.heroSceneryPosX ?? 50}% ${chteSettings.heroSceneryPosY ?? 50}%`,
                transform: `scale(${(chteSettings.heroSceneryZoom ?? 100) / 100})`,
                transformOrigin: `${chteSettings.heroSceneryPosX ?? 50}% ${chteSettings.heroSceneryPosY ?? 50}%`,
              }}
            />
          )}
          {/* Subtle gradient to blend scenic image seamlessly into the left white background */}
          <div className="absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-[#ffffff] via-[#ffffff]/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f8faf9] to-transparent" />
        </div>

        {/* Left Decorative Curve & Geometric Tile Motif */}
        <div className="hidden md:block absolute left-0 bottom-0 w-28 opacity-30 pointer-events-none select-none z-0">
          <Image
            src="/hero-left-pattern.png"
            alt="Balochistan Motif"
            width={112}
            height={190}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Hero Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-10 pb-16 lg:pt-14 lg:pb-24">
          <div className="max-w-2xl space-y-5">
            {/* Top Pill Badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-emerald-600/35 text-[11px] font-bold uppercase tracking-wider shadow-xs backdrop-blur-xs"
              style={{ color: chteSettings.primaryAccentColor || "#0c5938" }}
            >
              <Landmark className="w-3.5 h-3.5" style={{ color: chteSettings.primaryAccentColor || "#0c5938" }} />
              <span>{chteSettings.heroBadge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-[1.08]">
              {chteSettings.heroHeadline.includes("&") ? (
                <>
                  {chteSettings.heroHeadline.split("&")[0]} & <br className="hidden sm:inline" />
                  <span style={{ color: chteSettings.primaryAccentColor || "#0c5938" }} className="block sm:inline mt-1">
                    {chteSettings.heroHeadline.split("&").slice(1).join("&").trim()}
                  </span>
                </>
              ) : (
                <span style={{ color: chteSettings.primaryAccentColor || "#0c5938" }}>
                  {chteSettings.heroHeadline}
                </span>
              )}
            </h1>

            {/* Subtitle Description */}
            <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl">
              {chteSettings.heroSubtitle}
            </p>

            {/* 4 Feature Highlights Row */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0c5938] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#0c5938]" />
                </div>
                <span>Secure & Reliable</span>
              </div>

              <div className="hidden sm:block h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0c5938] flex items-center justify-center flex-shrink-0">
                  <Cloud className="w-4 h-4 text-[#0c5938]" />
                </div>
                <span>Cloud Based Platform</span>
              </div>

              <div className="hidden sm:block h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0c5938] flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-4 h-4 text-[#0c5938]" />
                </div>
                <span>Digital Transformation</span>
              </div>

              <div className="hidden sm:block h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0c5938] flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-[#0c5938]" />
                </div>
                <span>Better Governance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. 4 FLOATING ACTION CARDS ROW                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-8 -mt-8 sm:-mt-10 lg:-mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Colleges Directory */}
          <a
            href="#institutes"
            className="group p-4 bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#e5f5ec] text-[#0c5938] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Landmark className="w-5 h-5 text-[#0c5938]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0c5938] transition-colors truncate">
                  Colleges Directory
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  Explore all government colleges of Balochistan.
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#dcf2e6] text-[#0c5938] flex items-center justify-center flex-shrink-0 group-hover:bg-[#0c5938] group-hover:text-white transition-all">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Card 2: Academic Structure */}
          <a
            href="#academic-structure"
            className="group p-4 bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#e5f5ec] text-[#0c5938] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5 text-[#0c5938]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0c5938] transition-colors truncate">
                  Academic Structure
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  Programs, departments & syllabus information.
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#dcf2e6] text-[#0c5938] flex items-center justify-center flex-shrink-0 group-hover:bg-[#0c5938] group-hover:text-white transition-all">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Card 3: Department Info */}
          <a
            href="#department-info"
            className="group p-4 bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#e5f5ec] text-[#0c5938] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Info className="w-5 h-5 text-[#0c5938]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0c5938] transition-colors truncate">
                  Department Info
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  About CHTE Balochistan and its services.
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#dcf2e6] text-[#0c5938] flex items-center justify-center flex-shrink-0 group-hover:bg-[#0c5938] group-hover:text-white transition-all">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Card 4: CHTE Portal */}
          <Link
            href="/login?mode=chte"
            className="group p-4 bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#e5f5ec] text-[#0c5938] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-[#0c5938]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0c5938] transition-colors truncate">
                  CHTE Portal
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  Officials, contact and central governance.
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#dcf2e6] text-[#0c5938] flex items-center justify-center flex-shrink-0 group-hover:bg-[#0c5938] group-hover:text-white transition-all">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. DECORATIVE OFFICIAL GOVERNMENT RIBBON BAR                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="mt-8 bg-[#093524] text-white py-2.5 px-4 text-center relative overflow-hidden border-y border-emerald-800/40 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-100">
          <div className="hidden sm:block h-px w-24 bg-gradient-to-r from-transparent to-emerald-500/70" />
          <span>GOVERNMENT OF BALOCHISTAN</span>
          <span className="text-emerald-500">|</span>
          <span>HIGHER & TECHNICAL EDUCATION DEPARTMENT</span>
          <div className="hidden sm:block h-px w-24 bg-gradient-to-l from-transparent to-emerald-500/70" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. PROVINCIAL KEY METRICS OVERVIEW                          */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0c5938] flex items-center justify-center mx-auto mb-2.5">
              <Building2 className="w-5 h-5 text-[#0c5938]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{colleges.length}</div>
            <div className="text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
              Affiliated Colleges
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0c5938] flex items-center justify-center mx-auto mb-2.5">
              <GraduationCap className="w-5 h-5 text-[#0c5938]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0c5938]">
              {totalStudents > 0 ? totalStudents.toLocaleString() : "12,450+"}
            </div>
            <div className="text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
              Enrolled Students
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0c5938] flex items-center justify-center mx-auto mb-2.5">
              <Users className="w-5 h-5 text-[#0c5938]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalFaculty > 0 ? totalFaculty.toLocaleString() : "850+"}
            </div>
            <div className="text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
              Teaching Faculty
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0c5938] flex items-center justify-center mx-auto mb-2.5">
              <Layers className="w-5 h-5 text-[#0c5938]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">100%</div>
            <div className="text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
              Automated Operations
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 7. COLLEGES DIRECTORY & PORTAL SELECTOR                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="institutes" className="py-12 sm:py-16 px-4 sm:px-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#0c5938] text-xs font-bold uppercase tracking-widest mb-2">
                <Landmark className="w-3.5 h-3.5 text-[#0c5938]" />
                Institutional Directory
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Colleges Across Balochistan
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Select any college to directly access its custom institutional portal, admission desks, and academic records.
              </p>
            </div>

            <Link
              href="/login?mode=institute"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0c5938] hover:text-[#083e27] self-start md:self-auto bg-emerald-50 hover:bg-emerald-100/70 px-4 py-2 rounded-xl transition-all"
            >
              <span>Instant Login to Any Institute</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search college, code, or principal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0c5938] focus:ring-1 focus:ring-[#0c5938]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto py-1">
              <button
                onClick={() => setSelectedDistrict("ALL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  selectedDistrict === "ALL"
                    ? "bg-[#0c5938] text-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                All Districts ({colleges.length})
              </button>
              {districts.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDistrict(d)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                    selectedDistrict === d
                      ? "bg-[#0c5938] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Colleges Grid */}
          {loading ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              Loading affiliated colleges directory...
            </div>
          ) : filteredColleges.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-200">
              <School className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No colleges matched your search</h3>
              <p className="text-xs text-slate-500 mt-1">Try another keyword or select &quot;All Districts&quot;.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredColleges.map((college) => (
                <div
                  key={college.id}
                  className="rounded-3xl bg-white border border-slate-200/90 p-5 hover:border-emerald-500/50 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Logo, Name, Code */}
                    <div className="flex items-start gap-3.5">
                      {college.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={college.logoUrl}
                          alt={college.name}
                          className="w-12 h-12 object-contain rounded-2xl bg-slate-50 p-1 border border-slate-200 flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.parentElement?.querySelector(".college-fallback-badge") as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="college-fallback-badge w-12 h-12 rounded-2xl bg-[#0c5938] items-center justify-center text-white font-black text-sm shadow-xs flex-shrink-0"
                        style={{ display: college.logoUrl ? "none" : "flex" }}
                      >
                        {college.code.substring(0, 3)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#0c5938] font-mono text-[10px] font-bold border border-emerald-200">
                          {college.code}
                        </span>
                        <Link href={`/colleges/${college.code.toLowerCase()}`} className="block group/link">
                          <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug line-clamp-2 group-hover/link:text-[#0c5938] transition-colors cursor-pointer">
                            {college.name}
                          </h3>
                        </Link>
                        {college.tagline && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{college.tagline}</p>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Stats */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      {college.principalName && (
                        <div className="flex items-center gap-2 truncate">
                          <School className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">
                            Principal: <strong className="text-slate-800">{college.principalName}</strong>
                          </span>
                        </div>
                      )}
                      {college.district && (
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>
                            District: <strong className="text-slate-800">{college.district}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-semibold truncate">
                      {college._count?.programs || 0} Programs Offered
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admission?collegeId=${college.id}&institute=${college.code}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-[#0c5938]" />
                        <span>Apply</span>
                      </Link>

                      <Link
                        href={`/colleges/${college.code.toLowerCase()}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c5938] hover:bg-[#09472d] text-white text-xs font-bold shadow-xs transition-all hover:scale-105"
                      >
                        <span>Visit College Portal</span>
                        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 8. DUAL ACADEMIC WORKFLOWS (INTERMEDIATE & BS)              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="academic-structure" className="py-14 sm:py-20 px-4 sm:px-8 border-t border-slate-200 bg-[#f4faf6]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-[#0c5938] text-xs font-bold uppercase tracking-widest">
              Standardized Governance
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dual-Level Educational Hierarchy
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Each registered college operates with automated, segregation-first academic modules designed specifically for Pakistani college education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Intermediate Card */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-4 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Intermediate (HSSC)</h3>
                  <p className="text-xs text-amber-700 font-semibold">BISE Quetta Board Affiliated</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Streamlined admissions and attendance for F.Sc (Pre-Eng, Pre-Med), I.C.S, and F.A (Special Subjects). Internal examination and GPA modules are disabled as official examinations are conducted by the Board.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Dynamic Subject Combinations managed by Super Admin</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Class Sections & Shift-based Attendance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Intermediate Admission & Verification Challans</span>
                </li>
              </ul>
            </div>

            {/* BS Degree Card */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-4 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0c5938] flex items-center justify-center font-bold">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">BS 4-Year & 5th Semester Bridging</h3>
                  <p className="text-xs text-[#0c5938] font-semibold">HEC & University of Balochistan Standard</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Full-scale semester examination engine. Supports Regular BS (Semesters 1-8) and Bridging 5th Semester Lateral Entry for ADA/ADS graduates with specialized CGPA calculation logic.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>HEC 4.0 Linear GPA/CGPA with Bridging semester filtering</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Official Gazette, DMC, and Official Transcript Generator</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Timetable & Datesheet Conflict Warning System</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 9. DEPARTMENT LEADERSHIP & GOVERNANCE CELL                  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="department-info" className="py-14 sm:py-20 px-4 sm:px-8 border-t border-slate-200 bg-[#f8faf9]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-[#0c5938] text-xs font-bold uppercase tracking-widest">
              Department Leadership
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Higher & Technical Education Department
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Dedicated to academic excellence, digital transparency, and institutional modernization across all government colleges of Balochistan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0c5938] flex items-center justify-center">
                <Landmark className="w-5 h-5 text-[#0c5938]" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Central Governance Cloud</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connects 50+ government degree and postgraduate colleges to a single centralized database, eliminating manual paper records and gazette delays.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0c5938] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#0c5938]" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Affiliation & Compliance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seamless synchronization with BISE Quetta regulations for HSSC and Higher Education Commission (HEC) standards for 4-year BS programs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0c5938] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0c5938]" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Direct Faculty & Student Desk</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Role-based access controls for principals, HODs, teachers, and examination controllers with instant timetable and datesheet conflict monitoring.
              </p>
            </div>
          </div>

          {/* Dynamic Featured Leadership & Key Officials Profiles */}
          {Array.isArray(chteSettings.featuredProfiles) && chteSettings.featuredProfiles.length > 0 && (
            <div className="pt-8 border-t border-slate-200/80 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      Provincial Leadership & Featured Profiles
                    </h3>
                    <p className="text-xs text-slate-500">
                      Apex leadership driving educational innovation and academic governance across Balochistan.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                  {chteSettings.featuredProfiles.length} Featured Profiles
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chteSettings.featuredProfiles.map((p: ChteFeaturedProfile) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      {/* Photo & Identity Row */}
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-600/30 bg-slate-100 shadow-md relative flex-shrink-0">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              style={{
                                objectPosition: `${p.posX ?? 50}% ${p.posY ?? 50}%`,
                                transform: `scale(${(p.zoom ?? 100) / 100})`,
                                transformOrigin: `${p.posX ?? 50}% ${p.posY ?? 50}%`,
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                              <User className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                            style={{
                              backgroundColor:
                                p.category === "SECRETARY"
                                  ? "#e0f2fe"
                                  : p.category === "MINISTER"
                                  ? "#fef3c7"
                                  : p.category === "DIRECTOR"
                                  ? "#dcfce7"
                                  : "#f3e8ff",
                              color:
                                p.category === "SECRETARY"
                                  ? "#0369a1"
                                  : p.category === "MINISTER"
                                  ? "#b45309"
                                  : p.category === "DIRECTOR"
                                  ? "#15803d"
                                  : "#7e22ce",
                            }}
                          >
                            {p.category}
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                            {p.name}
                          </h4>
                          <p className="text-xs font-bold text-emerald-800 leading-tight">
                            {p.role}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">
                            {p.department}
                          </p>
                        </div>
                      </div>

                      {/* Quote / Message */}
                      {p.quote && (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 italic relative">
                          <Quote className="w-3.5 h-3.5 text-emerald-600 mb-1 inline-block mr-1 opacity-70" />
                          <span>&ldquo;{p.quote}&rdquo;</span>
                        </div>
                      )}

                      {p.message && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {p.message}
                        </p>
                      )}
                    </div>

                    {/* Contact Badges */}
                    {(p.email || p.phone) && (
                      <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px]">
                        {p.email && (
                          <a
                            href={`mailto:${p.email}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors font-medium truncate max-w-[200px]"
                            title={p.email}
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span className="truncate">{p.email}</span>
                          </a>
                        )}
                        {p.phone && (
                          <a
                            href={`tel:${p.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors font-medium"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{p.phone}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 10. OFFICIAL FOOTER                                         */}
      {/* ─────────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-[#072a1d] text-emerald-100 border-t border-[#051f15] px-4 sm:px-8 py-12 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-emerald-200/80">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Image
                src="/balochistan-seal.png"
                alt="CHTE Balochistan"
                width={40}
                height={40}
                className="w-10 h-10 object-contain rounded-full bg-white/10 p-0.5"
              />
              <div>
                <span className="font-black text-white text-sm block">CHTE BALOCHISTAN</span>
                <span className="text-[10px] text-emerald-300 font-semibold">Government of Balochistan</span>
              </div>
            </div>
            <p className="leading-relaxed">
              Higher & Technical Education Department, Government of Balochistan, Zarghoon Road, Quetta.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Official Portals
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login?mode=institute" className="hover:text-white transition-colors">
                  Login by Institute
                </Link>
              </li>
              <li>
                <Link href="/login?mode=chte" className="hover:text-white transition-colors">
                  CHTE Admin Login
                </Link>
              </li>
              <li>
                <a href="#institutes" className="hover:text-white transition-colors">
                  Affiliated Colleges Registry
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Affiliated Authorities
            </h4>
            <ul className="space-y-2">
              <li>University of Balochistan (UoB)</li>
              <li>Board of Intermediate & Secondary Education (BBISE Quetta)</li>
              <li>Higher Education Commission (HEC Pakistan)</li>
              <li>Technical Education & Vocational Training Authority (B-TEVTA)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Helpdesk & Support
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>+92 81 9201234</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>info@chte.balochistan.gov.pk</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Civil Secretariat, Quetta</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-[#0b3d2b] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-emerald-300/80">
          <div>
            © {new Date().getFullYear()} Higher & Technical Education (CHTE) Balochistan. All Rights Reserved.
          </div>
          <div className="flex gap-4">
            <Link href="/login?mode=chte" className="hover:text-white">
              CHTE Admin
            </Link>
            <Link href="/login?mode=institute" className="hover:text-white">
              Institute Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
