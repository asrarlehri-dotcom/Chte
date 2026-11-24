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
  generatePatternSvg,
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
  title: string;
  subtitleUrdu?: string;
  cardId: string;
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
}

export default function CorelFillPickerCard({
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
        type: "linear",
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

  // Live CSS style compiled for current card
  const liveCardStyle = compileFillToStyle(conf, defaultColor);

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

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1220]/90 border border-slate-800/90 shadow-xl transition-all space-y-3 relative overflow-hidden">
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
          </h4>
          {subtitleUrdu && (
            <span className="text-[11px] text-slate-400 font-medium block leading-tight">
              {subtitleUrdu}
            </span>
          )}
        </div>

        {/* 4-Mode Switcher in Bracket Format [ Solid ] [ Gradient (Corel-style) ] [ Texture ] [ Image ] */}
        {!isTextColorOnly ? (
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono select-none">
            {/* Mode A: Solid */}
            <button
              type="button"
              onClick={() => setMode("solid")}
              className={`transition-all cursor-pointer ${
                conf.mode === "solid"
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
              className={`transition-all cursor-pointer ${
                conf.mode === "gradient"
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
              className={`transition-all cursor-pointer ${
                conf.mode === "texture"
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
              className={`transition-all cursor-pointer ${
                conf.mode === "image"
                  ? "text-amber-400 font-black drop-shadow-xs"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              [ Image ]
            </button>
          </div>
        ) : (
          <span className="text-xs font-mono text-amber-400 font-bold">[ Solid Color Only ]</span>
        )}
      </div>

      {/* ── CARD BODY (2-COLUMN HORIZONTAL STUDIO LAYOUT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* LEFT COLUMN: Large Wide Preview Rectangle (approx 35%-40% width) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div
            className="w-full h-24 sm:h-28 rounded-xl border border-slate-700/80 shadow-inner relative overflow-hidden transition-all duration-200 flex items-center justify-center"
            style={liveCardStyle}
            title="Live Fill Preview"
          >
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none" />
            {isTextColorOnly && (
              <span
                className="text-xs sm:text-sm font-black uppercase tracking-wider drop-shadow-md text-center px-2"
                style={{ color: conf.solid }}
              >
                GOVT. POST GRADUATE COLLEGE QUETTA
              </span>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Controls according to active mode */}
        <div className="lg:col-span-7 space-y-3">
          {/* ══════════════════════════════════════════════════════
              MODE B: MULTI-COLOR GRADIENT (Corel-Style Fountain)
             ══════════════════════════════════════════════════════ */}
          {conf.mode === "gradient" && (
            <div className="space-y-3">
              {/* Row 1: Label + Gradient Slider Track + Angle Dial */}
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-1.5">
                  {conf.gradient.stops.length > 2 ? "Active Gradient" : "Gradient"}
                </span>

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
                          className={`absolute -bottom-2.5 -translate-x-1/2 w-4 h-4 rounded-xs border-2 cursor-pointer transition-transform shadow-md ${
                            selectedStopIdx === i
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

                  {/* Circular 360° Angle Dial */}
                  <AngleDial
                    angle={conf.gradient.angle}
                    onChange={(ang) => handleGradientAngleChange(ang)}
                  />
                </div>
              </div>

              {/* Row 2: Presets */}
              <div className="space-y-1 pt-1 border-t border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Presets
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
              MODE C: TEXTURE & PATTERN FILL
             ══════════════════════════════════════════════════════ */}
          {conf.mode === "texture" && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Texture</span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Texture Preset Thumbnails */}
                <div className="sm:col-span-7 flex flex-wrap gap-2">
                  {[
                    { id: "carbon" as TextureType, name: "Carbon Fiber" },
                    { id: "mesh" as TextureType, name: "Dark Mesh" },
                    { id: "grid" as TextureType, name: "Fine Grid" },
                    { id: "stripes" as TextureType, name: "Diagonal Stripes" },
                    { id: "dots" as TextureType, name: "Subtle Dots" },
                    { id: "canvas" as TextureType, name: "Canvas" },
                  ].map((tex) => (
                    <button
                      key={tex.id}
                      type="button"
                      onClick={() => handleTextureTypeChange(tex.id)}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${
                        conf.texture.type === tex.id
                          ? "border-amber-400 bg-amber-500/10 shadow-xs ring-1 ring-amber-400"
                          : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                      }`}
                    >
                      <div
                        className="w-14 h-8 rounded border border-slate-700/60 mb-1"
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
                      <span className="text-[10px] font-bold text-slate-300 tracking-tight">
                        {tex.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Texture Controls (Scale & Opacity) */}
                <div className="sm:col-span-5 space-y-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
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
          {(conf.mode === "solid" || isTextColorOnly) && (
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
              MODE D: IMAGE FILL
             ══════════════════════════════════════════════════════ */}
          {conf.mode === "image" && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Image Fill</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Upload Button + URL */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isUploadingImg ? "Uploading..." : "Upload File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={conf.image.url}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="https://.../portal-bg.jpg"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                {/* Fit Mode & Tint Overlay */}
                <div className="space-y-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Fit Mode:</span>
                    <div className="flex items-center gap-1">
                      {(["cover", "contain", "repeat"] as const).map((fit) => (
                        <button
                          key={fit}
                          type="button"
                          onClick={() => handleImageFit(fit)}
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                            conf.image.fit === fit
                              ? "bg-amber-500 text-slate-950 font-black"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {fit}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Tint Overlay:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={conf.image.tintColor || "#000000"}
                        onChange={(e) => handleImageTint(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                      />
                      <input
                        type="range"
                        min={0}
                        max={90}
                        value={conf.image.tintOpacity || 0}
                        onChange={(e) => handleImageTintOpacity(Number(e.target.value))}
                        className="w-16 h-1 bg-slate-800 rounded accent-amber-500 cursor-pointer"
                      />
                      <span className="font-mono text-amber-300 text-[10px]">
                        {conf.image.tintOpacity || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
