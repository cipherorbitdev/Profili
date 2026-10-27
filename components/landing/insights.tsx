/* Changelog: count-up on completed calls; score bars fill on view; stacked intent bar draws in; feed items slide/fade. */
"use client";

import { VISITORS, type Visitor } from "@/lib/visitors";
import { useInViewOnce } from "@/components/landing/reveal";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function sameLine(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function ScoreCard({
  label,
  value,
  note,
  shown,
  reduce,
}: {
  label: string;
  value: number;
  note: string;
  shown: boolean;
  reduce: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[#01497C]/10 bg-[#FAFAFA] px-2.5 py-2 text-left dark:border-[#89C2D9]/25 dark:bg-[#012A4A]/30">
      <p className="font-mono text-[9px] leading-tight font-medium tracking-wider text-[#468FAF] uppercase">
        {label}
      </p>
      <p className="mt-1 text-[20px] font-semibold leading-none tracking-tight text-ink sm:text-[22px]">
        {value}%
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#01497C]/10 dark:bg-[#89C2D9]/20">
        <motion.div
          className="h-full origin-left rounded-full bg-[#2A6F97]"
          initial={{ scaleX: reduce ? 1 : 0 }}
          animate={{ scaleX: shown || reduce ? value / 100 : 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        />
      </div>
      <p className="mt-1 truncate text-[11px] text-ink/80">{note}</p>
    </div>
  );
}

function CallTranscript({ turns }: { turns: Array<{ seq: number; speaker: string; text: string }> }) {
  return (
    <ul className="mt-3 max-h-44 space-y-2.5 overflow-y-auto overscroll-contain pr-1">
      {turns.map((turn) => {
        const visitor = turn.speaker === "visitor";
        return (
          <li
            key={`${turn.seq}-${turn.speaker}`}
            className={`flex ${visitor ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[94%] px-3 py-2 ${
                visitor
                  ? "rounded-2xl rounded-br-md bg-[#2A6F97]/12 dark:bg-[#2A6F97]/20"
                  : "rounded-2xl rounded-bl-md border border-[#01497C]/10 bg-[#F8FAFC] dark:border-[#89C2D9]/20 dark:bg-[#012A4A]/40"
              }`}
            >
              <p className="font-mono text-[9px] font-medium tracking-wide text-[#468FAF] uppercase">
                {visitor ? "Visitor" : "Agent"}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{turn.text}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Inspector({
  active,
  reduce,
  meters,
}: {
  active: Visitor;
  reduce: boolean;
  meters: boolean;
}) {
  const topic = active.query.trim();
  const summary = active.answer.trim();
  const summaryAddsDetail = Boolean(summary) && !sameLine(summary, topic) && summary.length >= 40;
  const citation = active.citation.trim();
  const showCitation = Boolean(citation) && !sameLine(citation, "Transcript");
  const turns = [
    { seq: 0, speaker: "visitor", text: active.query },
    { seq: 1, speaker: "agent", text: active.answer },
  ];

  return (
    <motion.div
      key={active.id}
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease }}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-border bg-[#012A4A] text-[12px] font-semibold text-white">
            {initials(active.title)}
          </span>
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 truncate text-[15px] font-semibold text-ink sm:text-base">
              {active.title}
              <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-[#2A6F97] text-white">
                <Check size={8} strokeWidth={3} />
              </span>
            </h3>
            <p className="truncate text-[12px] text-muted">{active.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-[#01497C]/12 px-2 py-0.5 font-mono text-[10px] font-medium text-[#2A6F97] dark:border-[#89C2D9]/30 dark:text-ice">
            {active.intent}
          </span>
          <span className="rounded-full border border-[#01497C]/12 bg-[#F0F4F8] px-2 py-0.5 font-mono text-[10px] font-medium text-[#01497C] dark:border-[#89C2D9]/30 dark:bg-[#012A4A]/40 dark:text-ice">
            {active.minutes} min call
          </span>
        </div>
      </div>

      {topic ? (
        <p className="mt-3 shrink-0 text-[14px] leading-snug text-ink">
          <span className="text-muted">Came to talk about </span>
          {topic}
        </p>
      ) : null}

      {summaryAddsDetail ? (
        <div className="mt-3 shrink-0">
          <p className="font-mono text-[9px] tracking-wider text-[#468FAF] uppercase">What happened</p>
          <p className="mt-1 max-h-20 overflow-y-auto pr-1 text-[13px] leading-relaxed text-ink/90">{summary}</p>
          {showCitation ? (
            <p className="mt-1.5 font-mono text-[10px] text-[#468FAF]">Source: {citation}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 shrink-0 border-t border-[#01497C]/12 pt-3 dark:border-[#89C2D9]/30">
        <p className="shrink-0 text-[13px] font-medium text-ink">
          Conversation
          <span className="ml-1.5 font-mono text-[10px] font-normal text-muted">
            {turns.length} turn{turns.length === 1 ? "" : "s"}
          </span>
        </p>
        <CallTranscript turns={turns} />
      </div>

      <div className="mt-4 shrink-0 border-t border-[#01497C]/12 pt-4 dark:border-[#89C2D9]/30">
        <p className="mb-2 font-mono text-[9px] tracking-wider text-[#468FAF] uppercase">Scores</p>
        <div className="grid grid-cols-3 gap-2">
          <ScoreCard label="Factual Groundedness" value={active.grounded} note="Grounded in CV" shown={meters} reduce={reduce} />
          <ScoreCard label="Delivery & Tone" value={active.tone} note={active.toneLabel} shown={meters} reduce={reduce} />
          <ScoreCard label="Visitor Fit Score" value={active.clarity} note={active.fitLabel} shown={meters} reduce={reduce} />
        </div>
      </div>
    </motion.div>
  );
}

export function Insights() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Visitor>(VISITORS[0]);
  const [pane, setPane] = useState<"feed" | "inspect">("feed");
  const { ref, shown } = useInViewOnce(0.18);
  const [count, setCount] = useState(reduce ? VISITORS.length : 0);

  useEffect(() => {
    if (!shown) return;
    if (reduce) {
      setCount(VISITORS.length);
      return;
    }
    const target = VISITORS.length;
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setCount(n);
      if (n >= target) window.clearInterval(id);
    }, 70);
    return () => window.clearInterval(id);
  }, [shown, reduce]);

  function select(person: Visitor) {
    setActive(person);
    setPane("inspect");
  }

  const intents = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const person of VISITORS) {
      counts[person.intent] = (counts[person.intent] || 0) + 1;
    }
    const total = VISITORS.length;
    const palette = ["#01497C", "#2A6F97", "#61A5C2", "#89C2D9"];
    return Object.entries(counts).map(([label, n], i) => ({
      label,
      pct: Math.round((n / total) * 100),
      color: palette[i % palette.length],
    }));
  }, []);

  return (
    <section
      id="insights"
      className="flex flex-col px-4 py-10 sm:px-6 md:py-12 lg:h-[calc(100svh-4.5rem)] lg:scroll-mt-[4.5rem] lg:py-5 xl:py-6"
    >
      <div ref={ref} className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
        <div className="shrink-0">
          <p className="label">Quantitative insights</p>
          <h2 className="mt-1.5 max-w-3xl text-[28px] font-semibold tracking-tight text-ink sm:text-[34px] lg:text-[36px]">
            Who talked. What they asked. How it scored.
          </h2>
        </div>

        <div className="console-beam mt-5 flex min-h-0 flex-1 flex-col md:min-h-[420px] lg:mt-4 lg:min-h-0">
          <div className="console-beam-face flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#01497C]/12 px-3 py-2 sm:px-4 dark:border-[#89C2D9]/30">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1.5" aria-hidden>
                  <span className="h-2 w-2 rounded-full bg-red-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                </span>
                <span className="font-mono text-[12px] font-medium text-ink">Insights</span>
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#2A6F97] dark:text-ice">
                <span className="ping-live h-1.5 w-1.5 rounded-full" style={{ background: "var(--live)" }} />
                {count} completed calls
              </span>
            </div>

            <div className="flex shrink-0 gap-1 border-b border-[#01497C]/12 p-1.5 md:hidden dark:border-[#89C2D9]/30">
              {(
                [
                  ["feed", "Visitors"],
                  ["inspect", "Telemetry Detail"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPane(id)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-[12px] font-medium ${
                    pane === id ? "bg-[#F0F4F8] text-ink dark:bg-[#01497C]/20" : "text-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid min-h-0 flex-1 md:grid-cols-[34fr_66fr] lg:grid-cols-[36fr_64fr]">
              <div
                className={`min-h-[360px] flex-col border-[#01497C]/12 md:min-h-0 md:border-r dark:border-[#89C2D9]/30 ${
                  pane === "feed" ? "flex" : "hidden"
                } md:flex`}
              >
                <div className="flex shrink-0 items-center justify-between px-3 pt-2.5 pb-1.5">
                  <p className="font-mono text-[10px] font-medium tracking-wide text-steel">Recent Activity</p>
                  <span className="rounded-full border border-[#01497C]/12 px-1.5 py-px font-mono text-[10px] text-[#2A6F97] dark:border-[#89C2D9]/30">
                    {VISITORS.length}
                  </span>
                </div>
                <ul className="min-h-0 flex-1 space-y-px overflow-y-auto px-1.5 pb-2">
                  {VISITORS.map((person, index) => {
                    const selected = person.id === active.id;
                    return (
                      <motion.li
                        key={person.id}
                        initial={reduce ? false : { opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 24, delay: reduce ? 0 : index * 0.07 }}
                      >
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => select(person)}
                          className={`relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 ${
                            selected ? "bg-[#F4F8FA] dark:bg-[#01497C]/15" : "hover:bg-subtle"
                          }`}
                        >
                          <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-[#012A4A] text-[10px] font-semibold text-white">
                            {initials(person.title)}
                          </span>
                          <span className="relative z-10 min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-ink">{person.title}</span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full border border-[#01497C]/12 px-1.5 py-px font-mono text-[9px] text-steel dark:border-[#89C2D9]/30">
                                {person.intent}
                              </span>
                              {person.leftMessage ? (
                                <span className="rounded-full bg-[#2A6F97] px-1.5 py-px font-mono text-[9px] font-semibold text-white">
                                  Left a message
                                </span>
                              ) : null}
                              <span className="truncate font-mono text-[10px] text-[#61A5C2]">{person.ago}</span>
                            </span>
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>

              <div
                className={`min-h-[420px] flex-col overflow-hidden p-3 sm:p-4 md:min-h-0 ${
                  pane === "inspect" ? "flex" : "hidden"
                } md:flex`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <Inspector key={active.id} active={active} reduce={!!reduce} meters={shown} />
                </AnimatePresence>

                <div className="mt-3 shrink-0 border-t border-[#01497C]/12 pt-2.5 dark:border-[#89C2D9]/30">
                  <p className="font-mono text-[9px] font-medium tracking-wider text-[#468FAF] uppercase">
                    Intent distribution
                  </p>
                  <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-[#01497C]/10 dark:bg-[#89C2D9]/15">
                    {intents.map((row) => (
                      <motion.span
                        key={row.label}
                        className="h-full"
                        initial={{ width: reduce ? `${row.pct}%` : 0 }}
                        animate={{ width: shown || reduce ? `${row.pct}%` : 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 22 }}
                        style={{ background: row.color }}
                      />
                    ))}
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {intents.map((row) => (
                      <li key={row.label} className="flex items-center gap-1.5 font-mono text-[10px] text-ink">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: row.color }} />
                        {row.label} {row.pct}%
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
