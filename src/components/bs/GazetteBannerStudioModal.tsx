"use client";

import React, { useState } from "react";
import CorelFillPickerCard from "@/components/admin/CorelFillPickerCard";
import {
  FillConfig,
  normalizeFillConfig,
} from "@/lib/theme-fill-compiler";
import {
  GazetteBannerConfigEntry,
  GazetteBannerConfigMap,
  GazetteBannerTextMode,
  SUBJECT_BANNER_PRESETS,
  buildGazetteScrimStyle,
  getSubjectBannerPreset,
  resolveGazetteBannerConfig,
} from "@/lib/gazette-banner-themes";
import { Palette, RotateCcw, Save, Sparkles, X } from "lucide-react";

type ProgramOption = {
  id: string;
  name: string;
};

interface GazetteBannerStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  programs: ProgramOption[];
  initialScope?: string;
  bannerConfig: GazetteBannerConfigMap;
  collegeName: string;
  collegeLogo?: string;
  onSave: (nextMap: GazetteBannerConfigMap) => Promise<{ ok: boolean; error?: string }>;
}

const QUICK_PALETTE = [
  { name: "Math Gold-Amber", hex: "#451a03" },
  { name: "CS Deep Navy", hex: "#091e3a" },
  { name: "Emerald Green", hex: "#064e3b" },
  { name: "Royal Crimson", hex: "#7f1d1d" },
  { name: "Physics Indigo", hex: "#1e1b4b" },
  { name: "Ocean Teal", hex: "#134e4a" },
  { name: "Midnight Slate", hex: "#0f172a" },
  { name: "Pure White", hex: "#ffffff" },
];

