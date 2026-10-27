const TOKEN_URL = "https://agents.assemblyai.com/v1/token";

export async function mintAssemblyToken(
  apiKey: string,
  maxSessionSeconds: number[],
  expiresInSeconds = 60,
) {
  for (const [index, duration] of maxSessionSeconds.entries()) {
    const tokenUrl = new URL(TOKEN_URL);
    tokenUrl.searchParams.set("expires_in_seconds", String(expiresInSeconds));
    tokenUrl.searchParams.set("max_session_duration_seconds", String(duration));
    const tokenResponse = await fetch(tokenUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!tokenResponse.ok) {
      const detail = await tokenResponse.text();
      if (index < maxSessionSeconds.length - 1) continue;
      return { ok: false as const, status: tokenResponse.status, detail };
    }
    const payload = (await tokenResponse.json()) as { token?: string };
    if (!payload.token) {
      if (index < maxSessionSeconds.length - 1) continue;
      return { ok: false as const, status: 502, detail: "AssemblyAI did not return a session token." };
    }
    return { ok: true as const, token: payload.token };
  }
  return { ok: false as const, status: 502, detail: "AssemblyAI did not return a session token." };
}
