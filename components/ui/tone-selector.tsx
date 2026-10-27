"use client";

import type { Personality } from "@/lib/types";
import { personalities } from "@/lib/mock";
import { motion, useReducedMotion } from "framer-motion";

export function ToneSelector({
  value,
  onChange,
}: {
  value: Personality;
  onChange: (next: Personality) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="flex flex-wrap gap-2">
      {personalities.map((item) => {
        const on = value === item;
        return (
          <motion.button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            whileHover={reduce ? undefined : { y: -2 }}
            whileTap={{ scale: 0.96 }}
            className={`min-h-10 rounded-lg border border-border px-4 text-[14px] font-medium capitalize transition-all duration-150 ${
              on ? "border-steel/40 bg-subtle text-ink" : "bg-surface text-ink hover:border-steel/40"
            }`}
          >
            {item}
          </motion.button>
        );
      })}
    </div>
  );
}

export function RangeControl({
  left,
  right,
  value,
  onChange,
}: {
  left: string;
  right: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-3 flex justify-between text-[13px] text-muted">
        <span>{left}</span>
        <span>{right}</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-subtle accent-btn"
      />
    </label>
  );
}
