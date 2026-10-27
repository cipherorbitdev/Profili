import { AuthCard } from "@/components/auth/auth-card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  return <AuthCard mode="login" error={params.error} next={params.next} />;
}
