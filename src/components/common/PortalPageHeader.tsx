"use client";

import React, { useState, useEffect, useId } from "react";
import {
  compileFillToStyle,
  FillConfig,
  getRepresentativeColor,
} from "@/lib/theme-fill-compiler";

export interface PortalPageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  showAccentBar?: boolean;
  accentBarColor?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  customBannerBg?: string | FillConfig;
  customWaveColor?: string;
  showWaves?: boolean;
  heightClass?: string;
  className?: string;
}

export function PortalPageHeader({
  title,
  subtitle,
  icon,
  showAccentBar = true,
  accentBarColor,
  badge,
  children,
  customBannerBg,
  customWaveColor,
  showWaves = true,
  heightClass = "min-h-[155px] md:min-h-[180px]",
  className = "",
}: PortalPageHeaderProps) {
  const uid = useId().replace(/:/g, "");

  // Default values matching uploaded campus design
  const [bannerBg, setBannerBg] = useState<string | FillConfig>(
    customBannerBg || "/gpgcq-campus-banner.jpg"
  );
  const [waveColor, setWaveColor] = useState<string>(
    getRepresentativeColor(customWaveColor, "#047857")
  );
  const [wavesVisible, setWavesVisible] = useState<boolean>(showWaves);

  useEffect(() => {
    if (customBannerBg) {
      setBannerBg(customBannerBg);
    }
  }, [customBannerBg]);

  useEffect(() => {
    if (customWaveColor) {
      setWaveColor(getRepresentativeColor(customWaveColor, "#047857"));
    }
  }, [customWaveColor]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readSettings = () => {
      if (!customBannerBg) {
        const storedBanner = localStorage.getItem("college_banner_bg");
        if (storedBanner && !storedBanner.includes("[object")) {
          try {
            if (storedBanner.startsWith("{")) {
              setBannerBg(JSON.parse(storedBanner));
            } else {
              setBannerBg(storedBanner);
            }
          } catch {
            setBannerBg(storedBanner);
          }
        } else {
          setBannerBg("/gpgcq-campus-banner.jpg");
        }
      }

      if (!customWaveColor) {
        const storedWave = localStorage.getItem("college_banner_wave_color");
        if (storedWave) {
          setWaveColor(getRepresentativeColor(storedWave, "#047857"));
        } else {
          setWaveColor("#047857");
        }
      }

      const storedShow = localStorage.getItem("college_banner_wave_show");
      if (storedShow !== null) {
        setWavesVisible(storedShow === "true");
      }
    };

    readSettings();

    const handleThemeChange = (e: any) => {
      if (e?.detail) {
        if (e.detail.pageBannerBg && !customBannerBg) {
          setBannerBg(e.detail.pageBannerBg);
        }
        if (e.detail.pageBannerWaveColor && !customWaveColor) {
          setWaveColor(getRepresentativeColor(e.detail.pageBannerWaveColor, "#047857"));
        }
        if (e.detail.pageBannerWaveShow !== undefined) {
          setWavesVisible(e.detail.pageBannerWaveShow);
        }
      }
    };

    window.addEventListener("college-theme-change", handleThemeChange);
    return () => window.removeEventListener("college-theme-change", handleThemeChange);
  }, [customBannerBg, customWaveColor]);

  // Compile banner background style
  let bannerStyle: React.CSSProperties = {};
  if (typeof bannerBg === "string") {
    if (
      bannerBg.startsWith("/") ||
      bannerBg.startsWith("http") ||
      bannerBg.startsWith("data:image")
    ) {
      bannerStyle = {
        backgroundImage: `url('${bannerBg}')`,
        backgroundSize: "cover",
        backgroundPosition: "center right",
        backgroundRepeat: "no-repeat",
      };
    } else {
      bannerStyle = compileFillToStyle(bannerBg, "#ffffff");
    }
  } else if (bannerBg && typeof bannerBg === "object") {
    bannerStyle = compileFillToStyle(bannerBg, "#ffffff");
  }

  const safeWaveColor = getRepresentativeColor(waveColor, "#047857");
  const activeAccentBarColor = getRepresentativeColor(accentBarColor, safeWaveColor);

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl md:rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-center px-6 md:px-10 py-5 transition-all duration-300 bg-white print:hidden ${className}`}
    >
      {/* ── Background Banner Image / Fill ── */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-out"
        style={bannerStyle}
      />

      {/* ── Left-to-Right Smooth White Fade Overlay ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/85 md:via-white/75 to-transparent pointer-events-none z-10" />

      {/* ── Corel-Style Multi-Layer Organic Wave Curves ("Patii") ── */}
      {wavesVisible && (
        <div className="absolute right-0 top-0 bottom-0 h-full w-[52%] max-w-[540px] pointer-events-none z-15 overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 500 220"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={`waveGrad1-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={safeWaveColor} stopOpacity="0.88" />
                <stop offset="100%" stopColor={safeWaveColor} stopOpacity="1" />
              </linearGradient>
              <linearGradient id={`waveGrad2-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={safeWaveColor} stopOpacity="0.32" />
                <stop offset="100%" stopColor={safeWaveColor} stopOpacity="0.62" />
              </linearGradient>
              <linearGradient id={`waveGrad3-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={safeWaveColor} stopOpacity="0.14" />
                <stop offset="100%" stopColor={safeWaveColor} stopOpacity="0.28" />
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

// Bottom matching decorative wave for page footers (as seen in Dashboard & Exams screenshots)
export function PortalBottomWave({ waveColor = "#047857" }: { waveColor?: string }) {
  const [activeColor, setActiveColor] = useState(
    getRepresentativeColor(waveColor, "#047857")
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("college_banner_wave_color");
    if (stored) setActiveColor(getRepresentativeColor(stored, "#047857"));

    const handleTheme = (e: any) => {
      if (e?.detail?.pageBannerWaveColor) {
        setActiveColor(getRepresentativeColor(e.detail.pageBannerWaveColor, "#047857"));
      }
    };
    window.addEventListener("college-theme-change", handleTheme);
    return () => window.removeEventListener("college-theme-change", handleTheme);
  }, []);

  return (
    <div className="w-full h-10 overflow-hidden pointer-events-none relative mt-8 flex justify-end print:hidden">
      <svg
        className="h-full w-96 max-w-full"
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M 0 40 C 140 40, 240 8, 400 0 L 400 40 Z"
          fill={activeColor}
          fillOpacity="0.82"
        />
        <path
          d="M 60 40 C 180 40, 280 14, 400 6 L 400 40 Z"
          fill={activeColor}
          fillOpacity="0.35"
        />
      </svg>
    </div>
  );
}
