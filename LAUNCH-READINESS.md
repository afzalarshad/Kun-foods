# Launch Readiness — Professional Polish Checklist

Findings from a full site walkthrough (storefront pages, mobile view, footer,
metadata) conducted 2026-08-21, before going live. This tracks "make it look
and feel like a real, trustworthy business" items separately from
`SECURITY-AUDIT.md` (data-safety findings) — review and action both before
launch.

**Status: NOT YET FIXED. Review and action before go-live.**

The overall design (layout, typography, copy, mobile responsiveness) is
already solid — these are the specific gaps stopping it from reading as a
finished, professional storefront rather than a demo.

---

## High impact — fix before launch

### 1. No real product photography
- **Where:** Every product card, the product detail page hero, the homepage
  hero blobs — `src/components/product/product-image.tsx`.
- **Issue:** Every product is represented by an emoji on a colored circle,
  sometimes badly mismatched (e.g. Kaju Katli shows a 💎 diamond emoji).
  This is the single biggest signal that the site is a prototype, not a
  real business — it undermines trust before a customer even reads the
  copy.
- **Action item:** Replace with real product photography via `next/image`.
  `ProductImage` is already a single shared component, so swapping its
  emoji rendering for an `<Image>` (with the emoji as a graceful fallback
  while photos are still missing for a given product) is a contained
  change once photos exist.

### 2. Placeholder contact info in the footer
- **Where:** Site footer (`+92 300 1234567`, `hello@kunfoods.com`).
- **Issue:** Reads as placeholder/demo data, not a real business's actual
  contact details.
- **Action item:** Replace with the real support phone number and email
  before launch.

### 3. No real payment gateway
- **Where:** `src/components/checkout-form.tsx` (card option is labeled
  "Demo mode — no real charge is made").
- **Issue:** Only cash-on-delivery actually works; card/online payment is
  a non-functional placeholder.
- **Action item:** Integrate a real Pakistani gateway (JazzCash, EasyPaisa,
  or Stripe) inside `src/lib/create-order.ts` per the pointer already left
  in `README.md`.

### 4. Missing legal/policy pages
- **Where:** No routes exist for these under `src/app/(site)/`.
- **Issue:** No Privacy Policy, Terms & Conditions, or Return/Refund
  Policy page. Many Pakistani customers won't complete an order without
  at least a visible return/refund policy, and payment gateways
  (JazzCash/EasyPaisa/Stripe) typically require a Privacy Policy + Terms
  page to approve a merchant account in the first place.
- **Action item:** Add `/privacy`, `/terms`, and `/returns` (or a combined
  policy page), linked from the footer.

---

## Medium impact

### 5. No product reviews/ratings
- **Where:** No `Review` model in `prisma/schema.prisma`; only 4 static
  testimonials on the homepage (`src/app/(site)/page.tsx`).
- **Issue:** No per-product social proof — new customers have nothing
  concrete to judge quality by beyond the product description.
- **Action item:** Add a lightweight review/rating feature (even
  admin-moderated, no public sign-in required) if time allows before
  launch, or plan it as a fast-follow.

### 6. No social media links
- **Where:** Footer (`Get in touch` column has phone/email/address only).
- **Issue:** No Instagram/Facebook links — unusual for a Pakistani F&B
  brand and a missed trust/credibility signal.
- **Action item:** Add real social links to the footer once accounts
  exist.

### 7. Admin login link exposed in the public footer
- **Where:** Footer `Company` column (`Admin login`).
- **Issue:** No real e-commerce site advertises its admin panel URL to
  every visitor. Doesn't grant any extra access (the panel is still
  authenticated), but it's an unnecessary hint for anyone probing the
  site, and reads as unfinished/internal.
- **Action item:** Remove the link from the public footer; keep the route
  itself as-is (staff can just navigate to `/admin/login` directly or
  bookmark it).

### 8. `metadataBase` still points at a placeholder domain
- **Where:** `src/app/layout.tsx:17` — `new URL("https://kunfoods.example.com")`.
- **Issue:** Every Open Graph / social share preview (WhatsApp, Facebook,
  Google search result) will resolve against this fake domain until it's
  updated, so shared links and search snippets will look broken.
- **Action item:** Update to the real production domain once it's live
  (see #10).

### 9. No analytics tracking installed
- **Where:** No Google Analytics / Meta Pixel anywhere in the codebase.
- **Issue:** No visibility into traffic, where visitors come from, or
  conversion rate once the site is live.
- **Action item:** Add Google Analytics (and a Meta Pixel if running
  Facebook/Instagram ads) before launch so day-one data isn't lost.

---

## Nice-to-have polish

### 10. Custom domain
- If the site is currently on a `.vercel.app` URL, a real domain
  (`kunfoods.com` or similar) reads significantly more professional than
  a subdomain of the hosting platform.

### 11. Verify footer contact details are real
- Once #2 is done, double-check the phone number and email are actually
  monitored — a real number/email that goes unanswered is worse than an
  obviously-placeholder one.
