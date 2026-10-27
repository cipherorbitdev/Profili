"use client";

import type { VoiceState } from "@/lib/motion";
import { useFinePointer } from "@/lib/use-fine-pointer";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useId } from "react";

type OrbMode = "idle" | "listening" | "thinking" | "speaking" | "ended";

function resolveMode(state: VoiceState): OrbMode {
  if (state === "listening") return "listening";
  if (state === "speaking") return "speaking";
  if (state === "thinking" || state === "processing") return "thinking";
  if (state === "ended" || state === "error") return "ended";
  return "idle";
}

function ariaFor(mode: OrbMode, name: string) {
  if (mode === "listening") return `${name} is listening`;
  if (mode === "thinking") return `${name} is thinking`;
  if (mode === "speaking") return `${name} is speaking`;
  if (mode === "ended") return `${name} has ended`;
  return `${name} is idle`;
}

export function VoiceOrb({
  size = 280,
  state = "idle",
  className = "",
  interactive = true,
  level = 0,
  name = "Voice agent",
}: {
  size?: number;
  state?: VoiceState;
  className?: string;
  interactive?: boolean;
  level?: number;
  name?: string;
}) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const uid = useId().replace(/:/g, "");
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 90, damping: 18 });
  const y = useSpring(my, { stiffness: 90, damping: 18 });
  const mode = resolveMode(state);
  const live = mode === "listening" || mode === "speaking" || mode === "thinking";
  const energy = Math.max(0, Math.min(1, level));
  const glow = mode === "ended" ? 0.35 : live ? 0.75 + energy * 0.25 : 0.55;
  const cloudDur =
    mode === "speaking" ? 7 - energy * 2 : mode === "listening" ? 9 : mode === "thinking" ? 18 : 14;
  const cloudOpacity = mode === "ended" ? 0.22 : mode === "speaking" ? 0.72 : mode === "listening" ? 0.55 : 0.42;

  return (
    <motion.div
      role="img"
      aria-label={ariaFor(mode, name)}
      className={`relative mx-auto overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, x: interactive ? x : 0, y: interactive ? y : 0 }}
      onPointerMove={(e) => {
        if (!interactive || reduce || !fine) return;
        const rect = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 18);
        my.set(((e.clientY - rect.top) / rect.height - 0.5) * 18);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      animate={
        reduce
          ? { scale: 1 }
          : mode === "ended"
            ? { scale: 0.96 }
            : { scale: [1, 1.015 + energy * 0.02, 1] }
      }
      transition={
        mode === "ended"
          ? { duration: 0.6, ease: "easeOut" }
          : { duration: 4.8, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-[-12%] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--glow) 0%, transparent 68%)",
        }}
        animate={{ opacity: reduce ? glow * 0.45 : [glow * 0.4, glow * 0.75, glow * 0.4] }}
        transition={{ duration: live ? 2.4 : 5.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute inset-[8%] overflow-hidden rounded-full">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 36% 30%, var(--ice) 0%, var(--steel) 42%, var(--deep-2) 78%, var(--deep) 100%)",
          }}
        />

        <motion.div
          aria-hidden
          className="absolute inset-[-20%]"
          style={{ opacity: cloudOpacity }}
          animate={
            reduce
              ? { x: 0, y: 0, rotate: 0 }
              : mode === "thinking"
                ? { rotate: 360 }
                : {
                    x: ["-6%", "5%", "-4%"],
                    y: ["-4%", "6%", "-5%"],
                  }
          }
          transition={
            reduce
              ? { duration: 0 }
              : mode === "thinking"
                ? { duration: 28, repeat: Infinity, ease: "linear" }
                : { duration: cloudDur, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <span
            className="absolute left-[8%] top-[18%] h-[55%] w-[58%] rounded-full blur-2xl"
            style={{ background: "radial-gradient(circle, var(--ice) 0%, transparent 70%)" }}
          />
          <span
            className="absolute right-[4%] top-[28%] h-[48%] w-[50%] rounded-full blur-2xl"
            style={{ background: "radial-gradient(circle, var(--air) 0%, transparent 72%)" }}
          />
          <span
            className="absolute bottom-[10%] left-[22%] h-[42%] w-[46%] rounded-full blur-xl"
            style={{ background: "radial-gradient(circle, var(--cerulean) 0%, transparent 68%)" }}
          />
        </motion.div>

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200" aria-hidden>
          <defs>
            <clipPath id={`wave-clip-${uid}`}>
              <circle cx="100" cy="100" r="100" />
            </clipPath>
          </defs>
          <g clipPath={`url(#wave-clip-${uid})`}>
            <motion.g
              animate={reduce ? { x: 0 } : { x: [0, -200] }}
              transition={{ duration: cloudDur * 1.15, repeat: Infinity, ease: "linear" }}
            >
              <path
                d="M0 92 C 50 52 100 132 150 92 C 200 52 250 132 300 92 C 350 52 400 132 450 92 L 450 200 L 0 200 Z"
                fill="var(--deep)"
                opacity={mode === "ended" ? 0.28 : 0.58}
              />
              <path
                d="M0 118 C 50 88 100 148 150 118 C 200 88 250 148 300 118 C 350 88 400 148 450 118 L 450 200 L 0 200 Z"
                fill="var(--navy)"
                opacity={0.42}
              />
            </motion.g>
            <motion.g
              animate={reduce ? { x: 0 } : { x: [-200, 0] }}
              transition={{ duration: cloudDur * 0.85, repeat: Infinity, ease: "linear" }}
            >
              <path
                d="M0 78 C 40 118 90 48 140 88 C 190 128 240 58 290 98 C 340 138 390 68 440 108 L 440 0 L 0 0 Z"
                fill="var(--ice)"
                opacity={mode === "speaking" ? 0.55 : 0.38}
                style={{ mixBlendMode: "screen" }}
              />
              <path
                d="M0 64 C 45 24 95 104 145 64 C 195 24 245 104 295 64 C 345 24 395 104 445 64 L 445 0 L 0 0 Z"
                fill="var(--air)"
                opacity={0.34}
                style={{ mixBlendMode: "screen" }}
              />
            </motion.g>
          </g>
        </svg>

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200" aria-hidden>
          <defs>
            <filter id={`cloud-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency={mode === "speaking" ? "0.018" : "0.012"}
                numOctaves="3"
                seed="4"
                result="noise"
              >
                {!reduce ? (
                  <animate
                    attributeName="baseFrequency"
                    values={
                      mode === "speaking"
                        ? "0.016;0.022;0.016"
                        : mode === "listening"
                          ? "0.012;0.016;0.012"
                          : "0.01;0.013;0.01"
                    }
                    dur={`${cloudDur}s`}
                    repeatCount="indefinite"
                  />
                ) : null}
              </feTurbulence>
              <feColorMatrix
                in="noise"
                type="matrix"
                values="0 0 0 0 0.38
                        0 0 0 0 0.65
                        0 0 0 0 0.76
                        0 0 0 0.55 0"
              />
            </filter>
            <clipPath id={`clip-${uid}`}>
              <circle cx="100" cy="100" r="100" />
            </clipPath>
          </defs>
          <circle
            cx="100"
            cy="100"
            r="100"
            filter={`url(#cloud-${uid})`}
            clipPath={`url(#clip-${uid})`}
            opacity={mode === "ended" ? 0.25 : 0.45}
            style={{ mixBlendMode: "soft-light" }}
          />
        </svg>

        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 26%, rgb(255 255 255 / 0.38) 0%, rgb(255 255 255 / 0.08) 22%, transparent 48%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            boxShadow: "inset 0 -18px 36px rgb(1 42 74 / 0.35), inset 0 0 0 1px rgb(137 194 217 / 0.18)",
          }}
        />
      </div>
    </motion.div>
  );
}
