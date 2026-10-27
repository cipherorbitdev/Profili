import { AuthGate } from "@/components/app/auth-gate";
import { AppNav } from "@/components/app/top-bar";
import { noIndex } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: noIndex,
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-background">
      <AuthGate>
        <AppNav />
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>
      </AuthGate>
    </div>
  );
}
