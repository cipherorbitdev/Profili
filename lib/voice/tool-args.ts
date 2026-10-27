import { z } from "zod";
import { MESSAGE_INTENTS } from "@/lib/voice/tools";

export const toolRequestSchema = z.object({
  callId: z.string().uuid(),
  transcriptToken: z.string().uuid(),
  name: z.enum(["leave_message_for_owner"]),
  arguments: z.unknown().optional(),
});

export const leaveMessageArgsSchema = z.object({
  message: z.string().trim().min(1).max(500),
  intent: z.enum(MESSAGE_INTENTS).optional(),
});

export function parseToolArguments(raw: unknown) {
  if (raw == null) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      throw new Error("Invalid tool arguments.");
    }
  }
  return raw;
}
