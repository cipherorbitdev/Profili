import { requireUser } from "@/lib/auth/require-user";
import { mintAssemblyToken } from "@/lib/voice/assembly-token";
import {
  ASSEMBLY_VOICES,
  assemblyVoiceId,
  VOICE_PREVIEW_GREETING,
} from "@/lib/voice/assembly-voices";
import { NextResponse } from "next/server";
import { z } from "zod";

const ids = ASSEMBLY_VOICES.map((voice) => voice.id);
const bodySchema = z.object({
  voice: z.string().trim().min(1).max(40),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Voice is not configured yet. Add ASSEMBLYAI_API_KEY." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pick a voice to preview." }, { status: 400 });
  }

  const voice = assemblyVoiceId(parsed.data.voice);
  if (!ids.includes(voice)) {
    return NextResponse.json({ error: "That voice is not available." }, { status: 400 });
  }

  const token = await mintAssemblyToken(apiKey, [60]);
  if (!token.ok) {
    return NextResponse.json(
      { error: `Could not start the voice preview (${token.status}).` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    token: token.token,
    sessionConfig: {
      type: "session.update",
      session: {
        system_prompt: "Do not speak after the greeting. Stay silent.",
        greeting: VOICE_PREVIEW_GREETING,
        input: {
          format: { encoding: "audio/pcm" },
          turn_detection: { interrupt_response: false },
        },
        output: {
          voice,
          format: { encoding: "audio/pcm" },
          volume: 100,
        },
      },
    },
  });
}
