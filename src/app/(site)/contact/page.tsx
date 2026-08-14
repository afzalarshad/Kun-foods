import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Kun Foods team.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
      <h1 className="font-heading text-4xl font-extrabold">Get in touch</h1>
      <p className="mt-3 text-ink-soft">
        Questions about an order or a product? We&apos;d love to hear from you.
      </p>

      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        <ContactForm />

        <div className="flex flex-col gap-4 text-sm">
          <div>
            <p className="font-heading font-semibold">📞 Phone</p>
            <p className="text-ink-soft">+92 300 1234567</p>
          </div>
          <div>
            <p className="font-heading font-semibold">✉️ Email</p>
            <p className="text-ink-soft">hello@kunfoods.com</p>
          </div>
          <div>
            <p className="font-heading font-semibold">📍 Address</p>
            <p className="text-ink-soft">Karachi, Pakistan</p>
          </div>
          <div>
            <p className="font-heading font-semibold">🕒 Hours</p>
            <p className="text-ink-soft">Mon–Sat, 10am–7pm</p>
          </div>
        </div>
      </div>
    </div>
  );
}
