import { requireUser } from "@/lib/auth/require-user";
import { OWNER_PROFILE_COLUMNS, toOwnerProfile } from "@/lib/resume/owner";
import {
  buildStoredProfile,
  draftBodySchema,
  type ProfileJson,
} from "@/lib/resume/schema";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const id = new URL(request.url).searchParams.get("id");
  const { data, error } = await auth.supabase
    .from("profiles")
    .select(OWNER_PROFILE_COLUMNS)
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profiles = (data ?? []).map(toOwnerProfile);
  const profile = id ? (profiles.find((row) => row.id === id) ?? null) : null;
  return NextResponse.json({ profiles, profile });
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = draftBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid profile." },
      { status: 400 },
    );
  }

  const { data: existing } = await auth.supabase
    .from("profiles")
    .select("id, profile_json")
    .eq("id", parsed.data.profile_id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Parse a resume first." }, { status: 400 });
  }

  const current = (existing.profile_json ?? {}) as Partial<ProfileJson>;
  const profile_json = buildStoredProfile(current, {
    full_name: parsed.data.full_name,
    headline: parsed.data.headline,
    summary: parsed.data.summary,
    experience: parsed.data.experience,
    skills: parsed.data.skills,
  });

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      greeting: parsed.data.greeting,
      profile_json,
      slug: parsed.data.slug,
    })
    .eq("id", existing.id)
    .eq("user_id", auth.user.id)
    .select(OWNER_PROFILE_COLUMNS)
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { error: error?.message || "Could not save the profile." },
      { status: 500 },
    );
  }

  return NextResponse.json({ profile: toOwnerProfile(profile) });
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const id =
    typeof json === "object" && json && "id" in json ? String((json as { id?: string }).id) : "";
  if (!id) {
    return NextResponse.json({ error: "Missing agent." }, { status: 400 });
  }

  const { data: existing } = await auth.supabase
    .from("profiles")
    .select("id, resume_path")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  if (existing.resume_path) {
    await auth.supabase.storage.from("resumes").remove([existing.resume_path]);
  }

  const { error } = await auth.supabase.from("profiles").delete().eq("id", existing.id).eq("user_id", auth.user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
