import { LandingNav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { LEGAL_UPDATED } from "@/lib/consent";
import type { ReactNode } from "react";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <LandingNav />
      <main className="px-4 py-16 sm:px-6 sm:py-20">
        <article className="mx-auto max-w-3xl">
          <p className="label">Legal</p>
          <h1 className="mt-3 text-[36px] font-semibold tracking-tight text-ink sm:text-[48px]">
            {title}
          </h1>
          <p className="mt-3 text-[14px] text-muted">Last updated {LEGAL_UPDATED}</p>
          <div className="mt-10 space-y-8 text-[16px] leading-relaxed text-ink/90 [&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-ink [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
