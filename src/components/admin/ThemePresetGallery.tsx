"use client";

import React, { useState } from "react";
import {
  FillConfig,
  compileFillToStyle,
  normalizeFillConfig,
} from "@/lib/theme-fill-compiler";
import { Sparkles, Plus, Trash2, Check, Bookmark, Layers } from "lucide-react";

export type ThemePresetItem = {
  id: string;
  name: string;
  isSystem?: boolean;
  ribbonColor: FillConfig | string;
  primaryColor: FillConfig | string;
  bodyBgColor: FillConfig | string;
  sidebarColor: FillConfig | string;
  collegeNameColor: string;
  collegeHeaderBg: FillConfig | string;
  portalSubtitle?: string;
  portalSubtitleColor?: string;
};

// 4 Pre-loaded Institutional Presets
export const INSTITUTIONAL_PRESETS: ThemePresetItem[] = [
  {
    id: "gpgcq-classic",
    name: "GPGCQ Classic Navy & Red Patii",
    isSystem: true,
    ribbonColor: "#dc2626",
    primaryColor: "#040d1a",
    bodyBgColor: "#070d19",
    sidebarColor: "#090E24",
    collegeNameColor: "#0f172a",
    collegeHeaderBg: "#ffffff",
    portalSubtitle: "CAMPUS ERP PORTAL",
    portalSubtitleColor: "#4338ca",
  },
  {
    id: "crimson-gold",
    name: "Crimson & Brushed Gold",
    isSystem: true,
    ribbonColor: {
      mode: "gradient",
      solid: "#991b1b",
      gradient: {
        type: "linear",
        angle: 90,
        stops: [
          { color: "#7f1d1d", position: 0 },
          { color: "#b91c1c", position: 50 },
          { color: "#d97706", position: 100 },
        ],
      },
      texture: { type: "canvas", baseColor: "#991b1b", patternColor: "#fbbf24", scale: 24, opacity: 20 },
      image: { url: "", fit: "cover", position: "center", tintColor: "#000000", tintOpacity: 25 },
    },
    primaryColor: "#450a0a",
    bodyBgColor: "#1c0404",
    sidebarColor: "#2a0808",
    collegeNameColor: "#b45309",
    collegeHeaderBg: "#fffbeb",
    portalSubtitle: "ACADEMIC EXCELLENCE",
    portalSubtitleColor: "#b45309",
  },
  {
    id: "emerald-academic",
    name: "Emerald Academic",
    isSystem: true,
    ribbonColor: {
      mode: "gradient",
      solid: "#0c5938",
      gradient: {
        type: "linear",
        angle: 135,
        stops: [
          { color: "#064e3b", position: 0 },
          { color: "#059669", position: 50 },
          { color: "#10b981", position: 100 },
        ],
      },
      texture: { type: "mesh", baseColor: "#0c5938", patternColor: "#ffffff", scale: 20, opacity: 25 },
      image: { url: "", fit: "cover", position: "center", tintColor: "#000000", tintOpacity: 25 },
    },
    primaryColor: "#064e3b",
    bodyBgColor: "#022c22",
    sidebarColor: "#04382c",
    collegeNameColor: "#064e3b",
    collegeHeaderBg: "#f0fdf4",
    portalSubtitle: "GOVT POSTGRADUATE QUETTA",
    portalSubtitleColor: "#059669",
  },
  {
    id: "midnight-dark",
    name: "Midnight Dark Portal",
    isSystem: true,
    ribbonColor: {
      mode: "gradient",
      solid: "#2563eb",
      gradient: {
        type: "linear",
        angle: 90,
        stops: [
          { color: "#1d4ed8", position: 0 },
          { color: "#3b82f6", position: 50 },
          { color: "#60a5fa", position: 100 },
        ],
      },
      texture: { type: "grid", baseColor: "#1d4ed8", patternColor: "#ffffff", scale: 16, opacity: 30 },
      image: { url: "", fit: "cover", position: "center", tintColor: "#000000", tintOpacity: 25 },
    },
    primaryColor: "#020617",
    bodyBgColor: "#0f172a",
    sidebarColor: "#020617",
    collegeNameColor: "#f8fafc",
    collegeHeaderBg: "#1e293b",
    portalSubtitle: "SECURE CAMPUS ERP",
    portalSubtitleColor: "#38bdf8",
  },
];

interface ThemePresetGalleryProps {
  currentTheme: {
    ribbonColor: FillConfig | string;
    primaryColor: FillConfig | string;
    bodyBgColor: FillConfig | string;
    sidebarColor: FillConfig | string;
    collegeNameColor: string;
    collegeHeaderBg: FillConfig | string;
    portalSubtitle?: string;
    portalSubtitleColor?: string;
  };
  customPresets: ThemePresetItem[];
  onApplyTheme: (preset: ThemePresetItem) => void;
  onSaveCustomPreset: (name: string) => void;
  onDeleteCustomPreset: (id: string) => void;
}

