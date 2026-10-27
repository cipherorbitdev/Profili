export const SITE_NAME = "Profili";
export const SITE_TITLE = "Profili: Your resume can talk";
export const SITE_DESCRIPTION =
  "Turn your technical resume into a voice agent. Visitors get direct answers to architecture, stack choices, and past impact in seconds.";

export function siteUrl() {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://profili.fyi");
}

export function truncateMeta(text: string, max = 160) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export const noIndex = { index: false, follow: false } as const;
