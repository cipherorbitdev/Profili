/* Changelog: progress fills 0→100 once on view (spring); skill chips stagger; no looping STATUS percent. */
"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export type BrutalistDeckCard = {
  id: string;
  title: string;
  tag: string;
  color: string;
  ink?: string;
  footnote?: string;
  detailLabel?: string;
  detail?: string;
  chips?: string[];
};

const DEFAULT_CARDS: BrutalistDeckCard[] = [
  { id: "1", title: "COMPILING", color: "bg-[#89C2D9]", ink: "text-deep", tag: "STEP 01" },
  { id: "2", title: "OPTIMIZING", color: "bg-[#61A5C2]", ink: "text-deep", tag: "STEP 02" },
  { id: "3", title: "HYDRATING", color: "bg-[#2C7DA0]", ink: "text-white", tag: "STEP 03" },
  { id: "4", title: "RENDERING", color: "bg-[#01497C]", ink: "text-white", tag: "STEP 04" },
  { id: "5", title: "READY", color: "bg-deep", ink: "text-[#89C2D9]", tag: "STEP 05" },
];

export function BrutalistDeckLoader({
  cards = DEFAULT_CARDS,
  status = "Processing assets",
  className = "",
  fillOnView,
}: {
  cards?: BrutalistDeckCard[];
  status?: string;
  className?: string;
  fillOnView?: boolean;
}) {
  const reduce = useReducedMotion();
  const [deck, setDeck] = useState(cards);
  const [progress, setProgress] = useState(reduce ? 100 : 0);
  const lockFill = fillOnView !== undefined;

  useEffect(() => {
    setDeck(cards);
  }, [cards]);

  useEffect(() => {
    if (reduce) {
      setProgress(100);
      return;
    }
    if (lockFill) {
      if (fillOnView) {
        const id = window.setTimeout(() => setProgress(100), 40);
        return () => window.clearTimeout(id);
      }
      setProgress(0);
      return;
    }
    const progressInterval = window.setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 90);
    return () => window.clearInterval(progressInterval);
  }, [reduce, lockFill, fillOnView]);

  useEffect(() => {
    if (reduce) return;
    const cycleInterval = window.setInterval(() => {
      setDeck((prev) => {
        const next = [...prev];
        const top = next.shift();
        if (top) next.push(top);
        return next;
      });
    }, 1800);
    return () => window.clearInterval(cycleInterval);
  }, [reduce]);

  return (
    <div className={`relative flex flex-col items-center antialiased ${className}`}>
      <div className="relative flex h-80 w-64 items-center justify-center [perspective:1200px]">
        <AnimatePresence mode="popLayout">
          {deck.map((card, index) => {
            const isTop = index === 0;
            const offset = index * 8;
            const rotate = (index % 2 === 0 ? 1 : -1) * (index * 2);
            const ink = card.ink ?? "text-deep";

            return (
              <motion.div
                key={card.id}
                layout
                initial={{ scale: 0.8, y: -100, rotateX: 45, opacity: 0 }}
                animate={{
                  x: isTop ? 0 : index * 3,
                  y: isTop ? 0 : offset,
                  rotate: isTop ? 0 : rotate,
                  scale: isTop ? 1 : 1 - index * 0.04,
                  zIndex: cards.length - index,
                  opacity: isTop ? 1 : 0.72,
                }}
                exit={{
                  x: 200,
                  y: -40,
                  rotate: 20,
                  scale: 0.9,
                  opacity: 0,
                  transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
                }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className={`absolute flex h-80 w-64 select-none flex-col justify-between rounded-2xl border border-border p-5 shadow-[var(--shadow-lg)] ${card.color} ${ink}`}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-deep/15 bg-white/80">
                    <div className="h-1.5 w-1.5 rounded-full bg-deep" />
                  </div>
                  <span className="rounded-full border border-deep/10 bg-white/80 px-2 py-0.5 font-mono text-[10px] font-medium text-deep">
                    {card.tag}
                  </span>
                </div>

                <div className="my-auto flex flex-col items-center justify-center gap-3">
                  {isTop && !reduce ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 3, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-full border border-deep/10 bg-white/90 p-3 text-deep"
                    >
                      <RefreshCw size={24} />
                    </motion.div>
                  ) : (
                    <div className="rounded-full border border-deep/10 bg-white/80 p-3">
                      <Sparkles size={24} className="text-deep" />
                    </div>
                  )}
                  <h3 className={`text-center text-2xl font-semibold tracking-tight ${ink}`}>
                    {card.title}
                  </h3>
                  {card.footnote && (
                    <p className={`max-w-[90%] break-all text-center font-mono text-[11px] tracking-tight ${ink}`}>
                      {card.footnote}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[10px] font-medium">
                    <span>STATUS</span>
                    <span>{reduce ? 100 : progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50">
                    <motion.div
                      className="h-full origin-left rounded-full bg-deep"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: (reduce ? 100 : progress) / 100 }}
                      transition={{ type: "spring", stiffness: 120, damping: 22 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {deck[0]?.chips?.length ? (
        <div className="mt-12 flex min-h-[4.5rem] w-72 flex-wrap content-start gap-1.5">
          <p className="w-full font-mono text-[10px] font-medium text-steel">{deck[0].detailLabel}</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={deck[0].id}
              className="flex flex-wrap gap-1.5"
              initial={false}
            >
              {deck[0].chips.map((chip, i) => (
                <motion.span
                  key={chip}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22, delay: reduce ? 0 : i * 0.07 }}
                  className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-ink"
                >
                  {chip}
                </motion.span>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : deck[0]?.detail ? (
        <div className="mt-12 flex h-[4.5rem] w-64 items-start">
          <AnimatePresence mode="wait">
            <motion.div
              key={deck[0].id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="w-full text-left"
            >
              <p className="font-mono text-[10px] font-medium text-steel">
                {deck[0].detailLabel}
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-ink">
                {deck[0].detail}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : null}

      <div className="z-10 mt-5 flex w-fit items-center justify-center gap-2 rounded-full border border-border bg-btn px-4 py-1.5 font-mono text-xs font-medium text-btn-fg">
        <Loader2 className="shrink-0 animate-spin opacity-80" size={16} />
        <span>{status}</span>
      </div>
    </div>
  );
}

export default BrutalistDeckLoader;

export function BrutalistDeckDemo() {
  return (
    <div className="flex min-h-[28rem] items-center justify-center p-8">
      <BrutalistDeckLoader />
    </div>
  );
}