export default function ThemePresetGallery({
  currentTheme,
  customPresets,
  onApplyTheme,
  onSaveCustomPreset,
  onDeleteCustomPreset,
}: ThemePresetGalleryProps) {
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newThemeName.trim();
    if (!cleanName) return;
    onSaveCustomPreset(cleanName);
    setNewThemeName("");
    setShowSaveInput(false);
  };

  const allPresets = [...INSTITUTIONAL_PRESETS, ...customPresets];

  return (
    <div className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Saved Portal Themes & Preset Gallery (1-کلک تھیم پریسیٹ گیلری)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Switch entire college portal aesthetic in 1-click, or save current color combination as your institutional theme.
          </p>
        </div>

        {/* Action Button: Save Current as Theme */}
        {!showSaveInput ? (
          <button
            type="button"
            onClick={() => setShowSaveInput(true)}
            disabled={customPresets.length >= 6}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all ${
              customPresets.length >= 6
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-102"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Save Current as Theme Preset</span>
            <span className="text-[10px] opacity-80">({customPresets.length}/6)</span>
          </button>
        ) : (
          <form onSubmit={handleSaveSubmit} className="flex items-center gap-2 bg-white p-1 rounded-xl border border-indigo-200 shadow-sm">
            <input
              type="text"
              autoFocus
              required
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              placeholder="e.g. Convocation 2026 Theme"
              className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-transparent outline-none w-48 sm:w-56"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSaveInput(false);
                setNewThemeName("");
              }}
              className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          </form>
        )}
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {allPresets.map((preset) => {
          const ribbonStyle = compileFillToStyle(preset.ribbonColor, "#dc2626");
          const headerStyle = compileFillToStyle(preset.primaryColor, "#040d1a");
          const sidebarStyle = compileFillToStyle(preset.sidebarColor, "#090E24");
          const bodyStyle = compileFillToStyle(preset.bodyBgColor, "#070d19");
          const cardHeaderBgStyle = compileFillToStyle(preset.collegeHeaderBg, "#ffffff");

          const isSelected = activePresetId === preset.id;

          return (
            <div
              key={preset.id}
              onClick={() => {
                setActivePresetId(preset.id);
                onApplyTheme(preset);
              }}
              className={`group relative p-2.5 rounded-2xl bg-white border cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between ${
                isSelected
                  ? "border-indigo-600 ring-2 ring-indigo-200 shadow-md"
                  : "border-slate-200 hover:border-indigo-300"
              }`}
            >
              {/* Mini Portal Mockup Thumbnail */}
              <div
                className="w-full h-20 rounded-xl overflow-hidden border border-slate-300/80 shadow-inner flex flex-col relative"
                style={bodyStyle}
              >
                {/* 1. Top Ribbon ("Red Patii") */}
                <div className="h-2 w-full transition-colors flex-shrink-0" style={ribbonStyle} />

                {/* 2. Top Header Bar */}
                <div
                  className="h-4.5 w-full px-2 flex items-center justify-between border-b border-white/10 flex-shrink-0"
                  style={headerStyle}
                >
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                    <div className="w-12 h-1 bg-white/40 rounded-full" />
                  </div>
                  <div className="w-6 h-1 bg-white/30 rounded-full" />
                </div>

                {/* 3. Lower Workspace: Left Sidebar + Main Content */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Left Sidebar */}
                  <div className="w-1/3 h-full border-r border-white/10 p-1 flex flex-col gap-0.5" style={sidebarStyle}>
                    {/* Header Box */}
                    <div className="h-3 w-full rounded flex items-center px-1" style={cardHeaderBgStyle}>
                      <span className="w-full text-[6px] font-black truncate block" style={{ color: preset.collegeNameColor || "#0f172a" }}>
                        GPGCQ
                      </span>
                    </div>
                    <div className="w-3/4 h-1 bg-white/20 rounded mt-0.5" />
                    <div className="w-1/2 h-1 bg-white/15 rounded" />
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 p-1 flex flex-col gap-1 justify-center items-center opacity-80">
                    <div className="w-3/4 h-1.5 bg-white/20 rounded" />
                    <div className="w-1/2 h-1 bg-white/15 rounded" />
                  </div>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="mt-2 flex items-center justify-between gap-1">
                <div className="truncate">
                  <span className="text-[11px] font-bold text-slate-800 truncate block group-hover:text-indigo-600 transition-colors">
                    {preset.name}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {preset.isSystem ? "Built-in Theme" : "Custom Preset"}
                  </span>
                </div>

                {/* Delete button for user custom presets */}
                {!preset.isSystem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomPreset(preset.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition-opacity"
                    title="Delete preset"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
