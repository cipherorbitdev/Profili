import { isGoogleOnlyAccount } from "@/lib/auth/account-providers";
import { lookupAuthProvidersByEmail } from "@/lib/auth/lookup-providers";
import { passwordResetCallbackUrlFromOrigin } from "@/lib/auth/email-redirect";
import { requestOrigin } from "@/lib/auth/safe-next";
import { forgotSchema } from "@/lib/auth/schemas";
import { getSupabasePublicEnv, isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = forgotSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid email." }, { status: 400 });
  }

  const providers = await lookupAuthProvidersByEmail(parsed.data.email);
  if (providers && isGoogleOnlyAccount(providers)) {
    return NextResponse.json({ ok: true });
  }

  const { url, anonKey } = getSupabasePublicEnv();
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const origin = requestOrigin(request);
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: passwordResetCallbackUrlFromOrigin(origin),
  });
  if (error) {
    if (/rate/i.test(error.message)) {
      return NextResponse.json({ error: "Too many emails just now." }, { status: 429 });
    }
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: true });
}
