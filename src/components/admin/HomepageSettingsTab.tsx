"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Save,
  CheckCircle2,
  Upload,
  Building,
  AlertCircle,
  Plus,
  Trash2,
  User,
  Loader2,
  Quote,
  Award,
  Layers,
  Sparkle,
  ShieldAlert,
  Landmark,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import InteractivePhotoController from "./InteractivePhotoController";
import {
  PhotoFitMode,
  PhotoFramingConfig,
  buildPhotoTransformStyle,
  getShapeRadiusClasses,
  resolveSlideFraming,
} from "@/lib/photo-framing";
import { ChteFeaturedProfile, DEFAULT_CHTE_SETTINGS } from "@/lib/chte-settings";

export default function HomepageSettingsTab({
  focusedSection,
  jumpTargetId,
  jumpSeq,
}: {
  focusedSection?: string;
  jumpTargetId?: string;
  jumpSeq?: number;
} = {}) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isChteAdmin = userRole === "SUPER_ADMIN" || userRole === "CHTE_ADMIN";

  useEffect(() => {
    if (!jumpTargetId) return;
    const t = setTimeout(() => {
      document.getElementById(jumpTargetId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => clearTimeout(t);
  }, [jumpTargetId, jumpSeq]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | ""; text: string }>({ type: "", text: "" });

  // Upload States
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingScenery, setUploadingScenery] = useState(false);
  const [uploadingProfileId, setUploadingProfileId] = useState<string | null>(null);
  const [activeScenerySlideIdx, setActiveScenerySlideIdx] = useState<number>(0);

  // Form State
  const [formData, setFormData] = useState({
    // Colors
    pageBgColor: DEFAULT_CHTE_SETTINGS.pageBgColor,
    heroBgGradientStart: DEFAULT_CHTE_SETTINGS.heroBgGradientStart,
    heroBgGradientEnd: DEFAULT_CHTE_SETTINGS.heroBgGradientEnd,
    primaryAccentColor: DEFAULT_CHTE_SETTINGS.primaryAccentColor,

    // Official Government Emblem / CHTE Seal
    govtLogo: DEFAULT_CHTE_SETTINGS.govtLogo || "/balochistan-seal.png",

    // Text & Titles
    topMottoText: DEFAULT_CHTE_SETTINGS.topMottoText,
    heroBadge: DEFAULT_CHTE_SETTINGS.heroBadge,
    heroHeadline: DEFAULT_CHTE_SETTINGS.heroHeadline,
    heroSubtitle: DEFAULT_CHTE_SETTINGS.heroSubtitle,

    // Scenery Photo with Framing & Multiple Slides
    heroSceneryImage: DEFAULT_CHTE_SETTINGS.heroSceneryImage,
    heroSceneryImages: DEFAULT_CHTE_SETTINGS.heroSceneryImages || ["/hero-scenery.png"],
    heroSceneryZoom: DEFAULT_CHTE_SETTINGS.heroSceneryZoom,
    heroSceneryPosX: DEFAULT_CHTE_SETTINGS.heroSceneryPosX,
    heroSceneryPosY: DEFAULT_CHTE_SETTINGS.heroSceneryPosY,
    heroSceneryFit: (DEFAULT_CHTE_SETTINGS.heroSceneryFit || "cover") as PhotoFitMode,
    heroScenerySlideConfigs: (DEFAULT_CHTE_SETTINGS.heroScenerySlideConfigs || {}) as Record<string, PhotoFramingConfig>,

    // Animated News Ticker
    tickerBadge: DEFAULT_CHTE_SETTINGS.tickerBadge,
    tickerText: DEFAULT_CHTE_SETTINGS.tickerText,
    tickerShow: DEFAULT_CHTE_SETTINGS.tickerShow,

    // Featured Leadership Profiles
    featuredProfiles: DEFAULT_CHTE_SETTINGS.featuredProfiles as ChteFeaturedProfile[],
  });

  // Direct File Upload Helper (with serverless fallback)
  const uploadFile = async (file: File): Promise<string> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) return data.url;
      }
    } catch (e) {
      console.warn("Server upload failed, using client FileReader fallback:", e);
    }

    // Client-side instant Data URL fallback (never fails on Vercel)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Failed to read file"));
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });
  };

  // 1. Fetch current settings from /api/chte-settings
  useEffect(() => {
    setLoading(true);
    fetch("/api/chte-settings")
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          pageBgColor: data.pageBgColor || DEFAULT_CHTE_SETTINGS.pageBgColor,
          heroBgGradientStart: data.heroBgGradientStart || DEFAULT_CHTE_SETTINGS.heroBgGradientStart,
          heroBgGradientEnd: data.heroBgGradientEnd || DEFAULT_CHTE_SETTINGS.heroBgGradientEnd,
          primaryAccentColor: data.primaryAccentColor || DEFAULT_CHTE_SETTINGS.primaryAccentColor,
          govtLogo: data.govtLogo || DEFAULT_CHTE_SETTINGS.govtLogo || "/balochistan-seal.png",

          topMottoText: data.topMottoText || DEFAULT_CHTE_SETTINGS.topMottoText,
          heroBadge: data.heroBadge || DEFAULT_CHTE_SETTINGS.heroBadge,
          heroHeadline: data.heroHeadline || DEFAULT_CHTE_SETTINGS.heroHeadline,
          heroSubtitle: data.heroSubtitle || DEFAULT_CHTE_SETTINGS.heroSubtitle,

          heroSceneryImage: data.heroSceneryImage || DEFAULT_CHTE_SETTINGS.heroSceneryImage,
          heroSceneryImages: Array.isArray(data.heroSceneryImages) && data.heroSceneryImages.length > 0
            ? data.heroSceneryImages
            : [data.heroSceneryImage || "/hero-scenery.png"],
          heroSceneryZoom: typeof data.heroSceneryZoom === "number" ? data.heroSceneryZoom : 100,
          heroSceneryPosX: typeof data.heroSceneryPosX === "number" ? data.heroSceneryPosX : 50,
          heroSceneryPosY: typeof data.heroSceneryPosY === "number" ? data.heroSceneryPosY : 50,
          heroSceneryFit: (data.heroSceneryFit === "contain" || data.heroSceneryFit === "fill" ? data.heroSceneryFit : "cover") as PhotoFitMode,
          heroScenerySlideConfigs:
            data.heroScenerySlideConfigs && typeof data.heroScenerySlideConfigs === "object"
              ? data.heroScenerySlideConfigs
              : {},

          tickerBadge: data.tickerBadge || DEFAULT_CHTE_SETTINGS.tickerBadge,
          tickerText: data.tickerText || DEFAULT_CHTE_SETTINGS.tickerText,
          tickerShow: data.tickerShow !== false,

          featuredProfiles:
            Array.isArray(data.featuredProfiles) && data.featuredProfiles.length > 0
              ? data.featuredProfiles
              : DEFAULT_CHTE_SETTINGS.featuredProfiles,
        });
      })
      .catch((err) => console.error("Error loading CHTE settings:", err))
      .finally(() => setLoading(false));
  }, []);

  // 2. Save settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChteAdmin) {
      setMsg({
        type: "error",
        text: "Access denied. Only CHTE Super Admins are authorized to update CHTE central homepage settings.",
      });
      return;
    }
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      const res = await fetch("/api/chte-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();
      if (res.ok) {
        setMsg({
          type: "success",
          text: "CHTE Central Homepage, Background Colors, Photo & Featured Profiles saved successfully!",
        });
      } else {
        setMsg({ type: "error", text: resData.error || "Failed to save CHTE settings." });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Server error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  // Add Profile
  const addProfile = () => {
    const newProfile: ChteFeaturedProfile = {
      id: `chte-lead-${Date.now()}`,
      name: "New Leadership Official",
      role: "Advisor / Coordinator",
      department: "Higher & Technical Education Department",
      category: "OFFICIAL",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
      zoom: 100,
      posX: 50,
      posY: 50,
      fit: "cover",
      shape: "squircle",
      size: "md",
      border: "theme",
      showBadge: true,
      isVisible: true,
      quote: "Dedicated to advancing higher education standards and institutional transparency.",
      message: "Working collaboratively to modernize colleges and empower students throughout Balochistan.",
      email: "official@chte.balochistan.gov.pk",
      phone: "+92 81 9200000",
    };

    setFormData((prev) => ({
      ...prev,
      featuredProfiles: [...prev.featuredProfiles, newProfile],
    }));
  };

  // Remove Profile
  const removeProfile = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      featuredProfiles: prev.featuredProfiles.filter((p) => p.id !== id),
    }));
  };

  // Update Profile
  const updateProfile = (id: string, updates: Partial<ChteFeaturedProfile>) => {
    setFormData((prev) => ({
      ...prev,
      featuredProfiles: prev.featuredProfiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const moveProfile = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= formData.featuredProfiles.length) return;
    setFormData((prev) => {
      const copy = [...prev.featuredProfiles];
      const [item] = copy.splice(index, 1);
      copy.splice(targetIdx, 0, item);
      return { ...prev, featuredProfiles: copy };
    });
  };

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER / LIVE PREVIEW ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-emerald-50 text-[#0c5938] border border-emerald-100 flex-shrink-0">
            <Building className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Master Homepage & Theme Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize master homepage colors, headline, hero scenery photo (with zoom & framing), and featured leadership profiles.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c5938] hover:bg-[#09472d] text-white text-xs font-bold transition-all shadow-xs hover:scale-105 self-start md:self-auto"
          >
            <span>Preview Master Live Homepage</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fadeIn ${msg.type === "success"
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
          <div className="w-10 h-10 border-4 border-[#0c5938] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-bold">Loading HEMIS homepage settings...</p>
        </div>
      ) : !isChteAdmin ? (
        <div className="bg-white p-10 rounded-3xl border border-amber-200 shadow-sm text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 uppercase tracking-wider">
              Restricted to HEMIS Super Admin
            </span>
            <h3 className="text-xl font-black text-slate-900">
              Access Restricted: Institute / College Admin
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The Master Homepage, provincial governance rules, apex branding, and Balochistan leadership profiles are reserved strictly for <strong>Central Super Administrators</strong>.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* ── SECTION 0: OFFICIAL GOVERNMENT OF BALOCHISTAN LOGO / HEMIS SEAL ── */}
          <div id="hemis-sec-0" className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Official Government of Balochistan Emblem / HEMIS Seal</h3>
                  <p className="text-xs text-slate-500">
                    Upload official government emblem. This logo displays at the top of the HEMIS Central Portal and in the apex Sidebar.
                  </p>
                </div>
              </div>

              {/* Upload Button */}
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c5938] hover:bg-[#09472d] text-white font-bold text-xs shadow-md transition-all hover:scale-105 flex-shrink-0">
                {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{uploadingLogo ? "Uploading..." : "Direct Upload Government Logo"}</span>
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
                      setFormData((prev) => ({ ...prev, govtLogo: url }));
                      setMsg({ type: "success", text: `Successfully uploaded ${file.name} for official Government Emblem!` });
                    } catch (err: any) {
                      setMsg({ type: "error", text: err.message || "Failed to upload logo." });
                    } finally {
                      setUploadingLogo(false);
                    }
                  }}
                />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex-shrink-0 shadow-xs flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.govtLogo || "/balochistan-seal.png"}
                    alt="Govt Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Government Emblem Preview</span>
                  <span className="text-[10px] text-slate-500">
                    Used for HEMIS Central Header, Apex Sidebar, and official documents.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <input
                  type="text"
                  placeholder="Paste URL or upload image"
                  value={formData.govtLogo || ""}
                  onChange={(e) => setFormData({ ...formData, govtLogo: e.target.value })}
                  className="w-full sm:w-72 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                />
                {formData.govtLogo && formData.govtLogo !== "/balochistan-seal.png" && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, govtLogo: "/balochistan-seal.png" })}
                    className="px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 font-bold"
                    title="Reset to default Balochistan Seal"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── SECTION 1: HEMIS HOMEPAGE BACKGROUND & THEME COLORS ── */}
          <div id="hemis-sec-1" className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Palette className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">HEMIS Background Colors & Primary Theme</h3>
                <p className="text-xs text-slate-500">
                  Configure the page background, hero backdrop gradient start/end colors, and primary accent color.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Color 1: Primary Accent Green */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Primary Accent Color</label>
                  <div
                    className="w-6 h-6 rounded-md border border-slate-300 shadow-inner"
                    style={{ backgroundColor: formData.primaryAccentColor }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryAccentColor}
                    onChange={(e) => setFormData({ ...formData, primaryAccentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.primaryAccentColor}
                    onChange={(e) => setFormData({ ...formData, primaryAccentColor: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                {/* Quick Presets */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "Balochistan Green", hex: "#0c5938" },
                      { name: "Forest", hex: "#0b4d30" },
                      { name: "Navy", hex: "#0f3c5c" },
                      { name: "Emerald", hex: "#059669" },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setFormData({ ...formData, primaryAccentColor: c.hex })}
                        className="px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-2xs hover:scale-105 transition-transform"
                        style={{ backgroundColor: c.hex }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color 2: Hero Gradient Start & End */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Hero Gradient Start / End</label>
                  <div
                    className="w-10 h-6 rounded-md border border-slate-300 shadow-inner"
                    style={{
                      background: `linear-gradient(to right, ${formData.heroBgGradientStart}, ${formData.heroBgGradientEnd})`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={formData.heroBgGradientStart}
                      onChange={(e) => setFormData({ ...formData, heroBgGradientStart: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0.5"
                      title="Gradient Start"
                    />
                    <input
                      type="text"
                      value={formData.heroBgGradientStart}
                      onChange={(e) => setFormData({ ...formData, heroBgGradientStart: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={formData.heroBgGradientEnd}
                      onChange={(e) => setFormData({ ...formData, heroBgGradientEnd: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0.5"
                      title="Gradient End"
                    />
                    <input
                      type="text"
                      value={formData.heroBgGradientEnd}
                      onChange={(e) => setFormData({ ...formData, heroBgGradientEnd: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">Gradient Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          heroBgGradientStart: "#eef8f3",
                          heroBgGradientEnd: "#eff8f3",
                        })
                      }
                      className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100"
                    >
                      Light Mint
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          heroBgGradientStart: "#f0fdf4",
                          heroBgGradientEnd: "#dcfce7",
                        })
                      }
                      className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100"
                    >
                      Fresh Spring
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          heroBgGradientStart: "#ffffff",
                          heroBgGradientEnd: "#f8fafc",
                        })
                      }
                      className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100"
                    >
                      Pure Crisp
                    </button>
                  </div>
                </div>
              </div>

              {/* Color 3: Overall Page Background */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Overall Page Background</label>
                  <div
                    className="w-6 h-6 rounded-md border border-slate-300 shadow-inner"
                    style={{ backgroundColor: formData.pageBgColor }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.pageBgColor}
                    onChange={(e) => setFormData({ ...formData, pageBgColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.pageBgColor}
                    onChange={(e) => setFormData({ ...formData, pageBgColor: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "Default Soft", hex: "#f8faf9" },
                      { name: "Crisp White", hex: "#ffffff" },
                      { name: "Slate 50", hex: "#f8fafc" },
                      { name: "Warm Cream", hex: "#fdfbf7" },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setFormData({ ...formData, pageBgColor: c.hex })}
                        className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: HERO SCENERY PHOTO WITH DIRECT UPLOAD, ZOOM & POSITION ADJUST ── */}
          <div id="hemis-sec-2" className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Hero Scenery Photo (تصویر کا انتخاب، زوم اور پوزیشن سیٹنگز)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Directly upload Balochistan landscape / campus photo, zoom in/out, and adjust horizontally and vertically.
                  </p>
                </div>
              </div>

              {/* Direct Upload Button */}
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c5938] hover:bg-[#09472d] text-white font-bold text-xs shadow-md transition-all hover:scale-105 flex-shrink-0">
                {uploadingScenery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{uploadingScenery ? "Uploading..." : "Direct Upload Scenery Photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingScenery}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploadingScenery(true);
                      const url = await uploadFile(file);
                      setFormData((prev) => {
                        const existing = prev.heroSceneryImages || [prev.heroSceneryImage || "/hero-scenery.png"];
                        return {
                          ...prev,
                          heroSceneryImage: url,
                          heroSceneryImages: [url, ...existing.filter((img) => img !== url)],
                        };
                      });
                      setMsg({ type: "success", text: `Successfully uploaded ${file.name} to slide view gallery!` });
                    } catch (err: any) {
                      setMsg({ type: "error", text: err.message || "Failed to upload photo." });
                    } finally {
                      setUploadingScenery(false);
                    }
                  }}
                />
              </label>
            </div>

            {/* Photo URL & Quick Presets & Slide Images List */}
            <div className="space-y-4">
              {/* Multiple Slide Photos Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>Slide View Photos Gallery (ایک سے زائد تصاویر شامل کریں)</span>
                    <span className="text-[10px] bg-emerald-100 text-[#0c5938] px-2 py-0.5 rounded-full font-black">
                      {(formData.heroSceneryImages || []).length} Slide(s)
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const newImages = [
                        ...(formData.heroSceneryImages || [formData.heroSceneryImage || "/hero-scenery.png"]),
                        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80"
                      ];
                      setFormData({
                        ...formData,
                        heroSceneryImages: newImages,
                        heroSceneryImage: newImages[0] || "/hero-scenery.png",
                      });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0c5938] text-xs font-bold transition-all border border-emerald-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Slide Photo</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(formData.heroSceneryImages && formData.heroSceneryImages.length > 0
                    ? formData.heroSceneryImages
                    : [formData.heroSceneryImage || "/hero-scenery.png"]
                  ).map((imgUrl, sIdx) => {
                    const sceneryList = formData.heroSceneryImages && formData.heroSceneryImages.length > 0
                      ? formData.heroSceneryImages
                      : [formData.heroSceneryImage || "/hero-scenery.png"];
                    const slideFrame = resolveSlideFraming(
                      sIdx,
                      {
                        zoom: formData.heroSceneryZoom,
                        posX: formData.heroSceneryPosX,
                        posY: formData.heroSceneryPosY,
                        fit: formData.heroSceneryFit,
                      },
                      formData.heroScenerySlideConfigs
                    );
                    const isSelected = Math.min(activeScenerySlideIdx, sceneryList.length - 1) === sIdx;
                    return (
                      <div
                        key={sIdx}
                        className={`p-3 bg-slate-50 border rounded-xl space-y-2 relative group transition-all ${
                          isSelected ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">
                              {sIdx + 1}
                            </span>
                            <span>Slide {sIdx + 1}</span>
                            {sIdx === 0 && (
                              <span className="text-[9px] bg-emerald-50 text-[#0c5938] px-1.5 py-0.2 rounded font-black border border-emerald-200">
                                Primary
                              </span>
                            )}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveScenerySlideIdx(sIdx)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                isSelected
                                  ? "bg-[#0c5938] text-white"
                                  : "bg-emerald-50 text-[#0c5938] hover:bg-emerald-100"
                              }`}
                            >
                              {isSelected ? "Editing" : "Frame"}
                            </button>

                            {sceneryList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = sceneryList.filter((_, i) => i !== sIdx);
                                  setFormData({
                                    ...formData,
                                    heroSceneryImages: updated,
                                    heroSceneryImage: updated[0] || "/hero-scenery.png",
                                  });
                                  setActiveScenerySlideIdx((prev) => Math.min(prev, Math.max(0, updated.length - 1)));
                                }}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                title="Delete Slide"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div
                          onClick={() => setActiveScenerySlideIdx(sIdx)}
                          className="h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 relative cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={`Slide ${sIdx + 1}`}
                            className="w-full h-full"
                            style={buildPhotoTransformStyle(slideFrame)}
                            onError={(e) => {
                              e.currentTarget.src = "/hero-scenery.png";
                            }}
                          />
                        </div>

                        <div className="space-y-1">
                          <input
                            type="text"
                            value={imgUrl}
                            onChange={(e) => {
                              const newArr = [...sceneryList];
                              newArr[sIdx] = e.target.value;
                              setFormData({
                                ...formData,
                                heroSceneryImages: newArr,
                                heroSceneryImage: newArr[0] || "/hero-scenery.png",
                              });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-800 focus:outline-none"
                            placeholder="/image.png or https://..."
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Scenery Photo Studio */}
              {(() => {
                const sceneryList =
                  formData.heroSceneryImages && formData.heroSceneryImages.length > 0
                    ? formData.heroSceneryImages
                    : [formData.heroSceneryImage || "/hero-scenery.png"];
                const safeIdx = Math.min(activeScenerySlideIdx, Math.max(0, sceneryList.length - 1));
                const activeUrl = sceneryList[safeIdx] || formData.heroSceneryImage || "/hero-scenery.png";
                return (
                  <InteractivePhotoController
                    mode="hero"
                    mediaUrl={activeUrl}
                    fallbackUrl="/hero-scenery.png"
                    title={`Scenery Photo Studio${sceneryList.length > 1 ? ` — Slide #${safeIdx + 1}` : ""} (تصویر کا رخ اور سائز ایڈجسٹ کریں)`}
                    value={resolveSlideFraming(
                      safeIdx,
                      {
                        zoom: formData.heroSceneryZoom,
                        posX: formData.heroSceneryPosX,
                        posY: formData.heroSceneryPosY,
                        fit: formData.heroSceneryFit,
                      },
                      formData.heroScenerySlideConfigs
                    )}
                    onChange={(next) => {
                      setFormData((prev) => {
                        const nextSlides = {
                          ...(prev.heroScenerySlideConfigs || {}),
                          [String(safeIdx)]: { ...next },
                        };
                        if (safeIdx === 0) {
                          return {
                            ...prev,
                            heroSceneryZoom: next.zoom,
                            heroSceneryPosX: next.posX,
                            heroSceneryPosY: next.posY,
                            heroSceneryFit: next.fit,
                            heroScenerySlideConfigs: nextSlides,
                          };
                        }
                        return { ...prev, heroScenerySlideConfigs: nextSlides };
                      });
                    }}
                  />
                );
              })()}
            </div>
          </div>

          {/* ── SECTION 3: HEMIS HERO TEXTS & HEADINGS ── */}
          <div id="hemis-sec-3" className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Layers className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">HEMIS Homepage Headlines & Subtitles</h3>
                <p className="text-xs text-slate-500">
                  Update the main title banner text, pill badge, and description paragraph.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Top Government Motto</label>
                <input
                  type="text"
                  value={formData.topMottoText}
                  onChange={(e) => setFormData({ ...formData, topMottoText: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Hero Floating Pill Badge</label>
                <input
                  type="text"
                  value={formData.heroBadge}
                  onChange={(e) => setFormData({ ...formData, heroBadge: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">Main Headline Title</label>
                <input
                  type="text"
                  value={formData.heroHeadline}
                  onChange={(e) => setFormData({ ...formData, heroHeadline: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">Subtitle / Description</label>
                <textarea
                  rows={2}
                  value={formData.heroSubtitle}
                  onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── SECTION 4: ANIMATED NEWS TICKER BAR (نیوز ٹکر) ── */}
          <div id="hemis-sec-4" className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Animated Broadcast News Ticker (چلتا ہوا نیوز ٹکر)</h3>
                  <p className="text-xs text-slate-500">
                    The top running news ticker text with continuous marquee animation.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.tickerShow}
                  onChange={(e) => setFormData({ ...formData, tickerShow: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0c5938] focus:ring-[#0c5938]"
                />
                <span className="text-xs font-bold text-slate-700">Display Running Ticker</span>
              </label>
            </div>

            {formData.tickerShow && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={formData.tickerBadge}
                      onChange={(e) => setFormData({ ...formData, tickerBadge: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-800 mb-1">Ticker Announcement Text</label>
                    <input
                      type="text"
                      value={formData.tickerText}
                      onChange={(e) => setFormData({ ...formData, tickerText: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                {/* Live Running Marquee Preview */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    Live Marquee Ticker Preview (Hover to pause):
                  </span>
                  <div className="bg-[#030914] text-white py-2 px-4 rounded-xl border border-slate-800 overflow-hidden flex items-center gap-3 shadow-inner">
                    <div className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-400 text-slate-900 text-[10px] font-black uppercase">
                      <Sparkles className="w-3 h-3 text-slate-900" />
                      <span>{formData.tickerBadge}</span>
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden relative">
                      <div className="animate-marquee inline-block whitespace-nowrap text-xs text-slate-200 font-semibold tracking-wide hover:cursor-pointer">
                        <span>{formData.tickerText}</span>
                        <span className="mx-8 text-amber-400">•</span>
                        <span>{formData.tickerText}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 5: FEATURED LEADERSHIP PROFILES (WITH INDIVIDUAL ZOOM & FRAMING ADJUST) ── */}
          <div id="hemis-sec-5" className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Featured Leadership Profiles (قیادت اور فیچرڈ پروفائلز)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Display key provincial leadership, Secretary, Director Colleges, and IT Architects with custom zoom and framing.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addProfile}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Leadership Profile</span>
              </button>
            </div>

            {formData.featuredProfiles.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <User className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No Featured Profiles Configured</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click the "+ Add Leadership Profile" button above to spotlight provincial leadership.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {formData.featuredProfiles.map((profile, idx) => (
                  <div
                    key={profile.id}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <strong className="text-sm font-bold text-slate-900 block">{profile.name}</strong>
                          <span className="text-[11px] text-slate-500 font-semibold">{profile.role}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Reorder Buttons */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveProfile(idx, -1)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === formData.featuredProfiles.length - 1}
                            onClick={() => moveProfile(idx, 1)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 border-l border-slate-200"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Category Selector */}
                        <select
                          value={profile.category}
                          onChange={(e) => updateProfile(profile.id, { category: e.target.value as any })}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value="SECRETARY">Secretary Higher Education</option>
                          <option value="MINISTER">Minister / Advisor</option>
                          <option value="DIRECTOR">Director of Colleges</option>
                          <option value="OFFICIAL">Key Official / IT Architect</option>
                        </select>

                        {/* Delete Profile */}
                        <button
                          type="button"
                          onClick={() => removeProfile(profile.id)}
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
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name &amp; Title</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => updateProfile(profile.id, { name: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Designation / Role</label>
                        <input
                          type="text"
                          value={profile.role}
                          onChange={(e) => updateProfile(profile.id, { role: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Department / Office</label>
                        <input
                          type="text"
                          value={profile.department || ""}
                          onChange={(e) => updateProfile(profile.id, { department: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>

                      {/* Photo Upload, URL + Shape & Framing Studio */}
                      <div className="sm:col-span-2 lg:col-span-3 space-y-3">
                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div
                              className={`w-14 h-14 overflow-hidden border-2 border-emerald-600/40 shadow-sm bg-slate-900 flex-shrink-0 ${
                                getShapeRadiusClasses(profile.shape || "squircle", "card").outer
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={profile.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80"}
                                alt={profile.name}
                                className="w-full h-full"
                                style={buildPhotoTransformStyle({
                                  zoom: profile.zoom ?? 100,
                                  posX: profile.posX ?? 50,
                                  posY: profile.posY ?? 50,
                                  fit: profile.fit ?? "cover",
                                })}
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80";
                                }}
                              />
                            </div>

                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Leadership Portrait &amp; Shape</span>
                              <span className="text-[10px] text-slate-500">
                                Upload photo, choose frame shape (Circle / Portrait Rect / Wide Rect / Oval / Arch), and drag to frame.
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c5938] hover:bg-[#09472d] text-white font-bold text-xs shadow-xs transition-all">
                              {uploadingProfileId === profile.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>{uploadingProfileId === profile.id ? "Uploading..." : "Upload Photo"}</span>
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
                                    updateProfile(profile.id, { image: url });
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
                              placeholder="Photo URL"
                              value={profile.image}
                              onChange={(e) => updateProfile(profile.id, { image: e.target.value })}
                              className="w-36 sm:w-48 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none"
                            />
                          </div>
                        </div>

                        <InteractivePhotoController
                          mode="profile"
                          mediaUrl={profile.image}
                          fallbackUrl="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80"
                          value={{
                            zoom: profile.zoom ?? 100,
                            posX: profile.posX ?? 50,
                            posY: profile.posY ?? 50,
                            fit: profile.fit ?? "cover",
                          }}
                          onChange={(next) =>
                            updateProfile(profile.id, {
                              zoom: next.zoom,
                              posX: next.posX,
                              posY: next.posY,
                              fit: next.fit,
                            })
                          }
                          profileOptions={{
                            shape: profile.shape ?? "squircle",
                            size: profile.size ?? "md",
                            border: profile.border ?? "theme",
                            showBadge: profile.showBadge !== false,
                            isVisible: profile.isVisible !== false,
                            onStyleChange: (updates) =>
                              updateProfile(profile.id, {
                                ...(updates.photoShape !== undefined ? { shape: updates.photoShape } : {}),
                                ...(updates.photoSize !== undefined ? { size: updates.photoSize } : {}),
                                ...(updates.photoBorder !== undefined ? { border: updates.photoBorder } : {}),
                                ...(updates.showBadge !== undefined ? { showBadge: updates.showBadge } : {}),
                                ...(updates.isVisible !== undefined ? { isVisible: updates.isVisible } : {}),
                              }),
                          }}
                        />
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
                          onChange={(e) => updateProfile(profile.id, { quote: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none italic"
                          placeholder="e.g. Transforming provincial higher education through unified cloud automation..."
                        />
                      </div>

                      {/* Full Message */}
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Official Welcome / Direction Message (تفصیلی پیغام)
                        </label>
                        <textarea
                          rows={2}
                          value={profile.message || ""}
                          onChange={(e) => updateProfile(profile.id, { message: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                          placeholder="Detailed statement or direction from leadership..."
                        />
                      </div>

                      {/* Email & Phone */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Email</label>
                        <input
                          type="email"
                          value={profile.email || ""}
                          onChange={(e) => updateProfile(profile.id, { email: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={profile.phone || ""}
                          onChange={(e) => updateProfile(profile.id, { phone: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── STICKY BOTTOM SAVE ACTIONS ── */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-30">
            <div className="text-xs text-slate-500 font-semibold">
              Configuring: <strong className="text-slate-900">HEMIS Central Portal & Governance Cloud</strong>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Preview Homepage</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0c5938] hover:bg-[#09472d] disabled:opacity-50 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Changes..." : "Save HEMIS Settings"}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
