import { requireUser } from "@/lib/auth/require-user";
import { EVENT_RESUME_UPLOADED } from "@/lib/inngest/client";
import { emitEvent } from "@/lib/inngest/emit";
import { parseResumeBodySchema } from "@/lib/resume/schema";
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

  const parsed = parseResumeBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resume path." }, { status: 400 });
  }

  const { resume_path, profile_id } = parsed.data;
  if (!resume_path.toLowerCase().startsWith(`${auth.user.id.toLowerCase()}/`)) {
    return NextResponse.json({ error: "Invalid resume path." }, { status: 403 });
  }

  const row = {
    user_id: auth.user.id,
    resume_path,
    parse_status: "parsing",
    parse_error: null as string | null,
    status: "draft" as const,
  };

  let profile: { id: string } | null = null;
  let writeError: { message: string } | null = null;

  if (profile_id) {
    const { data, error } = await auth.supabase
      .from("profiles")
      .update({
        resume_path,
        parse_status: "parsing",
        parse_error: null,
        status: "draft",
      })
      .eq("id", profile_id)
      .eq("user_id", auth.user.id)
      .select("id")
      .maybeSingle();
    profile = data;
    writeError = error;
    if (!profile && !error) {
      return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    }
  } else {
    const { data, error } = await auth.supabase
      .from("profiles")
      .insert({ ...row, full_name: "", greeting: "" })
      .select("id")
      .single();
    profile = data;
    writeError = error;
  }

  if (writeError || !profile) {
    return NextResponse.json(
      { error: writeError?.message || "Could not queue the parse." },
      { status: 500 },
    );
  }

  try {
    await emitEvent(EVENT_RESUME_UPLOADED, { profileId: profile.id, resumePath: resume_path });
  } catch {
    await auth.supabase
      .from("profiles")
      .update({
        parse_status: "failed",
        parse_error: "Could not queue the parse. Retry in a moment.",
      })
      .eq("id", profile.id);
    return NextResponse.json(
      { error: "Could not queue the parse. Retry in a moment." },
      { status: 503 },
    );
  }

  return NextResponse.json({ profileId: profile.id, parse_status: "parsing" }, { status: 202 });
}
