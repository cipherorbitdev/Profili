"use client";

import { SineEqualizer } from "@/components/landing/sine-eq";
import { visuals } from "@/lib/visuals";
import { useState } from "react";

const voices = [
  { id: "exec", label: "Executive" },
  { id: "tech", label: "Technical Peer" },
  { id: "conv", label: "Conversational" },
];

export function Features() {
  const [voice, setVoice] = useState("tech");

  return (
    <section id="architecture" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <p className="label">Architecture</p>
        <h2 className="mt-3 max-w-3xl text-[36px] font-semibold tracking-tight text-ink sm:text-[48px]">
          Grounded answers. Visitor signal. A tuner you can hear.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="brutal-lg rounded-2xl p-5 md:col-span-2">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="text-[22px] font-semibold tracking-tight">Resume-grounded guardrails</h3>
                <p className="mt-2 text-[15px]">
                  If it is not on the CV, it does not get said.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-subtle p-3">
                    <p className="font-mono text-[10px] font-medium text-steel">CV</p>
                    <p className="mt-2 text-[14px]">
                      Led zero-downtime Postgres migration for a 12-node cluster.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <p className="font-mono text-[10px] font-medium text-steel">Voice</p>
                    <p className="mt-2 text-[14px]">
                      “We cut over a 12-node Postgres cluster with dual-write.”
                    </p>
                  </div>
                </div>
              </div>
              <img
                src={visuals.desk}
                alt=""
                className="h-full min-h-[180px] w-full rounded-xl border border-border object-cover"
              />
            </div>
          </div>

          <div className="brutal-lg overflow-hidden rounded-2xl">
            <img src={visuals.visitor} alt="" className="h-40 w-full object-cover" />
            <div className="p-5">
              <h3 className="text-[20px] font-semibold tracking-tight">Visitor intent</h3>
              <p className="mt-3 flex justify-between font-mono text-[13px] text-steel">
                <span>Acme · Staff Backend</span>
                <span>4:12</span>
              </p>
              <p className="mt-2 text-[28px] font-semibold tracking-tight text-ink">18%</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-subtle">
                <span className="block h-full w-[18%] bg-cerulean" />
              </div>
            </div>
          </div>

          <div className="brutal-lg rounded-2xl p-5 md:col-span-3">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="lg:w-1/3">
                <h3 className="text-[22px] font-semibold tracking-tight">Voice sandbox</h3>
                <p className="mt-2 text-[15px]">Click a style. The equalizer follows.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {voices.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVoice(item.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                        voice === item.id
                          ? "bg-btn text-btn-fg"
                          : "border border-border bg-surface text-ink hover:border-steel/40"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 rounded-xl border border-border bg-deep p-4">
                <SineEqualizer active />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
