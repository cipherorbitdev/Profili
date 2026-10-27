# Real-Time Voice Streaming & Agent Pipeline

This document details the engineering specifications of Profili's low-latency audio capture, streaming Web Audio Worklet architecture, AssemblyAI Realtime Agents integration, in-call tool calling, and anti-abuse safeguards.

---

## 1. Web Audio Worklet Pipeline (`pcm-processor.js`)

Real-time audio processing occurs in a dedicated browser audio thread isolated from main thread rendering to prevent audio dropouts, stutter, or UI blocking.

```mermaid
flowchart LR
    Mic["Microphone Input (getUserMedia)"] --> Source["MediaStreamAudioSourceNode"]
    Source --> MicAnalyser["AnalyserNode (FFT 256, Visualizer)"]
    Source --> Worklet["AudioWorkletNode: pcm-processor"]
    Worklet -->|Int16Array PCM via MessagePort| MainThread["Main UI Thread (public-voice-call.tsx)"]
    MainThread -->|Base64 JSON over WebSocket| AssemblyAI["AssemblyAI Agents API"]

    AssemblyAI -->|output.audio (Base64 PCM)| MainThread
    MainThread --> AudioBuffer["AudioBuffer (24kHz Mono)"]
    AudioBuffer --> PlaySource["AudioBufferSourceNode"]
    PlaySource --> PlayAnalyser["AnalyserNode (FFT 256, Visualizer)"]
    PlayAnalyser --> Destination["AudioContext.destination (Speakers)"]
```

### 1.1 Audio Worklet Resampling Algorithm
The browser audio thread executes [`public/pcm-processor.js`](public/pcm-processor.js), which downsamples the hardware sampling rate (typically 44.1kHz or 48kHz) down to the target 24kHz required by AssemblyAI:

```javascript
class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = options.processorOptions || {};
    const inputSampleRate = opts.inputSampleRate || sampleRate;
    const targetSampleRate = opts.targetSampleRate || 24000;
    this.ratio = inputSampleRate / targetSampleRate;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    const outLength = Math.max(1, Math.floor(input.length / this.ratio));
    const pcm16 = new Int16Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const sample = input[Math.min(input.length - 1, Math.floor(i * this.ratio))] ?? 0;
      pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    }
    this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    return true;
  }
}
registerProcessor("pcm-processor", PCMProcessor);
```

### 1.2 Audio Pipeline Specifications
- **Input Channels:** 1 (Mono).
- **Echo Cancellation:** `echoCancellation: true` enforced on `navigator.mediaDevices.getUserMedia`.
- **Noise Suppression:** Disabled (`noiseSuppression: false`) to prevent clipping quiet consonants and vocal dynamics.
- **Sample Bit Depth:** 16-bit signed integer linear PCM (`Int16Array`), normalized between `-32768` and `+32767`.
- **Transfer Strategy:** Zero-copy ArrayBuffer transfer over `MessagePort.postMessage(buffer, [buffer])`.
- **Playback Scheduling:** Incoming PCM frames are converted to `AudioBuffer` and queued onto a monotonic timeline (`playbackTimeRef`) with seamless cross-fading to prevent audio artifacts.

---

## 2. AssemblyAI Realtime Agent Architecture

