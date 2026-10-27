"use client";

import { MagneticButton } from "@/components/motion/magnetic-button";
import { FadeIn } from "@/components/motion/reveal";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { VoiceOrb } from "@/components/ui/voice-orb";
import { VoiceWaveform } from "@/components/ui/voice-waveform";
import { getPublicProfile } from "@/lib/mock";
import type { VoiceState } from "@/lib/motion";
import { useSession } from "@/lib/session";
import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function TalkPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user, ready } = useSession();
  const profile = getPublicProfile(username, user);
  const [state, setState] = useState<VoiceState>("idle");

  useEffect(() => {
    if (state !== "listening") return;
    const id = window.setTimeout(() => setState("processing"), 1100);
    return () => window.clearTimeout(id);
  }, [state]);

  useEffect(() => {
    if (state !== "processing") return;
    const id = window.setTimeout(() => setState("speaking"), 800);
    return () => window.clearTimeout(id);
  }, [state]);

  useEffect(() => {
    if (state !== "speaking") return;
    const id = window.setTimeout(() => setState("idle"), 4200);
    return () => window.clearTimeout(id);
  }, [state]);

  const label =
    state === "listening"
      ? "Listening..."
      : state === "processing"
        ? "Thinking..."
        : state === "speaking"
          ? "Speaking..."
          : "Start conversation";

  if (!ready && username !== "demo" && username !== "waseem") {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </header>
      <FadeIn className="relative flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="relative rounded-2xl border border-border bg-deep p-10 shadow-[var(--shadow-lg)]">
          <VoiceOrb size={240} state={state} />
          <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[11px] text-white">
            <span className="ping-live h-1.5 w-1.5 rounded-full bg-[#89C2D9]" />
            Live
          </span>
        </div>
        <h1 className="mt-10 text-[40px] font-semibold tracking-tight text-ink sm:text-[56px]">{profile.name}</h1>
        <p className="mt-2 text-[16px] font-medium text-muted">{profile.role}</p>
        <p className="mt-6 max-w-md text-[17px]">{profile.greeting}</p>
        <VoiceWaveform state={state} className="mt-8" />
        <div className="mt-10">
          <MagneticButton
            arrow={state === "idle"}
            aria-label={label}
            onClick={() => setState(state === "idle" ? "listening" : "idle")}
          >
            {label}
          </MagneticButton>
        </div>
        <p className="mt-8 text-[13px] font-bold">UI preview. Voice is not live.</p>
      </FadeIn>
      <Link
        href="/"
        className="absolute bottom-5 left-5 inline-flex items-center gap-2 text-[13px] font-medium text-muted"
      >
        Made with Profili
      </Link>
    </div>
  );
}
