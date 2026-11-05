import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route prefix → allowed roles (empty array = all authenticated users)
const ROUTE_ROLES: Record<string, string[]> = {
  "/chte":                  ["CHTE_ADMIN", "SUPER_ADMIN"],
  "/admin":                 ["CHTE_ADMIN", "SUPER_ADMIN", "COLLEGE_ADMIN"],
  "/intermediate":          ["CHTE_ADMIN", "SUPER_ADMIN", "COLLEGE_ADMIN", "INTER_FACULTY", "PRINCIPAL"],
  "/bs":                    ["CHTE_ADMIN", "SUPER_ADMIN", "COLLEGE_ADMIN", "BS_CONTROLLER", "BS_FACULTY", "PRINCIPAL", "STUDENT"],
  "/faculty":               ["CHTE_ADMIN", "SUPER_ADMIN", "COLLEGE_ADMIN", "BS_FACULTY", "INTER_FACULTY"],
  "/student":               ["STUDENT"],
  "/dashboard":             [], // all authenticated
};

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const protectedPrefixes = ["/chte", "/admin", "/intermediate", "/bs", "/faculty", "/student", "/dashboard"];
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET || "college_cms_secure_secret_2026";
  const hasSecureCookie = !!req.cookies.get("__Secure-next-auth.session-token");
  const isHttps = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https" || hasSecureCookie;

  let token = await getToken({ req, secret, secureCookie: isHttps });
  if (!token && !isHttps) {
    token = await getToken({ req, secret, secureCookie: true });
  } else if (!token && isHttps) {
    token = await getToken({ req, secret, secureCookie: false });
  }

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (token.role as string) || "";

  // Super admins and CHTE master admins have unrestricted access
  if (userRole === "SUPER_ADMIN" || userRole === "CHTE_ADMIN") return NextResponse.next();

  // Check route restrictions
  for (const [route, allowedRoles] of Object.entries(ROUTE_ROLES)) {
    if (path.startsWith(route)) {
      if (allowedRoles.length === 0) return NextResponse.next();
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/chte/:path*",
    "/admin/:path*",
    "/intermediate/:path*",
    "/bs/:path*",
    "/faculty/:path*",
    "/student/:path*",
    "/dashboard/:path*",
  ],
};
