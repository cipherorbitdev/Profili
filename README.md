# Profili — Interactive Voice AI Resume Platform

Profili is an enterprise-grade voice AI platform that transforms traditional static resumes (PDF or plain text) into interactive, conversational voice personas. Recruiter screens, peer technical deep-dives, and hiring manager inquiries can take place in real-time over the web with sub-second latency, grounded strictly in the candidate's verified background and custom-calibrated voice tone.

Following each conversation, an event-driven post-call intelligence pipeline synthesizes the dialogue, classifies visitor intent, verifies resume citations, and computes objective hiring fit and communication scores.

---

## The Problem & Core Differentiators

| Traditional Hiring Artifacts | Profili Voice Agent Platform |
| :--- | :--- |
| **Static & Unidirectional:** Standard 2-page PDFs offer no dynamic interaction or context clarification. | **Live Bidirectional Voice:** Conversational voice AI streaming 16-bit linear PCM over WebSockets via AssemblyAI. |
| **Recruiter Screening Bottleneck:** Scheduling 30-minute introductory phone screens delays hiring velocity. | **Asynchronous Recruiter Interaction:** 24/7 availability with strict 5-minute call windows and immediate hiring scorecards. |
| **Hallucination Risk:** Generic AI agents frequently invent qualifications and hallucinate past employers. | **Grounded Fact Enforcement:** Strict system prompts and Gemini-driven verification restrict answers to verified profile JSON facts. |
| **Contact Friction:** Candidates lose inbound recruiter interest due to back-and-forth email tagging. | **Native In-Call Tool Execution:** Visitors can leave structured, confirmed voice messages dispatched directly to candidate inboxes. |

---

## User Personas & Value Delivery

### 1. Job Candidates & Professionals
- **Instant Agent Generation:** Upload any PDF resume; Gemini 3 Flash extracts work history, education, skills, and projects while stripping PII (phone numbers, street addresses).
- **Tone & Style Calibration:** Customize voice persona from 9 curated AssemblyAI models, adjusting formality and verbosity on a continuous scale alongside bespoke opening greetings.
- **Privacy & Asset Protection:** Unshared drafts remain private behind Supabase Row-Level Security (RLS); resumes are stored in private Supabase buckets accessible only by the owner.
- **Actionable Intelligence:** Review recruiter dialogue transcripts, groundedness ratings, visitor intents, and offline inquiries from a consolidated dashboard.

### 2. Recruiters, Founders & Hiring Managers
- **Low-Barrier Engagement:** No account creation or software installation required; visitors enter their name, email, and purpose to initiate an audio session.
- **Deep Technical Exploration:** Interrogate complex past projects, specific architectural decisions, and tool proficiencies interactively.
- **Barge-in / Interruption Capable:** Natural conversational cadence with real-time echo cancellation and client-side audio ducking.
- **Direct Messaging:** Prompt the candidate's agent to record structured follow-up messages during the call without leaving the audio session.

### 3. Platform Administrators & Engineers
- **Zero-Dependency Portability:** Embed any published agent onto third-party portfolio websites via a lightweight vanilla JavaScript loader (`public/embed.js`).
- **Abuse Prevention:** Hard architectural rate limits (5 calls/hour per IP and email) enforced by atomic PostgreSQL sliding-window counters.
- **Fault-Tolerant Orchestration:** Background tasks execute through Inngest with automatic retries, concurrency throttles, and orphan session cleanup.

---

## Core Feature Deep-Dive

