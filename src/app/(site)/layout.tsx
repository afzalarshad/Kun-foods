import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { FirstOrderPopup } from "@/components/promo/first-order-popup";
import { getSetting, SETTING_KEYS } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const percent = Number(await getSetting(SETTING_KEYS.firstOrderDiscountPercent)) || 0;

  return (
    // The customer-session-aware header icon needs useSession() client-side --
    // reading the session with auth() directly in a server component here would
    // force every storefront page dynamic (no more static/ISR), since it reads cookies.
    <AuthSessionProvider>
      <div className="flex min-h-full flex-1 flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CartDrawer />
        <WhatsAppButton />
        <FirstOrderPopup percent={percent} />
      </div>
    </AuthSessionProvider>
  );
}
