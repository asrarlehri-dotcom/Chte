import React from "react";

export type FillMode = "solid" | "gradient" | "texture" | "image";

export type GradientStop = {
  color: string;
  position: number; // 0 to 100
};

export type GradientConfig = {
  type: "linear" | "radial" | "conic";
  angle: number; // 0 to 360 degrees
  stops: GradientStop[];
};

export type TextureType =
  | "canvas"
  | "grid"
  | "stripes"
  | "mesh"
  | "dots"
  | "paper"
  | "carbon"
  | "guilloche"
  | "islamic"
  | "golddust"
  | "marble";

export type TextureConfig = {
  type: TextureType;
  baseColor: string;
  patternColor: string;
  scale: number; // 10px to 80px
  opacity: number; // 5 to 100%
};

export type ImageFitMode = "cover" | "contain" | "repeat" | "stretch";
export type ImagePosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top left"
  | "top right"
  | "bottom left"
  | "bottom right"
  | string;

export type ImageConfig = {
  url: string;
  fit: ImageFitMode;
  position: ImagePosition;
  tintColor: string;
  tintOpacity: number; // 0 to 95%
  zoom?: number; // 25% to 400%, default 100
  focalPoint?: { x: number; y: number }; // 0% to 100%
  scaleMode?: "auto" | "width" | "height" | "both";
};

export type FillConfig = {
  mode: FillMode;
  solid: string;
  gradient: GradientConfig;
  texture: TextureConfig;
  image: ImageConfig;
};

// Built-in Gradient Presets
export const GRADIENT_PRESETS: { name: string; stops: GradientStop[]; angle: number }[] = [
  {
    name: "Academic Navy-Gold",
    angle: 135,
    stops: [
      { color: "#091e3a", position: 0 },
      { color: "#1e3a8a", position: 50 },
      { color: "#d97706", position: 100 },
    ],
  },
  {
    name: "Crimson Sunset",
    angle: 90,
    stops: [
      { color: "#7f1d1d", position: 0 },
      { color: "#dc2626", position: 50 },
      { color: "#f97316", position: 100 },
    ],
  },
  {
    name: "Royal Emerald",
    angle: 135,
    stops: [
      { color: "#064e3b", position: 0 },
      { color: "#059669", position: 50 },
      { color: "#10b981", position: 100 },
    ],
  },
  {
    name: "Ruby Ribbon",
    angle: 90,
    stops: [
      { color: "#881337", position: 0 },
      { color: "#e11d48", position: 50 },
      { color: "#fb7185", position: 100 },
    ],
  },
  {
    name: "Midnight Slate",
    angle: 180,
    stops: [
      { color: "#020617", position: 0 },
      { color: "#0f172a", position: 50 },
      { color: "#334155", position: 100 },
    ],
  },
];

