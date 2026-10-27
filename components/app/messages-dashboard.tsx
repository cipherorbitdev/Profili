"use client";

import { useEffect, useState } from "react";

type OwnerMessage = {
  id: string;
  body: string;
  intent: string | null;
  visitor_name: string;
  visitor_email: string;
  created_at: string;
  read_at: string | null;
};

export function MessagesDashboard() {
  const [messages, setMessages] = useState<OwnerMessage[] | null>(null);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/voice/messages");
    const payload = (await response.json()) as { messages?: OwnerMessage[]; error?: string };
    if (!response.ok) {
      setError(payload.error || "Could not load messages.");
      setMessages([]);
      return;
    }
    const next = payload.messages ?? [];
    setMessages(next);
    setActiveId((current) => current ?? next[0]?.id ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function openMessage(id: string) {
    setActiveId(id);
    const current = messages?.find((row) => row.id === id);
    if (current && !current.read_at) {
      await fetch("/api/voice/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setMessages((list) =>
        list?.map((row) => (row.id === id ? { ...row, read_at: new Date().toISOString() } : row)) ?? null,
      );
    }
  }

  if (!messages) return <div className="min-h-[40vh]" />;
  if (error) return <p className="text-[14px] text-danger">{error}</p>;

  const active = messages.find((row) => row.id === activeId) ?? messages[0] ?? null;

  return (
    <div>
      <p className="label">Inbox</p>
      <h1 className="mt-1.5 text-[32px] font-semibold tracking-tight text-ink sm:text-[40px]">Messages</h1>
      <p className="mt-2 max-w-2xl text-[15px] text-muted">
        Visitors can leave a note during a call. Emails are marked unverified.
      </p>
      {messages.length === 0 ? (
        <p className="mt-10 text-[15px] text-muted">No messages yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-[280px_1fr]">
          <ul className="space-y-1">
            {messages.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => void openMessage(row.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left ${
                    row.id === active?.id ? "border-ink bg-subtle" : "border-border"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14px] font-semibold text-ink">{row.visitor_name}</span>
                    {!row.read_at ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#2A6F97]" aria-label="Unread" />
                    ) : null}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[12px] text-muted">{row.body}</span>
                </button>
              </li>
            ))}
          </ul>
          {active ? (
            <article className="rounded-xl border border-border p-5">
              <h2 className="text-[18px] font-semibold text-ink">{active.visitor_name}</h2>
              <p className="mt-1 font-mono text-[12px] text-muted">
                {active.visitor_email} · unverified
                {active.intent ? ` · ${active.intent}` : ""}
              </p>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{active.body}</p>
            </article>
          ) : null}
        </div>
      )}
    </div>
  );
}
