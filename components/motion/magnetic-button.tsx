"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "primary" | "ghost" | "secondary" | "yellow";

const styles: Record<Variant, string> = {
  primary: "bg-btn text-btn-fg hover:bg-btn-hover",
  yellow: "bg-subtle text-ink",
  secondary: "border border-border bg-surface text-ink hover:border-steel/40 hover:bg-subtle",
  ghost: "border border-border bg-surface text-ink hover:border-steel/40 hover:bg-subtle",
};

const base =
  "relative inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium shadow-sm transition-all duration-150 active:scale-[0.98]";

export function MagneticButton({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
  arrow = false,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  arrow?: boolean;
  "aria-label"?: string;
}) {
  const inner = (
    <>
      <span>{children}</span>
      {arrow && <ArrowRight size={16} strokeWidth={2.6} />}
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={`${base} ${styles[variant]} ${className}`}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${base} ${styles[variant]} disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {inner}
    </button>
  );
}

export function ShimmerButton({
  children,
  href,
  onClick,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <MagneticButton href={href} onClick={onClick} className={className} arrow>
      {children}
    </MagneticButton>
  );
}
