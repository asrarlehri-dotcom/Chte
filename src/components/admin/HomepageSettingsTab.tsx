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
  Sliders,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Layers,
  Sparkle,
  ShieldAlert
} from "lucide-react";
import { ChteFeaturedProfile, DEFAULT_CHTE_SETTINGS } from "@/lib/chte-settings";

export default function HomepageSettingsTab({
  focusedSection,
  onSwitchToColleges,
}: {
  focusedSection?: string;
  onSwitchToColleges?: () => void;
} = {}) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isChteAdmin = userRole === "SUPER_ADMIN" || userRole === "CHTE_ADMIN";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | ""; text: string }>({ type: "", text: "" });

  // Upload States
  const [uploadingScenery, setUploadingScenery] = useState(false);
  const [uploadingProfileId, setUploadingProfileId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Colors
    pageBgColor: DEFAULT_CHTE_SETTINGS.pageBgColor,
    heroBgGradientStart: DEFAULT_CHTE_SETTINGS.heroBgGradientStart,
    heroBgGradientEnd: DEFAULT_CHTE_SETTINGS.heroBgGradientEnd,
    primaryAccentColor: DEFAULT_CHTE_SETTINGS.primaryAccentColor,

    // Text & Titles
    topMottoText: DEFAULT_CHTE_SETTINGS.topMottoText,
    heroBadge: DEFAULT_CHTE_SETTINGS.heroBadge,
    heroHeadline: DEFAULT_CHTE_SETTINGS.heroHeadline,
    heroSubtitle: DEFAULT_CHTE_SETTINGS.heroSubtitle,

    // Scenery Photo with Framing
    heroSceneryImage: DEFAULT_CHTE_SETTINGS.heroSceneryImage,
    heroSceneryZoom: DEFAULT_CHTE_SETTINGS.heroSceneryZoom,
    heroSceneryPosX: DEFAULT_CHTE_SETTINGS.heroSceneryPosX,
    heroSceneryPosY: DEFAULT_CHTE_SETTINGS.heroSceneryPosY,

    // Animated News Ticker
    tickerBadge: DEFAULT_CHTE_SETTINGS.tickerBadge,
    tickerText: DEFAULT_CHTE_SETTINGS.tickerText,
    tickerShow: DEFAULT_CHTE_SETTINGS.tickerShow,

    // Featured Leadership Profiles
    featuredProfiles: DEFAULT_CHTE_SETTINGS.featuredProfiles as ChteFeaturedProfile[],
  });

  // Direct File Upload Helper
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

          topMottoText: data.topMottoText || DEFAULT_CHTE_SETTINGS.topMottoText,
          heroBadge: data.heroBadge || DEFAULT_CHTE_SETTINGS.heroBadge,
          heroHeadline: data.heroHeadline || DEFAULT_CHTE_SETTINGS.heroHeadline,
          heroSubtitle: data.heroSubtitle || DEFAULT_CHTE_SETTINGS.heroSubtitle,

          heroSceneryImage: data.heroSceneryImage || DEFAULT_CHTE_SETTINGS.heroSceneryImage,
          heroSceneryZoom: typeof data.heroSceneryZoom === "number" ? data.heroSceneryZoom : 100,
          heroSceneryPosX: typeof data.heroSceneryPosX === "number" ? data.heroSceneryPosX : 50,
          heroSceneryPosY: typeof data.heroSceneryPosY === "number" ? data.heroSceneryPosY : 50,

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

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER / LIVE PREVIEW ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-emerald-50 text-[#0c5938] border border-emerald-100 flex-shrink-0">
            <Building className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">CHTE Central Homepage & Theme Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize CHTE central homepage colors, headline, hero scenery photo (with zoom & framing), and featured leadership profiles.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onSwitchToColleges && (
            <button
              type="button"
              onClick={onSwitchToColleges}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all shadow-2xs hover:scale-102"
              title="Configure Affiliated College Portals"
            >
              <Palette className="w-3.5 h-3.5 text-slate-600" />
              <span>Switch to College Portals</span>
            </button>
          )}

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c5938] hover:bg-[#09472d] text-white text-xs font-bold transition-all shadow-xs hover:scale-105 self-start md:self-auto"
          >
            <span>Preview CHTE Live Homepage</span>
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
          <p className="text-xs text-slate-500 font-bold">Loading CHTE homepage settings...</p>
        </div>
      ) : !isChteAdmin ? (
        <div className="bg-white p-10 rounded-3xl border border-amber-200 shadow-sm text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 uppercase tracking-wider">
              Restricted to CHTE Super Admin
            </span>
            <h3 className="text-xl font-black text-slate-900">
              Access Restricted: Institute / College Admin
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The CHTE Central Homepage, provincial governance rules, apex branding, and Balochistan leadership profiles are reserved strictly for <strong>CHTE Super Administrators</strong>. College administrators are only permitted to configure their respective institutional portal.
            </p>
          </div>
          {onSwitchToColleges && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onSwitchToColleges}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <Palette className="w-4 h-4 text-white" />
                <span>Go to College Portal Customization</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* ── SECTION 1: CHTE HOMEPAGE BACKGROUND & THEME COLORS ── */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Palette className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">CHTE Background Colors & Primary Theme</h3>
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
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
                      setFormData((prev) => ({ ...prev, heroSceneryImage: url }));
                      setMsg({ type: "success", text: `Successfully uploaded ${file.name} for CHTE hero backdrop!` });
                    } catch (err: any) {
                      setMsg({ type: "error", text: err.message || "Failed to upload photo." });
                    } finally {
                      setUploadingScenery(false);
                    }
                  }}
                />
              </label>
            </div>

            {/* Photo URL & Quick Presets */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scenery Photo URL / File Path</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.heroSceneryImage}
                    onChange={(e) => setFormData({ ...formData, heroSceneryImage: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                    placeholder="/hero-scenery.png or https://..."
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, heroSceneryImage: "/hero-scenery.png" })}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Reset Default
                  </button>
                </div>
              </div>

              {/* Live Framing Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Live Scenery Framing Preview (as displayed on homepage):
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Scale: {formData.heroSceneryZoom}% | X: {formData.heroSceneryPosX}% | Y: {formData.heroSceneryPosY}%
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 h-56 flex items-center justify-center shadow-inner group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.heroSceneryImage || "/hero-scenery.png"}
                    alt="Scenery Preview"
                    className="w-full h-full object-cover transition-all duration-200"
                    style={{
                      objectPosition: `${formData.heroSceneryPosX}% ${formData.heroSceneryPosY}%`,
                      transform: `scale(${formData.heroSceneryZoom / 100})`,
                      transformOrigin: `${formData.heroSceneryPosX}% ${formData.heroSceneryPosY}%`,
                    }}
                    onError={(e) => {
                      e.currentTarget.src = "/hero-scenery.png";
                    }}
                  />

                  {/* Alignment Crosshairs Overlay */}
                  <div className="absolute inset-0 border border-white/10 pointer-events-none flex items-center justify-center">
                    <div className="w-full h-[1px] bg-white/10" />
                    <div className="h-full w-[1px] bg-white/10 absolute" />
                  </div>
                </div>
              </div>

              {/* Zoom & Horizontal/Vertical Sliders for Scenery Photo */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Scenery Photo Framing, Zoom & Alignment (تصویر کا رخ اور سائز ایڈجسٹ کریں)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        heroSceneryZoom: 100,
                        heroSceneryPosX: 50,
                        heroSceneryPosY: 50,
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset (100% Center)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Zoom Slider */}
                  <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                        <span>Zoom In / Out</span>
                      </span>
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[11px]">
                        {formData.heroSceneryZoom}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="50"
                      max="250"
                      step="5"
                      value={formData.heroSceneryZoom}
                      onChange={(e) =>
                        setFormData({ ...formData, heroSceneryZoom: Number(e.target.value) })
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />

                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            heroSceneryZoom: Math.max(50, formData.heroSceneryZoom - 10),
                          })
                        }
                        className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        -10%
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, heroSceneryZoom: 100 })}
                        className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        100%
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            heroSceneryZoom: Math.min(250, formData.heroSceneryZoom + 10),
                          })
                        }
                        className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        +10%
                      </button>
                    </div>
                  </div>

                  {/* 2. Horizontal Position Slider */}
                  <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Move className="w-3.5 h-3.5 text-amber-600" />
                        <span>Horizontal (Left / Right)</span>
                      </span>
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                        {formData.heroSceneryPosX}% {formData.heroSceneryPosX < 45 ? "Left" : formData.heroSceneryPosX > 55 ? "Right" : "Center"}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={formData.heroSceneryPosX}
                      onChange={(e) =>
                        setFormData({ ...formData, heroSceneryPosX: Number(e.target.value) })
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />

                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, heroSceneryPosX: 0 })}
                        className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Left (0%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, heroSceneryPosX: 50 })}
                        className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Center (50%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, heroSceneryPosX: 100 })}
                        className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Right (100%)
                      </button>
                    </div>
                  </div>

                  {/* 3. Vertical Position Slider */}
                  <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Move className="w-3.5 h-3.5 text-emerald-600 rotate-90" />
                        <span>Vertical (Top / Bottom)</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        {formData.heroSceneryPosY}% {formData.heroSceneryPosY < 45 ? "Top" : formData.heroSceneryPosY > 55 ? "Bottom" : "Middle"}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={formData.heroSceneryPosY}
                      onChange={(e) =>
                        setFormData({ ...formData, heroSceneryPosY: Number(e.target.value) })
                      }
                      className="w-full accent-emerald-500 cursor-pointer"
                    />

                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, heroSceneryPosY: 0 })}
                        className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Top (0%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, heroSceneryPosY: 50 })}
                        className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Middle (50%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, heroSceneryPosY: 100 })}
                        className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Bottom (100%)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: CHTE HERO TEXTS & HEADINGS ── */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Layers className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">CHTE Homepage Headlines & Subtitles</h3>
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
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

                      <div className="flex items-center gap-2">
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
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name & Title</label>
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

                      {/* Photo Upload, Framing Preview & Zoom/Align Sliders */}
                      <div className="sm:col-span-2 lg:col-span-3 p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                          {/* Live Avatar Preview */}
                          <div className="flex items-center gap-3.5 w-full sm:w-auto">
                            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-600/40 shadow-md bg-slate-900 flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={profile.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80"}
                                alt={profile.name}
                                className="w-full h-full object-cover transition-all duration-200"
                                style={{
                                  objectPosition: `${profile.posX ?? 50}% ${profile.posY ?? 50}%`,
                                  transform: `scale(${(profile.zoom ?? 100) / 100})`,
                                  transformOrigin: `${profile.posX ?? 50}% ${profile.posY ?? 50}%`,
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80";
                                }}
                              />
                            </div>

                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Leadership Portrait</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Zoom: {profile.zoom ?? 100}% | X: {profile.posX ?? 50}% | Y: {profile.posY ?? 50}%
                              </span>
                            </div>
                          </div>

                          {/* Upload Button & URL */}
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

                        {/* Individual Photo Zoom, X & Y Sliders */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                          {/* Zoom Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-slate-700">
                              <span>Zoom In/Out:</span>
                              <span className="font-mono text-blue-600">{profile.zoom ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="250"
                              step="5"
                              value={profile.zoom ?? 100}
                              onChange={(e) => updateProfile(profile.id, { zoom: Number(e.target.value) })}
                              className="w-full accent-blue-600 cursor-pointer"
                            />
                          </div>

                          {/* Horizontal Alignment */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-slate-700">
                              <span>Horizontal (X):</span>
                              <span className="font-mono text-amber-600">{profile.posX ?? 50}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={profile.posX ?? 50}
                              onChange={(e) => updateProfile(profile.id, { posX: Number(e.target.value) })}
                              className="w-full accent-amber-500 cursor-pointer"
                            />
                          </div>

                          {/* Vertical Alignment */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-slate-700">
                              <span>Vertical (Y):</span>
                              <span className="font-mono text-emerald-600">{profile.posY ?? 50}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={profile.posY ?? 50}
                              onChange={(e) => updateProfile(profile.id, { posY: Number(e.target.value) })}
                              className="w-full accent-emerald-500 cursor-pointer"
                            />
                          </div>
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
              Configuring: <strong className="text-slate-900">CHTE Central Portal & Governance Cloud</strong>
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
                <span>{saving ? "Saving Changes..." : "Save CHTE Settings"}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
