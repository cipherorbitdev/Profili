"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ghost" | "secondary" | "line" | "yellow";

const styles: Record<Variant, string> = {
  primary: "bg-btn text-btn-fg hover:bg-btn-hover",
  yellow: "bg-subtle text-ink hover:bg-subtle",
  secondary: "border border-border bg-surface text-ink hover:border-steel/40 hover:bg-subtle",
  ghost: "border border-border bg-surface text-ink hover:border-steel/40 hover:bg-subtle",
  line: "bg-transparent text-ink underline-offset-4 shadow-none hover:underline hover:bg-transparent",
};

type Shared = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

const base =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-5 text-sm font-medium shadow-sm transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
  onClick,
}: Shared &
  Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "disabled" | "onClick">) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function ButtonLink({
  children,
  variant = "primary",
  className = "",
  href,
  ...props
}: Shared & ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
