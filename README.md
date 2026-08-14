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
prisma/schema.prisma        Database schema (Product, Category, Order, AdminUser)
prisma/seed.ts               Seed data (6 categories, 16 products, admin user)
src/app/(site)/               Storefront: home, collections, product, cart, checkout
src/app/admin/                Admin panel (login + protected dashboard)
src/app/api/                  Route handlers (orders, order tracking, auth)
src/components/               UI components (product, cart, layout, admin)
src/lib/                      Data access, formatting, auth helpers
src/store/cart.ts             Zustand cart store
```

## Key features

- **Storefront**: home page, category/collection pages with sorting, product
  detail pages, persistent cart drawer, cart page.
- **Checkout**: address form, cash-on-delivery or card (demo) payment,
  server-side price recalculation and stock validation, order confirmation
  page.
- **Order tracking**: customers can look up an order by order number + email
  at `/track-order`.
- **Admin panel** (`/admin`): dashboard stats, full product CRUD, order list
  and status updates — protected by NextAuth and proxy-level auth checks.

## Payments

Cash on delivery is fully functional. Card/online payment is wired up as a
placeholder in the checkout UI — plug in a real gateway (Stripe, JazzCash,
EasyPaisa, etc.) inside `src/app/api/orders/route.ts` and
`src/app/(site)/checkout/page.tsx`.

## Production notes

- Set a strong, unique `AUTH_SECRET` and change the seeded admin password.
- Replace the emoji-based `ProductImage` placeholders with real product
  photography via `next/image` once you have assets.