### AI Resume Ingestion & PII Sanitization
Uploaded PDF files are verified against PDF magic bytes (`%PDF` / `0x25 0x50 0x44 0x46`) and parsed using [`unpdf`](https://github.com/unjs/unpdf). Extracted text is stripped of private contact details (phone numbers, physical addresses) via regex sanitation before dispatch to Google Gemini Flash. The model outputs validated JSON adhering to [`profileJsonSchema`](lib/resume/schema.ts) with zero hallucinated dates or employers.

### Real-Time Bidirectional Speech & Web Audio Pipeline
Audio capture operates in the browser using a dedicated [`AudioWorkletProcessor`](public/pcm-processor.js) (`pcm-processor.js`), capturing microphone input, downsampling to 24kHz, and converting Float32 audio samples into 16-bit linear PCM (`Int16Array`). Encoded PCM frames stream over WebSockets directly to AssemblyAI's Realtime Agents API, achieving sub-second voice round trips.

### In-Call Tool Execution (`leave_message_for_owner`)
The voice agent registers native client-side tool calling. When a visitor expresses an intent to interview or message the candidate, AssemblyAI triggers a `tool.call` event for `leave_message_for_owner`. The browser invokes the internal endpoint [`POST /api/voice/tool`](app/api/voice/tool/route.ts), which verifies call tokens, validates arguments, writes to the `messages` table, enqueues an email via Resend, and returns confirmation instructions back to the agent in real time.

### Automated Post-Call Intelligence & Recruiter Scorecards
Upon call completion (signaled via HTTP POST, `navigator.sendBeacon`, or an automated Inngest timeout watcher), [`finalizeCallJob`](lib/inngest/finalize-call.ts) ingests the official AssemblyAI session timeline, populates turn-by-turn transcripts, and invokes Gemini Flash to generate an objective scorecard:
- **Visitor Intent:** Autonomous categorization (e.g., *Hiring screen*, *Founder intro*, *Peer deep-dive*).
- **Core Query & Summary:** Concise 2–4 sentence synthesis of what was asked and how the agent responded.
- **Groundedness Score (0–100):** Proportion of agent responses verified against profile JSON.
- **Tone & Fit Scores (0–100):** Candidate-visitor alignment and communication style metrics.
- **Citation Pointer:** Explicit mapping to resume sections utilized in responses.

### Zero-Dependency Embeddable Widget
A standalone, 25-line embed script ([`public/embed.js`](public/embed.js)) enables candidates to drop their voice agent into personal portfolios or blogs using `<div data-profili-slug="candidate-slug"></div>`. The script mounts a responsive iframe targeting [`/participant/[slug]?embed=1`](app/participant/[slug]/page.tsx) with explicit `microphone; autoplay` permissions.

---

## Technical Highlights & System Constraints

- **Strict Session Limits:** Voice sessions are bounded by a hard cap of 300 seconds (`CALL_SECONDS = 300`), with agent wrap-up guidance starting at 270 seconds (`CALL_WRAP_SECONDS = 270`).
- **Atomic Sliding-Window Rate Limiting:** Calls and tool requests are throttled at the PostgreSQL level using `INSERT ... ON CONFLICT DO UPDATE` over hourly truncated buckets (`call_rate_buckets`), preventing token exhaustion.
- **Orphan Call Recovery:** If a visitor abruptly disconnects or closes their laptop lid, [`closeOpenCallJob`](lib/inngest/finalize-call.ts) wakes up after 390 seconds (300s window + 90s grace period) to finalize the call record and trigger insights generation.
- **Database Immutability Triggers:** PostgreSQL database trigger `messages_freeze_except_read_at` ensures that once visitor messages are written, only the `read_at` timestamp can be modified, preventing tampering with visitor contact records.

---

## Documentation Index

Explore the authoritative engineering documentation suite for in-depth technical specifications:

| Document | Primary Domain |
| :--- | :--- |
| **[System Architecture](ARCHITECTURE.md)** | System topology, Mermaid flowcharts, end-to-end call lifecycle sequence diagrams, and subsystem design. |
| **[API Reference](API_REFERENCE.md)** | Complete specification of all Next.js App Router route handlers, auth requirements, payloads, and error codes. |
| **[Database & Storage](DATABASE.md)** | Drizzle ORM schema, entity-relationship diagrams, data dictionary, PostgreSQL RLS policies, and triggers. |
| **[Voice & Audio Pipeline](VOICE_PIPELINE.md)** | Web Audio Worklet downsampling, AssemblyAI WebSocket protocols, barge-in mechanics, and voice calibration. |
| **[Background Workflows](BACKGROUND_JOBS.md)** | Inngest event orchestration, call finalization, Gemini insights evaluation, retry policies, and concurrency control. |
| **[Security & Authentication](SECURITY_AND_AUTH.md)** | Supabase SSR cookies, PKCE verification, PII redaction heuristics, iframe sandboxing, and threat model. |
| **[Production Deployment](DEPLOYMENT.md)** | Vercel, Supabase, Inngest, and API vendor configuration, environment variable matrices, and migration commands. |
| **[Contributing & Development](CONTRIBUTING.md)** | Local environment setup, test runner commands, coding standards, and pull request procedures. |
