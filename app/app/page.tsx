"use client";

import { EmbedSnippet } from "@/components/app/embed-snippet";
import { ResumeParseUploader } from "@/components/app/resume-parse-uploader";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { PageTransition } from "@/components/motion/reveal";
import type { OwnerProfileRow } from "@/lib/resume/schema";
import { publicProfilePath, publicProfileUrl } from "@/lib/site";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <AgentsHome />
    </Suspense>
  );
}

function AgentsHome() {
  const router = useRouter();
  const search = useSearchParams();
  const creating = search.get("new") === "1";
  const [profiles, setProfiles] = useState<OwnerProfileRow[] | undefined>(undefined);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/resume/profile");
    const payload = (await response.json()) as {
      profiles?: OwnerProfileRow[];
      error?: string;
    };
    if (!response.ok) {
      setError(payload.error || "Could not load your agents.");
      setProfiles([]);
      return;
    }
    setProfiles(payload.profiles ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: string, name: string) {
    const ok = window.confirm(`Delete ${name || "this agent"}? Calls and insights for it go away. You can upload a new resume after.`);
    if (!ok) return;
    setBusyId(id);
    setError("");
    const response = await fetch("/api/resume/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusyId("");
    if (!response.ok) {
      setError(payload.error || "Could not delete this agent.");
      return;
    }
    await load();
  }

  if (profiles === undefined) {
    return <div className="min-h-[40vh]" />;
  }

  const empty = profiles.length === 0;

  return (
    <PageTransition>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Agents</p>
          <h1 className="mt-2 text-[36px] font-bold tracking-tight sm:text-[44px]">
            {empty ? "Upload your resume." : "Your agents."}
          </h1>
          <p className="mt-3 max-w-xl text-[16px] text-muted">
            {empty
              ? "PDF only, 5 MB max. We read the text, you pick a voice, then you publish a link."
              : "Create more than one. Delete one to start over with a new resume, voice, and tone."}
          </p>
        </div>
        {!empty ? (
          <MagneticButton href="/app?new=1">
            <span className="inline-flex items-center gap-2">
              <Plus size={16} />
              New agent
            </span>
          </MagneticButton>
        ) : null}
      </div>
      {error ? <p className="mt-4 text-[14px] text-danger">{error}</p> : null}

      {(empty || creating) && (
        <div className="mt-10">
          {creating && !empty ? (
            <p className="mb-4 text-[14px] text-muted">New agent. Upload a resume, then review, voice, and publish.</p>
          ) : null}
          <ResumeParseUploader onParsed={(id) => router.push(`/app/review?id=${id}`)} />
        </div>
      )}

      {!empty ? (
        <div className="mt-10 grid gap-4">
          {profiles.map((profile) => {
            const name = profile.full_name || profile.profile_json.full_name || "Untitled agent";
            const headline = profile.profile_json.headline?.trim();
            const live = profile.status === "published" && Boolean(profile.slug);
            return (
              <article key={profile.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium tracking-tight text-ink">{name}</p>
                    {headline ? <p className="mt-1 text-[14px] text-muted">{headline}</p> : null}
                    <p className="mt-2 font-mono text-[12px] text-muted">
                      {live ? publicProfileUrl(profile.slug as string) : profile.parse_status === "ready" ? "Draft · ready to review" : profile.parse_status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {live ? (
                      <MagneticButton href={publicProfilePath(profile.slug as string)} arrow>
                        Open
                      </MagneticButton>
                    ) : (
                      <MagneticButton href={`/app/review?id=${profile.id}`} arrow>
                        Continue
                      </MagneticButton>
                    )}
                    <MagneticButton href={`/app/review?id=${profile.id}`} variant="ghost">
                      Edit
                    </MagneticButton>
                    <MagneticButton href={`/app/create?id=${profile.id}`} variant="ghost">
                      Voice and tone
                    </MagneticButton>
                    <button
                      type="button"
                      disabled={busyId === profile.id}
                      onClick={() => void remove(profile.id, name)}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-[14px] font-medium text-ink hover:border-danger/40 hover:text-danger disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
                {live ? (
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <PublicLinkCard url={publicProfileUrl(profile.slug as string)} />
                    <EmbedSnippet slug={profile.slug as string} />
                  </div>
                ) : null}
                <div className="mt-5">
                  <p className="label">Replace resume</p>
                  <p className="mt-1 text-[13px] text-muted">Sends this agent back to draft. Then pick voice and publish again.</p>
                  <div className="mt-3">
                    <ResumeParseUploader
                      compact
                      profileId={profile.id}
                      onParsed={(id) => router.push(`/app/review?id=${id}`)}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </PageTransition>
  );
}

function PublicLinkCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="rounded-xl border border-border bg-subtle p-4">
      <p className="label">Public link</p>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <p className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink">{url}</p>
        <button
          type="button"
          aria-label={copied ? "Copied link" : "Copy link"}
          onClick={() => void copy()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface text-ink"
        >
          {copied ? <Check size={15} strokeWidth={2.4} /> : <Copy size={15} strokeWidth={2.4} />}
        </button>
      </div>
    </section>
  );
}
