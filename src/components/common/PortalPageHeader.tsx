"use client";

import React, { useState, useEffect, useId } from "react";
import { usePathname } from "next/navigation";
import { IALWebsiteFooterTag } from "@/components/common/IALBranding";
import {
  compileFillToStyle,
  FillConfig,
  getRepresentativeColor,
  normalizeFillConfig,
} from "@/lib/theme-fill-compiler";
import {
  DEFAULT_PORTAL_BANNER_CONFIG,
  ModuleBannerOverridesMap,
  PortalBannerConfig,
  parseStoredModuleOverrides,
  resolveBannerForPath,
} from "@/lib/portal-banner-config";

export interface PortalPageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  showAccentBar?: boolean;
  accentBarColor?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  moduleKey?: string;
  customBannerBg?: string | FillConfig;
  customWaveColor?: string | FillConfig;
  customWaveOpacity?: number;
  customBannerHeight?: number;
  customBannerImgWidth?: number;
  customBannerFade?: number;
  showWaves?: boolean;
  heightClass?: string;
  className?: string;
}

function readGlobalBannerFromStorage(): PortalBannerConfig {
  if (typeof window === "undefined") return DEFAULT_PORTAL_BANNER_CONFIG;

  let pageBannerBg: string | FillConfig = DEFAULT_PORTAL_BANNER_CONFIG.pageBannerBg;
  const storedBanner = localStorage.getItem("college_banner_bg");
  if (storedBanner && !storedBanner.includes("[object")) {
    try {
      pageBannerBg = storedBanner.startsWith("{") ? JSON.parse(storedBanner) : storedBanner;
    } catch {
      pageBannerBg = storedBanner;
    }
  }

  let pageBannerWaveColor: string | FillConfig = DEFAULT_PORTAL_BANNER_CONFIG.pageBannerWaveColor;
  const storedWave = localStorage.getItem("college_banner_wave_color");
  if (storedWave && !storedWave.includes("[object")) {
    try {
      pageBannerWaveColor = storedWave.startsWith("{") ? JSON.parse(storedWave) : storedWave;
    } catch {
      pageBannerWaveColor = storedWave;
    }
  }

  const storedOp = localStorage.getItem("college_banner_wave_opacity");
  const pageBannerWaveOpacity =
    storedOp !== null && !isNaN(Number(storedOp))
      ? Math.max(0, Math.min(100, Number(storedOp)))
      : 100;

  const storedShow = localStorage.getItem("college_banner_wave_show");
  const pageBannerWaveShow = storedShow !== null ? storedShow === "true" : true;

  const storedH = localStorage.getItem("college_banner_height");
  const pageBannerHeight =
    storedH !== null && !isNaN(Number(storedH)) && Number(storedH) >= 110
      ? Math.max(110, Math.min(340, Number(storedH)))
      : 170;

  const storedW = localStorage.getItem("college_banner_img_width");
  const pageBannerImgWidth =
    storedW !== null && !isNaN(Number(storedW))
      ? Math.max(35, Math.min(100, Number(storedW)))
      : 100;

  const storedF = localStorage.getItem("college_banner_fade");
  const pageBannerFade =
    storedF !== null && !isNaN(Number(storedF))
      ? Math.max(0, Math.min(100, Number(storedF)))
      : 85;

  return {
    pageBannerBg,
    pageBannerWaveColor,
    pageBannerWaveOpacity,
    pageBannerWaveShow,
    pageBannerHeight,
    pageBannerImgWidth,
    pageBannerFade,
  };
}

function parseWaveStops(
  waveInput: string | FillConfig,
  fallbackColor = "#047857"
): { stops: { color: string; position: number }[]; representative: string; isMultiColor: boolean } {
  const conf = normalizeFillConfig(waveInput, fallbackColor);
  if (conf.mode === "gradient" && conf.gradient?.stops?.length >= 2) {
    const sorted = [...conf.gradient.stops].sort((a, b) => a.position - b.position);
    return {
      stops: sorted,
      representative: sorted[0]?.color || fallbackColor,
      isMultiColor: true,
    };
  }
  const rep = getRepresentativeColor(waveInput, fallbackColor);
  return {
    stops: [
      { color: rep, position: 0 },
      { color: rep, position: 100 },
    ],
    representative: rep,
    isMultiColor: false,
  };
}

