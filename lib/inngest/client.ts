import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "profili" });

export const EVENT_RESUME_UPLOADED = "resume.uploaded" as const;
export const EVENT_CALL_STARTED = "call.started" as const;
export const EVENT_CALL_ENDED = "call.ended" as const;
export const EVENT_MESSAGE_LEFT = "message.left" as const;
