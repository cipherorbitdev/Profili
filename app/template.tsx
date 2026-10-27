"use client";

import { PageTransition } from "@/components/motion/reveal";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition className="min-h-full">
      {children}
    </PageTransition>
  );
}
