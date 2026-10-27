"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseCookieOptions } from "./cookie-options";
import { getSupabasePublicEnv } from "./env";

export function createClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  return createBrowserClient(url, anonKey, {
    cookieOptions: supabaseCookieOptions(secure),
  });
}
