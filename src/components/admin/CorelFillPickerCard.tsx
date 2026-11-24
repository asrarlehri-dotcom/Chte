"use client";

import React, { useState, useRef } from "react";
import {
  FillConfig,
  FillMode,
  GradientStop,
  TextureType,
  ImageFitMode,
  ImagePosition,
  normalizeFillConfig,
  compileFillToStyle,
  GRADIENT_PRESETS,
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

interface CorelFillPickerCardProps {
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

    // Choose color from nearest or fallback
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

  const applyGradientPreset = (preset: typeof GRADIENT_PRESETS[0]) => {
    onChange({
      ...conf,
      gradient: {
        ...conf.gradient,
        angle: preset.angle,
        stops: preset.stops.map((s) => ({ ...s })),
      },
    });
    setSelectedStopIdx(0);
  };

  // ── Texture Handlers ──
  const handleTextureTypeChange = (type: TextureType) => {
    onChange({
      ...conf,
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

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3.5 flex flex-col justify-between">
      <div>
        {/* Top Header: Title + Mini Live Swatch */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>{title}</span>
            </label>
            {subtitleUrdu && (
              <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                {subtitleUrdu}
              </span>
            )}
          </div>

          {/* Live mini preview swatch tile */}
          <div
            className="w-8 h-8 rounded-lg border border-slate-300 shadow-sm flex-shrink-0 relative overflow-hidden transition-all duration-200"
            style={liveCardStyle}
            title="Live Fill Preview"
          >
            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-lg pointer-events-none" />
          </div>
        </div>

        {/* ── CorelDRAW Compact 4-Mode Switcher ── */}
        <div className="grid grid-cols-4 bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold text-slate-600 mb-3 border border-slate-200/70">
          <button
            type="button"
            onClick={() => setMode("solid")}
            className={`py-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              conf.mode === "solid"
                ? "bg-white text-indigo-700 shadow-xs font-black"
                : "hover:text-slate-900 text-slate-600"
            }`}
          >
            <span>Solid</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("gradient")}
            className={`py-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              conf.mode === "gradient"
                ? "bg-white text-indigo-700 shadow-xs font-black"
                : "hover:text-slate-900 text-slate-600"
            }`}
          >
            <span>Gradient</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("texture")}
            className={`py-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              conf.mode === "texture"
                ? "bg-white text-indigo-700 shadow-xs font-black"
                : "hover:text-slate-900 text-slate-600"
            }`}
          >
            <span>Texture</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("image")}
            className={`py-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              conf.mode === "image"
                ? "bg-white text-indigo-700 shadow-xs font-black"
                : "hover:text-slate-900 text-slate-600"
            }`}
          >
            <span>Picture</span>
          </button>
        </div>

        {/* ── MODE A: SOLID FILL ── */}
        {conf.mode === "solid" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={conf.solid || defaultColor}
                onChange={(e) => handleSolidColorChange(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 bg-transparent p-0.5 flex-shrink-0 shadow-xs"
              />
              <input
                type="text"
                value={conf.solid || ""}
                onChange={(e) => handleSolidColorChange(e.target.value)}
                placeholder="#1e3a8a"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 uppercase focus:bg-white focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Quick Presets */}
            {quickPresets.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presets:</span>
                  {onAddCustomColor && (
                    <button
                      type="button"
                      onClick={() => onAddCustomColor(conf.solid)}
                      className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                      title="Save current color into custom presets"
                    >
                      <Plus className="w-2.5 h-2.5" /> Save
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickPresets.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => handleSolidColorChange(c.hex)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: c.hex,
                        color: c.hex.toLowerCase() === "#ffffff" || c.hex.toLowerCase() === "#f8fafc" ? "#0f172a" : "#ffffff",
                        border: c.hex.toLowerCase() === "#ffffff" ? "1px solid #cbd5e1" : "none",
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

        {/* ── MODE B: MULTI-COLOR GRADIENT (CorelDRAW Fountain Fill) ── */}
        {conf.mode === "gradient" && (
          <div className="space-y-3.5">
            {/* Interactive Multi-Stop Bar */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>Multi-Stop Gradient Bar</span>
                <span className="text-[9px] text-indigo-600 font-mono">Click bar to add stop</span>
              </div>

              <div
                ref={gradientBarRef}
                onClick={handleBarClick}
                className="h-7 w-full rounded-xl cursor-crosshair relative shadow-inner border border-slate-300 overflow-visible select-none"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${[...conf.gradient.stops]
                    .sort((a, b) => a.position - b.position)
                    .map((s) => `${s.color} ${s.position}%`)
                    .join(", ")})`,
                }}
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
                    className={`absolute -bottom-2 -translate-x-1/2 w-4 h-4 rounded-full border-2 cursor-pointer transition-transform shadow-md ${
                      selectedStopIdx === i
                        ? "border-indigo-600 scale-125 z-10 ring-2 ring-indigo-300"
                        : "border-white hover:scale-110 z-0"
                    }`}
                    title={`Stop ${i + 1}: ${stop.color} (${stop.position}%)`}
                  >
                    <span
                      className="block w-full h-full rounded-full"
                      style={{ backgroundColor: stop.color }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Stop Controls */}
            {conf.gradient.stops[selectedStopIdx] && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                  <span>Selected Stop #{selectedStopIdx + 1}</span>
                  {conf.gradient.stops.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeStop(selectedStopIdx)}
                      className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-0.5"
                    >
                      <Trash2 className="w-2.5 h-2.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={conf.gradient.stops[selectedStopIdx]?.color || "#ffffff"}
                    onChange={(e) => updateStopColor(selectedStopIdx, e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={conf.gradient.stops[selectedStopIdx]?.color || ""}
                    onChange={(e) => updateStopColor(selectedStopIdx, e.target.value)}
                    className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono font-bold uppercase"
                  />
                  <div className="flex-1 flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold">Pos:</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={conf.gradient.stops[selectedStopIdx]?.position || 0}
                      onChange={(e) => updateStopPos(selectedStopIdx, Number(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-700 w-7 text-right">
                      {conf.gradient.stops[selectedStopIdx]?.position}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Gradient Type + Angle Controls */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  {(["linear", "radial", "conic"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleGradientTypeChange(t)}
                      className={`px-2 py-1 rounded-md capitalize transition-all ${
                        conf.gradient.type === t
                          ? "bg-indigo-600 text-white font-black shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {conf.gradient.type !== "radial" && (
                  <div className="flex items-center gap-1 text-[11px] font-bold font-mono">
                    <Compass className="w-3 h-3 text-indigo-600" />
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={conf.gradient.angle}
                      onChange={(e) => handleGradientAngleChange(Number(e.target.value))}
                      className="w-12 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-center text-xs font-mono font-bold"
                    />
                    <span>°</span>
                  </div>
                )}
              </div>

              {/* Angle Dial & Quick Direction Buttons */}
              {conf.gradient.type !== "radial" && (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={conf.gradient.angle}
                    onChange={(e) => handleGradientAngleChange(Number(e.target.value))}
                    className="flex-1 h-1 bg-slate-200 rounded-lg accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex items-center gap-1">
                    {[
                      { label: "90°", angle: 90 },
                      { label: "180°", angle: 180 },
                      { label: "135°", angle: 135 },
                      { label: "45°", angle: 45 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleGradientAngleChange(btn.angle)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                          conf.gradient.angle === btn.angle
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Built-in Gradient Presets */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Corel Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {GRADIENT_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyGradientPreset(p)}
                    className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white shadow-xs hover:scale-105 transition-transform"
                    style={{
                      backgroundImage: `linear-gradient(${p.angle}deg, ${p.stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`,
                    }}
                    title={p.name}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MODE C: TEXTURE & PATTERN FILL ── */}
        {conf.mode === "texture" && (
          <div className="space-y-3">
            {/* Pattern Type Selector */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Pattern Style:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "canvas", name: "Canvas" },
                  { id: "grid", name: "Grid" },
                  { id: "stripes", name: "Stripes" },
                  { id: "mesh", name: "Mesh" },
                  { id: "dots", name: "Dots" },
                  { id: "paper", name: "Paper Grain" },
                ].map((item) => {
                  const svgPreview = generatePatternSvg(item.id as TextureType, "#ffffff", 60);
                  const isSelected = conf.texture.type === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTextureTypeChange(item.id as TextureType)}
                      className={`p-1.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50"
                      }`}
                    >
                      <div
                        className="w-full h-6 rounded-lg border border-slate-300/80 shadow-xs"
                        style={{
                          backgroundColor: "#1e293b",
                          backgroundImage: `url("${svgPreview}")`,
                          backgroundSize: "16px 16px",
                          backgroundRepeat: "repeat",
                        }}
                      />
                      <span className={`text-[10px] font-bold ${isSelected ? "text-indigo-950 font-black" : "text-slate-600"}`}>
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors: Base + Pattern Tint */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Base Color</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={conf.texture.baseColor || defaultColor}
                    onChange={(e) => handleTextureBaseColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={conf.texture.baseColor || ""}
                    onChange={(e) => handleTextureBaseColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Pattern Tint</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={conf.texture.patternColor || "#ffffff"}
                    onChange={(e) => handleTexturePatternColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={conf.texture.patternColor || ""}
                    onChange={(e) => handleTexturePatternColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-mono font-bold uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Sliders: Scale & Opacity */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                  <span>Texture Scale:</span>
                  <span className="font-mono text-indigo-600">{conf.texture.scale}px</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={conf.texture.scale}
                  onChange={(e) => handleTextureScale(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                  <span>Pattern Opacity:</span>
                  <span className="font-mono text-indigo-600">{conf.texture.opacity}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={conf.texture.opacity}
                  onChange={(e) => handleTextureOpacity(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── MODE D: PICTURE / IMAGE FILL ── */}
        {conf.mode === "image" && (
          <div className="space-y-3">
            {/* Upload or URL */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-700 text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingImg ? "Uploading..." : "Upload Image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {conf.image.url && (
                  <button
                    type="button"
                    onClick={() => handleImageUrlChange("")}
                    className="px-2 py-1.5 text-xs text-red-600 hover:text-red-700 font-bold border border-red-200 rounded-xl bg-red-50"
                  >
                    Clear
                  </button>
                )}
              </div>

              <input
                type="text"
                value={conf.image.url || ""}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="Or paste image URL (https://...)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-800 focus:bg-white"
              />
            </div>

            {/* Fit Mode Switcher */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Fit Mode:
              </span>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                {(["cover", "contain", "repeat", "stretch"] as const).map((fit) => (
                  <button
                    key={fit}
                    type="button"
                    onClick={() => handleImageFit(fit)}
                    className={`py-1 rounded-lg capitalize transition-all ${
                      conf.image.fit === fit
                        ? "bg-indigo-600 text-white font-black shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Anchor */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Anchor Position:
              </span>
              <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
                {(["center", "top", "bottom", "left", "right"] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => handleImagePosition(pos)}
                    className={`py-1 rounded-lg capitalize transition-all ${
                      conf.image.position === pos
                        ? "bg-slate-800 text-white font-black shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Tint Overlay & Opacity Slider */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                <span>Tint Overlay & Opacity:</span>
                <span className="font-mono text-indigo-600">{conf.image.tintOpacity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={conf.image.tintColor || "#000000"}
                  onChange={(e) => handleImageTint(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0.5"
                />
                <input
                  type="range"
                  min={0}
                  max={95}
                  value={conf.image.tintOpacity}
                  onChange={(e) => handleImageTintOpacity(Number(e.target.value))}
                  className="flex-1 h-1 bg-slate-200 rounded-lg accent-indigo-600 cursor-pointer"
                />
              </div>
              <span className="text-[9px] text-slate-400 block">
                Darkens or tints the image so text stays legible.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Saved Presets Palette chips for quick apply */}
      {customColors.length > 0 && conf.mode === "solid" && (
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[9px] font-bold text-indigo-700 uppercase block mb-1">
            My Saved Presets:
          </span>
          <div className="flex flex-wrap gap-1">
            {customColors.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => handleSolidColorChange(hex)}
                className="w-5 h-5 rounded-md border border-slate-300 shadow-xs hover:scale-115 transition-transform"
                style={{ backgroundColor: hex }}
                title={`Apply ${hex}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
