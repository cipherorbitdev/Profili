"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function FloatingElement({
  children,
  className = "",
  duration = 5,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduce ? undefined : { y: [0, -10, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedGradient({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <motion.div
        className="absolute -left-[20%] top-[10%] h-[55vw] max-h-[640px] w-[55vw] max-w-[640px] rounded-full"
        style={{
          background: "var(--glow)",
          filter: "blur(72px)",
        }}
        animate={
          reduce
            ? undefined
            : { x: [0, 70, -30, 0], y: [0, -40, 28, 0], opacity: [0.7, 1, 0.75, 0.7] }
        }
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[16%] bottom-[8%] h-[42vw] max-h-[520px] w-[42vw] max-w-[520px] rounded-full"
        style={{
          background: "var(--glow-2)",
          filter: "blur(80px)",
        }}
        animate={
          reduce
            ? undefined
            : { x: [0, -50, 24, 0], y: [0, 36, -20, 0], opacity: [0.6, 0.9, 0.65, 0.6] }
        }
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="paper-noise absolute inset-0" />
    </div>
  );
}
