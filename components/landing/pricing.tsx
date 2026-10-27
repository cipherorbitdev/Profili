"use client";

import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/motion/reveal";
import {
  CONTACT_EMAIL,
  planCta,
  planPrice,
  plans,
  pricingCopy,
  pricingFaqs,
  type BillingPeriod,
} from "@/lib/pricing";
import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Pricing() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  function onBillingKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }
    event.preventDefault();
    setPeriod((current) => (current === "monthly" ? "annual" : "monthly"));
  }

  return (
    <section id="pricing" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <p className="label">{pricingCopy.eyebrow}</p>
          <h2 className="mt-3 max-w-3xl text-[36px] font-semibold tracking-tight text-ink sm:text-[52px]">
            {pricingCopy.heading}
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] text-ink/80">{pricingCopy.subhead}</p>
        </ScrollReveal>

        <div className="mt-8 flex justify-center sm:mt-10">
          <div
            role="radiogroup"
            aria-label="Billing period"
            className="inline-flex rounded-lg border border-border bg-surface p-1"
            onKeyDown={onBillingKey}
          >
            {(
              [
                ["monthly", "Monthly"],
                ["annual", "Annual"],
              ] as const
            ).map(([id, label]) => {
              const checked = period === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  tabIndex={checked ? 0 : -1}
                  onClick={() => setPeriod(id)}
                  className={`rounded-md px-4 py-2 text-[13px] font-medium transition-colors ${
                    checked ? "bg-subtle text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <StaggerContainer className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-3">
          {plans.map((plan) => {
            const price = planPrice(plan, period);
            const cta = planCta(plan);
            return (
              <StaggerItem key={plan.id} className={`flex ${plan.orderClassName}`}>
                <article
                  className={`flex h-full w-full flex-col rounded-xl border bg-surface p-5 sm:p-6 ${
                    plan.highlighted ? "border-ink" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[15px] font-semibold text-ink">{plan.name}</p>
                    {plan.tag ? (
                      <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-btn-fg uppercase">
                        {plan.tag}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 flex items-baseline gap-1 text-ink">
                    <span className="text-[40px] font-semibold tracking-tight tabular-nums">${price.amount}</span>
                    <span className="text-[14px] text-muted">{price.suffix}</span>
                  </p>
                  {price.note ? (
                    <p className="mt-1 font-mono text-[11px] font-medium text-[#2A6F97] dark:text-ice">{price.note}</p>
                  ) : (
                    <p className="mt-1 h-[17px]" aria-hidden />
                  )}
                  <p className="mt-3 text-[15px] text-ink/80">{plan.tagline}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-[14px] text-ink">
                        <Check
                          size={16}
                          strokeWidth={2.4}
                          className="mt-0.5 shrink-0 text-[#2A6F97] dark:text-ice"
                          aria-hidden
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={cta.href}
                    className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-[14px] font-medium transition-all duration-150 ${
                      plan.highlighted
                        ? "bg-btn text-btn-fg hover:bg-btn-hover"
                        : "border border-border bg-surface text-ink hover:border-steel/40 hover:bg-subtle"
                    }`}
                  >
                    {cta.label}
                  </Link>
                </article>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <p className="mt-6 text-center text-[13px] text-muted">{pricingCopy.footnote}</p>
        <div className="mt-8 space-y-1.5 text-center text-[14px] text-muted">
          <p>{pricingCopy.topup}</p>
          <p>
            {pricingCopy.teams.split("contact us")[0]}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-ink underline underline-offset-4 hover:text-navy"
            >
              contact us
            </a>
          </p>
        </div>

        <ScrollReveal className="mx-auto mt-14 max-w-2xl" delay={0.08}>
          <ul className="divide-y divide-border border-y border-border">
            {pricingFaqs.map((item) => (
              <li key={item.q}>
                <details className="group py-3">
                  <summary className="cursor-pointer list-none text-[15px] font-medium text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {item.q}
                      <span aria-hidden className="text-muted group-open:hidden">
                        +
                      </span>
                      <span aria-hidden className="hidden text-muted group-open:inline">
                        −
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 pr-8 text-[14px] leading-relaxed text-ink/80">{item.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </div>
    </section>
  );
}
