import { getDb } from "@/lib/db/client";
import { messages } from "@/lib/db/schema";
import { EVENT_MESSAGE_LEFT, inngest } from "@/lib/inngest/client";
import { failedEventData } from "@/lib/inngest/emit";
import { sendOwnerMessageEmail } from "@/lib/voice/notify-message";
import { eq } from "drizzle-orm";

export const notifyMessageJob = inngest.createFunction(
  {
    id: "notify-owner-message",
    triggers: [{ event: EVENT_MESSAGE_LEFT }],
    retries: 3,
    onFailure: async ({ event, error }) => {
      const { messageId } = failedEventData<{ messageId: string }>(event);
      console.error(JSON.stringify({ msg: "message.email_job_failed", messageId, error: String(error) }));
    },
  },
  async ({ event, step }) => {
    const { messageId } = event.data as { messageId: string };
    return step.run("send-owner-email", async () => {
      const db = getDb();
      const [row] = await db.select({ id: messages.id }).from(messages).where(eq(messages.id, messageId)).limit(1);
      if (!row) return { skipped: true as const };
      await sendOwnerMessageEmail(messageId);
      return { ok: true as const };
    });
  },
);
