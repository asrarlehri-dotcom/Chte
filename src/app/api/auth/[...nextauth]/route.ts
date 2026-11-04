import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

function initNextAuthUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
  if (host) {
    process.env.NEXTAUTH_URL = `${proto}://${host}`;
  }
}

export async function GET(req: NextRequest, ctx: any) {
  initNextAuthUrl(req);
  return (NextAuth(authOptions) as any)(req, ctx);
}

export async function POST(req: NextRequest, ctx: any) {
  initNextAuthUrl(req);
  return (NextAuth(authOptions) as any)(req, ctx);
}
