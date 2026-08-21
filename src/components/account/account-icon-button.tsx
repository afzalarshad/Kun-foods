"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function AccountIconButton() {
  const { data: session } = useSession();
  const isCustomer = session?.user?.audience === "customer";

  return (
    <Link
      href={isCustomer ? "/account" : "/account/login"}
      aria-label={isCustomer ? "My account" : "Sign in"}
      className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-cream-dark"
    >
      <span className="text-xl" aria-hidden>
        👤
      </span>
    </Link>
  );
}
