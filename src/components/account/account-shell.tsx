import { AccountNav } from "@/components/account/account-nav";

// Not a Next.js layout.tsx on purpose -- a shared layout.tsx nested under a route
// group here (account/(portal)/layout.tsx) hit a Turbopack "client reference
// manifest does not exist" bug for the whole /account subtree. Each gated page calls
// requireCustomerRecord() itself (it needs the Customer row anyway) and wraps its
// content in this plain component instead.
export function AccountShell({ customerName, children }: { customerName: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <div className="mb-8">
        <p className="text-sm text-ink-soft">Welcome back,</p>
        <h1 className="font-heading text-3xl font-extrabold">{customerName}</h1>
      </div>
      <div className="grid gap-8 sm:grid-cols-[200px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
