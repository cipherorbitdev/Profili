import type { ComponentProps } from "react";

export function Field({
  label,
  ...props
}: { label: string } & ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="label mb-2 block">{label}</span>
      <input
        className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-[15px] text-ink outline-none transition-colors duration-150 placeholder:text-steel/60 focus:border-steel/40"
        {...props}
      />
    </label>
  );
}
