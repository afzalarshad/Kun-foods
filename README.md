# Kun Foods

A full e-commerce storefront for Kun Foods, built with Next.js — a custom-built
alternative to a Shopify store, styled after Shopify's **Shapes** theme
(bold color blocking, organic blob shapes, playful rounded typography).

## Why not Shopify

This is a self-hosted Next.js app instead of a Shopify theme, which means:

- **Server-rendered & statically pre-rendered pages** (home, collections,
  product pages) instead of a client-heavy Liquid/JS storefront — faster
  first paint, less JS shipped to the browser.
- **No monthly platform fees or transaction cuts** — you own the code,
  the database, and the hosting.
- **No image downloads to design** — products render as colorful CSS "blob"
  shapes with an icon, so the storefront ships instantly with zero image
  weight. Swap in real product photography any time by changing
  `ProductImage` (`src/components/product/product-image.tsx`) to render an
  `<Image>` instead.

## Tech stack

- **Next.js 16** (App Router, React 19, TypeScript, Turbopack)
- **Tailwind CSS v4** for styling
- **Prisma + PostgreSQL** for the database
- **Zustand** for cart state (persisted to `localStorage`)
- **NextAuth v5** (credentials provider) for the admin panel
- **Zod** for request validation
- **Resend** for transactional email, **Twilio** for SMS (both optional)

## Deploy to Vercel (recommended — get a live link in minutes)

GitHub Pages can't run this site (it only serves static files — no database,
checkout, or admin login). Vercel runs it exactly as built, for free:

1. Click **Deploy** below and sign in with your GitHub account.
2. When prompted, add a free Postgres database (Vercel offers a **Neon**
   integration right in the import flow) — this auto-fills `DATABASE_URL`.
3. Add the remaining environment variables when asked:
   - `AUTH_SECRET` — any long random string (e.g. generate one at
     [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32))
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — your admin login
4. Click **Deploy**. Vercel builds the app and runs `prisma migrate deploy`
   automatically, so the database tables are created on first deploy.
