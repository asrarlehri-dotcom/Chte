import type React from "react";

export type PhotoFitMode = "cover" | "contain" | "fill";

export type ProfilePhotoShape =
  | "circle"
  | "squircle"
  | "square"
  | "portrait"
  | "landscape"
  | "oval"
  | "arch";

export type ProfileBorderStyle = "gold" | "theme" | "white" | "dark" | "none";

export type ProfileFrameSize = "sm" | "md" | "lg";

export interface PhotoFramingConfig {
  zoom?: number;
  posX?: number;
  posY?: number;
  fit?: PhotoFitMode;
}

export const PROFILE_SHAPE_OPTIONS: ReadonlyArray<{
  id: ProfilePhotoShape;
  label: string;
  hint: string;
}> = [
  { id: "circle", label: "Circle", hint: "Round Avatar" },
  { id: "squircle", label: "Rounded", hint: "Soft Corners" },
  { id: "square", label: "Square", hint: "Sharp Box" },
  { id: "portrait", label: "Portrait Rect", hint: "3:4 Vertical" },
  { id: "landscape", label: "Wide Rect", hint: "4:3 Horizontal" },
  { id: "oval", label: "Oval", hint: "Tall Capsule" },
  { id: "arch", label: "Arch Dome", hint: "Editorial Frame" },
];

export const PROFILE_BORDER_OPTIONS: ReadonlyArray<{
  id: ProfileBorderStyle;
  label: string;
}> = [
  { id: "gold", label: "Gold Gradient" },
  { id: "theme", label: "Emerald / Theme" },
  { id: "white", label: "Crisp White" },
  { id: "dark", label: "Slate Dark" },
  { id: "none", label: "Borderless" },
];

export const PROFILE_SIZE_OPTIONS: ReadonlyArray<{
  id: ProfileFrameSize;
  label: string;
}> = [
  { id: "sm", label: "Compact" },
  { id: "md", label: "Standard" },
  { id: "lg", label: "Large" },
];

