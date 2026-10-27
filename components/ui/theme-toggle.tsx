"use client";

import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({
  className = "",
  plain = false,
}: {
  className?: string;
  plain?: boolean;
}) {
  const { theme, toggle, ready } = useTheme();
  const dark = theme === "dark";
  const icon = ready && dark ? (
    <Sun size={plain ? 14 : 16} strokeWidth={plain ? 2.6 : 1.8} />
  ) : (
    <Moon size={plain ? 14 : 16} strokeWidth={plain ? 2.6 : 1.8} />
  );

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!ready}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={
        plain
          ? `inline-flex items-center text-current transition-opacity hover:opacity-80 disabled:opacity-70 ${className}`
          : `grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-ink transition-all duration-150 hover:border-steel/40 hover:bg-subtle disabled:opacity-70 ${className}`
      }
    >
      {icon}
    </button>
  );
}
