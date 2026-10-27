"use client";

import { ButtonLink } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { openConsentBanner } from "@/lib/consent";
import { useSession } from "@/lib/session";

export default function SettingsPage() {
  const { user } = useSession();

  if (!user) return null;

  return (
    <PageTransition>
      <h1 className="text-[40px] font-bold tracking-tight">Settings</h1>
      <ul className="mt-10 max-w-md space-y-6 text-[16px]">
        <li className="flex items-center justify-between border-b border-border py-4">
          <span>Voice</span>
          <span className="text-muted">{user.voice}</span>
        </li>
        <li className="flex items-center justify-between border-b border-border py-4">
          <span>Personality</span>
          <span className="text-muted capitalize">{user.personality}</span>
        </li>
        <li className="flex items-center justify-between border-b border-border py-4">
          <span>Language</span>
          <span className="text-muted">{user.language === "fr" ? "French" : "English"}</span>
        </li>
        <li className="flex items-center justify-between border-b border-border py-4">
          <span>Cookies</span>
          <button
            type="button"
            onClick={() => openConsentBanner()}
            className="text-[14px] font-medium text-ink underline underline-offset-4"
          >
            Manage
          </button>
        </li>
      </ul>
      <div className="mt-10">
        <ButtonLink href="/app/create" variant="ghost">
          Update agent →
        </ButtonLink>
      </div>
    </PageTransition>
  );
}
