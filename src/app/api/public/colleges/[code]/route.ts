import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: "College code or ID is required" }, { status: 400 });
    }

    const college = await prisma.college.findFirst({
      where: {
        isActive: true,
        OR: [
          { code: { equals: code, mode: "insensitive" } },
          { slug: { equals: code, mode: "insensitive" } },
          { id: code }
        ]
      },
      include: {
        departments: {
          where: { isActive: true },
          include: {
            _count: { select: { programs: true, faculty: true } }
          },
          orderBy: { name: "asc" }
        },
        programs: {
          where: { isActive: true },
          include: {
            department: { select: { id: true, name: true, code: true } },
            _count: { select: { courses: true, students: true } }
          },
          orderBy: [{ educationLevel: "desc" }, { name: "asc" }]
        },
        faculty: {
          where: { isActive: true },
          include: {
            user: { select: { name: true, email: true } },
            department: { select: { name: true } }
          },
          take: 24,
          orderBy: { createdAt: "asc" }
        },
        datesheets: {
          where: { status: "PUBLISHED" },
          include: { course: true, program: true },
          orderBy: { date: "asc" },
          take: 6
        },
        _count: {
          select: {
            students: true,
            faculty: true,
            programs: true,
            departments: true
          }
        }
      }
    });

    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    // Load custom portal settings for this college
    const settingRecord = await prisma.systemSetting.findFirst({
      where: {
        OR: [
          { key: `${college.id}:PORTAL_SETTINGS` },
          { key: `${college.code}:PORTAL_SETTINGS` },
          { key: `PORTAL_SETTINGS_${college.code}` }
        ]
      }
    });

    let customPortal = {};
    if (settingRecord?.value) {
      try {
        customPortal = JSON.parse(settingRecord.value);
      } catch (e) {
        console.error("Failed to parse portal settings JSON:", e);
      }
    }

    const defaultPortalSettings = {
      heroBgType: "IMAGE",
      heroBgUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
      heroImgZoom: 100,
      heroImgPosX: 50,
      heroImgPosY: 50,
      primaryColor: "#040d1a",
      ribbonColor: "#dc2626", // Red patii
      bodyBgColor: "#070d19", // Dark body background
      textColor: "#ffffff",
      noticeTickerShow: true,
      noticeBadge: "DEVELOPMENT NOTICE:",
      noticeTickerText: "Demo Project | Under development by Israr Ahmed (Computer Programmer, Govt. Postgraduate College, Sariab Road, Quetta)",
      heroBadge: "EXCELLENCE IN HIGHER EDUCATION",
      heroTitle: college.name,
      heroSubtitle: college.tagline || "A historic institution committed to academic excellence, higher research, and professional student development.",
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
        { label: "CMS", link: `/login?collegeId=${college.id}&institute=${college.code}` },
        { label: "PROGRAMS", link: "#programs" },
        { label: "TIMETABLE & DATESHEET", link: "#notices" },
        { label: "SELF-SERVICE", link: "/print/challan" },
        { label: "PROFILE", link: "#about" }
      ],
      featuredProfiles: [
        {
          id: "prof-1",
          name: college.principalName || "Prof. Dr. Zahid Mengal",
          designation: "Principal & Head of Institution",
          department: "Office of the Principal",
          category: "PRINCIPAL",
          photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80",
          quote: "Committed to fostering academic distinction, critical inquiry, and character development for Balochistan's brightest minds.",
          message: `Welcome to ${college.name}. Our institution is dedicated to nurturing academic excellence, high ethical standards, and advanced career preparedness for all enrolled scholars.`,
          email: college.contactEmail || "principal@college.edu.pk",
          phone: college.contactPhone || "+92 81 9211000",
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

    const portalSettings = {
      ...defaultPortalSettings,
      ...customPortal,
      heroTitle: (customPortal as any)?.heroTitle || college.name,
      heroSubtitle: (customPortal as any)?.heroSubtitle || college.tagline || defaultPortalSettings.heroSubtitle,
    };

    const effectiveLogo = college.logoUrl || (customPortal as any)?.logoUrl || null;

    return NextResponse.json({
      ...college,
      logoUrl: effectiveLogo,
      portalSettings
    });
  } catch (error) {
    console.error("Error fetching college public portal data:", error);
    return NextResponse.json({ error: "Failed to load college portal details" }, { status: 500 });
  }
}

