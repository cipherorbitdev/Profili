# System Architecture & Component Design

This document details the software architecture, component relationships, and communication protocols of Profili. It provides a formal design reference for the platform's multi-tier system topology, end-to-end call lifecycle, and asynchronous event streams.

---

## 1. High-Level System Topology

Profili operates across three main tiers: the **Client Browser Runtime**, the **Next.js Application Server** (hosting App Router React Server Components and Route Handlers), and a distributed layer of **Managed Infrastructure & AI Services** (Supabase, AssemblyAI, Google Gemini, and Inngest).

```mermaid
flowchart TB
    subgraph ClientBrowser["Client Browser Runtime"]
        UI["Next.js React 19 UI (Framer Motion / Tailwind)"]
        AudioContext["Web Audio API (AudioContext)"]
        Worklet["AudioWorklet: pcm-processor.js (24kHz Resampling)"]
        WSClient["WebSocket Client (Bidirectional Audio & Events)"]
        Beacon["Navigator sendBeacon / Fetch Client"]
        Embed["public/embed.js (External Host Iframe)"]
    end

    subgraph NextServer["Next.js 16 Application Server"]
        AuthMiddleware["Auth & Session Layer (lib/supabase/server.ts)"]
        APIVoice["Voice Route Handlers (app/api/voice/*)"]
        APIResume["Resume Route Handlers (app/api/resume/*)"]
        APIAuth["Auth Route Handlers (app/api/auth/*)"]
        InngestServe["Inngest Webhook Endpoint (app/api/inngest/route.ts)"]
        DrizzleClient["Drizzle ORM Engine (lib/db/client.ts)"]
    end

    subgraph SupabasePlatform["Supabase Infrastructure"]
        PostgresDB[("PostgreSQL Database (lib/db/schema.ts)")]
        RLSEngine["PostgreSQL Row-Level Security & Triggers"]
        SupabaseAuth["Supabase GoTrue Auth Service"]
        StorageBucket["Supabase Storage (resumes bucket)"]
    end

    subgraph ExternalServices["External Cloud & AI Services"]
        AssemblyAI["AssemblyAI Realtime Agents API (agents.assemblyai.com)"]
        GeminiAPI["Google Gemini Flash API (generativelanguage.googleapis.com)"]
        InngestCloud["Inngest Event Orchestrator (inngest.com)"]
        ResendAPI["Resend Email Service (api.resend.com)"]
    end

    %% Client Interactions
    Embed --> UI
    UI --> AudioContext
    AudioContext --> Worklet
    Worklet --> WSClient
    WSClient <-->|WSS 16-bit PCM Audio & Tool Events| AssemblyAI
    Beacon -->|POST /api/voice/end| APIVoice
    UI -->|POST /api/voice/token| APIVoice
    UI -->|POST /api/voice/tool| APIVoice
    UI -->|POST /api/resume/parse| APIResume

    %% Server Interactions
    APIVoice -->|Mint Ephemeral Token| AssemblyAI
    APIVoice -->|Take Rate Slot & Log Call| DrizzleClient
    APIResume -->|Verify Token & Ownership| AuthMiddleware
    AuthMiddleware <--> SupabaseAuth
    DrizzleClient <--> PostgresDB
    APIResume --> StorageBucket
    APIResume -->|Emit resume.uploaded| InngestServe
    APIVoice -->|Emit call.started / call.ended| InngestServe

    %% Background Orchestration
    InngestServe <-->|Execute Step Functions| InngestCloud
    InngestCloud -->|Poll Session Timeline| AssemblyAI
    InngestCloud -->|Extract & Score Calls| GeminiAPI
    InngestCloud -->|Dispatch Visitor Alerts| ResendAPI
    InngestCloud -->|Update Transcripts & Insights| DrizzleClient

    %% Database Protection
    PostgresDB --- RLSEngine
```

---

## 2. End-to-End Call Lifecycle Sequence

