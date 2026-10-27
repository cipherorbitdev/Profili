import { requireUser } from "@/lib/auth/require-user";
import { ownerProfileIds } from "@/lib/resume/owner";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const ids = await ownerProfileIds(auth.supabase, auth.user.id);
  if (ids.length === 0) return NextResponse.json({ messages: [] });

  const { data, error } = await auth.supabase
    .from("messages")
    .select("id, call_id, body, intent, visitor_name, visitor_email, created_at, notified_at, read_at")
    .in("profile_id", ids)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const id = typeof json === "object" && json && "id" in json ? String((json as { id?: string }).id) : "";
  if (!id) return NextResponse.json({ error: "Missing message." }, { status: 400 });

  const ids = await ownerProfileIds(auth.supabase, auth.user.id);
  if (ids.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { error } = await auth.supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .in("profile_id", ids)
    .is("read_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
