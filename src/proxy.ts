import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return;

  if (!req.auth?.user) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const role = req.auth.user.role ?? "staff";

  // POS-only staff are confined to the POS screen.
  if (role === "pos" && !pathname.startsWith("/admin/pos")) {
    return NextResponse.redirect(new URL("/admin/pos", req.url));
  }

  // User management and the audit log are admin-only.
  if (
    (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/audit-log")) &&
    role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
