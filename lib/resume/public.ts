import { getDb } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { profileJsonSchema } from "./schema";

export async function getPublishedProfile(slug: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: profiles.id,
      slug: profiles.slug,
      fullName: profiles.fullName,
      greeting: profiles.greeting,
      profileJson: profiles.profileJson,
    })
    .from(profiles)
    .where(and(eq(profiles.slug, slug), eq(profiles.status, "published")))
    .limit(1);

  if (!row?.slug) return null;
  return {
    id: row.id,
    slug: row.slug,
    fullName: row.fullName,
    greeting: row.greeting,
    profileJson: row.profileJson,
  };
}

export async function getPublishedShare(slug: string) {
  const db = getDb();
  const [row] = await db
    .select({
      fullName: profiles.fullName,
      profileJson: profiles.profileJson,
    })
    .from(profiles)
    .where(and(eq(profiles.slug, slug), eq(profiles.status, "published")))
    .limit(1);

  if (!row) return null;
  const json = profileJsonSchema.safeParse(row.profileJson);
  return {
    full_name: row.fullName,
    headline: json.success ? json.data.headline : "",
  };
}

export async function getPublishedCard(slug: string) {
  const data = await getPublishedProfile(slug);
  if (!data) return null;

  const json = profileJsonSchema.safeParse(data.profileJson);
  return {
    slug: data.slug,
    full_name: data.fullName,
    greeting: data.greeting,
    headline: json.success ? json.data.headline : "",
  };
}
