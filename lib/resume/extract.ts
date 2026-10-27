import { extractText, getDocumentProxy } from "unpdf";

const MIN_CHARS = 200;

export async function extractResumeText(bytes: Uint8Array) {
  const pdf = await getDocumentProxy(bytes);
  const extracted = await extractText(pdf, { mergePages: true });
  const raw = extracted.text;
  const text = (Array.isArray(raw) ? raw.join("\n") : raw).replace(/\u0000/g, "").trim();

  if (text.replace(/\s+/g, " ").length < MIN_CHARS) {
    return {
      ok: false as const,
      error:
        "This looks like a scanned PDF. Upload a text-based PDF so we can read your experience.",
    };
  }

  return { ok: true as const, text: text.slice(0, 24000) };
}
