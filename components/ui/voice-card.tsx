"use client";

import { VoiceWaveform } from "@/components/ui/voice-waveform";
import type { AssemblyVoice } from "@/lib/voice/assembly-voices";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Play } from "lucide-react";

export function VoiceCard({
  voice,
  selected,
  playing,
  onSelect,
}: {
  voice: AssemblyVoice;
  selected: boolean;
  playing: boolean;
  onSelect: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={reduce ? undefined : { y: -6 }}
      animate={{
        scale: selected ? 1.02 : 1,
        borderColor: selected ? "var(--accent)" : "var(--border)",
      }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className="brutal w-full rounded-2xl p-5 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[20px] font-medium tracking-tight">{voice.label}</p>
          <p className="mt-1 text-[13px] text-muted">
            {voice.accent} · {voice.blurb}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="label flex items-center gap-1">
            <Play size={10} />
            {playing ? "Playing" : "Preview"}
          </span>
          <AnimatePresence>
            {selected && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground"
              >
                <Check size={14} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <motion.div
        initial={false}
        animate={{ opacity: selected ? 1 : 0.35 }}
        className="mt-6"
      >
        <VoiceWaveform state={playing ? "speaking" : selected ? "idle" : "idle"} compact />
      </motion.div>
    </motion.button>
  );
}
