export const BILLING_LIVE = false;
export const CONTACT_EMAIL = "hello@profili.fyi";

export const PRO_MONTHLY_USD = 9;
export const PRO_ANNUAL_USD = 79;
export const PASS_USD = 19;
export const TOPUP_USD = 5;
export const TOPUP_MINUTES = 60;

export type BillingPeriod = "monthly" | "annual";
export type PlanId = "free" | "pro" | "pass";

export type PlanCta = {
  label: string;
  href: string;
};

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  highlighted: boolean;
  tag?: string;
  features: string[];
  orderClassName: string;
};

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Try it with a real link.",
    highlighted: false,
    features: [
      "1 agent",
      "30-second calls",
      "10 calls a month",
      "Leave-a-message included",
      '"Made with Profili" badge',
    ],
    orderClassName: "order-2 md:order-none",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For an active job search.",
    highlighted: true,
    tag: "Best for job seekers",
    features: [
      "60 talk-minutes a month",
      "Calls up to 2 minutes",
      "Insights dashboard with transcripts",
      "Embed on your site",
      "Leave-a-message included",
      "No Profili badge",
      "Email alerts for new visitors",
    ],
    orderClassName: "order-1 md:order-none",
  },
  {
    id: "pass",
    name: "Job-search pass",
    tagline: "90 days, no subscription.",
    highlighted: false,
    features: ["Everything in Pro", "90 talk-minutes", "Pay once, no renewal"],
    orderClassName: "order-3 md:order-none",
  },
];

export const pricingCopy = {
  eyebrow: "Pricing",
  heading: "Priced to cover the calls, nothing more.",
  subhead: "Free while we're in private beta. These are the launch prices.",
  footnote: "Launch pricing. Features and limits may change during beta.",
  topup: `Need more minutes? Top-ups: $${TOPUP_USD} for ${TOPUP_MINUTES} minutes.`,
  teams: "Teams, bootcamps and career centers: contact us",
};

export const pricingFaqs = [
  {
    q: "What counts as a talk-minute?",
    a: "Time visitors spend talking with your agent.",
  },
  {
    q: "Do visitors pay?",
    a: "No. Talking to an agent is always free for visitors.",
  },
  {
    q: "What happens if I run out of minutes?",
    a: "Your link shows a friendly note and nothing is deleted. Top up or wait for the next month.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Pro stays active until the end of the paid period.",
  },
] as const;

export function proAnnualSavePercent() {
  const yearlyIfMonthly = PRO_MONTHLY_USD * 12;
  return Math.round((1 - PRO_ANNUAL_USD / yearlyIfMonthly) * 100);
}

export function planPrice(plan: Plan, period: BillingPeriod) {
  if (plan.id === "free") {
    return { amount: 0, suffix: "", note: "" };
  }
  if (plan.id === "pass") {
    return { amount: PASS_USD, suffix: " one-time", note: "" };
  }
  if (period === "annual") {
    return {
      amount: PRO_ANNUAL_USD,
      suffix: "/yr",
      note: `Save ${proAnnualSavePercent()}%`,
    };
  }
  return { amount: PRO_MONTHLY_USD, suffix: "/mo", note: "" };
}

export function planCta(plan: Plan): PlanCta {
  if (plan.id === "free") {
    return { label: "Start free", href: "/signup" };
  }
  if (BILLING_LIVE) {
    if (plan.id === "pro") return { label: "Get Pro", href: "/signup?plan=pro" };
    return { label: "Get the pass", href: "/signup?plan=pass" };
  }
  return { label: "Join the waitlist", href: "#waitlist" };
}
