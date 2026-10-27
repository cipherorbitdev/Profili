/* Changelog: load-staggered fan + idle drift; spring 300/20 spread; speaking pill + eq bars; CSS-only card hover ring. */
"use client";

import { EqBars } from "@/components/landing/reveal";
import { useSetResumePick } from "@/components/landing/resume-pick";
import { GoLiveButton } from "@/components/ui/go-live-button";
import { demoPersonas } from "@/lib/demo-personas";
import { resumes, type ResumeProfile } from "@/lib/visuals";
import { FileUp, Link2 } from "lucide-react";
import { motion, useReducedMotion, type MotionValue } from "framer-motion";
import { useEffect, useState } from "react";

function personaFor(item: ResumeProfile) {
  return demoPersonas.find((persona) => persona.handle === item.handle) ?? demoPersonas[0];
}

function speakGreeting(name: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const line = new SpeechSynthesisUtterance(`Hi, I'm ${name}. Talk to my Resume.`);
  line.rate = 1.02;
  line.pitch = 1;
  window.speechSynthesis.speak(line);
}

const spring = { type: "spring", stiffness: 300, damping: 20, mass: 0.7 } as const;

const slots = [
  "left-[0%] top-[16%] sm:left-[4%]",
  "left-[26%] top-[4%] sm:left-[28%]",
  "left-[50%] top-[18%] sm:left-[54%]",
];

const poses = [
  {
    enter: { x: 10, y: 18, rotate: -3, rotateY: 4, scale: 0.94, zIndex: 1 },
    idle: { x: -22, y: 2, rotate: -8, rotateY: 12, scale: 1, zIndex: 1 },
    fan: { x: -56, y: -8, rotate: -10, rotateY: 22, scale: 1.04, zIndex: 4 },
  },
  {
    enter: { x: 0, y: 8, rotate: 1, rotateY: 0, scale: 0.96, zIndex: 2 },
    idle: { x: 0, y: -10, rotate: 1, rotateY: 0, scale: 1.02, zIndex: 3 },
    fan: { x: 0, y: -28, rotate: 0, rotateY: 0, scale: 1.07, zIndex: 5 },
  },
  {
    enter: { x: -8, y: 16, rotate: 4, rotateY: -4, scale: 0.94, zIndex: 3 },
    idle: { x: 22, y: 2, rotate: 8, rotateY: -12, scale: 1, zIndex: 2 },
    fan: { x: 56, y: -8, rotate: 10, rotateY: -22, scale: 1.04, zIndex: 4 },
  },
];

