import { AuthSessionProvider } from "@/components/providers/session-provider";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
