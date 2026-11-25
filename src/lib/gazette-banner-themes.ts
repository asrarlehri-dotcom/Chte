import {
  FillConfig,
  compileFillToStyle,
  isLightColor,
  getRepresentativeColor,
  normalizeFillConfig,
} from "./theme-fill-compiler";

export type GazetteBannerTextMode = "auto" | "light" | "dark";

export type GazetteBannerConfigEntry = {
  fill: FillConfig | string;
  textMode?: GazetteBannerTextMode;
  scrimOpacity?: number; // 0 to 80% dark overlay behind text for photo readability
};

export type GazetteBannerConfigMap = Record<string, GazetteBannerConfigEntry>;

export interface SubjectBannerPreset {
  id: string;
  label: string;
  labelUrdu: string;
  icon: string;
  keywords: string[];
  accentHex: string;
  bgStart: string;
  bgEnd: string;
  fill: FillConfig;
}

function encodeSvgDataUri(svg: string): string {
  const cleaned = svg.replace(/\s+/g, " ").trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}

function buildSubjectBannerDataUrl(
  bgStart: string,
  bgMid: string,
  bgEnd: string,
  accentColor: string,
  motifSvg: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="55%" stop-color="${bgMid}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </linearGradient>
      <radialGradient id="glow" cx="82%" cy="45%" r="48%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.30" />
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="leftScrim" x1="0%" y1="0%" x2="65%" y2="0%">
        <stop offset="0%" stop-color="${bgStart}" stop-opacity="0.88" />
        <stop offset="100%" stop-color="${bgStart}" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect width="1200" height="200" fill="url(#g)" />
    <rect width="1200" height="200" fill="url(#glow)" />
    <g opacity="0.95">${motifSvg}</g>
    <rect width="780" height="200" fill="url(#leftScrim)" />
  </svg>`;
  return encodeSvgDataUri(svg);
}

const RAW_SUBJECT_SPECS: Array<{
  id: string;
  label: string;
  labelUrdu: string;
  icon: string;
  keywords: string[];
  accentHex: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  motifSvg: string;
}> = [
  {
    id: "math",
    label: "Mathematics",
    labelUrdu: "ریاضی (فارمولے اور جیومیٹری)",
    icon: "∑",
    keywords: ["math", "mathematics", "statistics", "stat"],
    accentHex: "#f59e0b",
    bgStart: "#451a03",
    bgMid: "#0f172a",
    bgEnd: "#070b14",
    motifSvg: `
      <g stroke="#fbbf24" stroke-opacity="0.22" fill="none" stroke-width="1.6">
        <path d="M560 0 V200 M620 0 V200 M680 0 V200 M740 0 V200 M800 0 V200 M860 0 V200 M920 0 V200 M980 0 V200 M1040 0 V200 M1100 0 V200 M1160 0 V200" stroke-opacity="0.08"/>
        <path d="M560 40 H1200 M560 80 H1200 M560 120 H1200 M560 160 H1200" stroke-opacity="0.08"/>
        <path d="M580 155 Q710 20 840 155 T1100 155" stroke-width="2.4" stroke-opacity="0.32"/>
        <polygon points="940,165 1045,35 1135,165" stroke-width="2" stroke-opacity="0.28"/>
        <circle cx="820" cy="95" r="52" stroke-dasharray="6 5" stroke-opacity="0.25"/>
      </g>
      <g fill="#fde68a" fill-opacity="0.22" font-family="Georgia, serif" font-weight="bold">
        <text x="640" y="72" font-size="38">∑</text>
        <text x="720" y="152" font-size="34">∫ f(x) dx</text>
        <text x="895" y="64" font-size="32">π ≈ 3.1416</text>
        <text x="1010" y="135" font-size="30">√(a² + b²)</text>
        <text x="1125" y="78" font-size="34">∞</text>
        <text x="580" y="112" font-size="24">sin θ + cos θ</text>
        <text x="860" y="178" font-size="22">Δy / Δx</text>
      </g>`,
  },
  {
    id: "computer",
    label: "Computer Science",
    labelUrdu: "کمپیوٹر سائنس (کوڈنگ اور سرکٹ)",
    icon: "</>",
    keywords: ["computer", "software", "it", "information technology", "data", "ai"],
    accentHex: "#38bdf8",
    bgStart: "#091e3a",
    bgMid: "#0b132b",
    bgEnd: "#030712",
    motifSvg: `
      <g stroke="#38bdf8" stroke-opacity="0.24" fill="none" stroke-width="2">
        <path d="M620 45 H740 L775 80 H920"/>
        <path d="M670 145 H810 L845 110 H1020"/>
        <path d="M900 35 H1060 L1095 70 H1175"/>
        <circle cx="740" cy="45" r="5" fill="#38bdf8" fill-opacity="0.45"/>
        <circle cx="920" cy="80" r="6" fill="#38bdf8" fill-opacity="0.45"/>
        <circle cx="810" cy="145" r="5" fill="#38bdf8" fill-opacity="0.45"/>
        <circle cx="1020" cy="110" r="6" fill="#38bdf8" fill-opacity="0.45"/>
        <rect x="1030" y="40" width="90" height="90" rx="14" stroke-opacity="0.28"/>
        <rect x="1050" y="60" width="50" height="50" rx="8" stroke-opacity="0.35"/>
      </g>
      <g fill="#bae6fd" fill-opacity="0.22" font-family="monospace" font-weight="bold">
        <text x="640" y="96" font-size="26">&lt;/code&gt;</text>
        <text x="820" y="55" font-size="20">01001101 1010</text>
        <text x="740" y="176" font-size="22">{ algorithm: O(n) }</text>
        <text x="1058" y="92" font-size="20">CPU</text>
      </g>`,
  },
  {
    id: "chem",
    label: "Chemistry",
    labelUrdu: "کیمسٹری (مالیکیولز اور لیب)",
    icon: "⚗",
    keywords: ["chem", "chemistry", "biochem"],
    accentHex: "#fbbf24",
    bgStart: "#3b1d06",
    bgMid: "#111827",
    bgEnd: "#070b14",
    motifSvg: `
      <g stroke="#fbbf24" stroke-opacity="0.26" fill="none" stroke-width="2.2">
        <polygon points="820,45 860,68 860,114 820,137 780,114 780,68"/>
        <circle cx="820" cy="91" r="22" stroke-dasharray="5 4"/>
        <polygon points="900,91 940,114 940,160 900,183 860,160 860,114"/>
        <path d="M1045 35 V80 L1005 155 C1000 165 1007 175 1018 175 H1112 C1123 175 1130 165 1125 155 L1085 80 V35 Z"/>
        <line x1="1035" y1="35" x2="1095" y2="35"/>
        <line x1="1020" y1="138" x2="1110" y2="138" stroke-opacity="0.35"/>
        <circle cx="1055" cy="116" r="5" fill="#fde68a" fill-opacity="0.35"/>
        <circle cx="1078" cy="102" r="4" fill="#fde68a" fill-opacity="0.35"/>
      </g>
      <g fill="#fde68a" fill-opacity="0.22" font-family="sans-serif" font-weight="bold">
        <text x="640" y="75" font-size="26">H₂O • C₆H₆</text>
        <text x="685" y="155" font-size="22">NaCl + H₂SO₄</text>
      </g>`,
  },
  {
    id: "physic",
    label: "Physics",
    labelUrdu: "فزکس (ایٹم اور لہریں)",
    icon: "⚛",
    keywords: ["physic", "physics", "applied physics"],
    accentHex: "#818cf8",
    bgStart: "#1e1b4b",
    bgMid: "#0f172a",
    bgEnd: "#030712",
    motifSvg: `
      <g stroke="#a5b4fc" stroke-opacity="0.28" fill="none" stroke-width="2">
        <ellipse cx="995" cy="100" rx="88" ry="30" transform="rotate(30 995 100)"/>
        <ellipse cx="995" cy="100" rx="88" ry="30" transform="rotate(-30 995 100)"/>
        <ellipse cx="995" cy="100" rx="88" ry="30" transform="rotate(90 995 100)"/>
        <circle cx="995" cy="100" r="10" fill="#a5b4fc" fill-opacity="0.45"/>
        <path d="M580 120 Q630 55 680 120 T780 120 T880 120" stroke-width="2.2" stroke-opacity="0.24"/>
      </g>
      <g fill="#c7d2fe" fill-opacity="0.22" font-family="Georgia, serif" font-weight="bold">
        <text x="630" y="64" font-size="26">E = mc²</text>
        <text x="770" y="168" font-size="24">λ = h / p • Ω</text>
      </g>`,
  },
  {
    id: "bio",
    label: "Biology / Botany / Zoology",
    labelUrdu: "بائیولوجی / باٹنی / زولوجی",
    icon: "🧬",
    keywords: ["zoolo", "botan", "biolog", "micro", "genetic", "life"],
    accentHex: "#34d399",
    bgStart: "#064e3b",
    bgMid: "#0f172a",
    bgEnd: "#030712",
    motifSvg: `
      <g stroke="#6ee7b7" stroke-opacity="0.26" fill="none" stroke-width="2.2">
        <path d="M760 25 C810 75 760 125 810 175"/>
        <path d="M810 25 C760 75 810 125 760 175"/>
        <line x1="772" y1="50" x2="798" y2="50"/>
        <line x1="772" y1="100" x2="798" y2="100"/>
        <line x1="772" y1="150" x2="798" y2="150"/>
        <path d="M980 160 C980 75 1070 40 1125 38 C1120 105 1065 155 980 160 Z" fill="#34d399" fill-opacity="0.08"/>
        <line x1="980" y1="160" x2="1115" y2="48" stroke-opacity="0.32"/>
        <circle cx="910" cy="85" r="34" stroke-dasharray="4 4"/>
        <circle cx="910" cy="85" r="12" fill="#6ee7b7" fill-opacity="0.22"/>
      </g>`,
  },
  {
    id: "econ",
    label: "Economics & Commerce",
    labelUrdu: "اکنامکس اور کامرس (گراف)",
    icon: "📈",
    keywords: ["econ", "commerce", "business", "finance", "bba", "accounting"],
    accentHex: "#fb923c",
    bgStart: "#431407",
    bgMid: "#111827",
    bgEnd: "#070b14",
    motifSvg: `
      <g stroke="#fdba74" stroke-opacity="0.25" fill="none" stroke-width="2">
        <rect x="780" y="120" width="22" height="55" rx="3" fill="#fb923c" fill-opacity="0.16"/>
        <rect x="822" y="95" width="22" height="80" rx="3" fill="#fb923c" fill-opacity="0.20"/>
        <rect x="864" y="75" width="22" height="100" rx="3" fill="#fb923c" fill-opacity="0.24"/>
        <rect x="906" y="48" width="22" height="127" rx="3" fill="#fb923c" fill-opacity="0.28"/>
        <polyline points="750,150 825,112 880,124 955,55 1045,70 1125,28" stroke-width="2.8" stroke-opacity="0.35"/>
        <circle cx="1125" cy="28" r="6" fill="#fdba74" fill-opacity="0.45"/>
      </g>
      <g fill="#fed7aa" fill-opacity="0.2" font-family="sans-serif" font-weight="bold">
        <text x="1000" y="150" font-size="28">GDP • %</text>
      </g>`,
  },
  {
    id: "islam",
    label: "Islamic Studies",
    labelUrdu: "اسلامیات (جیومیٹرک نقش و نگار)",
    icon: "☪",
    keywords: ["islam", "islamic", "arabic"],
    accentHex: "#10b981",
    bgStart: "#064e3b",
    bgMid: "#062c22",
    bgEnd: "#020d0a",
    motifSvg: `
      <g stroke="#6ee7b7" stroke-opacity="0.24" fill="none" stroke-width="1.8">
        <rect x="945" y="45" width="90" height="90" transform="rotate(45 990 90)"/>
        <rect x="945" y="45" width="90" height="90"/>
        <circle cx="990" cy="90" r="68" stroke-dasharray="5 4"/>
        <circle cx="990" cy="90" r="24"/>
        <rect x="765" y="55" width="60" height="60" transform="rotate(45 795 85)"/>
        <rect x="765" y="55" width="60" height="60"/>
      </g>`,
  },
  {
    id: "english",
    label: "English & Literature",
    labelUrdu: "انگلش اور ادب (کتاب و قلم)",
    icon: "📖",
    keywords: ["english", "literature", "urdu", "languages"],
    accentHex: "#cbd5e1",
    bgStart: "#1e293b",
    bgMid: "#0f172a",
    bgEnd: "#020617",
    motifSvg: `
      <g stroke="#e2e8f0" stroke-opacity="0.22" fill="none" stroke-width="2">
        <path d="M840 150 C880 132 940 132 975 152 V52 C940 35 880 35 840 52 Z" fill="#ffffff" fill-opacity="0.05"/>
        <path d="M1110 150 C1070 132 1010 132 975 152 V52 C1010 35 1070 35 1110 52 Z" fill="#ffffff" fill-opacity="0.05"/>
        <line x1="862" y1="80" x2="950" y2="80" stroke-opacity="0.18"/>
        <line x1="862" y1="102" x2="950" y2="102" stroke-opacity="0.18"/>
        <line x1="1000" y1="80" x2="1088" y2="80" stroke-opacity="0.18"/>
        <line x1="1000" y1="102" x2="1088" y2="102" stroke-opacity="0.18"/>
      </g>
      <g fill="#f1f5f9" fill-opacity="0.16" font-family="Georgia, serif" font-style="italic" font-weight="bold">
        <text x="640" y="98" font-size="34">Aa Bb &amp; Poetry</text>
      </g>`,
  },
  {
    id: "education",
    label: "Education",
    labelUrdu: "ایجوکیشن (تدریس و ڈگری)",
    icon: "🎓",
    keywords: ["education", "pedagogy"],
    accentHex: "#38bdf8",
    bgStart: "#0c4a6e",
    bgMid: "#0f172a",
    bgEnd: "#030712",
    motifSvg: `
      <g stroke="#7dd3fc" stroke-opacity="0.26" fill="none" stroke-width="2.2">
        <polygon points="990,42 1095,82 990,122 885,82" fill="#38bdf8" fill-opacity="0.10"/>
        <path d="M925 98 V142 C925 158 1055 158 1055 142 V98"/>
        <line x1="1095" y1="82" x2="1095" y2="145"/>
        <circle cx="1095" cy="150" r="5" fill="#7dd3fc" fill-opacity="0.4"/>
      </g>`,
  },
  {
    id: "geograph",
    label: "Geography & Earth",
    labelUrdu: "جغرافیہ (گلوب اور نقشہ)",
    icon: "🌍",
    keywords: ["geograph", "geology", "environment"],
    accentHex: "#2dd4bf",
    bgStart: "#134e4a",
    bgMid: "#0f172a",
    bgEnd: "#030712",
    motifSvg: `
      <g stroke="#5eead4" stroke-opacity="0.24" fill="none" stroke-width="1.8">
        <circle cx="995" cy="100" r="76"/>
        <ellipse cx="995" cy="100" rx="34" ry="76"/>
        <ellipse cx="995" cy="100" rx="76" ry="26"/>
        <line x1="919" y1="100" x2="1071" y2="100"/>
        <path d="M700 165 L755 95 L800 140 L845 78 L905 165" stroke-opacity="0.26"/>
      </g>`,
  },
  {
    id: "politic",
    label: "Political Science & Sociology",
    labelUrdu: "سیاسیات اور عمرانیات",
    icon: "⚖",
    keywords: ["politic", "sociolog", "law", "history", "ir", "international"],
    accentHex: "#60a5fa",
    bgStart: "#172554",
    bgMid: "#0f172a",
    bgEnd: "#020617",
    motifSvg: `
      <g stroke="#93c5fd" stroke-opacity="0.24" fill="none" stroke-width="2">
        <line x1="920" y1="55" x2="1080" y2="55"/>
        <line x1="1000" y1="35" x2="1000" y2="165"/>
        <line x1="965" y1="165" x2="1035" y2="165"/>
        <path d="M905 108 H955 L930 55 Z" fill="#60a5fa" fill-opacity="0.10"/>
        <path d="M1045 108 H1095 L1070 55 Z" fill="#60a5fa" fill-opacity="0.10"/>
      </g>`,
  },
  {
    id: "default",
    label: "General Academic",
    labelUrdu: "جنرل اکیڈمک بینر",
    icon: "🏛",
    keywords: [],
    accentHex: "#6366f1",
    bgStart: "#1e1b4b",
    bgMid: "#0f172a",
    bgEnd: "#020617",
    motifSvg: `
      <g stroke="#a5b4fc" stroke-opacity="0.2" fill="none" stroke-width="2">
        <path d="M620 180 Q820 50 1200 130"/>
        <path d="M740 190 Q950 20 1200 90" stroke-opacity="0.15"/>
        <circle cx="1035" cy="95" r="56" stroke-dasharray="6 5"/>
      </g>`,
  },
];

export const SUBJECT_BANNER_PRESETS: SubjectBannerPreset[] = RAW_SUBJECT_SPECS.map((spec) => ({
  id: spec.id,
  label: spec.label,
  labelUrdu: spec.labelUrdu,
  icon: spec.icon,
  keywords: spec.keywords,
  accentHex: spec.accentHex,
  bgStart: spec.bgStart,
  bgEnd: spec.bgEnd,
  fill: {
    mode: "image",
    solid: spec.bgStart,
    gradient: {
      type: "linear",
      angle: 135,
      stops: [
        { color: spec.bgStart, position: 0 },
        { color: spec.bgEnd, position: 100 },
      ],
    },
    texture: {
      type: "grid",
      baseColor: spec.bgStart,
      patternColor: spec.accentHex,
      scale: 28,
      opacity: 20,
    },
    image: {
      url: buildSubjectBannerDataUrl(spec.bgStart, spec.bgMid, spec.bgEnd, spec.accentHex, spec.motifSvg),
      fit: "cover",
      position: "center",
      tintColor: "#000000",
      tintOpacity: 0,
      opacity: 100,
      zoom: 100,
      focalPoint: { x: 50, y: 50 },
      scaleMode: "both",
    },
  },
}));

/** Finds the matching built-in subject artwork preset for a degree program name */
export function getSubjectBannerPreset(programName: string): SubjectBannerPreset {
  const normalized = (programName || "").toLowerCase();
  for (const preset of SUBJECT_BANNER_PRESETS) {
    if (preset.keywords.some((kw) => normalized.includes(kw))) {
      return preset;
    }
  }
  return SUBJECT_BANNER_PRESETS[SUBJECT_BANNER_PRESETS.length - 1];
}

/** Resolves effective Gazette banner configuration: Program override > Global override > Subject default artwork */
export function resolveGazetteBannerConfig(
  configMap: GazetteBannerConfigMap | null | undefined,
  programId: string,
  programName: string
): {
  entry: GazetteBannerConfigEntry;
  source: "PROGRAM" | "GLOBAL" | "SUBJECT_DEFAULT";
  bgStyle: React.CSSProperties;
  useDarkText: boolean;
  scrimOpacity: number;
} {
  const defaultPreset = getSubjectBannerPreset(programName);
  let entry: GazetteBannerConfigEntry;
  let source: "PROGRAM" | "GLOBAL" | "SUBJECT_DEFAULT";

  if (configMap && programId && configMap[programId]?.fill) {
    entry = configMap[programId];
    source = "PROGRAM";
  } else if (configMap && configMap.__GLOBAL__?.fill) {
    entry = configMap.__GLOBAL__;
    source = "GLOBAL";
  } else {
    entry = { fill: defaultPreset.fill, textMode: "auto", scrimOpacity: 0 };
    source = "SUBJECT_DEFAULT";
  }

  const normalized = normalizeFillConfig(entry.fill, defaultPreset.bgStart);
  const bgStyle = compileFillToStyle(normalized, defaultPreset.bgStart);

  const scrimOpacity =
    typeof entry.scrimOpacity === "number"
      ? Math.max(0, Math.min(85, entry.scrimOpacity))
      : source !== "SUBJECT_DEFAULT" && normalized.mode === "image"
        ? 35
        : 0;

  let useDarkText = false;
  if (entry.textMode === "dark") {
    useDarkText = true;
  } else if (entry.textMode === "light") {
    useDarkText = false;
  } else {
    // Auto contrast check based on solid/gradient/texture base luminance
    if (normalized.mode !== "image") {
      const repColor = getRepresentativeColor(normalized, defaultPreset.bgStart);
      useDarkText = isLightColor(repColor);
    } else {
      useDarkText = false;
    }
  }

  return { entry, source, bgStyle, useDarkText, scrimOpacity };
}

/** Returns linear dark readability scrim style for image-backed Gazette section headers */
export function buildGazetteScrimStyle(scrimOpacity: number): React.CSSProperties {
  const op = Math.max(0, Math.min(85, scrimOpacity || 0));
  return {
    background: `linear-gradient(90deg, rgba(2,6,23,${(op / 100).toFixed(2)}) 0%, rgba(2,6,23,${((op * 0.65) / 100).toFixed(2)}) 65%, rgba(2,6,23,${((op * 0.4) / 100).toFixed(2)}) 100%)`,
  };
}

/** Parses saved JSON string for BS Gazette banners safely */
export function parseGazetteBannersSetting(raw: string | undefined | null): GazetteBannerConfigMap {
  if (!raw || typeof raw !== "string") return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as GazetteBannerConfigMap;
    }
  } catch {
    // Ignore malformed legacy values
  }
  return {};
}
