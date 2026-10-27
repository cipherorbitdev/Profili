import { AuthShell } from "@/components/auth/auth-shell";
import { EmailConfirmForm } from "@/components/auth/email-confirm-form";
import { noIndex } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: noIndex,
};

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string;
    type?: string;
    next?: string;
    code?: string;
    sb_flow_id?: string;
  }>;
}) {
  const params = await searchParams;

  if (params.code) {
    const query = new URLSearchParams();
    query.set("code", params.code);
    if (params.next) query.set("next", params.next);
    if (params.sb_flow_id) query.set("sb_flow_id", params.sb_flow_id);
    redirect(`/auth/callback?${query.toString()}`);
  }

  if (params.token_hash) {
    return (
      <EmailConfirmForm
        tokenHash={params.token_hash}
        type={params.type ?? "signup"}
        next={params.next}
      />
    );
  }

  return (
    <AuthShell>
      <h1 className="text-[32px] font-semibold tracking-tight text-ink">Link incomplete</h1>
      <p className="mt-2 text-[15px] text-muted">
        Use the button in your latest Profili email, or sign in if you already confirmed.
      </p>
      <p className="mt-8 text-center text-[14px] text-muted">
        <Link href="/login" className="font-bold text-ink">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
