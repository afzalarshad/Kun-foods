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
- **Prisma + SQLite** for the database (swap the `datasource` in
  `prisma/schema.prisma` to Postgres/MySQL for production)
- **Zustand** for cart state (persisted to `localStorage`)
- **NextAuth v5** (credentials provider) for the admin panel
- **Zod** for request validation

## Getting started

```bash
npm install
cp .env.example .env      # then edit AUTH_SECRET / admin credentials
npx prisma migrate dev    # creates the SQLite DB and applies the schema
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

- Swap SQLite for Postgres/MySQL before deploying (update `DATABASE_URL`
  and the `provider` in `prisma/schema.prisma`).
- Set a strong `AUTH_SECRET` and change the seeded admin password.
- Replace the emoji-based `ProductImage` placeholders with real product
  photography via `next/image` once you have assets.