5. Once it's live, seed sample products from your machine:
   ```bash
   vercel env pull .env        # pulls the live DATABASE_URL locally
   npm install
   npm run db:seed
   ```
   (Requires the [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`, then `vercel link`.)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fafzalarshad%2FKun-foods%2Ftree%2Fclaude%2Fkun-foods-website-dxu9hy&env=AUTH_SECRET,ADMIN_EMAIL,ADMIN_PASSWORD&envDescription=AUTH_SECRET%3A%20any%20long%20random%20string.%20ADMIN_EMAIL%2FADMIN_PASSWORD%3A%20your%20admin%20login.%20DATABASE_URL%20is%20filled%20in%20automatically%20if%20you%20add%20a%20Postgres%20storage%20during%20import.&project-name=kun-foods&repository-name=kun-foods)

## Local development

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL (a free Postgres from
                           # neon.tech or supabase.com works), AUTH_SECRET, etc.
npx prisma migrate dev    # applies the schema to your database
npm run db:seed           # seeds categories, products, and the admin user
npm run dev
```

Visit `http://localhost:3000` for the storefront and
`http://localhost:3000/admin` for the admin panel (login printed by the
seed script, default `admin@kunfoods.com` / `kunfoods123`).

## Project structure

```
prisma/schema.prisma          Database schema (Product, Category, Order, Customer, Coupon, Bundle, AdminUser)
prisma/seed.ts                 Seed data (6 categories, 16 products, admin user)
src/app/(site)/                 Storefront: home, collections, product, deals, cart, checkout
src/app/admin/                  Admin panel (login + protected dashboard, POS, bundles, coupons, customers)
src/app/api/                    Route handlers (orders, coupon validation, order tracking, auth, seed)
src/components/                 UI components (product, cart, layout, admin)
src/lib/                        Data access, order creation, notifications, formatting, auth helpers
src/store/cart.ts               Zustand cart store
```

## Key features

- **Storefront**: home page, category/collection pages with sorting, product
  detail pages, a Deals & Bundles page, persistent cart drawer, cart page.
- **Checkout**: address form with a per-city delivery rate, coupon code
  entry, cash-on-delivery or card (demo) payment, server-side
  price/stock/coupon/shipping recalculation, order confirmation page.
- **Shipping zones**: per-city delivery rate with an optional free-shipping
  threshold, managed at `/admin/shipping`. Checkout shows a city dropdown
  built from these zones and live-recomputes the shipping cost as the
  customer picks a city. Falls back to a flat rate automatically if no
  cities are configured yet, so checkout never breaks.
- **Order tracking**: customers can look up an order by order number + email
  at `/track-order`.
- **Notifications**: order confirmation and status-change emails (Resend) and
  SMS (Twilio) to the customer, plus a new-order email to the store owner.
  Both are optional — the app runs fine without them and just logs to the
  console instead of sending.
- **WhatsApp ordering**: a floating "Order on WhatsApp" button site-wide and
  a prefilled per-product WhatsApp link, once `NEXT_PUBLIC_WHATSAPP_NUMBER`
  is set.
- **Coupons**: percentage or fixed-amount discount codes with an optional
  minimum order, usage limit, and expiry date — managed at `/admin/coupons`.
- **Bundles**: grouped products sold at a special price, shown at `/deals`
  and manageable at `/admin/bundles`.
- **Admin panel** (`/admin`): dashboard stats, full product/coupon/bundle
  CRUD, order list and status updates (which trigger the notification
  emails/SMS above) — protected by NextAuth and proxy-level auth checks.
- **POS** (`/admin/pos`): create an order for an in-person or phone sale —
  pick products/bundles, apply a coupon, enter the customer, and submit. Uses
  the same order-creation logic (stock decrement, customer upsert,
  notifications) as the storefront checkout.
- **CRM** (`/admin/customers`): every order (storefront or POS) automatically
  creates or updates a `Customer` record keyed by email, with tags, internal
  notes, saved addresses, order count, total spent, and full order history.
  A global search bar in the admin header looks customers up instantly by
  name/phone/email/order number and opens a quick-view popup (lifetime
  value, open orders, notes, WhatsApp/new-order shortcuts) — built for the
  "customer calls in" workflow.
- **Roles & granular permissions** (`/admin/users`, admin-only): 13 roles —
  Admin, Manager, Sales, Customer Support, Warehouse Manager, Picker,
  Packer, Inventory Manager, Accountant, Marketing Manager, POS Operator,
  and Read Only (plus the original Staff/POS kept for backward
  compatibility) — each mapped to a specific permission set in
  `src/lib/permissions.ts`. Enforcement is server-side in `src/proxy.ts`
  (route-level, redirects a direct URL visit a role can't use) and in every
  server action/API route via `requirePermission()`/`requireAnyPermission()`
  — never just hidden in the sidebar. Picker/Packer/POS Operator are
  confined to a single section the same way the original POS role was.
- **Audit log** (`/admin/audit-log`, admin-only): every product, order,
  coupon, bundle, shipping-zone, and user change is recorded with who did
  it and when.
- **Order lifecycle**: status changes keep a full timestamped history
  (`OrderStatusEvent`) instead of overwriting a single field, support an
  optional note and a priority/assigned-staff field, and returns/refunds
  are tracked per order at `/admin/orders/[id]`.
- **Inventory** (`/admin/inventory`): every stock change — sales, returns
  received back into the warehouse, and manual adjustments — is logged as
  an `InventoryMovement` with who/what/why. A low-stock widget (based on
  each product's optional reorder level) surfaces on both the dashboard and
  the inventory page, and a manual "Adjust stock" form handles damage,
  recounts, and new stock received from a supplier.
- **Payments** (per order at `/admin/orders/[id]`): every order gets an
  initial `Payment` record matching its payment method (COD starts
  "pending", card/cash start "paid"). Staff can record additional
  payments — partial payments, COD collection, refunds — and see a live
  paid/due balance for the order, all tied to a reconcilable ledger rather
  than a single order-level status flag.
- **Shipments & labels** (`/admin/shipments`, per order at
  `/admin/orders/[id]`): book a courier — **Leopards**, **TCS**, **PostEx**,
  or manual/own rider — with a tracking number, weight, and COD amount,
  track it through pending → booked → picked up → in transit → delivered,
  and generate a printable shipping label (`/admin/orders/[id]/label`) with
  sender/recipient address and COD amount. `/admin/shipments` is a
  filterable manifest of every booking across couriers, also printable.
- **Support tickets** (`/admin/tickets`): log a customer call, WhatsApp
  message, or complaint as a ticket (category, priority, status, optional
  order link), reply in a threaded conversation with public replies and
  staff-only internal notes, and track it through
  open → pending → in progress → waiting on customer → resolved → closed.
  Tickets are linked to the customer record, shown on the customer detail
  page, and surfaced (with an open-ticket count) in the CRM quick-view.
- **Reports** (`/admin/reports`): revenue, order count, average order
  value, and new customers over a 7/30/90-day window, with a daily sales
  chart, top products by revenue, revenue by category, order-status
  breakdown, and payment-method breakdown — all computed live from the
  same orders/payments data, no separate analytics service needed.
- **Import / export** (`/admin/import-export`, admin-only): download
  products/orders/customers as CSV, or bulk-upload a products CSV — rows
  are matched by SKU (update) or created fresh, with per-row validation
  and an error report, plus automatic inventory-movement logging for any
  stock changes brought in by the import.
- **Customer segments** (`/admin/customers`): filter chips for New (30d),
  Returning, Frequent, VIP (tag-based), High value, Inactive 30/90d, Coupon
  users, COD, and High return — computed live from order/tag/return data.
  Each segment is exportable to CSV directly from the filtered view.
- **Settings** (`/admin/settings`, admin-only): store name/address/phone
  (used on shipping labels), and platform-wide toggles for email/SMS
  notifications that genuinely gate sending (not just a UI checkbox) —
  plus a read-only integration status panel showing which provider env
  vars (Resend, Twilio, WhatsApp) are configured.
- **Pagination, search & bulk actions**: Products, Orders, Customers, and
  Tickets lists are all searchable and paginated (50/page), each with
  multi-select bulk actions — activate/deactivate products, assign or
  bulk-status orders, tag customers, and assign/resolve tickets in one
  click. Products also have an `active` flag: deactivating a product hides
  it from the storefront and POS without deleting its order history.
- **Warehouse pick & pack** (`/admin/warehouse`): confirmed orders enter a
  pick queue sorted by priority. Each order has a scan screen — type or
  scan a barcode/SKU (works with any USB/Bluetooth scanner acting as a
  keyboard, or manual entry on a phone) to check off that unit against the
  order; over-scanning or unmatched codes are rejected, and "mark packed"
  stays disabled until every line item is fully picked, then moves the
  order to shipped with a timestamped audit trail. The same rules are
  enforced by a documented `/api/warehouse/*` API surface (product
  lookup by barcode/SKU, pick queue, scan, mark-packed) for a future
  Android/handheld scanner app — the web UI keeps working with or
  without it.

## Payments

Cash on delivery is fully functional. Card/online payment is wired up as a
placeholder in the checkout UI — plug in a real gateway (Stripe, JazzCash,
EasyPaisa, etc.) inside `src/lib/create-order.ts` and
`src/app/(site)/checkout/page.tsx`.

## Notifications (email & SMS) setup

Both are optional — without them, the app just logs what it would have sent.
To turn them on, add these to your `.env` (locally) or Vercel Environment
Variables (production), then redeploy/restart:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) (free tier available). Enables order confirmation + status-update emails. |
| `EMAIL_FROM` | Sender address, e.g. `Kun Foods <orders@yourdomain.com>`. Must be a domain verified in Resend — until then, the default `onboarding@resend.dev` sandbox address works for testing. |
| `ADMIN_NOTIFICATION_EMAIL` | Where new-order alerts are sent (e.g. your own inbox). |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | From [twilio.com](https://www.twilio.com). Enables order confirmation + status-update SMS. |
| `TWILIO_PHONE_NUMBER` | Your Twilio sending number, e.g. `+15551234567`. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Your WhatsApp business number in international format with no `+` or spaces, e.g. `923001234567`. Enables the WhatsApp order button; hidden if unset. |

## Production notes

- Set a strong, unique `AUTH_SECRET` and change the seeded admin password.
- Replace the emoji-based `ProductImage` placeholders with real product
  photography via `next/image` once you have assets.
- Set up the notification env vars above once you're ready for real order
  emails/SMS — otherwise notifications are silently skipped.
