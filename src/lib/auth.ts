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
  secret: process.env.NEXTAUTH_SECRET || "supersecret_for_development",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email",    placeholder: "admin@college.edu" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { student: true, faculty: true, college: true }
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

        return {
          id:          user.id,
          email:       user.email,
          name:        user.name,
          role:        user.role,
          collegeId:   user.collegeId || null,
          collegeName: user.college?.name || null,
          collegeLogo: user.college?.logoUrl || null,
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
        token.collegeLogo = (user as any).collegeLogo;
        token.collegeCode = (user as any).collegeCode;
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

