import { createHash } from "node:crypto";

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return ip;
}

export function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex");
}
