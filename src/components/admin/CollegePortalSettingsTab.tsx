"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Palette,
  Video,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Save,
  CheckCircle2,
  Upload,
  Share2,
  Building,
  AlertCircle,
  Plus,
  Trash2,
  User,
  Loader2,
  Quote,
  Award,
  Play,
  Sliders,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Landmark
} from "lucide-react";

type CollegeOption = {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  tagline: string | null;
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

export default function CollegePortalSettingsTab({ onSwitchToChte }: { onSwitchToChte?: () => void } = {}) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userCollegeId = (session?.user as any)?.collegeId;
  const isChteAdmin = userRole === "SUPER_ADMIN" || userRole === "CHTE_ADMIN";

  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | ""; text: string }>({ type: "", text: "" });

  // Upload States
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingProfileId, setUploadingProfileId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    collegeName: "",
    tagline: "",
    logoUrl: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    principalName: "",

    // Colors
    primaryColor: "#040d1a",
    ribbonColor: "#dc2626", // Red patii
    bodyBgColor: "#070d19",

    // Hero Media
    heroBgType: "IMAGE" as "IMAGE" | "VIDEO",
    heroBgUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
    heroImgZoom: 100, // 50% - 250%
    heroImgPosX: 50,  // 0% - 100% (Left to Right)
    heroImgPosY: 50,  // 0% - 100% (Top to Bottom)
    heroBadge: "EXCELLENCE IN HIGHER EDUCATION",
    heroTitle: "",
    heroSubtitle: "A historic institution committed to academic excellence, higher research, and professional student development.",

    // Ticker
    noticeTickerShow: true,
    noticeBadge: "DEVELOPMENT NOTICE:",
    noticeTickerText: "Demo Project | Under development by Israr Ahmed (Computer Programmer, Govt. Postgraduate College, Sariab Road, Quetta)",

    // Social Links
    socialX: "https://x.com",
    socialFacebook: "https://facebook.com",
    socialYoutube: "https://youtube.com",
    socialLinkedin: "https://linkedin.com",
    socialInstagram: "https://instagram.com",

    // Featured Profiles
    featuredProfiles: [] as FeaturedProfile[],
  });

  // Helper to upload any file directly
  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "File upload failed");
    }
    const data = await res.json();
    return data.url;
  };

  // 1. Fetch colleges
  useEffect(() => {
    fetch("/api/public/colleges")
      .then((res) => res.json())
      .then((data: CollegeOption[]) => {
        setColleges(data || []);
        if (data && data.length > 0) {
          const targetId = userCollegeId || data[0].id;
          setSelectedCollegeId(targetId);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [userCollegeId]);

  // 2. Load settings when selectedCollegeId changes
  useEffect(() => {
    if (!selectedCollegeId) return;
    setLoading(true);
    fetch(`/api/colleges/${selectedCollegeId}/portal-settings`)
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          collegeName: data.collegeName || data.heroTitle || "",
          tagline: data.tagline || "",
          logoUrl: data.logoUrl || "",
          address: data.address || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          principalName: data.principalName || "",

          primaryColor: data.primaryColor || "#040d1a",
          ribbonColor: data.ribbonColor || "#dc2626",
          bodyBgColor: data.bodyBgColor || "#070d19",

          heroBgType: data.heroBgType || "IMAGE",
          heroBgUrl: data.heroBgUrl || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
          heroImgZoom: typeof data.heroImgZoom === "number" ? data.heroImgZoom : 100,
          heroImgPosX: typeof data.heroImgPosX === "number" ? data.heroImgPosX : 50,
          heroImgPosY: typeof data.heroImgPosY === "number" ? data.heroImgPosY : 50,
          heroBadge: data.heroBadge || "EXCELLENCE IN HIGHER EDUCATION",
          heroTitle: data.heroTitle || data.collegeName || "",
          heroSubtitle: data.heroSubtitle || "",

          noticeTickerShow: data.noticeTickerShow !== false,
          noticeBadge: data.noticeBadge || "DEVELOPMENT NOTICE:",
          noticeTickerText: data.noticeTickerText || "",

          socialX: data.socialLinks?.x || "",
          socialFacebook: data.socialLinks?.facebook || "",
          socialYoutube: data.socialLinks?.youtube || "",
          socialLinkedin: data.socialLinks?.linkedin || "",
          socialInstagram: data.socialLinks?.instagram || "",

          featuredProfiles: Array.isArray(data.featuredProfiles) && data.featuredProfiles.length > 0
            ? data.featuredProfiles
            : [
                {
                  id: "prof-1",
                  name: data.principalName || "Prof. Dr. Zahid Mengal",
                  designation: "Principal & Head of Institution",
                  department: "Office of the Principal",
                  category: "PRINCIPAL",
                  photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80",
                  quote: "Committed to fostering academic distinction, critical inquiry, and character development for Balochistan's brightest minds.",
                  message: `Welcome to our campus portal. We provide an inclusive learning sanctuary where academic rigor meets modern technological advancement.`,
                  email: data.contactEmail || "principal@college.edu.pk",
                  phone: data.contactPhone || "+92 81 9211000",
                  order: 1
                }
              ]
        });
      })
      .catch((err) => console.error("Error loading portal settings:", err))
      .finally(() => setLoading(false));
  }, [selectedCollegeId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollegeId) return;

    setSaving(true);
    setMsg({ type: "", text: "" });

    const payload = {
      collegeName: formData.collegeName,
      tagline: formData.tagline,
      logoUrl: formData.logoUrl,
      address: formData.address,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      principalName: formData.principalName,

      primaryColor: formData.primaryColor,
      ribbonColor: formData.ribbonColor,
      bodyBgColor: formData.bodyBgColor,

      heroBgType: formData.heroBgType,
      heroBgUrl: formData.heroBgUrl,
      heroImgZoom: formData.heroImgZoom,
      heroImgPosX: formData.heroImgPosX,
      heroImgPosY: formData.heroImgPosY,
      heroBadge: formData.heroBadge,
      heroTitle: formData.heroTitle,
      heroSubtitle: formData.heroSubtitle,

      noticeTickerShow: formData.noticeTickerShow,
      noticeBadge: formData.noticeBadge,
      noticeTickerText: formData.noticeTickerText,

      socialLinks: {
        x: formData.socialX,
        facebook: formData.socialFacebook,
        youtube: formData.socialYoutube,
        linkedin: formData.socialLinkedin,
        instagram: formData.socialInstagram,
      },

      featuredProfiles: formData.featuredProfiles,
    };

    try {
      const res = await fetch(`/api/colleges/${selectedCollegeId}/portal-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "College Portal, Photos, Videos & Featured Profiles saved successfully!" });
      } else {
        setMsg({ type: "error", text: resData.error || "Failed to save settings." });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Server error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  const addFeaturedProfile = () => {
    const newProfile: FeaturedProfile = {
      id: `prof-${Date.now()}`,
      name: "New Faculty / Leadership Member",
      designation: "Assistant Professor / Dean",
      department: "Academic Department",
      category: "FACULTY",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80",
      quote: "Inspiring academic curiosity and higher learning standards.",
      message: "Dedicated to student mentoring, scientific research, and academic leadership.",
      email: "faculty@college.edu.pk",
      phone: "+92 81 9200000",
      order: formData.featuredProfiles.length + 1,
    };

    setFormData((prev) => ({
      ...prev,
      featuredProfiles: [...prev.featuredProfiles, newProfile],
    }));
  };

  const removeFeaturedProfile = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      featuredProfiles: prev.featuredProfiles.filter((p) => p.id !== id),
    }));
  };

  const updateFeaturedProfile = (id: string, updates: Partial<FeaturedProfile>) => {
    setFormData((prev) => ({
      ...prev,
      featuredProfiles: prev.featuredProfiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const selectedCollege = colleges.find((c) => c.id === selectedCollegeId);

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER / COLLEGE SELECTOR ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <Palette className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">College Portal & Theme Customization</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload direct photos/videos, configure "red patii", body colors, and manage featured profiles for your portal.
              </p>
            </div>
          </div>
        </div>

        {/* College Selector (For Super Admin or CHTE Admin) & CHTE Main Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {isChteAdmin ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Select Entity:</span>
              <select
                value={selectedCollegeId}
                onChange={(e) => {
                  if (e.target.value === "CHTE_MAIN") {
                    if (onSwitchToChte) onSwitchToChte();
                  } else {
                    setSelectedCollegeId(e.target.value);
                  }
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <optgroup label="🏛️ Provincial Apex Platform">
                  <option value="CHTE_MAIN">
                    🏛️ [CHTE MAIN] CHTE Central Homepage & Portal
                  </option>
                </optgroup>
                <optgroup label="🏫 Affiliated Balochistan Colleges">
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>

              {onSwitchToChte && (
                <button
                  type="button"
                  onClick={onSwitchToChte}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0c5938] border border-emerald-200 text-xs font-bold transition-all shadow-2xs hover:scale-102"
                  title="Configure CHTE Central Homepage"
                >
                  <Landmark className="w-3.5 h-3.5 text-[#0c5938]" />
                  <span>CHTE Main Settings</span>
                </button>
              )}
            </div>
          ) : (
            /* College Admin view: ONLY shows their assigned college */
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Configuring Portal:</span>
              <span className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800">
                {selectedCollege ? `[${selectedCollege.code}] ${selectedCollege.name}` : "Assigned College Portal"}
              </span>
            </div>
          )}

          {selectedCollege && (
            <a
              href={`/colleges/${selectedCollege.code.toLowerCase()}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs hover:scale-105"
            >
              <span>Preview Live Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fadeIn ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-bold">Loading portal settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* ── SECTION 1: THEME COLORS & "RED PATII" ── */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Palette className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Theme Colors & Ribbon Bar ("Red Patii")</h3>
                <p className="text-xs text-slate-500">
                  Configure the primary header color, the top accent ribbon ("red patii"), and overall background color.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Color 1: Ribbon Bar ("Red Patii") */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Ribbon Color ("Red Patii" / سُرخ پٹی)
                  </label>
                  <div
                    className="w-6 h-6 rounded-md border border-slate-300 shadow-inner"
                    style={{ backgroundColor: formData.ribbonColor }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.ribbonColor}
                    onChange={(e) => setFormData({ ...formData, ribbonColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.ribbonColor}
                    onChange={(e) => setFormData({ ...formData, ribbonColor: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                {/* Quick Presets for Ribbon */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "Red", hex: "#dc2626" },
                      { name: "Crimson", hex: "#991b1b" },
                      { name: "Green", hex: "#0c5938" },
                      { name: "Navy", hex: "#1e3a8a" },
                      { name: "Purple", hex: "#7c3aed" },
                      { name: "Gold", hex: "#d97706" },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setFormData({ ...formData, ribbonColor: c.hex })}
                        className="px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-xs hover:scale-105 transition-transform"
                        style={{ backgroundColor: c.hex }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color 2: Primary / Header Color */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Primary / Header Color
                  </label>
                  <div
                    className="w-6 h-6 rounded-md border border-slate-300 shadow-inner"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                {/* Quick Presets for Header */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "Deep Navy", hex: "#040d1a" },
                      { name: "Slate 900", hex: "#0f172a" },
                      { name: "Forest", hex: "#083b25" },
                      { name: "Midnight", hex: "#081329" },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setFormData({ ...formData, primaryColor: c.hex })}
                        className="px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-xs hover:scale-105 transition-transform"
                        style={{ backgroundColor: c.hex }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color 3: Body Background Color */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Body Background Color
                  </label>
                  <div
                    className="w-6 h-6 rounded-md border border-slate-300 shadow-inner"
                    style={{ backgroundColor: formData.bodyBgColor }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.bodyBgColor}
                    onChange={(e) => setFormData({ ...formData, bodyBgColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.bodyBgColor}
                    onChange={(e) => setFormData({ ...formData, bodyBgColor: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                {/* Quick Presets for Body */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "Dark Theme", hex: "#070d19" },
                      { name: "Midnight", hex: "#0a1128" },
                      { name: "Light Theme", hex: "#f8fafc" },
                      { name: "Pure White", hex: "#ffffff" },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setFormData({ ...formData, bodyBgColor: c.hex })}
                        className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-800 bg-white border border-slate-300 shadow-xs hover:scale-105 transition-transform"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: HERO MEDIA WITH DIRECT PHOTO OR VIDEO UPLOAD ── */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Hero Section Background (Direct Video ya Picture Upload)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose background video or picture, and directly upload files from your computer or provide a URL.
                  </p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, heroBgType: "IMAGE" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    formData.heroBgType === "IMAGE"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Picture / Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, heroBgType: "VIDEO" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    formData.heroBgType === "VIDEO"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Background Video</span>
                </button>
              </div>
            </div>

            {/* Direct Upload Box + URL Input */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {formData.heroBgType === "VIDEO" ? "Upload Background Video" : "Upload Background Photo"}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {formData.heroBgType === "VIDEO"
                      ? "Directly upload an MP4 or WebM video file to loop in the hero background."
                      : "Directly upload a high-resolution JPG, PNG, or WebP picture."}
                  </p>
                </div>

                {/* Direct Upload Button */}
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all flex-shrink-0">
                  {uploadingHero ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : formData.heroBgType === "VIDEO" ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>
                    {uploadingHero
                      ? "Uploading File..."
                      : formData.heroBgType === "VIDEO"
                      ? "Direct Upload Video (MP4 / WebM)"
                      : "Direct Upload Picture (JPG / PNG)"}
                  </span>
                  <input
                    type="file"
                    accept={formData.heroBgType === "VIDEO" ? "video/mp4,video/webm,video/*" : "image/*"}
                    className="hidden"
                    disabled={uploadingHero}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setUploadingHero(true);
                        const url = await uploadFile(file);
                        setFormData((prev) => ({ ...prev, heroBgUrl: url }));
                        setMsg({ type: "success", text: `Successfully uploaded ${file.name}!` });
                      } catch (err: any) {
                        setMsg({ type: "error", text: err.message || "Failed to upload file." });
                      } finally {
                        setUploadingHero(false);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Media URL Input */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  {formData.heroBgType === "VIDEO" ? "Video File URL / Path" : "Picture File URL / Path"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={
                      formData.heroBgType === "VIDEO"
                        ? "/uploads/... or https://example.com/video.mp4"
                        : "/uploads/... or https://images.unsplash.com/..."
                    }
                    value={formData.heroBgUrl}
                    onChange={(e) => setFormData({ ...formData, heroBgUrl: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 font-mono"
                  />
                  {formData.heroBgUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, heroBgUrl: "" })}
                      className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-red-600 bg-white border border-slate-200 rounded-xl transition-colors"
                      title="Clear"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Live Preview Player / Thumbnail */}
              {formData.heroBgUrl && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Live Hero Framing Preview:
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Scale: {formData.heroImgZoom}% | Pos: {formData.heroImgPosX}% X, {formData.heroImgPosY}% Y
                    </span>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 h-56 flex items-center justify-center shadow-inner group">
                    {formData.heroBgType === "VIDEO" ? (
                      <video
                        src={formData.heroBgUrl}
                        controls
                        autoPlay
                        muted
                        loop
                        className="w-full h-full object-cover transition-all duration-200"
                        style={{
                          objectPosition: `${formData.heroImgPosX}% ${formData.heroImgPosY}%`,
                          transform: `scale(${formData.heroImgZoom / 100})`,
                          transformOrigin: `${formData.heroImgPosX}% ${formData.heroImgPosY}%`,
                        }}
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={formData.heroBgUrl}
                        alt="Hero Preview"
                        className="w-full h-full object-cover transition-all duration-200"
                        style={{
                          objectPosition: `${formData.heroImgPosX}% ${formData.heroImgPosY}%`,
                          transform: `scale(${formData.heroImgZoom / 100})`,
                          transformOrigin: `${formData.heroImgPosX}% ${formData.heroImgPosY}%`,
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}

                    {/* Subtle Overlay Guide Grid for Alignment */}
                    <div className="absolute inset-0 border border-white/10 pointer-events-none flex items-center justify-center">
                      <div className="w-full h-[1px] bg-white/10" />
                      <div className="h-full w-[1px] bg-white/10 absolute" />
                    </div>
                  </div>
                </div>
              )}

              {/* Picture / Video Zoom & Horizontal/Vertical Alignment Controls */}
              {formData.heroBgUrl && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Picture Framing, Zoom & Alignment Controls (تصویر کا زوم، افقی اور عمودی رخ)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          heroImgZoom: 100,
                          heroImgPosX: 50,
                          heroImgPosY: 50,
                        })
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Center (100%)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. Zoom Slider */}
                    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                          <span>Zoom In / Out</span>
                        </span>
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[11px]">
                          {formData.heroImgZoom}%
                        </span>
                      </div>

                      <input
                        type="range"
                        min="50"
                        max="250"
                        step="5"
                        value={formData.heroImgZoom}
                        onChange={(e) =>
                          setFormData({ ...formData, heroImgZoom: Number(e.target.value) })
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />

                      <div className="flex items-center justify-between gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              heroImgZoom: Math.max(50, formData.heroImgZoom - 10),
                            })
                          }
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1 shadow-2xs"
                        >
                          <ZoomOut className="w-3 h-3" />
                          <span>-10%</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, heroImgZoom: 100 })}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 shadow-2xs"
                        >
                          100%
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              heroImgZoom: Math.min(250, formData.heroImgZoom + 10),
                            })
                          }
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1 shadow-2xs"
                        >
                          <ZoomIn className="w-3 h-3" />
                          <span>+10%</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Horizontal Position Slider (Left / Right) */}
                    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Move className="w-3.5 h-3.5 text-amber-600" />
                          <span>Horizontal (Left / Right)</span>
                        </span>
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                          {formData.heroImgPosX}% {formData.heroImgPosX < 45 ? "Left" : formData.heroImgPosX > 55 ? "Right" : "Center"}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.heroImgPosX}
                        onChange={(e) =>
                          setFormData({ ...formData, heroImgPosX: Number(e.target.value) })
                        }
                        className="w-full accent-amber-500 cursor-pointer"
                      />

                      <div className="flex items-center justify-between gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, heroImgPosX: 0 })}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 shadow-2xs"
                        >
                          Left (0%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, heroImgPosX: 50 })}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 shadow-2xs"
                        >
                          Center (50%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, heroImgPosX: 100 })}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 shadow-2xs"
                        >
                          Right (100%)
                        </button>
                      </div>
                    </div>

                    {/* 3. Vertical Position Slider (Top / Bottom) */}
                    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Move className="w-3.5 h-3.5 text-emerald-600 rotate-90" />
                          <span>Vertical (Top / Bottom)</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          {formData.heroImgPosY}% {formData.heroImgPosY < 45 ? "Top" : formData.heroImgPosY > 55 ? "Bottom" : "Middle"}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.heroImgPosY}
                        onChange={(e) =>
                          setFormData({ ...formData, heroImgPosY: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-500 cursor-pointer"
                      />

                      <div className="flex items-center justify-between gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, heroImgPosY: 0 })}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 shadow-2xs"
                        >
                          Top (0%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, heroImgPosY: 50 })}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 shadow-2xs"
                        >
                          Middle (50%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, heroImgPosY: 100 })}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 shadow-2xs"
                        >
                          Bottom (100%)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Framing Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Framing Presets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, heroImgZoom: 100, heroImgPosX: 50, heroImgPosY: 50 })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      🎯 Default Center
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, heroImgZoom: 115, heroImgPosX: 50, heroImgPosY: 15 })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      🔼 Sky / Top Focus
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, heroImgZoom: 115, heroImgPosX: 50, heroImgPosY: 85 })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      🔽 Ground / Campus Focus
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, heroImgZoom: 140, heroImgPosX: 50, heroImgPosY: 40 })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      🔍 Cinematic Close-up
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Image Presets */}
              {formData.heroBgType === "IMAGE" && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Graphic Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          heroBgUrl:
                            "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&q=80",
                        })
                      }
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all"
                    >
                      🌌 Space & Starfield (From Screenshot)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          heroBgUrl:
                            "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
                        })
                      }
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all"
                    >
                      🏛️ Academic Campus
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, heroBgUrl: "/balochistan-landscape.png" })}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all"
                    >
                      🏔️ Balochistan Landscape
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Video Presets */}
              {formData.heroBgType === "VIDEO" && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Sample Video Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          heroBgUrl:
                            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                        })
                      }
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 text-indigo-600" />
                      <span>Campus Presentation Sample Video</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hero Text Customization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Hero Floating Badge Text</label>
                <input
                  type="text"
                  value={formData.heroBadge}
                  onChange={(e) => setFormData({ ...formData, heroBadge: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Hero Main Title</label>
                <input
                  type="text"
                  value={formData.heroTitle}
                  onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">Hero Subtitle / Description</label>
                <textarea
                  rows={2}
                  value={formData.heroSubtitle}
                  onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── SECTION 3: COLLEGE IDENTITY & LOGO UPLOAD ── */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">College Identity & Logo Upload</h3>
                <p className="text-xs text-slate-500">
                  Update college display name, directly upload college emblem/logo, and set contact information.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">College Full Name</label>
                <input
                  type="text"
                  value={formData.collegeName}
                  onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              {/* Direct Logo Upload */}
              <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {formData.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="w-14 h-14 object-contain rounded-xl bg-white border border-slate-200 p-1 flex-shrink-0 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-200 text-slate-500 font-bold flex items-center justify-center flex-shrink-0">
                      LOGO
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">College Official Emblem / Logo</span>
                    <span className="text-[11px] text-slate-500">
                      Direct upload PNG, SVG or JPG with transparent or light background.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all">
                    {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{uploadingLogo ? "Uploading..." : "Direct Upload Logo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingLogo}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setUploadingLogo(true);
                          const url = await uploadFile(file);
                          setFormData((prev) => ({ ...prev, logoUrl: url }));
                          setMsg({ type: "success", text: "College logo uploaded successfully!" });
                        } catch (err: any) {
                          setMsg({ type: "error", text: err.message || "Failed to upload logo." });
                        } finally {
                          setUploadingLogo(false);
                        }
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="or paste URL"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-36 sm:w-44 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Principal Name</label>
                <input
                  type="text"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Campus Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Official Phone Number</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── SECTION 4: FEATURED PROFILES & CAMPUS LEADERSHIP (فیچرڈ پروفائلز) ── */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Featured Profiles & Leadership (فیچرڈ پروفائلز اور پیغامات)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Showcase Principal Message, Vice Principal, Faculty Deans, and Notable Scholars on your homepage.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addFeaturedProfile}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Featured Profile</span>
              </button>
            </div>

            {formData.featuredProfiles.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <User className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No Featured Profiles Configured Yet</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click the "+ Add Featured Profile" button above to spotlight the Principal, Deans, or Outstanding Faculty.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.featuredProfiles.map((profile, idx) => (
                  <div
                    key={profile.id}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <strong className="text-sm font-bold text-slate-900 block">{profile.name}</strong>
                          <span className="text-[11px] text-slate-500 font-semibold">{profile.designation}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Category Selector */}
                        <select
                          value={profile.category}
                          onChange={(e) =>
                            updateFeaturedProfile(profile.id, {
                              category: e.target.value as any,
                            })
                          }
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value="PRINCIPAL">Principal's Desk / Message</option>
                          <option value="DEAN">Dean / Vice Principal</option>
                          <option value="FACULTY">Distinguished Faculty</option>
                          <option value="ALUMNI">Notable Alumni Spotlight</option>
                        </select>

                        {/* Delete Profile */}
                        <button
                          type="button"
                          onClick={() => removeFeaturedProfile(profile.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => updateFeaturedProfile(profile.id, { name: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none"
                        />
                      </div>

                      {/* Designation */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Designation / Title</label>
                        <input
                          type="text"
                          value={profile.designation}
                          onChange={(e) => updateFeaturedProfile(profile.id, { designation: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Department / Office</label>
                        <input
                          type="text"
                          value={profile.department || ""}
                          onChange={(e) => updateFeaturedProfile(profile.id, { department: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>

                      {/* Photo Direct Upload & URL */}
                      <div className="sm:col-span-2 lg:col-span-3 p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={profile.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80"}
                            alt={profile.name}
                            className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80";
                            }}
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Profile Photo</span>
                            <span className="text-[10px] text-slate-500">
                              Upload portrait picture directly from your computer.
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all">
                            {uploadingProfileId === profile.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>{uploadingProfileId === profile.id ? "Uploading..." : "Direct Upload Photo"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingProfileId === profile.id}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  setUploadingProfileId(profile.id);
                                  const url = await uploadFile(file);
                                  updateFeaturedProfile(profile.id, { photoUrl: url });
                                  setMsg({ type: "success", text: `Uploaded photo for ${profile.name}!` });
                                } catch (err: any) {
                                  setMsg({ type: "error", text: err.message || "Failed to upload photo." });
                                } finally {
                                  setUploadingProfileId(null);
                                }
                              }}
                            />
                          </label>

                          <input
                            type="text"
                            placeholder="or Photo URL"
                            value={profile.photoUrl}
                            onChange={(e) => updateFeaturedProfile(profile.id, { photoUrl: e.target.value })}
                            className="w-36 sm:w-48 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Quote */}
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Quote className="w-3 h-3 text-amber-500" />
                          <span>Inspirational Quote / Motto (مختصر پیغام یا اقتباس)</span>
                        </label>
                        <input
                          type="text"
                          value={profile.quote || ""}
                          onChange={(e) => updateFeaturedProfile(profile.id, { quote: e.target.value })}
                          placeholder="e.g. Committed to academic excellence and youth development..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none italic"
                        />
                      </div>

                      {/* Detailed Message */}
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Full Message / Profile Bio (تفصیلی پیغام یا بائیوگرافی)
                        </label>
                        <textarea
                          rows={2}
                          value={profile.message || ""}
                          onChange={(e) => updateFeaturedProfile(profile.id, { message: e.target.value })}
                          placeholder="Welcome message or detailed academic background..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>

                      {/* Email & Phone */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Email</label>
                        <input
                          type="email"
                          value={profile.email || ""}
                          onChange={(e) => updateFeaturedProfile(profile.id, { email: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={profile.phone || ""}
                          onChange={(e) => updateFeaturedProfile(profile.id, { phone: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── SECTION 5: DEVELOPMENT NOTICE & FLASH TICKER ── */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Development Notice / Flash Ticker Bar</h3>
                  <p className="text-xs text-slate-500">
                    The top notice banner under the main header (as shown in your screenshot).
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.noticeTickerShow}
                  onChange={(e) => setFormData({ ...formData, noticeTickerShow: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-bold text-slate-700">Display Notice Bar</span>
              </label>
            </div>

            {formData.noticeTickerShow && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={formData.noticeBadge}
                    onChange={(e) => setFormData({ ...formData, noticeBadge: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">Announcement Text</label>
                  <input
                    type="text"
                    value={formData.noticeTickerText}
                    onChange={(e) => setFormData({ ...formData, noticeTickerText: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 6: SOCIAL MEDIA LINKS ── */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Share2 className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Social Media Links (سوشل لنکس)</h3>
                <p className="text-xs text-slate-500">
                  Icons displayed on the right side of the ribbon bar ("red patii").
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">X (Twitter) URL</label>
                <input
                  type="text"
                  placeholder="https://x.com/yourcollege"
                  value={formData.socialX}
                  onChange={(e) => setFormData({ ...formData, socialX: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Facebook URL</label>
                <input
                  type="text"
                  placeholder="https://facebook.com/yourcollege"
                  value={formData.socialFacebook}
                  onChange={(e) => setFormData({ ...formData, socialFacebook: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">YouTube URL</label>
                <input
                  type="text"
                  placeholder="https://youtube.com/@yourcollege"
                  value={formData.socialYoutube}
                  onChange={(e) => setFormData({ ...formData, socialYoutube: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/school/yourcollege"
                  value={formData.socialLinkedin}
                  onChange={(e) => setFormData({ ...formData, socialLinkedin: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instagram URL</label>
                <input
                  type="text"
                  placeholder="https://instagram.com/yourcollege"
                  value={formData.socialInstagram}
                  onChange={(e) => setFormData({ ...formData, socialInstagram: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* ── BOTTOM ACTIONS ── */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-30">
            <div className="text-xs text-slate-500 font-semibold">
              Configuring portal for: <strong className="text-slate-900">{formData.collegeName || "Selected College"}</strong>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {selectedCollege && (
                <a
                  href={`/colleges/${selectedCollege.code.toLowerCase()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Preview Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Changes..." : "Save Portal Settings"}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
