import { getDb } from "@/lib/db/client";
import { calls } from "@/lib/db/schema";
import { EVENT_CALL_ENDED } from "@/lib/inngest/client";
import { emitEvent } from "@/lib/inngest/emit";
import { voiceEndBodySchema } from "@/lib/resume/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }
  const text = (await request.text()).trim();
  if (!text) throw new Error("empty");
  return JSON.parse(text) as unknown;
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Voice is not configured yet." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await readBody(request);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = voiceEndBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid call." }, { status: 400 });
  }

  const db = getDb();
  const [call] = await db
    .select({
      id: calls.id,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
    })
    .from(calls)
    .where(and(eq(calls.id, parsed.data.callId), eq(calls.transcriptToken, parsed.data.transcriptToken)))
    .limit(1);

  if (!call) {
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }

  if (parsed.data.assemblySessionId) {
    await db
      .update(calls)
      .set({ assemblySessionId: parsed.data.assemblySessionId })
      .where(eq(calls.id, call.id));
  }

  if (call.endedAt) {
    return NextResponse.json({ ok: true });
  }

  const endedAt = new Date();
  const durationSeconds = Math.max(0, Math.round((endedAt.getTime() - call.startedAt.getTime()) / 1000));

  await db
    .update(calls)
    .set({
      endedAt,
      durationSeconds,
      insightStatus: "pending",
    })
    .where(eq(calls.id, call.id));

  try {
    await emitEvent(EVENT_CALL_ENDED, { callId: call.id });
  } catch (error) {
    console.error(JSON.stringify({ msg: "call.end_emit_failed", callId: call.id, error: String(error) }));
  }

  return NextResponse.json({ ok: true, duration_seconds: durationSeconds });
}
