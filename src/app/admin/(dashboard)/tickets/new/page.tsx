import { createTicket } from "@/app/admin/(dashboard)/tickets/actions";

const categories = ["order", "payment", "delivery", "return", "refund", "product", "complaint", "general"];
const priorities = ["low", "normal", "high", "urgent"];

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ customerName?: string; customerEmail?: string; customerPhone?: string; orderId?: string }>;
}) {
  const { customerName, customerEmail, customerPhone, orderId } = await searchParams;

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">New support ticket</h1>
      <p className="mt-1 text-ink-soft">Log a customer call, WhatsApp message, or complaint.</p>

      <form action={createTicket} className="mt-8 flex max-w-2xl flex-col gap-5">
        {orderId && <input type="hidden" name="orderId" value={orderId} />}

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Customer name</label>
            <input
              name="customerName"
              required
              defaultValue={customerName}
              className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              name="customerEmail"
              type="email"
              required
              defaultValue={customerEmail}
              className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Mobile number</label>
            <input
              name="customerPhone"
              type="tel"
              required
              inputMode="tel"
              pattern="(\+92|0092|92|0)?3\d{9}"
              title="Enter a valid Pakistani mobile number, e.g. 03001234567"
              placeholder="03XXXXXXXXX"
              defaultValue={customerPhone}
              className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Subject</label>
          <input
            name="subject"
            required
            placeholder="e.g. Order arrived damaged"
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <select
              name="category"
              defaultValue="general"
              className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 capitalize focus:border-chili focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Priority</label>
            <select
              name="priority"
              defaultValue="normal"
              className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 capitalize focus:border-chili focus:outline-none"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">What did the customer say?</label>
          <textarea
            name="message"
            required
            rows={4}
            placeholder="Describe the issue or the customer's message…"
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="self-start rounded-full bg-chili px-6 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          Open ticket
        </button>
      </form>
    </div>
  );
}
