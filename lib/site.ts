export function siteOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return "https://profili.fyi";
}

export function publicProfileUrl(slug: string, origin = siteOrigin()) {
  return `${origin}/participant/${slug}`;
}

export function publicProfilePath(slug: string) {
  return `/participant/${slug}`;
}

export function embedProfileUrl(slug: string, origin = siteOrigin()) {
  return `${publicProfileUrl(slug, origin)}?embed=1`;
}

export function embedIframeSnippet(slug: string, origin = siteOrigin()) {
  const src = embedProfileUrl(slug, origin);
  return `<iframe src="${src}" title="Profili voice agent" width="400" height="640" style="border:0;border-radius:16px;max-width:100%;" allow="microphone; autoplay"></iframe>`;
}

export function embedScriptSnippet(slug: string, origin = siteOrigin()) {
  return `<div data-profili-slug="${slug}"></div>\n<script src="${origin}/embed.js" async></script>`;
}
