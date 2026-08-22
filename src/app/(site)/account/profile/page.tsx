import type { Metadata } from "next";
import { requireCustomerRecord } from "@/lib/require-customer";
import { ProfileForm } from "@/components/account/profile-form";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = { title: "My profile" };

export default async function AccountProfilePage() {
  const { customer } = await requireCustomerRecord();

  return (
    <AccountShell customerName={customer.name}>
    <div>
      <h2 className="font-heading text-lg font-bold">My profile</h2>
      <div className="mt-4 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-ink-soft">Name</p>
        <p className="font-medium">{customer.name}</p>
        <p className="mt-3 text-sm text-ink-soft">Email</p>
        <p className="font-medium">{customer.email}</p>
      </div>

      <ProfileForm phone={customer.phone} address={customer.address ?? ""} city={customer.city ?? ""} />
    </div>
    </AccountShell>
  );
}
