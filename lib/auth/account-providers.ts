export function isGoogleOnlyAccount(providers: string[]) {
  const set = new Set(providers.map((item) => item.toLowerCase()));
  return set.has("google") && !set.has("email");
}

export function providersFromUser(user: {
  identities?: Array<{ provider?: string }> | null;
  app_metadata?: { providers?: unknown };
}) {
  const fromMeta = user.app_metadata?.providers;
  if (Array.isArray(fromMeta) && fromMeta.every((item) => typeof item === "string")) {
    return fromMeta;
  }
  return (user.identities ?? [])
    .map((row) => row.provider)
    .filter((item): item is string => Boolean(item));
}

export function googleOnlySignupMessage() {
  return "This email already uses Google. Continue with Google instead of creating a password.";
}

/** Second signUp for an existing address returns no identities and no new mail. */
export function signupShouldResendConfirmation(input: {
  user?: Parameters<typeof providersFromUser>[0] | null;
  errorMessage?: string | null;
}): "google_only" | "resend" | "proceed" {
  const user = input.user ?? null;
  if (user && isGoogleOnlyAccount(providersFromUser(user))) return "google_only";
  if (input.errorMessage && /already (been )?registered/i.test(input.errorMessage)) {
    return "resend";
  }
  if (user && providersFromUser(user).length === 0) return "resend";
  return "proceed";
}
