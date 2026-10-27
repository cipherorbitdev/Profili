import Link from "next/link";

export function GoLiveButton({
  href = "/signup",
  className = "",
  tone = "default",
  block = false,
}: {
  href?: string;
  className?: string;
  tone?: "default" | "onDark";
  block?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`glow-cta ${tone === "onDark" ? "glow-cta-ondark" : ""} ${
        block ? "w-full" : ""
      } ${className}`}
    >
      <span
        className={`glow-cta-face px-4 py-1.5 text-sm font-medium ${
          block ? "min-h-11" : ""
        }`}
      >
        Go Live
      </span>
    </Link>
  );
}
