import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** "admin" for staff/admin-panel sessions, "customer" for storefront account sessions. */
      audience?: "admin" | "customer";
      role: string;
      customerId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    audience?: "admin" | "customer";
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    audience?: "admin" | "customer";
    role?: string;
    customerId?: string;
  }
}

// next-auth/jwt.d.ts only re-exports ("export * from") @auth/core/jwt's JWT interface, so the
// augmentation above doesn't merge into the actual type the jwt/session callbacks see — that one
// has to be augmented directly on @auth/core/jwt itself.
declare module "@auth/core/jwt" {
  interface JWT {
    audience?: "admin" | "customer";
    role?: string;
    customerId?: string;
  }
}
