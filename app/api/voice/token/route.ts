import { getDb } from "@/lib/db/client";
import { calls } from "@/lib/db/schema";
import { EVENT_CALL_STARTED } from "@/lib/inngest/client";
import { emitEvent } from "@/lib/inngest/emit";
import { getPublishedProfile } from "@/lib/resume/public";
import { profileJsonSchema, visitorSchema, voiceTokenBodySchema } from "@/lib/resume/schema";
import { clientIp, hashIp } from "@/lib/voice/ip";
import { mintAssemblyToken } from "@/lib/voice/assembly-token";
import { ASSEMBLY_MAX_SESSION_SECONDS, CALL_SECONDS } from "@/lib/voice/call-window";
import { takeCallSlot } from "@/lib/voice/rate-limit";
import { buildVoiceSessionConfig } from "@/lib/voice/session-config";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Voice is not configured yet. Add ASSEMBLYAI_API_KEY." }, { status: 503 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Voice is not configured yet. Add DATABASE_URL." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = voiceTokenBodySchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.length ? issue.path.join(".") : "request";
    return NextResponse.json(
      { error: `${path}: ${issue?.message || "Invalid call request."}` },
      { status: 400 },
    );
  }

  const visitor = visitorSchema.parse(parsed.data.visitor);
  const published = await getPublishedProfile(parsed.data.slug);

  if (!published) {
    return NextResponse.json({ error: "This profile is not available." }, { status: 404 });
  }

  const recovered = {
    full_name: published.fullName || "There",
    headline: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    ...(typeof published.profileJson === "object" && published.profileJson ? published.profileJson : {}),
  };
  const profileJson = profileJsonSchema.safeParse(recovered);
  if (!profileJson.success) {
    return NextResponse.json(
      { error: `Profile data is invalid: ${profileJson.error.issues[0]?.message || "check review fields"}.` },
      { status: 422 },
    );
  }

  const db = getDb();
  const ip = hashIp(clientIp(request));
  const email = visitor.email.toLowerCase();

  const [emailOk, ipOk] = await Promise.all([takeCallSlot("email", email), takeCallSlot("ip", ip)]);
  if (!emailOk || !ipOk) {
    return NextResponse.json(
      { error: "Call limit reached. Try again in an hour." },
      { status: 429 },
    );
  }

  const transcriptToken = crypto.randomUUID();
  const [call] = await db
    .insert(calls)
    .values({
      profileId: published.id,
      visitorName: visitor.name,
      visitorPurpose: visitor.purpose,
      visitorEmail: email,
      ipHash: ip,
      transcriptToken,
    })
    .returning({ id: calls.id, transcriptToken: calls.transcriptToken });

  if (!call) {
    return NextResponse.json({ error: "Could not create the call record." }, { status: 500 });
  }

  const token = await mintAssemblyToken(apiKey, [ASSEMBLY_MAX_SESSION_SECONDS, CALL_SECONDS]);
  if (!token.ok) {
    await db
      .update(calls)
      .set({ endedAt: new Date(), durationSeconds: 0, insightStatus: "skipped" })
      .where(eq(calls.id, call.id));
    return NextResponse.json(
      {
        error: `Could not start the voice session (${token.status}). ${token.detail.slice(0, 240)}`,
      },
      { status: 502 },
    );
  }

  const sessionConfig = buildVoiceSessionConfig({
    fullName: published.fullName,
    greeting: published.greeting,
    profile: profileJson.data,
    visitorName: visitor.name,
    visitorPurpose: visitor.purpose,
  });

  try {
    await emitEvent(EVENT_CALL_STARTED, { callId: call.id });
  } catch (error) {
    console.error(JSON.stringify({ msg: "call.start_emit_failed", callId: call.id, error: String(error) }));
  }

  return NextResponse.json({
    token: token.token,
    callId: call.id,
    transcriptToken: call.transcriptToken,
    sessionConfig,
  });
}