// Built-in Texture Patterns (SVG Data URIs)
export function generatePatternSvg(type: TextureType, patternColor: string, opacity: number): string {
  const op = (Math.max(5, Math.min(100, opacity)) / 100).toFixed(2);
  const color = patternColor || "#ffffff";

  let svgContent = "";
  let size = 20;

  switch (type) {
    case "carbon":
      size = 12;
      svgContent = `
        <rect width="6" height="6" fill="${color}" fill-opacity="${op}" />
        <rect x="6" y="6" width="6" height="6" fill="${color}" fill-opacity="${op}" />
        <path d="M0,0 l6,6 M6,0 l6,6 M0,6 l6,6" stroke="${color}" stroke-width="0.8" stroke-opacity="${op}" />
      `;
      break;
    case "grid":
      size = 20;
      svgContent = `<path d="M 20 0 L 0 0 0 20" fill="none" stroke="${color}" stroke-width="1" stroke-opacity="${op}" />`;
      break;
    case "stripes":
      size = 20;
      svgContent = `<path d="M-5,5 l10,-10 M0,20 l20,-20 M15,25 l10,-10" stroke="${color}" stroke-width="2" stroke-opacity="${op}" />`;
      break;
    case "mesh":
      size = 24;
      svgContent = `<path d="M 0 12 L 12 0 L 24 12 L 12 24 Z" fill="none" stroke="${color}" stroke-width="1" stroke-opacity="${op}" />`;
      break;
    case "guilloche":
      size = 36;
      svgContent = `
        <path d="M0,12 C9,3 18,21 27,12 C36,3 45,21 54,12 M0,24 C9,15 18,33 27,24 C36,15 45,33 54,24 M0,0 C9,-9 18,9 27,0 C36,-9 45,9 54,0" fill="none" stroke="${color}" stroke-width="0.9" stroke-opacity="${op}" />
        <path d="M0,18 C12,6 24,30 36,18 M0,6 C12,-6 24,18 36,6" fill="none" stroke="${color}" stroke-width="0.5" stroke-opacity="${(Number(op) * 0.7).toFixed(2)}" />
      `;
      break;
    case "islamic":
      size = 32;
      svgContent = `
        <polygon points="16,0 20,12 32,16 20,20 16,32 12,20 0,16 12,12" fill="none" stroke="${color}" stroke-width="1" stroke-opacity="${op}" />
        <polygon points="16,6 22,10 26,16 22,22 16,26 10,22 6,16 10,10" fill="none" stroke="${color}" stroke-width="0.6" stroke-opacity="${(Number(op) * 0.75).toFixed(2)}" />
      `;
      break;
    case "golddust":
      size = 28;
      svgContent = `
        <circle cx="4" cy="5" r="0.9" fill="${color}" fill-opacity="${op}" />
        <circle cx="11" cy="14" r="1.3" fill="${color}" fill-opacity="${op}" />
        <circle cx="21" cy="7" r="0.7" fill="${color}" fill-opacity="${op}" />
        <circle cx="17" cy="19" r="1.1" fill="${color}" fill-opacity="${op}" />
        <circle cx="7" cy="22" r="1.0" fill="${color}" fill-opacity="${op}" />
        <circle cx="24" cy="24" r="1.4" fill="${color}" fill-opacity="${op}" />
        <circle cx="14" cy="2" r="0.5" fill="${color}" fill-opacity="${op}" />
      `;
      break;
    case "marble":
      size = 40;
      svgContent = `
        <path d="M0,10 Q10,18 20,8 T40,14 M0,26 Q12,16 24,28 T48,20" fill="none" stroke="${color}" stroke-width="1.3" stroke-opacity="${op}" />
        <path d="M10,0 Q18,12 8,24 T14,40 M26,0 Q34,16 24,30 T30,40" fill="none" stroke="${color}" stroke-width="0.7" stroke-opacity="${(Number(op) * 0.6).toFixed(2)}" />
      `;
      break;
    case "dots":
      size = 16;
      svgContent = `<circle cx="8" cy="8" r="2" fill="${color}" fill-opacity="${op}" />`;
      break;
    case "paper":
      size = 32;
      svgContent = `
        <circle cx="4" cy="4" r="0.8" fill="${color}" fill-opacity="${op}" />
        <circle cx="20" cy="8" r="1" fill="${color}" fill-opacity="${op}" />
        <circle cx="12" cy="18" r="0.6" fill="${color}" fill-opacity="${op}" />
        <circle cx="28" cy="24" r="0.9" fill="${color}" fill-opacity="${op}" />
        <circle cx="8" cy="28" r="1.1" fill="${color}" fill-opacity="${op}" />
      `;
      break;
    case "canvas":
    default:
      size = 16;
      svgContent = `
        <line x1="0" y1="4" x2="16" y2="4" stroke="${color}" stroke-width="0.8" stroke-opacity="${op}" stroke-dasharray="2,2" />
        <line x1="0" y1="12" x2="16" y2="12" stroke="${color}" stroke-width="0.8" stroke-opacity="${op}" stroke-dasharray="2,2" />
        <line x1="4" y1="0" x2="4" y2="16" stroke="${color}" stroke-width="0.8" stroke-opacity="${op}" stroke-dasharray="2,2" />
        <line x1="12" y1="0" x2="12" y2="16" stroke="${color}" stroke-width="0.8" stroke-opacity="${op}" stroke-dasharray="2,2" />
      `;
      break;
  }

  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${svgContent}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
}

