"use client";

import { InsightsDashboard } from "@/components/app/insights-dashboard";
import { MessagesDashboard } from "@/components/app/messages-dashboard";
import { PageTransition } from "@/components/motion/reveal";
import { Inbox, LineChart } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardInsightsPage() {
  const [tab, setTab] = useState<"insights" | "messages">("insights");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/voice/messages");
      const payload = (await response.json()) as { messages?: Array<{ read_at: string | null }> };
      setUnread((payload.messages ?? []).filter((row) => !row.read_at).length);
    })();
  }, [tab]);

  return (
    <PageTransition>
      <div className="mb-6 flex justify-end">
        <div
          role="tablist"
          aria-label="Dashboard view"
          className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "insights"}
            onClick={() => setTab("insights")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ${
              tab === "insights" ? "bg-ink text-btn-fg" : "text-muted hover:text-ink"
            }`}
          >
            <LineChart size={13} strokeWidth={2.2} aria-hidden />
            Insights
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "messages"}
            onClick={() => setTab("messages")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ${
              tab === "messages" ? "bg-ink text-btn-fg" : "text-muted hover:text-ink"
            }`}
          >
            <Inbox size={13} strokeWidth={2.2} aria-hidden />
            Inbox
            {unread > 0 ? (
              <span
                className={`rounded-full px-1.5 py-px font-mono text-[10px] ${
                  tab === "messages" ? "bg-white/20 text-btn-fg" : "bg-ink text-btn-fg"
                }`}
              >
                {unread}
              </span>
            ) : null}
          </button>
        </div>
      </div>
      {tab === "insights" ? <InsightsDashboard /> : <MessagesDashboard />}
    </PageTransition>
  );
}
