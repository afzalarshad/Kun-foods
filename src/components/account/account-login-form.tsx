"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await signIn("customer-credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setSubmitting(false);
      return;
    }

    router.push(searchParams.get("callbackUrl") ?? "/account");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: searchParams.get("callbackUrl") ?? "/account" })}
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
          type="email"
          name="email"
          required
          placeholder="Email"
          className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="Password"
          className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
        {error && <p className="text-sm font-medium text-chili">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="btn-3d rounded-full bg-chili py-3 font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href="/account/signup" className="font-semibold text-chili hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function AccountLoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  return (
    <Suspense fallback={null}>
      <LoginForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