// Convert hex to rgb
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = (hex || "").replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  if (isNaN(num) || clean.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Default Fill Config generator
export function createDefaultFillConfig(defaultColor: string): FillConfig {
  return {
    mode: "solid",
    solid: defaultColor,
    gradient: {
      type: "linear",
      angle: 90,
      stops: [
        { color: defaultColor, position: 0 },
        { color: "#ffffff", position: 100 },
      ],
    },
    texture: {
      type: "canvas",
      baseColor: defaultColor,
      patternColor: "#ffffff",
      scale: 24,
      opacity: 20,
    },
    image: {
      url: "",
      fit: "cover",
      position: "center",
      tintColor: "#000000",
      tintOpacity: 0,
      zoom: 100,
      focalPoint: { x: 50, y: 50 },
      scaleMode: "auto",
    },
  };
}

// Safely normalize any raw stored value (string, partial object, or FillConfig) into a complete FillConfig
export function normalizeFillConfig(input: any, defaultSolid = "#000000"): FillConfig {
  const fallback = createDefaultFillConfig(defaultSolid);

  if (!input) return fallback;

  if (typeof input === "string") {
    const trimmed = input.trim();
    // If it's a JSON string of a FillConfig
    if (trimmed.startsWith("{") && trimmed.includes('"mode"')) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeFillConfig(parsed, defaultSolid);
      } catch { }
    }

    return {
      ...fallback,
      mode: "solid",
      solid: trimmed.startsWith("#") ? trimmed : `#${trimmed}`,
    };
  }

  if (typeof input === "object") {
    const mode: FillMode = ["solid", "gradient", "texture", "image"].includes(input.mode)
      ? input.mode
      : "solid";

    const solid = typeof input.solid === "string" ? input.solid : defaultSolid;

    const stops: GradientStop[] = Array.isArray(input.gradient?.stops) && input.gradient.stops.length >= 2
      ? input.gradient.stops.map((s: any) => ({
        color: typeof s.color === "string" ? s.color : "#ffffff",
        position: typeof s.position === "number" ? Math.max(0, Math.min(100, s.position)) : 0,
      }))
      : [
        { color: solid, position: 0 },
        { color: "#ffffff", position: 100 },
      ];

    const gradient: GradientConfig = {
      type: ["linear", "radial", "conic"].includes(input.gradient?.type) ? input.gradient.type : "linear",
      angle: typeof input.gradient?.angle === "number" ? ((input.gradient.angle % 360) + 360) % 360 : 90,
      stops,
    };

    const texture: TextureConfig = {
      type: ["canvas", "grid", "stripes", "mesh", "dots", "paper"].includes(input.texture?.type)
        ? input.texture.type
        : "canvas",
      baseColor: typeof input.texture?.baseColor === "string" ? input.texture.baseColor : solid,
      patternColor: typeof input.texture?.patternColor === "string" ? input.texture.patternColor : "#ffffff",
      scale: typeof input.texture?.scale === "number" ? Math.max(10, Math.min(80, input.texture.scale)) : 24,
      opacity: typeof input.texture?.opacity === "number" ? Math.max(5, Math.min(100, input.texture.opacity)) : 20,
    };

    const zoom =
      typeof input.image?.zoom === "number" && input.image.zoom > 0
        ? Math.max(10, Math.min(500, input.image.zoom))
        : 100;

    let focalPoint = { x: 50, y: 50 };
    if (
      input.image?.focalPoint &&
      typeof input.image.focalPoint.x === "number" &&
      typeof input.image.focalPoint.y === "number"
    ) {
      focalPoint = {
        x: Math.max(0, Math.min(100, Math.round(input.image.focalPoint.x))),
        y: Math.max(0, Math.min(100, Math.round(input.image.focalPoint.y))),
      };
    } else if (typeof input.image?.position === "string") {
      const pos = input.image.position.toLowerCase();
      if (pos.includes("top") && pos.includes("left")) focalPoint = { x: 0, y: 0 };
      else if (pos.includes("top") && pos.includes("right")) focalPoint = { x: 100, y: 0 };
      else if (pos.includes("bottom") && pos.includes("left")) focalPoint = { x: 0, y: 100 };
      else if (pos.includes("bottom") && pos.includes("right")) focalPoint = { x: 100, y: 100 };
      else if (pos === "top") focalPoint = { x: 50, y: 0 };
      else if (pos === "bottom") focalPoint = { x: 50, y: 100 };
      else if (pos === "left") focalPoint = { x: 0, y: 50 };
      else if (pos === "right") focalPoint = { x: 100, y: 50 };
      else if (pos.includes("%")) {
        const parts = pos.split(/\s+/).map((p: string) => parseFloat(p));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          focalPoint = {
            x: Math.max(0, Math.min(100, parts[0])),
            y: Math.max(0, Math.min(100, parts[1])),
          };
        }
      }
    }

    const image: ImageConfig = {
      url: typeof input.image?.url === "string" ? input.image.url : "",
      fit: ["cover", "contain", "repeat", "stretch"].includes(input.image?.fit)
        ? input.image.fit
        : "cover",
      position: `${focalPoint.x}% ${focalPoint.y}%`,
      tintColor: typeof input.image?.tintColor === "string" ? input.image.tintColor : "#000000",
      tintOpacity:
        typeof input.image?.tintOpacity === "number"
          ? Math.max(0, Math.min(95, input.image.tintOpacity))
          : 0,
      zoom,
      focalPoint,
      scaleMode: ["auto", "width", "height", "both"].includes(input.image?.scaleMode)
        ? input.image.scaleMode
        : "auto",
    };

    return {
      mode,
      solid,
      gradient,
      texture,
      image,
    };
  }

  return fallback;
}

