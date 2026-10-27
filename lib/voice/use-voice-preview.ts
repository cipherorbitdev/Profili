"use client";

import { useEffect, useRef, useState } from "react";

type SessionConfig = {
  type: "session.update";
  session: Record<string, unknown>;
};

function playPcmChunk(b64: string, audioCtx: AudioContext, nextTime: { current: number }) {
  const raw = atob(b64);
  const pcm16 = new Int16Array(raw.length / 2);
  for (let i = 0; i < pcm16.length; i += 1) {
    pcm16[i] = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
  }
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i += 1) float32[i] = (pcm16[i] ?? 0) / 32768;
  const buffer = audioCtx.createBuffer(1, float32.length, 24000);
  buffer.getChannelData(0).set(float32);
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(audioCtx.destination);
  nextTime.current = Math.max(nextTime.current, audioCtx.currentTime);
  src.start(nextTime.current);
  nextTime.current += buffer.duration;
  return src;
}

export function useAssemblyVoicePreview() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const stopRef = useRef<(() => void) | null>(null);

  function stop() {
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(null);
  }

  useEffect(() => () => stop(), []);

  async function preview(voiceId: string) {
    stop();
    setError("");
    setPlaying(voiceId);

    const audioCtx = new AudioContext({ sampleRate: 24000 });
    await audioCtx.resume();
    const nextTime = { current: audioCtx.currentTime };
    const sources: AudioBufferSourceNode[] = [];
    let ws: WebSocket | null = null;
    let closed = false;

    function teardown() {
      if (closed) return;
      closed = true;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: "session.end" }));
        } catch {
          /* closed */
        }
      }
      ws?.close();
      ws = null;
      sources.forEach((source) => {
        try {
          source.stop();
        } catch {
          /* already stopped */
        }
      });
      void audioCtx.close().catch(() => undefined);
      setPlaying((current) => (current === voiceId ? null : current));
    }

    stopRef.current = teardown;

    try {
      const response = await fetch("/api/voice/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: voiceId }),
      });
      const payload = (await response.json()) as {
        token?: string;
        sessionConfig?: SessionConfig;
        error?: string;
      };
      if (!response.ok || !payload.token || !payload.sessionConfig) {
        throw new Error(payload.error || "Could not preview this voice.");
      }

      const url = new URL("wss://agents.assemblyai.com/v1/ws");
      url.searchParams.set("token", payload.token);
      ws = new WebSocket(url);

      ws.addEventListener("open", () => {
        ws?.send(JSON.stringify(payload.sessionConfig));
      });

      ws.addEventListener("message", (event) => {
        const msg = JSON.parse(event.data as string) as {
          type?: string;
          data?: string;
          message?: string;
        };
        if (msg.type === "reply.audio" && msg.data) {
          sources.push(playPcmChunk(msg.data, audioCtx, nextTime));
        } else if (msg.type === "reply.done" || msg.type === "session.ended") {
          const remainingMs = Math.max(0, (nextTime.current - audioCtx.currentTime) * 1000);
          window.setTimeout(() => teardown(), remainingMs + 80);
        } else if (msg.type === "session.error" || msg.type === "error") {
          setError(msg.message || "Could not play this voice.");
          teardown();
        }
      });

      ws.addEventListener("error", () => {
        setError("Could not play this voice.");
        teardown();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not play this voice.");
      teardown();
    }
  }

  return { playing, error, preview, stop };
}
