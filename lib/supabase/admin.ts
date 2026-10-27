import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./env";

export function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function createAdminClient() {
  const key = getServiceRoleKey();
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  const { url } = getSupabasePublicEnv();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
