"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FillConfig,
  FillMode,
  GradientStop,
  TextureType,
  ImageFitMode,
  ImagePosition,
  normalizeFillConfig,
  compileFillToStyle,
  compileFillToTextStyle,
  generatePatternSvg,
  COREL_SAMPLE_PICTURES,
  SamplePicture,
  TypographyConfig,
  MS_WORD_FONTS,
  MS_WORD_PRESETS,
  MS_WORD_COLOR_PALETTE,
  MsWordPreset,
} from "@/lib/theme-fill-compiler";
import {
  Palette,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Sliders,
  RotateCcw,
  Layers,
  Image as ImageIcon,
  Compass,
  Check,
  Disc,
  ZoomIn,
  ZoomOut,
  Target,
  Crosshair,
  Move,
  Bold,
  Italic,
  Underline,
  Type,
} from "lucide-react";

// Interactive Circular Angle Dial (360° Rotary Wheel)
export function AngleDial({
  angle,
  onChange,
}: {
  angle: number;
  onChange: (newAngle: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<SVGSVGElement>(null);

  const calculateAngle = (clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let deg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    if (deg < 0) deg += 360;
    onChange(deg);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    calculateAngle(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) calculateAngle(e.clientX, e.clientY);
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const rad = ((angle - 90) * Math.PI) / 180;
  const radius = 18;
  const cx = 26;
  const cy = 26;
  const pointerX = cx + radius * Math.cos(rad);
  const pointerY = cy + radius * Math.sin(rad);
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (angle / 360) * circumference;

  return (
    <div
      className="flex flex-col items-center select-none flex-shrink-0"
      title={`Current Angle: ${angle}°. Drag or click circle to rotate`}
    >
      <div className="relative flex items-center justify-center">
        <svg
          ref={dialRef}
          onMouseDown={handleMouseDown}
          className="w-13 h-13 cursor-pointer overflow-visible drop-shadow-md"
          viewBox="0 0 52 52"
        >
          {/* Outer Ring Background */}
          <circle cx="26" cy="26" r={radius} fill="#0d1424" stroke="#1f2c42" strokeWidth="3.5" />
          {/* Active Arc Fill */}
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            transform="rotate(-90 26 26)"
          />
          {/* Pointer Dot */}
          <circle
            cx={pointerX}
            cy={pointerY}
            r="3.5"
            fill="#fef08a"
            stroke="#b45309"
            strokeWidth="1.5"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-mono font-black text-amber-300 pointer-events-none tracking-tight">
          {angle}°
        </span>
      </div>
    </div>
  );
}

export interface CorelFillPickerCardProps {
  cardId?: string;
  title: string;
  subtitleUrdu?: string;
  value: FillConfig | string;
  onChange: (newVal: FillConfig) => void;
  defaultColor?: string;
  quickPresets?: { name: string; hex: string }[];
  customColors?: string[];
  onAddCustomColor?: (hex: string) => void;
  accentBadgeColor?: string;
  topRibbonAccent?: boolean;
  gradientPresets?: { name: string; stops: GradientStop[]; angle: number }[];
  isTextColorOnly?: boolean;
  typography?: TypographyConfig;
  onTypographyChange?: (typo: TypographyConfig) => void;
  extraControls?: React.ReactNode;
}

export default function CorelFillPickerCard({
  cardId,
  title,
  subtitleUrdu,
  value,
  onChange,
  defaultColor = "#000000",
  quickPresets = [],
  customColors = [],
  onAddCustomColor,
  topRibbonAccent = false,
  gradientPresets,
  isTextColorOnly = false,
  typography,
  onTypographyChange,
  extraControls,
}: CorelFillPickerCardProps) {
  const conf = normalizeFillConfig(value, defaultColor);

  // Active selected stop for gradient editing (index 0..n)
  const [selectedStopIdx, setSelectedStopIdx] = useState<number>(0);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const gradientBarRef = useRef<HTMLDivElement>(null);

  // Update mode
  const setMode = (mode: FillMode) => {
    onChange({
      ...conf,
      mode,
    });
  };

  // ── Solid Handlers ──
  const handleSolidColorChange = (hex: string) => {
    let clean = (hex || "").trim();
    if (clean && !clean.startsWith("#")) clean = "#" + clean;
    onChange({
      ...conf,
      solid: clean,
    });
  };

  // ── Gradient Handlers ──
  const handleGradientTypeChange = (type: "linear" | "radial" | "conic") => {
    onChange({
      ...conf,
      mode: "gradient",
      gradient: {
        ...conf.gradient,
        type,
      },
    });
  };

  const handleGradientAngleChange = (angle: number) => {
    const safeAngle = Math.max(0, Math.min(360, Math.round(angle)));
    onChange({
      ...conf,
      gradient: {
        ...conf.gradient,
        angle: safeAngle,
      },
    });
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gradientBarRef.current) return;
    const rect = gradientBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));

    // Pick color from nearest stop or solid
    const newStop: GradientStop = {
      color: conf.solid || defaultColor,
      position: percent,
    };

    const newStops = [...conf.gradient.stops, newStop].sort((a, b) => a.position - b.position);
    const newIdx = newStops.findIndex((s) => s.position === percent);

    onChange({
      ...conf,
      gradient: {
        ...conf.gradient,
        stops: newStops,
      },
    });
    setSelectedStopIdx(newIdx >= 0 ? newIdx : 0);
  };

  const updateStopColor = (idx: number, color: string) => {
    const updated = [...conf.gradient.stops];
    if (!updated[idx]) return;
    updated[idx] = { ...updated[idx], color };
    onChange({
      ...conf,
      gradient: {
        ...conf.gradient,
        stops: updated,
      },
    });
  };

  const updateStopPos = (idx: number, pos: number) => {
    const updated = [...conf.gradient.stops];
    if (!updated[idx]) return;
    updated[idx] = { ...updated[idx], position: Math.max(0, Math.min(100, Math.round(pos))) };
    onChange({
      ...conf,
      gradient: {
        ...conf.gradient,
        stops: updated,
      },
    });
  };

  const removeStop = (idx: number) => {
    if (conf.gradient.stops.length <= 2) return;
    const updated = conf.gradient.stops.filter((_, i) => i !== idx);
    onChange({
      ...conf,
      gradient: {
        ...conf.gradient,
        stops: updated,
      },
    });
    setSelectedStopIdx(Math.max(0, idx - 1));
  };

  const applyGradientPreset = (p: { name: string; stops: GradientStop[]; angle: number }) => {
    onChange({
      ...conf,
      mode: "gradient",
      gradient: {
        type: conf.gradient.type || "linear",
        angle: p.angle,
        stops: p.stops,
      },
    });
    setSelectedStopIdx(0);
  };

  // ── Texture Handlers ──
  const handleTextureTypeChange = (type: TextureType) => {
    onChange({
      ...conf,
      mode: "texture",
      texture: {
        ...conf.texture,
        type,
      },
    });
  };

  const handleTextureBaseColor = (baseColor: string) => {
    onChange({
      ...conf,
      texture: {
        ...conf.texture,
        baseColor,
      },
    });
  };

  const handleTexturePatternColor = (patternColor: string) => {
    onChange({
      ...conf,
      texture: {
        ...conf.texture,
        patternColor,
      },
    });
  };

  const handleTextureScale = (scale: number) => {
    onChange({
      ...conf,
      texture: {
        ...conf.texture,
        scale: Math.max(10, Math.min(80, scale)),
      },
    });
  };

  const handleTextureOpacity = (opacity: number) => {
    onChange({
      ...conf,
      texture: {
        ...conf.texture,
        opacity: Math.max(5, Math.min(100, opacity)),
      },
    });
  };

  // ── Picture Handlers ──
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose a valid image file (PNG, JPG, WEBP, SVG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    setIsUploadingImg(true);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      onChange({
        ...conf,
        mode: "image",
        image: {
          ...conf.image,
          url: b64,
        },
      });
      setIsUploadingImg(false);
    };
    reader.onerror = () => {
      alert("Failed to read image file.");
      setIsUploadingImg(false);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (url: string) => {
    onChange({
      ...conf,
      mode: "image",
      image: {
        ...conf.image,
        url,
      },
    });
  };

  const handleImageFit = (fit: ImageFitMode) => {
    onChange({
      ...conf,
      image: {
        ...conf.image,
        fit,
      },
    });
  };

  const handleImagePosition = (position: ImagePosition) => {
    onChange({
      ...conf,
      image: {
        ...conf.image,
        position,
      },
    });
  };

  const handleImageTint = (tintColor: string) => {
    onChange({
      ...conf,
      image: {
        ...conf.image,
        tintColor,
      },
    });
  };

  const handleImageTintOpacity = (tintOpacity: number) => {
    onChange({
      ...conf,
      image: {
        ...conf.image,
        tintOpacity: Math.max(0, Math.min(95, tintOpacity)),
      },
    });
  };

  const handleImageOpacity = (opacity: number) => {
    onChange({
      ...conf,
      image: {
        ...conf.image,
        opacity: Math.max(0, Math.min(100, Math.round(opacity))),
      },
    });
  };

  const handleZoom = (zoom: number) => {
    const clamped = Math.max(25, Math.min(400, Math.round(zoom)));
    onChange({
      ...conf,
      image: {
        ...conf.image,
        zoom: clamped,
      },
    });
  };

  const handleFocalPoint = (x: number, y: number) => {
    const clampedX = Math.max(0, Math.min(100, Math.round(x)));
    const clampedY = Math.max(0, Math.min(100, Math.round(y)));
    onChange({
      ...conf,
      image: {
        ...conf.image,
        focalPoint: { x: clampedX, y: clampedY },
        position: `${clampedX}% ${clampedY}%`,
      },
    });
  };

  const handleScaleMode = (scaleMode: "auto" | "width" | "height" | "both") => {
    onChange({
      ...conf,
      image: {
        ...conf.image,
        scaleMode,
      },
    });
  };

  const handlePreviewBoxClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (conf.mode !== "image" || !conf.image.url) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    handleFocalPoint(clickX, clickY);
  };

  // Live CSS style compiled for current card
  const liveCardStyle = compileFillToStyle(conf, defaultColor);
  const liveTextStyle = compileFillToTextStyle(conf, defaultColor, typography);

  // MS Word Typography Handlers
  const handleApplyMsWordPreset = (p: MsWordPreset) => {
    const newFill = typeof p.color === "object" ? p.color : normalizeFillConfig(p.color);
    onChange(newFill);
    if (onTypographyChange) {
      onTypographyChange({
        fontFamily: p.fontFamily,
        fontWeight: p.fontWeight,
        fontStyle: p.fontStyle,
        textDecoration: p.textDecoration,
        textTransform: p.textTransform,
        letterSpacing: p.letterSpacing,
        fontSize: p.fontSize,
        textShadow: p.textShadow,
      });
    }
  };

  const updateTypo = (updates: Partial<TypographyConfig>) => {
    if (onTypographyChange) {
      onTypographyChange({
        ...typography,
        ...updates,
      });
    }
  };

  // Built-in presets for gradient row
  const activeGradientPresets =
    gradientPresets || [
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
    ];

  // 10 CorelDRAW Texture Presets
  const ALL_TEXTURE_PRESETS: { id: TextureType; name: string; nameUrdu: string }[] = [
    { id: "carbon", name: "Carbon Fiber", nameUrdu: "کاربن فائبر" },
    { id: "mesh", name: "Dark Mesh", nameUrdu: "ہیکس میش" },
    { id: "guilloche", name: "Guilloche Wave", nameUrdu: "سیکیورٹی ویو" },
    { id: "islamic", name: "Islamic Star", nameUrdu: "اسلامی جیومیٹری" },
    { id: "golddust", name: "Gold Dust", nameUrdu: "گولڈ ڈسٹ گرین" },
    { id: "canvas", name: "Fine Canvas", nameUrdu: "کینوس فیبرک" },
    { id: "grid", name: "Blueprint Grid", nameUrdu: "اکیڈمک گرڈ" },
    { id: "stripes", name: "Tech Stripes", nameUrdu: "ڈائیگنل اسٹرائپس" },
    { id: "dots", name: "Subtle Dots", nameUrdu: "ماڈرن ڈاٹس" },
    { id: "marble", name: "Marble Vein", nameUrdu: "ماربل گرینائٹ" },
  ];

  return (
    <div
      id={cardId ? `portal-card-${cardId}` : undefined}
      className="p-4 sm:p-5 rounded-2xl bg-[#0c1220]/90 border border-slate-800/90 shadow-xl transition-all space-y-3 relative overflow-hidden"
    >
      {/* Optional Top Ribbon Accent Bar (as shown in user screenshot for Top Accent Ribbon) */}
      {topRibbonAccent && (
        <div
          className="h-1.5 -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-3.5 rounded-t-2xl overflow-hidden shadow-xs"
          style={liveCardStyle}
        />
      )}

      {/* ── CARD HEADER: Title + Bracket-Style Mode Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
        <div>
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 tracking-wide">
            <span>{title}</span>
            {isTextColorOnly && (
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/40 text-amber-300 font-mono px-2 py-0.5 rounded-full">
                Text Clip Engine
              </span>
            )}
          </h4>
          {subtitleUrdu && (
            <span className="text-[11px] text-slate-400 font-medium block leading-tight">
              {subtitleUrdu}
            </span>
          )}
        </div>

        {/* 4-Mode Switcher in Bracket Format [ Solid ] [ Gradient (Corel-style) ] [ Texture ] [ Image ] */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono select-none flex-wrap">
          {/* Mode A: Solid */}
          <button
            type="button"
            onClick={() => setMode("solid")}
            className={`transition-all cursor-pointer ${conf.mode === "solid"
              ? "text-amber-400 font-black drop-shadow-xs"
              : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
          >
            [ Solid ]
          </button>

          {/* Mode B: Gradient */}
          <button
            type="button"
            onClick={() => setMode("gradient")}
            className={`transition-all cursor-pointer ${conf.mode === "gradient"
              ? "text-amber-400 font-black drop-shadow-xs"
              : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
          >
            [ Gradient (Corel-style) ]
          </button>

          {/* Mode C: Texture */}
          <button
            type="button"
            onClick={() => setMode("texture")}
            className={`transition-all cursor-pointer ${conf.mode === "texture"
              ? "text-amber-400 font-black drop-shadow-xs"
              : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
          >
            [ Texture ]
          </button>

          {/* Mode D: Image */}
          <button
            type="button"
            onClick={() => setMode("image")}
            className={`transition-all cursor-pointer ${conf.mode === "image"
              ? "text-amber-400 font-black drop-shadow-xs"
              : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
          >
            [ Image ]
          </button>
        </div>
      </div>

      {/* ── CARD BODY (2-COLUMN HORIZONTAL STUDIO LAYOUT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* LEFT COLUMN: Large Wide Preview Rectangle (approx 35%-40% width) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          {isTextColorOnly ? (
            <div
              onClick={handlePreviewBoxClick}
              className={`w-full min-h-24 sm:min-h-28 rounded-xl border border-slate-700/80 shadow-inner relative overflow-hidden transition-all duration-200 flex flex-col items-center justify-center p-3 bg-slate-950/80 ${conf.mode === "image" && conf.image.url ? "cursor-crosshair" : ""
                }`}
              title={
                conf.mode === "image" && conf.image.url
                  ? "Click anywhere to set focus / Pan position (کلک کر کے فوکس پوائنٹ منتخب کریں)"
                  : ""
              }
            >
              <div className="flex items-center gap-1.5 mb-1 text-[9.5px] uppercase font-mono text-slate-400">
                <Type className="w-3 h-3 text-amber-400" />
                <span>College Typography Preview</span>
              </div>
              <span
                className="tracking-wider text-center px-2 line-clamp-2 transition-all duration-150"
                style={liveTextStyle}
              >
                GOVT. POST GRADUATE COLLEGE QUETTA
              </span>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1 mt-2 text-[9px] font-mono text-slate-400">
                <span className="text-amber-300 font-bold bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded">
                  {MS_WORD_FONTS.find((f) => f.value === typography?.fontFamily)?.name || "Segoe UI"}
                </span>
                <span className="bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded">
                  {typography?.fontWeight === "700" || typography?.fontWeight === "800" || typography?.fontWeight === "900" ? "Bold" : "Regular"}
                </span>
                {typography?.fontStyle === "italic" && (
                  <span className="bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded italic text-amber-300">
                    Italic
                  </span>
                )}
                {typography?.textDecoration === "underline" && (
                  <span className="bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded underline text-blue-300">
                    Underline
                  </span>
                )}
                <span className="bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded uppercase">
                  {typography?.textTransform || "UPPERCASE"}
                </span>
                {typography?.fontSize && (
                  <span className="bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded text-slate-300">
                    {typography.fontSize}
                  </span>
                )}
              </div>

              {/* Reticle indicator if image mode */}
              {conf.mode === "image" && conf.image.url && (
                <>
                  <div
                    className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-amber-400 bg-amber-400/30 flex items-center justify-center pointer-events-none shadow-md"
                    style={{
                      left: `${conf.image.focalPoint?.x ?? 50}%`,
                      top: `${conf.image.focalPoint?.y ?? 50}%`,
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-slate-950/85 px-1.5 py-0.5 rounded text-[8.5px] font-mono text-amber-300 border border-slate-700 pointer-events-none">
                    Zoom: {conf.image.zoom ?? 100}% | Focal: ({conf.image.focalPoint?.x ?? 50}%, {conf.image.focalPoint?.y ?? 50}%)
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              onClick={handlePreviewBoxClick}
              className={`w-full h-24 sm:h-28 rounded-xl border border-slate-700/80 shadow-inner relative overflow-hidden transition-all duration-200 flex items-center justify-center ${conf.mode === "image" ? "bg-white" : "bg-slate-950"
                } ${conf.mode === "image" && conf.image.url ? "cursor-crosshair" : ""}`}
              title={
                conf.mode === "image" && conf.image.url
                  ? "Click anywhere to set focus / Pan position (کلک کر کے فوکس پوائنٹ منتخب کریں)"
                  : "Live Fill Preview"
              }
            >
              <div className="absolute inset-0 transition-all duration-200" style={liveCardStyle} />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none" />

              {/* Reticle Crosshair Marker on Picture */}
              {conf.mode === "image" && conf.image.url && (
                <>
                  <div
                    className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-amber-400 bg-amber-400/30 flex items-center justify-center pointer-events-none shadow-lg animate-pulse"
                    style={{
                      left: `${conf.image.focalPoint?.x ?? 50}%`,
                      top: `${conf.image.focalPoint?.y ?? 50}%`,
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                    <div className="absolute w-8 h-[1px] bg-amber-400/70" />
                    <div className="absolute h-8 w-[1px] bg-amber-400/70" />
                  </div>

                  {/* Live Status Badge */}
                  <div className="absolute bottom-1.5 right-1.5 bg-slate-950/90 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-mono text-amber-300 border border-slate-700 pointer-events-none flex items-center gap-1.5 shadow-sm">
                    <span className="font-bold">Zoom: {conf.image.zoom ?? 100}%</span>
                    <span className="text-slate-500">•</span>
                    <span>Pos: ({conf.image.focalPoint?.x ?? 50}%, {conf.image.focalPoint?.y ?? 50}%)</span>
                    {(conf.image.opacity ?? 100) < 100 && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span>Opacity: {conf.image.opacity}%</span>
                      </>
                    )}
                  </div>

                  <div className="absolute top-1.5 left-1.5 bg-slate-950/80 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-300 border border-slate-700 pointer-events-none flex items-center gap-1">
                    <Crosshair className="w-2.5 h-2.5 text-amber-400" />
                    <span>Click image to Pan</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Controls according to active mode */}
        <div className="lg:col-span-7 space-y-3">
          {/* ══════════════════════════════════════════════════════
              MICROSOFT WORD TYPOGRAPHY & FONT STYLE STUDIO
             ══════════════════════════════════════════════════════ */}
          {isTextColorOnly && (
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2.5">
              {/* Row 1: MS Word Presets Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">
                      MS Word Style Presets (مائیکروسافٹ ورڈ پریسیٹس)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">1-Click Apply</span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                  {MS_WORD_PRESETS.map((p) => {
                    const isSelected = typography?.fontFamily === p.fontFamily;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleApplyMsWordPreset(p)}
                        className={`px-2.5 py-1 rounded-lg border text-left transition-all hover:scale-102 cursor-pointer flex items-center gap-1.5 ${isSelected
                          ? "bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/50"
                          : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        title={`${p.name} - ${p.nameUrdu}`}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{
                            fontFamily: p.fontFamily,
                            fontWeight: p.fontWeight,
                            fontStyle: p.fontStyle,
                          }}
                        >
                          Aa
                        </span>
                        <div className="leading-none">
                          <span className="text-[10.5px] font-bold block">{p.name}</span>
                          <span className="text-[8.5px] text-slate-400 block">{p.nameUrdu}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: MS Word Formatting Toolbar (Font Family, Bold, Italic, Underline, Case, Spacing, Size, Glow) */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                {/* Font Family Select */}
                <div className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={typography?.fontFamily || "'Times New Roman', Times, serif"}
                    onChange={(e) => updateTypo({ fontFamily: e.target.value })}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer max-w-[200px] truncate"
                  >
                    {MS_WORD_FONTS.map((f) => (
                      <option key={f.id} value={f.value} style={{ fontFamily: f.value }}>
                        {f.name} ({f.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* MS Word Action Buttons (B, I, U, Aa, ↔, ✨, Size) */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 flex-wrap">
                  {/* Bold (B) */}
                  <button
                    type="button"
                    onClick={() =>
                      updateTypo({
                        fontWeight:
                          typography?.fontWeight === "700" ||
                            typography?.fontWeight === "800" ||
                            typography?.fontWeight === "900"
                            ? "400"
                            : "700",
                      })
                    }
                    className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer ${typography?.fontWeight === "700" ||
                      typography?.fontWeight === "800" ||
                      typography?.fontWeight === "900"
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "text-slate-300 hover:bg-slate-800"
                      }`}
                    title="Bold (بولڈ)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>

                  {/* Italic (I) */}
                  <button
                    type="button"
                    onClick={() =>
                      updateTypo({
                        fontStyle: typography?.fontStyle === "italic" ? "normal" : "italic",
                      })
                    }
                    className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer ${typography?.fontStyle === "italic"
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "text-slate-300 hover:bg-slate-800"
                      }`}
                    title="Italic (ترچھا)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>

                  {/* Underline (U) */}
                  <button
                    type="button"
                    onClick={() =>
                      updateTypo({
                        textDecoration:
                          typography?.textDecoration === "underline" ? "none" : "underline",
                      })
                    }
                    className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer ${typography?.textDecoration === "underline"
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "text-slate-300 hover:bg-slate-800"
                      }`}
                    title="Underline (انڈر لائن)"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

                  {/* Case (Aa) */}
                  <button
                    type="button"
                    onClick={() => {
                      const cur = typography?.textTransform || "uppercase";
                      const next =
                        cur === "uppercase"
                          ? "capitalize"
                          : cur === "capitalize"
                            ? "lowercase"
                            : cur === "lowercase"
                              ? "none"
                              : "uppercase";
                      updateTypo({ textTransform: next });
                    }}
                    className="px-1.5 h-7 rounded flex items-center justify-center text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                    title={`Text Case: ${typography?.textTransform || "UPPERCASE"} (کلک کر کے تبدیل کریں)`}
                  >
                    {typography?.textTransform === "capitalize"
                      ? "Aa"
                      : typography?.textTransform === "lowercase"
                        ? "aa"
                        : typography?.textTransform === "none"
                          ? "--"
                          : "AA"}
                  </button>

                  {/* Letter Spacing (↔) */}
                  <button
                    type="button"
                    onClick={() => {
                      const cur = typography?.letterSpacing || "0.05em";
                      const next =
                        cur === "normal"
                          ? "0.05em"
                          : cur === "0.05em"
                            ? "0.1em"
                            : cur === "0.1em"
                              ? "0.15em"
                              : "normal";
                      updateTypo({ letterSpacing: next });
                    }}
                    className="px-1.5 h-7 rounded flex items-center justify-center text-[10px] font-mono text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                    title={`Letter Spacing: ${typography?.letterSpacing || "0.05em"}`}
                  >
                    ↔ {typography?.letterSpacing === "0.15em" ? "+3" : typography?.letterSpacing === "0.1em" ? "+2" : typography?.letterSpacing === "0.05em" ? "+1" : "0"}
                  </button>

                  {/* WordArt Glow Shadow (✨) */}
                  <button
                    type="button"
                    onClick={() =>
                      updateTypo({
                        textShadow:
                          typography?.textShadow && typography.textShadow !== "none"
                            ? "none"
                            : "0 2px 8px rgba(217, 119, 6, 0.45)",
                      })
                    }
                    className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer ${typography?.textShadow && typography.textShadow !== "none"
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "text-slate-300 hover:bg-slate-800"
                      }`}
                    title="WordArt Glow Shadow (گلو شیڈو)"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

                  {/* Font Size Selector */}
                  <select
                    value={typography?.fontSize || "13px"}
                    onChange={(e) => updateTypo({ fontSize: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10.5px] text-slate-200 font-mono cursor-pointer"
                    title="Font Size (فانٹ سائز)"
                  >
                    <option value="11px">11px</option>
                    <option value="12px">12px</option>
                    <option value="13px">13px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          {/* ══════════════════════════════════════════════════════
              MODE B: MULTI-COLOR GRADIENT (Corel-Style Fountain)
             ══════════════════════════════════════════════════════ */}
          {conf.mode === "gradient" && (
            <div className="space-y-3">
              {/* Row 1: Header + Gradient Style Switcher (Linear | Radial | Conic) */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  {conf.gradient.stops.length > 2 ? "Active Fountain Gradient" : "Gradient"}
                </span>

                {/* 1-Click Corel Fountain Style Switcher */}
                <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-700/80 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => handleGradientTypeChange("linear")}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${conf.gradient.type === "linear"
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    Linear (لکیری)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGradientTypeChange("radial")}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${conf.gradient.type === "radial"
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    Radial (دائرہ)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGradientTypeChange("conic")}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${conf.gradient.type === "conic"
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    Conic (سویپ)
                  </button>
                </div>
              </div>

              {/* Row 2: Gradient Track + Angle Dial */}
              <div className="flex items-center gap-4">
                {/* Interactive Multi-Stop Bar */}
                <div className="flex-1 space-y-2">
                  <div
                    ref={gradientBarRef}
                    onClick={handleBarClick}
                    className="h-6 w-full rounded-lg cursor-crosshair relative shadow-inner border border-slate-700/90 select-none"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${[...conf.gradient.stops]
                        .sort((a, b) => a.position - b.position)
                        .map((s) => `${s.color} ${s.position}%`)
                        .join(", ")})`,
                    }}
                    title="Click anywhere on the bar to add a new color stop"
                  >
                    {/* Pin markers for each stop */}
                    {conf.gradient.stops.map((stop, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStopIdx(i);
                        }}
                        style={{ left: `${stop.position}%` }}
                        className={`absolute -bottom-2.5 -translate-x-1/2 w-4 h-4 rounded-xs border-2 cursor-pointer transition-transform shadow-md ${selectedStopIdx === i
                          ? "border-amber-400 scale-125 z-10 ring-2 ring-amber-400/50"
                          : "border-slate-900 hover:scale-110 z-0"
                          }`}
                        title={`Stop ${i + 1}: ${stop.color} (${stop.position}%)`}
                      >
                        <span
                          className="block w-full h-full rounded-xs"
                          style={{ backgroundColor: stop.color }}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Compact stop editor row */}
                  {conf.gradient.stops[selectedStopIdx] && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-slate-300">
                      <span className="text-slate-400 text-[10px]">Stop #{selectedStopIdx + 1}:</span>
                      <input
                        type="color"
                        value={conf.gradient.stops[selectedStopIdx]?.color || "#ffffff"}
                        onChange={(e) => updateStopColor(selectedStopIdx, e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={conf.gradient.stops[selectedStopIdx]?.color || ""}
                        onChange={(e) => updateStopColor(selectedStopIdx, e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-200 uppercase"
                      />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={conf.gradient.stops[selectedStopIdx]?.position || 0}
                        onChange={(e) => updateStopPos(selectedStopIdx, Number(e.target.value))}
                        className="w-20 h-1 bg-slate-800 rounded accent-amber-500 cursor-pointer"
                      />
                      <span className="text-[10px] text-amber-300">
                        {conf.gradient.stops[selectedStopIdx]?.position}%
                      </span>

                      {conf.gradient.stops.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeStop(selectedStopIdx)}
                          className="text-[10px] text-red-400 hover:text-red-300 ml-auto flex items-center gap-0.5"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Circular 360° Angle Dial (For Linear and Conic) */}
                {conf.gradient.type !== "radial" ? (
                  <AngleDial
                    angle={conf.gradient.angle}
                    onChange={(ang) => handleGradientAngleChange(ang)}
                  />
                ) : (
                  <div className="w-13 h-13 rounded-full bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center p-1">
                    <Disc className="w-4 h-4 text-amber-400 animate-spin-slow" />
                    <span className="text-[9px] font-mono text-slate-400">Center</span>
                  </div>
                )}
              </div>

              {/* Row 3: Presets */}
              <div className="space-y-1 pt-1 border-t border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeGradientPresets.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyGradientPreset(p)}
                      className="px-3 py-1 rounded-md text-xs font-bold text-white shadow-xs hover:scale-105 active:scale-95 transition-all border border-white/10"
                      style={{
                        backgroundImage: `linear-gradient(${p.angle}deg, ${p.stops
                          .map((s) => `${s.color} ${s.position}%`)
                          .join(", ")})`,
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              MODE C: TEXTURE & PATTERN FILL (COREL-DRAW TEXTURES)
             ══════════════════════════════════════════════════════ */}
          {conf.mode === "texture" && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                CorelDRAW Texture Presets (پیٹرن و ٹیکسچر گیلری)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* 10 Texture Preset Thumbnails */}
                <div className="sm:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {ALL_TEXTURE_PRESETS.map((tex) => (
                    <button
                      key={tex.id}
                      type="button"
                      onClick={() => handleTextureTypeChange(tex.id)}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${conf.texture.type === tex.id
                        ? "border-amber-400 bg-amber-500/10 shadow-xs ring-1 ring-amber-400"
                        : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                        }`}
                    >
                      <div
                        className="w-full h-7 rounded border border-slate-700/60 mb-1"
                        style={{
                          backgroundColor: conf.texture.baseColor || "#0f172a",
                          backgroundImage: `url("${generatePatternSvg(
                            tex.id,
                            conf.texture.patternColor || "#ffffff",
                            conf.texture.opacity || 30
                          )}")`,
                          backgroundSize: `${conf.texture.scale || 20}px ${conf.texture.scale || 20}px`,
                        }}
                      />
                      <span className="text-[10px] font-bold text-slate-200 tracking-tight block truncate w-full text-center">
                        {tex.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Texture Controls (Scale, Opacity, Base & Pattern Color) */}
                <div className="sm:col-span-5 space-y-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  {/* Colors: Base & Pattern Tint */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Base & Pattern:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={conf.texture.baseColor || "#0f172a"}
                        onChange={(e) => handleTextureBaseColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                        title="Base Background Color"
                      />
                      <input
                        type="color"
                        value={conf.texture.patternColor || "#ffffff"}
                        onChange={(e) => handleTexturePatternColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                        title="Pattern Line / Tint Color"
                      />
                    </div>
                  </div>

                  {/* Scale Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Scale:</span>
                      <span className="font-mono text-amber-300">{conf.texture.scale || 20}px</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      value={conf.texture.scale || 20}
                      onChange={(e) => handleTextureScale(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Opacity Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Opacity:</span>
                      <span className="font-mono text-amber-300">{conf.texture.opacity || 30}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={conf.texture.opacity || 30}
                      onChange={(e) => handleTextureOpacity(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              MODE A: SOLID FILL
             ══════════════════════════════════════════════════════ */}
          {conf.mode === "solid" && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Solid Color</span>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="color"
                  value={conf.solid || defaultColor}
                  onChange={(e) => handleSolidColorChange(e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-700 bg-transparent p-0.5 flex-shrink-0"
                />
                <input
                  type="text"
                  value={conf.solid || ""}
                  onChange={(e) => handleSolidColorChange(e.target.value)}
                  placeholder="#1e3a8a"
                  className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-200 uppercase focus:outline-none focus:ring-1 focus:ring-amber-400"
                />

                {onAddCustomColor && (
                  <button
                    type="button"
                    onClick={() => onAddCustomColor(conf.solid)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold transition-all"
                  >
                    <Plus className="w-3 h-3" /> Save Color
                  </button>
                )}
              </div>

              {/* Quick Presets */}
              {quickPresets.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickPresets.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => handleSolidColorChange(c.hex)}
                        className="px-2.5 py-0.5 rounded text-[11px] font-bold shadow-xs hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: c.hex,
                          color:
                            c.hex.toLowerCase() === "#ffffff" || c.hex.toLowerCase() === "#f8fafc"
                              ? "#0f172a"
                              : "#ffffff",
                          border: c.hex.toLowerCase() === "#ffffff" ? "1px solid #64748b" : "none",
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              MODE D: IMAGE FILL & COREL SAMPLE PICTURES
             ══════════════════════════════════════════════════════ */}
          {conf.mode === "image" && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                Sample Pictures & Backgrounds (سیمپل تصاویر اور اپلوڈ)
              </span>

              {/* Sample Pictures Gallery Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COREL_SAMPLE_PICTURES.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => handleImageUrlChange(sp.url)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${conf.image.url === sp.url
                      ? "border-amber-400 bg-amber-500/15 ring-1 ring-amber-400"
                      : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                      }`}
                  >
                    <div
                      className="w-7 h-7 rounded border border-slate-700 flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: `url("${sp.url}")` }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-slate-200 block truncate">
                        {sp.name}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 block truncate">
                        {sp.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Upload Button + URL Input */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-slate-800/80">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold cursor-pointer transition-all flex-shrink-0">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isUploadingImg ? "Uploading..." : "Upload File"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={conf.image.url}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  placeholder="Paste Image URL (https://.../portal-bg.jpg)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* ── SECTION 1: ZOOM IN / ZOOM OUT CONTROLS ── */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Picture Zoom In / Zoom Out (تصویر کا زوم)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleZoom((conf.image.zoom ?? 100) - 20)}
                      title="Zoom Out (-20%)"
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZoom(100)}
                      title="Reset Zoom to 100%"
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5 text-amber-400" />
                      <span>100%</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZoom((conf.image.zoom ?? 100) + 20)}
                      title="Zoom In (+20%)"
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-amber-300 font-bold text-xs bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded ml-1">
                      {conf.image.zoom ?? 100}%
                    </span>
                  </div>
                </div>

                {/* Range Slider for Zoom */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] font-mono text-slate-400 w-8">25%</span>
                  <input
                    type="range"
                    min={25}
                    max={300}
                    step={5}
                    value={conf.image.zoom ?? 100}
                    onChange={(e) => handleZoom(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-[10px] font-mono text-slate-400 w-8 text-right">300%</span>
                </div>

                {/* Fit Mode Switcher + Scale Axis */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div className="flex items-center gap-1 text-slate-400 font-medium">
                    <span>Fit Mode:</span>
                    <div className="flex items-center gap-1">
                      {(["cover", "contain", "repeat", "stretch"] as const).map((fit) => (
                        <button
                          key={fit}
                          type="button"
                          onClick={() => handleImageFit(fit)}
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all cursor-pointer ${conf.image.fit === fit
                            ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                        >
                          {fit === "cover" ? "Cover (پورا بھریں)" : fit === "contain" ? "Contain (پوری تصویر)" : fit}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="text-[10px]">Scale Axis:</span>
                    <select
                      value={conf.image.scaleMode || (cardId === "sidebarColor" ? "height" : "auto")}
                      onChange={(e) => handleScaleMode(e.target.value as any)}
                      className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200 font-mono"
                    >
                      <option value="auto">Auto Dimension</option>
                      <option value="width">Width (%)</option>
                      <option value="height">Height (%)</option>
                      <option value="both">Both (Distort)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: FOCAL POINT & PAN AREA (کونسا حصہ دکھانا ہے) ── */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Picture Focal Point & Crop (تصویر کا کونسا حصہ فِل میں دکھانا ہے)
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    X: {conf.image.focalPoint?.x ?? 50}% • Y: {conf.image.focalPoint?.y ?? 50}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* 3x3 Focal Alignment Matrix (5 cols) */}
                  <div className="sm:col-span-5 bg-slate-950/70 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
                    <span className="text-[9px] uppercase font-mono text-slate-400 mb-1.5">
                      9-Point Focus Matrix (9 پوائنٹ پیڈ)
                    </span>
                    <div className="grid grid-cols-3 gap-1 w-full max-w-[150px]">
                      {[
                        { label: "↖", name: "Top-Left", x: 0, y: 0 },
                        { label: "↑", name: "Top-Center", x: 50, y: 0 },
                        { label: "↗", name: "Top-Right", x: 100, y: 0 },
                        { label: "←", name: "Center-Left", x: 0, y: 50 },
                        { label: "•", name: "Center", x: 50, y: 50 },
                        { label: "→", name: "Center-Right", x: 100, y: 50 },
                        { label: "↙", name: "Bottom-Left", x: 0, y: 100 },
                        { label: "↓", name: "Bottom-Center", x: 50, y: 100 },
                        { label: "↘", name: "Bottom-Right", x: 100, y: 100 },
                      ].map((pt) => {
                        const isCur =
                          (conf.image.focalPoint?.x ?? 50) === pt.x &&
                          (conf.image.focalPoint?.y ?? 50) === pt.y;
                        return (
                          <button
                            key={pt.name}
                            type="button"
                            onClick={() => handleFocalPoint(pt.x, pt.y)}
                            title={pt.name}
                            className={`h-7 rounded text-xs font-black transition-all cursor-pointer flex items-center justify-center ${isCur
                              ? "bg-amber-500 text-slate-950 font-black shadow-md scale-105"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                              }`}
                          >
                            {pt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Precision Sliders (X & Y) (7 cols) */}
                  <div className="sm:col-span-7 space-y-2">
                    {/* Horizontal Pan */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>Horizontal Pan (بائیں ↔ دائیں X):</span>
                        <span className="font-mono text-amber-300">
                          {conf.image.focalPoint?.x ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={conf.image.focalPoint?.x ?? 50}
                        onChange={(e) =>
                          handleFocalPoint(Number(e.target.value), conf.image.focalPoint?.y ?? 50)
                        }
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    {/* Vertical Pan */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>Vertical Pan (اوپر ↕ نیچے Y):</span>
                        <span className="font-mono text-amber-300">
                          {conf.image.focalPoint?.y ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={conf.image.focalPoint?.y ?? 50}
                        onChange={(e) =>
                          handleFocalPoint(conf.image.focalPoint?.x ?? 50, Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    <div className="text-[10px] text-slate-400 italic pt-0.5">
                      💡 یا بائیں پریویو باکس پر کہیں بھی کلک کر کے فوری طور پر وہ حصہ منتخب کریں۔
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 3: PICTURE OPACITY & TINT OVERLAY ── */}
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-2.5">
                {/* Picture Opacity */}
                <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-slate-300">
                  <span>Picture Opacity (تصویر کی شفافیت):</span>
                  <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={conf.image.opacity ?? 100}
                      onChange={(e) => handleImageOpacity(Number(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-800 rounded accent-amber-500 cursor-pointer"
                    />
                    <span className="font-mono text-amber-300 text-xs w-9 text-right">
                      {conf.image.opacity ?? 100}%
                    </span>
                  </div>
                </div>

                {/* Tint Overlay */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Tint Overlay (ٹنٹ اوورلے):</span>
                    <input
                      type="color"
                      value={conf.image.tintColor || "#000000"}
                      onChange={(e) => handleImageTint(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Tint %:</span>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      value={conf.image.tintOpacity || 0}
                      onChange={(e) => handleImageTintOpacity(Number(e.target.value))}
                      className="w-24 h-1.5 bg-slate-800 rounded accent-amber-500 cursor-pointer"
                    />
                    <span className="font-mono text-amber-300 text-xs w-8 text-right">
                      {conf.image.tintOpacity || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional Card-Specific Extra Controls */}
      {extraControls && (
        <div className="pt-3 border-t border-slate-800/80">
          {extraControls}
        </div>
      )}
    </div>
  );
}
