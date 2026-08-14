"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setSubmitting(false);
      return;
    }

    router.push(searchParams.get("callbackUrl") ?? "/admin");
    router.refresh();
  }

  return (
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
        className="rounded-full bg-ink py-3 font-heading font-semibold text-cream hover:bg-ink/90 disabled:opacity-60"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-14">
      <div className="mb-8 text-center">
        <span
          className="blob mx-auto flex h-14 w-14 items-center justify-center bg-gradient-to-br from-chili to-saffron text-2xl font-heading font-bold text-white"
          aria-hidden
        >
          K
        </span>
        <h1 className="mt-4 font-heading text-2xl font-extrabold">Admin login</h1>
        <p className="mt-1 text-sm text-ink-soft">Manage Kun Foods products and orders</p>
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
