/* Changelog: trust copy stays; lock / eye-off icons for scan; fade-only, no playful motion. */
"use client";

import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  googleOnlySignupMessage,
  signupShouldResendConfirmation,
} from "@/lib/auth/account-providers";
import { authCallbackUrl, authConfirmUrl } from "@/lib/auth/email-redirect";
import { safeNextPath } from "@/lib/auth/safe-next";
import { authFormSchema, type AuthFormValues } from "@/lib/auth/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.4-1.1 2.6-2.4 3.4v2.8h3.8c2.3-2.1 3.6-5.2 3.6-8.3z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.8c-1.1.7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.4v3c2 4 6.1 6.5 10.6 6.5z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.5c-.2-.7-.4-1.4-.4-2.1s.1-1.5.4-2.1V7.3H1.4C.5 8.9 0 10.4 0 12.4c0 1.9.5 3.5 1.4 5.1l3.9-3z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.3 2.6 1.4 6.6l3.9 3c.9-2.8 3.6-4.8 6.7-4.8z"
      />
    </svg>
  );
}

function messageForError(code?: string | null) {
  if (code === "auth_failed") {
    return "Could not finish sign-in from that link. If you signed up with email, sign in with your password.";
  }
  if (code === "expired") {
    return "This email link was already used or expired. If you already confirmed, sign in with your password.";
  }
  if (code === "denied") {
    return "Sign-in was cancelled. Try again when you are ready.";
  }
  if (code === "config") {
    return "Auth is not configured. Add your Supabase keys to .env.local.";
  }
  return null;
}

function noticeForParam(code?: string | null) {
  if (code === "confirm_login") {
    return "Your email is confirmed. Sign in with your password.";
  }
  return null;
}

function friendlyAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("email rate")) {
    return "Too many emails just now. Wait a minute and try again.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "That email already has an account. If you used Google, continue with Google.";
  }
  if (lower.includes("invalid login")) {
    return "Email or password is wrong. If you signed up with Google, use Continue with Google.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email first. Check your inbox for the Profili link.";
  }
  return message;
}

