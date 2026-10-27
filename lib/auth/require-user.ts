import { ensureAppUser } from "@/lib/auth/ensure-user";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type Authed = {
  user: User;
  supabase: SupabaseClient;
  error: null;
};

type Unauthed = {
  user: null;
  supabase: SupabaseClient;
  error: NextResponse;
};

export async function requireUser(): Promise<Authed | Unauthed> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      supabase,
      error: NextResponse.json({ error: "Sign in required." }, { status: 401 }),
    };
  }

  const setupError = await ensureAppUser(supabase, user);
  if (setupError) {
    return {
      user: null,
      supabase,
      error: NextResponse.json(
        { error: setupError.message },
        { status: setupError.missing ? 503 : 500 },
      ),
    };
  }

  return { user, supabase, error: null };
}
