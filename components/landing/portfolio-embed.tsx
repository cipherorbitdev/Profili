/* Changelog: device-frame embed mock with idle↔speaking cycle; editor chrome + line numbers; Copy→Copied icon morph. */
"use client";

import { useResumePick } from "@/components/landing/resume-pick";
import { VoiceOrb } from "@/components/ui/voice-orb";
import { VoiceWaveform } from "@/components/ui/voice-waveform";
import { embedProfileUrl, siteOrigin } from "@/lib/site";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy, Info, Lock } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

const SAMPLE_SLUG = "your-slug";

type EmbedTab = "iframe" | "script";

type CodePart = {
  kind: "tag" | "attr" | "string" | "plain" | "slug";
  text: string;
};

function iframeParts(slug: string): { copy: string; parts: CodePart[] } {
  const src = embedProfileUrl(slug);
  const copy = [
    "<iframe",
    `  src="${src}"`,
    `  title="Profili voice agent"`,
    `  width="400"`,
    `  height="640"`,
    `  style="border:0;border-radius:16px;max-width:100%;"`,
    `  allow="microphone; autoplay"`,
    "></iframe>",
  ].join("\n");
  const parts: CodePart[] = [
    { kind: "tag", text: "<iframe\n" },
    { kind: "attr", text: "  src=" },
    { kind: "string", text: `"${src.split(slug)[0]}` },
    { kind: "slug", text: slug },
    { kind: "string", text: `${src.split(slug)[1] ?? ""}"\n` },
    { kind: "attr", text: "  title=" },
    { kind: "string", text: `"Profili voice agent"\n` },
    { kind: "attr", text: "  width=" },
    { kind: "string", text: `"400"\n` },
    { kind: "attr", text: "  height=" },
    { kind: "string", text: `"640"\n` },
    { kind: "attr", text: "  style=" },
    { kind: "string", text: `"border:0;border-radius:16px;max-width:100%;"\n` },
    { kind: "attr", text: "  allow=" },
    { kind: "string", text: `"microphone; autoplay"\n` },
    { kind: "tag", text: "></iframe>" },
  ];
  return { copy, parts };
}

function scriptParts(slug: string): { copy: string; parts: CodePart[] } {
  const origin = siteOrigin();
  const copy = `<div data-profili-slug="${slug}"></div>\n<script src="${origin}/embed.js" async></script>`;
  const parts: CodePart[] = [
    { kind: "tag", text: "<div " },
    { kind: "attr", text: "data-profili-slug=" },
    { kind: "string", text: `"` },
    { kind: "slug", text: slug },
    { kind: "string", text: `"` },
    { kind: "tag", text: "></div>\n<script " },
    { kind: "attr", text: "src=" },
    { kind: "string", text: `"${origin}/embed.js"` },
    { kind: "plain", text: " " },
    { kind: "attr", text: "async" },
    { kind: "tag", text: "></script>" },
  ];
  return { copy, parts };
}

const partClass: Record<CodePart["kind"], string> = {
  tag: "text-air",
  attr: "text-steel",
  string: "text-ice",
  plain: "text-ice",
  slug: "rounded-sm bg-air/20 px-0.5 text-ice",
};

const cardMotion = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const } },
};

