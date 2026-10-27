import type { ReactNode } from "react";

const inputClass =
  "h-12 w-full rounded-xl border bg-surface px-3 text-[15px] text-ink outline-none placeholder:text-muted/50 focus:border-cerulean";

export function AuthField({
  label,
  error,
  extra,
  children,
}: {
  label: string;
  error?: string;
  extra?: ReactNode;
  children: (className: string) => ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[13px] font-semibold text-ink">
        {label}
        {extra}
      </span>
      {children(`${inputClass} ${error ? "border-red-400" : "border-ink/20"}`)}
      {error ? <p className="mt-1 text-[12px] text-red-700 dark:text-red-300">{error}</p> : null}
    </label>
  );
}
