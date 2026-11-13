"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export type SystemConfig = {
  COLLEGE_NAME?: string;
  COLLEGE_LOGO?: string;
  COLLEGE_BACKGROUND?: string;
  COLLEGE_WATERMARK?: string;
  COLLEGE_TAGLINE?: string;
  COLLEGE_ADDRESS?: string;
  COLLEGE_CODE?: string;
  CHALLAN_BANK_ACCOUNT?: string;
  CHALLAN_BANK_NAME?: string;
  CHALLAN_BRANCH_CODE?: string;
  CHALLAN_ACCOUNT_TITLE?: string;
  CHALLAN_SEQUENCE_START?: string;
  CHALLAN_SEQUENCE_CURRENT?: string;
  ROLL_NUMBER_PATTERN?: string;
  ROLL_SEQUENCE_CURRENT?: string;
  DEFAULT_FACULTY_PASSWORD?: string;
  FACULTY_EMAIL_DOMAIN?: string;
  [key: string]: string | undefined;
};

export function useSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SystemConfig>({});
  const [loading, setLoading] = useState(true);

  const sessionUser = session?.user as any;
  const userCollegeId = sessionUser?.collegeId;

  useEffect(() => {
    const url = userCollegeId ? `/api/settings?collegeId=${userCollegeId}` : "/api/settings";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setSettings(data);
        }
      })
      .catch((err) => console.error("Error loading system settings:", err))
      .finally(() => setLoading(false));
  }, [userCollegeId]);

  const resolvedCollegeName = userCollegeId
    ? (settings.COLLEGE_NAME || sessionUser?.collegeName || "Govt. Degree College")
    : (settings.COLLEGE_NAME || sessionUser?.collegeName || "Government Post Graduate College Quetta");

  const resolvedCollegeLogo = userCollegeId
    ? (settings.COLLEGE_LOGO || sessionUser?.collegeLogo || "")
    : (settings.COLLEGE_LOGO || sessionUser?.collegeLogo || "");

  return {
    settings,
    loading,
    collegeName: resolvedCollegeName,
    collegeLogo: resolvedCollegeLogo,
    collegeBackground: settings.COLLEGE_BACKGROUND || settings.COLLEGE_WATERMARK || resolvedCollegeLogo,
    collegeWatermark: settings.COLLEGE_WATERMARK || settings.COLLEGE_BACKGROUND || resolvedCollegeLogo,
    collegeTagline: settings.COLLEGE_TAGLINE || "College of Higher Education & Research",
    collegeAddress: settings.COLLEGE_ADDRESS || (userCollegeId ? "Balochistan, Pakistan" : "Quetta, Balochistan, Pakistan"),
    collegeCode: sessionUser?.collegeCode || settings.COLLEGE_CODE || "",
    collegeId: userCollegeId || null,
  };
}
