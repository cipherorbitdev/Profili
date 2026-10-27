import { PASSWORD_RESET_COOKIE, passwordResetCookieOptions } from "@/lib/auth/reset-cookie";
import { requestOrigin, safeNextPath } from "@/lib/auth/safe-next";
import { supabaseCookieOptions, supabaseCookieSecureFromRequest } from "@/lib/supabase/cookie-options";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function loginErrorUrl(origin: string, code: string) {
  return new URL(`/login?error=${encodeURIComponent(code)}`, origin);
}

function errorFromCallbackParams(url: URL) {
  const errorCode = url.searchParams.get("error_code");
  const error = url.searchParams.get("error");
  if (errorCode === "otp_expired") return "expired";
  if (error === "access_denied") return "denied";
  if (error || errorCode) return "auth_failed";
  return null;
}

function attachResetCookie(response: NextResponse, secure: boolean) {
  response.cookies.set(PASSWORD_RESET_COOKIE, "1", passwordResetCookieOptions(secure));
}

function createCallbackClient(request: NextRequest, response: NextResponse) {
  const { url, anonKey } = getSupabasePublicEnv();
  return createServerClient(url, anonKey, {
    cookieOptions: supabaseCookieOptions(supabaseCookieSecureFromRequest(request)),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
        Object.entries(headers ?? {}).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = requestOrigin(request);
  const next = safeNextPath(url.searchParams.get("next"));
  const secure = supabaseCookieSecureFromRequest(request);

  const providerError = errorFromCallbackParams(url);
  if (providerError) {
    return NextResponse.redirect(loginErrorUrl(origin, providerError));
  }

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const typeParam = url.searchParams.get("type");
  const flowId = url.searchParams.get("sb_flow_id");

  if (code) {
    const dest = next === "/reset-password" ? "/reset-password" : next;
    const redirect = NextResponse.redirect(new URL(dest, origin));
    const supabase = createCallbackClient(request, redirect);
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );
    if (error) {
      console.error("auth callback: code exchange failed", error.message);
      // Email apps open the link without the signup PKCE cookie. The address is
      // usually already confirmed; password sign-in is the reliable next step.
      return NextResponse.redirect(loginErrorUrl(origin, "confirm_login"));
    }
    if (dest === "/reset-password") attachResetCookie(redirect, secure);
    return redirect;
  }

  if (tokenHash && typeParam && OTP_TYPES.has(typeParam as EmailOtpType)) {
    const dest = typeParam === "recovery" ? "/reset-password" : next;
    const redirect = NextResponse.redirect(new URL(dest, origin));
    const supabase = createCallbackClient(request, redirect);
    const { error } = await supabase.auth.verifyOtp({
      type: typeParam as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) {
      console.error("auth callback: otp verify failed", error.message);
      return NextResponse.redirect(loginErrorUrl(origin, "expired"));
    }
    if (typeParam === "recovery" || dest === "/reset-password") {
      attachResetCookie(redirect, secure);
    }
    return redirect;
  }

  return NextResponse.redirect(loginErrorUrl(origin, "auth_failed"));
}
