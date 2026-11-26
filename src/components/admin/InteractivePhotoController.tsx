"use client";

import React, { useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Maximize2,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  Grid3X3,
} from "lucide-react";
import {
  PhotoFitMode,
  ProfileBorderStyle,
  ProfileFrameSize,
  ProfilePhotoShape,
  PROFILE_BORDER_OPTIONS,
  PROFILE_SHAPE_OPTIONS,
  PROFILE_SIZE_OPTIONS,
  buildPhotoTransformStyle,
  clampFramingValue,
  getProfileBorderWrapperClass,
  getProfileDimensionsClass,
  getShapeRadiusClasses,
  normalizePhotoFraming,
} from "@/lib/photo-framing";

export interface PhotoFramingValue {
  zoom: number;
  posX: number;
  posY: number;
  fit: PhotoFitMode;
}

export interface ProfileStyleUpdates {
  photoShape?: ProfilePhotoShape;
  photoSize?: ProfileFrameSize;
  photoBorder?: ProfileBorderStyle;
  showBadge?: boolean;
  isVisible?: boolean;
}

interface InteractivePhotoControllerProps {
  mode: "hero" | "profile";
  mediaType?: "IMAGE" | "VIDEO";
  mediaUrl: string;
  fallbackUrl?: string;
  title?: string;
  value: {
    zoom?: number;
    posX?: number;
    posY?: number;
    fit?: PhotoFitMode;
  };
  onChange: (next: PhotoFramingValue) => void;
  /** Profile-only styling options (shape, size, border, visibility, badge) */
  profileOptions?: {
    shape?: ProfilePhotoShape;
    size?: ProfileFrameSize;
    border?: ProfileBorderStyle;
    showBadge?: boolean;
    isVisible?: boolean;
    onStyleChange: (updates: ProfileStyleUpdates) => void;
  };
  compact?: boolean;
}

function ShapeMiniGlyph({ shape }: { shape: ProfilePhotoShape }) {
  const shapeClass =
    shape === "circle"
      ? "w-4 h-4 rounded-full"
      : shape === "squircle"
        ? "w-4 h-4 rounded-[5px]"
        : shape === "square"
          ? "w-4 h-4 rounded-[1px]"
          : shape === "portrait"
            ? "w-3 h-4 rounded-[3px]"
            : shape === "landscape"
              ? "w-5 h-3.5 rounded-[3px]"
              : shape === "oval"
                ? "w-3 h-4 rounded-full"
                : "w-3.5 h-4 rounded-t-full rounded-b-[2px]";

  return <span className={`inline-block border-2 border-current flex-shrink-0 ${shapeClass}`} />;
}

const NINE_POINT_MATRIX = [
  { label: "↖", name: "Top Left", x: 0, y: 0 },
  { label: "↑", name: "Top Center", x: 50, y: 0 },
  { label: "↗", name: "Top Right", x: 100, y: 0 },
  { label: "←", name: "Middle Left", x: 0, y: 50 },
  { label: "•", name: "Exact Center", x: 50, y: 50 },
  { label: "→", name: "Middle Right", x: 100, y: 50 },
  { label: "↙", name: "Bottom Left", x: 0, y: 100 },
  { label: "↓", name: "Bottom Center", x: 50, y: 100 },
  { label: "↘", name: "Bottom Right", x: 100, y: 100 },
];

