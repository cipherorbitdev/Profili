import { inngest } from "./client";

export async function emitEvent(name: string, data: Record<string, string>) {
  try {
    await inngest.send({ name, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "send failed";
    console.error(JSON.stringify({ msg: "inngest.send_failed", name, error: message, ...data }));
    throw error;
  }
}

export function failedEventData<T extends Record<string, string>>(event: unknown): Partial<T> {
  const raw = event as { data?: T & { event?: { data?: T } } };
  return (raw.data?.event?.data ?? raw.data ?? {}) as Partial<T>;
}
