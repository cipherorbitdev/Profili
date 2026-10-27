"use client";

import { VoiceOrb } from "@/components/ui/voice-orb";
import { visuals } from "@/lib/visuals";
import Link from "next/link";

const thread = [
  {
    who: "Visitor",
    photo: visuals.visitor,
    text: "Walk me through your hardest production incident.",
  },
  {
    who: "Voice",
    photo: visuals.candidate,
    text: "Replication lag hit 2.1s after a noisy neighbor. We isolated reads, then shipped lag-aware routing the same night.",
  },
];

export function Impact() {
  return (
    <section id="sandbox" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <p className="label">Live sandbox</p>
        <h2 className="mt-3 text-[40px] font-semibold tracking-tight text-ink sm:text-[56px]">Ask the voice.</h2>
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2">
          <div className="brutal-lg relative rounded-2xl bg-deep p-8">
            <div className="flex justify-center">
              <VoiceOrb size={240} state="speaking" />
            </div>
            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[11px] text-white">
              Live
            </span>
          </div>
          <div className="space-y-4">
            {thread.map((msg) => (
              <div key={msg.who} className="brutal flex gap-3 rounded-2xl p-4">
                <img
                  src={msg.photo}
                  alt=""
                  className="h-12 w-12 rounded-lg border border-border object-cover"
                />
                <div>
                  <p className="font-mono text-[11px] font-medium text-steel">{msg.who}</p>
                  <p className="mt-1 text-[15px]">{msg.text}</p>
                </div>
              </div>
            ))}
            <Link
              href="/talk/waseem"
              className="inline-flex rounded-lg bg-btn px-5 py-2.5 text-sm font-medium text-btn-fg shadow-sm transition-all duration-150 hover:bg-btn-hover"
            >
              Open the live example →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