Profili integrates directly with the [AssemblyAI Realtime Agents API](https://www.assemblyai.com/docs/voice-agents).

### 2.1 Token Issuance Protocol
Before a WebSocket connection is established, the browser calls [`POST /api/voice/token`](app/api/voice/token/route.ts). The server mints an ephemeral bearer token via [`mintAssemblyToken`](lib/voice/assembly-token.ts) targeting `https://agents.assemblyai.com/v1/token`:
```typescript
export async function mintAssemblyToken(
  apiKey: string,
  maxSessionSeconds: number[], // [320, 300]
  expiresInSeconds = 60,
)
```
- **Token Expiration:** 60 seconds (ephemeral hand-off to the browser).
- **Session Duration Cap:** The minting service attempts to reserve a 320-second session (`ASSEMBLY_MAX_SESSION_SECONDS`), falling back to 300 seconds (`CALL_SECONDS`) if higher quota bands are constrained.

### 2.2 WebSocket Event Contract
The client connects to `wss://agents.assemblyai.com/v1/ws?token=${token}` and manages the following event loop:

| Event Type | Direction | Payload Structure / Action |
| :--- | :--- | :--- |
| `session.update` | Client $\to$ AssemblyAI | Dispatches dynamic session configuration (prompt, voice, greeting, tools). |
| `session.ready` | AssemblyAI $\to$ Client | Returns `session_id`. Client posts ID to `/api/voice/session` to link database call records. |
| `input.audio` | Client $\to$ AssemblyAI | `{ "type": "input.audio", "audio": base64(pcmBytes) }` |
| `output.audio` | AssemblyAI $\to$ Client | `{ "type": "output.audio", "audio": base64(pcmBytes) }`. Decoded into Web Audio buffers. |
| `transcript.user` | AssemblyAI $\to$ Client | Live transcript of visitor speech; forwarded to `/api/voice/transcript`. |
| `transcript.agent`| AssemblyAI $\to$ Client | Live transcript of agent speech; forwarded to `/api/voice/transcript`. |
| `tool.call` | AssemblyAI $\to$ Client | Model triggers registered function (`leave_message_for_owner`). |
| `tool.result` | Client $\to$ AssemblyAI | Returns tool execution status and prompt instructions to agent. |
| `barge_in` | AssemblyAI $\to$ Client | Visitor interrupted the agent; triggers instant audio buffer flush and visual cue. |
| `reply.done` | AssemblyAI $\to$ Client | Agent finished turn; triggers flushing of any buffered in-flight tool results. |

### 2.3 Interruption & Barge-in Handling
When the visitor speaks while the agent is actively talking:
1. AssemblyAI detects incoming speech energy and transmits a `barge_in` event.
2. The browser immediately calls `flushPlayback()`:
   ```typescript
   sourcesRef.current.forEach((source) => {
     try { source.stop(); } catch {}
   });
   sourcesRef.current = [];
   playbackTimeRef.current = ctxRef.current.currentTime;
   ```
3. A visual ripple state (`bargeInFlash`) activates on the [`VoiceOrb`](components/ui/voice-orb.tsx) component for 2.8 seconds, visually acknowledging the interruption to the visitor.

---

## 3. Voice Agent Calibration & Tone Mapping

Candidate profiles are translated into AssemblyAI system instructions and speech models via [`lib/voice/session-config.ts`](lib/voice/session-config.ts).

### 3.1 Curated Voice Model Catalog
The platform provides 9 curated voice models configured in [`lib/voice/assembly-voices.ts`](lib/voice/assembly-voices.ts):

| Voice ID | Display Label | Vibe | Accent | Gender | Acoustic Characteristics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `charles` | Charles | Formal | British | M | Measured, deliberate boardroom pace. |
| `michael` | Michael | Formal | American | M | Clear, composed corporate cadence. |
| `vera` | Vera | Formal | British | F | Precise, unhurried executive delivery. |
| `alba` | Alba *(Default)* | Casual | American | F | Warm, approachable everyday tone. |
| `jane` | Jane | Casual | American | F | Friendly, balanced vocal presence. |
| `jean` | Jean | Casual | American | M | Relaxed, conversational tone. |
| `eve` | Eve | Energetic | American | F | Bright, forward-leaning startup pace. |
| `george` | George | Energetic | American | M | Upbeat, direct communication style. |
| `anna` | Anna | Energetic | British | F | Crisp, lively technical delivery. |

### 3.2 Dynamic Prompt Assembly & Guardrails
The agent's system prompt is assembled at call time based on candidate settings:
- **Tone Calibration:** Formality ($0.0 \dots 1.0$) and Verbosity ($0.0 \dots 1.0$) scalars:
  - Formality: $<0.4 \implies$ `"more formal"`; $>0.6 \implies$ `"more casual"`; else `"balanced"`.
  - Verbosity: $<0.4 \implies$ `"concise"`; $>0.6 \implies$ `"conversational"`; else `"moderate"`.
- **Hallucination Fence:**
  ```text
  You are the AI representative of {fullName}.
  Speak in a {personality} tone. Sound {formality} and {verbosity}.
  Answer ONLY from the PROFILE block. If something isn't there, say you don't know and suggest contacting them directly.
  Address the visitor by name. The call lasts 5 minutes. Answer in a few spoken sentences, no lists or markdown.
  Offer a follow-up tool when it fits, and wrap up around 4.5 minutes if they are still talking.
  ```
- **Vocabulary Boosting (Keyterms):** [`keytermsFromProfile`](lib/voice/session-config.ts) extracts up to 80 high-value technical terms, company names, titles, and institutions from the candidate's verified profile to boost speech recognition accuracy.

---

## 4. In-Call Tool Calling Framework

The agent has access to native function calling tools during the conversation.

### 4.1 Tool Specification: `leave_message_for_owner`
Declared in [`lib/voice/tools.ts`](lib/voice/tools.ts):
```json
{
  "type": "function",
  "name": "leave_message_for_owner",
  "description": "Save a short message for {fullName}. Call only after the visitor clearly says they want to leave a message. Repeat the message back briefly and wait for confirmation before calling.",
  "parameters": {
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "minLength": 1,
        "maxLength": 500,
        "description": "The confirmed message in the visitor's words, 1-500 characters."
      },
      "intent": {
        "type": "string",
        "enum": ["job_opportunity", "question", "introduction", "other"],
        "description": "Closest purpose."
      }
    },
    "required": ["message"],
    "additionalProperties": false
  },
  "execution_mode": "interactive",
  "timeout_seconds": 15,
  "response_instructions": {
    "success": "Confirm the message was saved in one short sentence. Do not read it back again.",
    "error": "Say you could not save it and suggest they email the owner."
  }
}
```

### 4.2 Client Execution Lifecycle
1. When AssemblyAI returns `tool.call`, the browser executes `runToolCall(event)`.
2. A request is dispatched to [`POST /api/voice/tool`](app/api/voice/tool/route.ts) with an `AbortController` timeout of 4000ms.
3. Upon receiving `{ ok: true, message: "Saved. Jane will get it by email." }`, the client constructs the `tool.result` payload via [`buildToolResult`](lib/voice/tool-result.ts):
   ```json
   {
     "type": "tool.result",
     "call_id": "call-uuid",
     "result": "{\"ok\":true,\"message\":\"Saved. Jane will get it by email.\"}"
   }
   ```
4. The result is transmitted back across the WebSocket to AssemblyAI, prompting the agent to speak the confirmation sentence.

---

## 5. Anti-Abuse, Rate Limiting & Lifecycle Clocks

Voice AI platforms face severe financial and quota risks from automated bot abuse or stranded sessions. Profili enforces defense-in-depth across the calling lifecycle:

```mermaid
flowchart TD
    Init["Call Request (POST /api/voice/token)"] --> Hashing["Hash Client IP (SHA-256)"]
    Hashing --> RateCheck{"Check Hourly Buckets (call_rate_buckets)"}
    RateCheck -->|Count >= 5 (Email or IP)| Reject429["429 Too Many Requests"]
    RateCheck -->|Count < 5| Mint["Mint 60s Token & Return Config"]

    Mint --> CallStart["Call Active (T = 0s)"]
    CallStart --> WrapUp["T = 270s: Agent Prompt Injects Wrap-up Warning"]
    WrapUp --> HardCap["T = 300s: Hard Timer Reached (CALL_SECONDS)"]
    HardCap --> Disconnect["Client Closes WS & Teardowns AudioContext"]

    CallStart -.-> InngestTimeout["Inngest: closeOpenCallJob (T = 390s)"]
    InngestTimeout --> CheckDB{"Is call still open in DB?"}
    CheckDB -->|Yes (Zombie Call)| AutoClose["Set ended_at = started_at + 300s & Emit call.ended"]
    CheckDB -->|No (Cleanly Ended)| TerminateWatcher["Skip - Call already processed"]
```

### 5.1 Call Window Timers
Configured in [`lib/voice/call-window.ts`](lib/voice/call-window.ts):
- `CALL_SECONDS = 300`: Hard call limit (5 minutes).
- `CALL_WRAP_SECONDS = 270`: At 4 minutes 30 seconds, the agent is instructed to wrap up and suggest next steps.
- `ASSEMBLY_MAX_SESSION_SECONDS = 320`: Upstream session timeout allocated at the AssemblyAI token layer.
- `STALE_CALL_GRACE_MS = 90000`: 90-second grace window after call cap before Inngest declares the session abandoned.

### 5.2 Atomic Sliding-Window Rate Limiting
To eliminate race conditions, rate limiting uses atomic PostgreSQL upserts in [`lib/voice/rate-limit.ts`](lib/voice/rate-limit.ts):
```sql
INSERT INTO call_rate_buckets (kind, bucket_key, window_start, n)
VALUES ($kind, $key, date_trunc('hour', now()), 1)
ON CONFLICT (kind, bucket_key, window_start)
DO UPDATE SET n = call_rate_buckets.n + 1
WHERE call_rate_buckets.n < 5
RETURNING n;
```
If the counter reaches 5 calls within the current hour, the query returns 0 rows and the endpoint returns `429 Too Many Requests`.
