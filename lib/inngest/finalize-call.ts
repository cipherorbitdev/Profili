import { getDb } from "@/lib/db/client";
import { calls, transcriptTurns } from "@/lib/db/schema";
import { EVENT_CALL_ENDED, EVENT_CALL_STARTED, inngest } from "@/lib/inngest/client";
import { failedEventData } from "@/lib/inngest/emit";
import { fetchSessionTimeline } from "@/lib/voice/assembly-session";
import { CALL_SECONDS, STALE_CALL_GRACE_MS } from "@/lib/voice/call-window";
import { generateCallInsights } from "@/lib/voice/insights";
import { and, eq, isNull } from "drizzle-orm";
import { NonRetriableError } from "inngest";

async function failInsights(callId: string, error: unknown) {
  const db = getDb();
  await db.update(calls).set({ insightStatus: "failed" }).where(eq(calls.id, callId));
  console.error(JSON.stringify({ msg: "call.insights_failed", callId, error: String(error) }));
}

export const finalizeCallJob = inngest.createFunction(
  {
    id: "finalize-call",
    triggers: [{ event: EVENT_CALL_ENDED }],
    retries: 5,
    concurrency: [
      { key: "event.data.callId", limit: 1 },
      { limit: 2 },
    ],
    onFailure: async ({ event, error }) => {
      const { callId } = failedEventData<{ callId: string }>(event);
      if (callId) await failInsights(callId, error);
    },
  },
  async ({ event, step }) => {
    const { callId } = event.data as { callId: string };

    const started = await step.run("claim-call", async () => {
      const db = getDb();
      const [call] = await db
        .select({
          id: calls.id,
          insightStatus: calls.insightStatus,
          insightAttempts: calls.insightAttempts,
        })
        .from(calls)
        .where(eq(calls.id, callId))
        .limit(1);
      if (!call) throw new NonRetriableError("Call is gone.");
      if (call.insightStatus === "ready") return { skip: true as const };
      await db
        .update(calls)
        .set({
          insightStatus: "processing",
          insightAttempts: (call.insightAttempts ?? 0) + 1,
        })
        .where(eq(calls.id, callId));
      return { skip: false as const };
    });

    if (started.skip) return;

    let sessionId: string | null = null;
    for (let i = 0; i < 8; i += 1) {
      sessionId = await step.run(`read-session-id-${i}`, async () => {
        const db = getDb();
        const [call] = await db
          .select({ assemblySessionId: calls.assemblySessionId })
          .from(calls)
          .where(eq(calls.id, callId))
          .limit(1);
        return call?.assemblySessionId ?? null;
      });
      if (sessionId) break;
      await step.sleep(`wait-session-${i}`, "2s");
    }

    if (sessionId) {
      let lastError = "Timeline not ready.";
      let turns: { speaker: "visitor" | "agent"; text: string }[] | null = null;
      for (let i = 0; i < 6; i += 1) {
        const result = await step.run(`fetch-timeline-${i}`, async () => {
          const apiKey = process.env.ASSEMBLYAI_API_KEY;
          if (!apiKey) return { kind: "skip" as const };
          try {
            const timeline = await fetchSessionTimeline(sessionId, apiKey);
            if (!timeline.ready) {
              return { kind: "wait" as const, error: `Session ${timeline.status || "pending"}` };
            }
            return { kind: "ok" as const, turns: timeline.turns };
          } catch (error) {
            return {
              kind: "wait" as const,
              error: error instanceof Error ? error.message : "Timeline fetch failed.",
            };
          }
        });
        if (result.kind === "skip") break;
        if (result.kind === "ok") {
          turns = result.turns;
          break;
        }
        lastError = result.error;
        if (i < 5) await step.sleep(`wait-timeline-${i}`, "2s");
      }

      if (turns && turns.length > 0) {
        await step.run("upsert-assembly-timeline", async () => {
          const db = getDb();
          await db.delete(transcriptTurns).where(eq(transcriptTurns.callId, callId));
          const chunkSize = 80;
          for (let start = 0; start < turns.length; start += chunkSize) {
            const chunk = turns.slice(start, start + chunkSize).map((turn, offset) => ({
              callId,
              seq: start + offset,
              speaker: turn.speaker,
              text: turn.text.slice(0, 8000),
            }));
            await db.insert(transcriptTurns).values(chunk);
          }
        });
      } else if (turns === null) {
        console.error(JSON.stringify({ msg: "call.timeline_unavailable", callId, lastError }));
      }
    }

    await step.run("gemini-insights", async () => {
      await generateCallInsights(callId);
    });
  },
);

export const closeOpenCallJob = inngest.createFunction(
  {
    id: "close-open-call",
    triggers: [{ event: EVENT_CALL_STARTED }],
    retries: 2,
    cancelOn: [{ event: EVENT_CALL_ENDED, match: "data.callId" }],
  },
  async ({ event, step }) => {
    const { callId } = event.data as { callId: string };
    const waitSeconds = CALL_SECONDS + Math.round(STALE_CALL_GRACE_MS / 1000);
    await step.sleep("wait-call-window", `${waitSeconds}s`);

    const closed = await step.run("close-if-open", async () => {
      const db = getDb();
      const [call] = await db
        .select({ id: calls.id, startedAt: calls.startedAt, endedAt: calls.endedAt })
        .from(calls)
        .where(eq(calls.id, callId))
        .limit(1);
      if (!call || call.endedAt) return false;

      const startedAt = new Date(call.startedAt);
      const endedAt = new Date(startedAt.getTime() + CALL_SECONDS * 1000);
      const updated = await db
        .update(calls)
        .set({
          endedAt,
          durationSeconds: CALL_SECONDS,
          insightStatus: "pending",
        })
        .where(and(eq(calls.id, call.id), isNull(calls.endedAt)))
        .returning({ id: calls.id });
      return Boolean(updated[0]);
    });

    if (closed) {
      await step.run("emit-call-ended", async () => {
        await inngest.send({ name: EVENT_CALL_ENDED, data: { callId } });
      });
    }
  },
);
