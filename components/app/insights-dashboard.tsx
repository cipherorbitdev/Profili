"use client";

import { MagneticButton } from "@/components/motion/magnetic-button";
import { CALL_SECONDS } from "@/lib/voice/call-window";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Turn = {
  seq: number;
  speaker: string;
  text: string;
};

export type InsightCall = {
  id: string;
  visitor_name: string;
  visitor_purpose: string;
  visitor_email: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  insight_status: string | null;
  insight_intent: string | null;
  insight_query: string | null;
  insight_summary: string | null;
  insight_citation: string | null;
  insight_grounded: number | null;
  insight_tone: number | null;
  insight_fit: number | null;
  insight_tone_label: string | null;
  insight_fit_label: string | null;
  left_message: boolean;
};

const ease = [0.16, 1, 0.3, 1] as const;
const palette = ["#01497C", "#2A6F97", "#61A5C2", "#89C2D9"];

function timeAgo(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function insightBadge(status: string | null, intent: string | null) {
  if (status === "pending" || status === "processing") return "Processing…";
  if (status === "failed") return "Failed";
  if (status === "skipped") return "No transcript";
  return intent || "Call";
}

function minutesLabel(seconds: number | null) {
  const value = Math.max(1, Math.round((seconds ?? CALL_SECONDS) / 60));
  return `${value} min call`;
}

function ScoreCard({ label, value, note }: { label: string; value: number | null; note: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#01497C]/10 bg-[#FAFAFA] px-2.5 py-2 text-left dark:border-[#89C2D9]/25 dark:bg-[#012A4A]/30">
      <p className="font-mono text-[9px] leading-tight font-medium tracking-wider text-[#468FAF] uppercase">
        {label}
      </p>
      <p className="mt-1 text-[20px] font-semibold leading-none tracking-tight text-ink sm:text-[22px]">
        {value == null ? "—" : `${value}%`}
      </p>
      <p className="mt-1 truncate text-[11px] text-ink/80">{note}</p>
    </div>
  );
}

function sameLine(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function CallTranscript({ turns }: { turns: Turn[] }) {
  if (turns.length === 0) {
    return <p className="mt-3 text-[13px] text-muted">No transcript saved for this call yet.</p>;
  }

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

export function InsightsDashboard() {
  const reduce = useReducedMotion();
  const [calls, setCalls] = useState<InsightCall[] | null>(null);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pane, setPane] = useState<"feed" | "inspect">("feed");
  const [retrying, setRetrying] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [turnsStatus, setTurnsStatus] = useState<"idle" | "loading" | "ready">("idle");

  async function load() {
    const response = await fetch("/api/voice/calls");
    const payload = (await response.json()) as { calls?: InsightCall[]; error?: string };
    if (!response.ok) {
      setError(payload.error || "Could not load insights.");
      setCalls([]);
      return;
    }
    const next = payload.calls ?? [];
    setCalls(next);
    setActiveId((current) => current ?? next[0]?.id ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  const pending = Boolean(
    calls?.some((call) => call.insight_status === "pending" || call.insight_status === "processing"),
  );
  useEffect(() => {
    if (!pending) return;
    const id = window.setInterval(() => {
      void load();
    }, 4000);
    return () => window.clearInterval(id);
  }, [pending]);

  const active = calls?.find((call) => call.id === activeId) ?? calls?.[0] ?? null;
  const topic = (active?.insight_query || active?.visitor_purpose || "").trim();
  const summary = (active?.insight_summary || "").trim();
  const summaryAddsDetail =
    Boolean(summary) && !sameLine(summary, topic) && summary.length >= 40;
  const citation = (active?.insight_citation || "").trim();
  const showCitation = Boolean(citation) && !sameLine(citation, "Transcript");

  useEffect(() => {
    if (!active?.id) {
      setTurns([]);
      setTurnsStatus("idle");
      return;
    }
    let cancelled = false;
    setTurnsStatus("loading");
    void (async () => {
      const response = await fetch(`/api/voice/transcript?callId=${active.id}`);
      const payload = (await response.json()) as { turns?: Turn[]; error?: string };
      if (cancelled) return;
      setTurns(payload.turns ?? []);
      setTurnsStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [active?.id, active?.insight_status]);

  const intents = useMemo(() => {
    if (!calls?.length) return [];
    const counts: Record<string, number> = {};
    for (const call of calls) {
      const label = call.insight_intent || "Unlabeled";
      counts[label] = (counts[label] || 0) + 1;
    }
    const total = calls.length;
    return Object.entries(counts).map(([label, n], i) => ({
      label,
      pct: Math.round((n / total) * 100),
      color: palette[i % palette.length],
    }));
  }, [calls]);

  async function retryInsights(callId: string) {
    setRetrying(true);
    try {
      const response = await fetch("/api/voice/insights/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Could not retry insights.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not retry insights.");
    } finally {
      setRetrying(false);
    }
  }

  if (!calls) return <div className="min-h-[40vh]" />;
  if (error) return <p className="text-[14px] text-danger">{error}</p>;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="label">Quantitative insights</p>
      <h1 className="mt-1.5 max-w-3xl text-[32px] font-semibold tracking-tight text-ink sm:text-[40px]">
        Who talked. What they asked. How it scored.
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] text-muted">
        After each public call ends, we read the transcript and write a fresh insight for that visitor.
      </p>

      <div className="console-beam mt-8 flex min-h-0 flex-1 flex-col md:min-h-[520px]">
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
            <span className="font-mono text-[11px] text-[#2A6F97] dark:text-ice">
              {calls.length} completed call{calls.length === 1 ? "" : "s"}
            </span>
          </div>

          {calls.length === 0 ? (
            <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center px-6 text-center">
              <p className="text-[18px] font-semibold text-ink">No calls yet.</p>
              <p className="mt-2 max-w-sm text-[14px] text-muted">
                Share your public link. When someone finishes a call, their insight lands here.
              </p>
            </div>
          ) : (
            <>
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
                    className={`min-h-[320px] flex-col border-[#01497C]/12 md:min-h-0 md:border-r dark:border-[#89C2D9]/30 ${
                      pane === "feed" ? "flex" : "hidden"
                    } md:flex`}
                  >
                    <div className="flex shrink-0 items-center justify-between px-3 pt-2.5 pb-1.5">
                      <p className="font-mono text-[10px] font-medium tracking-wide text-steel">
                        Recent Activity
                      </p>
                      <span className="rounded-full border border-[#01497C]/12 px-1.5 py-px font-mono text-[10px] text-[#2A6F97] dark:border-[#89C2D9]/30">
                        {calls.length}
                      </span>
                    </div>
                    <ul className="min-h-0 flex-1 space-y-px overflow-y-auto px-1.5 pb-2">
                      {calls.map((call) => {
                        const selected = call.id === active?.id;
                        return (
                          <li key={call.id}>
                            <button
                              type="button"
                              aria-pressed={selected}
                              onClick={() => {
                                setActiveId(call.id);
                                setPane("inspect");
                              }}
                              className={`relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 ${
                                selected ? "bg-[#F4F8FA] dark:bg-[#01497C]/15" : "hover:bg-subtle"
                              }`}
                            >
                              <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-[#012A4A] text-[10px] font-semibold text-white">
                                {initials(call.visitor_name)}
                              </span>
                              <span className="relative z-10 min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-semibold text-ink">
                                  {call.visitor_name}
                                </span>
                                <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span className="rounded-full border border-[#01497C]/12 px-1.5 py-px font-mono text-[9px] text-steel dark:border-[#89C2D9]/30">
                                    {insightBadge(call.insight_status, call.insight_intent)}
                                  </span>
                                  {call.left_message ? (
                                    <span className="rounded-full bg-[#2A6F97] px-1.5 py-px font-mono text-[9px] font-semibold text-white">
                                      Left a message
                                    </span>
                                  ) : null}
                                  <span className="truncate font-mono text-[10px] text-[#61A5C2]">
                                    {timeAgo(call.started_at)}
                                  </span>
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div
                    className={`min-h-[420px] flex-col overflow-hidden p-3 sm:p-4 md:min-h-0 ${
                      pane === "inspect" ? "flex" : "hidden"
                    } md:flex`}
                  >
                    {active ? (
                      <AnimatePresence mode="wait" initial={false}>
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
                                {initials(active.visitor_name)}
                              </span>
                              <div className="min-w-0">
                                <h3 className="flex items-center gap-1.5 truncate text-[15px] font-semibold text-ink sm:text-base">
                                  {active.visitor_name}
                                  <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-[#2A6F97] text-white">
                                    <Check size={8} strokeWidth={3} />
                                  </span>
                                </h3>
                                <p className="truncate text-[12px] text-muted">{active.visitor_email}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full border border-[#01497C]/12 px-2 py-0.5 font-mono text-[10px] font-medium text-[#2A6F97] dark:border-[#89C2D9]/30 dark:text-ice">
                                {insightBadge(active.insight_status, active.insight_intent)}
                              </span>
                              <span className="rounded-full border border-[#01497C]/12 bg-[#F0F4F8] px-2 py-0.5 font-mono text-[10px] font-medium text-[#01497C] dark:border-[#89C2D9]/30 dark:bg-[#012A4A]/40 dark:text-ice">
                                {minutesLabel(active.duration_seconds)}
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
                              <p className="font-mono text-[9px] tracking-wider text-[#468FAF] uppercase">
                                What happened
                              </p>
                              <p className="mt-1 max-h-20 overflow-y-auto pr-1 text-[13px] leading-relaxed text-ink/90">
                                {summary}
                              </p>
                              {showCitation ? (
                                <p className="mt-1.5 font-mono text-[10px] text-[#468FAF]">Source: {citation}</p>
                              ) : null}
                            </div>
                          ) : null}

                          <div className="mt-3 shrink-0 border-t border-[#01497C]/12 pt-3 dark:border-[#89C2D9]/30">
                            <p className="shrink-0 text-[13px] font-medium text-ink">
                              Conversation
                              {turnsStatus === "ready" ? (
                                <span className="ml-1.5 font-mono text-[10px] font-normal text-muted">
                                  {turns.length} turn{turns.length === 1 ? "" : "s"}
                                </span>
                              ) : null}
                            </p>
                            {turnsStatus === "loading" ? (
                              <p className="mt-3 text-[13px] text-muted">Loading transcript…</p>
                            ) : (
                              <CallTranscript turns={turns} />
                            )}
                          </div>

                          <div className="mt-4 shrink-0 border-t border-[#01497C]/12 pt-4 dark:border-[#89C2D9]/30">
                            <p className="mb-2 font-mono text-[9px] tracking-wider text-[#468FAF] uppercase">
                              Scores
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                            <ScoreCard
                              label="Factual Groundedness"
                              value={active.insight_grounded}
                              note="Grounded in CV"
                            />
                            <ScoreCard
                              label="Delivery & Tone"
                              value={active.insight_tone}
                              note={active.insight_tone_label || "Pending"}
                            />
                            <ScoreCard
                              label="Visitor Fit Score"
                              value={active.insight_fit}
                              note={
                                active.insight_status === "failed"
                                  ? "Failed"
                                  : active.insight_fit_label || "Pending"
                              }
                            />
                            </div>
                          </div>
                          {active.insight_status === "failed" || active.insight_status === "skipped" ? (
                            <div className="mt-3">
                              <MagneticButton
                                variant="secondary"
                                disabled={retrying}
                                onClick={() => void retryInsights(active.id)}
                              >
                                <span className="inline-flex items-center gap-2">
                                  <RotateCcw size={14} />
                                  {retrying ? "Retrying" : "Retry insights"}
                                </span>
                              </MagneticButton>
                            </div>
                          ) : null}
                        </motion.div>
                      </AnimatePresence>
                    ) : null}

                    <div className="mt-3 shrink-0 border-t border-[#01497C]/12 pt-2.5 dark:border-[#89C2D9]/30">
                      <p className="font-mono text-[9px] font-medium tracking-wider text-[#468FAF] uppercase">
                        Intent distribution
                      </p>
                      <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full">
                        {intents.map((row) => (
                          <span
                            key={row.label}
                            className="h-full"
                            style={{ width: `${Math.max(row.pct, 2)}%`, background: row.color }}
                          />
                        ))}
                      </div>
                      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        {intents.map((row) => (
                          <li
                            key={row.label}
                            className="flex items-center gap-1.5 font-mono text-[10px] text-ink"
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: row.color }} />
                            {row.label} {row.pct}%
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
