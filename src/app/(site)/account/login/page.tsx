import type { Metadata } from "next";
import { isGoogleSignInConfigured } from "@/auth";
import { AccountLoginForm } from "@/components/account/account-login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function AccountLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-14">
      <div className="mb-8 text-center">
        <span
          className="blob mx-auto flex h-14 w-14 items-center justify-center bg-gradient-to-br from-chili to-saffron text-2xl font-heading font-bold text-white"
          aria-hidden
        >
          K
        </span>
        <h1 className="mt-4 font-heading text-2xl font-extrabold">Sign in</h1>
        <p className="mt-1 text-sm text-ink-soft">Track orders, manage returns, and get support faster.</p>
      </div>

      <AccountLoginForm googleEnabled={isGoogleSignInConfigured} />
    </div>
  );
}
