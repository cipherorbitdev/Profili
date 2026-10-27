"use client";

import { BrandMark } from "@/components/ui/wordmark";
import { demoPersonas } from "@/lib/demo-personas";
import { PASS_USD, PRO_MONTHLY_USD } from "@/lib/pricing";
import { AudioLines, BarChart3, Shield, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const TOTAL = 10;

function Chrome({ n }: { n: number }) {
  return (
    <div className="pitch-slide-top">
      <p className="pitch-brand">
        <BrandMark className="h-7 w-6" color="#012a4a" />
        Profili
      </p>
      <p className="pitch-num">
        {String(n).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
      </p>
    </div>
  );
}

function Eq() {
  return (
    <span className="eq" aria-hidden>
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function MiniCv({
  name,
  role,
  initials,
}: {
  name: string;
  role: string;
  initials: string;
}) {
  return (
    <div className="cv" aria-hidden>
      <b>
        {initials} · {name}
      </b>
      <em>{role}</em>
      <u />
      <u style={{ width: "80%" }} />
      <u style={{ width: "62%" }} />
      <u style={{ width: "74%" }} />
    </div>
  );
}

export default function PresentationPage() {
  const stage = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(TOTAL - 1, next));
    setIndex(clamped);
    stage.current
      ?.querySelectorAll<HTMLElement>("[data-slide]")
      [clamped]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (["ArrowRight", "ArrowDown", " "].includes(event.key)) {
        event.preventDefault();
        go(index + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        go(index - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  return (
    <div className="pitch-root">
      <div ref={stage} className="pitch-stage">
        <section data-slide className="pitch-slide">
          <Chrome n={1} />
          <div className="pitch-body">
            <div className="pitch-orb" aria-hidden>
              <Eq />
            </div>
            <p className="pitch-kicker">What it is · What it does</p>
            <h1 className="pitch-display">
              Your resume can <span className="pitch-em">Talk.</span>
            </h1>
            <p className="pitch-line">A shareable voice for your experience. Built by TeamRennes.</p>
          </div>
        </section>

        <section data-slide className="pitch-slide">
          <Chrome n={2} />
          <div className="pitch-body">
            <div className="pitch-visual">
              <div className="paper-stack">
                {demoPersonas.map((person) => (
                  <MiniCv
                    key={person.id}
                    name={person.name}
                    role={person.role}
                    initials={person.initials}
                  />
                ))}
              </div>
              <p className="stat"></p>
            </div>
            <p className="pitch-kicker">The problem</p>
            <h1 className="pitch-display">I sent <b>100</b> résumés.</h1>
            <p className="pitch-line">
              Almost no one replied. A PDF is easy to ignore. It cannot explain itself, and it cannot start a
              conversation.
            </p>
          </div>
        </section>

        <section data-slide className="pitch-slide">
          <Chrome n={3} />
          <div className="pitch-body">
            <div className="turn">
              <div className="pitch-orb" aria-hidden>
                <Eq />
              </div>
              <p className="pitch-kicker">The turn</p>
            </div>
            <h1 className="pitch-display">Then I shared a <b>oice.</b></h1>
            <p className="pitch-line">People <b>talked</b> to it. They asked about the work. Ghosting became a <b>conversation.</b></p>
          </div>
        </section>

        <section data-slide className="pitch-slide">
          <Chrome n={4} />
          <div className="pitch-body">
            <p className="pitch-kicker">How it works</p>
            <h1 className="pitch-display">Three moves.</h1>
            <div className="steps">
              <div className="step">
                <span className="step-n">01</span>
                <strong>Read</strong>
                <p>The PDF becomes a structured profile.</p>
              </div>
              <div className="step">
                <span className="step-n">02</span>
                <strong>Tune</strong>
                <p>You pick the voice. You publish a slug.</p>
              </div>
              <div className="step">
                <span className="step-n">03</span>
                <strong>Link</strong>
                <p>Share it. Embed it. See what they asked.</p>
              </div>
            </div>
          </div>
        </section>

        <section data-slide className="pitch-slide">
          <Chrome n={5} />
          <div className="pitch-body">
            <p className="pitch-kicker">Embed</p>
            <h1 className="pitch-display">Drop it on your site.</h1>
            <div className="site" aria-hidden>
              <div className="site-bar">
                <span />
                <span />
                <span />
                <em>maya.dev</em>
              </div>
              <div className="site-body">
                <div className="site-copy">
                  <b>Maya Chen</b>
                  <i>Founder · Loomstack</i>
                  <u />
                  <u />
                  <u />
                </div>
                <div className="site-embed">
                  <p>Talk to me</p>
                  <div className="pitch-orb" style={{ width: "3.1rem", height: "3.1rem" }}>
                    <Eq />
                  </div>
                  <strong>Start talking</strong>
                </div>
              </div>
            </div>
            <p className="pitch-line">One snippet. Visitors stay on your portfolio and talk to your résumé.</p>
          </div>
        </section>

        <section data-slide className="pitch-slide">
          <Chrome n={6} />
          <div className="pitch-body">
            <p className="pitch-kicker">Why this is different</p>
            <h1 className="pitch-display">Not a chatbot with a CV pasted in.</h1>
            <div className="cards3">
              <div className="mini">
                <div className="icon-disk">
                  <Shield size={22} strokeWidth={2} />
                </div>
                <strong>Grounded</strong>
                <p>If it is not on the résumé, it does not get said.</p>
              </div>
              <div className="mini">
                <div className="icon-disk">
                  <AudioLines size={22} strokeWidth={2} />
                </div>
                <strong>Interruptible</strong>
                <p>Talk over it. It stops. Like a real conversation.</p>
              </div>
              <div className="mini">
                <div className="icon-disk">
                  <BarChart3 size={22} strokeWidth={2} />
                </div>
                <strong>Visible</strong>
                <p>Who called, what they asked, how it scored.</p>
              </div>
            </div>
          </div>
        </section>

        <section data-slide className="pitch-slide">
          <Chrome n={7} />
          <div className="pitch-body">
            <p className="pitch-kicker">Insights</p>
            <h1 className="pitch-display">Who talked. What they asked.</h1>
            <div className="dash">
              <div className="dash-top">
                <span>Insights</span>
                <span>8 completed calls</span>
              </div>
              <div className="dash-grid">
                <div>
                  <div className="dash-row">
                    <i>CB</i> Claire Bennett · Visitor
                  </div>
                  <div className="dash-row">
                    <i>JH</i> Justin Hale · Peer
                  </div>
                  <div className="dash-row">
                    <i>AB</i> Amelia Brooks · Hiring manager
                  </div>
                </div>
                <div>
                  <div className="meter">
                    <span>
                      Grounded <b style={{ background: "none", height: "auto" }}>94%</b>
                    </span>
                    <b>
                      <i style={{ width: "94%" }} />
                    </b>
                  </div>
                  <div className="meter">
                    <span>
                      Tone <b style={{ background: "none", height: "auto" }}>86%</b>
                    </span>
                    <b>
                      <i style={{ width: "86%" }} />
                    </b>
                  </div>
                  <div className="meter">
                    <span>
                      Fit <b style={{ background: "none", height: "auto" }}>91%</b>
                    </span>
                    <b>
                      <i style={{ width: "91%" }} />
                    </b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section data-slide className="pitch-slide">
          <Chrome n={8} />
          <div className="pitch-body">
            <p className="pitch-kicker">Pricing</p>
            <h1 className="pitch-display">Priced to cover the calls.</h1>
            <div className="price">
              <article>
                <b>$0</b>
                <strong>Free</strong>
                <p>1 agent · 10 calls a month</p>
              </article>
              <article className="on">
                <b>${PRO_MONTHLY_USD}</b>
                <strong>Pro</strong>
                <p>60 talk-minutes · Insights · Embed</p>
              </article>
              <article>
                <b>${PASS_USD}</b>
                <strong>Job-search pass</strong>
                <p>90 days. Pay once.</p>
              </article>
            </div>
            <p className="pitch-line">Free while we are in private beta.</p>
          </div>
        </section>

        <section data-slide className="pitch-slide">
          <Chrome n={9} />
          <div className="pitch-body">
            <div className="icon-disk" style={{ width: "3.2rem", height: "3.2rem" }}>
              <User size={22} strokeWidth={2} />
            </div>
            <p className="pitch-kicker">Who it is for</p>
            <h1 className="pitch-display">Professionals who are tired of being skimmed.</h1>
            <p className="pitch-line">Not a recruiting platform. A voice you own, on a link you control.</p>
          </div>
        </section>

        <section data-slide className="pitch-slide">
          <Chrome n={10} />
          <div className="pitch-body">
            <div className="pitch-orb">
              <Eq />
            </div>
            <p className="pitch-kicker">Try it</p>
            <h1 className="pitch-display">Let the résumé speak.</h1>
            <p className="url">profili.fyi</p>
            <p className="pitch-line">Private beta. One link. A conversation instead of a void.</p>
          </div>
        </section>
      </div>
      <p className="pitch-hint">Arrows move inside the board · Print → PDF · Landscape</p>
    </div>
  );
}
