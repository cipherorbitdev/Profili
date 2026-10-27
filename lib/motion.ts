export const easeOut = [0.16, 1, 0.3, 1] as const;
export const entrance = { duration: 0.7, ease: easeOut } as const;
export const springSoft = { type: "spring", stiffness: 280, damping: 22 } as const;
export const springSnappy = { type: "spring", stiffness: 420, damping: 28 } as const;

export type VoiceState =
  | "idle"
  | "listening"
  | "processing"
  | "thinking"
  | "speaking"
  | "error"
  | "ended";
