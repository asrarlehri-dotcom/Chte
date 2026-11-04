import { PrismaClient } from "@prisma/client";

const NEON_DATABASE_URL =
  "postgresql://neondb_owner:npg_U76IhBZpMlNQ@ep-frosty-queen-bdj4dfag-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=30";
const NEON_DIRECT_URL =
  "postgresql://neondb_owner:npg_U76IhBZpMlNQ@ep-frosty-queen-bdj4dfag.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=30";

function sanitizeUrl(val: string | undefined, fallback: string): string {
  if (!val) return fallback;
  let s = val.trim();
  // Strip any wrapping quotes
  while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  // Strip variable name prefix if user pasted 'DATABASE_URL=postgresql://...'
  if (s.startsWith("DATABASE_URL=")) {
    s = s.replace("DATABASE_URL=", "").trim();
  }
  if (s.startsWith("DIRECT_URL=")) {
    s = s.replace("DIRECT_URL=", "").trim();
  }
  // Strip quotes again in case they were inside DATABASE_URL="..."
  while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  // If it contains the placeholder 'example.com' or doesn't have postgres protocol
  if (s.includes("example.com") || (!s.startsWith("postgresql://") && !s.startsWith("postgres://"))) {
    return fallback;
  }
  return s;
}

process.env.DATABASE_URL = sanitizeUrl(process.env.DATABASE_URL, NEON_DATABASE_URL);
process.env.DIRECT_URL = sanitizeUrl(process.env.DIRECT_URL, NEON_DIRECT_URL);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