// Compile FillConfig to React.CSSProperties
export function compileFillToStyle(
  fill: FillConfig | string | null | undefined,
  defaultSolid = "#000000"
): React.CSSProperties {
  const conf = normalizeFillConfig(fill, defaultSolid);

  switch (conf.mode) {
    case "gradient": {
      const sortedStops = [...conf.gradient.stops].sort((a, b) => a.position - b.position);
      const stopsStr = sortedStops.map((s) => `${s.color} ${s.position}%`).join(", ");

      if (conf.gradient.type === "radial") {
        return {
          backgroundImage: `radial-gradient(circle at center, ${stopsStr})`,
          backgroundColor: sortedStops[0]?.color || defaultSolid,
        };
      }
      if (conf.gradient.type === "conic") {
        return {
          backgroundImage: `conic-gradient(from ${conf.gradient.angle}deg at center, ${stopsStr})`,
          backgroundColor: sortedStops[0]?.color || defaultSolid,
        };
      }
      // linear
      return {
        backgroundImage: `linear-gradient(${conf.gradient.angle}deg, ${stopsStr})`,
        backgroundColor: sortedStops[0]?.color || defaultSolid,
      };
    }

    case "texture": {
      const patternSvgUrl = generatePatternSvg(
        conf.texture.type,
        conf.texture.patternColor,
        conf.texture.opacity
      );
      const sizePx = `${conf.texture.scale}px ${conf.texture.scale}px`;

      return {
        backgroundColor: conf.texture.baseColor,
        backgroundImage: `url("${patternSvgUrl}")`,
        backgroundSize: sizePx,
        backgroundRepeat: "repeat",
      };
    }

    case "image": {
      if (!conf.image.url) {
        return {
          backgroundColor: conf.solid || defaultSolid,
        };
      }

      const { r, g, b } = hexToRgb(conf.image.tintColor || "#000000");
      const alpha = (conf.image.tintOpacity / 100).toFixed(2);
      const tintLayer =
        conf.image.tintOpacity > 0
          ? `linear-gradient(rgba(${r},${g},${b},${alpha}), rgba(${r},${g},${b},${alpha})), `
          : "";

      const zoom = typeof conf.image.zoom === "number" && conf.image.zoom > 0 ? conf.image.zoom : 100;
      let backgroundSize = "cover";
      let backgroundRepeat = "no-repeat";

      if (conf.image.fit === "contain") {
        backgroundSize = zoom === 100 ? "contain" : `${zoom}% auto`;
      } else if (conf.image.fit === "repeat") {
        backgroundSize = zoom === 100 ? "auto" : `${zoom}% auto`;
        backgroundRepeat = "repeat";
      } else if (conf.image.fit === "stretch") {
        backgroundSize = zoom === 100 ? "100% 100%" : `${zoom}% ${zoom}%`;
      } else {
        // cover mode
        if (zoom === 100) {
          backgroundSize = "cover";
        } else {
          if (conf.image.scaleMode === "height") {
            backgroundSize = `auto ${zoom}%`;
          } else if (conf.image.scaleMode === "both") {
            backgroundSize = `${zoom}% ${zoom}%`;
          } else {
            backgroundSize = `${zoom}% auto`;
          }
        }
      }

      const focalX = conf.image.focalPoint?.x ?? 50;
      const focalY = conf.image.focalPoint?.y ?? 50;
      const backgroundPosition = `${focalX}% ${focalY}%`;

      return {
        backgroundColor: conf.image.tintColor || defaultSolid,
        backgroundImage: `${tintLayer}url("${conf.image.url}")`,
        backgroundSize,
        backgroundRepeat,
        backgroundPosition,
      };
    }

    case "solid":
    default:
      return {
        backgroundColor: conf.solid || defaultSolid,
      };
  }
}

// Validate whether a string is a valid CSS hex / rgb / hsl color
function isSafeCssColorString(val: string): boolean {
  const s = val.trim();
  if (!s || s.includes("[object")) return false;
  return (
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s) ||
    /^rgba?\([^)]+\)$/i.test(s) ||
    /^hsla?\([^)]+\)$/i.test(s)
  );
}