export function AuthCard({
  mode,
  error: errorParam,
  next: nextParam,
}: {
  mode: "login" | "signup";
  error?: string;
  next?: string;
}) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [busy, setBusy] = useState<"google" | "form" | null>(null);
  const [error, setError] = useState(messageForError(errorParam));
  const [notice, setNotice] = useState(noticeForParam(errorParam));
  const nextPath = safeNextPath(nextParam);
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema(isSignup)),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function emailIsGoogleOnly(value: string) {
    const response = await fetch("/api/auth/email-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: value }),
    });
    const payload = (await response.json().catch(() => ({}))) as { googleOnly?: boolean };
    return Boolean(payload.googleOnly);
  }

  async function onGoogle() {
    setError(null);
    setNotice(null);
    if (!isSupabaseConfigured()) {
      setError(messageForError("config"));
      return;
    }
    setBusy("google");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: authCallbackUrl(nextPath) },
      });
      if (oauthError) setError(friendlyAuthError(oauthError.message));
    } catch {
      setError(messageForError("config"));
    } finally {
      setBusy(null);
    }
  }

  async function onSubmit(values: AuthFormValues) {
    setError(null);
    setNotice(null);
    if (!isSupabaseConfigured()) {
      setError(messageForError("config"));
      return;
    }
    setBusy("form");
    try {
      if (await emailIsGoogleOnly(values.email)) {
        setError(googleOnlySignupMessage());
        return;
      }
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const confirmRedirect = authConfirmUrl(nextPath);

      async function resendSignupMail(email: string) {
        return supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: confirmRedirect },
        });
      }

      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { full_name: values.name ?? "" },
            emailRedirectTo: confirmRedirect,
          },
        });
        const verdict = signupShouldResendConfirmation({
          user: data.user,
          errorMessage: signUpError?.message,
        });
        if (verdict === "google_only") {
          setError(googleOnlySignupMessage());
          return;
        }
        if (verdict === "resend") {
          const { error: resendError } = await resendSignupMail(values.email);
          if (resendError) {
            if (/rate limit|email rate/i.test(resendError.message)) {
              setError(friendlyAuthError(resendError.message));
              return;
            }
            setError(
              "That email already has an account. Sign in with your password, or reset it if you already confirmed.",
            );
            return;
          }
          setNotice(
            "We sent another confirmation link. Open it, tap Confirm email, then sign in with the password from your first signup. Check spam if it is not there in a minute.",
          );
          return;
        }
        if (signUpError) {
          setError(friendlyAuthError(signUpError.message));
          return;
        }
        if (!data.session) {
          setNotice(
            "We sent a confirmation link. Open it, tap Confirm email, then sign in here with your password. Check spam if it is not there in a minute.",
          );
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (signInError) {
          if (/email not confirmed/i.test(signInError.message)) {
            const { error: resendError } = await resendSignupMail(values.email);
            if (!resendError) {
              setNotice(
                "This address is not confirmed yet. We sent a new confirmation link. Open it, tap Confirm email, then sign in with the same password.",
              );
              return;
            }
          }
          setError(friendlyAuthError(signInError.message));
          return;
        }
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError(messageForError("config"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-[32px] font-semibold tracking-tight text-ink">
        {isSignup ? "Create your AI" : "Welcome back"}
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        {isSignup
          ? "Upload your experience. Choose your voice. Start talking."
          : "Sign in to your Profili workspace."}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mt-5 rounded-lg border border-[#01497C]/20 bg-[#F7FAFC] px-3 py-2 text-[13px] text-ink dark:border-[#89C2D9]/30 dark:bg-[#012A4A]/30"
        >
          {notice}
        </p>
      )}

      <button
        type="button"
        onClick={onGoogle}
        disabled={busy !== null}
        className="mt-8 flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-surface text-[15px] font-medium text-ink transition-colors duration-150 hover:border-steel/40 hover:bg-subtle disabled:opacity-60"
      >
        <GoogleMark />
        {busy === "google" ? "Redirecting..." : "Continue with Google"}
      </button>
      <p className="mt-2 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
        <span className="mt-0.5 flex shrink-0 gap-1 text-steel">
          <Lock size={13} strokeWidth={2.2} aria-hidden />
          <EyeOff size={13} strokeWidth={2.2} aria-hidden />
        </span>
        <span>
        Google is used only to get your name and email so we can create or open your account. We do not
        access Gmail or Drive.{" "}
        <Link href="/privacy" className="font-medium text-ink underline underline-offset-4">
          Privacy Policy
        </Link>
        </span>
      </p>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-ink/15" />
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Or</span>
        <span className="h-px flex-1 bg-ink/15" />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {isSignup ? (
          <AuthField label="Name" error={form.formState.errors.name?.message}>
            {(className) => (
              <input
                {...form.register("name")}
                placeholder="Waseem Javed"
                autoComplete="name"
                className={className}
              />
            )}
          </AuthField>
        ) : null}
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
        <AuthField
          label="Password"
          error={form.formState.errors.password?.message}
          extra={
            !isSignup ? (
              <Link href="/forgot" className="font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
                Forgot?
              </Link>
            ) : null
          }
        >
          {(className) => (
            <input
              {...form.register("password")}
              type="password"
              placeholder="••••••••"
              autoComplete={isSignup ? "new-password" : "current-password"}
              className={className}
            />
          )}
        </AuthField>
        <button
          type="submit"
          disabled={busy !== null}
          className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-btn text-[15px] font-medium text-btn-fg transition-all duration-150 hover:bg-btn-hover active:scale-[0.98] disabled:opacity-60"
        >
          {busy === "form" ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-[12px] leading-relaxed text-muted">
        By continuing you agree to the{" "}
        <Link href="/terms" className="font-medium text-ink underline underline-offset-4">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-medium text-ink underline underline-offset-4">
          Privacy Policy
        </Link>
        . Cookies are explained in the{" "}
        <Link href="/cookies" className="font-medium text-ink underline underline-offset-4">
          Cookie Policy
        </Link>
        .
      </p>

      <p className="mt-8 text-center text-[14px] text-muted">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-ink">
              Log in
            </Link>
          </>
        ) : (
          <>
            No account?{" "}
            <Link href="/signup" className="font-bold text-ink">
              Create your AI
            </Link>
          </>
        )}
      </p>
    </AuthShell>
  );
}
