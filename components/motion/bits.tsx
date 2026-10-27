"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { useRef, useState } from "react";

const spring = { type: "spring", stiffness: 90, damping: 18 } as const;

export function BlurFade({
  children,
  className = "",
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ ...spring, delay }}
    >
      {children}
    </motion.div>
  );
}

export function WordReveal({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block pr-[0.28em]"
            initial={reduce ? false : { y: "110%", rotate: 4 }}
            whileInView={{ y: "0%", rotate: 0 }}
            viewport={{ once: true }}
            transition={{ ...spring, delay: i * 0.045 }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function Marquee({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  const row = [...items, ...items];
  return (
    <div className={`overflow-hidden border-y border-border bg-surface/40 ${className}`}>
      <div
        className={`flex w-max gap-10 py-4 ${reduce ? "" : "animate-marquee"}`}
        style={{ animationDuration: "28s" } as CSSProperties}
      >
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="font-heading text-2xl text-ink/70 sm:text-3xl"
          >
            {item}
            <span className="ml-10 text-[#2C7DA0]">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function PhotoMarquee({
  items,
  reverse = false,
}: {
  items: { src: string; label: string }[];
  reverse?: boolean;
}) {
  const reduce = useReducedMotion();
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden py-2">
      <div
        className={`flex w-max gap-5 ${reduce ? "" : "animate-marquee"}`}
        style={{
          animationDuration: reverse ? "42s" : "36s",
          animationDirection: reverse ? "reverse" : "normal",
        } as CSSProperties}
      >
        {row.map((item, i) => (
          <figure
            key={`${item.label}-${i}`}
            className="relative h-44 w-64 shrink-0 overflow-hidden rounded-3xl border border-white/40 shadow-xl sm:h-52 sm:w-80"
          >
            <img src={item.src} alt="" className="h-full w-full object-cover" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#012A4A]/80 to-transparent px-4 pb-3 pt-10 font-mono text-[11px] text-white">
              {item.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function SpotlightCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [pos, setPos] = useState({ x: 30, y: 20 });

  return (
    <div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({
          x: ((e.clientX - r.left) / r.width) * 100,
          y: ((e.clientY - r.top) / r.height) * 100,
        });
      }}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[background] duration-150"
        style={{
          background: `radial-gradient(520px circle at ${pos.x}% ${pos.y}%, rgb(97 165 194 / 0.22), transparent 58%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

export function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 160, damping: 16 });
  const rotateY = useSpring(ry, { stiffness: 160, damping: 16 });

  return (
    <div className="h-full [perspective:1200px]">
      <motion.div
        ref={ref}
        className={`h-full ${className}`}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onPointerMove={(e) => {
          if (reduce || !ref.current) return;
          const r = ref.current.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          ry.set(px * 10);
          rx.set(py * -10);
        }}
        onPointerLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function BorderBeam({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`}
    >
      {!reduce && (
        <span className="border-beam-dot absolute h-2 w-24 rounded-full bg-[linear-gradient(90deg,transparent,#89C2D9,white)] blur-[1px]" />
      )}
    </span>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed left-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#012A4A] via-[#2C7DA0] to-[#89C2D9]"
      style={{ scaleX }}
    />
  );
}

export function Meteors({ count = 12 }: { count?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="absolute h-px w-24 bg-gradient-to-r from-[#2C7DA0] to-transparent"
          style={{
            top: `${(i * 17) % 100}%`,
            left: `${(i * 29) % 100}%`,
            animation: `meteor ${3 + (i % 4)}s linear infinite`,
            animationDelay: `${i * 0.35}s`,
          }}
        />
      ))}
    </div>
  );
}
