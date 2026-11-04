export type ChteFeaturedProfile = {
  id: string;
  name: string;
  role: string;
  department: string;
  category: "SECRETARY" | "MINISTER" | "DIRECTOR" | "OFFICIAL";
  image: string;
  zoom: number; // 50 to 250%
  posX: number; // 0 to 100%
  posY: number; // 0 to 100%
  quote?: string;
  message?: string;
  email?: string;
  phone?: string;
};

export type ChteHomepageSettings = {
  pageBgColor: string;
  heroBgGradientStart: string;
  heroBgGradientEnd: string;
  primaryAccentColor: string;
  topMottoText: string;
  heroBadge: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroSceneryImage: string;
  heroSceneryZoom: number;
  heroSceneryPosX: number;
  heroSceneryPosY: number;
  tickerBadge: string;
  tickerText: string;
  tickerShow: boolean;
  featuredProfiles: ChteFeaturedProfile[];
};

export const DEFAULT_CHTE_SETTINGS: ChteHomepageSettings = {
  // Appearance & Colors
  pageBgColor: "#f8faf9",
  heroBgGradientStart: "#eef8f3",
  heroBgGradientEnd: "#eff8f3",
  primaryAccentColor: "#0c5938",

  // Text & Titles
  topMottoText: "Education | Development | Prosperity",
  heroBadge: "Government of Balochistan • Higher Education Central Cloud",
  heroHeadline: "Unified Colleges ERP & Academic Cloud Platform",
  heroSubtitle:
    "The apex central server empowering colleges across Balochistan. Access institutional portals, automated timetable scheduling, official examination gazettes, transcripts, and student management under one centralized governance umbrella.",

  // Scenery Photo with Framing
  heroSceneryImage: "/hero-scenery.png",
  heroSceneryZoom: 100, // 50% to 250%
  heroSceneryPosX: 50,  // 0% to 100%
  heroSceneryPosY: 50,  // 0% to 100%

  // Animated News Ticker
  tickerBadge: "DEVELOPMENT NOTICE:",
  tickerText:
    "Demo Project | Under development by Israr Ahmed (Computer Programmer, Govt. Postgraduate College, Sariab Road, Quetta)",
  tickerShow: true,

  // Featured Leadership Profiles
  featuredProfiles: [
    {
      id: "chte-lead-1",
      name: "Secretary Higher & Technical Education",
      role: "Secretary to Govt. of Balochistan",
      department: "Higher & Technical Education Department",
      category: "SECRETARY",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
      zoom: 100,
      posX: 50,
      posY: 50,
      quote:
        "Transforming provincial higher education through unified cloud automation, transparency, and student empowerment.",
      message:
        "Our commitment is to equip every college in Balochistan with standardized digital governance, eliminating delays in admissions, gazettes, and academic records.",
      email: "secretary@chte.balochistan.gov.pk",
      phone: "+92 81 9201200",
    },
    {
      id: "chte-lead-2",
      name: "Director of Colleges Balochistan",
      role: "Director of Colleges",
      department: "Higher & Technical Education Department",
      category: "DIRECTOR",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
      zoom: 100,
      posX: 50,
      posY: 50,
      quote:
        "Ensuring academic excellence, curriculum compliance, and teacher-student connectivity across 50+ colleges.",
      message:
        "The Unified Academic Cloud brings seamless institutional oversight, transparent fee verification, and synchronized semester examinations to Balochistan's youth.",
      email: "director@chte.balochistan.gov.pk",
      phone: "+92 81 9201201",
    },
    {
      id: "chte-lead-3",
      name: "Engr. Israr Ahmed",
      role: "Lead Software Architect & IT Programmer",
      department: "Govt. Postgraduate College, Sariab Road, Quetta",
      category: "OFFICIAL",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
      zoom: 100,
      posX: 50,
      posY: 50,
      quote:
        "Architecting decentralized multi-tenant infrastructure tailored for modern public education institutions.",
      message:
        "Engineered from the ground up to automate attendance, GPA/CGPA grading, barcode challans, and real-time datesheet conflict warnings.",
      email: "israr.programmer@college.edu.pk",
      phone: "+92 81 9211002",
    },
  ],
};
