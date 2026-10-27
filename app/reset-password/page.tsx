import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { noIndex } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: noIndex,
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
