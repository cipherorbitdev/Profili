import { requireUser } from "@/lib/auth/require-user";
import { buildStoredProfile, publishBodySchema, type ProfileJson } from "@/lib/resume/schema";
import { uniqueSlug } from "@/lib/resume/sanitize";
import { publicProfileUrl } from "@/lib/site";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = publishBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid publish payload." },
      { status: 400 },
    );
  }

  const { user, supabase } = auth;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, profile_json, slug")
    .eq("id", parsed.data.profile_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Parse a resume before publishing." }, { status: 400 });
  }

  const existingId = existing.id;
  const current = (existing.profile_json ?? {}) as Partial<ProfileJson>;
  const profileJson = buildStoredProfile(current, {
    full_name: parsed.data.full_name,
    headline: parsed.data.headline,
    summary: parsed.data.summary,
    experience: parsed.data.experience,
    skills: parsed.data.skills,
    voice: parsed.data.voice,
    personality: parsed.data.personality,
    formality: parsed.data.formality,
    verbosity: parsed.data.verbosity,
  });

  async function slugTaken(slug: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", slug)
      .neq("id", existingId)
      .maybeSingle();
    return Boolean(data);
  }

  let slug = parsed.data.slug;
  if (await slugTaken(slug)) {
    slug = await uniqueSlug(slug, slugTaken);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      greeting: parsed.data.greeting,
      profile_json: profileJson,
      slug,
      status: "published",
    })
    .eq("id", existingId)
    .eq("user_id", user.id)
    .select("id, slug, status, full_name, greeting, profile_json")
    .single();

  if (error || !profile?.slug) {
    return NextResponse.json(
      { error: error?.message || "Could not publish." },
      { status: 500 },
    );
  }

  revalidateTag(`profile:${profile.slug}`, "max");
  if (existing.slug && existing.slug !== profile.slug) {
    revalidateTag(`profile:${existing.slug}`, "max");
  }

  return NextResponse.json({
    profile,
    url: publicProfileUrl(profile.slug),
  });
}
