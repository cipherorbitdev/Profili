import Link from "next/link";

const mark = "h-[38.5px] w-[32px]";

const type = {
  sm: "text-[15px]",
  md: "text-[16px] sm:text-[17px]",
  lg: "text-[18px] sm:text-[20px]",
} as const;

export function BrandMark({
  className,
  color,
}: {
  className?: string;
  color?: string;
}) {
  return (
    <span
      aria-hidden
      className={`brand-ink inline-block shrink-0 ${className ?? mark}`}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}

export function Wordmark({
  href = "/",
  className = "",
  size = "md",
  tone = "default",
}: {
  href?: string;
  className?: string;
  size?: keyof typeof type;
  tone?: "default" | "onDark";
}) {
  const onDark = tone === "onDark";

  return (
    <Link
      href={href}
      aria-label="Profili"
      className={`inline-flex items-center gap-3.5 ${className}`}
    >
      <span className="grid aspect-[32/38.5] h-[38.5px] w-8 shrink-0 place-items-center overflow-visible">
        <BrandMark
          className={mark}
          color={onDark ? "#ffffff" : undefined}
        />
      </span>
      <span
        className={`font-heading font-semibold tracking-[0.04em] ${type[size]} ${
          onDark ? "text-white" : "text-ink"
        }`}
      >
        Profili
      </span>
    </Link>
  );
}
