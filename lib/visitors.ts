export type Visitor = {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
  intent: string;
  tone: number;
  clarity: number;
  grounded: number;
  minutes: number;
  ago: string;
  query: string;
  answer: string;
  citation: string;
  toneLabel: string;
  fitLabel: string;
  email: string;
  leftMessage?: boolean;
};

export const VISITORS: Visitor[] = [
  {
    id: "priya",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    alt: "Claire Bennett",
    title: "Claire Bennett",
    description: "Asked about the Postgres cutover and replica lag.",
    intent: "Visitor",
    tone: 86,
    clarity: 91,
    grounded: 94,
    minutes: 6,
    ago: "2m ago",
    query:
      "How did you handle PostgreSQL cutover and replica lag under high write loads?",
    answer:
      "We dual-wrote for one sprint, then isolated reads when replica lag hit 2.1s. Lag-aware routing shipped the same night. Nothing in the answer sits outside the CV.",
    citation: "CV Page 2: Infrastructure",
    toneLabel: "Direct & Technical",
    fitLabel: "High relevance match",
    email: "claire.bennett@northstar.hire",
    leftMessage: true,
  },
  {
    id: "jordan",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    alt: "Justin Hale",
    title: "Justin Hale",
    description: "Peer review on Go services and gRPC fan-out.",
    intent: "Peer",
    tone: 78,
    clarity: 84,
    grounded: 88,
    minutes: 4,
    ago: "11m ago",
    query: "Walk me through gRPC fan-out in the Go services. Where did it break?",
    answer:
      "Fan-out sat behind a bounded worker pool. Timeouts were per-call, not per-batch, so one slow peer stalled the rest. We added a deadline budget and hedged the tail.",
    citation: "CV Page 1: Backend",
    toneLabel: "Peer-level, precise",
    fitLabel: "Strong technical match",
    email: "justin.hale@peermail.dev",
  },
  {
    id: "amelia",
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    alt: "Amelia Brooks",
    title: "Amelia Brooks",
    description: "Hiring loop. Stack tradeoffs and on-call history.",
    intent: "Hiring manager",
    tone: 81,
    clarity: 79,
    grounded: 92,
    minutes: 9,
    ago: "24m ago",
    query: "Why this stack, and what did on-call actually look like for you?",
    answer:
      "React and AWS because the team already shipped there. On-call was one week in four. The last page was a noisy neighbor on replicas, not a mystery outage.",
    citation: "CV Page 3: Leadership",
    toneLabel: "Calm, hiring-ready",
    fitLabel: "Loop-ready signal",
    email: "amelia.brooks@lattice.jobs",
    leftMessage: true,
  },
  {
    id: "luis",
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    alt: "Louis Carter",
    title: "Louis Carter",
    description: "Founder screen. Impact numbers and shipping cadence.",
    intent: "Founder",
    tone: 74,
    clarity: 88,
    grounded: 90,
    minutes: 7,
    ago: "1h ago",
    query: "What shipped, what moved a number, and how fast was the cadence?",
    answer:
      "Zero-downtime Postgres cutover, dual-write, then chat flows on a SaaS product. Cadence was weekly cuts, not quarterly decks. Impact is on the page: lag down, cutover without a night of downtime.",
    citation: "CV Page 1: Impact",
    toneLabel: "Blunt, metric-first",
    fitLabel: "Founder-screen fit",
    email: "louis.carter@foundry.co",
  },
  {
    id: "nina",
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    alt: "Nina Walsh",
    title: "Nina Walsh",
    description: "Asked how the voice stays inside the CV.",
    intent: "Visitor",
    tone: 90,
    clarity: 85,
    grounded: 97,
    minutes: 5,
    ago: "2h ago",
    query: "How does the voice stay inside the CV? What happens if I ask off-page?",
    answer:
      "If it is not on the resume, it does not get said. Off-page questions get a redirect to what is actually listed: stack, incidents, and shipped work.",
    citation: "CV Page 1: Scope",
    toneLabel: "Direct & Technical",
    fitLabel: "High relevance match",
    email: "nina.walsh@recruit.team",
  },
  {
    id: "owen",
    src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    alt: "Owen Park",
    title: "Owen Park",
    description: "Technical deep dive on AWS and failover.",
    intent: "Peer",
    tone: 72,
    clarity: 93,
    grounded: 89,
    minutes: 8,
    ago: "3h ago",
    query: "Failover on AWS. What actually trips, and what recovers first?",
    answer:
      "Reads shift first. Writes stay on the primary until lag is healthy. We did not invent a mesh. The CV lists the cutover and the dual-write window.",
    citation: "CV Page 2: AWS",
    toneLabel: "Dry, systems-first",
    fitLabel: "Deep technical match",
    email: "owen.park@systems.dev",
  },
  {
    id: "sara",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    alt: "Sara Lind",
    title: "Sara Lind",
    description: "Culture and communication under incident pressure.",
    intent: "Hiring manager",
    tone: 88,
    clarity: 80,
    grounded: 86,
    minutes: 6,
    ago: "5h ago",
    query: "How do you communicate when an incident is still open?",
    answer:
      "Status first, then blast radius, then the next action. The CV names the incident and the routing change. No culture essay. Just what was said in the room.",
    citation: "CV Page 3: On-call",
    toneLabel: "Clear under pressure",
    fitLabel: "Manager-loop fit",
    email: "sara.lind@hireloop.com",
  },
  {
    id: "dev",
    src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
    alt: "Ryan Cole",
    title: "Ryan Cole",
    description: "Asked for a walkthrough of the last production incident.",
    intent: "Visitor",
    tone: 83,
    clarity: 90,
    grounded: 95,
    minutes: 5,
    ago: "Yesterday",
    query: "Walk me through the last production incident, start to finish.",
    answer:
      "Replication lag hit 2.1s after a noisy neighbor. We isolated reads, then shipped lag-aware routing the same night. Timeline matches the resume. No extra drama.",
    citation: "CV Page 2: Incidents",
    toneLabel: "Direct & Technical",
    fitLabel: "High relevance match",
    email: "ryan.cole@search.jobs",
  },
];
