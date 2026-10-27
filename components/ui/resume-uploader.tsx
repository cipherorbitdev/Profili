"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FileText } from "lucide-react";
import { useRef, useState } from "react";
import { CheckMark } from "@/components/ui/status";

const stages = [
  "Uploading",
  "Reading your experience",
  "Understanding your profile",
  "Profile ready",
];

export function ResumeUploader({
  fileName,
  onComplete,
}: {
  fileName?: string;
  onComplete: (name: string) => void;
}) {
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"empty" | "processing" | "done">(
    fileName ? "done" : "empty",
  );
  const [doneUpTo, setDoneUpTo] = useState(fileName ? stages.length : 0);
  const [name, setName] = useState(fileName || "");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  function start(file: string) {
    setError("");
    setName(file);
    setPhase("processing");
    setDoneUpTo(0);
    setDrag(false);
    let i = 0;
    const tick = () => {
      i += 1;
      setDoneUpTo(i);
      if (i < stages.length) window.setTimeout(tick, reduce ? 80 : 700);
      else {
        setPhase("done");
        onComplete(file);
      }
    };
    window.setTimeout(tick, reduce ? 80 : 450);
  }

  function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const ok =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".docx");
    if (!ok) {
      setError("PDF or DOCX only.");
      return;
    }
    start(file.name);
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
        className="brutal relative flex min-h-[240px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl px-6 py-12 text-center"
      >
        <AnimatePresence>
          {drag && (
            <motion.span
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                boxShadow: "inset 0 0 80px var(--glow)",
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {phase === "empty" ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={
                  reduce
                    ? undefined
                    : { y: drag ? -18 : [0, -8, 0] }
                }
                transition={
                  drag
                    ? { duration: 0.3 }
                    : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                }
              >
                <FileText size={28} />
              </motion.div>
              <p className="mt-4 text-[22px] font-medium tracking-tight">
                {drag ? "Drop it." : "Drop your resume"}
              </p>
              <p className="mt-2 text-[14px] text-muted">PDF or DOCX</p>
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
                  const on = doneUpTo === i && phase === "processing";
                  return (
                    <motion.li
                      key={stage}
                      className="flex items-center gap-3 text-[15px]"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <CheckMark done={done} active={on} />
                      <span className={done || on ? "text-foreground" : "text-muted"}>
                        {stage} {done ? "✓" : ""}
                      </span>
                    </motion.li>
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
        accept=".pdf,.docx,application/pdf"
        className="sr-only"
        onChange={(e) => onFiles(e.target.files)}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-3 text-[14px] text-danger"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
