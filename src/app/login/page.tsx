"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  School,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Home,
  ChevronDown
} from "lucide-react";

interface CollegeOption {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  district: string | null;
  principalName: string | null;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode defaults to "INSTITUTE" unless "?mode=chte" is explicitly in URL
  const modeParam = searchParams.get("mode");
  const [loginMode, setLoginMode] = useState<"INSTITUTE" | "CHTE">(
    modeParam === "chte" ? "CHTE" : "INSTITUTE"
  );
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");
  const [selectedCollege, setSelectedCollege] = useState<CollegeOption | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync mode with URL param
  useEffect(() => {
    const currentModeParam = searchParams.get("mode");
    if (currentModeParam === "chte") {
      setLoginMode("CHTE");
    } else if (currentModeParam === "institute") {
      setLoginMode("INSTITUTE");
    }
  }, [searchParams]);

  // Load Colleges for the "Login by Institute" dropdown
  useEffect(() => {
    fetch("/api/public/colleges")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setColleges(data);

          // Check if an institute is passed via URL
          const instituteCodeParam = searchParams.get("institute");
          const collegeIdParam = searchParams.get("collegeId");

          let matched = null;
          if (collegeIdParam) {
            matched = data.find((c) => c.id === collegeIdParam);
          } else if (instituteCodeParam) {
            matched = data.find(
              (c) => c.code.toLowerCase() === instituteCodeParam.toLowerCase()
            );
          }

          if (matched) {
            setSelectedCollegeId(matched.id);
            setSelectedCollege(matched);
          } else {
            // Default to saved college or first added college
            const savedCollegeId = localStorage.getItem("last_selected_college_id");
            const foundSaved = data.find((c) => c.id === savedCollegeId);
            const initial = foundSaved || data[0];
            setSelectedCollegeId(initial.id);
            setSelectedCollege(initial);
          }
        }
      })
      .catch((err) => console.error("Error loading colleges:", err));
  }, [searchParams]);

  const handleCollegeChange = (id: string) => {
    setSelectedCollegeId(id);
    const found = colleges.find((c) => c.id === id) || null;
    setSelectedCollege(found);
    if (id) {
      localStorage.setItem("last_selected_college_id", id);
    }
  };

  const handleSwitchMode = (newMode: "INSTITUTE" | "CHTE") => {
    setLoginMode(newMode);
    setError("");
    setEmail("");
    setPassword("");
    const newUrl = newMode === "CHTE" ? "/login?mode=chte" : "/login?mode=institute";
    router.replace(newUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password: password.trim(),
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setError("Ghalat email ya password. Barah-e-karam email aur password check karein (e.g. admin@college.edu / admin123).");
        } else {
          setError(res.error || "Authentication failed. Please verify your credentials.");
        }
        setLoading(false);
        return;
      }

      // Check user session to redirect properly
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      const role = sessionData?.user?.role;

      if (role === "CHTE_ADMIN" || role === "SUPER_ADMIN") {
        window.location.href = "/chte/colleges";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected authentication error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Glows */}
      <div
        className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          loginMode === "CHTE" ? "bg-emerald-600/15" : "bg-blue-600/15"
        }`}
      />
      <div
        className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          loginMode === "CHTE" ? "bg-teal-600/15" : "bg-indigo-600/15"
        }`}
      />

      {/* Top Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-all ${
              loginMode === "CHTE"
                ? "bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/20"
                : "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/20"
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-black text-white tracking-wider uppercase">
              {loginMode === "CHTE" ? "CHTE Central" : "CHTE"}
            </div>
            <div
              className={`text-[10px] font-bold uppercase tracking-widest ${
                loginMode === "CHTE" ? "text-emerald-400" : "text-blue-400"
              }`}
            >
              Govt. of Balochistan
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-semibold border border-slate-800 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center p-4 py-8 relative z-10">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header depending on mode */}
          {loginMode === "INSTITUTE" ? (
            /* ───────────────────────────────────────────────────────── */
            /* 1. INSTITUTE ONLY LOGIN VIEW                             */
            /* ───────────────────────────────────────────────────────── */
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">
                    College Institutional Login
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select your college to access campus portal & records.
                  </p>
                </div>
              </div>

              {/* Dynamic Added Colleges Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Added College ({colleges.length})
                </label>
                <div className="relative">
                  <select
                    value={selectedCollegeId}
                    onChange={(e) => handleCollegeChange(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer pr-10"
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.code}] {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Dynamic College Branding Card */}
              {selectedCollege && (
                <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/20 flex items-center gap-3.5 transition-all">
                  {selectedCollege.logoUrl ? (
                    <img
                      src={selectedCollege.logoUrl}
                      alt="Logo"
                      className="w-11 h-11 object-contain rounded-xl bg-slate-900 p-1 border border-blue-500/30 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md flex-shrink-0">
                      {selectedCollege.code.substring(0, 3)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {selectedCollege.code} Institutional Portal
                    </div>
                    <h3 className="text-xs font-bold text-white truncate mt-0.5">
                      {selectedCollege.name}
                    </h3>
                    {selectedCollege.district && (
                      <p className="text-[10px] text-slate-400 truncate">
                        District {selectedCollege.district}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ───────────────────────────────────────────────────────── */
            /* 2. CHTE ONLY LOGIN VIEW                                  */
            /* ───────────────────────────────────────────────────────── */
            <div className="text-center space-y-2 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                CHTE Central Platform
              </div>
              <h2 className="text-sm font-bold text-white">
                CHTE Master Portal
              </h2>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Apex Central Access for Institutional Provisioning, Policy & Oversight.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {loginMode === "INSTITUTE"
                  ? "College Email / Official Username"
                  : "CHTE Email Address"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder={
                    loginMode === "INSTITUTE"
                      ? selectedCollege?.code === "GSCQ"
                        ? "admin@gscq.edu.pk"
                        : "admin@college.edu"
                      : "chte@balochistan.gov.pk"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border text-xs text-white placeholder-slate-500 focus:outline-none ${
                    loginMode === "CHTE"
                      ? "border-slate-800 focus:border-emerald-500"
                      : "border-slate-800 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border text-xs text-white placeholder-slate-500 focus:outline-none ${
                    loginMode === "CHTE"
                      ? "border-slate-800 focus:border-emerald-500"
                      : "border-slate-800 focus:border-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white shadow-xl transition-all cursor-pointer disabled:opacity-50 mt-2 ${
                loginMode === "INSTITUTE"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30"
              }`}
            >
              <span>
                {loading
                  ? "Authenticating..."
                  : loginMode === "INSTITUTE"
                  ? `Sign In to ${selectedCollege?.code || "College"} Portal`
                  : "Sign In to CHTE Portal"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Footer Helper (Showing ONLY the corresponding credential) */}
          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Demo Quick Credential:
            </div>
            {loginMode === "INSTITUTE" ? (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const isGscq = selectedCollege?.code === "GSCQ";
                    setEmail(isGscq ? "admin@gscq.edu.pk" : "admin@college.edu");
                    setPassword("admin123");
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-xs">
                      {selectedCollege?.code || "College"} Admin
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {selectedCollege?.code === "GSCQ" ? "admin@gscq.edu.pk" : "admin@college.edu"}
                    </div>
                  </div>
                  <div className="text-blue-400 font-mono text-xs font-bold bg-blue-500/10 px-2 py-1 rounded">
                    admin123
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("controller@college.edu");
                      setPassword("demo123");
                    }}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors"
                  >
                    <div className="font-bold text-slate-300 text-[11px]">BS Controller</div>
                    <div className="text-slate-500 text-[10px]">demo123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail("principal@college.edu");
                      setPassword("demo123");
                    }}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors"
                  >
                    <div className="font-bold text-slate-300 text-[11px]">Principal</div>
                    <div className="text-slate-500 text-[10px]">demo123</div>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEmail("chte@balochistan.gov.pk");
                  setPassword("chte123");
                }}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-xs">CHTE Master Admin</div>
                  <div className="text-slate-400 text-[11px]">chte@balochistan.gov.pk</div>
                </div>
                <div className="text-emerald-400 font-mono text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">
                  chte123
                </div>
              </button>
            )}
          </div>

          {/* Switch Portal Link */}
          <div className="pt-2 text-center border-t border-slate-800/50">
            {loginMode === "CHTE" ? (
              <button
                type="button"
                onClick={() => handleSwitchMode("INSTITUTE")}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Are you a College Administrator?</span>
                <span className="text-blue-400 font-bold hover:underline">
                  Login by Institute →
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSwitchMode("CHTE")}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>CHTE Central Official?</span>
                <span className="text-emerald-400 font-bold hover:underline">
                  Switch to CHTE Portal Login →
                </span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center border-t border-slate-800/60 bg-slate-950 text-slate-400 text-xs relative z-10">
        © {new Date().getFullYear()} Higher & Technical Education (CHTE) Balochistan. All Rights Reserved.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Loading CHTE Portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
