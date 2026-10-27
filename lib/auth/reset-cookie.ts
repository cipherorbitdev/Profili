export const PASSWORD_RESET_COOKIE = "profili-pw-reset";

export function passwordResetCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 10 * 60,
  };
}
