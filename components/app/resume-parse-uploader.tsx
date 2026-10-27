"use client";

import { MagneticButton } from "@/components/motion/magnetic-button";
import { CheckMark } from "@/components/ui/status";
import { isPdfMagic } from "@/lib/resume/sanitize";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FileText, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stages = ["Uploading", "Reading your experience", "Understanding your profile"];

const MAX_BYTES = 5 * 1024 * 1024;

type ParseStatus = "idle" | "parsing" | "ready" | "failed";

export function ResumeParseUploader({
  onParsed,
  compact = false,
  profileId,
}: {
  onParsed: (profileId: string) => void;
  compact?: boolean;
  profileId?: string;
}) {
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"empty" | "processing" | "done">("empty");
  const [doneUpTo, setDoneUpTo] = useState(0);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [resumePath, setResumePath] = useState("");
  const [agentId, setAgentId] = useState(profileId || "");
  const watching = phase === "processing" && Boolean(agentId);

  useEffect(() => {
    if (!watching) return;
    let stopped = false;
    const supabase = createClient();

    async function applyStatus(status: ParseStatus, parseError: string | null) {
      if (stopped) return;
      if (status === "ready") {
        setDoneUpTo(3);
        setPhase("done");
        onParsed(agentId);
        return;
      }
      if (status === "failed") {
        setPhase("empty");
        setDoneUpTo(0);
        setError(parseError || "We could not parse this resume.");
      }
    }

    async function poll() {
      const query = agentId ? `?id=${agentId}` : "";
      const response = await fetch(`/api/resume/profile${query}`);
      const payload = (await response.json()) as {
        profile?: { parse_status?: ParseStatus; parse_error?: string | null };
      };
      await applyStatus(payload.profile?.parse_status || "idle", payload.profile?.parse_error ?? null);
    }

    const channel = supabase
      .channel(`parse-${agentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${agentId}` },
        (payload) => {
          const next = payload.new as { parse_status?: ParseStatus; parse_error?: string | null };
          void applyStatus(next.parse_status || "idle", next.parse_error ?? null);
        },
      )
      .subscribe();

    const timer = window.setInterval(() => {
      void poll();
    }, 2000);
    void poll();

    return () => {
      stopped = true;
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [watching, agentId, onParsed]);

  async function queueParse(path: string) {
    const response = await fetch("/api/resume/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_path: path, profile_id: agentId || profileId || undefined }),
    });
    const payload = (await response.json()) as { error?: string; profileId?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Could not queue this resume.");
    }
    if (payload.profileId) setAgentId(payload.profileId);
    setDoneUpTo(1);
    window.setTimeout(() => setDoneUpTo((value) => Math.max(value, 2)), 2500);
    setPhase("processing");
  }

  async function start(file: File) {
    setError("");
    setName(file.name);
    setPhase("processing");
    setDoneUpTo(0);
    setDrag(false);

    try {
      if (file.size > MAX_BYTES) {
        throw new Error("PDF must be 5 MB or smaller.");
      }
      const mimeOk = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!mimeOk) {
        throw new Error("PDF only.");
      }
      const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      if (!isPdfMagic(head)) {
        throw new Error("That file is not a valid PDF.");
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in required.");

      const path = `${user.id}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (uploadError) {
        const bucketMissing = /bucket not found/i.test(uploadError.message);
        throw new Error(
          bucketMissing
            ? "The resumes storage bucket is missing. Run database migrations and retry."
            : uploadError.message,
        );
      }
      setResumePath(path);
      setDoneUpTo(1);
      await queueParse(path);
    } catch (err) {
      setPhase("empty");
      setDoneUpTo(0);
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    void start(file);
  }

  return (
    <div>
      <motion.button
        type="button"
        onClick={() => phase === "empty" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (phase === "empty") setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        animate={
          reduce
            ? undefined
            : {
                scale: drag ? 1.03 : 1,
                borderColor: drag ? "var(--accent)" : "var(--border)",
              }
        }
        className={`brutal relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl px-6 text-center ${
          compact ? "min-h-[160px] py-8" : "min-h-[240px] py-12"
        }`}
      >
        <AnimatePresence mode="wait">
          {phase === "empty" ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center"
            >
              <FileText size={28} />
              <p className="mt-4 text-[22px] font-medium tracking-tight">
                {drag ? "Drop it." : "Drop your resume"}
              </p>
              <p className="mt-2 text-[14px] text-muted">PDF only, 5 MB max</p>
            </motion.div>
          ) : (
            <motion.div
              key="run"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm text-left"
            >
              <p className="text-[15px] text-muted">{name}</p>
              <ul className="mt-6 space-y-3">
                {stages.map((stage, i) => {
                  const done = doneUpTo > i;
                  const on = phase === "processing" && doneUpTo === i;
                  return (
                    <li key={stage} className="flex items-center gap-3 text-[15px]">
                      <CheckMark done={done && !on} active={on} />
                      <span className={done || on ? "text-foreground" : "text-muted"}>
                        {stage}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => onFiles(e.target.files)}
      />
      {error ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-[14px] text-danger">{error}</p>
          {resumePath ? (
            <MagneticButton
              variant="secondary"
              onClick={() => {
                setError("");
                setPhase("processing");
                setDoneUpTo(1);
                void queueParse(resumePath).catch((err: unknown) => {
                  setPhase("empty");
                  setError(err instanceof Error ? err.message : "Retry failed.");
                });
              }}
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw size={14} />
                Retry
              </span>
            </MagneticButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
