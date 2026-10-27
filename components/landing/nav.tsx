"use client";

import { Wordmark } from "@/components/ui/wordmark";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/#how", label: "How it Works" },
  { href: "/#embed", label: "Embed" },
  { href: "/#insights", label: "Insights" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#waitlist", label: "Waitlist" },
  { href: "/privacy", label: "Privacy" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Wordmark size="sm" />
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-muted transition-colors duration-150 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden h-9 items-center rounded-lg border border-border bg-surface px-3.5 text-sm font-medium text-ink transition-all duration-150 hover:border-steel/40 hover:bg-subtle sm:inline-flex"
          >
            Login
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface text-ink md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-surface/75 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="text-sm font-medium text-ink sm:hidden"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
