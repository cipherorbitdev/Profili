"use client";

import { embedIframeSnippet, embedScriptSnippet } from "@/lib/site";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function EmbedSnippet({ slug }: { slug: string }) {
  const [tab, setTab] = useState<"iframe" | "script">("iframe");
  const [copied, setCopied] = useState(false);
  const code = tab === "iframe" ? embedIframeSnippet(slug) : embedScriptSnippet(slug);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5">
      <p className="label">Add to your site</p>
      <p className="mt-2 text-[14px] text-muted">
        Paste this into any page. Visitors talk to your agent without leaving your site.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium ${
            tab === "iframe" ? "border-steel/40 bg-subtle" : "border-border"
          }`}
          onClick={() => setTab("iframe")}
        >
          iframe
        </button>
        <button
          type="button"
          className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium ${
            tab === "script" ? "border-steel/40 bg-subtle" : "border-border"
          }`}
          onClick={() => setTab("script")}
        >
          Script
        </button>
      </div>
      <div className="relative mt-4 min-h-0 flex-1">
        <pre className="h-full overflow-x-auto rounded-lg bg-subtle p-3 pr-12 font-mono text-[12px] leading-relaxed">
          {code}
        </pre>
        <button
          type="button"
          aria-label={copied ? "Copied snippet" : "Copy snippet"}
          onClick={() => void copy()}
          className="absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-ink transition-colors hover:border-steel/40 hover:bg-subtle"
        >
          {copied ? <Check size={15} strokeWidth={2.4} /> : <Copy size={15} strokeWidth={2.4} />}
        </button>
      </div>
    </section>
  );
}
