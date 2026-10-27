import type { SupabaseClient, User } from "@supabase/supabase-js";

function displayName(user: User) {
  const meta = user.user_metadata ?? {};
  if (typeof meta.full_name === "string" && meta.full_name.trim()) return meta.full_name.trim();
  if (typeof meta.name === "string" && meta.name.trim()) return meta.name.trim();
  return user.email?.split("@")[0] || "";
}

function avatarUrl(user: User) {
  const meta = user.user_metadata ?? {};
  if (typeof meta.avatar_url === "string") return meta.avatar_url;
  if (typeof meta.picture === "string") return meta.picture;
  return null;
}

export async function ensureAppUser(supabase: SupabaseClient, user: User) {
  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: (user.email ?? "").trim().toLowerCase(),
      full_name: displayName(user),
      avatar_url: avatarUrl(user),
    },
    { onConflict: "id" },
  );

  if (!error) return null;

  const missing =
    error.code === "PGRST205" ||
    /schema cache|could not find the table/i.test(error.message);

  return {
    missing,
    message: missing
      ? "Database tables are missing. Add DATABASE_URL to .env.local and run pnpm db:migrate."
      : error.message,
  };
}
