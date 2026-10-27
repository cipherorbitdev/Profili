import { profileJsonSchema, type OwnerProfileRow, type ProfileJson } from "@/lib/resume/schema";
import type { SupabaseClient } from "@supabase/supabase-js";

export const OWNER_PROFILE_COLUMNS =
  "id, user_id, slug, status, parse_status, parse_error, full_name, greeting, profile_json, resume_path";

export function emptyProfileJson(fullName: string): ProfileJson {
  return {
    full_name: fullName || "You",
    headline: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    voice: "Alex",
    personality: "professional",
    formality: 0.3,
    verbosity: 0.5,
  };
}

export function toOwnerProfile(row: {
  id: string;
  user_id: string;
  slug: string | null;
  status: "draft" | "published";
  parse_status?: string | null;
  parse_error?: string | null;
  full_name: string;
  greeting: string;
  profile_json: unknown;
  resume_path: string | null;
}): OwnerProfileRow {
  const json = profileJsonSchema.safeParse(row.profile_json);
  return {
    id: row.id,
    user_id: row.user_id,
    slug: row.slug,
    status: row.status,
    parse_status: (row.parse_status as OwnerProfileRow["parse_status"]) || "idle",
    parse_error: row.parse_error ?? null,
    full_name: row.full_name,
    greeting: row.greeting,
    profile_json: json.success ? json.data : emptyProfileJson(row.full_name),
    resume_path: row.resume_path,
  };
}

export async function ownerProfileIds(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from("profiles").select("id").eq("user_id", userId);
  return (data ?? []).map((row) => row.id as string);
}
