import Link from "next/link";
import { NewsletterForm } from "@/components/layout/newsletter-form";

export function SiteFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-ink text-cream">
      <div
        className="blob absolute -right-24 -top-24 h-72 w-72 bg-chili/30"
        aria-hidden
      />
      <div
        className="blob-alt absolute -bottom-32 -left-16 h-80 w-80 bg-saffron/20"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-heading text-xl font-bold">Get 10% off your first order</h3>
            <p className="mt-2 text-sm text-cream/70">
              Join our list for recipes, offers, and new arrivals.
            </p>
            <NewsletterForm />
          </div>

          <div>
            <h4 className="font-heading font-semibold text-cream">Shop</h4>
            <ul className="mt-3 space-y-2 text-sm text-cream/70">
              <li><Link href="/collections/all" className="hover:text-cream">All products</Link></li>
              <li><Link href="/collections/spices-masalas" className="hover:text-cream">Spices & Masalas</Link></li>
              <li><Link href="/collections/pickles-chutneys" className="hover:text-cream">Pickles & Chutneys</Link></li>
              <li><Link href="/collections/sweets-desserts" className="hover:text-cream">Sweets & Desserts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-cream">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-cream/70">
              <li><Link href="/about" className="hover:text-cream">About Kun Foods</Link></li>
              <li><Link href="/contact" className="hover:text-cream">Contact us</Link></li>
              <li><Link href="/track-order" className="hover:text-cream">Track order</Link></li>
              <li><Link href="/admin" className="hover:text-cream">Admin login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-cream">Get in touch</h4>
            <ul className="mt-3 space-y-2 text-sm text-cream/70">
              <li>📞 +92 300 1234567</li>
              <li>✉️ hello@kunfoods.com</li>
              <li>📍 Karachi, Pakistan</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-6 text-sm text-cream/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Kun Foods. All rights reserved.</p>
          <p>Made with ❤️ for authentic flavor.</p>
        </div>
      </div>
    </footer>
  );
}