export default function GazetteBannerStudioModal({
  isOpen,
  onClose,
  programs,
  initialScope = "__GLOBAL__",
  bannerConfig,
  collegeName,
  collegeLogo,
  onSave,
}: GazetteBannerStudioModalProps) {
  const [selectedScope, setSelectedScope] = useState<string>(initialScope || "__GLOBAL__");
  const [draftMap, setDraftMap] = useState<GazetteBannerConfigMap>(bannerConfig || {});
  const [customColors, setCustomColors] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const storedSwatches = localStorage.getItem("gazette_custom_swatches");
      if (storedSwatches) {
        const parsed = JSON.parse(storedSwatches);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore invalid local swatches
    }
    return [];
  });
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const isGlobal = selectedScope === "__GLOBAL__";
  const activeProgram = isGlobal ? null : programs.find((p) => p.id === selectedScope) || null;
  const previewTitle = activeProgram?.name || "BS Mathematics (Sample Preview)";

  const resolved = resolveGazetteBannerConfig(
    draftMap,
    isGlobal ? "" : selectedScope,
    previewTitle
  );

  const defaultPreset = getSubjectBannerPreset(previewTitle);
  const activeFill = normalizeFillConfig(resolved.entry.fill, defaultPreset.bgStart);

  const updateScopeEntry = (updates: Partial<GazetteBannerConfigEntry>) => {
    setStatusMsg(null);
    setDraftMap((prev) => {
      const existing = prev[selectedScope] || {
        fill: activeFill,
        textMode: resolved.entry.textMode || "auto",
        scrimOpacity: resolved.scrimOpacity,
      };
      return {
        ...prev,
        [selectedScope]: {
          ...existing,
          ...updates,
        },
      };
    });
  };

  const handleApplySubjectPreset = (presetId: string) => {
    const preset = SUBJECT_BANNER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    updateScopeEntry({
      fill: preset.fill,
      textMode: "light",
      scrimOpacity: 0,
    });
  };

  const handleResetScope = () => {
    setStatusMsg(null);
    setDraftMap((prev) => {
      const next = { ...prev };
      delete next[selectedScope];
      return next;
    });
  };

  const handleResetAll = () => {
    setStatusMsg(null);
    setDraftMap({});
  };

  const handleAddCustomColor = (hex: string) => {
    const clean = hex.trim();
    if (!clean || customColors.includes(clean)) return;
    const next = [clean, ...customColors].slice(0, 18);
    setCustomColors(next);
    try {
      localStorage.setItem("gazette_custom_swatches", JSON.stringify(next));
    } catch {
      // Ignore storage quota issues
    }
  };

  const handleSaveClick = async () => {
    setSaving(true);
    setStatusMsg(null);
    const result = await onSave(draftMap);
    setSaving(false);
    if (result.ok) {
      setStatusMsg({
        type: "success",
        text: "✨ Banner theme & pictures saved! All BS Gazette headers updated.",
      });
    } else {
      setStatusMsg({
        type: "error",
        text: result.error || "Could not save banner theme. If using a very large photo, try a smaller image (< 2 MB).",
      });
    }
  };

  const hasScopeOverride = Boolean(draftMap[selectedScope]);
  const customizedCount = Object.keys(draftMap).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto print:hidden">
      <div className="bg-[#0b0f19] text-slate-100 rounded-3xl border border-slate-800 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0f172a] via-[#111827] to-[#081512] border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center shadow-md shrink-0">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-wide text-white">
                BS Gazette Header Banner Studio (بینر رنگ، گریڈینٹ اور سبجیکٹ تصویر سیٹنگ)
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose built-in subject artwork (Math, CS, Chemistry, etc.), pick any solid/gradient color, or upload your own picture per program or for all sections.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Close Studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold border ${statusMsg.type === "success"
                ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200"
                : "bg-rose-950/70 border-rose-500/50 text-rose-200"
                }`}
            >
              {statusMsg.text}
            </div>
          )}

          {/* Target Scope Selector */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Target Program / Scope (کس پروگرام کا بینر تبدیل کرنا ہے؟)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  By default, each program gets matching subject artwork automatically (e.g. Math formulas for BS Math). Customize individually or set one Global theme.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                >
                  <option value="__GLOBAL__">
                    {draftMap.__GLOBAL__ ? "★ " : ""}🌐 Global Default (All BS Sections)
                  </option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {draftMap[prog.id] ? "★ [Custom] " : ""}
                      {prog.name}
                    </option>
                  ))}
                </select>
                {hasScopeOverride && (
                  <button
                    type="button"
                    onClick={handleResetScope}
                    className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Revert to Subject Default
                  </button>
                )}
              </div>
            </div>

            {/* Quick Program Pills */}
            {programs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setSelectedScope("__GLOBAL__")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${isGlobal
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500"
                    }`}
                >
                  🌐 All Sections
                </button>
                {programs.map((prog) => {
                  const isActive = selectedScope === prog.id;
                  const isCustom = Boolean(draftMap[prog.id]);
                  return (
                    <button
                      key={prog.id}
                      type="button"
                      onClick={() => setSelectedScope(prog.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${isActive
                        ? "bg-emerald-600 text-white border-emerald-400"
                        : isCustom
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/70 hover:border-emerald-500"
                          : "bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500"
                        }`}
                    >
                      {isCustom ? "★ " : ""}
                      {prog.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Section Banner Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Banner Preview ({isGlobal ? "Global Fallback" : previewTitle}):
              </span>
              <span className="font-mono text-amber-300">
                Source:{" "}
                {resolved.source === "PROGRAM"
                  ? "Custom Program Override"
                  : resolved.source === "GLOBAL"
                    ? "Global Override"
                    : "Auto Subject Artwork"}
              </span>
            </div>

            <div
              className={`relative overflow-hidden rounded-2xl p-5 shadow-md border flex flex-wrap items-center justify-between gap-4 ${resolved.useDarkText
                ? "text-slate-900 border-slate-300"
                : "text-white border-white/15"
                }`}
            >
              <div className="absolute inset-0 pointer-events-none" style={resolved.bgStyle} />
              {resolved.scrimOpacity > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={buildGazetteScrimStyle(resolved.scrimOpacity)}
                />
              )}

              <div className="relative z-10 flex items-center gap-3">
                {collegeLogo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={collegeLogo} alt="Logo" className="w-12 h-12 object-contain shrink-0" />
                ) : (
                  <div className="w-3.5 h-8 rounded-full bg-amber-500" />
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-lg font-black tracking-wide uppercase">{previewTitle}</h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${resolved.useDarkText
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-amber-500/25 text-amber-200 border-amber-400/50"
                        }`}
                    >
                      Session: 2022-2026
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${resolved.useDarkText
                        ? "bg-slate-200 text-slate-900 border-slate-300"
                        : "bg-white/10 text-white border-white/20"
                        }`}
                    >
                      Semester 1
                    </span>
                  </div>
                  <p
                    className={`text-xs font-semibold mt-0.5 ${resolved.useDarkText ? "text-slate-700" : "text-slate-200/90"
                      }`}
                  >
                    {collegeName} &nbsp;|&nbsp; 8 Student(s) &nbsp;|&nbsp; 6 Exam Paper(s)
                  </p>
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-black border ${resolved.useDarkText
                    ? "bg-white text-slate-800 border-slate-300"
                    : "bg-white/10 text-white border-white/25"
                    }`}
                >
                  📄 Section DMCs
                </span>
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-black border ${resolved.useDarkText
                    ? "bg-white text-slate-800 border-slate-300"
                    : "bg-white/10 text-white border-white/25"
                    }`}
                >
                  Total Marks: 600
                </span>
              </div>
            </div>
          </div>

          {/* 1-Click Built-In Subject Artwork Presets */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Subject Artwork Presets (مضمون کے حساب سے بنی بنائی تصاویر)</span>
              </span>
              <span className="text-[10px] text-slate-400">1-Click apply, or upload your own photo below</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {SUBJECT_BANNER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplySubjectPreset(preset.id)}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/60 text-left transition-all cursor-pointer group space-y-1"
                  title={preset.labelUrdu}
                >
                  <div
                    className="h-7 w-full rounded-lg border border-white/10 flex items-center justify-center text-sm font-black text-white shadow-inner"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${preset.bgStart}, ${preset.bgEnd})`,
                    }}
                  >
                    {preset.icon}
                  </div>
                  <div className="text-[10.5px] font-bold text-slate-200 group-hover:text-amber-300 truncate">
                    {preset.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Full CorelDRAW-Style Picker (Solid / Gradient / Texture / Upload Picture) */}
          <CorelFillPickerCard
            key={`gazette-picker-${selectedScope}`}
            title={`Customize Background & Upload Picture — ${isGlobal ? "Global Default" : previewTitle}`}
            subtitleUrdu="اپنی مرضی کا رنگ (Solid / Gradient)، ٹیکسچر یا کمپیوٹر سے تصویر (Zoom، Position، Opacity) سیٹ کریں"
            value={activeFill}
            onChange={(newVal: FillConfig) => updateScopeEntry({ fill: newVal })}
            defaultColor={defaultPreset.bgStart}
            quickPresets={QUICK_PALETTE}
            customColors={customColors}
            onAddCustomColor={handleAddCustomColor}
            extraControls={
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/75 p-3 rounded-xl border border-slate-800/90">
                {/* Photo Readability Overlay */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                    <span>Photo Dark Overlay / Scrim (تصویر پر ہلکا اندھیرا تاکہ تحریر صاف پڑھی جائے):</span>
                    <span className="font-mono text-amber-300">{resolved.scrimOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={85}
                    step={5}
                    value={resolved.scrimOpacity}
                    onChange={(e) => updateScopeEntry({ scrimOpacity: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Banner Text Contrast Mode */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-200 block">
                    Text Color Mode (لکھائی کا رنگ — Auto / White / Black):
                  </span>
                  <div className="flex gap-1.5">
                    {(
                      [
                        { id: "auto", label: "Auto Contrast" },
                        { id: "light", label: "White Text" },
                        { id: "dark", label: "Black Text" },
                      ] as const
                    ).map((mode) => {
                      const currentMode: GazetteBannerTextMode = resolved.entry.textMode || "auto";
                      const active = currentMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => updateScopeEntry({ textMode: mode.id })}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${active
                            ? "bg-amber-500 text-slate-950 border-amber-400"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                            }`}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            }
          />
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {customizedCount > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All ({customizedCount})</span>
              </button>
            )}
            <span className="text-[11px] text-slate-500">
              Tip: Uploaded photos under 2 MB sync fastest across devices.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveClick}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-md cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Banner Theme"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
