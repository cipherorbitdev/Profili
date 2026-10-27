type Artifact = { type?: string; url?: string };

type TimelineTurn = {
  speaker?: string;
  role?: string;
  text?: string;
  user_transcript?: string;
  agent_text?: string;
  agent_transcript?: string;
};

export type CanonicalTurn = {
  speaker: "visitor" | "agent";
  text: string;
};

function push(out: CanonicalTurn[], speaker: "visitor" | "agent", text: string | undefined) {
  const trimmed = (text ?? "").trim();
  if (trimmed) out.push({ speaker, text: trimmed });
}

export function turnsFromTimeline(payload: unknown): CanonicalTurn[] {
  const out: CanonicalTurn[] = [];
  const root = payload as {
    turns?: TimelineTurn[];
    timeline?: TimelineTurn[];
    messages?: TimelineTurn[];
    items?: TimelineTurn[];
  };
  const rows = root.turns || root.timeline || root.messages || root.items;
  const list = Array.isArray(rows) ? rows : Array.isArray(payload) ? (payload as TimelineTurn[]) : [];

  for (const row of list) {
    if (row.user_transcript || row.agent_text || row.agent_transcript) {
      push(out, "visitor", row.user_transcript);
      push(out, "agent", row.agent_text || row.agent_transcript);
      continue;
    }
    const speakerRaw = (row.speaker || row.role || "").toLowerCase();
    const speaker: "visitor" | "agent" =
      speakerRaw === "agent" || speakerRaw === "assistant" ? "agent" : "visitor";
    push(out, speaker, row.text);
  }
  return out;
}

export async function fetchSessionTimeline(sessionId: string, apiKey: string) {
  const sessionResponse = await fetch(`https://agents.assemblyai.com/v1/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!sessionResponse.ok) {
    throw new Error(`AssemblyAI session ${sessionResponse.status}`);
  }
  const session = (await sessionResponse.json()) as { artifacts?: Artifact[]; status?: string };
  const timeline = session.artifacts?.find((item) => item.type === "timeline" && item.url);
  if (!timeline?.url) {
    return { ready: false as const, turns: [] as CanonicalTurn[], status: session.status };
  }
  const file = await fetch(timeline.url);
  if (!file.ok) {
    throw new Error(`Timeline download ${file.status}`);
  }
  const payload: unknown = await file.json();
  return { ready: true as const, turns: turnsFromTimeline(payload), status: session.status };
}
