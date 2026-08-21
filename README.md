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
   - `DIRECT_URL` — a **direct (non-pooled)** connection string to the same
     database, required for migrations (see note below). Open your database
     in the [Neon console](https://console.neon.tech), copy the connection
     string that does **not** have `-pooler` in the hostname, and add it as
     `DIRECT_URL` in Vercel → Project Settings → Environment Variables (set
     it for Production, Preview, and Development).
4. Click **Deploy**. Vercel builds the app and runs `prisma migrate deploy`
   automatically, so the database tables are created on first deploy.

> **Why `DIRECT_URL` matters:** `DATABASE_URL` is Neon's pooled connection
> (hostname contains `-pooler`), which the app should use for normal
> queries. But `prisma migrate deploy` needs to hold a session-level
> Postgres advisory lock while it runs, and connection poolers can't
> reliably hold that — it fails with `Error: P1002 … Timed out trying to
> acquire a postgres advisory lock`. Pointing migrations at a direct,
> unpooled connection via `DIRECT_URL` fixes it. If your Neon integration
> already added an unpooled URL under a different name (e.g.
> `DATABASE_URL_UNPOOLED` or `POSTGRES_URL_NON_POOLING`), you can just copy
> its value into a `DIRECT_URL` variable instead of going back to Neon.
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
  Product cards lift with a shadow on hover, and primary buttons (Add to
  cart, Place order, etc.) use a chunky "pressable" style — a solid color
  ledge along the bottom that the button pushes down into on click — for
  tactile feedback before an action fires (`.btn-3d` / `.btn-3d-ink` in
  `src/app/globals.css`).
- **Product variants**: give two or more products the same "variant group"
  key on the product edit form (e.g. `biryani-masala`) and a label per
  variant (e.g. "150g", "500g") to show them as one storefront listing with
  a size picker instead of separate cards — the cheapest variant is the
  representative card, with a "N sizes" badge. Each variant still keeps its
  own SKU, price, and warehouse stock; picking a different size on the
  product page jumps to that variant's own page. "Related products" and
  category/homepage listings automatically dedupe by variant group.
- **Categories** (`/admin/categories`): add, edit, deactivate, or delete the
  categories products are organized into — deactivating drops a category
  from storefront navigation without touching the products already in it;
  deleting is blocked (auto-deactivates instead) while it still has
  products, matching every other "safer delete" in this app. Reports shows
  a revenue *and* order-count breakdown per category.
- **Checkout**: address form with a per-city delivery rate, coupon code
  entry, cash-on-delivery or card (demo) payment, server-side
  price/stock/coupon/shipping recalculation, order confirmation page. The
  address form matches how Pakistani addresses are actually written —
  separate "House / Flat #, Street", "Area, Sector / Block, Society", and
  an optional "Nearby landmark" field (riders often navigate by landmark,
  not street address) — joined into one string on submit; the `Order`
  model still stores a single `address` field, so no schema change was
  needed. Mobile number fields (checkout, POS, new-ticket) are labeled "Mobile
  number" and validated against the Pakistani format
  (`03XXXXXXXXX`/`+923XXXXXXXXX`, see `src/lib/phone.ts`) both in the
  browser and again server-side — a malformed number is rejected with a
  clear error rather than silently accepted. Customer name fields
  (checkout, POS) only accept letters and spaces, browser-side and again
  server-side (`src/lib/name.ts`) — closes off a phishing/injection vector
  where a name containing a link or markup would otherwise render
  un-escaped in order notification emails and admin exports.
- **Shipping zones**: per-city or per-province delivery rate with an
  optional free-shipping threshold, managed at `/admin/shipping` (with a
  CSV bulk import/export for setting up many rates at once from
  `/admin/import-export`). A city-specific rate always wins over its
  province's rate, so one town can be an exception to an otherwise-served
  (or otherwise-excluded) province. Any rate can be marked **excluded** —
  checkout blocks placing an order there with a clear "we don't deliver
  here" message instead of silently charging a rate. Checkout, POS, and
  the admin shipping-zone form all use a type-to-filter city picker
  (`src/components/city-combobox.tsx`) verified against Pakistan Post's
  official National Post Code Directory (`src/lib/pakistan-locations.ts` +
  the underlying `pakistan-cities-data.json`, ~3,300 entries covering
  every delivery and non-delivery post office, each with its province and
  postal code) — a plain `<select>` isn't usable at that size, so typing
  filters a dropdown of matches instead, and the committed value can only
  ever be an exact known city (never arbitrary typed text). Checkout also
  has a separate province selector that narrows the city search to that
  province; picking a city the other way auto-syncs the province field
  back. Selecting a city auto-fills its official postal code (still
  editable) and live-recomputes the shipping cost (or the exclusion
  block). Non-delivery post offices are pre-loaded as **excluded**
  shipping zones via `prisma/data/shipping-exclusions.csv` — re-import
  that file at `/admin/import-export` any time the city reference is
  regenerated from a newer directory. Falls back to a flat rate
  automatically if no rates are configured yet, so checkout never breaks.
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
- **Promotions engine** (`/admin/promotions`): automatic discounts that apply
  at checkout and POS with no code needed, on top of coupons. Percentage or
  fixed-amount off the entire order, one category, or one product; BOGO deals
  (buy X get Y at a chosen % off — e.g. "buy 2 get 1 free"); optional
  targeting to one of the 10 dynamic customer segments (e.g. only VIPs, or
  only inactive-90-day customers to win them back); and an optional
  start/end schedule for flash sales. Matching promotions stack and are
  shown live in the cart summary as they apply, then persisted on the order
  (`Order.promoDiscount` / `promotionsJson`) for the receipt and order detail
  page.
- **Bundles**: grouped products sold at a special price, shown at `/deals`
  and manageable at `/admin/bundles`.
- **Admin panel** (`/admin`): dashboard stats, full product/coupon/bundle
  CRUD, order list and status updates (which trigger the notification
  emails/SMS above) — protected by NextAuth and proxy-level auth checks.
- **POS** (`/admin/pos`): create an order for an in-person or phone sale —
  pick products/bundles, apply a coupon, enter the customer, and submit. Uses
  the same order-creation logic (stock decrement, customer upsert,
  notifications) as the storefront checkout. POS depth features:
  - **Barcode/SKU scan**: an always-focused scan field matches a product's
    `barcode` or `sku` and adds it to the cart on Enter, with success/error
    feedback — works with a USB/Bluetooth barcode scanner or manual typing.
  - **Hold & resume sale**: pause an in-progress sale (cart + customer
    details) to serve a walk-in or take a call, then resume it later —
    possibly from a different POS session — via the "Held (N)" list. Backed
    by a `HeldSale` table so nothing is lost if the browser tab closes.
  - **Split/partial payment**: toggle "Split payment" to record multiple
    payment lines (e.g. half cash, half card) against one order — each line
    becomes its own `Payment` record, and the order's payment method is
    stored as `split` when more than one method is used.
  - **Printable receipt**: every POS sale redirects to a print-friendly
    receipt (`/admin/pos/receipt/[orderId]`) with store details from
    Settings, line items, totals, and the payment breakdown.
- **CRM** (`/admin/customers`): every order (storefront or POS) automatically
  creates or updates a `Customer` record keyed by email, with tags, internal
  notes, saved addresses, order count, total spent, and full order history.
  A global search bar in the admin header looks customers up instantly by
  name/phone/email/order number and opens a quick-view popup (lifetime
  value, open orders, every past order — not just the 5 most recent — notes,
  WhatsApp/new-order shortcuts) — built for the "customer calls in" workflow.
  Customer names are clickable the same way from the Orders and Shipments
  lists, so staff can pull up a customer's full order history without
  leaving whatever list they're already working from.
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
  Financial figures get the same treatment at a finer grain: the admin
  dashboard's "Total revenue" card only renders for roles holding
  `reports.financial` (e.g. not Support), even though the dashboard itself
  is open to every role.
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
  sender/recipient address, COD amount, and a scannable QR code encoding the
  order. `/admin/shipments` is a filterable manifest of every booking across
  couriers, also printable, with a **Track** link per row (and in the
  customer quick-search popup's recent-orders list) that jumps straight to
  the courier's public tracking page. A **"Scan to update"** box on
  `/admin/shipments` lets staff scan a label's QR code (or paste it) and
  tap Picked up / In transit / Delivered to advance that shipment's status
  in one step instead of hunting the order down by number.
- **Bulk shipping labels** (`/admin/orders/labels?ids=...`): select any
  number of orders from the Orders list (or the dashboard's packed-orders
  widget) and print all their labels in one batch, each on its own page —
  orders without a courier booked yet are called out and skipped rather
  than silently omitted.
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
- **Notification templates** (`/admin/settings/templates`, admin-only):
  order confirmation and status-update email/SMS copy is admin-editable
  with `{{customer_name}}`, `{{order_number}}`, `{{total}}`, `{{status}}`,
  and `{{items_list}}` variables, a live preview with sample data, a
  per-template enable toggle, and a reset-to-default. Falls back to the
  built-in copy until customized, so nothing breaks on upgrade.
- **Admin notification center**: a bell in the admin header surfaces new
  orders, new support tickets, return requests, and low-stock alerts
  (deduped so one alert per low-stock episode, not one per sale) with
  mark-read / mark-all-read, linking straight to the relevant record.
- **Customer segments** (`/admin/customers`): filter chips for New (30d),
  Returning, Frequent, VIP (tag-based), High value, Inactive 30/90d, Coupon
  users, COD, and High return — computed live from order/tag/return data.
  Each segment is exportable to CSV directly from the filtered view.
- **Settings** (`/admin/settings`, admin-only): store name/address/phone
  (used on shipping labels), and platform-wide toggles for email/SMS
  notifications that genuinely gate sending (not just a UI checkbox) —
  plus a read-only integration status panel showing which provider env
  vars (Resend, Twilio, WhatsApp) are configured, and admin-editable SLA
  hour thresholds (see below).
- **SLA tracking & operations dashboard** (`/admin/operations`): live SLA
  compliance for support tickets (first response + resolution deadlines,
  by priority) and order fulfillment (time to ship, by priority), with
  configurable hour thresholds per priority in Settings. Deadlines are
  computed on the fly — `on track` / `at risk` (last 20% of the window) /
  `breached` — and shown as badges on the tickets and orders lists and
  detail pages. The dashboard surfaces breach/at-risk counts, rolling
  30-day averages (first response time, resolution time, time to ship),
  and "needs attention" lists linking straight to the overdue ticket or
  order.
- **Pagination, search & bulk actions**: Products, Orders, Customers, and
  Tickets lists are all searchable and paginated (50/page), each with
  multi-select bulk actions — activate/deactivate products, assign or
  bulk-status orders, tag customers, and assign/resolve tickets in one
  click. Products also have an `active` flag: deactivating a product hides
  it from the storefront and POS without deleting its order history.
- **Platform hardening**:
  - **Safer deletes**: deleting a Product, Bundle, or Coupon that's
    actually been used on a past order automatically deactivates it
    instead of hard-deleting — a real delete there would either wipe the
    product's inventory movement audit trail or silently null out the
    coupon/product reference on historical orders. Genuinely unused
    records still delete for real. The admin sees exactly which happened.
  - **Webhooks** (`/admin/webhooks`, admin-only): register an endpoint URL
    and subscribe it to `order.created`, `order.status_changed`, and/or
    `ticket.created`. Each delivery is a signed POST
    (`X-Kun-Signature: sha256=…`, an HMAC-SHA256 of the raw body using a
    per-webhook secret shown on its edit page, with one-click rotation) so
    a receiver can verify it really came from Kun Foods. The list shows
    each webhook's last delivery status and timestamp.
  - **Courier provider adapters** (`src/lib/providers/couriers.ts`): a
    shared `CourierAdapter` interface for Leopards/TCS/PostEx/manual,
    replacing three separate copies of the courier name list. Every
    courier now has a real public tracking-page URL ("Track shipment ↗"
    on the order's shipment panel), and booking already calls through the
    adapter — so wiring up a real courier API later is a matter of filling
    in one adapter's `createBooking`, not a rewrite. None are configured
    with real credentials yet, so tracking numbers are still entered by
    hand, exactly as before.
- **Warehouse pick & pack** (`/admin/warehouse`): confirmed orders enter a
  pick queue sorted by priority, filterable by warehouse once more than one
  exists. Each order has a scan screen — type or scan a barcode/SKU (works
  with any USB/Bluetooth scanner acting as a keyboard, or manual entry on a
  phone) to check off that unit against the order; over-scanning or
  unmatched codes are rejected, and "mark packed" stays disabled until every
  line item is fully picked, then moves the order to **packed** (not
  shipped — see below) with a timestamped audit trail. A **"Print pick
  list"** button on the queue generates a single printable sheet for every
  order currently waiting: a consolidated pick-total per SKU (so a picker
  can grab all of one item at once) followed by a per-order breakdown. The
  same rules are enforced by a documented `/api/warehouse/*` API surface
  (product lookup by barcode/SKU, pick queue, scan, mark-packed) for a
  future Android/handheld scanner app — the web UI keeps working with or
  without it.
- **Multi-warehouse inventory** (`/admin/warehouses`): stock is tracked
  per physical location, not as one global number — each warehouse holds
  its own `WarehouseStock` pool per product, and `Product.stock` is kept as
  a live cross-warehouse total for anything that only needs "is this in
  stock at all" (storefront, POS, low-stock alerts). Add/edit warehouses
  (name, city, active, and which one is the default fallback), and
  **transfer stock** between them with a full before/after audit trail. New
  orders are automatically assigned to whichever warehouse can fully cover
  every line item — preferring one whose city matches the delivery address,
  falling back to the default warehouse — and that location's pool (not the
  global total) is what actually gets decremented; if no single location
  can cover the whole order it's rejected with a clear error rather than
  silently over-selling one location's shelf. Returns restock the order's
  original fulfilling warehouse. The Inventory page shows a per-warehouse
  breakdown table alongside the existing movement ledger and manual
  adjustment form (now warehouse-scoped), and the product edit form's stock
  field only ever moves the default warehouse's pool — everything else goes
  through Inventory or a transfer. Deleting a warehouse that still holds
  stock is blocked; one with order history is deactivated instead of
  removed, matching every other "safer delete" in this app. New
  installs start with a single "Main Warehouse" holding all stock, so
  nothing changes until a second location is actually added.
- **Packed ≠ shipped**: finishing pick/pack moves an order to **packed**,
  not shipped — "shipped" previously fired the moment a warehouse staffer
  finished packing, before any courier had actually been booked, which made
  the order list impossible to trust. Now "shipped" only fires automatically
  when a real courier tracking number is saved against the order (booking a
  courier on an order that's `processing` or `packed` promotes it
  automatically, with its own status-history entry) — the one signal that
  actually means the package left the building. The dashboard surfaces a
  **"Packed — awaiting courier booking"** widget so packed-but-unbooked
  orders can't get lost between the warehouse and the courier.

- **Customer accounts**: shoppers can create an account (email/password, or
  Google if `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set) at
  `/account/signup` and sign in at `/account/login` — guest checkout still
  works unchanged, and an order placed as a guest links to the matching
  account automatically (both key off the checkout email). Signed-in
  customers get a self-service portal at `/account`: order history with
  self-serve cancellation (while an order is still `pending`/`processing`)
  and return requests (once `delivered`), a support-ticket inbox they can
  open and reply to directly (internal staff notes are filtered out of what
  they see), and a profile page for phone/address/city. This reuses NextAuth
  — the same instance that serves `/admin/login` — so a `Session.user.audience`
  discriminator (`"admin"` vs `"customer"`) was added to the JWT/session and
  every existing admin gate (`requireAdmin()`, `src/proxy.ts`, the admin
  dashboard layout) now checks it explicitly; a signed-in customer session
  must never satisfy an admin-only check just because a session exists.
  `src/lib/require-customer.ts` is the mirror-image gate for account pages.
  Note for local dev: don't put a shared `layout.tsx` under a nested route
  group inside `/account` — it triggered a Turbopack "client reference
  manifest does not exist" bug on this Next.js version, so the portal nav
  shell (`AccountShell`) is a plain component each gated page renders
  itself instead of a Next layout file.
- **Recipes**: a lightweight CMS (`Recipe` model) with admin CRUD at
  `/admin/recipes` (gated by the new `content.manage` permission) and a
  storefront listing/detail at `/recipes` — only `published` recipes are
  public. Body text is plain text rendered with line breaks preserved (no
  Markdown renderer is wired in).
- **Header/nav restructure**: the top nav is just Shop / Recipes / Our Story
  / Contact — per-category links moved into the Shop (`/collections/all`)
  page as filter chips (alongside a Deals chip), and the redundant "Shop
  now" button next to the cart icon is gone. A search icon opens a
  live-filtered product dropdown (`/api/search`), and a login/account icon
  next to it links to `/account` or `/account/login` depending on session
  state — that icon is a client component using `useSession()` rather than
  reading the session server-side in the header, since a server-side
  `auth()` call there would force every storefront page dynamic (no more
  static/ISR) just to render one icon.
- **Track order**: phone-number search only (order number is now optional,
  used to narrow results) — shows every order placed under that mobile
  number instead of requiring a single order number + email pair.
- **First-order discount popup**: a one-time popup (localStorage-gated)
  offering an admin-configurable percentage off, unlocked by entering an
  email. It applies a fixed coupon code (`WELCOME`, `Coupon.firstOrderOnly`)
  that's enforced server-side (rejected if that email already has an
  order) both at coupon-validate time and again authoritatively in
  `createOrder()`. Configure the percentage (0 disables the popup) under
  Settings → "First-order discount popup".
- **Homepage redesign**: restructured in a shopnoms.com-style layout — an
  "Explore the range" horizontal carousel with an inline quantity stepper
  and Add to Cart per card (no detour to the product page), a "Behind the
  Scenes" section (video placeholder — swap in real production footage
  when it's ready), and a "Try our new products" carousel of the newest
  active products.
- **Checkout redesign**: split into numbered Contact / Delivery / Payment
  method / Billing address sections. Billing address only appears for card
  payments (COD has no use for it) and defaults to "same as shipping" with
  a live summary; unchecking it reveals separate billing fields. Billing
  data isn't sent to the order API yet — there's no real payment gateway
  to consume it (see Payments below) — it's captured client-side ready for
  whichever gateway eventually gets plugged into `handleSubmit`.

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
| `LEOPARDS_API_KEY` / `TCS_API_KEY` / `POSTEX_API_KEY` | Not yet integrated against a real API — presence just flips that courier's adapter to "configured" (see Platform hardening above). Booking still requires a manual tracking number until each adapter's `createBooking` is implemented. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (OAuth 2.0 Client ID, web application). Enables "Continue with Google" on `/account/login` and `/account/signup`; without them, only email/password customer accounts are offered. |

## Production notes

- Set a strong, unique `AUTH_SECRET` and change the seeded admin password.
- Replace the emoji-based `ProductImage` placeholders with real product
  photography via `next/image` once you have assets.
- Set up the notification env vars above once you're ready for real order
  emails/SMS — otherwise notifications are silently skipped.
- Admin product create/edit/delete now revalidates the storefront's
  `/products/[slug]` and `/collections/[slug]` pages directly. Those pages
  use ISR (`revalidate = 60`), so without an explicit `revalidatePath` a
  product edit (price, variant grouping, category, etc.) could take up to
  60 seconds to show up on the storefront, or never show up at all if the
  page had already been statically pre-rendered — this bit us once already
  with shipping zones (see the CSV import section above) and again here
  with variant grouping. Any new admin action that changes data a
  storefront page reads needs the same explicit revalidation.
- Stock decrements (order checkout and warehouse-to-warehouse transfers) use
  an atomic conditional `UPDATE ... WHERE quantity >= needed` rather than a
  separate read-then-write. Load testing 150 concurrent checkouts against
  100 units of stock found the old read-then-write version oversold by 7
  units (107 succeeded, warehouse stock went negative); the atomic version
  correctly caps it at exactly 100. If you add another place that decrements
  stock, use `decrementWarehouseStock()` in `lib/warehouse-stock.ts` rather
  than a manual read+update. Order numbers are also retried on the rare
  collision (a random per-month code, so concurrent checkouts can occasionally
  generate the same one) instead of failing the order.
