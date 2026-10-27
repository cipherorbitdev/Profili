import { isGoogleOnlyAccount } from "@/lib/auth/account-providers";
import { lookupAuthProvidersByEmail } from "@/lib/auth/lookup-providers";
import { emailSchema } from "@/lib/auth/schemas";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  email: emailSchema,
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid email." }, { status: 400 });
  }

  const providers = await lookupAuthProvidersByEmail(parsed.data.email);
  if (providers === null) {
    return NextResponse.json({ googleOnly: false });
  }
  return NextResponse.json({ googleOnly: isGoogleOnlyAccount(providers) });
}
