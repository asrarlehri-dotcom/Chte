import { PrismaClient } from "@prisma/client";

function cleanDbUrl(val?: string): string | undefined {
  if (!val) return val;
  let s = val.trim();
  while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  if (s.includes("postgresql://")) {
    s = s.substring(s.indexOf("postgresql://"));
  } else if (s.includes("postgres://")) {
    s = s.substring(s.indexOf("postgres://"));
  }
  s = s.replace(/["']+$/, "").trim();
  return s;
}

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = cleanDbUrl(process.env.DATABASE_URL);
}
if (process.env.DIRECT_URL) {
  process.env.DIRECT_URL = cleanDbUrl(process.env.DIRECT_URL);
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
