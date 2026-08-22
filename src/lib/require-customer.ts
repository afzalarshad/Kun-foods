import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Redirects to the account login page unless a customer (not admin) session is active. */
export async function requireCustomer() {
  const session = await auth();
  if (!session?.user || session.user.audience !== "customer" || !session.user.customerId) {
    redirect("/account/login");
  }
  return session;
}

/** requireCustomer() plus the full Customer record, since account pages need it constantly. */
export async function requireCustomerRecord() {
  const session = await requireCustomer();
  const customer = await prisma.customer.findUnique({ where: { id: session.user.customerId! } });
  if (!customer) redirect("/account/login");
  return { session, customer };
}
