import { ownerProfileIds } from "@/lib/resume/owner";
import { requireUser } from "@/lib/auth/require-user";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const ids = await ownerProfileIds(auth.supabase, auth.user.id);
  if (ids.length === 0) {
    return NextResponse.json({ calls: [] });
  }

  const { data, error } = await auth.supabase
    .from("calls")
    .select(
      "id, visitor_name, visitor_purpose, visitor_email, started_at, ended_at, duration_seconds, insight_status, insight_intent, insight_query, insight_summary, insight_citation, insight_grounded, insight_tone, insight_fit, insight_tone_label, insight_fit_label, assembly_session_id, messages ( id )",
    )
    .in("profile_id", ids)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(40);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const calls = (data ?? []).map((row) => {
    const left = Array.isArray(row.messages) ? row.messages.length > 0 : Boolean(row.messages);
    return {
      ...row,
      left_message: left,
    };
  });

  return NextResponse.json({ calls });
}
