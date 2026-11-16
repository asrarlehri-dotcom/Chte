"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { School, Building2, ShieldCheck, MapPin, Lock } from "lucide-react";

type Program = {
  id: string;
  name: string;
  code: string;
};

interface CollegeOption {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  tagline: string | null;
  district: string | null;
}

const ADMISSION_TYPES = [
  {
    value: "REGULAR",
    label: "BS Regular",
    sub: "1st Semester – Fresh admission",
    icon: "🎓",
  },
  {
    value: "BRIDGING_5TH",
    label: "BS 5th / Bridging",
    sub: "For ADA / ADS degree holders",
    icon: "🔗",
  },
  {
    value: "MIGRATION",
    label: "Migration",
    sub: "Transferring from another university",
    icon: "🔄",
  },
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const CURRENT_YEAR = new Date().getFullYear().toString();

function AdmissionFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const sessionUser = session?.user as any;
  const userCollegeId = sessionUser?.collegeId;
  const userRole = sessionUser?.role;
  const isCollegeAdmin = Boolean(
    userCollegeId &&
    userRole !== "SUPER_ADMIN" &&
    userRole !== "CHTE_ADMIN"
  );

  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");
  const [selectedCollege, setSelectedCollege] = useState<CollegeOption | null>(null);

  const [programs, setPrograms] = useState<Program[]>([]);

  // Form State
  const [studentName, setStudentName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [cnic, setCnic] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [residentAddress, setResidentAddress] = useState("");

  const [admissionSettings, setAdmissionSettings] = useState<any>({
    requiredFields: ["studentName", "fatherName", "cnic", "dateOfBirth", "contactNumber", "email"],
    cnicLength: 15,
    contactLength: 11,
    customFields: []
  });
  
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const [programId, setProgramId] = useState("");
  const [entryYear, setEntryYear] = useState(CURRENT_YEAR);
  const [bsAdmissionType, setBsAdmissionType] = useState("REGULAR");
  const [migrationSemester, setMigrationSemester] = useState("");
  const [gender, setGender] = useState("MALE");

  const getCalculatedSession = () => {
    const startYear = parseInt(entryYear) || new Date().getFullYear();
    if (bsAdmissionType === "REGULAR") {
      return `${startYear}-${startYear + 4}`;
    } else if (bsAdmissionType === "BRIDGING_5TH") {
      return `${startYear}-${startYear + 2}`;
    } else if (bsAdmissionType === "MIGRATION") {
      const sem = parseInt(migrationSemester) || 1;
      const offset = Math.floor((sem - 1) / 2);
      const batchStart = startYear - offset;
      return `${batchStart}-${batchStart + 4}`;
    }
    return `${startYear}-${startYear + 4}`;
  };

  // SSC Qualifications
  const [sscGroup, setSscGroup] = useState("SCIENCE");
  const [sscObtained, setSscObtained] = useState("");
  const [sscTotal, setSscTotal] = useState("1100");
  const [sscYear, setSscYear] = useState("");
  const [sscBoard, setSscBoard] = useState("BBISE QUETTA");

  // HSSC Qualifications
  const [hsscGroup, setHsscGroup] = useState("PRE_MEDICAL");
  const [hsscObtained, setHsscObtained] = useState("");
  const [hsscTotal, setHsscTotal] = useState("1100");
  const [hsscYear, setHsscYear] = useState("");
  const [hsscBoard, setHsscBoard] = useState("BBISE QUETTA");

  // B.Sc / ADP Qualifications
  const [bscGroup, setBscGroup] = useState("B_SC");
  const [bscObtained, setBscObtained] = useState("");
  const [bscTotal, setBscTotal] = useState("800");
  const [bscYear, setBscYear] = useState("");
  const [bscBoard, setBscBoard] = useState("UNIVERSITY OF BALOCHISTAN");

  // Migration Previous Marks
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [prevMarks, setPrevMarks] = useState<Record<string, { obtained: string, total: string }>>({});

  const previousCourses = allCourses.filter((c: any) => c.semester < (Number(migrationSemester) || 1));

  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{ admissionId: string; challanId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Derive unique sorted districts from fetched colleges
  const districts = useMemo(() => {
    const dSet = new Set<string>();
    colleges.forEach((col) => {
      if (col.district && col.district.trim()) {
        dSet.add(col.district.trim());
      }
    });
    return Array.from(dSet).sort((a, b) => a.localeCompare(b));
  }, [colleges]);

  // If college admin, only their own college is visible!
  // If student / CHTE portal, colleges are filtered by selected district.
  const filteredColleges = useMemo(() => {
    if (isCollegeAdmin && userCollegeId) {
      return colleges.filter((c) => c.id === userCollegeId);
    }
    if (selectedDistrict === "ALL") {
      return colleges;
    }
    return colleges.filter(
      (c) => c.district?.trim().toLowerCase() === selectedDistrict.trim().toLowerCase()
    );
  }, [colleges, selectedDistrict, isCollegeAdmin, userCollegeId]);

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    const matching =
      district === "ALL"
        ? colleges
        : colleges.filter((c) => c.district?.trim().toLowerCase() === district.trim().toLowerCase());

    if (matching.length > 0) {
      const isStillInMatching = matching.some((c) => c.id === selectedCollegeId);
      if (!isStillInMatching) {
        setSelectedCollegeId(matching[0].id);
        setSelectedCollege(matching[0]);
        setProgramId("");
      }
    } else {
      setSelectedCollegeId("");
      setSelectedCollege(null);
      setProgramId("");
    }
  };

  const handleCollegeChange = (id: string) => {
    setSelectedCollegeId(id);
    const chosen = colleges.find((c) => c.id === id) || null;
    setSelectedCollege(chosen);
    setProgramId("");
  };

  // 1. Fetch Colleges and match URL query param / Admin College
  useEffect(() => {
    fetch("/api/public/colleges")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setColleges(data);

          // If College Admin: lock directly to their college
          if (isCollegeAdmin && userCollegeId) {
            const adminCol = data.find((c: any) => c.id === userCollegeId);
            if (adminCol) {
              setSelectedCollegeId(adminCol.id);
              setSelectedCollege(adminCol);
              if (adminCol.district) setSelectedDistrict(adminCol.district);
              return;
            }
          }

          // Student / Public mode
          const paramCollegeId = searchParams.get("collegeId");
          const paramInstitute = searchParams.get("institute");
          let initial = null;
          if (paramCollegeId) {
            initial = data.find((c: any) => c.id === paramCollegeId);
          } else if (paramInstitute) {
            initial = data.find((c: any) => c.code.toLowerCase() === paramInstitute.toLowerCase());
          }
          const chosen = initial || data[0];
          if (chosen) {
            setSelectedCollegeId(chosen.id);
            setSelectedCollege(chosen);
            if ((paramCollegeId || paramInstitute) && chosen.district) {
              setSelectedDistrict(chosen.district);
            }
          }
        }
      })
      .catch(() => {});

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        let parsedCustomFields = [];
        if (data.ADMISSION_CUSTOM_FIELDS) {
          try {
            parsedCustomFields = JSON.parse(data.ADMISSION_CUSTOM_FIELDS);
          } catch (e) {}
        }
        setAdmissionSettings({
          requiredFields: data.ADMISSION_REQUIRED_FIELDS
            ? data.ADMISSION_REQUIRED_FIELDS.split(",").map((s: string) => s.trim())
            : ["studentName", "fatherName", "cnic", "dateOfBirth", "contactNumber", "email"],
          cnicLength: parseInt(data.ADMISSION_CNIC_LENGTH) || 15,
          contactLength: parseInt(data.ADMISSION_CONTACT_LENGTH) || 11,
          customFields: parsedCustomFields,
        });
      })
      .catch(() => {});
  }, [searchParams, isCollegeAdmin, userCollegeId]);

  // Synchronize college selection when session finishes loading for College Admin
  useEffect(() => {
    if (isCollegeAdmin && userCollegeId && colleges.length > 0) {
      const adminCol = colleges.find((c) => c.id === userCollegeId);
      if (adminCol && selectedCollegeId !== adminCol.id) {
        setSelectedCollegeId(adminCol.id);
        setSelectedCollege(adminCol);
        if (adminCol.district) setSelectedDistrict(adminCol.district);
      }
    }
  }, [isCollegeAdmin, userCollegeId, colleges, selectedCollegeId]);

  // 2. Fetch Programs scoped to selected college
  useEffect(() => {
    const url = selectedCollegeId ? `/api/public/programs?collegeId=${selectedCollegeId}` : "/api/public/programs";
    fetch(url)
      .then(res => res.json())
      .then(data => setPrograms(Array.isArray(data) ? data : []))
      .catch(() => setPrograms([]));
  }, [selectedCollegeId]);

  useEffect(() => {
    if (!programId) {
      setAllCourses([]);
      return;
    }
    fetch(`/api/public/courses?programId=${programId}`)
      .then(res => res.json())
      .then(data => setAllCourses(Array.isArray(data) ? data : []))
      .catch(() => setAllCourses([]));
  }, [programId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!programId) {
      setError("Please select a program.");
      return;
    }
    if (bsAdmissionType === "MIGRATION") {
      if (!migrationSemester) {
        setError("Please select the semester you are migrating into.");
        return;
      }
      // Validate all courses have obtained marks entered
      for (const course of previousCourses) {
        const mark = prevMarks[course.id];
        if (!mark || !mark.obtained || !mark.total) {
          setError(`Please enter obtained and total marks for the course: ${course.title} (${course.code})`);
          return;
        }
      }
    }
    if (bsAdmissionType === "BRIDGING_5TH") {
      if (!bscObtained || !bscTotal || !bscYear || !bscBoard) {
        setError("Please complete all B.Sc / ADP Academic Qualification details.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          fatherName,
          cnic,
          dateOfBirth,
          contactNumber,
          email,
          residentAddress,
          customFields: JSON.stringify(customFieldValues),
          educationLevel: "BS",
          programId,
          groupId: null,
          bsAdmissionType,
          migrationSemester: bsAdmissionType === "MIGRATION" ? Number(migrationSemester) : null,
          session: getCalculatedSession(),
          gender,
          sscGroup,
          sscObtained: sscObtained ? Number(sscObtained) : null,
          sscTotal: sscTotal ? Number(sscTotal) : null,
          sscYear: sscYear ? Number(sscYear) : null,
          sscBoard,
          hsscGroup,
          hsscObtained: hsscObtained ? Number(hsscObtained) : null,
          hsscTotal: hsscTotal ? Number(hsscTotal) : null,
          hsscYear: hsscYear ? Number(hsscYear) : null,
          hsscBoard,
          bscGroup: bsAdmissionType === "BRIDGING_5TH" ? bscGroup : null,
          bscObtained: bsAdmissionType === "BRIDGING_5TH" ? (bscObtained ? Number(bscObtained) : null) : null,
          bscTotal: bsAdmissionType === "BRIDGING_5TH" ? (bscTotal ? Number(bscTotal) : null) : null,
          bscYear: bsAdmissionType === "BRIDGING_5TH" ? (bscYear ? Number(bscYear) : null) : null,
          bscBoard: bsAdmissionType === "BRIDGING_5TH" ? bscBoard : null,
          previousMarksJson: bsAdmissionType === "MIGRATION"
            ? JSON.stringify(previousCourses.map(c => ({
                courseId: c.id,
                obtainedMarks: Number(prevMarks[c.id]?.obtained || 0),
                totalMarks: Number(prevMarks[c.id]?.total || 100)
              })))
            : null,
          collegeId: selectedCollegeId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessData({ admissionId: data.admission.id, challanId: data.challanId });
      } else {
        const data = await res.json();
        setError(data.error || "Submission failed");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-gray-100">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
            ✓
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Application Submitted!</h2>
          <p className="text-gray-600 mb-8 font-medium">
            Your admission application has been received. Please print your form and challan below.
          </p>
          
          <div className="space-y-4 mb-8">
            <a
              href={`/print/admission/${successData.admissionId}?autoPrint=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors w-full font-bold shadow-md hover:shadow-lg"
            >
              📄 Print Admission Form (Portrait)
            </a>
            <a
              href={`/print/challan/${successData.challanId}?autoPrint=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors w-full font-bold shadow-md hover:shadow-lg"
            >
              🧾 Print Processing Challan (Landscape)
            </a>
          </div>

          <button
            onClick={() => router.push("/")}
            className="text-gray-500 hover:text-gray-700 font-semibold transition-colors underline underline-offset-4 text-sm"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 sm:p-10 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-blue-300" />
            CHTE Balochistan Official Admission Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            {selectedCollege ? `${selectedCollege.name}` : "BS Admission Application"}
          </h1>
          <p className="mt-1 opacity-90 text-xs sm:text-sm text-blue-100">
            {selectedCollege?.tagline || "Fill in the form below to apply for the BS Academic Degree Program."}
          </p>
        </div>

        <div className="p-6 sm:p-10 space-y-10">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ── 0. Target Institution / College Selection ── */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-blue-50/60 border border-blue-200/90 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-blue-200/60">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-700" />
                  <h3 className="text-sm font-black text-blue-950 uppercase tracking-wide">
                    Target Institution / College Selection
                  </h3>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                    isCollegeAdmin
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {isCollegeAdmin
                    ? "🔒 College Admin Campus Mode"
                    : "🌐 CHTE Balochistan Public Portal"}
                </span>
              </div>

              {isCollegeAdmin ? (
                /* College Admin Mode: ONLY their college is visible, no other colleges, locked badge */
                <div className="bg-white rounded-xl border border-blue-300/90 p-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {selectedCollege?.logoUrl ? (
                        <img
                          src={selectedCollege.logoUrl}
                          alt="Logo"
                          className="w-12 h-12 object-contain rounded-xl bg-white p-1 border border-blue-100 shadow-xs flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white font-black flex items-center justify-center flex-shrink-0 text-sm shadow-xs">
                          {selectedCollege?.code?.substring(0, 3) || sessionUser?.collegeCode?.substring(0, 3) || "COL"}
                        </div>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-black text-slate-900">
                            {selectedCollege?.name || sessionUser?.collegeName || "Your College Campus"}
                          </h4>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-black rounded-md">
                            {selectedCollege?.code || sessionUser?.collegeCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span>
                            {selectedCollege?.district ? `District: ${selectedCollege.district}` : "Campus"} • Higher & Technical Education Department
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-semibold self-start sm:self-auto">
                      <Lock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                      <span>Direct Campus Entry (Other colleges restricted)</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Public / Student Mode: District selection filter + Filtered Colleges dropdown */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* District Filter Dropdown */}
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>1. Select District / ضلع منتخب کریں</span>
                      </label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-xs sm:text-sm text-slate-900 shadow-xs outline-none"
                      >
                        <option value="ALL">🌐 All Districts ({colleges.length} Colleges)</option>
                        {districts.map((d) => {
                          const countInDistrict = colleges.filter(
                            (c) => c.district?.trim().toLowerCase() === d.toLowerCase()
                          ).length;
                          return (
                            <option key={d} value={d}>
                              📍 {d} ({countInDistrict} {countInDistrict === 1 ? "College" : "Colleges"})
                            </option>
                          );
                        })}
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Filter institutions by your local district
                      </span>
                    </div>

                    {/* College Selector Dropdown (shows only colleges in selected district) */}
                    <div className="sm:col-span-7">
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-blue-600" />
                        <span>2. Select College / کالج منتخب کریں</span>
                      </label>
                      <select
                        value={selectedCollegeId}
                        onChange={(e) => handleCollegeChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-xs sm:text-sm text-slate-900 shadow-xs outline-none"
                      >
                        {filteredColleges.length === 0 ? (
                          <option value="" disabled>
                            No colleges found in {selectedDistrict}
                          </option>
                        ) : (
                          filteredColleges.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.name} ({col.code}){col.district ? ` — ${col.district}` : ""}
                            </option>
                          ))
                        )}
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {filteredColleges.length}{" "}
                        {filteredColleges.length === 1 ? "college" : "colleges"} available{" "}
                        {selectedDistrict !== "ALL" ? `in ${selectedDistrict}` : "across Balochistan"}
                      </span>
                    </div>
                  </div>

                  {/* Selected College Preview Card */}
                  {selectedCollege && (
                    <div className="bg-white/95 p-3 rounded-xl border border-blue-200 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {selectedCollege.logoUrl ? (
                          <img
                            src={selectedCollege.logoUrl}
                            alt="Logo"
                            className="w-9 h-9 object-contain rounded-lg flex-shrink-0 border border-slate-100 bg-white"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center flex-shrink-0 text-xs">
                            {selectedCollege.code.substring(0, 3)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {selectedCollege.name} ({selectedCollege.code})
                          </div>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {selectedCollege.district
                              ? `${selectedCollege.district} District`
                              : "Balochistan"}{" "}
                            Campus
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex-shrink-0 hidden sm:inline-flex items-center gap-1">
                        ✓ Selected Campus
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 1. Personal Details ──────────────────────── */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-5">
                1. Personal Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student Name {admissionSettings.requiredFields.includes("studentName") && <span className="text-red-500">*</span>}</label>
                  <input type="text" required={admissionSettings.requiredFields.includes("studentName")}
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={studentName} onChange={e => setStudentName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Father's Name {admissionSettings.requiredFields.includes("fatherName") && <span className="text-red-500">*</span>}</label>
                  <input type="text" required={admissionSettings.requiredFields.includes("fatherName")}
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={fatherName} onChange={e => setFatherName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CNIC / Form B {admissionSettings.requiredFields.includes("cnic") && <span className="text-red-500">*</span>}</label>
                  <input type="text" required={admissionSettings.requiredFields.includes("cnic")} placeholder="12345-1234567-1"
                    maxLength={admissionSettings.cnicLength}
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={cnic} onChange={e => setCnic(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth {admissionSettings.requiredFields.includes("dateOfBirth") && <span className="text-red-500">*</span>}</label>
                  <input type="date" required={admissionSettings.requiredFields.includes("dateOfBirth")}
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Number {admissionSettings.requiredFields.includes("contactNumber") && <span className="text-red-500">*</span>}</label>
                  <input type="tel" required={admissionSettings.requiredFields.includes("contactNumber")}
                    maxLength={admissionSettings.contactLength}
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address {admissionSettings.requiredFields.includes("email") && <span className="text-red-500">*</span>}</label>
                  <input type="email" required={admissionSettings.requiredFields.includes("email")}
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender {admissionSettings.requiredFields.includes("gender") && <span className="text-red-500">*</span>}</label>
                  <select required={admissionSettings.requiredFields.includes("gender")}
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Resident Address {admissionSettings.requiredFields.includes("residentAddress") && <span className="text-red-500">*</span>}</label>
                  <textarea required={admissionSettings.requiredFields.includes("residentAddress")} rows={2}
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={residentAddress} onChange={e => setResidentAddress(e.target.value)} />
                </div>
                {admissionSettings.customFields.map((cf: any) => (
                  <div key={cf.id} className={cf.type === 'text' ? "sm:col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700">{cf.label} {cf.required && <span className="text-red-500">*</span>}</label>
                    <input type={cf.type} required={cf.required}
                      className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={customFieldValues[cf.id] || ""}
                      onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── 2. Program & Session ─────────────────────── */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-5">
                2. Program & Session
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Program */}
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={programId}
                    onChange={e => setProgramId(e.target.value)}
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">-- Choose Program --</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.code ? `(${p.code})` : ""}
                      </option>
                    ))}
                  </select>
                  {programs.length === 0 && (
                    <p className="mt-1 text-xs text-gray-400">Loading programs...</p>
                  )}
                </div>

                {/* Session */}
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Admission Year
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      required
                      min="2000"
                      max="2099"
                      value={entryYear}
                      onChange={e => setEntryYear(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEntryYear(CURRENT_YEAR)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:underline font-medium"
                    >
                      Reset to {CURRENT_YEAR}
                    </button>
                  </div>
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Allocated Session:</span>
                    <span className="font-bold text-blue-700 font-mono text-sm">{getCalculatedSession()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 3. Academic Qualifications ───────────────── */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-5">
                3. Academic Qualifications
              </h2>
              
              <div className="space-y-6">
                {/* SSC Matrix Card */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">🎓 SSC / Matric Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Group</label>
                      <select required value={sscGroup} onChange={e => setSscGroup(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="SCIENCE">Science</option>
                        <option value="HUMANITIES">Humanities / Arts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Obtained Marks</label>
                      <input type="number" required placeholder="850" value={sscObtained} onChange={e => setSscObtained(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Total Marks</label>
                      <input type="number" required placeholder="1100" value={sscTotal} onChange={e => setSscTotal(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Passing Year</label>
                      <input type="number" required placeholder="2024" value={sscYear} onChange={e => setSscYear(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Board</label>
                      <input type="text" required value={sscBoard} onChange={e => setSscBoard(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                </div>

                {/* HSSC Matrix Card */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">🎓 HSSC / Intermediate Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Group</label>
                      <select required value={hsscGroup} onChange={e => setHsscGroup(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="PRE_MEDICAL">Pre-Medical</option>
                        <option value="PRE_ENGINEERING">Pre-Engineering</option>
                        <option value="HUMANITIES">Humanities / Arts</option>
                        <option value="ICS">ICS</option>
                        <option value="COMMERCE">Commerce</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Obtained Marks</label>
                      <input type="number" required placeholder="750" value={hsscObtained} onChange={e => setHsscObtained(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Total Marks</label>
                      <input type="number" required placeholder="1100" value={hsscTotal} onChange={e => setHsscTotal(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Passing Year</label>
                      <input type="number" required placeholder="2026" value={hsscYear} onChange={e => setHsscYear(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Board</label>
                      <input type="text" required value={hsscBoard} onChange={e => setHsscBoard(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                </div>

                {/* B.Sc / ADP Details Card */}
                {bsAdmissionType === "BRIDGING_5TH" && (
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">🎓 B.Sc / ADP Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600">Group / Degree</label>
                        <select required value={bscGroup} onChange={e => setBscGroup(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400">
                          <option value="B_SC">B.Sc (Physical/General Science)</option>
                          <option value="ADP_CS">ADP (Computer Science)</option>
                          <option value="ADP_SCIENCE">ADP (Science / Math)</option>
                          <option value="ADP_ARTS">ADP (Arts / Humanities)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600">Obtained Marks</label>
                        <input type="number" required placeholder="550" value={bscObtained} onChange={e => setBscObtained(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600">Total Marks</label>
                        <input type="number" required placeholder="800" value={bscTotal} onChange={e => setBscTotal(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600">Passing Year</label>
                        <input type="number" required placeholder="2026" value={bscYear} onChange={e => setBscYear(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600">University</label>
                        <input type="text" required value={bscBoard} onChange={e => setBscBoard(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Migration Previous Semester Courses Marks Card */}
                {bsAdmissionType === "MIGRATION" && migrationSemester && (
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">🔄 Previous Semester Course Marks</h3>
                      <p className="text-xs text-gray-500 mt-1">Please enter your obtained and total marks for courses of semesters prior to Semester {migrationSemester}.</p>
                    </div>

                    {previousCourses.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No college courses found for previous semesters. Please select a program first.</p>
                    ) : (
                      <div className="space-y-3">
                        {previousCourses.map((course: any) => (
                          <div key={course.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center border-b pb-2">
                            <div className="sm:col-span-6">
                              <span className="text-xs font-semibold text-gray-400 font-mono block">Semester {course.semester}</span>
                              <span className="text-sm font-bold text-gray-800">{course.title}</span>
                              <span className="text-xs text-gray-500 block">{course.code} • {course.creditHours} Credits</span>
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase">Obtained Marks</label>
                              <input
                                type="number"
                                required
                                min="0"
                                max={Number(prevMarks[course.id]?.total || 100)}
                                placeholder="Marks"
                                value={prevMarks[course.id]?.obtained || ""}
                                onChange={e => setPrevMarks(prev => ({
                                  ...prev,
                                  [course.id]: {
                                    obtained: e.target.value,
                                    total: prev[course.id]?.total || "100"
                                  }
                                }))}
                                className="w-full mt-1 px-3 py-1 border rounded text-xs outline-none focus:ring-2 focus:ring-blue-400"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase">Total Marks</label>
                              <input
                                type="number"
                                required
                                min="1"
                                placeholder="Total"
                                value={prevMarks[course.id]?.total || "100"}
                                onChange={e => setPrevMarks(prev => ({
                                  ...prev,
                                  [course.id]: {
                                    obtained: prev[course.id]?.obtained || "",
                                    total: e.target.value
                                  }
                                }))}
                                className="w-full mt-1 px-3 py-1 border rounded text-xs outline-none focus:ring-2 focus:ring-blue-400"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── 4. Admission Type ──────────────────────────── */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-5">
                4. Admission Type
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ADMISSION_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setBsAdmissionType(type.value);
                      setMigrationSemester("");
                    }}
                    className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                      bsAdmissionType === type.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className={`font-semibold text-sm ${bsAdmissionType === type.value ? "text-blue-700" : "text-gray-800"}`}>
                      {type.label}
                    </span>
                    <span className="text-xs text-gray-500 leading-snug">{type.sub}</span>
                  </button>
                ))}
              </div>

              {/* Migration Semester selector */}
              {bsAdmissionType === "MIGRATION" && (
                <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-5">
                  <label className="block text-sm font-semibold text-blue-800 mb-3">
                    🔄 Select Semester Migrating Into
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {SEMESTERS.map(sem => (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => setMigrationSemester(String(sem))}
                        className={`py-2 rounded-lg text-sm font-bold transition-all border-2 ${
                          migrationSemester === String(sem)
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:border-blue-400"
                        }`}
                      >
                        {sem}
                      </button>
                    ))}
                  </div>
                  {migrationSemester && (
                    <p className="mt-3 text-xs text-blue-700 font-medium">
                      ✅ Migrating into Semester {migrationSemester}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Submit ──────────────────────────────────── */}
            <div className="pt-2 border-t">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl shadow hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : `Submit Application to ${selectedCollege?.code || "College"}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdmissionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm font-semibold text-slate-500">Loading Admission Portal...</div>}>
      <AdmissionFormContent />
    </Suspense>
  );
}
