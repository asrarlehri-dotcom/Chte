const pptxgen = require("pptxgenjs");
const jszip = require("jszip");
const path = require("path");
const fs = require("fs");

async function generateMasterPresentation() {
  console.log("Starting End-to-End Master Presentation generation (Main HEMIS Portal to Campus ERP)...");

  const pres = new pptxgen();

  // Widescreen 16:9 Standard Dimensions (13.333" x 7.5")
  pres.defineLayout({ name: "WIDE_16_9", width: 13.333, height: 7.5 });
  pres.layout = "WIDE_16_9";

  pres.author = "Engr. Israr Ahmed - Lead Systems Specialist";
  pres.company = "Higher Education Management Information System (HEMIS) Balochistan";
  pres.title = "HEMIS Unified Higher Education Ecosystem - End-to-End Operational Manual";

  // Brand Palette
  const NAVY = "061229";
  const ACCENT_BLUE = "1D4ED8";
  const EMERALD = "0C5938";
  const EMERALD_LIGHT = "059669";
  const GOLD = "D97706";
  const TEXT_DARK = "0F172A";
  const TEXT_MUTED = "475569";
  const BG_LIGHT = "F8FAFC";
  const CARD_BG = "FFFFFF";
  const BORDER_COLOR = "E2E8F0";

  // Uploaded Screenshots & System Assets
  const UPLOAD_DIR = "C:/Users/Israr/.gemini/antigravity/brain/33e41e52-479a-4a1b-bec1-073a3bfad0dd/.user_uploaded";
  const PUBLIC_DIR = path.resolve("cms/public");

  const IMG_HEMIS_HOMEPAGE = path.join(PUBLIC_DIR, "homepage-design.png");
  const IMG_BALOCHISTAN_SEAL = path.join(PUBLIC_DIR, "balochistan-seal.png");

  const IMG_CENTRAL_DASH = path.join(UPLOAD_DIR, "media_1795020756568_6e8f6161.jpg");
  const IMG_PERMISSIONS = path.join(UPLOAD_DIR, "media_1795022235681_50b8c2be.jpg");
  const IMG_PUBLIC_PORTAL = path.join(UPLOAD_DIR, "media_1795026324494_375d9893.jpg");
  const IMG_CAMPUS_ERP = path.join(UPLOAD_DIR, "media_1795027168264_790dd2aa.jpg");
  const IMG_RESULT_WATERMARK = path.join(UPLOAD_DIR, "media_1795084134472_faa4bd2b.jpg");
  const IMG_THEME_SETTINGS = fs.existsSync(path.join(UPLOAD_DIR, "media_1795107222187_cd38e031.jpg"))
    ? path.join(UPLOAD_DIR, "media_1795107222187_cd38e031.jpg")
    : path.join(UPLOAD_DIR, "media_1794972764642_4a25dcaf.jpg");
  const IMG_STUDENTS_LIST = path.join(UPLOAD_DIR, "media_1795010042360_c290955c.jpg");
  const IMG_ACADEMIC_TIMETABLE = path.join(UPLOAD_DIR, "media_1794930252865_4ead1fe6.jpg");

  const TOTAL_SLIDES = 16;

  // Helper: Top Header & Bottom Footer (Strictly Bounded)
  function addSlideHeader(slide, titleEng, subtitleEng, slideNum) {
    // Top Bar Background (Full Width 13.333)
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 1.15,
      fill: { color: NAVY },
    });

    // Top Accent Stripe
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.08,
      fill: { color: EMERALD_LIGHT },
    });

    // Department Kicker
    slide.addText("GOVERNMENT OF BALOCHISTAN • HIGHER & TECHNICAL EDUCATION DEPARTMENT (HEMIS)", {
      x: 0.8,
      y: 0.16,
      w: 9.5,
      h: 0.22,
      fontSize: 9,
      fontFace: "Arial",
      bold: true,
      color: "93C5FD",
    });

    // Main English Title
    slide.addText(titleEng, {
      x: 0.8,
      y: 0.38,
      w: 9.6,
      h: 0.40,
      fontSize: 18,
      fontFace: "Arial",
      bold: true,
      color: "FFFFFF",
    });

    // Subtitle English
    slide.addText(subtitleEng, {
      x: 0.8,
      y: 0.80,
      w: 9.6,
      h: 0.24,
      fontSize: 11,
      fontFace: "Arial",
      bold: false,
      color: "FDE047",
    });

    // Slide Number Badge
    slide.addText(`STEP ${slideNum} / ${TOTAL_SLIDES}`, {
      x: 10.6,
      y: 0.42,
      w: 1.9,
      h: 0.32,
      fontSize: 10,
      fontFace: "Arial",
      bold: true,
      color: "94A3B8",
      align: "right",
    });

    // Bottom Footer
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 7.15,
      w: 13.333,
      h: 0.35,
      fill: { color: "F1F5F9" },
    });

    slide.addText("HEMIS End-to-End System Walkthrough • Main Portal to Campus ERP • Autonomous Governance", {
      x: 0.8,
      y: 7.22,
      w: 8.8,
      h: 0.22,
      fontSize: 8.5,
      fontFace: "Arial",
      color: TEXT_MUTED,
    });

    slide.addText("Official Institutional Training Document • Confidential", {
      x: 9.7,
      y: 7.22,
      w: 2.8,
      h: 0.22,
      fontSize: 8.5,
      fontFace: "Arial",
      color: TEXT_MUTED,
      align: "right",
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 1: Title & Executive Overview (Cover)
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: NAVY };

    // Decorative Left Stripes
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: 0.35,
      h: 7.5,
      fill: { color: EMERALD_LIGHT },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.35,
      y: 0,
      w: 0.15,
      h: 7.5,
      fill: { color: GOLD },
    });

    // Kicker & Badge
    slide.addText("GOVERNMENT OF BALOCHISTAN", {
      x: 1.2,
      y: 0.85,
      w: 10.5,
      h: 0.3,
      fontSize: 13,
      fontFace: "Arial",
      bold: true,
      color: "34D399",
      charSpacing: 3,
    });

    slide.addText("Higher & Technical Education Department (HEMIS)", {
      x: 1.2,
      y: 1.2,
      w: 10.5,
      h: 0.35,
      fontSize: 15,
      fontFace: "Arial",
      color: "CBD5E1",
    });

    // Main Heading
    slide.addText("UNIFIED HIGHER EDUCATION DIGITAL ECOSYSTEM", {
      x: 1.2,
      y: 1.75,
      w: 11.2,
      h: 1.35,
      fontSize: 30,
      fontFace: "Arial",
      bold: true,
      color: "FFFFFF",
    });

    // Subtitle
    slide.addText("Complete End-to-End System Walkthrough: From HEMIS Main Portal to Autonomous Campus ERP", {
      x: 1.2,
      y: 3.2,
      w: 11.2,
      h: 0.45,
      fontSize: 15.5,
      fontFace: "Arial",
      bold: true,
      color: "FDE047",
    });

    slide.addText("Provincial Gateway • Colleges Directory • Campus Portals • ERP Operations • Watermarked Results", {
      x: 1.2,
      y: 3.75,
      w: 10.5,
      h: 0.3,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: "93C5FD",
    });

    // 3 Workflow Journey Badges
    const badges = [
      {
        title: "Phase 1: Provincial Gateway",
        desc: "Main HEMIS Portal (HEMIS-edu.vercel.app), Central Directory, District Discovery & Directorate Governance.",
      },
      {
        title: "Phase 2: College Public Portals",
        desc: "Dedicated institutional websites (/colleges/[slug]), public admissions, announcements & datesheets.",
      },
      {
        title: "Phase 3: Autonomous Campus ERP",
        desc: "Principal Command Center, 3-part bank challans, conflict-free timetable, & anti-tamper result slips.",
      },
    ];

    badges.forEach((b, i) => {
      const bx = 1.2 + i * 3.75;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: bx,
        y: 4.4,
        w: 3.5,
        h: 1.45,
        r: 0.15,
        fill: { color: "1E293B" },
        line: { color: "334155", width: 1.5 },
      });

      slide.addText(b.title, {
        x: bx + 0.2,
        y: 4.55,
        w: 3.1,
        h: 0.35,
        fontSize: 12,
        fontFace: "Arial",
        bold: true,
        color: "FFFFFF",
      });

      slide.addText(b.desc, {
        x: bx + 0.2,
        y: 4.95,
        w: 3.1,
        h: 0.8,
        fontSize: 10,
        fontFace: "Arial",
        color: "CBD5E1",
      });
    });

    // Author & System Meta
    slide.addText(
      "Architect & Developer: Engr. Israr Ahmed (Computer Programmer & Systems Specialist, GPGC Quetta)\nBalochistan Higher & Technical Education Department • Live URL: https://HEMIS-edu.vercel.app",
      {
        x: 1.2,
        y: 6.3,
        w: 11.2,
        h: 0.55,
        fontSize: 10,
        fontFace: "Arial",
        color: "94A3B8",
      }
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 2: Level 1 — Main HEMIS Provincial Portal Homepage (/)
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 1: Main HEMIS Provincial Portal Homepage (Gateway)",
      "The unified digital front door for Higher Education in Balochistan (https://HEMIS-edu.vercel.app)",
      2
    );

    // Left Column: Homepage Design Showcase
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8,
      y: 1.35,
      w: 5.8,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("LIVE INTERFACE: HEMIS PROVINCIAL HOMEPAGE", {
      x: 1.0,
      y: 1.55,
      w: 5.4,
      h: 0.3,
      fontSize: 11,
      fontFace: "Arial",
      bold: true,
      color: EMERALD_LIGHT,
    });

    if (fs.existsSync(IMG_HEMIS_HOMEPAGE)) {
      slide.addImage({
        path: IMG_HEMIS_HOMEPAGE,
        x: 1.0,
        y: 1.95,
        w: 5.4,
        h: 2.75,
      });
    }

    slide.addText("Key Main Homepage Components:", {
      x: 1.0,
      y: 4.85,
      w: 5.4,
      h: 0.25,
      fontSize: 10.5,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const hpBullets = [
      "Official Balochistan Crest Header: Weather widget, search, and official Government notice ticker.",
      "Scenic Hero Banner: Showcases Balochistan natural heritage with dynamic educational vision description.",
      "Login by Institute: Dedicated pill button giving college faculty and principals instant ERP access.",
    ];

    hpBullets.forEach((b, i) => {
      slide.addText(`✓  ${b}`, {
        x: 1.0,
        y: 5.15 + i * 0.52,
        w: 5.4,
        h: 0.48,
        fontSize: 9.5,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });

    // Right Column: 4 Floating Action Cards
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.9,
      y: 1.35,
      w: 5.6,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("4 PRIMARY GATEWAY ACCESS CARDS", {
      x: 7.1,
      y: 1.55,
      w: 5.2,
      h: 0.3,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const gatewayCards = [
      {
        title: "1. Colleges Directory",
        desc: "Direct navigation to all government colleges across Balochistan with search, district filters, and campus profiles.",
        route: "Route: /#institutes",
      },
      {
        title: "2. Academic Structure",
        desc: "Provincial curriculum guide, BS 4-Year credit hour breakdown, and Intermediate faculty stream allocations.",
        route: "Route: /#academic-structure",
      },
      {
        title: "3. Department Info & Services",
        desc: "Leadership messages from the Secretary and DPI Colleges, official notifications, and departmental acts.",
        route: "Route: /#department-info",
      },
      {
        title: "4. HEMIS Directorate Portal",
        desc: "Provincial macro administration, college provisioning, and multi-campus management for government officials.",
        route: "Route: /login?mode=HEMIS",
      },
    ];

    gatewayCards.forEach((c, i) => {
      const cy = 1.95 + i * 1.2;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 7.1,
        y: cy,
        w: 5.2,
        h: 1.1,
        r: 0.1,
        fill: { color: BG_LIGHT },
        line: { color: BORDER_COLOR, width: 1 },
      });

      slide.addText(c.title, {
        x: 7.25,
        y: cy + 0.12,
        w: 3.5,
        h: 0.28,
        fontSize: 11,
        fontFace: "Arial",
        bold: true,
        color: ACCENT_BLUE,
      });

      slide.addText(c.route, {
        x: 10.6,
        y: cy + 0.12,
        w: 1.6,
        h: 0.22,
        fontSize: 8,
        fontFace: "Arial",
        bold: true,
        color: "059669",
        align: "right",
      });

      slide.addText(c.desc, {
        x: 7.25,
        y: cy + 0.42,
        w: 4.9,
        h: 0.6,
        fontSize: 9.2,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 3: Level 1 — Provincial Colleges Directory & District Discovery
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 2: Provincial Colleges Directory & District Mapping",
      "Unified directory connecting students and citizens to every degree college in Balochistan",
      3
    );

    // 3 Column Focus Cards
    const dirCards = [
      {
        title: "1. District-Wise Mapping",
        color: "064E3B",
        points: [
          "Complete Provincial Coverage: Directory maps colleges across all 36 administrative districts.",
          "Fast Multi-Criteria Search: Filter by College Name, Institutional Code (e.g. GPGCQ), or District.",
          "Institutional Categories: Classifies institutions into Post Graduate Colleges, Degree Colleges, and Inter Colleges.",
          "Geographic Transparency: Displays campus location, contact telephone, and principal details.",
        ],
      },
      {
        title: "2. Macro Statistical Visibility",
        color: "1D4ED8",
        points: [
          "Total Colleges Registered: Real-time count of public sector colleges actively managed on the platform.",
          "Active Enrolled Students: Consolidated student census data across BS and Intermediate faculties.",
          "Faculty Deployment Metrics: Province-wide tracking of sanctioned vs. active teaching faculty positions.",
          "Academic Program Offerings: Directory of approved BS 4-Year and intermediate disciplines.",
        ],
      },
      {
        title: "3. Gateway to Campus Portals",
        color: "7C3AED",
        points: [
          "Direct One-Click Routing: Clicking any college card instantly opens its dedicated website (/colleges/[code]).",
          "Decentralized Autonomy: Citizens access campus-specific merit lists, admissions, and exam results directly.",
          "No Central Intermediary: Eliminates bottlenecks—each college maintains its own digital presence.",
          "Mobile Responsive Search: Fully optimized for Android smartphones and tablets across district campuses.",
        ],
      },
    ];

    dirCards.forEach((dc, i) => {
      const cx = 0.8 + i * 4.05;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx,
        y: 1.35,
        w: 3.75,
        h: 5.6,
        r: 0.15,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.5 },
      });

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx + 0.2,
        y: 1.55,
        w: 3.35,
        h: 0.55,
        r: 0.1,
        fill: { color: dc.color },
      });

      slide.addText(dc.title, {
        x: cx + 0.25,
        y: 1.68,
        w: 3.25,
        h: 0.3,
        fontSize: 11.5,
        fontFace: "Arial",
        bold: true,
        color: "FFFFFF",
        align: "center",
      });

      dc.points.forEach((pt, j) => {
        slide.addText(`•  ${pt}`, {
          x: cx + 0.2,
          y: 2.35 + j * 1.15,
          w: 3.35,
          h: 1.05,
          fontSize: 10,
          fontFace: "Arial",
          color: TEXT_DARK,
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 4: Level 1 — HEMIS Central Governance & Apex Directorate (/HEMIS)
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 3: HEMIS Central Governance & Apex Directorate (/HEMIS)",
      "Macro oversight for the Directorate of Colleges without intruding into campus operations",
      4
    );

    // Left Column: Live Screenshot Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8,
      y: 1.35,
      w: 5.8,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("LIVE APPLICATION VIEW: HEMIS CENTRAL DASHBOARD", {
      x: 1.0,
      y: 1.55,
      w: 5.4,
      h: 0.3,
      fontSize: 11,
      fontFace: "Arial",
      bold: true,
      color: EMERALD_LIGHT,
    });

    if (fs.existsSync(IMG_CENTRAL_DASH)) {
      slide.addImage({
        path: IMG_CENTRAL_DASH,
        x: 1.0,
        y: 1.95,
        w: 5.4,
        h: 2.75,
      });
    }

    slide.addText("Directorate Apex Capabilities:", {
      x: 1.0,
      y: 4.85,
      w: 5.4,
      h: 0.25,
      fontSize: 10.5,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const apexBullets = [
      "Provision New College: Rapid digital setup of newly established degree colleges with custom sub-paths.",
      "Live Central Metrics: 4 Colleges, 4 Active Campuses, 45 Students, 29 Faculty, 15 BS Programs.",
      "Macro Directorate Role: High-level monitoring and policy governance without micromanaging colleges.",
    ];

    apexBullets.forEach((b, i) => {
      slide.addText(`✓  ${b}`, {
        x: 1.0,
        y: 5.15 + i * 0.52,
        w: 5.4,
        h: 0.48,
        fontSize: 9.5,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });

    // Right Column: Zero-Interference Architectural Standard
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.9,
      y: 1.35,
      w: 5.6,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("ZERO-INTERFERENCE ARCHITECTURAL STANDARD", {
      x: 7.1,
      y: 1.55,
      w: 5.2,
      h: 0.3,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const autonomyCards = [
      {
        title: "1. Campus Sovereignty Guarantee",
        desc: "The Central Directorate provides platform infrastructure, but cannot alter individual student marks, classroom attendance, or routine college decisions.",
      },
      {
        title: "2. Data Isolation Boundaries",
        desc: "Each college operates in a protected tenant domain. Principals and teachers have exclusive cryptographic control over internal academic records.",
      },
      {
        title: "3. Direct Provisioning & Onboarding",
        desc: "When a new college is established in any district, HEMIS Super Admin provisions its account in seconds, handing full credentials to the College Principal.",
      },
      {
        title: "4. Provincial Planning Analytics",
        desc: "Directorate accesses aggregated intelligence (enrollment growth, teacher-student ratios) to inform annual budget requests and development schemes.",
      },
    ];

    autonomyCards.forEach((c, i) => {
      const cy = 1.95 + i * 1.2;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 7.1,
        y: cy,
        w: 5.2,
        h: 1.1,
        r: 0.1,
        fill: { color: BG_LIGHT },
        line: { color: BORDER_COLOR, width: 1 },
      });

      slide.addText(c.title, {
        x: 7.25,
        y: cy + 0.12,
        w: 4.9,
        h: 0.28,
        fontSize: 11,
        fontFace: "Arial",
        bold: true,
        color: "0C5938",
      });

      slide.addText(c.desc, {
        x: 7.25,
        y: cy + 0.42,
        w: 4.9,
        h: 0.6,
        fontSize: 9.2,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 5: Level 1 — Central Governance Matrix & Autonomous Permissions
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 4: Central Governance Matrix & Decentralized Permissions",
      "College Admin authority is fully autonomous within campus and separated from central HQ",
      5
    );

    // Left Column: Live Screenshot Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8,
      y: 1.35,
      w: 5.8,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("LIVE APPLICATION VIEW: ROLE PERMISSIONS MATRIX (/admin/permissions)", {
      x: 1.0,
      y: 1.55,
      w: 5.4,
      h: 0.3,
      fontSize: 11,
      fontFace: "Arial",
      bold: true,
      color: ACCENT_BLUE,
    });

    if (fs.existsSync(IMG_PERMISSIONS)) {
      slide.addImage({
        path: IMG_PERMISSIONS,
        x: 1.0,
        y: 1.95,
        w: 5.4,
        h: 2.75,
      });
    }

    slide.addText("Architectural Role Separation Enforcement:", {
      x: 1.0,
      y: 4.85,
      w: 5.4,
      h: 0.25,
      fontSize: 10.5,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const permNotes = [
      "Decentralized Scope: College Admin operates within their campus; excluded from HQ modification.",
      "Module-Level Toggles: Admissions, BS Degree, Intermediate, Examinations, Accounts, and Timetable.",
      "Action-Level Constraints: Independent controls for View, Add, Edit, Delete, and Final Approval rights.",
    ];

    permNotes.forEach((n, i) => {
      slide.addText(`✓  ${n}`, {
        x: 1.0,
        y: 5.15 + i * 0.52,
        w: 5.4,
        h: 0.48,
        fontSize: 9.5,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });

    // Right Column: Decentralized Role Hierarchy
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.9,
      y: 1.35,
      w: 5.6,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("DECENTRALIZED CAMPUS ROLE HIERARCHY", {
      x: 7.1,
      y: 1.55,
      w: 5.2,
      h: 0.3,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const roles = [
      {
        title: "College Principal (Executive Authority)",
        desc: "Complete campus oversight, faculty appointments, final grade approvals, and audit trail reviews.",
        tag: "Full Autonomy",
        color: "064E3B",
      },
      {
        title: "Vice Principal / Academic In-Charge",
        desc: "Monitors daily class schedules, classroom allocations, student discipline, and attendance thresholds.",
        tag: "Academic Control",
        color: "1D4ED8",
      },
      {
        title: "Controller of Examinations",
        desc: "Sessional mark verification, midterm & final exam tabulation, and watermarked transcript issuance.",
        tag: "Exam Branch",
        color: "7C3AED",
      },
      {
        title: "Head of Department (HOD) & Faculty",
        desc: "Course syllabi distribution, lecture delivery, daily attendance logging, and internal assessments.",
        tag: "Faculty Portal",
        color: "D97706",
      },
      {
        title: "Accounts & Finance Branch",
        desc: "Fee package configuration, 3-part automated challan generation, and bank payment reconciliation.",
        tag: "Financial Gate",
        color: "0F766E",
      },
    ];

    roles.forEach((r, i) => {
      const ry = 1.95 + i * 0.95;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 7.1,
        y: ry,
        w: 5.2,
        h: 0.88,
        r: 0.1,
        fill: { color: BG_LIGHT },
        line: { color: BORDER_COLOR, width: 1 },
      });

      slide.addText(r.title, {
        x: 7.25,
        y: ry + 0.1,
        w: 3.5,
        h: 0.25,
        fontSize: 10.5,
        fontFace: "Arial",
        bold: true,
        color: TEXT_DARK,
      });

      slide.addText(r.tag, {
        x: 10.6,
        y: ry + 0.1,
        w: 1.6,
        h: 0.22,
        fontSize: 8,
        fontFace: "Arial",
        bold: true,
        color: r.color,
        align: "right",
      });

      slide.addText(r.desc, {
        x: 7.25,
        y: ry + 0.38,
        w: 4.9,
        h: 0.45,
        fontSize: 8.8,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 6: Level 2 — Campus Public Web Portal (/colleges/[slug])
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 5: Campus Public Web Portal & Gateway (/colleges/[slug])",
      "Each college receives its own independent public website (e.g., /colleges/gpgcq)",
      6
    );

    // Left Column: Live Screenshot Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8,
      y: 1.35,
      w: 5.8,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("LIVE APPLICATION VIEW: COLLEGE PUBLIC PORTAL (/colleges/gpgcq)", {
      x: 1.0,
      y: 1.55,
      w: 5.4,
      h: 0.3,
      fontSize: 11,
      fontFace: "Arial",
      bold: true,
      color: EMERALD_LIGHT,
    });

    if (fs.existsSync(IMG_PUBLIC_PORTAL)) {
      slide.addImage({
        path: IMG_PUBLIC_PORTAL,
        x: 1.0,
        y: 1.95,
        w: 5.4,
        h: 2.75,
      });
    }

    slide.addText("Public Portal Capabilities:", {
      x: 1.0,
      y: 4.85,
      w: 5.4,
      h: 0.25,
      fontSize: 10.5,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const portalBullets = [
      "Custom College Domain: Dedicated route (e.g. Govt. Post Graduate College Quetta).",
      "Campus Home Isolation: Clicking 'Home' stays within the specific college; never redirects to HEMIS HQ.",
      "Direct 'Login to CMS' Button: College staff and faculty seamlessly launch the private ERP.",
    ];

    portalBullets.forEach((b, i) => {
      slide.addText(`✓  ${b}`, {
        x: 1.0,
        y: 5.15 + i * 0.52,
        w: 5.4,
        h: 0.48,
        fontSize: 9.5,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });

    // Right Column: Public Self-Service Suite
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.9,
      y: 1.35,
      w: 5.6,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("PUBLIC CITIZEN & STUDENT SERVICES", {
      x: 7.1,
      y: 1.55,
      w: 5.2,
      h: 0.3,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const publicCards = [
      {
        title: "1. Online Admissions & Prospectus",
        desc: "Prospective applicants browse available BS 4-Year and Intermediate programs, check eligibility criteria, and submit online applications.",
      },
      {
        title: "2. Real-Time Result Verification",
        desc: "Students, parents, and employers verify official semester transcripts instantly using student Roll Number or University Registration ID.",
      },
      {
        title: "3. Timetable & Datesheet Center",
        desc: "Public access to updated lecture schedules, room numbers, midterm exam datesheets, and academic calendar deadlines.",
      },
      {
        title: "4. Department Profiles & Faculty Directory",
        desc: "Showcase academic departments (Computer Science, Chemistry, Mathematics, Urdu, etc.) with faculty qualifications and research profiles.",
      },
    ];

    publicCards.forEach((c, i) => {
      const cy = 1.95 + i * 1.2;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 7.1,
        y: cy,
        w: 5.2,
        h: 1.1,
        r: 0.1,
        fill: { color: BG_LIGHT },
        line: { color: BORDER_COLOR, width: 1 },
      });

      slide.addText(c.title, {
        x: 7.25,
        y: cy + 0.12,
        w: 4.9,
        h: 0.28,
        fontSize: 11,
        fontFace: "Arial",
        bold: true,
        color: ACCENT_BLUE,
      });

      slide.addText(c.desc, {
        x: 7.25,
        y: cy + 0.42,
        w: 4.9,
        h: 0.6,
        fontSize: 9.2,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 7: Level 2 — Multi-Tenant Authentication & Institutional Login
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 6: Institutional Multi-Tenant Authentication (/login)",
      "Secure credential gateway routing users directly into their autonomous campus tenant",
      7
    );

    // 3 Cards Layout
    const authCards = [
      {
        title: "1. Two Separate Login Channels",
        color: "064E3B",
        points: [
          "Login by Institute: Dedicated path for College Principals, Faculty, Accountants, and Examination Staff.",
          "HEMIS Directorate Login: Isolated channel for Provincial Secretariat officials and IT Cell administrators.",
          "Automated Routing: Upon credential verification, users are routed directly to their campus ERP workspace.",
          "No Cross-Tenant Leaks: College A credentials are cryptographically rejected on College B accounts.",
        ],
      },
      {
        title: "2. Cryptographic Security Stack",
        color: "1D4ED8",
        points: [
          "Encrypted JWT Tokens: Signed JSON Web Tokens containing user permissions, campus ID, and session expiry.",
          "HTTPS / TLS Encryption: 256-bit SSL encryption securing passwords and sensitive academic records.",
          "Role-Based Guards: Next.js middleware enforces strict server-side permission checks on every route.",
          "Session Inactivity Timeouts: Protects public staff room computers from unauthorized session reuse.",
        ],
      },
      {
        title: "3. Audit Trail & Log Monitoring",
        color: "7C3AED",
        points: [
          "Authentication Logging: Records IP addresses, login timestamps, and browser user-agents for every session.",
          "Failed Attempt Shield: Protects against brute-force password guessing through rate limiting.",
          "Password Self-Service: Secure credential resets administered by verified campus administrators.",
          "Supervisory Security Audits: Principals can review all active campus logins and revoke compromised sessions.",
        ],
      },
    ];

    authCards.forEach((ac, i) => {
      const cx = 0.8 + i * 4.05;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx,
        y: 1.35,
        w: 3.75,
        h: 5.6,
        r: 0.15,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.5 },
      });

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx + 0.2,
        y: 1.55,
        w: 3.35,
        h: 0.55,
        r: 0.1,
        fill: { color: ac.color },
      });

      slide.addText(ac.title, {
        x: cx + 0.25,
        y: 1.68,
        w: 3.25,
        h: 0.3,
        fontSize: 11.5,
        fontFace: "Arial",
        bold: true,
        color: "FFFFFF",
        align: "center",
      });

      ac.points.forEach((pt, j) => {
        slide.addText(`•  ${pt}`, {
          x: cx + 0.2,
          y: 2.35 + j * 1.15,
          w: 3.35,
          h: 1.05,
          fontSize: 10,
          fontFace: "Arial",
          color: TEXT_DARK,
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 8: Level 2 — Principal's ERP Command Center (/colleges/[slug]/admin)
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 7: Principal's ERP Command Center & Dashboard",
      "Executive overview with high-contrast college logo and live academic metrics",
      8
    );

    // Left Column: Live Screenshot Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8,
      y: 1.35,
      w: 5.8,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("LIVE APPLICATION VIEW: CAMPUS ERP DASHBOARD", {
      x: 1.0,
      y: 1.55,
      w: 5.4,
      h: 0.3,
      fontSize: 11,
      fontFace: "Arial",
      bold: true,
      color: ACCENT_BLUE,
    });

    if (fs.existsSync(IMG_CAMPUS_ERP)) {
      slide.addImage({
        path: IMG_CAMPUS_ERP,
        x: 1.0,
        y: 1.95,
        w: 5.4,
        h: 2.75,
      });
    }

    slide.addText("Enhanced Institutional UI & Branding:", {
      x: 1.0,
      y: 4.85,
      w: 5.4,
      h: 0.25,
      fontSize: 10.5,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const erpNotes = [
      "High-Contrast Logo Banner: Official college crest framed on a pristine white header for supreme clarity.",
      "Customizable Sidebar Themes: College Admins choose matching themes without breaking visual legibility.",
      "Real-Time Action Banners: Published timetables, pending invigilation duties, and emergency notifications.",
    ];

    erpNotes.forEach((n, i) => {
      slide.addText(`✓  ${n}`, {
        x: 1.0,
        y: 5.15 + i * 0.52,
        w: 5.4,
        h: 0.48,
        fontSize: 9.5,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });

    // Right Column: Key Dashboard Metrics & Quick Actions
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.9,
      y: 1.35,
      w: 5.6,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("EXECUTIVE METRICS & REAL-TIME ACTIONS", {
      x: 7.1,
      y: 1.55,
      w: 5.2,
      h: 0.3,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    // 4 Stat Metric Cards (2x2)
    const metrics = [
      { label: "Enrolled Students", val: "28 Active", growth: "+8.4% this session", col: "1D4ED8" },
      { label: "Active Programs", val: "6 Programs", growth: "BS & Inter Streams", col: "059669" },
      { label: "Faculty Members", val: "11 Active", growth: "100% Onboarded", col: "7C3AED" },
      { label: "Courses Offered", val: "123 Courses", growth: "Across 8 Semesters", col: "D97706" },
    ];

    metrics.forEach((m, i) => {
      const mx = 7.1 + (i % 2) * 2.65;
      const my = 1.95 + Math.floor(i / 2) * 1.3;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: mx,
        y: my,
        w: 2.5,
        h: 1.18,
        r: 0.1,
        fill: { color: BG_LIGHT },
        line: { color: BORDER_COLOR, width: 1 },
      });

      slide.addText(m.val, {
        x: mx + 0.15,
        y: my + 0.12,
        w: 2.2,
        h: 0.35,
        fontSize: 16,
        fontFace: "Arial",
        bold: true,
        color: m.col,
      });

      slide.addText(m.label, {
        x: mx + 0.15,
        y: my + 0.48,
        w: 2.2,
        h: 0.25,
        fontSize: 9.5,
        fontFace: "Arial",
        bold: true,
        color: TEXT_DARK,
      });

      slide.addText(m.growth, {
        x: mx + 0.15,
        y: my + 0.76,
        w: 2.2,
        h: 0.22,
        fontSize: 8.5,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });

    slide.addText("Instant Executive Controls:", {
      x: 7.1,
      y: 4.75,
      w: 5.2,
      h: 0.25,
      fontSize: 10.5,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const quickActions = [
      "Session Filtering: Toggle seamlessly between Academic Years (2022-2026, 2023-2027) and current semester.",
      "Duty Allocation: Assign invigilators to morning and evening examination shifts with one click.",
      "Emergency Broadcasts: Instantly push campus-wide alerts to student and faculty portals.",
    ];

    quickActions.forEach((a, i) => {
      slide.addText(`•  ${a}`, {
        x: 7.1,
        y: 5.05 + i * 0.55,
        w: 5.2,
        h: 0.5,
        fontSize: 9.5,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 9: Level 2 — Campus Customization, Branding & Settings (/admin/settings)
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 8: Institutional Branding & Theme Customizer (/admin/settings)",
      "Colleges control their visual identity with customizable emblems, themes, and white logo headers",
      9
    );

    // Left Column: Live Screenshot Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8,
      y: 1.35,
      w: 5.8,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("LIVE APPLICATION VIEW: PORTAL SETTINGS & THEME ENGINE", {
      x: 1.0,
      y: 1.55,
      w: 5.4,
      h: 0.3,
      fontSize: 11,
      fontFace: "Arial",
      bold: true,
      color: "059669",
    });

    if (fs.existsSync(IMG_THEME_SETTINGS)) {
      slide.addImage({
        path: IMG_THEME_SETTINGS,
        x: 1.0,
        y: 1.95,
        w: 5.4,
        h: 2.75,
      });
    }

    slide.addText("Branding & Identity Customizer:", {
      x: 1.0,
      y: 4.85,
      w: 5.4,
      h: 0.25,
      fontSize: 10.5,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const brandBullets = [
      "Custom Institutional Seal: High-res upload of college coat of arms used across result cards and portals.",
      "High-Contrast White Frame & Custom College Name Color: Guarantees college title and emblem stand out vibrantly.",
      "Custom Color Palette Manager: Add & save any custom hex codes (e.g. #2653FF) with one-click theme application.",
    ];

    brandBullets.forEach((b, i) => {
      slide.addText(`✓  ${b}`, {
        x: 1.0,
        y: 5.15 + i * 0.52,
        w: 5.4,
        h: 0.48,
        fontSize: 9.5,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });

    // Right Column: Campus Identity Configuration
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.9,
      y: 1.35,
      w: 5.6,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("CAMPUS IDENTITY CONFIGURATION SUITE", {
      x: 7.1,
      y: 1.55,
      w: 5.2,
      h: 0.3,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const customCards = [
      {
        title: "1. Institutional Crest & Watermark",
        desc: "Upload the high-resolution college seal. The system automatically creates optimized vector thumbnails and 15% opacity watermarks for result transcripts.",
      },
      {
        title: "2. Color Themes & Dark Mode",
        desc: "Principals can adapt the visual theme to match institutional traditions, with automatic WCAG contrast compliance for effortless reading.",
      },
      {
        title: "3. Official Campus Directory & Contact Meta",
        desc: "Configure official campus location, principal's office email, student helpdesk phone numbers, and official social media handles.",
      },
      {
        title: "4. Digital Principal Signature Upload",
        desc: "Secure upload of the Principal's digital signature for automated signing of character certificates, provisional certificates, and bonafide letters.",
      },
    ];

    customCards.forEach((c, i) => {
      const cy = 1.95 + i * 1.2;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 7.1,
        y: cy,
        w: 5.2,
        h: 1.1,
        r: 0.1,
        fill: { color: BG_LIGHT },
        line: { color: BORDER_COLOR, width: 1 },
      });

      slide.addText(c.title, {
        x: 7.25,
        y: cy + 0.12,
        w: 4.9,
        h: 0.28,
        fontSize: 11,
        fontFace: "Arial",
        bold: true,
        color: "0C5938",
      });

      slide.addText(c.desc, {
        x: 7.25,
        y: cy + 0.42,
        w: 4.9,
        h: 0.6,
        fontSize: 9.2,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 10: Academic Operations — Departments, Programs & Course Structures
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 9: Academic Departments, Degree Programs & Course Catalogs",
      "Structuring BS 4-Year (8 Semesters) and Intermediate streams with credit hours",
      10
    );

    // 4 Strategic Quadrants (2x2 Grid)
    const academicCards = [
      {
        title: "Departmental Structures",
        desc: "Establish independent department entities (Computer Science, Chemistry, Mathematics, Physics, English, Urdu). Assign department HODs and academic staff.",
        badge: "Hierarchy",
        color: "064E3B",
      },
      {
        title: "BS 4-Year & Intermediate Streams",
        desc: "Support for full 8-semester BS degrees (130-136 total credit hours) alongside traditional intermediate streams (F.Sc Pre-Med, Pre-Eng, ICS, FA, I.Com).",
        badge: "Degree Curricula",
        color: "1D4ED8",
      },
      {
        title: "Course Catalog & Syllabi Matrices",
        desc: "Define subject codes (e.g. CS-101, MATH-201), course titles, theory/practical credit hours, prerequisite links, and recommended course textbooks.",
        badge: "HEC Compliance",
        color: "7C3AED",
      },
      {
        title: "Semester Course Registration",
        desc: "Automated enrollment of student cohorts into semester courses. Prevents duplicate registrations and validates prerequisite course pass status.",
        badge: "Cohort Engine",
        color: "D97706",
      },
    ];

    academicCards.forEach((ac, i) => {
      const ax = 0.8 + (i % 2) * 6.05;
      const ay = 1.45 + Math.floor(i / 2) * 2.75;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: ax,
        y: ay,
        w: 5.7,
        h: 2.55,
        r: 0.15,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.5 },
      });

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: ax + 0.3,
        y: ay + 0.25,
        w: 2.3,
        h: 0.38,
        r: 0.08,
        fill: { color: ac.color },
      });

      slide.addText(ac.badge, {
        x: ax + 0.35,
        y: ay + 0.32,
        w: 2.2,
        h: 0.25,
        fontSize: 9,
        fontFace: "Arial",
        bold: true,
        color: "FFFFFF",
        align: "center",
      });

      slide.addText(ac.title, {
        x: ax + 0.3,
        y: ay + 0.78,
        w: 5.1,
        h: 0.45,
        fontSize: 13,
        fontFace: "Arial",
        bold: true,
        color: TEXT_DARK,
      });

      slide.addText(ac.desc, {
        x: ax + 0.3,
        y: ay + 1.28,
        w: 5.1,
        h: 1.05,
        fontSize: 10.5,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 11: Academic Operations — Conflict-Free Timetable & Faculty Workload
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 10: Conflict-Free Timetable, Rooms & Faculty Scheduling",
      "Optimizing lecture delivery, classroom utilization, and teacher credit hour allocations",
      11
    );

    // Left Column: Live Screenshot Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8,
      y: 1.35,
      w: 5.8,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("LIVE APPLICATION VIEW: ACADEMIC CALENDAR & SCHEDULES", {
      x: 1.0,
      y: 1.55,
      w: 5.4,
      h: 0.3,
      fontSize: 11,
      fontFace: "Arial",
      bold: true,
      color: ACCENT_BLUE,
    });

    if (fs.existsSync(IMG_ACADEMIC_TIMETABLE)) {
      slide.addImage({
        path: IMG_ACADEMIC_TIMETABLE,
        x: 1.0,
        y: 1.95,
        w: 5.4,
        h: 2.75,
      });
    }

    slide.addText("Timetable Automation Features:", {
      x: 1.0,
      y: 4.85,
      w: 5.4,
      h: 0.25,
      fontSize: 10.5,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const schedBullets = [
      "Conflict-Free Matrix: Prohibits overlapping lectures for teachers, classrooms, and batches.",
      "Room & Lab Management: Distributes computer labs, science labs, and lecture halls efficiently.",
      "Published Class Entries: Instant broadcast of updated schedules (e.g. 24 class entries published).",
    ];

    schedBullets.forEach((b, i) => {
      slide.addText(`✓  ${b}`, {
        x: 1.0,
        y: 5.15 + i * 0.52,
        w: 5.4,
        h: 0.48,
        fontSize: 9.5,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });

    // Right Column: Faculty Self-Service Suite
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.9,
      y: 1.35,
      w: 5.6,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("FACULTY SELF-SERVICE WORKFLOWS", {
      x: 7.1,
      y: 1.55,
      w: 5.2,
      h: 0.3,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const facWorkflows = [
      {
        title: "1. Daily Teaching Dashboard",
        desc: "Teachers view their specific daily schedule, enrolled students per class, and syllabus milestones directly on their mobile or laptop.",
      },
      {
        title: "2. Workload & Credit Hour Auditing",
        desc: "Monitors weekly teaching hours (e.g., 12 to 18 credit hours) across professors, associate professors, and lecturers per HEC norms.",
      },
      {
        title: "3. Direct Mark Submission",
        desc: "Subject instructors enter sessional and midterm marks online, preventing clerical transposition errors and delayed result declarations.",
      },
      {
        title: "4. Invigilation & Exam Duties",
        desc: "Faculty access examination hall invigilation timetables with real-time shift assignments and reporting room numbers.",
      },
    ];

    facWorkflows.forEach((w, i) => {
      const wy = 1.95 + i * 1.2;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 7.1,
        y: wy,
        w: 5.2,
        h: 1.1,
        r: 0.1,
        fill: { color: BG_LIGHT },
        line: { color: BORDER_COLOR, width: 1 },
      });

      slide.addText(w.title, {
        x: 7.25,
        y: wy + 0.12,
        w: 4.9,
        h: 0.28,
        fontSize: 11,
        fontFace: "Arial",
        bold: true,
        color: "1D4ED8",
      });

      slide.addText(w.desc, {
        x: 7.25,
        y: wy + 0.42,
        w: 4.9,
        h: 0.6,
        fontSize: 9.2,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 12: Student Lifecycle — Admissions, Scrutiny & Automated Registration
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 11: Student Admissions, Scrutiny & Registration Numbers",
      "End-to-end digital lifecycle from online candidate form to permanent registration issuance",
      12
    );

    // Left Column: Live Screenshot Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8,
      y: 1.35,
      w: 5.8,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("LIVE APPLICATION VIEW: STUDENT DIRECTORY & ENROLMENT", {
      x: 1.0,
      y: 1.55,
      w: 5.4,
      h: 0.3,
      fontSize: 11,
      fontFace: "Arial",
      bold: true,
      color: EMERALD_LIGHT,
    });

    if (fs.existsSync(IMG_STUDENTS_LIST)) {
      slide.addImage({
        path: IMG_STUDENTS_LIST,
        x: 1.0,
        y: 1.95,
        w: 5.4,
        h: 2.75,
      });
    }

    slide.addText("Student Record Verification Highlights:", {
      x: 1.0,
      y: 4.85,
      w: 5.4,
      h: 0.25,
      fontSize: 10.5,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const admBullets = [
      "Permanent Identification: Unique Registration No. (e.g. REG/BS-22/GPGCQ-BSMATH-207).",
      "CNIC & B-Form Scrutiny: Eradicates duplicate entries across colleges in Balochistan.",
      "Academic History Archiving: Digital storage of intermediate marks, domicile, and quota category.",
    ];

    admBullets.forEach((b, i) => {
      slide.addText(`✓  ${b}`, {
        x: 1.0,
        y: 5.15 + i * 0.52,
        w: 5.4,
        h: 0.48,
        fontSize: 9.5,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });

    // Right Column: 4-Stage Admissions Pipeline
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.9,
      y: 1.35,
      w: 5.6,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("4-STAGE ADMISSIONS LIFECYCLE", {
      x: 7.1,
      y: 1.55,
      w: 5.2,
      h: 0.3,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const pipeline = [
      {
        step: "Stage 1: Online Application Submission",
        desc: "Applicants fill personal details, choose degree preferences (BS Computer Science, BS Chemistry, etc.), and upload credentials online.",
        badge: "Candidate Portal",
      },
      {
        step: "Stage 2: Document Scrutiny & Merit List",
        desc: "College Admission Committee validates certificates. System automatically calculates merit scores and publishes open merit & quota lists.",
        badge: "Automated Scoring",
      },
      {
        step: "Stage 3: Fee Challan Issuance & Payment",
        desc: "Selected candidates generate computerized 3-part bank fee challans. Upon bank payment, seat is formally locked.",
        badge: "3-Part Challan",
      },
      {
        step: "Stage 4: Institutional Registration & Enrolment",
        desc: "System auto-assigns permanent Roll Number and University Registration ID, enrolling the student into semester course batches.",
        badge: "Official Matriculation",
      },
    ];

    pipeline.forEach((p, i) => {
      const py = 1.95 + i * 1.2;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 7.1,
        y: py,
        w: 5.2,
        h: 1.1,
        r: 0.1,
        fill: { color: BG_LIGHT },
        line: { color: BORDER_COLOR, width: 1 },
      });

      slide.addText(p.step, {
        x: 7.25,
        y: py + 0.12,
        w: 3.5,
        h: 0.28,
        fontSize: 10.5,
        fontFace: "Arial",
        bold: true,
        color: ACCENT_BLUE,
      });

      slide.addText(p.badge, {
        x: 10.7,
        y: py + 0.12,
        w: 1.5,
        h: 0.22,
        fontSize: 8,
        fontFace: "Arial",
        bold: true,
        color: "059669",
        align: "right",
      });

      slide.addText(p.desc, {
        x: 7.25,
        y: py + 0.42,
        w: 4.9,
        h: 0.6,
        fontSize: 9,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 13: Financial Management — Computerized 3-Part Bank Challans
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 12: Financial Management & Computerized 3-Part Challans",
      "Eliminating cash handling risks with automated bank reconciliation and transparent fee heads",
      13
    );

    // 3 Comprehensive Columns (x: 0.8, 4.85, 8.9 | w: 3.65)
    const finCards = [
      {
        colTitle: "1. 3-Part Standard Challan",
        headerColor: "064E3B",
        points: [
          "Standard 3-Part Layout: Bank Copy, College Accounts Copy, and Student Receipt Copy.",
          "Itemized Fee Heads: Tuition, Laboratory, Library, Sports, Examination, and Caution Money.",
          "Unique Tracking Barcode: Eliminates manual entry errors during bank counter deposits.",
          "Automated Due Dates: System automatically calculates late fee surcharges past deadlines.",
        ],
      },
      {
        colTitle: "2. Commercial Banking Integration",
        headerColor: "1D4ED8",
        points: [
          "Designated Public Banks: Directly configured for National Bank of Pakistan (NBP) and Bank of Khyber (BOK).",
          "Zero Cash Policy: College staff handle zero physical currency, preventing audit discrepancies.",
          "Online Challan Reprinting: Students can reprint lost or revised challans directly from their portal.",
          "Scholarship Adjustments: Automatic fee waivers for Balochistan Endowment & HEC Need-Based scholars.",
        ],
      },
      {
        colTitle: "3. Real-Time Reconciliation",
        headerColor: "7C3AED",
        points: [
          "Instant Clearance Flag: Bank scroll uploads instantly update student enrollment status.",
          "Examination Admit Barrier: Students with unpaid challans are automatically blocked from exam admit cards.",
          "Revenue Audit Dashboards: Principals monitor daily and monthly collections per department.",
          "Department Budget Accounts: Tracks lab fees for science department equipment procurement.",
        ],
      },
    ];

    finCards.forEach((fc, i) => {
      const cx = 0.8 + i * 4.05;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx,
        y: 1.35,
        w: 3.75,
        h: 5.6,
        r: 0.15,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.5 },
      });

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx + 0.2,
        y: 1.55,
        w: 3.35,
        h: 0.55,
        r: 0.1,
        fill: { color: fc.headerColor },
      });

      slide.addText(fc.colTitle, {
        x: cx + 0.25,
        y: 1.68,
        w: 3.25,
        h: 0.3,
        fontSize: 11.5,
        fontFace: "Arial",
        bold: true,
        color: "FFFFFF",
        align: "center",
      });

      fc.points.forEach((pt, j) => {
        slide.addText(`•  ${pt}`, {
          x: cx + 0.2,
          y: 2.35 + j * 1.15,
          w: 3.35,
          h: 1.05,
          fontSize: 10,
          fontFace: "Arial",
          color: TEXT_DARK,
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 14: Daily Attendance & Mandatory 75% Regulatory Exam Gate
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 13: Daily Attendance & Mandatory 75% Regulatory Exam Gate",
      "Digital lecture tracking with automated 75% regulatory examination eligibility enforcement",
      14
    );

    // 3 Cards Layout
    const attCards = [
      {
        title: "1. Daily Digital Roll Call",
        color: "064E3B",
        points: [
          "One-Click Lecture Marking: Course instructors take attendance in seconds via smartphone, tablet, or PC.",
          "Batch Attendance Logging: Mark entire section present with instant toggles for absent students.",
          "Attendance History: Time-stamped logs of all lecture sessions for administrative reviews.",
          "Student Self-Service: Students view their subject attendance in real-time on the student portal.",
        ],
      },
      {
        title: "2. 75% Threshold Engine",
        color: "D97706",
        points: [
          "Regulatory Compliance: Enforces the mandatory 75% minimum attendance rule mandated by HEC and Universities.",
          "Automated Warning Alerts: System notifies students and parents when attendance drops below 80%.",
          "Medical Leave Integration: Principals can approve verified medical dispensations up to allowed caps.",
          "Department Attendance Reports: HODs download monthly departmental attendance matrices.",
        ],
      },
      {
        title: "3. Exam Admit Card Gate",
        color: "DC2626",
        points: [
          "Automated Gatekeeper: Students below 75% are automatically ineligible to sit in final semester exams.",
          "Admit Card Generation: Exam admit slips are issued exclusively to eligible, fee-cleared candidates.",
          "Erasing Exam Hall Disputes: Transparent digital records eliminate arbitrary manual exam hall disqualifications.",
          "Audit Reporting: Principals generate non-eligible candidate lists for Academic Council minutes.",
        ],
      },
    ];

    attCards.forEach((ac, i) => {
      const cx = 0.8 + i * 4.05;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx,
        y: 1.35,
        w: 3.75,
        h: 5.6,
        r: 0.15,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.5 },
      });

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx + 0.2,
        y: 1.55,
        w: 3.35,
        h: 0.55,
        r: 0.1,
        fill: { color: ac.color },
      });

      slide.addText(ac.title, {
        x: cx + 0.25,
        y: 1.68,
        w: 3.25,
        h: 0.3,
        fontSize: 11.5,
        fontFace: "Arial",
        bold: true,
        color: "FFFFFF",
        align: "center",
      });

      ac.points.forEach((pt, j) => {
        slide.addText(`•  ${pt}`, {
          x: cx + 0.2,
          y: 2.35 + j * 1.15,
          w: 3.35,
          h: 1.05,
          fontSize: 10,
          fontFace: "Arial",
          color: TEXT_DARK,
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 15: Examination Governance & Watermarked Result Verification
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addSlideHeader(
      slide,
      "Step 14: Examination Governance & Watermarked Result Verification",
      "Anti-tamper semester result verification with semi-transparent college watermark",
      15
    );

    // Left Column: Live Screenshot Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8,
      y: 1.35,
      w: 5.8,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("LIVE APPLICATION VIEW: OFFICIAL SEMESTER RESULT SLIP", {
      x: 1.0,
      y: 1.55,
      w: 5.4,
      h: 0.3,
      fontSize: 11,
      fontFace: "Arial",
      bold: true,
      color: "059669",
    });

    if (fs.existsSync(IMG_RESULT_WATERMARK)) {
      slide.addImage({
        path: IMG_RESULT_WATERMARK,
        x: 1.0,
        y: 1.95,
        w: 5.4,
        h: 2.75,
      });
    }

    slide.addText("Official Anti-Tamper Security Features:", {
      x: 1.0,
      y: 4.85,
      w: 5.4,
      h: 0.25,
      fontSize: 10.5,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const resPoints = [
      "Watermarked Protection: Official college emblem rendered with 15% opacity behind subject marks.",
      "Multi-Semester Tabs: Students toggle between Semesters 1 to 8 to view cumulative performance.",
      "Comprehensive Audit Data: Father Name, Roll No (S-22/MATH:07), CNIC, Batch, and Registration No.",
    ];

    resPoints.forEach((p, i) => {
      slide.addText(`✓  ${p}`, {
        x: 1.0,
        y: 5.15 + i * 0.52,
        w: 5.4,
        h: 0.48,
        fontSize: 9.5,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });

    // Right Column: Academic Grading Schema & Security
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.9,
      y: 1.35,
      w: 5.6,
      h: 5.6,
      r: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1.5 },
    });

    slide.addText("ACADEMIC EVALUATION & TRANSCRIPT INTEGRITY", {
      x: 7.1,
      y: 1.55,
      w: 5.2,
      h: 0.3,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: TEXT_DARK,
    });

    const examCards = [
      {
        title: "Standardized Evaluation Weights",
        desc: "Sessional & Attendance: 20% | Midterm Exam: 30% | Terminal Final Exam: 50%. Enforces rigorous continuous assessment according to HEC semester guidelines.",
      },
      {
        title: "Automated GPA & CGPA Tabulation",
        desc: "Instant calculation of Grade Point Average (GPA) and Cumulative CGPA using standard 4.0 grading scale, eliminating manual mathematical calculation errors.",
      },
      {
        title: "Institutional Result Verification Portal",
        desc: "Employers, universities, and testing agencies verify the authenticity of any issued result slip online, putting an end to fraudulent mark sheets.",
      },
      {
        title: "Examination Controller Audit Lock",
        desc: "Grades cannot be modified after final approval by the Controller of Examinations. All corrections require multi-signature digital audit trails.",
      },
    ];

    examCards.forEach((c, i) => {
      const cy = 1.95 + i * 1.2;
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 7.1,
        y: cy,
        w: 5.2,
        h: 1.1,
        r: 0.1,
        fill: { color: BG_LIGHT },
        line: { color: BORDER_COLOR, width: 1 },
      });

      slide.addText(c.title, {
        x: 7.25,
        y: cy + 0.12,
        w: 4.9,
        h: 0.28,
        fontSize: 11,
        fontFace: "Arial",
        bold: true,
        color: "0C5938",
      });

      slide.addText(c.desc, {
        x: 7.25,
        y: cy + 0.42,
        w: 4.9,
        h: 0.6,
        fontSize: 9.2,
        fontFace: "Arial",
        color: TEXT_MUTED,
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 16: End-to-End System Journey Summary & Operational Support
  // ═══════════════════════════════════════════════════════════════
  {
    const slide = pres.addSlide();
    slide.background = { color: NAVY };

    // Decorative Left Stripes
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: 0.35,
      h: 7.5,
      fill: { color: EMERALD_LIGHT },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.35,
      y: 0,
      w: 0.15,
      h: 7.5,
      fill: { color: GOLD },
    });

    slide.addText("END-TO-END HIGHER EDUCATION GOVERNANCE JOURNEY", {
      x: 1.2,
      y: 0.8,
      w: 10.5,
      h: 0.3,
      fontSize: 13,
      fontFace: "Arial",
      bold: true,
      color: "34D399",
      charSpacing: 2,
    });

    slide.addText("HEMIS Unified College CMS: Complete Journey Recap", {
      x: 1.2,
      y: 1.15,
      w: 11.0,
      h: 0.6,
      fontSize: 26,
      fontFace: "Arial",
      bold: true,
      color: "FFFFFF",
    });

    // Left Box: Complete Sequential Journey Map
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 1.2,
      y: 1.95,
      w: 5.3,
      h: 4.8,
      r: 0.15,
      fill: { color: "1E293B" },
      line: { color: "334155", width: 1.5 },
    });

    slide.addText("THE COMPLETE SEQUENTIAL SYSTEM JOURNEY", {
      x: 1.45,
      y: 2.2,
      w: 4.8,
      h: 0.3,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: "FDE047",
    });

    const journeySteps = [
      "Step 1: Main HEMIS Portal (Provincial Gateway, Balochistan Seal, Live Notices)",
      "Step 2: Provincial Colleges Directory (District Discovery across 36 Districts)",
      "Step 3: Central Governance Dashboard (/HEMIS Apex Master & Provisioning)",
      "Step 4: Role Permissions Control (Decentralized Campus Autonomy)",
      "Step 5: College Public Portal (/colleges/[code] Dedicated Identity)",
      "Step 6: Principal Command Center & Campus ERP (Live Academic Metrics)",
      "Step 7: Admissions & Automated 3-Part Bank Challan Generation",
      "Step 8: Watermarked Semester Result Transcripts & Public QR Verification",
    ];

    journeySteps.forEach((s, i) => {
      slide.addText(`➔  ${s}`, {
        x: 1.45,
        y: 2.6 + i * 0.5,
        w: 4.8,
        h: 0.44,
        fontSize: 9.2,
        fontFace: "Arial",
        color: "CBD5E1",
      });
    });

    // Right Box: Helpdesk & Deployment Contacts
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.8,
      y: 1.95,
      w: 5.3,
      h: 4.8,
      r: 0.15,
      fill: { color: "1E293B" },
      line: { color: "334155", width: 1.5 },
    });

    slide.addText("INSTITUTIONAL SUPPORT & SYSTEM ACCESS", {
      x: 7.05,
      y: 2.2,
      w: 4.8,
      h: 0.3,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: "93C5FD",
    });

    const contacts = [
      {
        head: "Government Deployment URL",
        body: "https://HEMIS-edu.vercel.app\nUnified Central Directorate & Affiliated Colleges Portals",
      },
      {
        head: "Lead Systems Architect & Specialist",
        body: "Engr. Israr Ahmed\nComputer Programmer & Systems Specialist\nGovt. Post Graduate College Quetta (GPGCQ)",
      },
      {
        head: "HEMIS Central IT Directorate Cell",
        body: "Balochistan Higher & Technical Education Department\nCivil Secretariat, Quetta, Balochistan\nEmail: HEMIS.balochistan@gov.pk",
      },
      {
        head: "Continuous Campus Helpdesk",
        body: "Technical onboarding, database migration, and faculty training workshops available year-round.",
      },
    ];

    contacts.forEach((c, i) => {
      const cy = 2.65 + i * 0.95;
      slide.addText(c.head, {
        x: 7.05,
        y: cy,
        w: 4.8,
        h: 0.25,
        fontSize: 11,
        fontFace: "Arial",
        bold: true,
        color: "34D399",
      });

      slide.addText(c.body, {
        x: 7.05,
        y: cy + 0.25,
        w: 4.8,
        h: 0.65,
        fontSize: 9.5,
        fontFace: "Arial",
        color: "E2E8F0",
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Write PPTX Buffer and Inject Transitions & Timing Animations
  // ═══════════════════════════════════════════════════════════════
  console.log("Writing base presentation buffer...");
  const rawBuf = await pres.write({ outputType: "nodebuffer" });

  console.log("Processing OpenXML package with JSZip for transitions & animations...");
  const zip = await jszip.loadAsync(rawBuf);

  // Transition mapping across 16 slides
  const transitionTypes = [
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',        // 1 Cover
    '<p:transition spd="med" advClick="1"><p:push dir="r"/></p:transition>',   // 2 Main HEMIS Homepage
    '<p:transition spd="med" advClick="1"><p:wipe dir="r"/></p:transition>',   // 3 Directory & Districts
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',        // 4 Central Dashboard
    '<p:transition spd="med" advClick="1"><p:push dir="l"/></p:transition>',   // 5 Governance Matrix
    '<p:transition spd="med" advClick="1"><p:wipe dir="r"/></p:transition>',   // 6 College Public Portal
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',        // 7 Authentication
    '<p:transition spd="med" advClick="1"><p:push dir="r"/></p:transition>',   // 8 Campus ERP
    '<p:transition spd="med" advClick="1"><p:wipe dir="r"/></p:transition>',   // 9 Branding & Settings
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',        // 10 Academic Curricula
    '<p:transition spd="med" advClick="1"><p:push dir="l"/></p:transition>',   // 11 Timetable & Scheduling
    '<p:transition spd="med" advClick="1"><p:wipe dir="r"/></p:transition>',   // 12 Admissions & Registration
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',        // 13 3-Part Bank Challans
    '<p:transition spd="med" advClick="1"><p:push dir="r"/></p:transition>',   // 14 Attendance Gate
    '<p:transition spd="med" advClick="1"><p:wipe dir="r"/></p:transition>',   // 15 Watermarked Results
    '<p:transition spd="med" advClick="1"><p:fade/></p:transition>',        // 16 Journey Recap & Contacts
  ];

  // Helper: Build timing XML for shape animations
  function buildTimingXml(spids) {
    if (!spids || spids.length === 0) return "";
    let idCounter = 100;
    const rootId = idCounter++;
    const seqId = idCounter++;

    const parNodes = spids.map((spid, idx) => {
      const p1 = idCounter++;
      const p2 = idCounter++;
      const setTn = idCounter++;
      const animTn = idCounter++;
      const delay = idx === 0 ? 300 : 250;
      return `<p:par><p:cTn id="${p1}" fill="hold"><p:stCondLst><p:cond delay="${delay}"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="${p2}" presetID="1" presetClass="entr" presetSubtype="0" fill="hold" nodeType="withEffect"><p:childTnLst><p:set><p:cBhvr><p:cTn id="${setTn}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set><p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${animTn}" dur="500"/><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cBhvr></p:animEffect></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>`;
    }).join("");

    return `<p:timing><p:tnLst><p:par><p:cTn id="${rootId}" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="${seqId}" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${parNodes}</p:childTnLst></p:cTn></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`;
  }

  // Iterate over slides in zip
  const slideFileRegex = /^ppt\/slides\/slide(\d+)\.xml$/;
  const slideFiles = Object.keys(zip.files)
    .filter((f) => slideFileRegex.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(slideFileRegex)[1], 10);
      const numB = parseInt(b.match(slideFileRegex)[1], 10);
      return numA - numB;
    });

  console.log(`Found ${slideFiles.length} slides in PPTX archive.`);

  for (let i = 0; i < slideFiles.length; i++) {
    const filename = slideFiles[i];
    let xml = await zip.file(filename).async("text");

    // Extract shape IDs for animation (skip background shape & top banner)
    const spidMatches = [...xml.matchAll(/<p:cNvPr id="(\d+)"/g)].map((m) => m[1]);
    // Animate content shapes (skip id 1 group, id 2, id 3 top bars)
    const animSpids = spidMatches.filter((id) => parseInt(id, 10) >= 5).slice(0, 10);

    const transXml = transitionTypes[i % transitionTypes.length];
    const timingXml = animSpids.length > 0 ? buildTimingXml(animSpids) : "";

    // ECMA-376 schema order: <p:clrMapOvr>, then <p:transition>, then <p:timing>, then </p:sld>
    if (xml.includes("</p:clrMapOvr>")) {
      xml = xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + transXml + timingXml);
    } else {
      xml = xml.replace("</p:sld>", transXml + timingXml + "</p:sld>");
    }

    zip.file(filename, xml);
  }

  console.log("Re-compressing updated OpenXML PPTX package...");
  const finalBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  const outputPath = path.resolve("d:/deskktop/Node.js CENT/HEMIS_College_CMS_Principal_Faculty_Orientation.pptx");
  fs.writeFileSync(outputPath, finalBuffer);

  console.log(`Master Presentation generated successfully!`);
  console.log(`Output: ${outputPath}`);
  console.log(`File Size: ${(finalBuffer.length / 1024).toFixed(1)} KB`);
}

generateMasterPresentation().catch((err) => {
  console.error("Error generating master presentation:", err);
  process.exit(1);
});
