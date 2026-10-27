const FALLBACK = "/app";

function isSafeRelativePath(value: string) {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.startsWith("/\\")) return false;
  if (value.includes("\\")) return false;
  if (value.includes("://")) return false;
  if (value.includes("@")) return false;
  if (/\s/.test(value)) return false;
  return true;
}

/** Only allow in-app relative paths. Blocks open redirects and protocol-relative URLs. */
export function safeNextPath(raw: string | null | undefined) {
  if (!raw) return FALLBACK;

  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return FALLBACK;
  }

  if (!isSafeRelativePath(value)) return FALLBACK;
  if (value === "/reset-password") return value;
  if (value === "/app" || value.startsWith("/app/")) return value;
  return FALLBACK;
}

export function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const local =
    process.env.NODE_ENV !== "production" ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1";

  if (local) return url.origin;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost?.split(",")[0]?.trim();
  if (!host || host.includes("/") || host.includes("\\") || host.includes("@")) {
    return url.origin;
  }

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (proto !== "http" && proto !== "https") return url.origin;

  return `${proto}://${host}`;
}
