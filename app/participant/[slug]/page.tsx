import { PublicVoiceCall } from "@/components/talk/public-voice-call";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getPublishedCard, getPublishedShare } from "@/lib/resume/public";
import { noIndex, SITE_DESCRIPTION, SITE_TITLE, truncateMeta } from "@/lib/seo";
import { publicProfilePath } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { embed } = await searchParams;
  const isEmbed = embed === "1" || embed === "true";
  const profile = await getPublishedShare(slug);

  if (!profile) {
    return {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      robots: noIndex,
    };
  }

  const title = `${profile.full_name}'s AI`;
  const description = truncateMeta(
    `Talk to ${profile.full_name}'s AI.${profile.headline ? ` ${profile.headline}` : ""}`,
  );

  return {
    title,
    description,
    robots: isEmbed ? noIndex : undefined,
    openGraph: {
      title,
      description,
      url: publicProfilePath(slug),
      type: "website",
      siteName: "Profili",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ParticipantPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { slug } = await params;
  const { embed } = await searchParams;
  const isEmbed = embed === "1" || embed === "true";
  const profile = await getPublishedCard(slug);
  if (!profile) notFound();

  return (
    <div className={`relative flex flex-col ${isEmbed ? "min-h-[640px]" : "min-h-screen"}`}>
      {!isEmbed ? (
        <header className="absolute right-5 top-5 z-20">
          <ThemeToggle />
        </header>
      ) : null}
      <div
        className={`mx-auto flex w-full max-w-lg flex-1 flex-col items-center text-center ${
          isEmbed ? "px-4 py-8" : "px-6 py-20"
        }`}
      >
        <h1
          className={`font-semibold tracking-tight ${
            isEmbed ? "text-[32px]" : "text-[40px] sm:text-[56px]"
          }`}
        >
          {profile.full_name}
        </h1>
        {profile.headline ? (
          <p className="mt-2 text-[16px] font-medium text-muted">{profile.headline}</p>
        ) : null}
        <PublicVoiceCall
          slug={profile.slug}
          fullName={profile.full_name}
          greeting={profile.greeting}
          headline={profile.headline}
        />
      </div>
      <Link
        href="/"
        target={isEmbed ? "_blank" : undefined}
        className="absolute bottom-4 left-4 inline-flex items-center gap-2 text-[13px] font-medium text-muted"
      >
        Made with Profili
      </Link>
    </div>
  );
}
