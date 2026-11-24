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

export type TextureType = "canvas" | "grid" | "stripes" | "mesh" | "dots" | "paper";

export type TextureConfig = {
  type: TextureType;
  baseColor: string;
  patternColor: string;
  scale: number; // 10px to 80px
  opacity: number; // 5 to 100%
};

export type ImageFitMode = "cover" | "contain" | "repeat" | "stretch";
export type ImagePosition = "center" | "top" | "bottom" | "left" | "right";

export type ImageConfig = {
  url: string;
  fit: ImageFitMode;
  position: ImagePosition;
  tintColor: string;
  tintOpacity: number; // 0 to 95%
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
      tintOpacity: 25,
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
      } catch {}
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

    const image: ImageConfig = {
      url: typeof input.image?.url === "string" ? input.image.url : "",
      fit: ["cover", "contain", "repeat", "stretch"].includes(input.image?.fit) ? input.image.fit : "cover",
      position: ["center", "top", "bottom", "left", "right"].includes(input.image?.position)
        ? input.image.position
        : "center",
      tintColor: typeof input.image?.tintColor === "string" ? input.image.tintColor : "#000000",
      tintOpacity: typeof input.image?.tintOpacity === "number"
        ? Math.max(0, Math.min(95, input.image.tintOpacity))
        : 25,
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
      const tintLayer = conf.image.tintOpacity > 0 ? `linear-gradient(rgba(${r},${g},${b},${alpha}), rgba(${r},${g},${b},${alpha})), ` : "";

      let backgroundSize = "cover";
      let backgroundRepeat = "no-repeat";

      if (conf.image.fit === "contain") {
        backgroundSize = "contain";
      } else if (conf.image.fit === "repeat") {
        backgroundSize = "auto";
        backgroundRepeat = "repeat";
      } else if (conf.image.fit === "stretch") {
        backgroundSize = "100% 100%";
      }

      return {
        backgroundColor: conf.image.tintColor || defaultSolid,
        backgroundImage: `${tintLayer}url("${conf.image.url}")`,
        backgroundSize,
        backgroundRepeat,
        backgroundPosition: conf.image.position,
      };
    }

    case "solid":
    default:
      return {
        backgroundColor: conf.solid || defaultSolid,
      };
  }
}

// Quick helper to extract single representative color for text contrast or borders
export function getRepresentativeColor(
  fill: FillConfig | string | null | undefined,
  fallback = "#000000"
): string {
  if (!fill) return fallback;
  if (typeof fill === "string") return fill;
  if (fill.mode === "solid") return fill.solid || fallback;
  if (fill.mode === "gradient") return fill.gradient.stops[0]?.color || fallback;
  if (fill.mode === "texture") return fill.texture.baseColor || fallback;
  if (fill.mode === "image") return fill.image.tintColor || fill.solid || fallback;
  return fallback;
}
