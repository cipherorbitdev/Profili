import { createAdminClient, getServiceRoleKey } from "@/lib/supabase/admin";
import { providersFromUser } from "@/lib/auth/account-providers";

export async function lookupAuthProvidersByEmail(email: string) {
  if (!getServiceRoleKey()) return null;
  const normalized = email.trim().toLowerCase();
  const admin = createAdminClient();
  const { data: row } = await admin.from("users").select("id").ilike("email", normalized).maybeSingle();
  if (!row?.id) return [];
  const { data, error } = await admin.auth.admin.getUserById(row.id);
  if (error || !data.user) return [];
  return providersFromUser(data.user);
}
