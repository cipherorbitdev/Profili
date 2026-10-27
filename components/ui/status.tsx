"use client";

import { motion } from "framer-motion";

export function CheckMark({ done, active }: { done: boolean; active?: boolean }) {
  return (
    <span className="relative grid h-4 w-4 place-items-center">
      {active && !done && (
        <motion.span
          className="absolute h-1.5 w-1.5 rounded-full bg-accent"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      )}
      {done && (
        <motion.svg
          viewBox="0 0 16 16"
          className="h-4 w-4"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
        >
          <motion.path
            d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
            fill="none"
            stroke="var(--good)"
            strokeWidth="1.8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          />
        </motion.svg>
      )}
      {!done && !active && <span className="h-1.5 w-1.5 rounded-full bg-border" />}
    </span>
  );
}

export function StatusIndicator({
  active = true,
  label = "Active",
}: {
  active?: boolean;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-muted">
      <span className="relative grid h-2 w-2 place-items-center">
        {active && (
          <motion.span
            className="absolute h-2 w-2 rounded-full bg-good"
            animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        )}
        <span
          className="relative h-1.5 w-1.5 rounded-full"
          style={{ background: active ? "var(--good)" : "var(--muted)" }}
        />
      </span>
      {label}
    </span>
  );
}

export function StepIndicator({
  current,
  steps,
}: {
  current: number;
  steps: string[];
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
      {steps.map((step, i) => (
        <motion.li
          key={step}
          className={i === current ? "text-foreground" : i < current ? "text-accent" : ""}
          animate={{ opacity: i <= current ? 1 : 0.45 }}
        >
          <span className="font-mono text-[11px] tracking-wide">
            {String(i + 1).padStart(2, "0")}
          </span>{" "}
          {step}
        </motion.li>
      ))}
    </ol>
  );
}
