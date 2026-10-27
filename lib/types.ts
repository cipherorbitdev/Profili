export type Language = "en" | "fr";

export type Personality =
  | "professional"
  | "friendly"
  | "confident"
  | "casual"
  | "enthusiastic"
  | "technical";

export type Profile = {
  name: string;
  email: string;
  handle: string;
  role: string;
  skills: string[];
  voice: string;
  language: Language;
  personality: Personality;
  formality: number;
  verbosity: number;
  greeting: string;
  hasResume: boolean;
  hasAgent: boolean;
  fileName?: string;
  agentId: string;
};

export type Voice = {
  id: string;
  name: string;
  gender: "M" | "F";
  personality: string;
};
