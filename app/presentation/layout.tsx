import { noIndex } from "@/lib/seo";
import type { Metadata } from "next";
import "./pitch.css";

export const metadata: Metadata = {
  title: "Profili — Pitch",
  robots: noIndex,
};

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