export function PortalPageHeader({
  title,
  subtitle,
  icon,
  showAccentBar = true,
  accentBarColor,
  badge,
  children,
  moduleKey,
  customBannerBg,
  customWaveColor,
  customWaveOpacity,
  customBannerHeight,
  customBannerImgWidth,
  customBannerFade,
  showWaves = true,
  heightClass = "min-h-[155px] md:min-h-[180px]",
  className = "",
}: PortalPageHeaderProps) {
  const uid = useId().replace(/:/g, "");
  const routePath = usePathname();
  const effectivePath = moduleKey || routePath;
  const isPreviewControlled = customBannerBg !== undefined || customWaveColor !== undefined;

  // Default values matching uploaded campus design
  const [bannerBg, setBannerBg] = useState<string | FillConfig>(
    customBannerBg || "/gpgcq-campus-banner.jpg"
  );
  const [waveColor, setWaveColor] = useState<string | FillConfig>(
    customWaveColor || "#047857"
  );
  const [waveOpacity, setWaveOpacity] = useState<number>(
    typeof customWaveOpacity === "number" ? customWaveOpacity : 100
  );
  const [bannerHeight, setBannerHeight] = useState<number | undefined>(
    typeof customBannerHeight === "number" ? customBannerHeight : undefined
  );
  const [bannerImgWidth, setBannerImgWidth] = useState<number>(
    typeof customBannerImgWidth === "number" ? customBannerImgWidth : 100
  );
  const [bannerFade, setBannerFade] = useState<number>(
    typeof customBannerFade === "number" ? customBannerFade : 85
  );
  const [wavesVisible, setWavesVisible] = useState<boolean>(showWaves);

  useEffect(() => {
    if (customBannerBg) setBannerBg(customBannerBg);
  }, [customBannerBg]);

  useEffect(() => {
    if (customWaveColor !== undefined) setWaveColor(customWaveColor);
  }, [customWaveColor]);

  useEffect(() => {
    if (typeof customWaveOpacity === "number") {
      setWaveOpacity(Math.max(0, Math.min(100, customWaveOpacity)));
    }
  }, [customWaveOpacity]);

  useEffect(() => {
    if (typeof customBannerHeight === "number") {
      setBannerHeight(Math.max(110, Math.min(340, customBannerHeight)));
    }
  }, [customBannerHeight]);

  useEffect(() => {
    if (typeof customBannerImgWidth === "number") {
      setBannerImgWidth(Math.max(35, Math.min(100, customBannerImgWidth)));
    }
  }, [customBannerImgWidth]);

  useEffect(() => {
    if (typeof customBannerFade === "number") {
      setBannerFade(Math.max(0, Math.min(100, customBannerFade)));
    }
  }, [customBannerFade]);

  useEffect(() => {
    setWavesVisible(showWaves);
  }, [showWaves]);

  useEffect(() => {
    if (typeof window === "undefined" || isPreviewControlled) return;

    const applyResolvedSettings = (
      eventGlobal?: Partial<PortalBannerConfig>,
      eventOverrides?: ModuleBannerOverridesMap
    ) => {
      const storageGlobal = readGlobalBannerFromStorage();
      const mergedGlobal: PortalBannerConfig = {
        pageBannerBg:
          eventGlobal?.pageBannerBg !== undefined
            ? eventGlobal.pageBannerBg
            : storageGlobal.pageBannerBg,
        pageBannerWaveColor:
          eventGlobal?.pageBannerWaveColor !== undefined
            ? eventGlobal.pageBannerWaveColor
            : storageGlobal.pageBannerWaveColor,
        pageBannerWaveOpacity:
          typeof eventGlobal?.pageBannerWaveOpacity === "number"
            ? eventGlobal.pageBannerWaveOpacity
            : storageGlobal.pageBannerWaveOpacity,
        pageBannerWaveShow:
          typeof eventGlobal?.pageBannerWaveShow === "boolean"
            ? eventGlobal.pageBannerWaveShow
            : storageGlobal.pageBannerWaveShow,
        pageBannerHeight:
          typeof eventGlobal?.pageBannerHeight === "number"
            ? eventGlobal.pageBannerHeight
            : storageGlobal.pageBannerHeight,
        pageBannerImgWidth:
          typeof eventGlobal?.pageBannerImgWidth === "number"
            ? eventGlobal.pageBannerImgWidth
            : storageGlobal.pageBannerImgWidth,
        pageBannerFade:
          typeof eventGlobal?.pageBannerFade === "number"
            ? eventGlobal.pageBannerFade
            : storageGlobal.pageBannerFade,
      };

      const overrides =
        eventOverrides ??
        parseStoredModuleOverrides(localStorage.getItem("college_banner_module_overrides"));

      const resolved = resolveBannerForPath(mergedGlobal, overrides, effectivePath);

      if (!customBannerBg) setBannerBg(resolved.pageBannerBg);
      if (customWaveColor === undefined) setWaveColor(resolved.pageBannerWaveColor);
      if (typeof customWaveOpacity !== "number") setWaveOpacity(resolved.pageBannerWaveOpacity);
      if (typeof customBannerHeight !== "number") setBannerHeight(resolved.pageBannerHeight);
      if (typeof customBannerImgWidth !== "number") setBannerImgWidth(resolved.pageBannerImgWidth);
      if (typeof customBannerFade !== "number") setBannerFade(resolved.pageBannerFade);
      setWavesVisible(resolved.pageBannerWaveShow);
    };

    applyResolvedSettings();

    const handleThemeChange = (e: any) => {
      if (e?.detail) {
        applyResolvedSettings(e.detail, e.detail.moduleBannerOverrides);
      }
    };

    window.addEventListener("college-theme-change", handleThemeChange);
    return () => window.removeEventListener("college-theme-change", handleThemeChange);
  }, [
    effectivePath,
    isPreviewControlled,
    customBannerBg,
    customWaveColor,
    customWaveOpacity,
    customBannerHeight,
    customBannerImgWidth,
    customBannerFade,
  ]);

  // Compile banner background style via normalized FillConfig
  const bannerStyle: React.CSSProperties = compileFillToStyle(bannerBg, "#ffffff");

  const waveParsed = parseWaveStops(waveColor, "#047857");
  const safeWaveColor = waveParsed.representative;
  const activeAccentBarColor = getRepresentativeColor(accentBarColor, safeWaveColor);
  const clampedWaveOpacity = Math.max(0, Math.min(100, waveOpacity)) / 100;
  const fadeRatio = Math.max(0, Math.min(100, bannerFade)) / 100;

  return (
    <div
      className={`relative w-full ${bannerHeight ? "" : heightClass} rounded-2xl md:rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-center px-6 md:px-10 py-5 transition-all duration-300 bg-white print:hidden ${className}`}
      style={bannerHeight ? { minHeight: `${bannerHeight}px` } : undefined}
    >
      {/* ── Background Banner Image / Fill ── */}
      <div
        className="absolute right-0 top-0 bottom-0 transition-all duration-300 ease-out"
        style={{
          ...bannerStyle,
          width: `${bannerImgWidth}%`,
        }}
      />

      {/* ── Left-to-Right Smooth White Fade Overlay (Adjustable) ── */}
      {fadeRatio > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-10 transition-all duration-300"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,${Math.min(1, fadeRatio * 1.15).toFixed(2)}) 0%, rgba(255,255,255,${(fadeRatio * 0.92).toFixed(2)}) 42%, rgba(255,255,255,${(fadeRatio * 0.45).toFixed(2)}) 68%, rgba(255,255,255,0) 100%)`,
          }}
        />
      )}

      {/* ── Corel-Style Multi-Layer Organic Wave Curves ("Side Ribbons / Patii") ── */}
      {wavesVisible && clampedWaveOpacity > 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 h-full w-[52%] max-w-[540px] pointer-events-none z-15 overflow-hidden transition-opacity duration-200"
          style={{ opacity: clampedWaveOpacity }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 500 220"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={`waveGrad1-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                {waveParsed.isMultiColor ? (
                  waveParsed.stops.map((st, idx) => (
                    <stop
                      key={idx}
                      offset={`${st.position}%`}
                      stopColor={st.color}
                      stopOpacity={idx === 0 ? "0.90" : "1"}
                    />
                  ))
                ) : (
                  <>
                    <stop offset="0%" stopColor={safeWaveColor} stopOpacity="0.88" />
                    <stop offset="100%" stopColor={safeWaveColor} stopOpacity="1" />
                  </>
                )}
              </linearGradient>
              <linearGradient id={`waveGrad2-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                {waveParsed.isMultiColor ? (
                  waveParsed.stops.map((st, idx) => (
                    <stop
                      key={idx}
                      offset={`${st.position}%`}
                      stopColor={st.color}
                      stopOpacity={idx === 0 ? "0.34" : "0.62"}
                    />
                  ))
                ) : (
                  <>
                    <stop offset="0%" stopColor={safeWaveColor} stopOpacity="0.32" />
                    <stop offset="100%" stopColor={safeWaveColor} stopOpacity="0.62" />
                  </>
                )}
              </linearGradient>
              <linearGradient id={`waveGrad3-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                {waveParsed.isMultiColor ? (
                  waveParsed.stops.map((st, idx) => (
                    <stop
                      key={idx}
                      offset={`${st.position}%`}
                      stopColor={st.color}
                      stopOpacity={idx === 0 ? "0.14" : "0.28"}
                    />
                  ))
                ) : (
                  <>
                    <stop offset="0%" stopColor={safeWaveColor} stopOpacity="0.14" />
                    <stop offset="100%" stopColor={safeWaveColor} stopOpacity="0.28" />
                  </>
                )}
              </linearGradient>
            </defs>

            {/* Back subtle wave swoosh */}
            <path
              d="M 110 220 C 190 140, 270 70, 500 30 L 500 220 Z"
              fill={`url(#waveGrad3-${uid})`}
            />

            {/* Middle accent wave swoosh */}
            <path
              d="M 190 220 C 270 130, 350 60, 500 82 L 500 220 Z"
              fill={`url(#waveGrad2-${uid})`}
            />

            {/* Foreground primary wave ("patii") */}
            <path
              d="M 275 220 C 355 150, 425 110, 500 122 L 500 220 Z"
              fill={`url(#waveGrad1-${uid})`}
            />

            {/* Delicate highlight sheen */}
            <path
              d="M 190 220 C 270 130, 350 60, 500 82"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
      )}

      {/* ── Content Layer (Z-20) ── */}
      <div className="relative z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {showAccentBar && (
            <div
              className="w-1.5 sm:w-2 h-9 sm:h-12 rounded-full flex-shrink-0 transition-colors shadow-xs"
              style={{ backgroundColor: activeAccentBarColor }}
            />
          )}

          {icon && (
            <div
              className="w-11 h-11 rounded-2xl bg-emerald-50/95 border border-emerald-200/80 flex items-center justify-center flex-shrink-0 shadow-2xs"
              style={{ color: activeAccentBarColor }}
            >
              {icon}
            </div>
          )}

          <div className="min-w-0">
            {badge && <div className="mb-1 flex flex-wrap items-center gap-1.5">{badge}</div>}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Optional Right Action Slot */}
        {children && (
          <div className="flex items-center gap-2 flex-wrap z-20 bg-white/85 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// Bottom matching decorative wave & branding bar for portal page footers
export function PortalBottomWave({
  waveColor = "#047857",
  theme = "light",
}: {
  waveColor?: string | FillConfig;
  theme?: "light" | "dark";
}) {
  const uid = useId().replace(/:/g, "");
  const routePath = usePathname();
  const [activeColor, setActiveColor] = useState<string | FillConfig>(waveColor);
  const [waveOpacity, setWaveOpacity] = useState<number>(100);
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyResolved = (
      eventGlobal?: Partial<PortalBannerConfig>,
      eventOverrides?: ModuleBannerOverridesMap
    ) => {
      const storageGlobal = readGlobalBannerFromStorage();
      const mergedGlobal: PortalBannerConfig = {
        ...storageGlobal,
        ...(eventGlobal?.pageBannerWaveColor !== undefined
          ? { pageBannerWaveColor: eventGlobal.pageBannerWaveColor }
          : {}),
        ...(typeof eventGlobal?.pageBannerWaveOpacity === "number"
          ? { pageBannerWaveOpacity: eventGlobal.pageBannerWaveOpacity }
          : {}),
        ...(typeof eventGlobal?.pageBannerWaveShow === "boolean"
          ? { pageBannerWaveShow: eventGlobal.pageBannerWaveShow }
          : {}),
      };
      const overrides =
        eventOverrides ??
        parseStoredModuleOverrides(localStorage.getItem("college_banner_module_overrides"));
      const resolved = resolveBannerForPath(mergedGlobal, overrides, routePath);
      setActiveColor(resolved.pageBannerWaveColor);
      setWaveOpacity(resolved.pageBannerWaveOpacity);
      setVisible(resolved.pageBannerWaveShow);
    };

    applyResolved();

    const handleTheme = (e: any) => {
      if (e?.detail) {
        applyResolved(e.detail, e.detail.moduleBannerOverrides);
      }
    };
    window.addEventListener("college-theme-change", handleTheme);
    return () => window.removeEventListener("college-theme-change", handleTheme);
  }, [routePath]);

  const parsed = parseWaveStops(activeColor, "#047857");
  const isDark = theme === "dark";
  const showFooterCredit = routePath !== "/dashboard";

  return (
    <div className="w-full mt-8 print:hidden">
      {showFooterCredit && (
        <div
          className={`px-4 md:px-2 pt-3 pb-2 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] ${
            isDark ? "border-slate-800/80 text-slate-400" : "border-slate-200/80 text-slate-500"
          }`}
        >
          <span>© {new Date().getFullYear()} Higher Education Management Information System (HEMIS) Balochistan</span>
          <IALWebsiteFooterTag variant={isDark ? "slate-dark" : "light"} />
        </div>
      )}
      {visible && waveOpacity > 0 && (
        <div
          className="w-full h-10 overflow-hidden pointer-events-none relative flex justify-end transition-opacity duration-200"
          style={{ opacity: Math.max(0, Math.min(100, waveOpacity)) / 100 }}
        >
          <svg
            className="h-full w-96 max-w-full"
            viewBox="0 0 400 40"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id={`bottomWave1-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                {parsed.stops.map((st, idx) => (
                  <stop key={idx} offset={`${st.position}%`} stopColor={st.color} stopOpacity="0.82" />
                ))}
              </linearGradient>
              <linearGradient id={`bottomWave2-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                {parsed.stops.map((st, idx) => (
                  <stop key={idx} offset={`${st.position}%`} stopColor={st.color} stopOpacity="0.35" />
                ))}
              </linearGradient>
            </defs>
            <path
              d="M 0 40 C 140 40, 240 8, 400 0 L 400 40 Z"
              fill={`url(#bottomWave1-${uid})`}
            />
            <path
              d="M 60 40 C 180 40, 280 14, 400 6 L 400 40 Z"
              fill={`url(#bottomWave2-${uid})`}
            />
          </svg>
        </div>
      )}
    </div>
  );
}
