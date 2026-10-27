"use client";

import { ButtonLink } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { ShareButton } from "@/components/ui/share-button";
import { StatusIndicator } from "@/components/ui/status";
import { VoiceOrb } from "@/components/ui/voice-orb";
import { publicPath, publicUrl } from "@/lib/mock";
import { useSession } from "@/lib/session";
import { use } from "react";

export default function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  use(params);
  const { user } = useSession();
  if (!user) return null;

  return (
    <PageTransition>
      <div className="flex items-start justify-between gap-6">
        <div>
          <StatusIndicator />
          <h1 className="mt-3 text-[40px] font-bold tracking-tight">{user.name}&apos;s AI</h1>
          <p className="mt-2 text-[16px] text-muted">{user.role || "Your agent"}</p>
        </div>
        <VoiceOrb size={120} />
      </div>
      <dl className="mt-12 grid gap-6 sm:grid-cols-2">
        <div>
          <dt className="label">Voice</dt>
          <dd className="mt-1">{user.voice}</dd>
        </div>
        <div>
          <dt className="label">Tone</dt>
          <dd className="mt-1 capitalize">{user.personality}</dd>
        </div>
        <div>
          <dt className="label">Resume source</dt>
          <dd className="mt-1">{user.fileName || "resume.pdf"}</dd>
        </div>
        <div>
          <dt className="label">Share URL</dt>
          <dd className="mt-1 font-mono text-[14px]">{publicUrl(user.handle)}</dd>
        </div>
      </dl>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href={publicPath(user.handle)}>Talk to my AI</ButtonLink>
        <ShareButton handle={user.handle} />
      </div>
      <div className="mt-12 flex flex-wrap gap-4 text-[14px]">
        <ButtonLink href="/app/create" variant="ghost">
          Change voice
        </ButtonLink>
        <ButtonLink href="/app/create" variant="ghost">
          Change personality
        </ButtonLink>
        <ButtonLink href="/app/create" variant="ghost">
          Replace resume
        </ButtonLink>
        <ButtonLink href="/app/create" variant="ghost">
          Regenerate agent
        </ButtonLink>
      </div>
    </PageTransition>
  );
}
