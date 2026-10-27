import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { supabaseCookieOptions, supabaseCookieSecureFromHostHeaders } from "./cookie-options";
import { getSupabasePublicEnv } from "./env";

export async function createClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  const cookieStore = await cookies();
  const headerList = await headers();

  return createServerClient(url, anonKey, {
    cookieOptions: supabaseCookieOptions(supabaseCookieSecureFromHostHeaders(headerList)),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. proxy.ts refreshes the session.
        }
      },
    },
  });
}