// Compute whether a hex color is perceived as light (for choosing black vs white foreground text)
export function isLightColor(colorStr: string | null | undefined): boolean {
  if (!colorStr || typeof colorStr !== "string") return false;
  const s = colorStr.trim();
  if (!s.startsWith("#")) return false;
  const { r, g, b } = hexToRgb(s);
  // Standard W3C relative luminance approximation (YIQ / WCAG sRGB)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 165;
}

// Quick helper to extract single representative color for text contrast or borders
export function getRepresentativeColor(
  fill: FillConfig | string | null | undefined,
  fallback = "#000000"
): string {
  if (!fill) return fallback;
  if (typeof fill === "string") {
    const trimmed = fill.trim();
    if (!trimmed || trimmed.includes("[object")) return fallback;
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return getRepresentativeColor(parsed, fallback);
      } catch {
        return fallback;
      }
    }
    if (isSafeCssColorString(trimmed)) return trimmed;
    if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return `#${trimmed}`;
    return fallback;
  }
  if (fill.mode === "solid") return isSafeCssColorString(fill.solid) ? fill.solid : fallback;
  if (fill.mode === "gradient") {
    const stopColor = fill.gradient?.stops?.[0]?.color;
    return stopColor && isSafeCssColorString(stopColor) ? stopColor : fallback;
  }
  if (fill.mode === "texture") {
    return fill.texture?.baseColor && isSafeCssColorString(fill.texture.baseColor)
      ? fill.texture.baseColor
      : fallback;
  }
  if (fill.mode === "image") {
    const candidate = fill.image?.tintColor || fill.solid;
    return candidate && isSafeCssColorString(candidate) ? candidate : fallback;
  }
  return fallback;
}

// Helper to compile fill to Text (Typography) style with backgroundClip: text
export type TypographyConfig = {
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: "normal" | "italic" | string;
  textDecoration?: "none" | "underline" | string;
  textTransform?: "uppercase" | "capitalize" | "lowercase" | "none" | string;
  letterSpacing?: string;
  fontSize?: string;
  textShadow?: string;
};

// 12 Classic Microsoft Word Font Families
export const MS_WORD_FONTS = [
  { id: "times", name: "Times New Roman", value: "'Times New Roman', Times, serif", category: "Serif (Official Academic)" },
  { id: "calibri", name: "Calibri", value: "Calibri, Candara, sans-serif", category: "Sans-Serif (Default Body)" },
  { id: "cambria", name: "Cambria", value: "Cambria, Georgia, serif", category: "Serif (Default Headings)" },
  { id: "arial", name: "Arial", value: "Arial, Helvetica, sans-serif", category: "Sans-Serif (Clean Standard)" },
  { id: "georgia", name: "Georgia", value: "Georgia, 'Times New Roman', serif", category: "Serif (High Legibility)" },
  { id: "garamond", name: "Garamond", value: "Garamond, 'Baskerville', serif", category: "Serif (Classic Heritage)" },
  { id: "century", name: "Century Gothic", value: "'Century Gothic', sans-serif", category: "Sans-Serif (Geometric Modern)" },
  { id: "trebuchet", name: "Trebuchet MS", value: "'Trebuchet MS', sans-serif", category: "Sans-Serif (Dynamic Accent)" },
  { id: "impact", name: "Impact", value: "Impact, Charcoal, sans-serif", category: "Display (Bold Poster)" },
  { id: "segoe", name: "Segoe UI", value: "'Segoe UI', Tahoma, sans-serif", category: "Sans-Serif (Modern Office)" },
  { id: "verdana", name: "Verdana", value: "Verdana, Geneva, sans-serif", category: "Sans-Serif (Screen Legible)" },
  { id: "antiqua", name: "Book Antiqua", value: "'Book Antiqua', Palatino, serif", category: "Serif (Historic Document)" },
];

// MS Word Quick Style Presets (WordArt & Microsoft Word Styles Gallery)
export type MsWordPreset = {
  id: string;
  name: string;
  nameUrdu: string;
  fontFamily: string;
  fontWeight: string;
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
  textTransform: "uppercase" | "capitalize" | "lowercase" | "none";
  letterSpacing: string;
  fontSize: string;
  textShadow: string;
  color: FillConfig | string;
};

