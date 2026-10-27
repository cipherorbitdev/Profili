"use client";

import { MagneticButton } from "@/components/motion/magnetic-button";
import { Field } from "@/components/ui/field";
import { VoiceOrb } from "@/components/ui/voice-orb";
import type { VoiceState } from "@/lib/motion";
import { CALL_SECONDS, formatCallClock } from "@/lib/voice/call-window";
import { buildToolResult, type ToolCallEvent } from "@/lib/voice/tool-result";
import { useEffect, useRef, useState } from "react";

type SessionConfig = {
  type: "session.update";
  session: Record<string, unknown>;
};

export function PublicVoiceCall({
  slug,
  fullName,
  greeting,
  headline,
}: {
  slug: string;
  fullName: string;
  greeting: string;
  headline: string;
}) {
  const [step, setStep] = useState<"form" | "call" | "ended">("form");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [voice, setVoice] = useState<VoiceState>("idle");
  const [level, setLevel] = useState(0);
  const [remaining, setRemaining] = useState(CALL_SECONDS);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const playbackTimeRef = useRef(0);
  const callIdRef = useRef<string | null>(null);
  const transcriptTokenRef = useRef<string | null>(null);
  const seqRef = useRef(0);
  const endingRef = useRef(false);
  const assemblySessionIdRef = useRef<string | null>(null);
  const voiceRef = useRef<VoiceState>("idle");
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const playAnalyserRef = useRef<AnalyserNode | null>(null);
  voiceRef.current = voice;
  const [captions, setCaptions] = useState<Array<{ speaker: "visitor" | "agent"; text: string }>>(
    [],
  );
  const [bargeInFlash, setBargeInFlash] = useState(false);

  const pendingToolResults = useRef<Array<Promise<{ event: ToolCallEvent; result: unknown }>>>([]);
  const lastWsEventRef = useRef<string | null>(null);
  const sessionEndedRef = useRef(false);
  const toolsInFlightRef = useRef(0);
  const waitingOnToolsRef = useRef(false);

  useEffect(() => {
    return () => {
      void teardown(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function beaconEnd() {
      const callId = callIdRef.current;
      const transcriptToken = transcriptTokenRef.current;
      if (!callId || !transcriptToken) return;
      const body = JSON.stringify({
        callId,
        transcriptToken,
        ...(assemblySessionIdRef.current ? { assemblySessionId: assemblySessionIdRef.current } : {}),
      });
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/voice/end", blob);
    }
    window.addEventListener("pagehide", beaconEnd);
    window.addEventListener("beforeunload", beaconEnd);
    return () => {
      window.removeEventListener("pagehide", beaconEnd);
      window.removeEventListener("beforeunload", beaconEnd);
    };
  }, []);

  function markBargeIn() {
    setBargeInFlash(true);
    window.setTimeout(() => setBargeInFlash(false), 2800);
  }

  function flushPlayback() {
    sourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    });
    sourcesRef.current = [];
    const ctx = ctxRef.current;
    if (ctx) playbackTimeRef.current = ctx.currentTime;
  }

  async function teardown(sendEnd: boolean) {
    if (endingRef.current) return;
    endingRef.current = true;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "session.end" }));
      } catch {
        /* closed */
      }
    }
    ws?.close();
    wsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    flushPlayback();
    await ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    micAnalyserRef.current = null;
    playAnalyserRef.current = null;
    const callId = callIdRef.current;
    const transcriptToken = transcriptTokenRef.current;
    if (sendEnd && callId && transcriptToken) {
      await fetch("/api/voice/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId,
          transcriptToken,
          ...(assemblySessionIdRef.current ? { assemblySessionId: assemblySessionIdRef.current } : {}),
        }),
      }).catch(() => undefined);
    }
    callIdRef.current = null;
    transcriptTokenRef.current = null;
    assemblySessionIdRef.current = null;
  }

  function saveTurn(speaker: "visitor" | "agent", text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const callId = callIdRef.current;
    const transcriptToken = transcriptTokenRef.current;
    if (!callId || !transcriptToken) return;
    setCaptions((current) => {
      const last = current[current.length - 1];
      if (last && last.speaker === speaker && last.text === trimmed) return current;
      return [...current, { speaker, text: trimmed }].slice(-20);
    });
    const seq = seqRef.current;
    seqRef.current += 1;
    void fetch("/api/voice/transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId, transcriptToken, speaker, text: trimmed, seq }),
    }).catch(() => undefined);
  }

  function readTurn(msg: {
    type?: string;
    text?: string;
    transcript?: string;
    turn?: { transcript?: string };
  }) {
    const text = (msg.text || msg.transcript || msg.turn?.transcript || "").trim();
    if (!text) return;
    if (msg.type === "transcript.user" || msg.type === "turn") {
      saveTurn("visitor", text);
      return;
    }
    if (msg.type === "transcript.agent") {
      saveTurn("agent", text);
    }
  }

  async function runToolCall(event: ToolCallEvent) {
    const callId = callIdRef.current;
    const transcriptToken = transcriptTokenRef.current;
    if (!callId || !transcriptToken || !event.name) {
      return { event, result: { ok: false, message: "Call is not active." } };
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch("/api/voice/tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          callId,
          transcriptToken,
          name: event.name,
          arguments: event.arguments ?? {},
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        return { event, result: { ok: false, message: payload.error || payload.message || "Tool failed." } };
      }
      return { event, result: payload };
    } catch {
      return { event, result: { ok: false, message: "Tool timed out." } };
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function flushToolsIfIdle(ws: WebSocket) {
    if (lastWsEventRef.current !== "reply.done") return;
    if (!pendingToolResults.current.length) return;
    const batch = pendingToolResults.current.splice(0, pendingToolResults.current.length);
    const settled = await Promise.all(batch);
    if (ws.readyState !== WebSocket.OPEN) return;
    for (const item of settled) {
      ws.send(JSON.stringify(buildToolResult(item.event, item.result)));
    }
    if (waitingOnToolsRef.current && toolsInFlightRef.current <= 0 && !pendingToolResults.current.length) {
      waitingOnToolsRef.current = false;
      void finish("timer");
    }
  }

  function handleToolCall(event: ToolCallEvent, ws: WebSocket) {
    toolsInFlightRef.current += 1;
    const work = runToolCall(event).finally(() => {
      toolsInFlightRef.current = Math.max(0, toolsInFlightRef.current - 1);
    });
    pendingToolResults.current.push(work);
    void work.then(() => flushToolsIfIdle(ws));
  }

  async function startCall() {
    setError("");
    endingRef.current = false;
    sessionEndedRef.current = false;
    waitingOnToolsRef.current = false;
    pendingToolResults.current = [];
    lastWsEventRef.current = null;
    toolsInFlightRef.current = 0;
    setBargeInFlash(false);
    setRemaining(CALL_SECONDS);

    try {
      const tokenResponse = await fetch("/api/voice/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          visitor: { name, purpose, email },
        }),
      });
      const tokenPayload = (await tokenResponse.json()) as {
        token?: string;
        callId?: string;
        transcriptToken?: string;
        sessionConfig?: SessionConfig;
        error?: string;
      };
      if (
        !tokenResponse.ok ||
        !tokenPayload.token ||
        !tokenPayload.callId ||
        !tokenPayload.transcriptToken ||
        !tokenPayload.sessionConfig
      ) {
        throw new Error(tokenPayload.error || "Could not start the call.");
      }
      callIdRef.current = tokenPayload.callId;
      transcriptTokenRef.current = tokenPayload.transcriptToken;
      seqRef.current = 0;
      setCaptions([]);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      await audioCtx.resume();
      ctxRef.current = audioCtx;
      playbackTimeRef.current = audioCtx.currentTime;
      await audioCtx.audioWorklet.addModule("/pcm-processor.js");
      const source = audioCtx.createMediaStreamSource(stream);
      const micAnalyser = audioCtx.createAnalyser();
      micAnalyser.fftSize = 256;
      micAnalyserRef.current = micAnalyser;
      const playAnalyser = audioCtx.createAnalyser();
      playAnalyser.fftSize = 256;
      playAnalyserRef.current = playAnalyser;
      playAnalyser.connect(audioCtx.destination);
      const worklet = new AudioWorkletNode(audioCtx, "pcm-processor", {
        processorOptions: {
          inputSampleRate: audioCtx.sampleRate,
          targetSampleRate: 24000,
        },
      });
      source.connect(micAnalyser);
      source.connect(worklet);

      const wsUrl = new URL("wss://agents.assemblyai.com/v1/ws");
      wsUrl.searchParams.set("token", tokenPayload.token);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      let ready = false;

      worklet.port.onmessage = (event) => {
        if (!ready || ws.readyState !== WebSocket.OPEN) return;
        const bytes = new Uint8Array(event.data as ArrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
        ws.send(JSON.stringify({ type: "input.audio", audio: btoa(binary) }));
      };

      ws.addEventListener("open", () => {
        ws.send(JSON.stringify(tokenPayload.sessionConfig));
      });

      ws.addEventListener("message", (event) => {
        const msg = JSON.parse(event.data as string) as {
          type?: string;
          status?: string;
          data?: string;
          message?: string;
          text?: string;
          transcript?: string;
          session_id?: string;
          sessionId?: string;
          name?: string;
          call_id?: string;
          tool_call_id?: string;
          arguments?: unknown;
          turn?: { transcript?: string };
        };
        readTurn(msg);
        if (msg.type === "session.ready") {
          ready = true;
          const sessionId = msg.session_id || msg.sessionId || null;
          assemblySessionIdRef.current = sessionId;
          const callId = callIdRef.current;
          const transcriptToken = transcriptTokenRef.current;
          if (sessionId && callId && transcriptToken) {
            void fetch("/api/voice/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                callId,
                transcriptToken,
                assemblySessionId: sessionId,
              }),
            }).catch(() => undefined);
          }
          setVoice("listening");
        } else if (msg.type === "reply.audio" && msg.data) {
          setVoice("speaking");
          playPcm(msg.data, audioCtx);
        } else if (msg.type === "tool.call") {
          handleToolCall(msg, ws);
        } else if (msg.type === "input.speech.started") {
          lastWsEventRef.current = msg.type;
          if (voiceRef.current === "speaking") {
            flushPlayback();
            setVoice("listening");
            markBargeIn();
          }
        } else if (msg.type === "reply.started") {
          lastWsEventRef.current = msg.type;
        } else if (msg.type === "reply.done" && msg.status === "interrupted") {
          lastWsEventRef.current = msg.type;
          pendingToolResults.current = [];
          flushPlayback();
          setVoice("listening");
          markBargeIn();
        } else if (msg.type === "reply.done") {
          lastWsEventRef.current = msg.type;
          if (msg.transcript || msg.text) saveTurn("agent", msg.transcript || msg.text || "");
          setVoice("listening");
          void flushToolsIfIdle(ws);
        } else if (msg.type === "session.ended") {
          sessionEndedRef.current = true;
          void finish("session");
        } else if (msg.type === "session.error" || msg.type === "error") {
          setError(msg.message || "The voice session failed.");
          sessionEndedRef.current = true;
          void finish("session");
        }
      });

      ws.addEventListener("close", () => {
        sessionEndedRef.current = true;
        void finish("session");
      });

      setStep("call");
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission denied. Allow the mic and retry."
          : err instanceof Error
            ? err.message
            : "Could not start the call.";
      setError(message);
      await teardown(true);
      endingRef.current = false;
    }
  }

  function playPcm(b64: string, audioCtx: AudioContext) {
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
    const playAnalyser = playAnalyserRef.current;
    if (playAnalyser) src.connect(playAnalyser);
    else src.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    playbackTimeRef.current = Math.max(playbackTimeRef.current, now);
    src.start(playbackTimeRef.current);
    playbackTimeRef.current += buffer.duration;
    sourcesRef.current.push(src);
    src.onended = () => {
      sourcesRef.current = sourcesRef.current.filter((item) => item !== src);
    };
  }

  async function finish(reason: "user" | "timer" | "session" = "user") {
    if (reason === "timer" && !sessionEndedRef.current && (toolsInFlightRef.current > 0 || pendingToolResults.current.length > 0)) {
      waitingOnToolsRef.current = true;
      return;
    }
    if (step === "ended") return;
    await teardown(true);
    setVoice("idle");
    setLevel(0);
    setStep("ended");
  }

  useEffect(() => {
    if (step !== "call") return;
    const data = new Uint8Array(256);
    let raf = 0;
    let live = true;

    function sample() {
      const speaking = voiceRef.current === "speaking";
      const analyser = speaking ? playAnalyserRef.current : micAnalyserRef.current;
      if (analyser) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const n = ((data[i] ?? 128) - 128) / 128;
          sum += n * n;
        }
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 3.2));
      } else {
        setLevel(0);
      }
      if (live) raf = window.requestAnimationFrame(sample);
    }

    raf = window.requestAnimationFrame(sample);
    return () => {
      live = false;
      window.cancelAnimationFrame(raf);
    };
  }, [step]);

  useEffect(() => {
    if (step !== "call") return;
    const id = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          void finish("timer");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step === "ended") {
    return (
      <div className="mt-10 text-center">
        <p className="text-[22px] font-medium">Call ended.</p>
        {error && <p className="mt-3 text-[14px] text-danger">{error}</p>}
        <div className="mt-6">
          <MagneticButton
            onClick={() => {
              endingRef.current = false;
              setError("");
              setStep("form");
            }}
          >
            Retry
          </MagneticButton>
        </div>
      </div>
    );
  }

  if (step === "call") {
    const indicator =
      voice === "speaking" ? "Speaking" : voice === "listening" ? "Listening" : "Connecting";
    return (
      <div className="mt-10 flex flex-col items-center text-center">
        <VoiceOrb
          size={220}
          state={voice === "idle" ? "thinking" : voice}
          level={level}
          name={fullName.split(" ")[0] || "Voice agent"}
        />
        <p className="mt-6 font-mono text-[28px] tabular-nums">{formatCallClock(remaining)}</p>
        <p className="mt-2 text-[15px] text-muted">{indicator}</p>
        {voice === "speaking" ? (
          <p className="mt-2 max-w-sm text-[13px] text-ink">
            Talk over them to cut them off. Watch the voice stop mid-sentence.
          </p>
        ) : null}
        {bargeInFlash ? (
          <p className="mt-2 rounded-full border border-border bg-subtle px-3 py-1 font-mono text-[12px] text-navy">
            Interrupted · reply.done
          </p>
        ) : null}
        {captions.length > 0 ? (
          <ul className="mt-6 w-full max-w-md space-y-2 text-left text-[13px]">
            {captions.map((line, index) => (
              <li key={`${line.speaker}-${index}`}>
                <span className="font-medium">{line.speaker === "visitor" ? "Visitor" : "Agent"}:</span>{" "}
                <span className="text-muted">{line.text}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-8">
          <MagneticButton variant="secondary" onClick={() => void finish("user")}>
            End call
          </MagneticButton>
        </div>
      </div>
    );
  }

  return (
    <form
      className="relative mx-auto mt-10 w-full max-w-md space-y-5 text-left"
      onSubmit={(event) => {
        event.preventDefault();
        void startCall();
      }}
    >
      <p className="text-center text-[15px] text-muted">
        You&apos;re talking to an AI. Talk over it to interrupt. Calls last 5 minutes and may be recorded.
      </p>
      <Field
        label="Name"
        name="caller_name"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={80}
      />
      <Field
        label="Purpose"
        name="caller_purpose"
        autoComplete="off"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        required
        maxLength={200}
      />
      <Field
        label="Email"
        name="caller_email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        maxLength={120}
      />
      {error && <p className="text-[14px] text-danger">{error}</p>}
      <MagneticButton type="submit" arrow className="w-full">
        Start call
      </MagneticButton>
      <p className="text-center text-[13px] text-muted">
        {fullName}
        {headline ? ` · ${headline}` : ""}
      </p>
      <p className="text-center text-[13px] text-muted">{greeting}</p>
    </form>
  );
}
