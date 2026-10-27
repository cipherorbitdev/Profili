import { noIndex } from "@/lib/seo";
import type { Metadata } from "next";

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export const metadata: Metadata = {
  robots: noIndex,
};
