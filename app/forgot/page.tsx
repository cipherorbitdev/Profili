import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { noIndex } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: noIndex,
};

export default function ForgotPage() {
  return <ForgotPasswordForm />;
}
