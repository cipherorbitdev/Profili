import { AuthCard } from "@/components/auth/auth-card";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  return <AuthCard mode="signup" error={params.error} next={params.next} />;
}
