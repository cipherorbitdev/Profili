import { getDb } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { EVENT_RESUME_UPLOADED, inngest } from "@/lib/inngest/client";
import { failedEventData } from "@/lib/inngest/emit";
import { extractResumeText } from "@/lib/resume/extract";
import { parseResumeWithLlm } from "@/lib/resume/llm";
import { isPdfMagic } from "@/lib/resume/sanitize";
import { defaultGreeting } from "@/lib/resume/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { eq } from "drizzle-orm";
import { NonRetriableError } from "inngest";

function userSafeParseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Parse failed.";
  if (/scanned PDF|text-based PDF/i.test(message)) return message;
  if (/not a valid PDF/i.test(message)) return "That file is not a valid PDF.";
  if (/GEMINI|API_KEY|quota|429|503|high demand|overloaded/i.test(message)) {
    return "The parser is busy. Retry in a moment.";
  }
  return "We could not parse this resume. Retry or try another PDF.";
}

async function failParse(profileId: string, error: unknown) {
  const db = getDb();
  await db
    .update(profiles)
    .set({ parseStatus: "failed", parseError: userSafeParseError(error) })
    .where(eq(profiles.id, profileId));
  console.error(JSON.stringify({ msg: "resume.parse_failed", profileId, error: String(error) }));
}

async function downloadPdf(resumePath: string) {
  const admin = createAdminClient();
  const { data: file, error } = await admin.storage.from("resumes").download(resumePath);
  if (error || !file) {
    throw new Error(error?.message || "Could not read the uploaded resume.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfMagic(bytes)) {
    throw new NonRetriableError("That file is not a valid PDF.");
  }
  return bytes;
}

export const parseResumeJob = inngest.createFunction(
  {
    id: "parse-resume",
    triggers: [{ event: EVENT_RESUME_UPLOADED }],
    retries: 4,
    concurrency: [
      { key: "event.data.profileId", limit: 1 },
      { limit: 2 },
    ],
    singleton: { key: "event.data.profileId", mode: "cancel" },
    onFailure: async ({ event, error }) => {
      const { profileId } = failedEventData<{ profileId: string }>(event);
      if (profileId) await failParse(profileId, error);
    },
  },
  async ({ event, step }) => {
    const { profileId, resumePath } = event.data as { profileId: string; resumePath: string };

    await step.run("download-pdf", async () => {
      const bytes = await downloadPdf(resumePath);
      return { bytes: bytes.byteLength };
    });

    const extracted = await step.run("extract-text", async () => {
      const bytes = await downloadPdf(resumePath);
      const result = await extractResumeText(bytes);
      if (!result.ok) throw new NonRetriableError(result.error);
      return { text: result.text };
    });

    const parsed = await step.run("gemini-json", async () => {
      return parseResumeWithLlm(extracted.text);
    });

    await step.run("write-draft", async () => {
      const db = getDb();
      const [row] = await db
        .select({ status: profiles.status })
        .from(profiles)
        .where(eq(profiles.id, profileId))
        .limit(1);
      if (!row) throw new NonRetriableError("Profile is gone.");

      await db
        .update(profiles)
        .set({
          fullName: parsed.full_name,
          greeting: defaultGreeting(parsed.full_name),
          profileJson: parsed,
          resumePath,
          parseStatus: "ready",
          parseError: null,
          ...(row.status === "published" ? { status: "draft" } : {}),
        })
        .where(eq(profiles.id, profileId));
    });
  },
);
