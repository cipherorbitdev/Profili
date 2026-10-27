export function supabaseCookieOptions(secure: boolean) {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure,
  };
}

export function supabaseCookieSecureFromSiteUrl() {
  return Boolean(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://"));
}

function hostIsLocal(host: string) {
  const hostname = host.split(":")[0] ?? "";
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Cookie Secure must match the page origin. SITE_URL=https must not mark localhost cookies Secure. */
export function supabaseCookieSecureFromRequest(request: {
  nextUrl: { protocol: string };
  headers: { get(name: string): string | null };
}) {
  const host = request.headers.get("host") ?? "";
  if (hostIsLocal(host)) return false;
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded === "https" || forwarded === "http") return forwarded === "https";
  return request.nextUrl.protocol === "https:";
}

export function supabaseCookieSecureFromHostHeaders(headersList: {
  get(name: string): string | null;
}) {
  const host = headersList.get("host") ?? "";
  if (hostIsLocal(host)) return false;
  const forwarded = headersList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded === "https" || forwarded === "http") return forwarded === "https";
  return supabaseCookieSecureFromSiteUrl();
}
