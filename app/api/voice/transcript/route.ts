import { requireUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db/client";
import { calls, transcriptTurns } from "@/lib/db/schema";
import { ownerProfileIds } from "@/lib/resume/owner";
import { voiceTranscriptBodySchema } from "@/lib/resume/schema";
import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const callId = new URL(request.url).searchParams.get("callId");
  if (!callId) {
    return NextResponse.json({ error: "Missing call." }, { status: 400 });
  }

  const { data: call } = await auth.supabase
    .from("calls")
    .select("id, profile_id")
    .eq("id", callId)
    .maybeSingle();
  if (!call) {
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }
  const ids = await ownerProfileIds(auth.supabase, auth.user.id);
  if (!ids.includes(call.profile_id)) {
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }

  const db = getDb();
  const turns = await db
    .select({
      seq: transcriptTurns.seq,
      speaker: transcriptTurns.speaker,
      text: transcriptTurns.text,
    })
    .from(transcriptTurns)
    .where(eq(transcriptTurns.callId, callId))
    .orderBy(asc(transcriptTurns.seq))
    .limit(4000);

  return NextResponse.json({ turns });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Voice is not configured yet." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = voiceTranscriptBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid transcript." }, { status: 400 });
  }

  const db = getDb();
  const [call] = await db
    .select({ id: calls.id })
    .from(calls)
    .where(and(eq(calls.id, parsed.data.callId), eq(calls.transcriptToken, parsed.data.transcriptToken)))
    .limit(1);

  if (!call) {
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }

  await db
    .insert(transcriptTurns)
    .values({
      callId: call.id,
      seq: parsed.data.seq,
      speaker: parsed.data.speaker,
      text: parsed.data.text,
    })
    .onConflictDoUpdate({
      target: [transcriptTurns.callId, transcriptTurns.seq],
      set: {
        speaker: parsed.data.speaker,
        text: parsed.data.text,
      },
    });

  return NextResponse.json({ ok: true });
}