export const MS_WORD_PRESETS: MsWordPreset[] = [
  {
    id: "word-title-cambria",
    name: "Word Title (Cambria)",
    nameUrdu: "ورڈ ٹائٹل (کیمبریا)",
    fontFamily: "Cambria, Georgia, serif",
    fontWeight: "700",
    fontStyle: "normal",
    textDecoration: "none",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontSize: "13px",
    textShadow: "none",
    color: "#1e3a8a",
  },
  {
    id: "word-official-times",
    name: "Official Gazette (Times New Roman)",
    nameUrdu: "سرکاری دستاویز (ٹائمز رومن)",
    fontFamily: "'Times New Roman', Times, serif",
    fontWeight: "700",
    fontStyle: "normal",
    textDecoration: "none",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "13px",
    textShadow: "none",
    color: "#0f172a",
  },
  {
    id: "word-calibri-modern",
    name: "Calibri Modern (Heading 1)",
    nameUrdu: "کیلیبری ماڈرن ایکسنٹ",
    fontFamily: "Calibri, Candara, sans-serif",
    fontWeight: "600",
    fontStyle: "normal",
    textDecoration: "none",
    textTransform: "capitalize",
    letterSpacing: "0.03em",
    fontSize: "13px",
    textShadow: "none",
    color: "#2563eb",
  },
  {
    id: "wordart-gold-shadow",
    name: "WordArt Royal Gold (3D Glow)",
    nameUrdu: "ورڈ آرٹ گولڈ گلو",
    fontFamily: "Georgia, serif",
    fontWeight: "800",
    fontStyle: "italic",
    textDecoration: "none",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "13px",
    textShadow: "0 2px 8px rgba(217, 119, 6, 0.45)",
    color: "#d97706",
  },
  {
    id: "word-intense-crimson",
    name: "Intense Emphasis (Crimson)",
    nameUrdu: "شدید تاکید (سرخ)",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: "800",
    fontStyle: "normal",
    textDecoration: "none",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontSize: "13px",
    textShadow: "none",
    color: "#991b1b",
  },
  {
    id: "word-executive-gothic",
    name: "Century Gothic Executive",
    nameUrdu: "سینچری گوتھک ایگزیکٹو",
    fontFamily: "'Century Gothic', sans-serif",
    fontWeight: "700",
    fontStyle: "normal",
    textDecoration: "none",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    textShadow: "none",
    color: "#0c1e3d",
  },
  {
    id: "word-heritage-garamond",
    name: "Heritage Antiqua (Garamond)",
    nameUrdu: "کلاسک ہیریٹیج (گیرامونڈ)",
    fontFamily: "Garamond, 'Baskerville', serif",
    fontWeight: "600",
    fontStyle: "italic",
    textDecoration: "none",
    textTransform: "capitalize",
    letterSpacing: "0.04em",
    fontSize: "13px",
    textShadow: "none",
    color: "#334155",
  },
  {
    id: "word-academic-emerald",
    name: "Academic Emerald (Trebuchet)",
    nameUrdu: "اکیڈمک زمرد (ٹریبوچیٹ)",
    fontFamily: "'Trebuchet MS', sans-serif",
    fontWeight: "700",
    fontStyle: "normal",
    textDecoration: "none",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontSize: "13px",
    textShadow: "none",
    color: "#065f46",
  },
  {
    id: "wordart-rainbow-gradient",
    name: "WordArt Rainbow Foil",
    nameUrdu: "ورڈ آرٹ رینبو گریڈینٹ",
    fontFamily: "Impact, sans-serif",
    fontWeight: "900",
    fontStyle: "normal",
    textDecoration: "none",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontSize: "14px",
    textShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
    color: {
      mode: "gradient",
      solid: "#991b1b",
      gradient: {
        type: "linear",
        angle: 90,
        stops: [
          { color: "#991b1b", position: 0 },
          { color: "#d97706", position: 35 },
          { color: "#059669", position: 70 },
          { color: "#2563eb", position: 100 },
        ],
      },
      texture: { type: "canvas", baseColor: "#991b1b", patternColor: "#ffffff", scale: 20, opacity: 20 },
      image: { url: "", fit: "cover", position: "center", tintColor: "#000000", tintOpacity: 0 },
    },
  },
  {
    id: "word-subtle-emphasis",
    name: "Subtle Emphasis (Slate Gray)",
    nameUrdu: "ہلکا سرمئی اسٹائل",
    fontFamily: "Calibri, sans-serif",
    fontWeight: "500",
    fontStyle: "italic",
    textDecoration: "none",
    textTransform: "capitalize",
    letterSpacing: "0.02em",
    fontSize: "12px",
    textShadow: "none",
    color: "#64748b",
  },
];