export function clampFramingValue(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

export function normalizePhotoFraming(input?: PhotoFramingConfig | null): {
  zoom: number;
  posX: number;
  posY: number;
  fit: PhotoFitMode;
} {
  const fitRaw = input?.fit;
  const fit: PhotoFitMode =
    fitRaw === "contain" || fitRaw === "fill" || fitRaw === "cover" ? fitRaw : "cover";
  return {
    zoom: clampFramingValue(input?.zoom, 25, 300, 100),
    posX: clampFramingValue(input?.posX, 0, 100, 50),
    posY: clampFramingValue(input?.posY, 0, 100, 50),
    fit,
  };
}

export function buildPhotoTransformStyle(input?: PhotoFramingConfig | null): React.CSSProperties {
  const { zoom, posX, posY, fit } = normalizePhotoFraming(input);
  return {
    objectFit: fit,
    objectPosition: `${posX}% ${posY}%`,
    transform: zoom === 100 ? undefined : `scale(${zoom / 100})`,
    transformOrigin: `${posX}% ${posY}%`,
  };
}

export function getShapeRadiusClasses(
  shape: ProfilePhotoShape = "squircle",
  context: "spotlight" | "card" | "preview" = "card"
): { outer: string; inner: string } {
  switch (shape) {
    case "circle":
      return { outer: "rounded-full", inner: "rounded-full" };
    case "oval":
      return { outer: "rounded-full", inner: "rounded-full" };
    case "square":
      return { outer: "rounded-md", inner: "rounded-[4px]" };
    case "portrait":
      return context === "spotlight"
        ? { outer: "rounded-2xl", inner: "rounded-[12px]" }
        : { outer: "rounded-xl", inner: "rounded-[10px]" };
    case "landscape":
      return context === "spotlight"
        ? { outer: "rounded-2xl", inner: "rounded-[12px]" }
        : { outer: "rounded-xl", inner: "rounded-[10px]" };
    case "arch":
      return {
        outer: "rounded-t-full rounded-b-xl",
        inner: "rounded-t-full rounded-b-lg",
      };
    case "squircle":
    default:
      return context === "spotlight"
        ? { outer: "rounded-3xl", inner: "rounded-[20px]" }
        : { outer: "rounded-2xl", inner: "rounded-[12px]" };
  }
}

export function getProfileDimensionsClass(
  shape: ProfilePhotoShape = "squircle",
  size: ProfileFrameSize = "md",
  context: "spotlight" | "card" | "preview" = "card"
): string {
  const isVertical = shape === "portrait" || shape === "oval" || shape === "arch";
  const isWide = shape === "landscape";

  if (context === "preview") {
    if (isVertical) return "w-28 h-36";
    if (isWide) return "w-40 h-28";
    return "w-32 h-32";
  }

  if (context === "spotlight") {
    if (isVertical) {
      if (size === "sm") return "w-28 h-36 sm:w-32 sm:h-44";
      if (size === "lg") return "w-40 h-56 sm:w-48 sm:h-64";
      return "w-32 h-44 sm:w-40 sm:h-52";
    }
    if (isWide) {
      if (size === "sm") return "w-40 h-28 sm:w-44 sm:h-32";
      if (size === "lg") return "w-56 h-40 sm:w-64 sm:h-48";
      return "w-44 h-32 sm:w-56 sm:h-40";
    }
    if (size === "sm") return "w-28 h-28 sm:w-36 sm:h-36";
    if (size === "lg") return "w-44 h-44 sm:w-52 sm:h-52";
    return "w-36 h-36 sm:w-44 sm:h-44";
  }

  // Card context (College Portal grid or CHTE Homepage cards)
  if (isVertical) {
    if (size === "sm") return "w-14 h-20";
    if (size === "lg") return "w-24 h-32";
    return "w-16 h-24 sm:w-20 sm:h-28";
  }
  if (isWide) {
    if (size === "sm") return "w-20 h-14";
    if (size === "lg") return "w-32 h-24";
    return "w-24 h-16 sm:w-28 sm:h-20";
  }
  if (size === "sm") return "w-14 h-14 sm:w-16 sm:h-16";
  if (size === "lg") return "w-24 h-24 sm:w-28 sm:h-28";
  return "w-16 h-16 sm:w-20 sm:h-20";
}

export function getProfileBorderWrapperClass(
  border: ProfileBorderStyle = "gold",
  context: "spotlight" | "card" | "preview" = "card"
): string {
  if (border === "none") return "p-0 bg-transparent shadow-md";
  const pad = context === "spotlight" ? "p-1" : "p-0.5";
  switch (border) {
    case "theme":
      return `${pad} bg-gradient-to-tr from-emerald-600 via-teal-400 to-emerald-300 shadow-lg`;
    case "white":
      return `${pad} bg-white/90 shadow-lg border border-slate-200/60`;
    case "dark":
      return `${pad} bg-gradient-to-tr from-slate-800 via-slate-600 to-slate-700 shadow-lg`;
    case "gold":
    default:
      return `${pad} bg-gradient-to-tr from-amber-400 via-red-500 to-amber-200 shadow-lg`;
  }
}

export function resolveSlideFraming(
  slideIdx: number,
  globalConfig?: PhotoFramingConfig | null,
  perSlideConfigs?: Record<string, PhotoFramingConfig> | null
): { zoom: number; posX: number; posY: number; fit: PhotoFitMode } {
  const override = perSlideConfigs ? perSlideConfigs[String(slideIdx)] : undefined;
  if (override) {
    return normalizePhotoFraming({
      zoom: override.zoom ?? globalConfig?.zoom,
      posX: override.posX ?? globalConfig?.posX,
      posY: override.posY ?? globalConfig?.posY,
      fit: override.fit ?? globalConfig?.fit,
    });
  }
  return normalizePhotoFraming(globalConfig);
}
