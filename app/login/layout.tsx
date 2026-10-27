import { noIndex } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: noIndex,
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