// MS Word Office Palette Swatches
export const MS_WORD_COLOR_PALETTE = [
  { name: "Black", hex: "#000000" },
  { name: "Dark Navy", hex: "#0f172a" },
  { name: "Word Blue", hex: "#1e3a8a" },
  { name: "Accent Blue", hex: "#2563eb" },
  { name: "Light Blue", hex: "#38bdf8" },
  { name: "Emerald", hex: "#059669" },
  { name: "Forest Green", hex: "#065f46" },
  { name: "Amber Gold", hex: "#d97706" },
  { name: "Warm Gold", hex: "#fbbf24" },
  { name: "Crimson Red", hex: "#dc2626" },
  { name: "Dark Red", hex: "#991b1b" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Indigo", hex: "#4338ca" },
  { name: "Slate Gray", hex: "#475569" },
  { name: "White", hex: "#ffffff" },
];

export function compileFillToTextStyle(
  fill: FillConfig | string | null | undefined,
  defaultSolid = "#0f172a",
  typography?: TypographyConfig
): React.CSSProperties {
  const conf = normalizeFillConfig(fill, defaultSolid);

  const typoStyles: React.CSSProperties = {
    fontFamily: typography?.fontFamily && typography.fontFamily !== "inherit" ? typography.fontFamily : undefined,
    fontWeight: typography?.fontWeight ? (typography.fontWeight as any) : undefined,
    fontStyle: typography?.fontStyle ? (typography.fontStyle as any) : undefined,
    textDecoration: typography?.textDecoration ? (typography.textDecoration as any) : undefined,
    textTransform: typography?.textTransform ? (typography.textTransform as any) : undefined,
    letterSpacing: typography?.letterSpacing ? typography.letterSpacing : undefined,
    fontSize: typography?.fontSize ? typography.fontSize : undefined,
    textShadow: typography?.textShadow && typography.textShadow !== "none" ? typography.textShadow : undefined,
  };

  if (conf.mode === "solid") {
    return {
      color: conf.solid || defaultSolid,
      ...typoStyles,
    };
  }

  const baseStyle = compileFillToStyle(conf, defaultSolid);

  if (baseStyle.backgroundImage && baseStyle.backgroundImage !== "none") {
    return {
      backgroundImage: baseStyle.backgroundImage,
      backgroundSize: baseStyle.backgroundSize || "cover",
      backgroundPosition: baseStyle.backgroundPosition || "center",
      backgroundRepeat: baseStyle.backgroundRepeat || "repeat",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
      display: "inline-block",
      ...typoStyles,
    };
  }

  return {
    color: conf.solid || defaultSolid,
    ...typoStyles,
  };
}

// Built-in CorelDRAW Sample Pictures Gallery (Self-contained high-res SVG vectors)
export type SamplePicture = {
  id: string;
  name: string;
  category: string;
  url: string;
};

export const COREL_SAMPLE_PICTURES: SamplePicture[] = [
  {
    id: "gpgcq-campus-banner",
    name: "GPGCQ Quetta Campus Official Panoramic",
    category: "Institutional",
    url: "/gpgcq-campus-banner.jpg",
  },
  {
    id: "gpgcq-building-clean",
    name: "GPGCQ Quetta Main Academic Block",
    category: "Institutional",
    url: "/gpgcq-building-clean.jpg",
  },
  {
    id: "gold-foil",
    name: "Luxury Gold Foil",
    category: "Metallic",
    url:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#78350f"/>
            <stop offset="25%" stop-color="#b45309"/>
            <stop offset="45%" stop-color="#fef08a"/>
            <stop offset="55%" stop-color="#fbbf24"/>
            <stop offset="75%" stop-color="#d97706"/>
            <stop offset="100%" stop-color="#451a03"/>
          </linearGradient>
          <radialGradient id="r" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fff" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#000" stop-opacity="0.4"/>
          </radialGradient>
        </defs>
        <rect width="600" height="400" fill="url(#g)"/>
        <rect width="600" height="400" fill="url(#r)"/>
      </svg>
    `),
  },
  {
    id: "navy-polygon",
    name: "Navy Geometric Low-Poly",
    category: "Academic",
    url:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <linearGradient id="ng" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617"/>
            <stop offset="50%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e3a8a"/>
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill="url(#ng)"/>
        <polygon points="0,0 200,80 150,220 0,180" fill="#1e3a8a" fill-opacity="0.25"/>
        <polygon points="200,80 400,20 350,180 150,220" fill="#3b82f6" fill-opacity="0.15"/>
        <polygon points="400,20 600,0 600,200 350,180" fill="#1d4ed8" fill-opacity="0.2"/>
        <polygon points="150,220 350,180 300,350 100,400" fill="#2563eb" fill-opacity="0.18"/>
        <polygon points="350,180 600,200 550,380 300,350" fill="#1e40af" fill-opacity="0.22"/>
        <polygon points="0,180 150,220 100,400 0,400" fill="#0f172a" fill-opacity="0.3"/>
        <polygon points="300,350 550,380 600,400 300,400" fill="#020617" fill-opacity="0.35"/>
      </svg>
    `),
  },
  {
    id: "quetta-arch",
    name: "Quetta Campus Landmark Arch",
    category: "Institutional",
    url:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <linearGradient id="qg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0b1329"/>
            <stop offset="60%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#334155"/>
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill="url(#qg)"/>
        <path d="M50,400 L50,220 C50,140 120,80 200,80 C280,80 350,140 350,220 L350,400 Z" fill="#020617" fill-opacity="0.4"/>
        <path d="M100,400 L100,240 C100,180 140,130 200,130 C260,130 300,180 300,240 L300,400 Z" fill="#0b1329" fill-opacity="0.6"/>
        <path d="M200,60 L200,80 M180,70 L220,70" stroke="#f59e0b" stroke-width="3" stroke-opacity="0.7"/>
        <circle cx="480" cy="90" r="30" fill="#fef08a" fill-opacity="0.25"/>
        <path d="M0,380 L600,380" stroke="#f59e0b" stroke-width="2" stroke-opacity="0.4"/>
      </svg>
    `),
  },
  {
    id: "royal-velvet-waves",
    name: "Royal Velvet & Crimson Waves",
    category: "Luxury",
    url:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <linearGradient id="vg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#450a0a"/>
            <stop offset="50%" stop-color="#881337"/>
            <stop offset="100%" stop-color="#1c0404"/>
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill="url(#vg)"/>
        <path d="M0,180 Q150,80 300,200 T600,160 L600,400 L0,400 Z" fill="#be123c" fill-opacity="0.2"/>
        <path d="M0,240 Q180,120 360,260 T600,220 L600,400 L0,400 Z" fill="#e11d48" fill-opacity="0.18"/>
        <path d="M0,200 Q200,100 400,240 T600,180" fill="none" stroke="#fbbf24" stroke-width="2" stroke-opacity="0.4"/>
      </svg>
    `),
  },
  {
    id: "guilloche-security",
    name: "Guilloche Security Certificate",
    category: "Diploma",
    url:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#022c22"/>
            <stop offset="50%" stop-color="#064e3b"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill="url(#gg)"/>
        <g stroke="#10b981" stroke-width="1" stroke-opacity="0.2" fill="none">
          <ellipse cx="300" cy="200" rx="260" ry="160"/>
          <ellipse cx="300" cy="200" rx="240" ry="140"/>
          <ellipse cx="300" cy="200" rx="220" ry="120"/>
          <ellipse cx="300" cy="200" rx="200" ry="100"/>
          <ellipse cx="300" cy="200" rx="180" ry="80"/>
        </g>
        <g stroke="#f59e0b" stroke-width="0.8" stroke-opacity="0.2" fill="none">
          <circle cx="300" cy="200" r="90"/>
          <circle cx="300" cy="200" r="70"/>
        </g>
      </svg>
    `),
  },
  {
    id: "tech-circuit",
    name: "Dark Tech Cyber Circuit",
    category: "Computer Science",
    url:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill="url(#cg)"/>
        <g stroke="#06b6d4" stroke-width="1.5" stroke-opacity="0.3" fill="none">
          <path d="M40,60 L140,60 L200,120 L320,120 M200,120 L200,240 L280,320 L440,320"/>
          <path d="M600,80 L480,80 L420,140 L350,140 M420,140 L420,260 L360,320 L200,320"/>
          <circle cx="40" cy="60" r="3" fill="#06b6d4" fill-opacity="0.5"/>
          <circle cx="320" cy="120" r="3" fill="#06b6d4" fill-opacity="0.5"/>
          <circle cx="440" cy="320" r="3" fill="#06b6d4" fill-opacity="0.5"/>
          <circle cx="600" cy="80" r="3" fill="#06b6d4" fill-opacity="0.5"/>
        </g>
      </svg>
    `),
  },
];