export function PortfolioEmbed() {
  const person = useResumePick();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<EmbedTab>("iframe");
  const [copied, setCopied] = useState(false);
  const [talking, setTalking] = useState(false);
  const copyTimer = useRef<number | null>(null);
  const iframeTabRef = useRef<HTMLButtonElement>(null);
  const scriptTabRef = useRef<HTMLButtonElement>(null);
  const ids = useId();
  const snippet = tab === "iframe" ? iframeParts(SAMPLE_SLUG) : scriptParts(SAMPLE_SLUG);
  const siteHost = `${person.firstName.toLowerCase()}.dev`;

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setTalking((on) => !on), 3200);
    return () => window.clearInterval(id);
  }, [reduce]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    };
  }, []);

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(snippet.copy);
    setCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
  }, [snippet.copy]);

  function onTabListKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next: EmbedTab = tab === "iframe" ? "script" : "iframe";
    setTab(next);
    window.requestAnimationFrame(() => {
      (next === "iframe" ? iframeTabRef : scriptTabRef).current?.focus();
    });
  }

  return (
    <section id="embed" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <p className="label">On your site</p>
        <h2 className="mt-3 max-w-3xl text-[36px] font-semibold tracking-tight text-ink sm:text-[52px]">
          Embed it on your portfolio.
        </h2>
        <p className="mt-4 max-w-xl text-[16px] text-muted">
          One snippet. Visitors stay on your page and talk to your résumé.
          Same agent as your public link.
        </p>

        <motion.div
          className="mt-12 grid items-stretch gap-8 lg:grid-cols-12"
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.22 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduce ? 0 : 0.07 } },
          }}
        >
          <motion.div className="lg:col-span-7" variants={reduce ? undefined : cardMotion}>
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-(--shadow-lg)">
              <div className="flex items-center gap-2 border-b border-border bg-subtle px-3 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-steel/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-steel/22" />
                <span className="h-2.5 w-2.5 rounded-full bg-steel/38" />
                <p className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] text-steel">
                  <Lock size={11} strokeWidth={2.2} className="shrink-0 text-steel" aria-hidden />
                  <span className="truncate">{siteHost}</span>
                </p>
              </div>

              <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
                <div className="border-b border-border p-6 md:border-b-0 md:border-r">
                  <p className="font-mono text-[11px] font-medium tracking-wide text-steel uppercase">
                    Portfolio
                  </p>
                  <h3 className="mt-3 text-[28px] font-semibold tracking-tight text-ink">
                    {person.name}
                  </h3>
                  <p className="mt-1 text-[14px] text-air">{person.role}</p>
                  <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-muted">
                    Selected work, writing, and a voice that answers from the résumé.
                  </p>
                  <ul className="mt-6 space-y-1.5 text-[13px] font-medium text-ink">
                    {person.skills.slice(0, 3).map((skill) => (
                      <li key={skill}>
                        <span className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 transition-colors duration-150 hover:border-border hover:bg-subtle">
                          <span>{skill}</span>
                          <span className="rounded-full border border-border bg-subtle px-2 py-0.5 font-mono text-[10px] font-medium text-steel">
                            Case study
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <aside className="flex items-center justify-center bg-subtle p-4 md:p-5">
                  <div className="w-full max-w-[220px] rounded-[1.65rem] border-[6px] border-[#0E1B2E] bg-[#0E1B2E] p-1 shadow-[0_18px_40px_rgb(14_27_46/0.35)]">
                    <div className="rounded-[1.2rem] border border-(--air)/35 bg-deep p-4 text-white">
                    <p
                      className={`font-mono text-[10px] font-medium tracking-wide text-[#89C2D9] uppercase transition-opacity duration-300 ${
                        talking ? "opacity-45" : "opacity-100"
                      }`}
                    >
                      Talk to me
                    </p>
                    <div className="mt-3 flex justify-center">
                      <motion.div
                        animate={reduce ? undefined : { scale: talking ? [1, 1.04, 1] : [1, 1.02, 1] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <VoiceOrb
                          size={120}
                          state={talking ? "speaking" : "idle"}
                          interactive={false}
                          name={person.firstName}
                        />
                      </motion.div>
                    </div>
                    <VoiceWaveform state={talking ? "speaking" : "idle"} compact className="mt-1" />
                    <p className="mt-3 text-center text-[15px] font-semibold tracking-tight">
                      {person.firstName}
                    </p>
                    <p className="text-center font-mono text-[10px] text-[#89C2D9]">
                      Grounded in the résumé
                    </p>
                    <button type="button" className="glow-cta glow-cta-ondark mt-4 w-full">
                      <span
                        className={`glow-cta-face min-h-10 px-4 text-[13px] font-medium transition-opacity duration-300 ${
                          talking ? "opacity-100" : "opacity-70"
                        }`}
                      >
                        Start talking
                      </span>
                    </button>
                    <p className="mt-3 text-center">
                      <span className="inline-flex rounded-full border border-white/15 bg-white/8 px-2 py-0.5 font-mono text-[10px] text-[#89C2D9]">
                        iframe · 400×640
                      </span>
                    </p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </motion.div>

          <motion.div className="lg:col-span-5" variants={reduce ? undefined : cardMotion}>
            <div className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-surface p-5 shadow-(--shadow-lg) sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="label">Paste this</p>
                <div
                  role="tablist"
                  aria-label="Embed format"
                  onKeyDown={onTabListKey}
                  className="relative flex rounded-lg border border-border bg-subtle p-0.5"
                >
                  {(["iframe", "script"] as const).map((id) => {
                    const selected = tab === id;
                    return (
                      <button
                        key={id}
                        ref={id === "iframe" ? iframeTabRef : scriptTabRef}
                        type="button"
                        role="tab"
                        id={`${ids}-${id}`}
                        aria-controls={`${ids}-snippet`}
                        aria-selected={selected}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => setTab(id)}
                        className={`relative z-10 min-w-18 cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium ${
                          selected ? "text-ink" : "text-muted"
                        }`}
                      >
                        {selected && !reduce ? (
                          <motion.span
                            layoutId={`${ids}-tab-pill`}
                            className="absolute inset-0 -z-10 rounded-md bg-surface shadow-sm"
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          />
                        ) : selected ? (
                          <span className="absolute inset-0 -z-10 rounded-md bg-surface shadow-sm" />
                        ) : null}
                        {id === "iframe" ? "iframe" : "Script"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="mt-3 text-[14px] text-muted">
                Replace{" "}
                <code className="rounded-md border border-border bg-subtle px-1.5 py-0.5 font-mono text-[12px] text-ink">
                  {SAMPLE_SLUG}
                </code>{" "}
                with your published slug.
              </p>

              <div className="relative mt-4 min-h-0 flex-1">
                <div className="relative h-full overflow-hidden rounded-xl border border-white/10 bg-deep">
                  <button
                    type="button"
                    onClick={() => void copyCode()}
                    className="absolute right-2 top-2 z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/8 px-2.5 py-1.5 font-mono text-[11px] font-medium text-[#89C2D9] transition-[transform,background-color,border-color] duration-150 hover:border-white/30 hover:bg-white/12 active:scale-[0.97]"
                  >
                    <span className="grid h-3.5 w-3.5 place-items-center">
                      {copied ? <Check size={12} strokeWidth={2.6} /> : <Copy size={12} strokeWidth={2.4} />}
                    </span>
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <div
                    aria-live="polite"
                    className="sr-only"
                  >
                    {copied ? "Snippet copied to clipboard" : ""}
                  </div>
                  <pre id={`${ids}-snippet`} role="tabpanel" className="h-full overflow-x-auto p-4 pr-24 font-mono text-[12px] leading-relaxed">
                    <code className="flex gap-4">
                      <span className="select-none text-right text-white/25" aria-hidden>
                        {snippet.copy.split("\n").map((_, index) => (
                          <span key={index} className="block">
                            {index + 1}
                          </span>
                        ))}
                      </span>
                      <span className="min-w-0 whitespace-pre">
                        {snippet.parts.map((part, index) => (
                          <span key={`${part.kind}-${index}`} className={partClass[part.kind]}>
                            {part.text}
                          </span>
                        ))}
                      </span>
                    </code>
                  </pre>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-deep to-transparent"
                  />
                </div>
              </div>

              <p className="mt-4 inline-flex items-start gap-2 text-[13px] text-muted">
                <Info size={14} strokeWidth={2.2} className="mt-0.5 shrink-0 text-steel" aria-hidden />
                <span>Works on any page that allows an iframe.</span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
