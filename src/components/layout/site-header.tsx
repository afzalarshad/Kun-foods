import Link from "next/link";
import { CartButton } from "@/components/cart/cart-button";
import { SearchButton } from "@/components/search/search-button";
import { AccountIconButton } from "@/components/account/account-icon-button";

const NAV_LINKS = [
  { href: "/collections/all", label: "Shop" },
  { href: "/recipes", label: "Recipes" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="hidden bg-ink text-cream sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-center text-sm">
          <span>
            🌶️ Free delivery in Karachi on orders above Rs. 3,000 &nbsp;•&nbsp; Cash on
            delivery available
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-2xl font-extrabold">
          <span
            className="blob flex h-10 w-10 items-center justify-center bg-gradient-to-br from-chili to-saffron text-lg text-white"
            aria-hidden
          >
            K
          </span>
          Kun Foods
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="font-medium hover:text-chili">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <SearchButton />
          <AccountIconButton />
          <CartButton />

          <details className="relative lg:hidden">
            <summary className="flex h-10 w-10 list-none items-center justify-center rounded-full hover:bg-cream-dark [&::-webkit-details-marker]:hidden">
              <span className="text-xl">☰</span>
            </summary>
            <nav className="absolute right-0 z-40 mt-2 flex w-56 flex-col gap-1 rounded-2xl border border-ink/10 bg-cream p-3 shadow-xl">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 hover:bg-cream-dark">
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
