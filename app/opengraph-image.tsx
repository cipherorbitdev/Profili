import { alt, contentType, shareImage, size } from "@/lib/og/share";

export { alt, contentType, size };

export default function OpenGraphImage() {
  return shareImage({
    title: "Your resume can talk.",
    subtitle: "Share a link instead of a PDF.",
  });
}
