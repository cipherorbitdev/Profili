"use client";

import { MagneticButton } from "@/components/motion/magnetic-button";
import { publicUrl } from "@/lib/mock";
import { useState } from "react";

export function ShareButton({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`https://${publicUrl(handle)}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <MagneticButton variant="secondary" onClick={copy}>
      {copied ? "Copied" : "Share"}
    </MagneticButton>
  );
}
