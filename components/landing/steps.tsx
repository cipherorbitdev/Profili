/* Changelog: SVG draw-on track; skill chips stagger; once-fill progress on deck; step scale by active. */
"use client";

import { Reveal, useInViewOnce } from "@/components/landing/reveal";
import { BrutalistDeckLoader } from "@/components/ui/brutalist-deck-loader";
import { useResumePick } from "@/components/landing/resume-pick";
import { motion } from "framer-motion";
import { useMemo } from "react";

export function Steps() {
  const person = useResumePick();
  const { ref, shown, reduce } = useInViewOnce(0.22);
  const cards = useMemo(
    () => [
      {
        id: "read",
        title: "Read",
        tag: "Step 01",
        color: "bg-[#89C2D9]",
        ink: "text-deep",
        detailLabel: "Read",
        detail: person.skills.join(" · "),
        chips: person.skills,
      },
      {
        id: "tune",
        title: "Tune",
        tag: "Step 02",
        color: "bg-[#2C7DA0]",
        ink: "text-white",
        detailLabel: "Tune",
        detail: `Cadence, depth, brevity. Hear ${person.firstName}.`,
      },
      {
        id: "share",
        title: "Link",
        tag: "Step 03",
        color: "bg-deep",
        ink: "text-white",
        detailLabel: "Link",
        detail: "Link it, or embed it on your site.",
        footnote: "your-slug",
      },
    ],
    [person.firstName, person.skills],
  );

  return (
    <section id="how" className="relative py-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="bleed-rule" aria-hidden />

        <div className="grid lg:grid-cols-2">
          <Reveal className="flex flex-col justify-center py-16 lg:py-24 lg:pr-16">
            <p className="label">How it works</p>
            <h2 className="mt-3 max-w-xl text-[36px] font-semibold tracking-tight text-ink sm:text-[52px]">
              Paper becomes a voice in three moves.
            </h2>
            <p className="mt-4 max-w-md text-[16px] text-ink/80">
              The deck cycles {person.firstName}&apos;s page through read, tune, and
              share. Skills stay grounded. Then you share a link or an embed.
            </p>
          </Reveal>

          <div className="bleed-rule lg:hidden" aria-hidden />

          <div ref={ref} className="relative flex flex-col items-center justify-center py-14 lg:py-24">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 hidden w-px bg-[#01497C]/12 lg:block dark:bg-[#89C2D9]/28"
            />
            <svg
              aria-hidden
              viewBox="0 0 280 36"
              className="mb-8 h-9 w-[min(100%,280px)] overflow-visible"
            >
              <motion.path
                d="M8 18 H272"
                fill="none"
                stroke="currentColor"
                className="text-border"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: shown ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 80, damping: 22 }}
              />
              {["Read", "Tune", "Link"].map((title, i) => (
                <motion.g
                  key={title}
                  initial={reduce ? false : { scale: 0.7, opacity: 0.4 }}
                  animate={{
                    scale: shown ? (i === 1 ? 1.12 : 1) : 0.7,
                    opacity: shown ? (i === 0 ? 0.55 : 1) : 0.4,
                  }}
                  transition={{ type: "spring", stiffness: 280, damping: 22, delay: reduce ? 0 : i * 0.08 }}
                >
                  <circle cx={8 + i * 132} cy={18} r={6} fill="var(--live)" />
                </motion.g>
              ))}
            </svg>
            <BrutalistDeckLoader cards={cards} status="Three Moves" fillOnView={shown} />
          </div>
        </div>

        <div className="bleed-rule" aria-hidden />
      </div>
    </section>
  );
}
