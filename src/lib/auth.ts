import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// Valid roles in the system
export const VALID_ROLES = [
  "CHTE_ADMIN",
  "COLLEGE_ADMIN",
  "SUPER_ADMIN",
  "BS_CONTROLLER",
  "BS_FACULTY",
  "INTER_FACULTY",
  "PRINCIPAL",
  "STUDENT",
] as const;

export type UserRole = typeof VALID_ROLES[number];

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "college_cms_secure_secret_2026",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email",    placeholder: "admin@college.edu" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const rawInput = credentials.email.trim();
        const cleanInput = rawInput.toLowerCase();

        // Build list of target email candidates for usernames/aliases
        const targetEmails: string[] = [cleanInput];

        if (cleanInput === "chte" || cleanInput === "superadmin" || cleanInput === "super_admin") {
          targetEmails.push("chte@balochistan.gov.pk");
        } else if (cleanInput === "admin" || cleanInput === "admin@gpgcq.edu.pk" || cleanInput === "admin@gpgcq.edu") {
          targetEmails.push("admin@college.edu");
        } else if (cleanInput === "gscq" || cleanInput === "admin@gscq.edu") {
          targetEmails.push("admin@gscq.edu.pk");
        } else if (cleanInput === "gdcm" || cleanInput === "admin@gdcm.edu") {
          targetEmails.push("admin@gdcm.edu.pk");
        } else if (cleanInput === "controller" || cleanInput === "bs_controller") {
          targetEmails.push("controller@college.edu");
        } else if (cleanInput === "principal") {
          targetEmails.push("principal@college.edu");
        } else if (!cleanInput.includes("@")) {
          targetEmails.push(
            `${cleanInput}@balochistan.gov.pk`,
            `${cleanInput}@college.edu`,
            `${cleanInput}@gscq.edu.pk`,
            `${cleanInput}@gdcm.edu.pk`
          );
        }

        // Find user by exact email, username alias, or student roll number
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              ...targetEmails.map((e) => ({
                email: { equals: e, mode: "insensitive" as const },
              })),
              { student: { rollNumber: { equals: rawInput, mode: "insensitive" as const } } },
            ],
          },
          include: { student: true, faculty: true, college: true },
        });

        if (!user) return null;

        if (user.student && user.student.isActive === false)
          throw new Error("Your student account has been deactivated.");

        if (user.faculty && user.faculty.isActive === false)
          throw new Error("Your faculty account has been deactivated.");

        if (user.college && user.college.isActive === false)
          throw new Error("Your college has been deactivated or suspended by CHTE.");

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) return null;

        const rawLogo = user.college?.logoUrl;
        const safeLogo = typeof rawLogo === "string" && !rawLogo.startsWith("data:") && rawLogo.length < 256 ? rawLogo : null;

        return {
          id:          user.id,
          email:       user.email,
          name:        user.name,
          role:        user.role,
          collegeId:   user.collegeId || null,
          collegeName: user.college?.name || null,
          collegeLogo: safeLogo,
          collegeCode: user.college?.code || null,
        } as any;
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role        = (user as any).role;
        token.id          = user.id;
        token.collegeId   = (user as any).collegeId;
        token.collegeName = (user as any).collegeName;
        const logo = (user as any).collegeLogo;
        // Never put base64 data URLs in JWT cookies as they cause 494 REQUEST_HEADER_TOO_LARGE
        token.collegeLogo = typeof logo === "string" && !logo.startsWith("data:") && logo.length < 256 ? logo : null;
        token.collegeCode = (user as any).collegeCode;
      }
      // Sanitize existing incoming tokens so bloated cookies get stripped
      if (typeof token.collegeLogo === "string" && (token.collegeLogo.startsWith("data:") || token.collegeLogo.length >= 256)) {
        token.collegeLogo = null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role        = token.role;
        (session.user as any).id          = token.id;
        (session.user as any).collegeId   = token.collegeId;
        (session.user as any).collegeName = token.collegeName;
        (session.user as any).collegeLogo = token.collegeLogo;
        (session.user as any).collegeCode = token.collegeCode;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  }
};

