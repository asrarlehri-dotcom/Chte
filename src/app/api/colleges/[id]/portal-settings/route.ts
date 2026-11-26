import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DEFAULT_PORTAL_SETTINGS = {
  heroBgType: "IMAGE", // "IMAGE" | "VIDEO"
  heroBgUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
  heroImages: [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
    "https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80"
  ],
  heroImgZoom: 100, // Zoom percentage (25% to 300%)
  heroImgPosX: 50,  // Horizontal focal position (0% left to 100% right)
  heroImgPosY: 50,  // Vertical focal position (0% top to 100% bottom)
  heroImgFit: "cover", // "cover" | "contain" | "fill"
  heroSlideConfigs: {} as Record<string, any>,
  primaryColor: "#040d1a", // Deep dark navy header & top bar
  ribbonColor: "#dc2626", // Red patii (accent ribbon)
  bodyBgColor: "#070d19", // Dark body background matching uploaded design
  sidebarColor: "#090E24", // Sidebar background color for Campus ERP
  pageBannerBg: "/gpgcq-campus-banner.jpg", // Default campus panoramic building banner
  pageBannerWaveColor: "#047857", // Balochistan emerald green decorative wave swoosh ("patii")
  pageBannerWaveOpacity: 100, // Decorative wave ribbon opacity (0 to 100%)
  pageBannerWaveShow: true, // Whether decorative wave ribbon is displayed on page headers
  pageBannerHeight: 170, // Page header banner height in px (120 to 300)
  pageBannerImgWidth: 100, // Background image area width % from right edge (45 to 100)
  pageBannerFade: 85, // White gradient fade intensity on the left side behind title (0 to 100%)
  moduleBannerOverrides: {} as Record<string, any>, // Per-module custom banner picture, size, wave color & opacity overrides
  collegeNameColor: "#0f172a", // Custom College Name color in sidebar & header
  collegeFontFamily: "'Times New Roman', Times, serif",
  collegeFontWeight: "700",
  collegeFontStyle: "normal",
  collegeTextDecoration: "none",
  collegeTextTransform: "uppercase",
  collegeLetterSpacing: "0.05em",
  collegeFontSize: "13px",
  collegeTextShadow: "none",
  collegeHeaderBg: "#ffffff", // Custom College Logo & Name header card background in sidebar
  portalSubtitle: "CAMPUS ERP PORTAL", // Subtitle under college name in sidebar (e.g. CAMPUS ERP PORTAL)
  portalSubtitleColor: "#4338ca", // Font color of the subtitle
  originalLogoUrl: "", // Preserves original logo before background removal
  customColors: [] as string[], // User added custom color presets
  textColor: "#ffffff",
  noticeTickerShow: true,
  noticeBadge: "DEVELOPMENT NOTICE:",
  noticeTickerText: "Demo Project | Under development by Israr Ahmed (Computer Programmer, Govt. Postgraduate College, Sariab Road, Quetta)",
  heroBadge: "EXCELLENCE IN HIGHER EDUCATION",
  heroTitle: "",
  heroSubtitle: "A historic institution committed to academic excellence, higher research, and professional student development.",
  socialLinks: {
    x: "https://x.com",
    facebook: "https://facebook.com",
    youtube: "https://youtube.com",
    linkedin: "https://linkedin.com",
    instagram: "https://instagram.com"
  },
  ribbonLinks: [
    { label: "Newsletters", link: "#" },
    { label: "Annual Reports", link: "#" },
    { label: "Convocation", link: "#" },
    { label: "Media", link: "#" }
  ],
  topNavLinks: [
    { label: "HOME", link: "#" },
    { label: "CMS", link: "/login" },
    { label: "PROGRAMS", link: "#programs" },
    { label: "TIMETABLE & DATESHEET", link: "#notices" },
    { label: "SELF-SERVICE", link: "/print/challan" },
    { label: "PROFILE", link: "#about" }
  ],
  featuredProfiles: [
    {
      id: "prof-1",
      name: "Prof. Dr. Zahid Mengal",
      designation: "Principal & Head of Institution",
      department: "Administration & Academic Council",
      category: "PRINCIPAL",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80",
      quote: "Committed to fostering academic distinction, critical inquiry, and character development for Balochistan's brightest minds.",
      message: "Our vision is to provide an inclusive learning sanctuary where academic rigor meets modern technological advancement. Every student entrusted to our institution receives comprehensive guidance from our esteemed faculty.",
      email: "principal@college.edu.pk",
      phone: "+92 81 9211000",
      order: 1
    },
    {
      id: "prof-2",
      name: "Prof. Abdul Qayyum",
      designation: "Vice Principal & Dean of Natural Sciences",
      department: "Faculty of Physical Sciences",
      category: "DEAN",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80",
      quote: "Empowering students through advanced laboratory research, scientific inquiry, and analytical discipline.",
      message: "Balochistan's future lies in science, research, and technical proficiency. We welcome aspiring scholars to explore our specialized graduate and undergraduate programs.",
      email: "sciences@college.edu.pk",
      phone: "+92 81 9211001",
      order: 2
    },
    {
      id: "prof-3",
      name: "Engr. Israr Ahmed",
      designation: "Chief Systems & ICT Coordinator",
      department: "Computer Sciences & IT Center",
      category: "FACULTY",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80",
      quote: "Leading digital transformation, academic automation, and state-of-the-art campus cloud infrastructure.",
      message: "Through automated cloud systems, computerized fee management, and centralized enrollment portals, we are bridging traditional education with 21st-century digital governance.",
      email: "ict.programmer@college.edu.pk",
      phone: "+92 81 9211002",
      order: 3
    }
  ]
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const college = await prisma.college.findFirst({
      where: {
        OR: [
          { id },
          { code: { equals: id, mode: "insensitive" } },
          { slug: { equals: id, mode: "insensitive" } }
        ]
      }
    });

    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    const settingRecord = await prisma.systemSetting.findFirst({
      where: {
        OR: [
          { key: `${college.id}:PORTAL_SETTINGS` },
          { key: `${college.code}:PORTAL_SETTINGS` },
          { key: `PORTAL_SETTINGS_${college.code}` }
        ]
      }
    });

    let customSettings: any = {};
    if (settingRecord?.value) {
      try {
        customSettings = JSON.parse(settingRecord.value);
      } catch (e) {
        console.error("Failed to parse portal settings JSON:", e);
      }
    }

    // Check if college has custom hero images configured in SystemSetting
    const heroRecord = await prisma.systemSetting.findFirst({
      where: {
        collegeId: college.id,
        key: "COLLEGE_HERO_IMAGES"
      }
    });

    let extraHeroImages: string[] = [];
    if (heroRecord?.value) {
      try {
        const parsed = JSON.parse(heroRecord.value);
        if (Array.isArray(parsed)) extraHeroImages = parsed;
      } catch {
        if (heroRecord.value.includes(",")) {
          extraHeroImages = heroRecord.value.split(",").map((s) => s.trim());
        } else if (heroRecord.value) {
          extraHeroImages = [heroRecord.value.trim()];
        }
      }
    }

    const effectiveHeroImages =
      Array.isArray(customSettings.heroImages) && customSettings.heroImages.length > 0
        ? customSettings.heroImages
        : extraHeroImages.length > 0
        ? extraHeroImages
        : DEFAULT_PORTAL_SETTINGS.heroImages;

    const merged = {
      ...DEFAULT_PORTAL_SETTINGS,
      heroTitle: college.name,
      heroSubtitle: college.tagline || DEFAULT_PORTAL_SETTINGS.heroSubtitle,
      collegeName: college.name,
      logoUrl: college.logoUrl || "",
      tagline: college.tagline || "",
      district: college.district || "",
      principalName: college.principalName || "",
      address: college.address || "",
      contactEmail: college.contactEmail || "",
      contactPhone: college.contactPhone || "",
      collegeId: college.id,
      collegeCode: college.code,
      ...customSettings,
      heroImages: effectiveHeroImages,
    };

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Error loading portal settings:", error);
    return NextResponse.json({ error: "Failed to load portal settings" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userCollegeId = (session?.user as any)?.collegeId;

    if (!session || !["SUPER_ADMIN", "CHTE_ADMIN", "COLLEGE_ADMIN", "PRINCIPAL"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const college = await prisma.college.findFirst({
      where: {
        OR: [
          { id },
          { code: { equals: id, mode: "insensitive" } },
          { slug: { equals: id, mode: "insensitive" } }
        ]
      }
    });

    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    // College admin can only edit their own college unless super admin
    if (userRole === "COLLEGE_ADMIN" && userCollegeId && userCollegeId !== college.id) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own college portal" }, { status: 403 });
    }

    const body = await request.json();

    // Update core College record fields if provided
    if (
      body.collegeName !== undefined ||
      body.logoUrl !== undefined ||
      body.tagline !== undefined ||
      body.principalName !== undefined ||
      body.address !== undefined ||
      body.contactEmail !== undefined ||
      body.contactPhone !== undefined
    ) {
      await prisma.college.update({
        where: { id: college.id },
        data: {
          ...(body.collegeName ? { name: body.collegeName.trim() } : {}),
          ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl.trim() } : {}),
          ...(body.tagline !== undefined ? { tagline: body.tagline.trim() } : {}),
          ...(body.principalName !== undefined ? { principalName: body.principalName.trim() } : {}),
          ...(body.address !== undefined ? { address: body.address.trim() } : {}),
          ...(body.contactEmail !== undefined ? { contactEmail: body.contactEmail.trim() } : {}),
          ...(body.contactPhone !== undefined ? { contactPhone: body.contactPhone.trim() } : {}),
        }
      });
    }

    // Save portal customizations in SystemSetting with key `${college.id}:PORTAL_SETTINGS`
    const settingsJson = JSON.stringify(body);
    const key = `${college.id}:PORTAL_SETTINGS`;

    await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: settingsJson,
        collegeId: college.id
      },
      create: {
        key,
        value: settingsJson,
        collegeId: college.id
      }
    });

    if (body.sidebarColor) {
      const sidebarKey = `COLLEGE_SIDEBAR_BG_${college.id}`;
      await prisma.systemSetting.upsert({
        where: { key: sidebarKey },
        update: { value: body.sidebarColor, collegeId: college.id },
        create: { key: sidebarKey, value: body.sidebarColor, collegeId: college.id }
      }).catch(() => {});
    }

    if (body.collegeNameColor) {
      const nameColorKey = `COLLEGE_NAME_COLOR_${college.id}`;
      await prisma.systemSetting.upsert({
        where: { key: nameColorKey },
        update: { value: body.collegeNameColor, collegeId: college.id },
        create: { key: nameColorKey, value: body.collegeNameColor, collegeId: college.id }
      }).catch(() => {});
    }

    if (body.collegeHeaderBg) {
      const headerBgKey = `COLLEGE_HEADER_BG_${college.id}`;
      await prisma.systemSetting.upsert({
        where: { key: headerBgKey },
        update: { value: body.collegeHeaderBg, collegeId: college.id },
        create: { key: headerBgKey, value: body.collegeHeaderBg, collegeId: college.id }
      }).catch(() => {});
    }

    if (body.portalSubtitle) {
      const subtitleKey = `COLLEGE_SUBTITLE_${college.id}`;
      await prisma.systemSetting.upsert({
        where: { key: subtitleKey },
        update: { value: body.portalSubtitle, collegeId: college.id },
        create: { key: subtitleKey, value: body.portalSubtitle, collegeId: college.id }
      }).catch(() => {});
    }

    if (body.collegeName) {
      await prisma.systemSetting.upsert({
        where: { key: `COLLEGE_NAME_${college.id}` },
        update: { value: body.collegeName.trim(), collegeId: college.id },
        create: { key: `COLLEGE_NAME_${college.id}`, value: body.collegeName.trim(), collegeId: college.id }
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "College portal settings updated successfully!"
    });
  } catch (error) {
    console.error("Error saving portal settings:", error);
    return NextResponse.json({ error: "Failed to save portal settings" }, { status: 500 });
  }
}

