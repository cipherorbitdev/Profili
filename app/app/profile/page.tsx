"use client";

import { PageTransition } from "@/components/ui/page-transition";
import { useSession } from "@/lib/session";

export default function ProfilePage() {
  const { user } = useSession();
  if (!user) return null;

  return (
    <PageTransition>
      <h1 className="text-[40px] font-bold tracking-tight">Profile</h1>
      <dl className="mt-10 max-w-md space-y-6">
        <div>
          <dt className="label">Name</dt>
          <dd className="mt-1 text-[18px]">{user.name}</dd>
        </div>
        <div>
          <dt className="label">Email</dt>
          <dd className="mt-1 text-[18px]">{user.email}</dd>
        </div>
        <div>
          <dt className="label">Handle</dt>
          <dd className="mt-1 font-mono text-[16px]">@{user.handle}</dd>
        </div>
        <div>
          <dt className="label">Role</dt>
          <dd className="mt-1 text-[18px]">{user.role || "—"}</dd>
        </div>
      </dl>
    </PageTransition>
  );
}
