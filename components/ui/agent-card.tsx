"use client";

import { MagneticButton } from "@/components/motion/magnetic-button";
import { ShareButton } from "@/components/ui/share-button";
import { StatusIndicator } from "@/components/ui/status";
import { VoiceOrb } from "@/components/ui/voice-orb";
import { publicPath } from "@/lib/mock";
import type { Profile } from "@/lib/types";

export function AgentCard({ user }: { user: Profile }) {
  const first = user.name.split(" ")[0] || "Your";

  return (
    <div className="brutal-lg flex flex-col items-start gap-8 rounded-2xl p-6 sm:flex-row sm:items-center">
      <VoiceOrb size={168} state="idle" />
      <div>
        <StatusIndicator />
        <h2 className="mt-3 text-[32px] font-medium tracking-tight">{first}&apos;s AI</h2>
        <p className="mt-2 max-w-md text-[16px] text-muted">{user.greeting}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <MagneticButton href={publicPath(user.handle)} arrow>
            Talk to my AI
          </MagneticButton>
          <ShareButton handle={user.handle} />
          <MagneticButton href={`/app/agent/${user.agentId}`} variant="ghost">
            Manage
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}