The sequence diagram below traces the complete lifecycle of a public voice interaction, from initial visitor form submission to real-time audio conversation, in-call tool calling, termination, and post-call intelligence generation.

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Visitor (Browser)
    participant Worklet as AudioWorklet (pcm-processor.js)
    participant NextAPI as Next.js API (/api/voice/*)
    participant DB as PostgreSQL (Drizzle ORM)
    participant Assembly as AssemblyAI Agents API
    participant Inngest as Inngest Engine
    participant Gemini as Google Gemini Flash
    participant Resend as Resend API

    %% Phase 1: Initialization
    Note over Visitor,NextAPI: 1. Session Handshake & Rate Limiting
    Visitor->>NextAPI: POST /api/voice/token { slug, visitor: { name, purpose, email } }
    NextAPI->>DB: Query published profile by slug
    NextAPI->>DB: Check & increment hourly call_rate_buckets (email, IP)
    NextAPI->>DB: INSERT into calls (visitor details, transcript_token)
    NextAPI->>Assembly: GET https://agents.assemblyai.com/v1/token
    Assembly-->>NextAPI: Return ephemeral session token
    NextAPI->>NextAPI: buildVoiceSessionConfig(profileJson, visitor, tools)
    NextAPI->>Inngest: Emit call.started { callId }
    NextAPI-->>Visitor: Return { token, callId, transcriptToken, sessionConfig }

    %% Phase 2: Realtime Audio Stream
    Note over Visitor,Assembly: 2. Bidirectional Streaming & Audio Processing
    Visitor->>Worklet: Initialize AudioContext & capture mic stream (24kHz downsample)
    Visitor->>Assembly: Open WebSocket: wss://agents.assemblyai.com/v1/ws?token=...
    Assembly-->>Visitor: WebSocket open
    Visitor->>Assembly: Send { type: "session.update", session: sessionConfig }
    Assembly-->>Visitor: Receive { type: "session.ready", session_id }
    Visitor->>NextAPI: POST /api/voice/session { callId, transcriptToken, assemblySessionId }
    NextAPI->>DB: UPDATE calls SET assembly_session_id

    loop Bidirectional Audio Loop
        Worklet->>Visitor: Int16Array PCM buffer via MessagePort
        Visitor->>Assembly: Send { type: "input.audio", audio: base64(pcm) }
        Assembly-->>Visitor: Stream { type: "output.audio", audio: base64(pcm) }
        Visitor->>Visitor: Schedule Web Audio playback via AudioBufferSourceNode
        Assembly-->>Visitor: Stream { type: "transcript.agent" / "transcript.user" }
        Visitor->>NextAPI: POST /api/voice/transcript { callId, transcriptToken, seq, speaker, text }
        NextAPI->>DB: UPSERT into transcript_turns (call_id, seq)
    end

    %% Phase 3: Tool Execution
    Note over Visitor,Assembly: 3. In-Call Tool Execution (leave_message_for_owner)
    Visitor->>Assembly: Visitor says: "Please tell Sarah to call me regarding the staff engineer role"
    Assembly-->>Visitor: Receive { type: "tool.call", name: "leave_message_for_owner", arguments }
    Visitor->>NextAPI: POST /api/voice/tool { callId, transcriptToken, name, arguments }
    NextAPI->>DB: Verify call & rate limit (tool-ip, tool-call)
    NextAPI->>DB: INSERT into messages (call_id, profile_id, body, intent, visitor details)
    NextAPI->>Inngest: Emit message.left { messageId }
    NextAPI-->>Visitor: Return { ok: true, message: "Saved. Sarah will get it by email." }
    Visitor->>Assembly: Send { type: "tool.result", call_id, result: "..." }
    Assembly-->>Visitor: Agent speaks: "I've passed your note along to Sarah."

    %% Phase 4: Session Teardown
    Note over Visitor,Inngest: 4. Call Teardown & Event Emission
    Visitor->>NextAPI: POST /api/voice/end via fetch or sendBeacon
    NextAPI->>DB: UPDATE calls SET ended_at, duration_seconds, insight_status='pending'
    NextAPI->>Inngest: Emit call.ended { callId }
    NextAPI-->>Visitor: Return 200 OK

    %% Phase 5: Asynchronous Intelligence
    Note over Inngest,DB: 5. Background Intelligence & Recruiter Scorecards
    Inngest->>DB: Check call status & set insightStatus='processing'
    Inngest->>Assembly: GET /v1/sessions/{assemblySessionId}/timeline (poll until ready)
    Assembly-->>Inngest: Return full speaker turn timeline
    Inngest->>DB: Batch upsert complete transcript_turns
    Inngest->>Gemini: POST generateContent (structured JSON scorecard prompt)
    Gemini-->>Inngest: Return JSON (intent, summary, citation, fit, tone, groundedness)
    Inngest->>DB: UPDATE calls SET insight_status='ready', insight_* scores
    Inngest->>Resend: (Parallel) Send transactional notification email to profile owner
```

---

## 3. Data Flow Architecture

The platform processes candidate information through three progressive states: **Raw Ingestion**, **Structured Profile Representation**, and **Real-Time Voice Prompt Projection**.

```mermaid
flowchart LR
    subgraph Ingestion["Stage 1: Raw Ingestion"]
        Upload["Candidate PDF Upload"] --> MagicCheck["Magic Byte Validation (%PDF)"]
        MagicCheck --> Unpdf["unpdf Text Extraction"]
        Unpdf --> RegexPii["Regex PII Stripping (Phone, Street)"]
    end

    subgraph Transformation["Stage 2: Structured Representation"]
        RegexPii --> GeminiParse["Gemini 3 Flash (Structured Output)"]
        GeminiParse --> ZodProfile["profileJsonSchema Validation"]
        ZodProfile --> DBStore[("PostgreSQL: profiles.profile_json")]
    end

    subgraph Projection["Stage 3: Voice Projection"]
        DBStore --> ToneConfig["Tone Calibration (Formality, Verbosity, Voice)"]
        ToneConfig --> Keyterms["Keyterm Extraction (Skills, Titles, Orgs)"]
        Keyterms --> SystemPrompt["System Prompt Assembly (lib/voice/session-config.ts)"]
        SystemPrompt --> AssemblySession["AssemblyAI Agent Session Configuration"]
    end
```

### Stage Details

1. **Ingestion & De-identification:**
   - Raw uploaded files are validated in [`lib/resume/sanitize.ts`](lib/resume/sanitize.ts) via `isPdfMagic` checking `0x25 0x50 0x44 0x46`.
   - Text extracted via `extractResumeText` ([`lib/resume/extract.ts`](lib/resume/extract.ts)) undergoes regular expression sanitization through `stripPrivateDetails` to redact street addresses and phone numbers.
2. **Schema-Constrained Generation:**
   - The sanitized plain text is wrapped in defensive delimiters (`RESUME_TEXT_BEGIN` / `RESUME_TEXT_END`) and submitted to Gemini Flash with `responseMimeType: "application/json"` and strict JSON schema enforcement ([`lib/resume/llm.ts`](lib/resume/llm.ts)).
   - Output data conforms to [`ProfileJson`](lib/resume/schema.ts), extracting employment history, education, highlighted accomplishments, skills, and projects.
3. **Voice Prompt Projection:**
   - When a call initializes, [`buildVoiceSessionConfig`](lib/voice/session-config.ts) extracts candidate keyterms (up to 80 terms, truncated to 48 chars each) to boost speech-to-text accuracy.
   - Formality ($0.0 \dots 1.0$) and verbosity ($0.0 \dots 1.0$) scalars are mapped onto explicit behavioral instructions (*more formal*, *balanced*, *more casual*; *concise*, *moderate*, *conversational*).
   - Strict hallucination boundaries are injected: `"Answer ONLY from the PROFILE block. If something isn't there, say you don't know and suggest contacting them directly."`

---

## 4. Subsystem Architecture

### 4.1 Application Layer (`app/`)
- **Route Handlers (`app/api/`):** Pure serverless endpoints handling JSON validation, authentication, rate limiting, and database mutations.
- **Protected App Workspace (`app/app/`):** Server and Client Components managing profile creation, resume reviews, voice calibration, live testing, messages review, and analytical scorecards.
- **Public Interactive Call Screens (`app/participant/[slug]/` & `app/talk/[username]/`):** Public-facing voice interfaces rendering the visualizer, handling Web Audio Worklets, and driving WebSocket communication. Supports iframe isolation with query parameter `?embed=1`.
- **Public Marketing & Pitch Deck (`app/page.tsx`, `app/presentation/`):** Modern presentation showcasing live audio waveform demonstrations, pricing matrices, and a 10-slide architectural deck.

### 4.2 Voice Subsystem (`lib/voice/`)
- **Token Manager (`assembly-token.ts`):** Mints short-lived (60s expiration) AssemblyAI Agent tokens with fallback duration limits (`[320, 300]` seconds).
- **Session Configurator (`session-config.ts`):** Constructs complete AssemblyAI initialization payloads, including tool signatures, voice model mappings, system prompts, and vocabulary boosting keys.
- **Tool Calling Framework (`tools.ts`, `tool-result.ts`, `tool-args.ts`):** Declares function specifications (`leave_message_for_owner`), handles JSON schema checking, and formats `tool.result` responses back into AssemblyAI event structures.
- **Call Timing & Rate Limiting (`call-window.ts`, `rate-limit.ts`, `ip.ts`):** Manages call window caps (`CALL_SECONDS = 300`), wrap-up thresholds (`CALL_WRAP_SECONDS = 270`), SHA-256 IP hashing, and atomic hourly bucket tracking.

### 4.3 Resume Subsystem (`lib/resume/`)
- **Text & PDF Extractor (`extract.ts`):** Integrates `unpdf` to parse PDF structures into raw utf-8 text streams.
- **LLM Pipeline (`llm.ts`):** Orchestrates multi-model failover across `gemini-3.8-flash`, `gemini-3.7-flash`, and `gemini-3.1-flash-lite` with low thinking levels for rapid parsing.
- **Schema & Sanitization (`schema.ts`, `sanitize.ts`):** Houses runtime Zod contracts for profiles, drafts, publish payloads, visitor inputs, and PII filters.
- **Profile Queries (`owner.ts`, `public.ts`):** Segregates database access between authenticated owner queries and public cached reads (`revalidateTag`).

### 4.4 Background Orchestration Subsystem (`lib/inngest/`)
- **Client & Events (`client.ts`, `emit.ts`):** Declares typed Inngest events (`resume.uploaded`, `call.started`, `call.ended`, `message.left`) and safe dispatch wrappers.
- **Call Finalization (`finalize-call.ts`):** Runs multi-step durable workflows: polling AssemblyAI timelines with exponential backoff, bulk-upserting transcript turns, and executing Gemini post-call intelligence.
- **Stale Session Guardian (`closeOpenCallJob` in `finalize-call.ts`):** Durable timeout listener that guarantees calls abandoned without clean beacons are automatically marked closed and analyzed.
- **Visitor Alerts (`notify-message.ts`):** Asynchronous email delivery through Resend notifying candidates of visitor messages.
- **Resume Parsing Worker (`parse-resume.ts`):** Concurrency-limited background pipeline for heavy PDF downloads, extraction, and drafting.

---

## 5. Architectural Boundaries & Data Access Rules

| Layer | Inbound Boundary | Outbound Access | Data Access Constraint |
| :--- | :--- | :--- | :--- |
| **Public Browser UI** | HTTP GET, Public URL | WebSocket (AssemblyAI), `/api/voice/*` | Zero database access; credentials restricted to public anon keys. |
| **API Route Handlers** | HTTP POST / GET | Drizzle ORM, Supabase Auth, AssemblyAI | Enforces authentication via `requireUser()` or session tokens (`transcriptToken`). |
| **Inngest Workers** | Inngest Webhook (`POST /api/inngest`) | PostgreSQL direct (`lib/db/client.ts`), External APIs | Operates as trusted system processes using direct DB connections. |
| **Database (PostgreSQL)** | PostgreSQL Wire Protocol | Drizzle ORM | Row-Level Security restricts unprivileged queries; views protect unpublished drafts. |
