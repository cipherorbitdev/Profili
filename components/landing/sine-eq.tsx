"use client";

import type { VoiceState } from "@/lib/motion";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

export function SineEqualizer({
  active = true,
  className = "",
}: {
  active?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    const bars = 56;

    const draw = (t: number) => {
      const dpr = window.devicePixelRatio || 1;
      const { width: cssW, height: cssH } = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(cssW * dpr));
      const h = Math.max(1, Math.floor(cssH * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.clearRect(0, 0, w, h);
      const theme = getComputedStyle(document.documentElement);
      const toneA = theme.getPropertyValue("--muted").trim() || "#2a6f97";
      const toneB = theme.getPropertyValue("--steel").trim() || "#468faf";
      const gap = 3 * dpr;
      const barW = Math.max(2 * dpr, (w - gap * (bars - 1)) / bars);
      const mid = h / 2;
      for (let i = 0; i < bars; i++) {
        const phase = t / 320 + i * 0.22;
        const envelope = Math.sin((i / bars) * Math.PI);
        const live = active && !reduce ? 0.55 + 0.45 * Math.abs(Math.sin(phase)) : 0.22;
        const amp = envelope * live * (h * 0.42);
        ctx.fillStyle = i % 2 === 0 ? toneA : toneB;
        const x = i * (barW + gap);
        const y = mid - amp;
        const radius = barW / 2;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, barW, Math.max(amp * 2, 2 * dpr), radius);
        } else {
          ctx.rect(x, y, barW, Math.max(amp * 2, 2 * dpr));
        }
        ctx.fill();
      }
      frame += 1;
      raf = window.requestAnimationFrame(() => draw(reduce ? 0 : frame));
    };

    raf = window.requestAnimationFrame(() => draw(0));
    return () => window.cancelAnimationFrame(raf);
  }, [active, reduce]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`h-24 w-full ${className}`}
    />
  );
}

export function waveState(playing: boolean): VoiceState {
  return playing ? "speaking" : "idle";
}
