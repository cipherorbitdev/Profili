import { after } from "next/server";
import { EVENT_MESSAGE_LEFT, inngest } from "@/lib/inngest/client";

export async function notifyOwnerOfMessage(messageId: string) {
  try {
    await inngest.send({ name: EVENT_MESSAGE_LEFT, data: { messageId } });
  } catch {
    after(() => {
      void import("@/lib/voice/notify-message").then((mod) => mod.sendOwnerMessageEmail(messageId));
    });
  }
}