export default function InteractivePhotoController({
  mode,
  mediaType = "IMAGE",
  mediaUrl,
  fallbackUrl,
  title,
  value,
  onChange,
  profileOptions,
  compact = false,
}: InteractivePhotoControllerProps) {
  const framing = normalizePhotoFraming(value);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    initPosX: number;
    initPosY: number;
  }>({ active: false, startX: 0, startY: 0, initPosX: 50, initPosY: 50 });

  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const emit = (patch: Partial<PhotoFramingValue>) => {
    onChange({
      zoom: patch.zoom !== undefined ? clampFramingValue(patch.zoom, 25, 300, framing.zoom) : framing.zoom,
      posX: patch.posX !== undefined ? clampFramingValue(patch.posX, 0, 100, framing.posX) : framing.posX,
      posY: patch.posY !== undefined ? clampFramingValue(patch.posY, 0, 100, framing.posY) : framing.posY,
      fit: patch.fit ?? framing.fit,
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      initPosX: framing.posX,
      initPosY: framing.posY,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    // Sensitivity adapts nicely to zoom level and preview dimensions
    const sensitivity = Math.max(0.4, 1.2 / Math.max(0.5, framing.zoom / 100));
    const deltaXPercent = (-dx / Math.max(120, rect.width)) * 100 * sensitivity;
    const deltaYPercent = (-dy / Math.max(120, rect.height)) * 100 * sensitivity;

    emit({
      posX: Math.round(dragRef.current.initPosX + deltaXPercent),
      posY: Math.round(dragRef.current.initPosY + deltaYPercent),
    });
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if already released
    }
  };

  const activeShape: ProfilePhotoShape = profileOptions?.shape || "squircle";
  const activeBorder: ProfileBorderStyle = profileOptions?.border || "gold";
  const activeSize: ProfileFrameSize = profileOptions?.size || "md";
  const shapeRadius = getShapeRadiusClasses(activeShape, "preview");
  const effectiveSrc = mediaUrl || fallbackUrl || "";

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              {title ||
                (mode === "hero"
                  ? "Picture Zoom, Position & Interactive Framing Studio (تصویر کا زوم اور پوزیشن)"
                  : "Portrait Framing, Shape & Zoom Studio (پروفائل تصویر کا سائز، پوزیشن اور شیپ)")}
            </span>
            <span className="text-[10px] text-slate-500">
              Drag preview image directly with mouse/touch to position, or fine-tune with sliders & focus pad.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowGrid((prev) => !prev)}
            className={`px-2 py-1 rounded-lg border text-[10px] font-bold inline-flex items-center gap-1 transition-colors ${
              showGrid
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
            title="Toggle Alignment Grid"
          >
            <Grid3X3 className="w-3 h-3" />
            <span>Grid</span>
          </button>

          <button
            type="button"
            onClick={() => emit({ zoom: 100, posX: 50, posY: 50, fit: "cover" })}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition-colors"
            title="Reset Zoom & Center Position"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset (100%)</span>
          </button>
        </div>
      </div>

      {/* Interactive Preview Stage + Profile Style Quick Select */}
      <div className={mode === "profile" ? "grid grid-cols-1 lg:grid-cols-12 gap-4 items-start" : "space-y-4"}>
        {/* LIVE DRAGGABLE STAGE */}
        <div className={mode === "profile" ? "lg:col-span-4 space-y-2 flex flex-col items-center" : "space-y-1.5"}>
          <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500">
            <span className="uppercase tracking-wide">
              {mode === "profile" ? "Drag Inside Shape Preview:" : "Interactive Framing Preview (Drag Image):"}
            </span>
            <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              {framing.zoom}% • X:{framing.posX}% • Y:{framing.posY}%
            </span>
          </div>

          {mode === "hero" ? (
            <div
              ref={stageRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              onDoubleClick={() => emit({ zoom: 100, posX: 50, posY: 50 })}
              className={`relative w-full ${
                compact ? "h-44" : "h-56 sm:h-64"
              } rounded-2xl overflow-hidden border-2 ${
                isDragging ? "border-indigo-500 ring-2 ring-indigo-300" : "border-slate-300"
              } bg-slate-950 select-none touch-none ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              } shadow-inner flex items-center justify-center`}
              title="Click & drag to move photo position. Double-click to reset center."
            >
              {mediaType === "VIDEO" && effectiveSrc ? (
                <video
                  src={effectiveSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full pointer-events-none transition-transform duration-75"
                  style={buildPhotoTransformStyle(framing)}
                />
              ) : effectiveSrc ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={effectiveSrc}
                  alt="Hero Background Preview"
                  draggable={false}
                  className="w-full h-full pointer-events-none select-none transition-transform duration-75"
                  style={buildPhotoTransformStyle(framing)}
                  onError={(e) => {
                    if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
                      e.currentTarget.src = fallbackUrl;
                    }
                  }}
                />
              ) : (
                <span className="text-xs text-slate-400 font-semibold">No media selected yet</span>
              )}

              {/* Crosshair & Rule-of-Thirds Overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-x-0 top-1/3 h-px bg-white/15" />
                  <div className="absolute inset-x-0 top-2/3 h-px bg-white/15" />
                  <div className="absolute inset-y-0 left-1/3 w-px bg-white/15" />
                  <div className="absolute inset-y-0 left-2/3 w-px bg-white/15" />
                  <div
                    className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400 bg-amber-400/30 shadow"
                    style={{ left: `${framing.posX}%`, top: `${framing.posY}%` }}
                  />
                </div>
              )}

              {/* Floating Quick Zoom Overlay Toolbar */}
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md text-white px-2 py-1 rounded-xl border border-white/15 shadow-lg text-[10px] font-bold"
              >
                <button
                  type="button"
                  onClick={() => emit({ zoom: Math.max(25, framing.zoom - 15) })}
                  className="p-1 rounded hover:bg-white/15 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono px-1 text-amber-300">{framing.zoom}%</span>
                <button
                  type="button"
                  onClick={() => emit({ zoom: Math.min(300, framing.zoom + 15) })}
                  className="p-1 rounded hover:bg-white/15 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="absolute top-2.5 left-2.5 pointer-events-none bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-white/10">
                ✋ Drag to Move Position
              </div>
            </div>
          ) : (
            <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2.5">
              <div
                ref={stageRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onDoubleClick={() => emit({ zoom: 100, posX: 50, posY: 50 })}
                className={`relative select-none touch-none ${
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                } ${getProfileDimensionsClass(activeShape, activeSize, "preview")} ${shapeRadius.outer} ${getProfileBorderWrapperClass(activeBorder, "preview")}`}
                title="Drag portrait inside shape to position face cleanly"
              >
                <div className={`w-full h-full overflow-hidden bg-slate-800 relative ${shapeRadius.inner}`}>
                  {effectiveSrc ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={effectiveSrc}
                      alt="Profile Preview"
                      draggable={false}
                      className="w-full h-full pointer-events-none select-none transition-transform duration-75"
                      style={buildPhotoTransformStyle(framing)}
                      onError={(e) => {
                        if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
                          e.currentTarget.src = fallbackUrl;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                      No Photo
                    </div>
                  )}

                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-px bg-white/15 absolute top-1/2" />
                      <div className="h-full w-px bg-white/15 absolute left-1/2" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-semibold">
                <span>✋ Drag Photo •</span>
                <button
                  type="button"
                  onClick={() => emit({ zoom: Math.max(25, framing.zoom - 10) })}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white"
                >
                  -
                </button>
                <span className="font-mono text-amber-300">{framing.zoom}%</span>
                <button
                  type="button"
                  onClick={() => emit({ zoom: Math.min(300, framing.zoom + 10) })}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PROFILE SHAPE & FRAME OPTIONS (SHOWN ONLY FOR PROFILE MODE) */}
        {mode === "profile" && profileOptions && (
          <div className="lg:col-span-8 space-y-3 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80">
            {/* Shape Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Profile Frame Shape (فوٹو کا شیپ منتخب کریں):</span>
                </span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">
                  {PROFILE_SHAPE_OPTIONS.find((s) => s.id === activeShape)?.label || "Rounded"}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                {PROFILE_SHAPE_OPTIONS.map((opt) => {
                  const active = activeShape === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => profileOptions.onStyleChange({ photoShape: opt.id })}
                      className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl border text-center transition-all ${
                        active
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm scale-[1.02]"
                          : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40"
                      }`}
                      title={opt.hint}
                    >
                      <ShapeMiniGlyph shape={opt.id} />
                      <span className="text-[10px] font-bold leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frame Size, Border Ring & Display Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
              {/* Frame Size */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">
                  Frame Size (سائز):
                </span>
                <div className="flex items-center gap-1.5">
                  {PROFILE_SIZE_OPTIONS.map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => profileOptions.onStyleChange({ photoSize: sz.id })}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                        activeSize === sz.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Accent Ring */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">
                  Border / Frame Accent (بارڈر اسٹائل):
                </span>
                <select
                  value={activeBorder}
                  onChange={(e) =>
                    profileOptions.onStyleChange({
                      photoBorder: e.target.value as ProfileBorderStyle,
                    })
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {PROFILE_BORDER_OPTIONS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toggles: Show Category Badge + Show/Hide Profile */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={profileOptions.showBadge !== false}
                  onChange={(e) => profileOptions.onStyleChange({ showBadge: e.target.checked })}
                  className="w-3.5 h-3.5 rounded accent-indigo-600"
                />
                <span>Show Role / Category Badge</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  profileOptions.onStyleChange({
                    isVisible: profileOptions.isVisible === false,
                  })
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors ${
                  profileOptions.isVisible !== false
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-200 border-slate-300 text-slate-600"
                }`}
              >
                {profileOptions.isVisible !== false ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visible on Portal</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hidden from Portal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Precision Controls: Zoom + Horizontal X + Vertical Y + 9-Point Focus Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* 1. Zoom In / Out + Fit Mode (4 cols) */}
        <div className="md:col-span-4 space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
              <span>Zoom In / Out</span>
            </span>
            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
              {framing.zoom}%
            </span>
          </div>

          <input
            type="range"
            min="25"
            max="300"
            step="5"
            value={framing.zoom}
            onChange={(e) => emit({ zoom: Number(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer"
          />

          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => emit({ zoom: Math.max(25, framing.zoom - 10) })}
              className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-0.5"
            >
              <ZoomOut className="w-3 h-3" />
              <span>-10%</span>
            </button>
            <button
              type="button"
              onClick={() => emit({ zoom: 100 })}
              className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
            >
              100%
            </button>
            <button
              type="button"
              onClick={() => emit({ zoom: Math.min(300, framing.zoom + 10) })}
              className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-0.5"
            >
              <ZoomIn className="w-3 h-3" />
              <span>+10%</span>
            </button>
          </div>

          {/* Image Fit Mode */}
          <div className="pt-2 border-t border-slate-200/70 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <Maximize2 className="w-3 h-3" />
              <span>Fit Mode:</span>
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: "cover", label: "Fill Frame" },
                  { id: "contain", label: "Full Photo" },
                  { id: "fill", label: "Stretch" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => emit({ fit: m.id })}
                  className={`py-1 rounded text-[10px] font-bold border transition-all ${
                    framing.fit === m.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Horizontal X & Vertical Y Sliders (5 cols) */}
        <div className="md:col-span-5 space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          {/* Horizontal */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-amber-600" />
                <span>Horizontal Position (X)</span>
              </span>
              <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                {framing.posX}% {framing.posX < 45 ? "Left" : framing.posX > 55 ? "Right" : "Center"}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={framing.posX}
              onChange={(e) => emit({ posX: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="grid grid-cols-3 gap-1">
              {[
                { label: "Left 0%", val: 0 },
                { label: "Center 50%", val: 50 },
                { label: "Right 100%", val: 100 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => emit({ posX: btn.val })}
                  className="py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vertical */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-emerald-600 rotate-90" />
                <span>Vertical Position (Y)</span>
              </span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                {framing.posY}% {framing.posY < 45 ? "Top" : framing.posY > 55 ? "Bottom" : "Middle"}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={framing.posY}
              onChange={(e) => emit({ posY: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="grid grid-cols-3 gap-1">
              {[
                { label: "Top 0%", val: 0 },
                { label: "Middle 50%", val: 50 },
                { label: "Bottom 100%", val: 100 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => emit({ posY: btn.val })}
                  className="py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. 9-Point Anchor Pad + Presets (3 cols) */}
        <div className="md:col-span-3 space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase block text-center">
              9-Point Focus Anchor
            </span>
            <div className="grid grid-cols-3 gap-1 max-w-[140px] mx-auto">
              {NINE_POINT_MATRIX.map((pt) => {
                const isActive = framing.posX === pt.x && framing.posY === pt.y;
                return (
                  <button
                    key={pt.name}
                    type="button"
                    onClick={() => emit({ posX: pt.x, posY: pt.y })}
                    title={pt.name}
                    className={`h-7 rounded-lg text-xs font-black transition-all flex items-center justify-center ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm scale-105"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50"
                    }`}
                  >
                    {pt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              Quick Presets:
            </span>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => emit({ zoom: 100, posX: 50, posY: 50, fit: "cover" })}
                className="px-1.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700"
              >
                🎯 Center
              </button>
              <button
                type="button"
                onClick={() => emit({ zoom: 100, posX: 50, posY: 50, fit: "contain" })}
                className="px-1.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700"
              >
                🖼️ Whole Pic
              </button>
              <button
                type="button"
                onClick={() =>
                  emit(
                    mode === "profile"
                      ? { zoom: 120, posX: 50, posY: 20, fit: "cover" }
                      : { zoom: 115, posX: 50, posY: 15, fit: "cover" }
                  )
                }
                className="px-1.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700"
              >
                🔼 Top Focus
              </button>
              <button
                type="button"
                onClick={() => emit({ zoom: 145, posX: 50, posY: 40, fit: "cover" })}
                className="px-1.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700"
              >
                🔍 Close-up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
