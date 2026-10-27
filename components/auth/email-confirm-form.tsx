import { AuthShell } from "@/components/auth/auth-shell";
import { safeNextPath } from "@/lib/auth/safe-next";
import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";

const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export function EmailConfirmForm({
  tokenHash,
  type,
  next,
}: {
  tokenHash: string;
  type: string;
  next?: string;
}) {
  const otpType = OTP_TYPES.has(type) ? (type as EmailOtpType) : "signup";
  const nextPath = safeNextPath(next);
  const isRecovery = otpType === "recovery";

  return (
    <AuthShell>
      <h1 className="text-[32px] font-semibold tracking-tight text-ink">
        {isRecovery ? "Reset your password" : "Confirm your email"}
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        {isRecovery
          ? "This page stops email apps from using the reset link before you do. Continue to choose a new password."
          : "This page stops email apps from using the confirmation link before you do. Confirm, then sign in with your password if asked."}
      </p>
      <form action="/auth/callback" method="get" className="mt-8 space-y-4">
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={otpType} />
        <input type="hidden" name="next" value={nextPath} />
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-btn text-[15px] font-medium text-btn-fg transition-all duration-150 hover:bg-btn-hover active:scale-[0.98]"
        >
          {isRecovery ? "Continue" : "Confirm email"}
        </button>
      </form>
      <p className="mt-8 text-center text-[14px] text-muted">
        Wrong inbox?{" "}
        <Link href="/login" className="font-bold text-ink">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
