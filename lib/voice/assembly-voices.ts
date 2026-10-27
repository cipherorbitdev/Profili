export const VOICE_VIBES = ["formal", "casual", "energetic"] as const;
export type VoiceVibe = (typeof VOICE_VIBES)[number];

export type AssemblyVoice = {
  id: string;
  label: string;
  vibe: VoiceVibe;
  accent: "American" | "British";
  gender: "M" | "F";
  blurb: string;
};

/** English Voice Agent IDs from https://www.assemblyai.com/docs/voice-agents/voice-agent-api/voices */
export const ASSEMBLY_VOICES: AssemblyVoice[] = [
  {
    id: "charles",
    label: "Charles",
    vibe: "formal",
    accent: "British",
    gender: "M",
    blurb: "Measured. Boardroom pace.",
  },
  {
    id: "michael",
    label: "Michael",
    vibe: "formal",
    accent: "American",
    gender: "M",
    blurb: "Clear and composed.",
  },
  {
    id: "vera",
    label: "Vera",
    vibe: "formal",
    accent: "British",
    gender: "F",
    blurb: "Precise, unhurried.",
  },
  {
    id: "alba",
    label: "Alba",
    vibe: "casual",
    accent: "American",
    gender: "F",
    blurb: "Warm, everyday.",
  },
  {
    id: "jane",
    label: "Jane",
    vibe: "casual",
    accent: "American",
    gender: "F",
    blurb: "Friendly and even.",
  },
  {
    id: "jean",
    label: "Jean",
    vibe: "casual",
    accent: "American",
    gender: "M",
    blurb: "Relaxed, conversational.",
  },
  {
    id: "eve",
    label: "Eve",
    vibe: "energetic",
    accent: "American",
    gender: "F",
    blurb: "Bright, forward.",
  },
  {
    id: "george",
    label: "George",
    vibe: "energetic",
    accent: "American",
    gender: "M",
    blurb: "Upbeat, direct.",
  },
  {
    id: "anna",
    label: "Anna",
    vibe: "energetic",
    accent: "British",
    gender: "F",
    blurb: "Crisp and lively.",
  },
];

const LEGACY_UI_NAMES: Record<string, string> = {
  Alex: "alba",
  Emma: "jane",
  Daniel: "michael",
  Maya: "eve",
  Noah: "george",
  Sofia: "alba",
};

export const DEFAULT_ASSEMBLY_VOICE = "alba";

/** Spoken verbatim by TTS on the create-page preview. Same line for every voice. */
export const VOICE_PREVIEW_GREETING = "Hi. This is how I sound.";

const VOICE_IDS = new Set(ASSEMBLY_VOICES.map((voice) => voice.id));

export function assemblyVoiceId(stored: string | null | undefined) {
  const value = (stored ?? "").trim();
  if (!value) return DEFAULT_ASSEMBLY_VOICE;
  const lower = value.toLowerCase();
  if (VOICE_IDS.has(lower)) return lower;
  return LEGACY_UI_NAMES[value] ?? DEFAULT_ASSEMBLY_VOICE;
}

export function assemblyVoiceById(id: string) {
  const resolved = assemblyVoiceId(id);
  return ASSEMBLY_VOICES.find((voice) => voice.id === resolved) ?? ASSEMBLY_VOICES[3]!;
}

export function voicesForVibe(vibe: VoiceVibe) {
  return ASSEMBLY_VOICES.filter((voice) => voice.vibe === vibe);
}
