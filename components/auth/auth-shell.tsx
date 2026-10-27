import { Wordmark } from "@/components/ui/wordmark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-deep px-8 py-8 text-white sm:px-10 lg:min-h-full lg:px-12 lg:py-10">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(165deg, #012A4A 0%, #013A63 28%, #01497C 55%, #2C7DA0 82%, #61A5C2 100%)",
          }}
        />
        <Wordmark tone="onDark" className="relative z-10" />
        <div className="relative z-10 mt-16 max-w-md lg:mt-0">
          <h2 className="text-[36px] font-semibold leading-[1.1] tracking-tight text-white sm:text-[44px]">
            Your experience, spoken in real time.
          </h2>
        </div>
      </aside>

      <div className="relative flex items-center justify-center bg-surface px-5 py-12 sm:px-8">
        <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
