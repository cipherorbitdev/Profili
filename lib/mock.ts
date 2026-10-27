import type { Profile, Voice } from "./types";

export const STORAGE_KEY = "profili-demo-user";

export const demoUser: Profile = {
  name: "Waseem Javed",
  handle: "waseem",
  email: "waseem@example.com",
  role: "Software Development Engineer",
  skills: ["Go", "AWS", "Postgres"],
  voice: "Alex",
  language: "en",
  personality: "professional",
  formality: 0.35,
  verbosity: 0.55,
  greeting: "Hi, I'm Waseem's AI. Ask me anything about his experience.",
  hasResume: true,
  hasAgent: true,
  fileName: "Waseem-Javed.pdf",
  agentId: "waseem",
};

export const voices: Voice[] = [
  { id: "alex", name: "Alex", gender: "M", personality: "Warm · Professional" },
  { id: "emma", name: "Emma", gender: "F", personality: "Confident · Friendly" },
  { id: "daniel", name: "Daniel", gender: "M", personality: "Calm · Authoritative" },
  { id: "maya", name: "Maya", gender: "F", personality: "Bright · Conversational" },
  { id: "noah", name: "Noah", gender: "M", personality: "Low · Precise" },
  { id: "sofia", name: "Sofia", gender: "F", personality: "Warm · Casual" },
];

export const personalities = [
  "professional",
  "friendly",
  "confident",
  "casual",
  "enthusiastic",
  "technical",
] as const;

export function handleFromName(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  return slug || "you";
}

export function greetingFor(name: string) {
  const first = name.trim().split(/\s+/)[0] || "this person";
  return `Hi, I'm ${first}'s AI. Ask me anything about their experience.`;
}

export function publicPath(handle: string) {
  return `/talk/${handle}`;
}

export function publicUrl(handle: string) {
  return `profili.app/talk/${handle}`;
}

export function getPublicProfile(handle: string, session: Profile | null): Profile {
  const key = handle.toLowerCase();
  if (key === "demo" || key === "waseem") return demoUser;
  if (session && session.handle.toLowerCase() === key) return session;
  return {
    ...demoUser,
    name: handle.charAt(0).toUpperCase() + handle.slice(1),
    handle: key,
    agentId: key,
    greeting: greetingFor(handle),
  };
}
