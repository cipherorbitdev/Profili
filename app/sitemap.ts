import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return ["", "/privacy", "/terms", "/cookies"].map((path) => ({
    url: `${origin}${path || "/"}`,
    lastModified: new Date(),
  }));
}
