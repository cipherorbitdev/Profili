import { getDb } from "@/lib/db/client";
import { calls } from "@/lib/db/schema";
import { voiceSessionBodySchema } from "@/lib/resume/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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

  const parsed = voiceSessionBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  }

  const db = getDb();
  const [call] = await db
    .update(calls)
    .set({ assemblySessionId: parsed.data.assemblySessionId })
    .where(and(eq(calls.id, parsed.data.callId), eq(calls.transcriptToken, parsed.data.transcriptToken)))
    .returning({ id: calls.id });

  if (!call) {
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
