import { PASSWORD_RESET_COOKIE } from "@/lib/auth/reset-cookie";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseCookieOptions, supabaseCookieSecureFromRequest } from "./cookie-options";
import { getSupabasePublicEnv, isSupabaseConfigured } from "./env";

function applyAuthCookies(
  from: NextResponse,
  to: NextResponse,
) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  for (const header of ["cache-control", "expires", "pragma"] as const) {
    const value = from.headers.get(header);
    if (value) to.headers.set(header, value);
  }
  return to;
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  // PKCE verifiers live in cookies. getUser() on this path can treat a stale
  // session as invalid and wipe those cookies before the code is exchanged.
  if (request.nextUrl.pathname === "/auth/callback" || request.nextUrl.pathname === "/auth/confirm") {
    return NextResponse.next({ request });
  }

  const { url, anonKey } = getSupabasePublicEnv();
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: supabaseCookieOptions(supabaseCookieSecureFromRequest(request)),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isApp = path === "/app" || path.startsWith("/app/");
  const isAuthForm = path === "/login" || path === "/signup" || path === "/forgot";
  const isPasswordReset = path === "/reset-password";
  const hasResetCookie = request.cookies.get(PASSWORD_RESET_COOKIE)?.value === "1";

  if (isApp && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", path);
    return applyAuthCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  if (isPasswordReset && !hasResetCookie) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = user ? "/app" : "/forgot";
    redirectUrl.search = "";
    return applyAuthCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  if (isAuthForm && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    redirectUrl.search = "";
    return applyAuthCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  return supabaseResponse;
}
