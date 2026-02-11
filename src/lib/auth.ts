import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { JWT } from "next-auth/jwt";

type RBACUser = {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  permissions: string[];
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            role: { include: { perms: { include: { permission: true } } } },
          },
        });
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        const roleName = user.role?.name;
        const perms = user.role?.perms?.map((rp) => rp.permission.name) ?? [];
        const rbacUser: RBACUser = {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          roles: roleName ? [roleName] : [],
          permissions: perms,
        };
        return rbacUser as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as RBACUser;
        (token as JWT & Partial<RBACUser>).roles = u.roles ?? [];
        (token as JWT & Partial<RBACUser>).permissions = u.permissions ?? [];
      }
      return token as JWT;
    },
    async session({ session, token }) {
      const t = token as JWT & Partial<RBACUser> & { sub?: string };
      (session as any).user.id = t.sub;
      (session as any).user.roles = t.roles ?? [];
      (session as any).user.permissions = t.permissions ?? [];
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
