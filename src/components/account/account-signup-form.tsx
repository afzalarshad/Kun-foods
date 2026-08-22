"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { PERSON_NAME_HTML_PATTERN } from "@/lib/name";

export function AccountSignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    try {
      const res = await fetch("/api/account/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email,
          phone: form.get("phone"),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

      const signInRes = await signIn("customer-credentials", { email, password, redirect: false });
      if (signInRes?.error) throw new Error("Account created — please sign in.");

      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/account" })}
            className="flex items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-white py-3 font-heading text-sm font-semibold hover:bg-cream-dark"
          >
            <span aria-hidden>🔎</span>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-ink-soft">
            <span className="h-px flex-1 bg-ink/10" />
            or
            <span className="h-px flex-1 bg-ink/10" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="name"
          required
          pattern={PERSON_NAME_HTML_PATTERN}
          title="Letters and spaces only — no numbers or symbols"
          placeholder="Full name"
          className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
        <input
          type="email"
          name="email"
          required
          placeholder="Email"
          className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
        <input
          type="tel"
          name="phone"
          required
          inputMode="tel"
          pattern="(\+92|0092|92|0)?3\d{9}"
          title="Enter a valid Pakistani mobile number, e.g. 03001234567"
          placeholder="Mobile number (03XXXXXXXXX)"
          className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
        <input
          type="password"
          name="password"
          required
          minLength={6}
          placeholder="Password (at least 6 characters)"
          className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
        {error && <p className="text-sm font-medium text-chili">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="btn-3d rounded-full bg-chili py-3 font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/account/login" className="font-semibold text-chili hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
