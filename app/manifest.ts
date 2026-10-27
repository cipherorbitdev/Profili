import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Profili",
    short_name: "Profili",
    description: "Turn your technical resume into an autonomous voice agent.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F2EC",
    theme_color: "#0E1B2E",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
