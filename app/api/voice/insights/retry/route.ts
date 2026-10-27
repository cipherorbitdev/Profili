import { requireUser } from "@/lib/auth/require-user";
import { EVENT_CALL_ENDED } from "@/lib/inngest/client";
import { emitEvent } from "@/lib/inngest/emit";
import { ownerProfileIds } from "@/lib/resume/owner";
import { z } from "zod";
import { NextResponse } from "next/server";

const bodySchema = z.object({ callId: z.string().uuid() });

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid call." }, { status: 400 });
  }

  const { data: call } = await auth.supabase
    .from("calls")
    .select("id, insight_status, profile_id")
    .eq("id", parsed.data.callId)
    .maybeSingle();

  if (!call) {
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }

  const ids = await ownerProfileIds(auth.supabase, auth.user.id);
  if (!ids.includes(call.profile_id)) {
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }

  if (call.insight_status === "ready") {
    return NextResponse.json({ ok: true });
  }

  await auth.supabase
    .from("calls")
    .update({ insight_status: "pending" })
    .eq("id", call.id);

  await emitEvent(EVENT_CALL_ENDED, { callId: call.id });
  return NextResponse.json({ ok: true });
}
