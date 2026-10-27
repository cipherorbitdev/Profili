import { z } from "zod";

const highlight = z.string().max(400);

export const personalitySchema = z.enum([
  "professional",
  "friendly",
  "confident",
  "casual",
  "enthusiastic",
  "technical",
]);

export const experienceSchema = z.object({
  company: z.string().max(200),
  title: z.string().max(200),
  dates: z.string().max(120),
  highlights: z.array(highlight).max(20),
});

export const educationSchema = z.object({
  school: z.string().max(200),
  degree: z.string().max(200),
  dates: z.string().max(120),
});

export const projectSchema = z.object({
  name: z.string().max(200),
  highlights: z.array(highlight).max(20),
});

export const profileJsonSchema = z.object({
  full_name: z.string().min(1).max(120),
  headline: z.string().max(240),
  summary: z.string().max(4000),
  experience: z.array(experienceSchema).max(30),
  education: z.array(educationSchema).max(20),
  skills: z.array(z.string().max(80)).max(80),
  projects: z.array(projectSchema).max(30),
  voice: z.string().min(1).max(40).default("alba"),
  personality: personalitySchema.default("professional"),
  formality: z.number().min(0).max(1).default(0.3),
  verbosity: z.number().min(0).max(1).default(0.5),
});

export type ProfileJson = z.infer<typeof profileJsonSchema>;

export const parseResumeBodySchema = z.object({
  resume_path: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i,
      "Invalid resume path.",
    ),
  profile_id: z.string().uuid().optional(),
});

export const agentStyleSchema = z.object({
  voice: z.string().trim().min(1).max(40),
  personality: personalitySchema,
  formality: z.number().min(0).max(1),
  verbosity: z.number().min(0).max(1),
});

export const draftBodySchema = z.object({
  profile_id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(120),
  greeting: z.string().trim().min(1).max(280),
  headline: z.string().trim().max(240),
  summary: z.string().trim().max(4000),
  experience: z.array(experienceSchema).max(30),
  skills: z.array(z.string().trim().min(1).max(80)).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.")
    .min(2)
    .max(48),
  reviewed: z.literal(true),
});

export const publishBodySchema = draftBodySchema.merge(agentStyleSchema);

export const visitorSchema = z.object({
  name: z.string().trim().min(1).max(80),
  purpose: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(120),
});

export const voiceTokenBodySchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .min(2)
    .max(48),
  visitor: visitorSchema,
});

export const voiceSessionBodySchema = z.object({
  callId: z.string().uuid(),
  transcriptToken: z.string().uuid(),
  assemblySessionId: z.string().trim().min(8).max(120),
});

export const voiceEndBodySchema = z.object({
  callId: z.string().uuid(),
  transcriptToken: z.string().uuid(),
  assemblySessionId: z.string().trim().min(8).max(120).optional(),
});

export const voiceTranscriptBodySchema = z.object({
  callId: z.string().uuid(),
  transcriptToken: z.string().uuid(),
  speaker: z.enum(["visitor", "agent"]),
  text: z.string().trim().min(1).max(8000),
  seq: z.number().int().min(0).max(4000),
});

export function defaultGreeting(fullName: string) {
  const name = fullName.trim() || "this person";
  return `Hi, I'm ${name}'s AI. Ask me about their work.`;
}

export function buildStoredProfile(
  current: Partial<ProfileJson>,
  patch: {
    full_name: string;
    headline: string;
    summary: string;
    experience: ProfileJson["experience"];
    skills: string[];
    voice?: string;
    personality?: ProfileJson["personality"];
    formality?: number;
    verbosity?: number;
  },
): ProfileJson {
  return profileJsonSchema.parse({
    education: current.education ?? [],
    projects: current.projects ?? [],
    voice: current.voice ?? "alba",
    personality: current.personality ?? "professional",
    formality: current.formality ?? 0.3,
    verbosity: current.verbosity ?? 0.5,
    ...patch,
  });
}

export const callInsightSchema = z.object({
  intent: z.string().trim().min(1).max(48),
  query: z.string().trim().min(1).max(280),
  summary: z.string().trim().min(1).max(800),
  citation: z.string().trim().min(1).max(80),
  grounded: z.number().min(0).max(100),
  tone: z.number().min(0).max(100),
  fit: z.number().min(0).max(100),
  tone_label: z.string().trim().min(1).max(48),
  fit_label: z.string().trim().min(1).max(48),
});

export type OwnerProfileRow = {
  id: string;
  user_id: string;
  slug: string | null;
  status: "draft" | "published";
  parse_status: "idle" | "parsing" | "ready" | "failed";
  parse_error: string | null;
  full_name: string;
  greeting: string;
  profile_json: ProfileJson;
  resume_path: string | null;
};