export function ResumeCard({
  item,
  className = "",
  live = false,
}: {
  item: ResumeProfile;
  className?: string;
  live?: boolean;
}) {
  const persona = personaFor(item);
  const jobs = persona.experience.slice(0, 2);

  return (
    <figure className={`overflow-hidden rounded-xl bg-surface ${className}`}>
      <div
        className="aspect-3/4 w-full overflow-hidden bg-[#F7FAFC] px-3 pt-3 text-[#012A4A]"
        style={{ colorScheme: "light" }}
      >
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#012A4A] text-[10px] font-semibold text-[#89C2D9]">
            {persona.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold leading-tight">{persona.name}</p>
            <p className="truncate font-mono text-[8px] text-[#2A6F97]">{persona.role}</p>
          </div>
        </div>
        <p className="mt-2.5 line-clamp-2 text-[9px] leading-snug text-[#013A63]">{persona.summary}</p>
        <p className="mt-2.5 font-mono text-[7px] font-medium tracking-[0.14em] text-[#468FAF] uppercase">
          Experience
        </p>
        <ul className="mt-1 space-y-1.5">
          {jobs.map((job) => (
            <li key={job.company}>
              <p className="text-[10px] font-semibold leading-tight">{job.company}</p>
              <p className="font-mono text-[7px] text-[#2A6F97]">{job.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[8px] leading-snug text-[#013A63]">
                {job.highlights[0]}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-2 font-mono text-[7px] font-medium tracking-[0.14em] text-[#468FAF] uppercase">
          Skills
        </p>
        <p className="mt-0.5 text-[8px] leading-snug text-[#012A4A]">{persona.skills.join(" · ")}</p>
      </div>
      <figcaption className="border-t border-border bg-surface px-2.5 py-2">
        <p className="flex items-center gap-1.5 truncate text-[12px] font-semibold leading-tight tracking-tight text-ink">
          <span className="min-w-0 truncate">{item.name}</span>
          {live ? <EqBars /> : null}
        </p>
        <p className="truncate font-mono text-[10px] text-steel">{item.role}</p>
      </figcaption>
    </figure>
  );
}

function ResumeStack({
  flying,
  frontOpacity,
}: {
  flying: ResumeProfile;
  frontOpacity?: MotionValue<number>;
}) {
  const setPick = useSetResumePick();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [fineHover, setFineHover] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFineHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduce) {
      setReady(true);
      return;
    }
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, [reduce]);

  const pose = reduce ? "fan" : !ready ? "enter" : open ? "fan" : "idle";

  return (
    <div className="relative lg:col-span-7">
      <motion.div
        className="relative mx-auto h-[400px] w-full max-w-[620px] sm:h-[500px]"
        style={{ perspective: 1200 }}
        initial={false}
        animate={pose}
        onHoverStart={() => {
          if (fineHover && !reduce) setOpen(true);
        }}
        onHoverEnd={() => {
          if (fineHover) setOpen(false);
        }}
        onFocusCapture={() => {
          if (!reduce) setOpen(true);
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setOpen(false);
          }
        }}
      >
        {resumes.map((item, index) => {
          const selected = item.src === flying.src;
          return (
            <motion.button
              key={item.src}
              type="button"
              aria-pressed={selected}
              aria-label={`Hear ${item.name}`}
              className={`absolute w-[46%] max-w-[230px] origin-bottom cursor-pointer border-0 bg-transparent p-0 text-left [transform-style:preserve-3d] ${slots[index]}`}
              variants={poses[index]}
              transition={{ ...spring, delay: reduce ? 0 : index * 0.08 }}
              style={selected ? { opacity: frontOpacity } : undefined}
              onHoverStart={() => {
                if (fineHover) speakGreeting(item.name);
              }}
              onHoverEnd={() => {
                if (typeof window !== "undefined") window.speechSynthesis?.cancel();
              }}
              onClick={() => {
                if (!fineHover && !open) {
                  setOpen(true);
                  return;
                }
                setPick(item);
                speakGreeting(item.name);
                if (!fineHover) setOpen(false);
              }}
            >
              <motion.div
                animate={
                  reduce
                    ? undefined
                    : {
                        y: [0, index % 2 === 0 ? -5 : -3, 0],
                        scale: [1, 1.012, 1],
                      }
                }
                transition={
                  reduce
                    ? undefined
                    : {
                        duration: 5.4 + index * 0.45,
                        repeat: Infinity,
                        ease: [0.22, 1, 0.36, 1],
                      }
                }
              >
                <ResumeCard
                  item={item}
                  live={selected}
                  className={`brutal-lg transition-[box-shadow,transform] duration-200 ${
                    selected ? "ring-2 ring-[#61A5C2] ring-offset-2 ring-offset-background" : ""
                  }`}
                />
              </motion.div>
            </motion.button>
          );
        })}
        <span className="pointer-events-none absolute bottom-3 left-2 z-10 inline-flex items-center gap-2 rounded-full border border-border bg-subtle/90 px-2.5 py-1 font-mono text-xs text-navy shadow-sm backdrop-blur-sm sm:bottom-8 sm:left-4">
          <span className="ping-live h-1.5 w-1.5 rounded-full bg-good" />
          Still silent
        </span>
      </motion.div>
      <p className="mt-3 text-center font-mono text-[11px] text-steel">
        Click a résumé to hear {flying.firstName}
      </p>
    </div>
  );
}

export function Hero({
  frontOpacity,
  flying,
}: {
  frontOpacity?: MotionValue<number>;
  flying: ResumeProfile;
}) {
  const [dropped, setDropped] = useState(false);

  return (
    <section className="flex min-h-[calc(100svh-4.5rem)] items-center px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <h1 className="hero-display">
            Your Resume can{" "}
            <span className="hero-display-em grad-ocean">Talk.</span>
          </h1>
          <p className="mt-6 max-w-md text-[16px] text-muted">
            Share a link instead of a PDF. Visitors ask questions, your AI
            answers, anytime.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <label
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink shadow-sm transition-all duration-150 hover:-translate-y-px hover:border-steel/40"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setDropped(true);
              }}
            >
              <FileUp size={16} />
              {dropped ? "Resume attached" : "Drop Resume PDF"}
              <input
                type="file"
                accept=".pdf,.docx,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.[0]) setDropped(true);
                }}
              />
            </label>
            <GoLiveButton className="h-11" />
          </div>
          <p className="mt-8 flex items-center gap-2 text-[13px] font-medium text-muted">
            <Link2 size={14} strokeWidth={2.2} aria-hidden />
            Upload a PDF. Get a shareable voice link.
          </p>
        </div>

        <ResumeStack flying={flying} frontOpacity={frontOpacity} />
      </div>
    </section>
  );
}
