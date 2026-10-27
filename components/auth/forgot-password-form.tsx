"use client";

import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { forgotSchema, type ForgotValues } from "@/lib/auth/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotValues) {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Auth is not configured. Add your Supabase keys to .env.local.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      if (response.status === 429) {
        setError("Too many emails just now. Wait a minute and try again.");
        return;
      }
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error || "Could not send a reset link.");
        return;
      }
      setSent(true);
    } catch {
      setError("Could not send a reset link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-[32px] font-semibold tracking-tight text-ink">Reset your password</h1>
      <p className="mt-2 text-[15px] text-muted">
        Enter the email on your account. If it is registered with a password, we send a reset link.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </p>
      ) : null}

      {sent ? (
        <p
          role="status"
          className="mt-8 rounded-lg border border-[#01497C]/20 bg-[#F7FAFC] px-3 py-2 text-[13px] text-ink dark:border-[#89C2D9]/30 dark:bg-[#012A4A]/30"
        >
          If that email has a password login, the reset link is on its way. Google-only accounts should
          continue with Google.
        </p>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
          <AuthField label="Email" error={form.formState.errors.email?.message}>
            {(className) => (
              <input
                {...form.register("email")}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={className}
              />
            )}
          </AuthField>
          <button
            type="submit"
            disabled={busy}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-btn text-[15px] font-medium text-btn-fg transition-all duration-150 hover:bg-btn-hover active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-[14px] text-muted">
        <Link href="/login" className="font-bold text-ink">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
