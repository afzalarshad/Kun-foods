import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kunfoods.example.com"),
  title: {
    default: "Kun Foods — Fresh, Authentic, Delivered",
    template: "%s | Kun Foods",
  },
  description:
    "Kun Foods brings you authentic spices, snacks and pantry staples made with care — fresh, fast, and delivered to your door.",
  openGraph: {
    title: "Kun Foods",
    description:
      "Authentic spices, snacks and pantry staples — fresh, fast, and delivered to your door.",
    siteName: "Kun Foods",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">{children}</body>
    </html>
  );
}
