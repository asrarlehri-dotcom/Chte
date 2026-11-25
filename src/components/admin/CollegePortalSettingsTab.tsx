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
  Landmark,
  Wand2,
  Scissors,
  Pipette,
  Check,
  Eye,
  Undo2
} from "lucide-react";
import CorelFillPickerCard from "./CorelFillPickerCard";
import ThemePresetGallery, { ThemePresetItem, INSTITUTIONAL_PRESETS } from "./ThemePresetGallery";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";
import {
  FillConfig,
  compileFillToStyle,
  compileFillToTextStyle,
  normalizeFillConfig,
  getRepresentativeColor,
  MS_WORD_COLOR_PALETTE,
  TypographyConfig,
} from "@/lib/theme-fill-compiler";

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
    primaryColor: "#040d1a" as string | FillConfig,
    ribbonColor: "#dc2626" as string | FillConfig, // Red patii
    bodyBgColor: "#070d19" as string | FillConfig,
    sidebarColor: "#090E24" as string | FillConfig, // Sidebar ERP background color
    pageBannerBg: "/gpgcq-campus-banner.jpg" as string | FillConfig, // Official Campus Panoramic Banner
    pageBannerWaveColor: "#047857" as string | FillConfig, // Side Wave Ribbons ("Patii") color or gradient
    pageBannerWaveOpacity: 100, // Side Wave Ribbons opacity (0 to 100%)
    pageBannerWaveShow: true, // Show decorative wave swoosh
    pageBannerHeight: 170, // Page header banner height in px (120 to 300)
    pageBannerImgWidth: 100, // Banner picture width area % from right (45 to 100)
    pageBannerFade: 85, // Left-side white fade veil intensity (0 to 100%)
    collegeNameColor: "#0f172a", // Custom College Name font color
    collegeFontFamily: "'Times New Roman', Times, serif",
    collegeFontWeight: "700",
    collegeFontStyle: "normal" as "normal" | "italic",
    collegeTextDecoration: "none" as "none" | "underline",
    collegeTextTransform: "uppercase" as "uppercase" | "capitalize" | "lowercase" | "none",
    collegeLetterSpacing: "0.05em",
    collegeFontSize: "13px",
    collegeTextShadow: "none",
    collegeHeaderBg: "#ffffff" as string | FillConfig, // Custom College Header Box background color
    portalSubtitle: "CAMPUS ERP PORTAL", // Subtitle under college name in sidebar
    portalSubtitleColor: "#4338ca", // Font color of portal subtitle
    originalLogoUrl: "", // Preserves original unedited logo before background removal
    customColors: [] as string[], // User added custom color presets palette

    // Hero Media
    heroBgType: "IMAGE" as "IMAGE" | "VIDEO",
    heroBgUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
    heroImages: [
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
      "https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80",
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80"
    ] as string[],
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

  // Saved Theme Presets Gallery State
  const [customPresets, setCustomPresets] = useState<ThemePresetItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("college_custom_theme_presets");
        if (cached) return JSON.parse(cached);
      } catch { }
    }
    return [];
  });

  // Custom Color Palette State & Helpers
  const [newCustomColor, setNewCustomColor] = useState<string>("#2653FF");

  const normalizeHex = (val: string): string => {
    let clean = (val || "").trim();
    if (!clean) return "";
    if (!clean.startsWith("#")) clean = "#" + clean;
    return clean;
  };

  const toSafeColor = (val: any, fallback = "#000000"): string => {
    if (typeof val === "object" && val !== null) {
      return getRepresentativeColor(val, fallback);
    }
    const clean = normalizeHex(String(val || ""));
    return /^#[0-9A-Fa-f]{6}$/.test(clean) ? clean : fallback;
  };

  const handleAddCustomColor = (colorToAdd?: any) => {
    const raw = typeof colorToAdd === "object" && colorToAdd !== null
      ? getRepresentativeColor(colorToAdd, newCustomColor)
      : (colorToAdd || newCustomColor);
    const color = normalizeHex(raw).toUpperCase();
    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) return;
    if (!formData.customColors.includes(color)) {
      setFormData((prev) => ({
        ...prev,
        customColors: [...prev.customColors, color],
      }));
    }
  };

  const handleRemoveCustomColor = (colorToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      customColors: prev.customColors.filter((c) => c !== colorToRemove),
    }));
  };

  // Live real-time sync with Sidebar & Global Theme
  const syncThemeField = (field: string, val: any) => {
    const isFillField = ["ribbonColor", "primaryColor", "bodyBgColor", "sidebarColor", "collegeHeaderBg", "collegeNameColor", "pageBannerBg", "pageBannerWaveColor"].includes(field);
    const isImageString =
      typeof val === "string" &&
      (val.startsWith("/") || /^https?:\/\//i.test(val) || val.startsWith("data:image"));
    const cleanVal = isFillField
      ? (typeof val === "string" ? (isImageString ? val : normalizeHex(val)) : val)
      : (field === "portalSubtitleColor" ? normalizeHex(String(val || "")) : val);

    setFormData((prev) => {
      const updated = { ...prev, [field]: cleanVal };
      if (typeof window !== "undefined") {
        try {
          const stringified = typeof cleanVal === "object" ? JSON.stringify(cleanVal) : String(cleanVal);
          const reprColor = getRepresentativeColor(cleanVal);

          if (field === "pageBannerBg") localStorage.setItem("college_banner_bg", stringified);
          if (field === "pageBannerWaveColor") localStorage.setItem("college_banner_wave_color", stringified);
          if (field === "pageBannerWaveOpacity") localStorage.setItem("college_banner_wave_opacity", String(cleanVal));
          if (field === "pageBannerWaveShow") localStorage.setItem("college_banner_wave_show", String(cleanVal));
          if (field === "pageBannerHeight") localStorage.setItem("college_banner_height", String(cleanVal));
          if (field === "pageBannerImgWidth") localStorage.setItem("college_banner_img_width", String(cleanVal));
          if (field === "pageBannerFade") localStorage.setItem("college_banner_fade", String(cleanVal));

          if (field === "sidebarColor") {
            localStorage.setItem("college_sidebar_active", stringified);
            localStorage.setItem("college_sidebar_repr", reprColor);
          }
          if (field === "collegeNameColor") localStorage.setItem("college_name_color_active", stringified);
          if (field === "collegeHeaderBg") {
            localStorage.setItem("college_header_bg_active", stringified);
            localStorage.setItem("college_header_bg_repr", reprColor);
          }
          if (field === "collegeName") localStorage.setItem("college_name_active", stringified);
          if (field === "portalSubtitle") localStorage.setItem("college_subtitle_active", stringified);
          if (field === "portalSubtitleColor") localStorage.setItem("college_subtitle_color_active", stringified);
          if (field === "ribbonColor") {
            localStorage.setItem("college_theme_active", stringified);
            localStorage.setItem("college_theme_repr", reprColor);
          }

          if (selectedCollege?.code) {
            const cCode = selectedCollege.code.toLowerCase();
            if (field === "pageBannerBg") localStorage.setItem(`college_banner_bg_${cCode}`, stringified);
            if (field === "pageBannerWaveColor") localStorage.setItem(`college_banner_wave_color_${cCode}`, stringified);
            if (field === "sidebarColor") localStorage.setItem(`college_sidebar_${cCode}`, stringified);
            if (field === "collegeNameColor") localStorage.setItem(`college_name_color_${cCode}`, stringified);
            if (field === "collegeHeaderBg") localStorage.setItem(`college_header_bg_${cCode}`, stringified);
            if (field === "collegeName") localStorage.setItem(`college_name_${cCode}`, stringified);
            if (field === "ribbonColor") localStorage.setItem(`college_theme_${cCode}`, stringified);
          }
          if (selectedCollege?.id) {
            const cId = selectedCollege.id.toLowerCase();
            if (field === "pageBannerBg") localStorage.setItem(`college_banner_bg_${cId}`, stringified);
            if (field === "pageBannerWaveColor") localStorage.setItem(`college_banner_wave_color_${cId}`, stringified);
            if (field === "sidebarColor") localStorage.setItem(`college_sidebar_${cId}`, stringified);
            if (field === "collegeNameColor") localStorage.setItem(`college_name_color_${cId}`, stringified);
            if (field === "collegeHeaderBg") localStorage.setItem(`college_header_bg_${cId}`, stringified);
            if (field === "collegeName") localStorage.setItem(`college_name_${cId}`, stringified);
            if (field === "ribbonColor") localStorage.setItem(`college_theme_${cId}`, stringified);
          }

          window.dispatchEvent(new CustomEvent("college-theme-change", {
            detail: {
              sidebarColor: updated.sidebarColor,
              collegeNameColor: updated.collegeNameColor,
              collegeHeaderBg: updated.collegeHeaderBg,
              collegeName: updated.collegeName,
              portalSubtitle: updated.portalSubtitle,
              portalSubtitleColor: updated.portalSubtitleColor,
              ribbonColor: updated.ribbonColor,
              pageBannerBg: updated.pageBannerBg,
              pageBannerWaveColor: updated.pageBannerWaveColor,
              pageBannerWaveOpacity: updated.pageBannerWaveOpacity,
              pageBannerWaveShow: updated.pageBannerWaveShow,
              pageBannerHeight: updated.pageBannerHeight,
              pageBannerImgWidth: updated.pageBannerImgWidth,
              pageBannerFade: updated.pageBannerFade,
            }
          }));
        } catch { }
      }
      return updated;
    });
  };

  // 1-Click Theme Preset Gallery Actions
  const handleApplyTheme = (preset: ThemePresetItem) => {
    syncThemeField("ribbonColor", preset.ribbonColor);
    syncThemeField("primaryColor", preset.primaryColor);
    syncThemeField("bodyBgColor", preset.bodyBgColor);
    syncThemeField("sidebarColor", preset.sidebarColor);
    syncThemeField("collegeNameColor", preset.collegeNameColor);
    syncThemeField("collegeHeaderBg", preset.collegeHeaderBg);
    if (preset.portalSubtitle) syncThemeField("portalSubtitle", preset.portalSubtitle);
    if (preset.portalSubtitleColor) syncThemeField("portalSubtitleColor", preset.portalSubtitleColor);
    setMsg({ type: "success", text: `✨ 1-Click Theme Applied: "${preset.name}"` });
  };

  const handleSaveCustomPreset = (name: string) => {
    const newPreset: ThemePresetItem = {
      id: "custom-" + Date.now(),
      name,
      isSystem: false,
      ribbonColor: formData.ribbonColor,
      primaryColor: formData.primaryColor,
      bodyBgColor: formData.bodyBgColor,
      sidebarColor: formData.sidebarColor,
      collegeNameColor: formData.collegeNameColor,
      collegeHeaderBg: formData.collegeHeaderBg,
      portalSubtitle: formData.portalSubtitle,
      portalSubtitleColor: formData.portalSubtitleColor,
    };
    const updated = [newPreset, ...customPresets.filter((p) => p.name !== name).slice(0, 5)];
    setCustomPresets(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("college_custom_theme_presets", JSON.stringify(updated));
      } catch { }
    }
    setMsg({ type: "success", text: `Theme preset "${name}" saved to your institutional preset gallery!` });
  };

  const handleDeleteCustomPreset = (id: string) => {
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("college_custom_theme_presets", JSON.stringify(updated));
      } catch { }
    }
    setMsg({ type: "success", text: "Custom preset removed." });
  };

  // Logo Background Remover State (MS Word Style)
  const [showBgRemoverModal, setShowBgRemoverModal] = useState(false);
  const [bgRemoverProcessing, setBgRemoverProcessing] = useState(false);
  const [bgTolerance, setBgTolerance] = useState<number>(28);
  const [bgFeather, setBgFeather] = useState<number>(6);
  const [bgMode, setBgMode] = useState<"contiguous" | "global">("contiguous");
  const [bgCustomColor, setBgCustomColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string>("");
  const [bgPreviewTab, setBgPreviewTab] = useState<"checker" | "theme" | "dark" | "white">("checker");

  const loadSafeImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.onerror = (err) => reject(new Error("Image failed to load: " + err));
        fallback.src = url;
      };
      img.src = url;
    });
  };

  const processLogoBackgroundRemoval = (
    imgElement: HTMLImageElement,
    options: {
      targetColor?: { r: number; g: number; b: number } | null;
      tolerance?: number;
      feather?: number;
      mode?: "contiguous" | "global";
    } = {}
  ): string => {
    const {
      tolerance = 28,
      feather = 6,
      mode = "contiguous",
      targetColor = null,
    } = options;

    const canvas = document.createElement("canvas");
    const width = imgElement.naturalWidth || imgElement.width || 400;
    const height = imgElement.naturalHeight || imgElement.height || 400;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return imgElement.src;

    ctx.drawImage(imgElement, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let tr = 255, tg = 255, tb = 255;
    if (targetColor) {
      tr = targetColor.r;
      tg = targetColor.g;
      tb = targetColor.b;
    } else {
      const cornerIndices = [
        0,
        (width - 1) * 4,
        ((height - 1) * width) * 4,
        ((height - 1) * width + width - 1) * 4,
      ];
      let sumR = 0, sumG = 0, sumB = 0;
      for (const idx of cornerIndices) {
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
      }
      tr = Math.round(sumR / 4);
      tg = Math.round(sumG / 4);
      tb = Math.round(sumB / 4);
    }

    const tolDist = (tolerance / 100) * 441.67;
    const featherDist = Math.max(1, (feather / 100) * tolDist);

    const colorDist = (r: number, g: number, b: number) => {
      const dr = r - tr;
      const dg = g - tg;
      const db = b - tb;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };

    if (mode === "global") {
      for (let i = 0; i < data.length; i += 4) {
        const dist = colorDist(data[i], data[i + 1], data[i + 2]);
        if (dist <= tolDist - featherDist) {
          data[i + 3] = 0;
        } else if (dist <= tolDist) {
          const factor = (dist - (tolDist - featherDist)) / featherDist;
          data[i + 3] = Math.round(data[i + 3] * factor);
        }
      }
    } else {
      // Contiguous Flood Fill from borders
      const visited = new Uint8Array(width * height);
      const queue = new Int32Array(width * height);
      let head = 0;
      let tail = 0;

      for (let x = 0; x < width; x++) {
        const tIdx = x;
        const tP = tIdx * 4;
        if (colorDist(data[tP], data[tP + 1], data[tP + 2]) <= tolDist) {
          visited[tIdx] = 1;
          queue[tail++] = tIdx;
        }
        const bIdx = (height - 1) * width + x;
        const bP = bIdx * 4;
        if (colorDist(data[bP], data[bP + 1], data[bP + 2]) <= tolDist) {
          visited[bIdx] = 1;
          queue[tail++] = bIdx;
        }
      }

      for (let y = 0; y < height; y++) {
        const lIdx = y * width;
        const lP = lIdx * 4;
        if (!visited[lIdx] && colorDist(data[lP], data[lP + 1], data[lP + 2]) <= tolDist) {
          visited[lIdx] = 1;
          queue[tail++] = lIdx;
        }
        const rIdx = y * width + (width - 1);
        const rP = rIdx * 4;
        if (!visited[rIdx] && colorDist(data[rP], data[rP + 1], data[rP + 2]) <= tolDist) {
          visited[rIdx] = 1;
          queue[tail++] = rIdx;
        }
      }

      while (head < tail) {
        const curr = queue[head++];
        const cx = curr % width;
        const cy = Math.floor(curr / width);

        const neighbors = [
          cx > 0 ? curr - 1 : -1,
          cx < width - 1 ? curr + 1 : -1,
          cy > 0 ? curr - width : -1,
          cy < height - 1 ? curr + width : -1,
        ];

        for (let n = 0; n < 4; n++) {
          const next = neighbors[n];
          if (next !== -1 && !visited[next]) {
            const np = next * 4;
            if (colorDist(data[np], data[np + 1], data[np + 2]) <= tolDist) {
              visited[next] = 1;
              queue[tail++] = next;
            }
          }
        }
      }

      for (let i = 0; i < visited.length; i++) {
        if (visited[i]) {
          const p = i * 4;
          const dist = colorDist(data[p], data[p + 1], data[p + 2]);
          if (dist <= tolDist - featherDist) {
            data[p + 3] = 0;
          } else if (dist <= tolDist) {
            const factor = (dist - (tolDist - featherDist)) / featherDist;
            data[p + 3] = Math.round(data[p + 3] * factor);
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const handleInstantAutoRemoveBg = async () => {
    const targetSource = formData.originalLogoUrl || formData.logoUrl;
    if (!targetSource) {
      setMsg({ type: "error", text: "Please upload a college logo first." });
      return;
    }
    try {
      setBgRemoverProcessing(true);
      const img = await loadSafeImage(targetSource);
      const transparentUrl = processLogoBackgroundRemoval(img, {
        tolerance: 28,
        feather: 6,
        mode: "contiguous",
      });
      setFormData((prev) => ({
        ...prev,
        originalLogoUrl: prev.originalLogoUrl || prev.logoUrl,
        logoUrl: transparentUrl,
      }));
      setMsg({ type: "success", text: "✨ 1-Click Background Removal applied! Logo is now completely transparent and clean on any background." });
    } catch (err: any) {
      setMsg({ type: "error", text: "Could not auto-process logo background: " + (err.message || "Unknown error") });
    } finally {
      setBgRemoverProcessing(false);
    }
  };

  const handleRestoreOriginalLogo = () => {
    if (formData.originalLogoUrl) {
      setFormData((prev) => ({
        ...prev,
        logoUrl: prev.originalLogoUrl,
        originalLogoUrl: "",
      }));
      setMsg({ type: "success", text: "↩️ Original unedited logo restored!" });
    }
  };

  const updateModalPreview = async (
    targetCol: { r: number; g: number; b: number } | null = bgCustomColor,
    tol: number = bgTolerance,
    fthr: number = bgFeather,
    md: "contiguous" | "global" = bgMode
  ) => {
    const source = formData.originalLogoUrl || formData.logoUrl;
    if (!source) return;
    try {
      setBgRemoverProcessing(true);
      const img = await loadSafeImage(source);
      const result = processLogoBackgroundRemoval(img, {
        targetColor: targetCol,
        tolerance: tol,
        feather: fthr,
        mode: md,
      });
      setBgPreviewUrl(result);
    } catch (e) {
      console.error(e);
    } finally {
      setBgRemoverProcessing(false);
    }
  };

  // Helper to upload any file directly (with serverless fallback)
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
          sidebarColor: data.sidebarColor || "#090E24",
          pageBannerBg: data.pageBannerBg || "/gpgcq-campus-banner.jpg",
          pageBannerWaveColor: data.pageBannerWaveColor || "#047857",
          pageBannerWaveOpacity: typeof data.pageBannerWaveOpacity === "number" ? data.pageBannerWaveOpacity : 100,
          pageBannerWaveShow: data.pageBannerWaveShow !== false,
          pageBannerHeight: typeof data.pageBannerHeight === "number" ? data.pageBannerHeight : 170,
          pageBannerImgWidth: typeof data.pageBannerImgWidth === "number" ? data.pageBannerImgWidth : 100,
          pageBannerFade: typeof data.pageBannerFade === "number" ? data.pageBannerFade : 85,
          collegeNameColor: data.collegeNameColor || "#0f172a",
          collegeFontFamily: data.collegeFontFamily || "'Times New Roman', Times, serif",
          collegeFontWeight: data.collegeFontWeight || "700",
          collegeFontStyle: data.collegeFontStyle || "normal",
          collegeTextDecoration: data.collegeTextDecoration || "none",
          collegeTextTransform: data.collegeTextTransform || "uppercase",
          collegeLetterSpacing: data.collegeLetterSpacing || "0.05em",
          collegeFontSize: data.collegeFontSize || "13px",
          collegeTextShadow: data.collegeTextShadow || "none",
          collegeHeaderBg: data.collegeHeaderBg || "#ffffff",
          portalSubtitle: data.portalSubtitle || "CAMPUS ERP PORTAL",
          portalSubtitleColor: data.portalSubtitleColor || "#4338ca",
          originalLogoUrl: data.originalLogoUrl || "",
          customColors: Array.isArray(data.customColors) ? data.customColors : [],

          heroBgType: data.heroBgType || "IMAGE",
          heroBgUrl: data.heroBgUrl || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
          heroImages: Array.isArray(data.heroImages) && data.heroImages.length > 0
            ? data.heroImages
            : (data.heroBgUrl ? [data.heroBgUrl] : [
              "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
              "https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80",
              "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80"
            ]),
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
        if (Array.isArray(data.themePresets) && data.themePresets.length > 0) {
          setCustomPresets(data.themePresets);
        }
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
      sidebarColor: formData.sidebarColor,
      pageBannerBg: formData.pageBannerBg,
      pageBannerWaveColor: formData.pageBannerWaveColor,
      pageBannerWaveOpacity: formData.pageBannerWaveOpacity,
      pageBannerWaveShow: formData.pageBannerWaveShow,
      pageBannerHeight: formData.pageBannerHeight,
      pageBannerImgWidth: formData.pageBannerImgWidth,
      pageBannerFade: formData.pageBannerFade,
      collegeNameColor: formData.collegeNameColor,
      collegeHeaderBg: formData.collegeHeaderBg,
      portalSubtitle: formData.portalSubtitle,
      portalSubtitleColor: formData.portalSubtitleColor,
      originalLogoUrl: formData.originalLogoUrl,
      customColors: formData.customColors,
      themePresets: customPresets,

      heroBgType: formData.heroBgType,
      heroBgUrl: formData.heroImages?.[0] || formData.heroBgUrl,
      heroImages: formData.heroImages && formData.heroImages.length > 0 ? formData.heroImages : (formData.heroBgUrl ? [formData.heroBgUrl] : []),
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
        if (typeof window !== "undefined" && selectedCollege) {
          try {
            const ribbonStr = typeof formData.ribbonColor === "object" ? JSON.stringify(formData.ribbonColor) : String(formData.ribbonColor);
            const sidebarStr = typeof formData.sidebarColor === "object" ? JSON.stringify(formData.sidebarColor) : String(formData.sidebarColor);
            const headerBgStr = typeof formData.collegeHeaderBg === "object" ? JSON.stringify(formData.collegeHeaderBg) : String(formData.collegeHeaderBg);
            const nameColorStr = typeof formData.collegeNameColor === "object" ? JSON.stringify(formData.collegeNameColor) : String(formData.collegeNameColor);
            const bannerBgStr = typeof formData.pageBannerBg === "object" ? JSON.stringify(formData.pageBannerBg) : String(formData.pageBannerBg);
            const waveColorStr = typeof formData.pageBannerWaveColor === "object" ? JSON.stringify(formData.pageBannerWaveColor) : String(formData.pageBannerWaveColor);

            localStorage.setItem("college_banner_bg", bannerBgStr);
            localStorage.setItem("college_banner_wave_color", waveColorStr);
            localStorage.setItem("college_banner_wave_opacity", String(formData.pageBannerWaveOpacity));
            localStorage.setItem("college_banner_wave_show", String(formData.pageBannerWaveShow));
            localStorage.setItem("college_banner_height", String(formData.pageBannerHeight));
            localStorage.setItem("college_banner_img_width", String(formData.pageBannerImgWidth));
            localStorage.setItem("college_banner_fade", String(formData.pageBannerFade));

            if (selectedCollege.code) {
              const cCode = selectedCollege.code.toLowerCase();
              localStorage.setItem(`college_theme_${cCode}`, ribbonStr);
              localStorage.setItem(`college_sidebar_${cCode}`, sidebarStr);
              localStorage.setItem(`college_name_color_${cCode}`, nameColorStr);
              localStorage.setItem(`college_header_bg_${cCode}`, headerBgStr);
              localStorage.setItem(`college_name_${cCode}`, formData.collegeName);
              localStorage.setItem(`college_subtitle_${cCode}`, formData.portalSubtitle);
              localStorage.setItem(`college_subtitle_color_${cCode}`, formData.portalSubtitleColor);
              localStorage.setItem(`college_font_family_${cCode}`, formData.collegeFontFamily || "");
              localStorage.setItem(`college_font_weight_${cCode}`, formData.collegeFontWeight || "");
              localStorage.setItem(`college_font_style_${cCode}`, formData.collegeFontStyle || "");
              localStorage.setItem(`college_text_decoration_${cCode}`, formData.collegeTextDecoration || "");
              localStorage.setItem(`college_text_transform_${cCode}`, formData.collegeTextTransform || "");
              localStorage.setItem(`college_letter_spacing_${cCode}`, formData.collegeLetterSpacing || "");
              localStorage.setItem(`college_font_size_${cCode}`, formData.collegeFontSize || "");
              localStorage.setItem(`college_text_shadow_${cCode}`, formData.collegeTextShadow || "");
            }
            if (selectedCollege.id) {
              const cId = selectedCollege.id.toLowerCase();
              localStorage.setItem(`college_theme_${cId}`, ribbonStr);
              localStorage.setItem(`college_sidebar_${cId}`, sidebarStr);
              localStorage.setItem(`college_name_color_${cId}`, nameColorStr);
              localStorage.setItem(`college_header_bg_${cId}`, headerBgStr);
              localStorage.setItem(`college_name_${cId}`, formData.collegeName);
              localStorage.setItem(`college_subtitle_${cId}`, formData.portalSubtitle);
              localStorage.setItem(`college_subtitle_color_${cId}`, formData.portalSubtitleColor);
              localStorage.setItem(`college_font_family_${cId}`, formData.collegeFontFamily || "");
              localStorage.setItem(`college_font_weight_${cId}`, formData.collegeFontWeight || "");
              localStorage.setItem(`college_font_style_${cId}`, formData.collegeFontStyle || "");
              localStorage.setItem(`college_text_decoration_${cId}`, formData.collegeTextDecoration || "");
              localStorage.setItem(`college_text_transform_${cId}`, formData.collegeTextTransform || "");
              localStorage.setItem(`college_letter_spacing_${cId}`, formData.collegeLetterSpacing || "");
              localStorage.setItem(`college_font_size_${cId}`, formData.collegeFontSize || "");
              localStorage.setItem(`college_text_shadow_${cId}`, formData.collegeTextShadow || "");
            }
            window.dispatchEvent(new CustomEvent("college-theme-change", {
              detail: {
                sidebarColor: formData.sidebarColor,
                collegeNameColor: formData.collegeNameColor,
                collegeHeaderBg: formData.collegeHeaderBg,
                collegeName: formData.collegeName,
                portalSubtitle: formData.portalSubtitle,
                portalSubtitleColor: formData.portalSubtitleColor,
                collegeFontFamily: formData.collegeFontFamily,
                collegeFontWeight: formData.collegeFontWeight,
                collegeFontStyle: formData.collegeFontStyle,
                collegeTextDecoration: formData.collegeTextDecoration,
                collegeTextTransform: formData.collegeTextTransform,
                collegeLetterSpacing: formData.collegeLetterSpacing,
                collegeFontSize: formData.collegeFontSize,
                collegeTextShadow: formData.collegeTextShadow,
                pageBannerBg: formData.pageBannerBg,
                pageBannerWaveColor: formData.pageBannerWaveColor,
                pageBannerWaveOpacity: formData.pageBannerWaveOpacity,
                pageBannerWaveShow: formData.pageBannerWaveShow,
                pageBannerHeight: formData.pageBannerHeight,
                pageBannerImgWidth: formData.pageBannerImgWidth,
                pageBannerFade: formData.pageBannerFade,
              }
            }));
          } catch { }
        }
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
                    🏛️ [HEMIS MAIN] HEMIS Central Homepage & Portal
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
                  title="Configure HEMIS Central Homepage"
                >
                  <Landmark className="w-3.5 h-3.5 text-[#0c5938]" />
                  <span>HEMIS Main Settings</span>
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
              href={`/colleges/${selectedCollege.code.toLowerCase()}${
                formData.ribbonColor
                  ? `?theme=${encodeURIComponent(getRepresentativeColor(formData.ribbonColor, "#dc2626"))}`
                  : ""
              }`}
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
          <div
            className="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-3"
            style={{
              borderColor: toSafeColor(formData.ribbonColor, "#dc2626"),
              borderTopColor: "transparent"
            }}
          />
          <p className="text-xs text-slate-500 font-bold">Loading portal settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* ── SECTION 1: THEME COLORS & "RED PATII" (DARK STUDIO ENGINE) ── */}
          <div className="bg-[#0b0f19] p-5 sm:p-6 rounded-3xl border border-slate-800/90 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-md">
                <Palette className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Theme Colors & Ribbon Bar ("Red Patii")
                </h3>
                <p className="text-xs text-slate-400">
                  Configure the primary header color, the top accent ribbon ("red patii"), and overall background color with CorelDRAW-style fill engine.
                </p>
              </div>
            </div>

            {/* ── 1-CLICK THEME PRESET GALLERY (1-کلک تھیم پریسیٹ گیلری) ── */}
            <ThemePresetGallery
              currentTheme={{
                ribbonColor: formData.ribbonColor,
                primaryColor: formData.primaryColor,
                bodyBgColor: formData.bodyBgColor,
                sidebarColor: formData.sidebarColor,
                collegeNameColor: formData.collegeNameColor,
                collegeHeaderBg: formData.collegeHeaderBg,
                portalSubtitle: formData.portalSubtitle,
                portalSubtitleColor: formData.portalSubtitleColor,
              }}
              customPresets={customPresets}
              onApplyTheme={handleApplyTheme}
              onSaveCustomPreset={handleSaveCustomPreset}
              onDeleteCustomPreset={handleDeleteCustomPreset}
            />

            {/* ── STACKED HORIZONTAL STUDIO CARDS (AS SHOWN IN USER SCREENSHOT) ── */}
            <div className="space-y-4">
              {/* Card 1: Top Accent Ribbon ("Red Patii" / سُرخ پٹی) */}
              <CorelFillPickerCard
                cardId="ribbonColor"
                title='Top Accent Ribbon ("Red Patii")'
                subtitleUrdu="سُرخ پٹی (ٹاپ ایکسنٹ ربن)"
                value={formData.ribbonColor}
                onChange={(val) => syncThemeField("ribbonColor", val)}
                defaultColor="#dc2626"
                topRibbonAccent={true}
                gradientPresets={[
                  {
                    name: "Crimson Sunset",
                    angle: 90,
                    stops: [
                      { color: "#991b1b", position: 0 },
                      { color: "#dc2626", position: 50 },
                      { color: "#f59e0b", position: 100 },
                    ],
                  },
                  {
                    name: "Ruby Gold",
                    angle: 90,
                    stops: [
                      { color: "#831843", position: 0 },
                      { color: "#b45309", position: 50 },
                      { color: "#fbbf24", position: 100 },
                    ],
                  },
                  {
                    name: "Metallic Patii",
                    angle: 90,
                    stops: [
                      { color: "#78350f", position: 0 },
                      { color: "#fde047", position: 50 },
                      { color: "#b45309", position: 100 },
                    ],
                  },
                ]}
                quickPresets={[
                  { name: "Red", hex: "#dc2626" },
                  { name: "Crimson", hex: "#991b1b" },
                  { name: "Green", hex: "#0c5938" },
                  { name: "Navy", hex: "#1e3a8a" },
                  { name: "Purple", hex: "#7c3aed" },
                  { name: "Gold", hex: "#d97706" },
                ]}
                customColors={formData.customColors}
                onAddCustomColor={handleAddCustomColor}
              />

              {/* Card 2: Primary Header */}
              <CorelFillPickerCard
                cardId="primaryColor"
                title="Primary Header"
                subtitleUrdu="مین ہیڈر کا رنگ"
                value={formData.primaryColor}
                onChange={(val) => syncThemeField("primaryColor", val)}
                defaultColor="#040d1a"
                gradientPresets={[
                  {
                    name: "Header Metal",
                    angle: 120,
                    stops: [
                      { color: "#1e293b", position: 0 },
                      { color: "#64748b", position: 50 },
                      { color: "#0f172a", position: 100 },
                    ],
                  },
                  {
                    name: "Admin Gold",
                    angle: 120,
                    stops: [
                      { color: "#b45309", position: 0 },
                      { color: "#fef08a", position: 50 },
                      { color: "#78350f", position: 100 },
                    ],
                  },
                  {
                    name: "Crimson Sunset",
                    angle: 135,
                    stops: [
                      { color: "#881337", position: 0 },
                      { color: "#e11d48", position: 100 },
                    ],
                  },
                ]}
                quickPresets={[
                  { name: "Deep Navy", hex: "#040d1a" },
                  { name: "Slate 900", hex: "#0f172a" },
                  { name: "Forest", hex: "#083b25" },
                  { name: "Midnight", hex: "#081329" },
                ]}
                customColors={formData.customColors}
                onAddCustomColor={handleAddCustomColor}
              />

              {/* Card 3: Overall Background */}
              <CorelFillPickerCard
                cardId="bodyBgColor"
                title="Overall Background"
                subtitleUrdu="پورٹل کا عمومی پس منظر"
                value={formData.bodyBgColor}
                onChange={(val) => syncThemeField("bodyBgColor", val)}
                defaultColor="#070d19"
                gradientPresets={[
                  {
                    name: "Carbon Dark",
                    angle: 180,
                    stops: [
                      { color: "#0b0f19", position: 0 },
                      { color: "#111827", position: 100 },
                    ],
                  },
                  {
                    name: "Midnight Slate",
                    angle: 180,
                    stops: [
                      { color: "#020617", position: 0 },
                      { color: "#0f172a", position: 100 },
                    ],
                  },
                  {
                    name: "Deep Space",
                    angle: 180,
                    stops: [
                      { color: "#0a0a1a", position: 0 },
                      { color: "#1a1a3a", position: 100 },
                    ],
                  },
                ]}
                quickPresets={[
                  { name: "Dark Theme", hex: "#070d19" },
                  { name: "Midnight", hex: "#0a1128" },
                  { name: "Light Theme", hex: "#f8fafc" },
                  { name: "Pure White", hex: "#ffffff" },
                ]}
                customColors={formData.customColors}
                onAddCustomColor={handleAddCustomColor}
              />

              {/* Card 4: Sidebar Background */}
              <CorelFillPickerCard
                cardId="sidebarColor"
                title="Sidebar Background"
                subtitleUrdu="سائیڈ بار رنگ (ERP مینیو)"
                value={formData.sidebarColor}
                onChange={(val) => syncThemeField("sidebarColor", val)}
                defaultColor="#090E24"
                gradientPresets={[
                  {
                    name: "Navy Blue",
                    angle: 180,
                    stops: [
                      { color: "#090E24", position: 0 },
                      { color: "#1e1b4b", position: 100 },
                    ],
                  },
                  {
                    name: "Emerald Green",
                    angle: 180,
                    stops: [
                      { color: "#064e3b", position: 0 },
                      { color: "#022c22", position: 100 },
                    ],
                  },
                  {
                    name: "Slate Dark",
                    angle: 180,
                    stops: [
                      { color: "#0f172a", position: 0 },
                      { color: "#020617", position: 100 },
                    ],
                  },
                  {
                    name: "Burgundy Red",
                    angle: 180,
                    stops: [
                      { color: "#450a0a", position: 0 },
                      { color: "#1c0404", position: 100 },
                    ],
                  },
                ]}
                quickPresets={[
                  { name: "Navy", hex: "#090E24" },
                  { name: "Slate 900", hex: "#0f172a" },
                  { name: "Emerald", hex: "#064e3b" },
                  { name: "Indigo", hex: "#1e1b4b" },
                  { name: "Midnight", hex: "#020617" },
                  { name: "Burgundy", hex: "#450a0a" },
                ]}
                customColors={formData.customColors}
                onAddCustomColor={handleAddCustomColor}
              />

              {/* Card 5: College Header Bg */}
              <CorelFillPickerCard
                cardId="collegeHeaderBg"
                title="College Header Bg"
                subtitleUrdu="لوگو و نام باکس کا پس منظر"
                value={formData.collegeHeaderBg}
                onChange={(val) => syncThemeField("collegeHeaderBg", val)}
                defaultColor="#ffffff"
                gradientPresets={[
                  {
                    name: "Crisp White",
                    angle: 90,
                    stops: [
                      { color: "#ffffff", position: 0 },
                      { color: "#f1f5f9", position: 100 },
                    ],
                  },
                  {
                    name: "Navy Metal",
                    angle: 135,
                    stops: [
                      { color: "#1e3a8a", position: 0 },
                      { color: "#0f172a", position: 100 },
                    ],
                  },
                  {
                    name: "Emerald Header",
                    angle: 135,
                    stops: [
                      { color: "#064e3b", position: 0 },
                      { color: "#042f2e", position: 100 },
                    ],
                  },
                ]}
                quickPresets={[
                  { name: "White", hex: "#ffffff" },
                  { name: "Slate 100", hex: "#f1f5f9" },
                  { name: "Sidebar", hex: getRepresentativeColor(formData.sidebarColor, "#090E24") },
                  { name: "Navy", hex: "#1e3a8a" },
                  { name: "Emerald", hex: "#0c5938" },
                  { name: "Crimson", hex: "#991b1b" },
                  { name: "Gold", hex: "#d97706" },
                ]}
                customColors={formData.customColors}
                onAddCustomColor={handleAddCustomColor}
              />

              {/* Card 6: College Name & Font Style (کالج کے نام کا رنگ و فانٹ اسٹائل) */}
              <CorelFillPickerCard
                cardId="collegeNameColor"
                title="College Name & Font Style"
                subtitleUrdu="کالج کے نام کا رنگ، فونٹ فیملی و ایم ایس ورڈ اسٹائلز"
                value={formData.collegeNameColor}
                onChange={(val) => syncThemeField("collegeNameColor", val)}
                defaultColor="#0f172a"
                isTextColorOnly={true}
                typography={{
                  fontFamily: formData.collegeFontFamily,
                  fontWeight: formData.collegeFontWeight,
                  fontStyle: formData.collegeFontStyle,
                  textDecoration: formData.collegeTextDecoration,
                  textTransform: formData.collegeTextTransform,
                  letterSpacing: formData.collegeLetterSpacing,
                  fontSize: formData.collegeFontSize,
                  textShadow: formData.collegeTextShadow,
                }}
                onTypographyChange={(typo) => {
                  setFormData((prev) => {
                    const updated = {
                      ...prev,
                      collegeFontFamily: typo.fontFamily ?? prev.collegeFontFamily,
                      collegeFontWeight: typo.fontWeight ? String(typo.fontWeight) : prev.collegeFontWeight,
                      collegeFontStyle: (typo.fontStyle as any) ?? prev.collegeFontStyle,
                      collegeTextDecoration: (typo.textDecoration as any) ?? prev.collegeTextDecoration,
                      collegeTextTransform: (typo.textTransform as any) ?? prev.collegeTextTransform,
                      collegeLetterSpacing: typo.letterSpacing ?? prev.collegeLetterSpacing,
                      collegeFontSize: typo.fontSize ?? prev.collegeFontSize,
                      collegeTextShadow: typo.textShadow ?? prev.collegeTextShadow,
                    };
                    if (typeof window !== "undefined") {
                      try {
                        if (typo.fontFamily) localStorage.setItem("college_font_family_active", typo.fontFamily);
                        if (typo.fontWeight) localStorage.setItem("college_font_weight_active", String(typo.fontWeight));
                        if (typo.fontStyle) localStorage.setItem("college_font_style_active", typo.fontStyle);
                        if (typo.textDecoration) localStorage.setItem("college_text_decoration_active", typo.textDecoration);
                        if (typo.textTransform) localStorage.setItem("college_text_transform_active", typo.textTransform);
                        if (typo.letterSpacing) localStorage.setItem("college_letter_spacing_active", typo.letterSpacing);
                        if (typo.fontSize) localStorage.setItem("college_font_size_active", typo.fontSize);
                        if (typo.textShadow) localStorage.setItem("college_text_shadow_active", typo.textShadow);
                      } catch {}
                    }
                    return updated;
                  });
                }}
                quickPresets={MS_WORD_COLOR_PALETTE}
                customColors={formData.customColors}
                onAddCustomColor={handleAddCustomColor}
              />

              {/* Card 7: Page Header Banner ("Campus Banner" / کیمپس بینر) */}
              <CorelFillPickerCard
                cardId="pageBannerBg"
                title='Page Header Banner ("Campus Picture & Layout")'
                subtitleUrdu="کیمپس بینر کی تصویر تبدیل کریں، سائز، زوم، پوزیشن (X/Y) اور فیڈ سیٹ کریں"
                value={formData.pageBannerBg}
                onChange={(val) => syncThemeField("pageBannerBg", val)}
                defaultColor="/gpgcq-campus-banner.jpg"
                gradientPresets={[
                  {
                    name: "Balochistan Emerald",
                    angle: 135,
                    stops: [
                      { color: "#064e3b", position: 0 },
                      { color: "#059669", position: 50 },
                      { color: "#10b981", position: 100 },
                    ],
                  },
                  {
                    name: "Academic Navy",
                    angle: 135,
                    stops: [
                      { color: "#091e3a", position: 0 },
                      { color: "#1e3a8a", position: 100 },
                    ],
                  },
                  {
                    name: "Crimson Heritage",
                    angle: 135,
                    stops: [
                      { color: "#7f1d1d", position: 0 },
                      { color: "#dc2626", position: 100 },
                    ],
                  },
                ]}
                quickPresets={[
                  { name: "White Clean", hex: "#ffffff" },
                  { name: "Emerald 800", hex: "#064e3b" },
                  { name: "Emerald 600", hex: "#059669" },
                  { name: "Navy 900", hex: "#0f172a" },
                  { name: "Navy 800", hex: "#1e3a8a" },
                  { name: "Slate 900", hex: "#020617" },
                ]}
                customColors={formData.customColors}
                onAddCustomColor={handleAddCustomColor}
                extraControls={
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/75 p-3 rounded-xl border border-slate-800/90">
                    {/* Banner Box Height (Size) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                        <span>Banner Height (سائز / اونچائی):</span>
                        <span className="font-mono text-amber-300">{formData.pageBannerHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min={120}
                        max={280}
                        step={5}
                        value={formData.pageBannerHeight}
                        onChange={(e) => syncThemeField("pageBannerHeight", Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded accent-amber-500 cursor-pointer"
                      />
                      <div className="flex gap-1">
                        {[
                          { label: "Compact", h: 135 },
                          { label: "Default", h: 170 },
                          { label: "Tall", h: 220 },
                          { label: "Extra", h: 260 },
                        ].map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => syncThemeField("pageBannerHeight", p.h)}
                            className={`flex-1 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                              formData.pageBannerHeight === p.h
                                ? "bg-amber-500 text-slate-950"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Picture Width Area */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                        <span>Picture Area Width (تصویر کی چوڑائی):</span>
                        <span className="font-mono text-amber-300">{formData.pageBannerImgWidth}%</span>
                      </div>
                      <input
                        type="range"
                        min={45}
                        max={100}
                        step={5}
                        value={formData.pageBannerImgWidth}
                        onChange={(e) => syncThemeField("pageBannerImgWidth", Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded accent-amber-500 cursor-pointer"
                      />
                      <div className="flex gap-1">
                        {[
                          { label: "Right 55%", w: 55 },
                          { label: "Wide 75%", w: 75 },
                          { label: "Full 100%", w: 100 },
                        ].map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => syncThemeField("pageBannerImgWidth", p.w)}
                            className={`flex-1 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                              formData.pageBannerImgWidth === p.w
                                ? "bg-amber-500 text-slate-950"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Left White Fade Veil */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                        <span>Left White Fade (بائیں سفید دھندلاہٹ):</span>
                        <span className="font-mono text-amber-300">{formData.pageBannerFade}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={formData.pageBannerFade}
                        onChange={(e) => syncThemeField("pageBannerFade", Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded accent-amber-500 cursor-pointer"
                      />
                      <div className="flex gap-1">
                        {[
                          { label: "None 0%", f: 0 },
                          { label: "Soft 55%", f: 55 },
                          { label: "Default 85%", f: 85 },
                        ].map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => syncThemeField("pageBannerFade", p.f)}
                            className={`flex-1 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                              formData.pageBannerFade === p.f
                                ? "bg-amber-500 text-slate-950"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                }
              />

              {/* Card 8: Side Wave Ribbons ("Wave Patii" / سائیڈ ربن پٹیاں) */}
              <CorelFillPickerCard
                cardId="pageBannerWaveColor"
                title='Side Wave Ribbons ("Wave Patii" & Custom Color)'
                subtitleUrdu="سائیڈ ربن پٹیوں کا اپنی مرضی کا رنگ (Solid / Multi-Color Gradient) اور Opacity سیٹ کریں"
                value={formData.pageBannerWaveColor}
                onChange={(val) => syncThemeField("pageBannerWaveColor", val)}
                defaultColor="#047857"
                gradientPresets={[
                  {
                    name: "Balochistan Green",
                    angle: 90,
                    stops: [
                      { color: "#064e3b", position: 0 },
                      { color: "#047857", position: 50 },
                      { color: "#10b981", position: 100 },
                    ],
                  },
                  {
                    name: "Ruby Ribbon",
                    angle: 90,
                    stops: [
                      { color: "#881337", position: 0 },
                      { color: "#e11d48", position: 50 },
                      { color: "#fb7185", position: 100 },
                    ],
                  },
                  {
                    name: "Royal Gold",
                    angle: 90,
                    stops: [
                      { color: "#78350f", position: 0 },
                      { color: "#d97706", position: 50 },
                      { color: "#fbbf24", position: 100 },
                    ],
                  },
                ]}
                quickPresets={[
                  { name: "Balochistan Emerald", hex: "#047857" },
                  { name: "Forest Green", hex: "#064e3b" },
                  { name: "Ruby Crimson", hex: "#dc2626" },
                  { name: "Academic Navy", hex: "#1e3a8a" },
                  { name: "Royal Gold", hex: "#d97706" },
                  { name: "Slate 900", hex: "#0f172a" },
                ]}
                customColors={formData.customColors}
                onAddCustomColor={handleAddCustomColor}
                extraControls={
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/75 p-3 rounded-xl border border-slate-800/90">
                    {/* Side Ribbons Opacity Control */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                        <span>Side Ribbons Opacity (سائیڈ پٹیوں کی شفافیت / کم یا زیادہ کریں):</span>
                        <span className="font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                          {formData.pageBannerWaveOpacity}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={formData.pageBannerWaveOpacity}
                          onChange={(e) => syncThemeField("pageBannerWaveOpacity", Number(e.target.value))}
                          className="flex-1 h-1.5 bg-slate-800 rounded accent-amber-500 cursor-pointer"
                        />
                        <div className="flex items-center gap-1">
                          {[25, 50, 75, 100].map((op) => (
                            <button
                              key={op}
                              type="button"
                              onClick={() => syncThemeField("pageBannerWaveOpacity", op)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                                formData.pageBannerWaveOpacity === op
                                  ? "bg-amber-500 text-slate-950"
                                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              }`}
                            >
                              {op}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Show / Hide Ribbons Toggle */}
                    <div className="flex items-center gap-2 sm:border-l sm:border-slate-800 sm:pl-4">
                      <span className="text-[11px] font-bold text-slate-300">Show Side Ribbons:</span>
                      <button
                        type="button"
                        onClick={() => syncThemeField("pageBannerWaveShow", !formData.pageBannerWaveShow)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all border ${
                          formData.pageBannerWaveShow
                            ? "bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-xs"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                        }`}
                      >
                        {formData.pageBannerWaveShow ? "Visible (ON)" : "Hidden (OFF)"}
                      </button>
                    </div>
                  </div>
                }
              />

              {/* ── LIVE REAL-TIME BANNER & WAVE PATII PREVIEW BOX ── */}
              <div className="bg-[#080d1a] p-4.5 rounded-2xl border border-slate-800 space-y-2.5 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 font-bold px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Header Banner & Wave Patii Preview (لائیو بینر اور لہر دار پٹی پریویو):</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        syncThemeField("pageBannerBg", "/gpgcq-campus-banner.jpg");
                        syncThemeField("pageBannerWaveColor", "#047857");
                        syncThemeField("pageBannerWaveOpacity", 100);
                        syncThemeField("pageBannerWaveShow", true);
                        syncThemeField("pageBannerHeight", 170);
                        syncThemeField("pageBannerImgWidth", 100);
                        syncThemeField("pageBannerFade", 85);
                      }}
                      className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-0.5 rounded-md cursor-pointer transition-all"
                    >
                      Reset Banner & Ribbons Default
                    </button>
                    <span className="text-emerald-400 font-mono text-[11px] bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                      Real-Time Dynamic Sync
                    </span>
                  </div>
                </div>
                <PortalPageHeader
                  title="Examinations & Results"
                  subtitle="Manage Exam Paper Attendance, Student Marks Entry, Result Compilation, and Promotions."
                  showAccentBar={true}
                  customBannerBg={formData.pageBannerBg}
                  customWaveColor={formData.pageBannerWaveColor}
                  customWaveOpacity={formData.pageBannerWaveOpacity}
                  customBannerHeight={formData.pageBannerHeight}
                  customBannerImgWidth={formData.pageBannerImgWidth}
                  customBannerFade={formData.pageBannerFade}
                  showWaves={formData.pageBannerWaveShow}
                />
              </div>
            </div>

            {/* ── ACTION BAR (MATCHING USER SCREENSHOT) ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-medium">
                Configuring portal for:{" "}
                <strong className="text-slate-200">
                  {selectedCollege?.name || "Govt. Post Graduate College Quetta"}
                </strong>
              </span>

              <div className="flex items-center gap-2.5">
                {selectedCollege && (
                  <a
                    href={`/colleges/${selectedCollege.code.toLowerCase()}${
                      formData.ribbonColor
                        ? `?theme=${encodeURIComponent(getRepresentativeColor(formData.ribbonColor, "#dc2626"))}`
                        : ""
                    }`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold transition-all hover:scale-102"
                  >
                    <span>Preview Portal</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/80 text-amber-300 font-bold text-xs transition-all hover:scale-102 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>{saving ? "Saving Changes..." : "Save Portal Settings"}</span>
                </button>
              </div>
            </div>

            {/* ── CUSTOM COLOR PALETTE MANAGER (DARK STYLED) ── */}
            <div className="p-4 rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Custom Color Palette Manager (کسٹم رنگ شامل کریں اور محفوظ رکھیں)</span>
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pick any custom color or enter hex code (e.g. 2653FF) and save it to your institutional custom palette.
                  </p>
                </div>

                {formData.customColors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, customColors: [] })}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold self-start sm:self-auto"
                  >
                    Clear All Custom Colors
                  </button>
                )}
              </div>

              {/* Input bar to add custom color */}
              <div className="flex flex-wrap items-center gap-2.5 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={toSafeColor(newCustomColor, "#2653FF")}
                    onChange={(e) => setNewCustomColor(e.target.value.toUpperCase())}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={newCustomColor}
                    onChange={(e) => setNewCustomColor(normalizeHex(e.target.value).toUpperCase())}
                    placeholder="#2653FF"
                    className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-200 uppercase focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleAddCustomColor(newCustomColor)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all hover:scale-102"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add to Custom Presets (نیا رنگ شامل کریں)</span>
                </button>
              </div>

              {/* Display of added custom color chips */}
              {formData.customColors.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Saved Custom Colors ({formData.customColors.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {formData.customColors.map((hex) => (
                      <div
                        key={hex}
                        className="group flex items-center gap-1.5 bg-slate-900 pl-1.5 pr-2 py-1 rounded-xl border border-slate-800 shadow-xs hover:border-slate-700 transition-all"
                      >
                        <div
                          className="w-5 h-5 rounded-md border border-slate-700 shadow-inner flex-shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-[11px] font-mono font-bold text-slate-200">{hex}</span>
                        <div className="h-3 w-px bg-slate-800 mx-0.5" />

                        {/* Quick apply pills */}
                        <div className="flex items-center gap-1 text-[9px] font-bold">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, collegeNameColor: hex })}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                            title="Apply to College Name"
                          >
                            Name
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, sidebarColor: hex })}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                            title="Apply to Sidebar"
                          >
                            Sidebar
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, ribbonColor: hex })}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                            title="Apply to Ribbon"
                          >
                            Ribbon
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, primaryColor: hex })}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                            title="Apply to Header"
                          >
                            Header
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, collegeHeaderBg: hex })}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                            title="Apply to College Header Box"
                          >
                            Box
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCustomColor(hex)}
                          className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors ml-1"
                          title="Remove preset"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  No custom colors added yet. Pick a color above and click "+ Add to Custom Presets" or click "Save" under any color card.
                </p>
              )}
            </div>
          </div>

            {/* ── HEADER BRANDING & TITLES (کالج کا نام اور پورٹل عنوان ایڈٹ کریں) ── */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-indigo-100/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-indigo-100/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <span>Sidebar Header Titles & Branding</span>
                      <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100/80 px-2 py-0.5 rounded-full">
                        کالج کا نام اور پورٹل کا عنوان
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Edit the college name and subtitle displayed at the top of the campus sidebar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. College Full Name */}
                <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      College Full Name (کالج کا نام):
                    </label>
                    <span className="text-[10px] font-mono text-indigo-600 font-bold">Main Heading</span>
                  </div>
                  <input
                    type="text"
                    value={formData.collegeName}
                    onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                    placeholder="e.g. Govt. Post Graduate College Quetta"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wide"
                  />
                  <p className="text-[10px] text-slate-400">
                    Displayed in the sidebar header and across public student result slips.
                  </p>
                </div>

                {/* 2. Campus ERP Portal Subtitle */}
                <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Portal Subtitle (نیچے والا عنوان / لیبل):
                    </label>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">Sub-label</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.portalSubtitle}
                      onChange={(e) => setFormData({ ...formData, portalSubtitle: e.target.value })}
                      placeholder="e.g. CAMPUS ERP PORTAL"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider"
                    />
                    {/* Subtitle color picker */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs" title="Subtitle Font Color">
                      <input
                        type="color"
                        value={toSafeColor(formData.portalSubtitleColor, "#4338ca")}
                        onChange={(e) => setFormData({ ...formData, portalSubtitleColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-300 bg-transparent p-0 flex-shrink-0"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-600">Color</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Default is "CAMPUS ERP PORTAL". Customize to any text (e.g. "OFFICIAL STUDENT & CMS PORTAL").
                  </p>
                </div>
              </div>
            </div>

            {/* Live Interactive Sidebar Color & Header Preview */}
            <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>🎨 Live Sidebar Preview (Custom Header Box + Theme Colors)</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Header Bg: {toSafeColor(formData.collegeHeaderBg, "#FFFFFF")} • Name: <span style={compileFillToTextStyle(formData.collegeNameColor, "#0f172a")}>{toSafeColor(formData.collegeNameColor, "#0f172a")}</span> • Sidebar: {toSafeColor(formData.sidebarColor, "#090E24")}
                </span>
              </div>
              <div className="max-w-xs rounded-2xl overflow-hidden shadow-lg border border-slate-300">
                {/* Dynamic Logo & Full Name Header Box */}
                <div
                  className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 transition-colors duration-200"
                  style={compileFillToStyle(formData.collegeHeaderBg, "#ffffff")}
                >
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="College Logo"
                      className="w-10 h-10 object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                      {selectedCollege?.code?.substring(0, 3) || "GDC"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-xs leading-tight transition-colors duration-200 line-clamp-2"
                      style={compileFillToTextStyle(formData.collegeNameColor, "#0f172a", {
                        fontFamily: formData.collegeFontFamily,
                        fontWeight: formData.collegeFontWeight,
                        fontStyle: formData.collegeFontStyle,
                        textDecoration: formData.collegeTextDecoration,
                        textTransform: formData.collegeTextTransform,
                        letterSpacing: formData.collegeLetterSpacing,
                        fontSize: formData.collegeFontSize,
                        textShadow: formData.collegeTextShadow,
                      })}
                    >
                      {formData.collegeName || selectedCollege?.name || "Govt. Post Graduate College Quetta"}
                    </div>
                    <div
                      className="text-[9px] font-black uppercase tracking-wider mt-0.5 flex items-center gap-1.5 transition-colors duration-200"
                      style={{ color: toSafeColor(formData.portalSubtitleColor, "#4338ca") }}
                    >
                      <span>{formData.portalSubtitle || "CAMPUS ERP PORTAL"}</span>
                      {selectedCollege?.code && (
                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-200/60 font-black">
                          {selectedCollege.code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Custom-Colored Sidebar Body */}
                <div
                  className="p-3.5 space-y-2 text-xs transition-colors duration-200"
                  style={compileFillToStyle(formData.sidebarColor, "#090E24")}
                >
                  <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-sm flex items-center justify-between">
                    <span>📊 Dashboard</span>
                    <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-black">Active</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl text-slate-200/90 hover:bg-white/10 text-xs font-medium flex items-center justify-between">
                    <span>👥 Admissions</span>
                    <span className="text-slate-400">›</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl text-slate-200/90 hover:bg-white/10 text-xs font-medium flex items-center justify-between">
                    <span>🎓 Students & Enrollment</span>
                    <span className="text-slate-400">›</span>
                  </div>
                </div>
              </div>

              {/* MS Word-Style Logo Background Remover Quick Action Bar */}
              <div className="mt-4 p-3.5 rounded-2xl bg-white border border-indigo-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Logo Background Remover (مونوگرام کا بیک گراؤنڈ ہٹائیں)</span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        MS Word Technique
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Remove white/solid backgrounds so your crest stays clean on any background color (White, Navy, Pink, Emerald).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
                  <button
                    type="button"
                    onClick={handleInstantAutoRemoveBg}
                    disabled={bgRemoverProcessing || !formData.logoUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-transform hover:scale-102 disabled:opacity-50"
                    title="1-Click automatic detection & removal of white background from corners inwards"
                  >
                    {bgRemoverProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>✨ 1-Click Remove White</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.logoUrl) return;
                      setShowBgRemoverModal(true);
                      await updateModalPreview(bgCustomColor, bgTolerance, bgFeather, bgMode);
                    }}
                    disabled={!formData.logoUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-transform hover:scale-102 disabled:opacity-50"
                    title="Open interactive MS Word background removal tool with eyedropper and tolerance sliders"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>🪄 Advanced MS Word Tool</span>
                  </button>

                  {formData.originalLogoUrl && (
                    <button
                      type="button"
                      onClick={handleRestoreOriginalLogo}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                      title="Restore original unedited logo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>↩️ Restore Original</span>
                    </button>
                  )}
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${formData.heroBgType === "IMAGE"
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${formData.heroBgType === "VIDEO"
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

              {/* Slide View Multiple Photos Gallery (Only for IMAGE type) */}
              {formData.heroBgType === "IMAGE" && (
                <div className="pt-3 border-t border-slate-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span>📸 Multi-Photo Slideshow Gallery (ایک سے زائد سلائیڈ تصاویر)</span>
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black">
                          {(formData.heroImages || []).length} Slide(s)
                        </span>
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Add multiple pictures to rotate automatically every 4.5 seconds on the college homepage banner.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Direct Upload Slide Button */}
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105">
                        {uploadingHero ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>Direct Upload Slide</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingHero}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setUploadingHero(true);
                              const url = await uploadFile(file);
                              const existing = formData.heroImages && formData.heroImages.length > 0 ? formData.heroImages : [formData.heroBgUrl];
                              const updated = [...existing, url];
                              setFormData({
                                ...formData,
                                heroImages: updated,
                                heroBgUrl: updated[0] || url,
                              });
                              setMsg({ type: "success", text: `Uploaded ${file.name} to college slideshow!` });
                            } catch (err: any) {
                              setMsg({ type: "error", text: err.message || "Failed to upload photo." });
                            } finally {
                              setUploadingHero(false);
                            }
                          }}
                        />
                      </label>

                      {/* Add Another Slide URL Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = [
                            ...(formData.heroImages && formData.heroImages.length > 0
                              ? formData.heroImages
                              : [formData.heroBgUrl || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80"]),
                            "https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80",
                          ];
                          setFormData({
                            ...formData,
                            heroImages: newImages,
                            heroBgUrl: newImages[0],
                          });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Slide</span>
                      </button>
                    </div>
                  </div>

                  {/* Slides Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(formData.heroImages && formData.heroImages.length > 0
                      ? formData.heroImages
                      : [formData.heroBgUrl || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80"]
                    ).map((imgUrl, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 relative group shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <span>Slide #{sIdx + 1}</span>
                            {sIdx === 0 && (
                              <span className="bg-red-50 text-red-600 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                Hero Active
                              </span>
                            )}
                          </span>

                          <div className="flex items-center gap-1">
                            {(formData.heroImages || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (formData.heroImages || []).filter((_, i) => i !== sIdx);
                                  setFormData({
                                    ...formData,
                                    heroImages: updated,
                                    heroBgUrl: updated[0] || "",
                                  });
                                }}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                title="Delete Slide"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Thumbnail */}
                        <div className="h-28 rounded-lg overflow-hidden bg-slate-900 border border-slate-200 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={`Slide ${sIdx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80";
                            }}
                          />
                        </div>

                        {/* URL input */}
                        <input
                          type="text"
                          value={imgUrl}
                          onChange={(e) => {
                            const newArr = [
                              ...(formData.heroImages && formData.heroImages.length > 0
                                ? formData.heroImages
                                : [formData.heroBgUrl || ""])
                            ];
                            newArr[sIdx] = e.target.value;
                            setFormData({
                              ...formData,
                              heroImages: newArr,
                              heroBgUrl: newArr[0] || "",
                            });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-800 focus:outline-none"
                          placeholder="/image.png or https://..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
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
                          setFormData((prev) => ({ ...prev, logoUrl: url, originalLogoUrl: url }));
                          setMsg({ type: "success", text: "College logo uploaded successfully!" });
                        } catch (err: any) {
                          setMsg({ type: "error", text: err.message || "Failed to upload logo." });
                        } finally {
                          setUploadingLogo(false);
                        }
                      }}
                    />
                  </label>

                  {formData.logoUrl && (
                    <>
                      <button
                        type="button"
                        onClick={handleInstantAutoRemoveBg}
                        disabled={bgRemoverProcessing}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                        title="1-Click remove white background from logo"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>✨ Remove Bg</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setShowBgRemoverModal(true);
                          await updateModalPreview(bgCustomColor, bgTolerance, bgFeather, bgMode);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all"
                        title="Open interactive MS Word background removal tool"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>🪄 MS Word Tool</span>
                      </button>

                      {formData.originalLogoUrl && (
                        <button
                          type="button"
                          onClick={handleRestoreOriginalLogo}
                          className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
                          title="Restore original unedited logo"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}

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

      {/* ── MS WORD-STYLE LOGO BACKGROUND REMOVAL MODAL ── */}
      {showBgRemoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide">
                    MS Word-Style Logo Background Remover (بیک گراؤنڈ شفاف بنائیں)
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Remove solid or white background so your emblem looks clean and transparent in any color.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBgRemoverModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Live Preview & Clean Result:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setBgPreviewTab("checker")}
                      className={`px-2 py-0.5 rounded ${bgPreviewTab === "checker" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      🏁 Checkerboard
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgPreviewTab("theme")}
                      className={`px-2 py-0.5 rounded ${bgPreviewTab === "theme" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      🎨 My Header Bg
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgPreviewTab("dark")}
                      className={`px-2 py-0.5 rounded ${bgPreviewTab === "dark" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      ⬛ Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgPreviewTab("white")}
                      className={`px-2 py-0.5 rounded ${bgPreviewTab === "white" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      ⬜ White
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Original Logo with Eyedropper Guide */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase text-slate-500 mb-2">
                      Original Logo (Click to sample color):
                    </span>
                    <div className="relative group cursor-crosshair rounded-xl border border-dashed border-slate-300 p-2 bg-white flex items-center justify-center min-h-[160px] w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        id="original-logo-preview"
                        src={formData.originalLogoUrl || formData.logoUrl}
                        alt="Original Logo"
                        className="max-h-36 max-w-full object-contain cursor-crosshair"
                        onClick={(e) => {
                          const target = e.currentTarget;
                          const rect = target.getBoundingClientRect();
                          const x = Math.floor((e.clientX - rect.left) * (target.naturalWidth / rect.width));
                          const y = Math.floor((e.clientY - rect.top) * (target.naturalHeight / rect.height));
                          const offCanvas = document.createElement("canvas");
                          offCanvas.width = target.naturalWidth;
                          offCanvas.height = target.naturalHeight;
                          const ctx = offCanvas.getContext("2d");
                          if (ctx) {
                            ctx.drawImage(target, 0, 0);
                            const p = ctx.getImageData(x, y, 1, 1).data;
                            const picked = { r: p[0], g: p[1], b: p[2] };
                            setBgCustomColor(picked);
                            updateModalPreview(picked);
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl flex items-center justify-center text-[11px] font-bold text-indigo-900">
                        <Pipette className="w-4 h-4 mr-1" /> Click anywhere to set transparent color
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <Pipette className="w-3 h-3 text-indigo-600" />
                      Target: {bgCustomColor ? `RGB(${bgCustomColor.r}, ${bgCustomColor.g}, ${bgCustomColor.b})` : "Auto-Detected (Corners)"}
                    </span>
                  </div>

                  {/* Clean Result Preview on selected background */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase text-emerald-600 mb-2">
                      Clean Transparent Result:
                    </span>
                    <div
                      className="rounded-xl border border-slate-300 p-2 flex items-center justify-center min-h-[160px] w-full transition-colors"
                      style={{
                        backgroundColor:
                          bgPreviewTab === "theme"
                            ? toSafeColor(formData.collegeHeaderBg, "#ffffff")
                            : bgPreviewTab === "dark"
                              ? "#090E24"
                              : bgPreviewTab === "white"
                                ? "#ffffff"
                                : "transparent",
                        backgroundImage:
                          bgPreviewTab === "checker"
                            ? "repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 16px 16px"
                            : "none",
                      }}
                    >
                      {bgRemoverProcessing ? (
                        <div className="flex flex-col items-center gap-1 text-indigo-600 font-bold text-xs">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Processing transparent PNG...</span>
                        </div>
                      ) : bgPreviewUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={bgPreviewUrl}
                          alt="Processed Transparent"
                          className="max-h-36 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Loading...</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1.5">
                      {bgPreviewTab === "theme" ? "Showing on your college header background" : "100% transparent PNG with alpha smoothing"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technique & Mode Controls */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Background Removal Technique (تکنیک منتخب کریں):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBgMode("contiguous");
                        updateModalPreview(bgCustomColor, bgTolerance, bgFeather, "contiguous");
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all ${bgMode === "contiguous"
                        ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-300 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Contiguous / Flood Fill (Recommended)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Removes outer background inwards from borders. Keeps white lettering & symbols inside the shield safe!
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBgMode("global");
                        updateModalPreview(bgCustomColor, bgTolerance, bgFeather, "global");
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all ${bgMode === "global"
                        ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-300 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950">
                        <Pipette className="w-3.5 h-3.5 text-indigo-600" />
                        <span>MS Word "Set Transparent Color" (Global)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Turns all matching pixels transparent across the whole image, exactly like Word's color-key wand.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Tolerance & Feather Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>Tolerance / Sensitivity (حساسیت):</span>
                      <span className="font-mono text-indigo-600">{bgTolerance}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={75}
                      value={bgTolerance}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBgTolerance(val);
                        updateModalPreview(bgCustomColor, val, bgFeather, bgMode);
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-400">Higher values remove JPG compression noise and halos.</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>Edge Feathering (کناروں کی صفائی):</span>
                      <span className="font-mono text-indigo-600">{bgFeather}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={bgFeather}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBgFeather(val);
                        updateModalPreview(bgCustomColor, bgTolerance, val, bgMode);
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-400">Smooths boundary pixels for crisp antialiasing.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setBgCustomColor(null);
                  setBgTolerance(28);
                  setBgFeather(6);
                  updateModalPreview(null, 28, 6, "contiguous");
                }}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Settings
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBgRemoverModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (bgPreviewUrl) {
                      setFormData((prev) => ({
                        ...prev,
                        originalLogoUrl: prev.originalLogoUrl || prev.logoUrl,
                        logoUrl: bgPreviewUrl,
                      }));
                      setMsg({ type: "success", text: "✨ Transparent logo applied successfully! Logo is clean on all backgrounds." });
                    }
                    setShowBgRemoverModal(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply & Use Transparent Logo (لاگو کریں)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
