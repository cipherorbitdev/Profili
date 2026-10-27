import { shareImage } from "@/lib/og/share";
import { getPublishedShare } from "@/lib/resume/public";
import { unstable_cache } from "next/cache";

export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "Profili: Your resume can talk";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ParticipantOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await unstable_cache(
    () => getPublishedShare(slug),
    ["og-profile", slug],
    { revalidate: 3600, tags: [`profile:${slug}`] },
  )();

  if (!profile) {
    return shareImage({
      title: "Your resume can talk.",
      subtitle: "Share a link instead of a PDF.",
    });
  }

  return shareImage({
    title: profile.full_name,
    subtitle: profile.headline || "",
    label: "Talk to their AI",
  });
}
