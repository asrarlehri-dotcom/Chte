"use client";

import React, { useState, useEffect } from "react";
import { compileFillToStyle, FillConfig, normalizeFillConfig } from "@/lib/theme-fill-compiler";

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
  showAccentBar = false,
  accentBarColor,
  badge,
  children,
  customBannerBg,
  customWaveColor,
  showWaves = true,
  heightClass = "min-h-[160px] md:min-h-[190px]",
  className = "",
}: PortalPageHeaderProps) {
  // Default values matching uploaded screenshot
  const [bannerBg, setBannerBg] = useState<string | FillConfig>(
    customBannerBg || "/gpgcq-campus-banner.jpg"
  );
  const [waveColor, setWaveColor] = useState<string>(
    customWaveColor || "#047857"
  );
  const [wavesVisible, setWavesVisible] = useState<boolean>(showWaves);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load persisted settings if not explicitly passed as prop
    const readSettings = () => {
      if (!customBannerBg) {
        const storedBanner = localStorage.getItem("college_banner_bg");
        if (storedBanner) {
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
          setWaveColor(storedWave);
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

    // Listen to real-time updates from /admin/settings
    const handleThemeChange = (e: any) => {
      if (e?.detail) {
        if (e.detail.pageBannerBg && !customBannerBg) {
          setBannerBg(e.detail.pageBannerBg);
        }
        if (e.detail.pageBannerWaveColor && !customWaveColor) {
          setWaveColor(e.detail.pageBannerWaveColor);
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
      // Solid or gradient string
      bannerStyle = compileFillToStyle(bannerBg, "#064e3b");
    }
  } else if (bannerBg && typeof bannerBg === "object") {
    bannerStyle = compileFillToStyle(bannerBg, "#064e3b");
  }

  const activeAccentBarColor = accentBarColor || waveColor || "#047857";

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl md:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-center px-6 md:px-10 py-5 transition-all duration-300 print:border-none print:shadow-none ${className}`}
    >
      {/* ── Background Banner Image / Fill ── */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-out"
        style={bannerStyle}
      />

      {/* ── Left-to-Right Smooth White Fade Overlay ── */}
      {/* Fades from crisp opaque white on the left (so typography is 100% sharp) into transparent on the right */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/80 md:via-white/70 to-transparent pointer-events-none z-10" />

      {/* ── Corel-Style Multi-Layer Organic Wave Curves ("Patii") ── */}
      {wavesVisible && (
        <div className="absolute right-0 top-0 bottom-0 h-full w-[55%] max-w-[550px] pointer-events-none z-15 overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 500 220"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="headerWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={waveColor} stopOpacity="0.85" />
                <stop offset="100%" stopColor={waveColor} stopOpacity="1" />
              </linearGradient>
              <linearGradient id="headerWaveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={waveColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={waveColor} stopOpacity="0.65" />
              </linearGradient>
              <linearGradient id="headerWaveGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={waveColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor={waveColor} stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Back subtle wave swoosh */}
            <path
              d="M 100 220 C 180 140, 260 70, 500 30 L 500 220 Z"
              fill="url(#headerWaveGrad3)"
            />

            {/* Middle accent wave swoosh */}
            <path
              d="M 180 220 C 260 130, 340 60, 500 80 L 500 220 Z"
              fill="url(#headerWaveGrad2)"
            />

            {/* Foreground primary wave ("patii") */}
            <path
              d="M 270 220 C 350 150, 420 110, 500 120 L 500 220 Z"
              fill="url(#headerWaveGrad1)"
            />

            {/* Delicate highlight sheen */}
            <path
              d="M 180 220 C 260 130, 340 60, 500 80"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
      )}

      {/* ── Content Layer (Z-20) ── */}
      <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Vertical Accent Bar (Optional, as seen in Examinations & Results screenshot) */}
          {showAccentBar && (
            <div
              className="w-1.5 sm:w-2 h-9 sm:h-12 rounded-full flex-shrink-0 transition-colors shadow-xs"
              style={{ backgroundColor: activeAccentBarColor }}
            />
          )}

          {/* Left Icon (Optional, as seen in Dashboard screenshot) */}
          {icon && (
            <div className="flex-shrink-0 text-emerald-800">
              {icon}
            </div>
          )}

          <div className="min-w-0">
            {badge && <div className="mb-1">{badge}</div>}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1 max-w-2xl line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Optional Right Action Slot */}
        {children && (
          <div className="flex items-center gap-2.5 flex-wrap z-20">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// Bottom matching decorative wave for page footers (as seen in Dashboard screenshot)
export function PortalBottomWave({ waveColor = "#047857" }: { waveColor?: string }) {
  const [activeColor, setActiveColor] = useState(waveColor);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("college_banner_wave_color");
    if (stored) setActiveColor(stored);

    const handleTheme = (e: any) => {
      if (e?.detail?.pageBannerWaveColor) {
        setActiveColor(e.detail.pageBannerWaveColor);
      }
    };
    window.addEventListener("college-theme-change", handleTheme);
    return () => window.removeEventListener("college-theme-change", handleTheme);
  }, []);

  return (
    <div className="w-full h-10 overflow-hidden pointer-events-none relative mt-6 -mb-4 flex justify-end print:hidden">
      <svg
        className="h-full w-96 max-w-full"
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M 0 40 C 140 40, 240 8, 400 0 L 400 40 Z"
          fill={activeColor}
          fillOpacity="0.8"
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
