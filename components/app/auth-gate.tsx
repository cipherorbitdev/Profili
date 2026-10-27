"use client";

import { useSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-[11px] tracking-wide text-muted uppercase">Workspace</p>
        <p className="mt-2 text-[15px] text-ink">Loading your account…</p>
      </div>
    );
  }

  return <>{children}</>;
}
