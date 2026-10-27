import { safeNextPath } from "@/lib/auth/safe-next";

function confirmPath(next?: string | null) {
  return `/auth/confirm?next=${encodeURIComponent(safeNextPath(next))}`;
}

export function authCallbackUrl(next?: string | null) {
  const origin = window.location.origin;
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNextPath(next))}`;
}

export function authConfirmUrl(next?: string | null) {
  return `${window.location.origin}${confirmPath(next)}`;
}

export function authConfirmUrlFromOrigin(origin: string, next?: string | null) {
  return `${origin.replace(/\/$/, "")}${confirmPath(next)}`;
}

export function passwordResetCallbackUrlFromOrigin(origin: string) {
  return authConfirmUrlFromOrigin(origin, "/reset-password");
}

export function passwordResetCallbackUrl() {
  return passwordResetCallbackUrlFromOrigin(window.location.origin);
}
