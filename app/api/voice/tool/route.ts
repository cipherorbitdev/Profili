import { getDb } from "@/lib/db/client";
import { calls, messages, profiles } from "@/lib/db/schema";
import { clientIp, hashIp } from "@/lib/voice/ip";
import { takeCallSlot } from "@/lib/voice/rate-limit";
import { notifyOwnerOfMessage } from "@/lib/voice/notify-message-job";
import {
  leaveMessageArgsSchema,
  parseToolArguments,
  toolRequestSchema,
} from "@/lib/voice/tool-args";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = toolRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message || "Invalid tool call." });
  }

  const db = getDb();
  const [call] = await db
    .select({
      id: calls.id,
      profileId: calls.profileId,
      visitorName: calls.visitorName,
      visitorEmail: calls.visitorEmail,
      endedAt: calls.endedAt,
      transcriptToken: calls.transcriptToken,
    })
    .from(calls)
    .where(and(eq(calls.id, parsed.data.callId), eq(calls.transcriptToken, parsed.data.transcriptToken)))
    .limit(1);

  if (!call) {
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }
  if (call.endedAt && Date.now() - call.endedAt.getTime() > 60_000) {
    return NextResponse.json({ ok: false, message: "This call has ended." });
  }

  const ip = hashIp(clientIp(request));
  const [ipOk, callOk] = await Promise.all([
    takeCallSlot("tool-ip", ip),
    takeCallSlot("tool-call", call.id),
  ]);
  if (!ipOk || !callOk) {
    return NextResponse.json({ error: "Too many tool calls. Try again in an hour." }, { status: 429 });
  }

  let args: unknown;
  try {
    args = parseToolArguments(parsed.data.arguments);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid tool arguments." });
  }

  if (parsed.data.name !== "leave_message_for_owner") {
    return NextResponse.json({ ok: false, message: "Unknown tool." });
  }

  const body = leaveMessageArgsSchema.safeParse(args);
  if (!body.success) {
    return NextResponse.json({
      ok: false,
      message: body.error.issues[0]?.message || "Could not save that message.",
    });
  }

  const [owner] = await db
    .select({ fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.id, call.profileId))
    .limit(1);
  const firstName = (owner?.fullName || "They").split(/\s+/).filter(Boolean)[0] || "They";

  try {
    const [row] = await db
      .insert(messages)
      .values({
        callId: call.id,
        profileId: call.profileId,
        body: body.data.message,
        intent: body.data.intent ?? null,
        visitorName: call.visitorName,
        visitorEmail: call.visitorEmail,
      })
      .returning({ id: messages.id });

    if (row) {
      void notifyOwnerOfMessage(row.id).catch((error) => {
        console.error(JSON.stringify({ msg: "message.notify_enqueue_failed", messageId: row.id, error: String(error) }));
      });
    }
    return NextResponse.json({
      ok: true,
      message: `Saved. ${firstName} will get it by email.`,
    });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
    if (code === "23505") {
      return NextResponse.json({ ok: false, message: "already sent" });
    }
    throw error;
  }
}
