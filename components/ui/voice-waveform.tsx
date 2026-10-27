"use client";

import type { VoiceState } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";

const BARS = 32;

function amp(state: VoiceState) {
  switch (state) {
    case "speaking":
      return 1;
    case "listening":
      return 0.72;
    case "processing":
    case "thinking":
      return 0.5;
    case "error":
    case "ended":
      return 0.22;
    default:
      return 0.38;
  }
}

function speed(state: VoiceState) {
  switch (state) {
    case "speaking":
      return 0.55;
    case "listening":
      return 0.7;
    case "processing":
    case "thinking":
      return 0.9;
    default:
      return 1.35;
  }
}

export function VoiceWaveform({
  state = "idle",
  className = "",
  compact = false,
}: {
  state?: VoiceState;
  className?: string;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const a = amp(state);
  const dur = speed(state);

  return (
    <div
      aria-hidden
      className={`flex items-end justify-center gap-[2px] ${compact ? "h-7" : "h-11"} ${className}`}
    >
      {Array.from({ length: BARS }, (_, i) => {
        const base = 0.22 + ((i * 17) % 13) / 22;
        const lo = Math.max(0.12, base * 0.35 * a);
        const hi = Math.min(1, base * a);
        return (
          <motion.span
            key={i}
            className="w-[2.5px] origin-bottom rounded-full sm:w-[3px]"
            style={{
              height: compact ? 26 : 40,
              background: i % 2 === 0 ? "var(--accent-pulse)" : "var(--accent-pulse-2)",
            }}
            animate={
              reduce
                ? { scaleY: 0.35, opacity: 0.5 }
                : { scaleY: [lo, hi, lo * 0.7, hi * 0.9], opacity: 0.85 }
            }
            transition={{
              duration: dur + (i % 7) * 0.07,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.03,
            }}
          />
        );
      })}
    </div>
  );
}
