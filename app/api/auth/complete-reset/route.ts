import { PASSWORD_RESET_COOKIE, passwordResetCookieOptions } from "@/lib/auth/reset-cookie";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PASSWORD_RESET_COOKIE, "", {
    ...passwordResetCookieOptions(url.protocol === "https:"),
    maxAge: 0,
  });
  return response;
}
