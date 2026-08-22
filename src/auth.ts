import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    // Admin/staff sign-in — unchanged from before, default provider id "credentials".
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const admin = await prisma.adminUser.findUnique({ where: { email } });
        if (!admin || !admin.active) return null;

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) return null;

        return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
      },
    }),
    // Customer account sign-in (email + password set at signup) — distinct id so it never gets
    // confused with the admin credentials provider above.
    Credentials({
      id: "customer-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const customer = await prisma.customer.findUnique({ where: { email: email.toLowerCase() } });
        if (!customer?.passwordHash) return null;

        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid) return null;

        return { id: customer.id, email: customer.email, name: customer.name };
      },
    }),
    // Only registered when GOOGLE_CLIENT_ID/SECRET are set, so the app still boots without them
    // (same "optional until configured" pattern as Resend/Twilio elsewhere in this app).
    ...(googleConfigured
      ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! })]
      : []),
  ],
  callbacks: {
    // Route protection lives in src/proxy.ts (admin) and per-page requireCustomer() checks
    // (account portal) -- both gate on `audience`, never on "a session merely exists", since an
    // authenticated customer must never be treated as an authenticated admin or vice versa.
    async jwt({ token, user, account }) {
      if (account?.provider === "credentials" && user) {
        token.audience = "admin";
        token.role = user.role;
      } else if (account?.provider === "customer-credentials" && user) {
        token.audience = "customer";
        token.customerId = user.id;
      } else if (account?.provider === "google" && user?.email) {
        // First Google sign-in for this email creates the Customer record (or claims an
        // existing order-derived one); phone is unknown from Google and collected later.
        const customer = await prisma.customer.upsert({
          where: { email: user.email.toLowerCase() },
          update: { authProvider: "google" },
          create: {
            email: user.email.toLowerCase(),
            name: user.name ?? user.email,
            phone: "",
            authProvider: "google",
          },
        });
        token.audience = "customer";
        token.customerId = customer.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.audience = token.audience;
        if (token.audience === "admin") {
          session.user.role = token.role ?? "staff";
        } else if (token.audience === "customer") {
          session.user.customerId = token.customerId;
        }
      }
      return session;
    },
  },
});

export const isGoogleSignInConfigured = googleConfigured;
