/** Public voice-call length. Keep UI, AssemblyAI, prompts, and close-open-call in sync. */
export const CALL_SECONDS = 300;
export const CALL_WRAP_SECONDS = 270;
export const ASSEMBLY_MAX_SESSION_SECONDS = 320;
export const STALE_CALL_GRACE_MS = 90_000;

export function formatCallClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}
