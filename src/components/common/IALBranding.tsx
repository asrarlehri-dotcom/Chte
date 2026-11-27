import React from "react";

export const IAL_LOGO_SRC = "/ial-innovations-logo.jpg";
export const IAL_TAGLINE = "Created by Israr Ahmed Lehri Innovations IAL";
export const IAL_CONTACT_EMAIL = "asrarlehri@gmail.com";

export interface IALWebsiteFooterTagProps {
  variant?: "emerald-dark" | "slate-dark" | "light";
  className?: string;
}

export function IALWebsiteFooterTag({
  variant = "emerald-dark",
  className = "",
}: IALWebsiteFooterTagProps) {
  const isLight = variant === "light";
  const badgeClasses = isLight
    ? "bg-white border-slate-200 shadow-2xs"
    : "bg-white/95 border-white/25 shadow-sm";
  const textClasses =
    variant === "emerald-dark"
      ? "text-emerald-200/95"
      : variant === "slate-dark"
        ? "text-slate-300"
        : "text-slate-600";
  const highlightClasses = isLight ? "text-slate-800" : "text-white";
  const linkClasses =
    variant === "emerald-dark"
      ? "text-emerald-100 hover:text-white underline underline-offset-2"
      : variant === "slate-dark"
        ? "text-slate-200 hover:text-white underline underline-offset-2"
        : "text-slate-700 hover:text-slate-900 underline underline-offset-2";

  return (
    <div className={`inline-flex flex-wrap items-center justify-center gap-2 ${className}`}>
      <span
        className={`inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 shrink-0 ${badgeClasses}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IAL_LOGO_SRC}
          alt={IAL_TAGLINE}
          className="h-6 sm:h-7 w-auto object-contain block"
        />
      </span>
      <span className={`text-[11px] font-semibold leading-tight flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 ${textClasses}`}>
        <span>
          Created by{" "}
          <strong className={`font-extrabold ${highlightClasses}`}>
            Israr Ahmed Lehri Innovations IAL
          </strong>
        </span>
        <span className="opacity-60">•</span>
        <span>
          Contact:{" "}
          <a href={`mailto:${IAL_CONTACT_EMAIL}`} className={`font-semibold ${linkClasses}`}>
            {IAL_CONTACT_EMAIL}
          </a>
        </span>
      </span>
    </div>
  );
}

export interface IALPrintFooterProps {
  compact?: boolean;
  printOnly?: boolean;
  className?: string;
}

export function IALPrintFooter({
  compact = false,
  printOnly = false,
  className = "",
}: IALPrintFooterProps) {
  return (
    <div
      className={`${
        printOnly ? "hidden print:flex" : "flex"
      } items-center justify-center flex-wrap gap-2 border-t border-slate-300/80 print:border-slate-400 ${
        compact ? "pt-1 mt-1.5" : "pt-2 mt-3"
      } ${className}`}
    >
      <span className="inline-flex items-center justify-center bg-white rounded px-1 py-0.5 print:bg-transparent print:p-0 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IAL_LOGO_SRC}
          alt={IAL_TAGLINE}
          className={`${compact ? "h-4" : "h-5 sm:h-6"} w-auto object-contain block`}
        />
      </span>
      <span
        className={`font-sans font-bold tracking-wide text-slate-700 print:text-black leading-tight ${
          compact ? "text-[8px]" : "text-[9px]"
        }`}
      >
        {IAL_TAGLINE} • Contact: {IAL_CONTACT_EMAIL}
      </span>
    </div>
  );
}
