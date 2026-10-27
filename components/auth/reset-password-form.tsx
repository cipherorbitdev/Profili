"use client";

import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/auth/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export function ResetPasswordForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setHasSession(Boolean(user));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(values: ResetPasswordValues) {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Auth is not configured. Add your Supabase keys to .env.local.");
      return;
    }
    setBusy(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const { error: updateError } = await createClient().auth.updateUser({ password: values.password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      await fetch("/api/auth/complete-reset", { method: "POST" });
      router.replace("/app");
      router.refresh();
    } catch {
      setError("Could not update your password. Request a new reset link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-[32px] font-semibold tracking-tight text-ink">Choose a new password</h1>
      <p className="mt-2 text-[15px] text-muted">Use at least 8 characters.</p>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </p>
      ) : null}

      {!ready ? (
        <p className="mt-8 text-[14px] text-muted">Checking your reset link…</p>
      ) : !hasSession ? (
        <p className="mt-8 text-[14px] text-muted">
          This reset link is invalid or expired.{" "}
          <Link href="/forgot" className="font-bold text-ink">
            Request a new one
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
          <AuthField label="New password" error={form.formState.errors.password?.message}>
            {(className) => (
              <input
                {...form.register("password")}
                type="password"
                autoComplete="new-password"
                className={className}
              />
            )}
          </AuthField>
          <AuthField label="Confirm password" error={form.formState.errors.confirm?.message}>
            {(className) => (
              <input
                {...form.register("confirm")}
                type="password"
                autoComplete="new-password"
                className={className}
              />
            )}
          </AuthField>
          <button
            type="submit"
            disabled={busy}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-btn text-[15px] font-medium text-btn-fg transition-all duration-150 hover:bg-btn-hover active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
