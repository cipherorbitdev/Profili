"use client";

import { PhotoMarquee } from "@/components/motion/bits";
import { gallery } from "@/lib/visuals";

export function Gallery() {
  const rowA = gallery.slice(0, 4);
  const rowB = gallery.slice(4);

  return (
    <section className="relative py-10">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-28" />
      <PhotoMarquee items={rowA} />
      <PhotoMarquee items={rowB} reverse />
    </section>
  );
}
