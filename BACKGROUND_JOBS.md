# Background Workflows & Asynchronous Orchestration

This document details the background job architecture of Profili. All background workflows, durable sleep cycles, multi-step state machines, and retry policies are driven by the [Inngest Workflow Engine](https://www.inngest.com) via the serverless webhook at [`app/api/inngest/route.ts`](app/api/inngest/route.ts).

---

## 1. Inngest Architecture & Registered Functions

Profili organizes background work into four specialized durable functions located in [`lib/inngest/`](lib/inngest/):

```mermaid
flowchart TD
    subgraph EventStream["Inngest Event Bus"]
        E1["resume.uploaded"]
        E2["call.started"]
        E3["call.ended"]
        E4["message.left"]
    end

    subgraph DurableJobs["Inngest Functions"]
        J1["parse-resume (parseResumeJob)"]
        J2["close-open-call (closeOpenCallJob)"]
        J3["finalize-call (finalizeCallJob)"]
        J4["notify-owner-message (notifyMessageJob)"]
    end

    subgraph ExternalExec["Work Execution & External APIs"]
        SupabaseStorage["Download PDF from Supabase Storage"]
        Unpdf["Extract Text via unpdf"]
        GeminiFlash["Gemini Flash (Resume Extraction / Insights)"]
        AssemblyAI["AssemblyAI API (Poll Session Timeline)"]
        ResendEmail["Resend API (Transactional Notification)"]
        PostgresDB[("PostgreSQL Database (Drizzle ORM)")]
    end

    E1 --> J1
    E2 --> J2
    E3 --> J3
    E4 --> J4

    J1 --> SupabaseStorage --> Unpdf --> GeminiFlash --> PostgresDB
    J2 -.->|Cancel If Call Ended| J3
    J2 -->|Timeout Reached| PostgresDB
    J2 -->|Timeout Auto-Close| E3
    J3 --> AssemblyAI --> PostgresDB
    J3 --> GeminiFlash --> PostgresDB
    J4 --> ResendEmail --> PostgresDB
```

---

## 2. Deep-Dive: Function Specifications

### 2.1 `finalize-call` (`finalizeCallJob`)
Handles session reconciliation, timeline extraction, transcript archiving, and post-call evaluation once a voice call concludes.

- **File Path:** [`lib/inngest/finalize-call.ts`](lib/inngest/finalize-call.ts)
- **Trigger Event:** `call.ended`
- **Retries:** 5
- **Concurrency:**
  - `key: "event.data.callId"`, limit: `1` (strict serialization per call).
  - Global limit: `2` (prevents LLM rate exhaustion).
- **Execution Steps:**
  1. `step.run("claim-call")`: Reads current `calls` record. If `insight_status === 'ready'`, skips execution to ensure idempotency. Sets `insight_status = 'processing'` and increments `insight_attempts`.
  2. `read-session-id-0..7`: Polls the database up to 8 iterations with a `step.sleep("wait-session-*", "2s")` to allow client-side WebSocket handshake data (`assemblySessionId`) to settle.
  3. `fetch-timeline-0..5`: Polls AssemblyAI's timeline endpoint (`GET /v1/sessions/{id}/timeline`) up to 6 times with 2-second sleep intervals until the session timeline status resolves to `ready`.
  4. `step.run("upsert-assembly-timeline")`: Clears initial live-caption draft turns and bulk-inserts authoritative speaker turns in chunks of 80 into `transcript_turns`.
  5. `step.run("gemini-insights")`: Triggers [`generateCallInsights(callId)`](lib/voice/insights.ts).
- **Failure Recovery:** If all retries fail, `onFailure` updates `calls.insight_status = 'failed'` and logs structured diagnostics.

---

### 2.2 `close-open-call` (`closeOpenCallJob`)
A resilient watchdog for orphaned or abruptly dropped voice calls (e.g., visitor closed browser tab, lost internet connection, or device died without firing `POST /api/voice/end` or `sendBeacon`).

- **File Path:** [`lib/inngest/finalize-call.ts`](lib/inngest/finalize-call.ts)
- **Trigger Event:** `call.started`
- **Retries:** 2
- **Durable Cancellation:** Configured with `cancelOn: [{ event: EVENT_CALL_ENDED, match: "data.callId" }]`. If a clean `call.ended` event arrives while the timer is running, Inngest immediately cancels this job.
- **Sleep Duration:** Exactly 390 seconds (`CALL_SECONDS` [300s] + `STALE_CALL_GRACE_MS` [90s]).
- **Execution Steps:**
  1. `step.sleep("wait-call-window", "390s")`: Suspends execution without consuming server resources.
  2. `step.run("close-if-open")`: Queries `calls`. If `ended_at` is already populated, returns `false`. If still open, sets:
     - `ended_at = started_at + 300s`
     - `duration_seconds = 300`
     - `insight_status = 'pending'`
  3. `step.run("emit-call-ended")`: If closed by watchdog, dispatches `call.ended` to trigger `finalizeCallJob`.

---

### 2.3 Post-Call Intelligence (`generateCallInsights`)
Invoked by step `gemini-insights` in `finalizeCallJob` or manually through [`POST /api/voice/insights/retry`](app/api/voice/insights/retry/route.ts).

- **File Path:** [`lib/voice/insights.ts`](lib/voice/insights.ts)
- **Model Hierarchy:** Evaluates sequentially across `gemini-3.8-flash`, `gemini-3.7-flash`, and `gemini-3.1-flash-lite`.
- **System Instruction Constraints:**
  - Conversations and visitor messages are treated strictly as untrusted data, never as prompt instructions.
  - Intent classification requires dynamic synthesis (e.g., *Hiring screen*, *Peer deep-dive*, *Founder intro*, *Customer question*); hardcoded option pickers are forbidden.
  - Scores are integers bounded between 0 and 100.
  - Citations must point to specific resume bullet points or output `"Spoken only"`.
- **JSON Schema Output (`callInsightSchema`):**
  ```typescript
  interface CallInsightResult {
    intent: string; // Dynamic 1-48 char label
    query: string; // Visitor's main question in 1 sentence
    summary: string; // 2-4 sentence synthesis
    citation: string; // Resume anchor pointer
    grounded: number; // 0-100 adherence to resume facts
    tone: number; // 0-100 communication score
    fit: number; // 0-100 role/interest alignment
    tone_label: string; // e.g., "High", "Composed"
    fit_label: string; // e.g., "Strong match", "Moderate"
  }
  ```
- **Database Write:** Upon completion, sets `calls.insight_status = 'ready'` and updates all `insight_*` fields.

---

### 2.4 `notify-owner-message` (`notifyMessageJob`)
Processes offline notifications when a visitor leaves a confirmed message during a voice call.

- **File Path:** [`lib/inngest/notify-message.ts`](lib/inngest/notify-message.ts)
- **Trigger Event:** `message.left`
- **Retries:** 3
- **Execution Steps:**
  1. `step.run("send-owner-email")`: Joins `messages`, `profiles`, and `users` to fetch message content, visitor email, and candidate recipient details.
  2. Dispatches plain-text email via [`sendOwnerMessageEmail`](lib/voice/notify-message.ts) targeting the Resend API (`https://api.resend.com/emails`).
  3. Updates `messages.notified_at = now()`.

---

### 2.5 `parse-resume` (`parseResumeJob`)
Asynchronously ingests uploaded resumes, extracts raw text, executes Gemini structured entity extraction, and saves profile drafts.

- **File Path:** [`lib/inngest/parse-resume.ts`](lib/inngest/parse-resume.ts)
- **Trigger Event:** `resume.uploaded`
- **Retries:** 4
- **Singleton Control:** `singleton: { key: "event.data.profileId", mode: "cancel" }` ensures that if a candidate re-uploads a new PDF while an older parse is in-flight, the older job is cancelled immediately.
- **Concurrency:** Concurrency limit of 1 per profile and 2 global.
- **Execution Steps:**
  1. `step.run("download-pdf")`: Downloads PDF binary from Supabase Storage bucket `resumes` and validates PDF magic bytes (`0x25 0x50 0x44 0x46`).
  2. `step.run("extract-text")`: Extracts text via `unpdf`. Rejects scanned image PDFs lacking text layers.
  3. `step.run("gemini-json")`: Invokes `parseResumeWithLlm` ([`lib/resume/llm.ts`](lib/resume/llm.ts)) to extract structured entities adhering to `profileJsonSchema`.
  4. `step.run("write-draft")`: Updates `profiles` table with extracted full name, default greeting, `profile_json`, and sets `parse_status = 'ready'`.
- **Failure Recovery:** `onFailure` maps technical errors to user-safe messaging (e.g., differentiating between a scanned PDF and temporary Gemini capacity constraints) and updates `profiles.parse_status = 'failed'`.

---

## 3. Failure Handling, Retries & Idempotency Matrix

| Job ID | Trigger Event | Retry Count | Concurrency Controls | Idempotency Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| `parse-resume` | `resume.uploaded` | 4 | 1 per profile / 2 global | Singleton mode `cancel`; checks profile existence before write. |
| `finalize-call` | `call.ended` | 5 | 1 per call / 2 global | `claim-call` step exits early if `insight_status === 'ready'`. |
| `close-open-call`| `call.started` | 2 | None | `cancelOn: call.ended`; database check on `calls.ended_at`. |
| `notify-owner-message` | `message.left` | 3 | Default | Verifies `messages.notified_at IS NULL` before dispatching email. |

---

## 4. Local Development with Inngest Dev Server

To test and execute background workflows locally without deploying webhooks to the public internet:

```bash
# Terminal 1: Run the Next.js development server
pnpm dev

# Terminal 2: Start the Inngest local dev server connected to Next.js
pnpm inngest:dev
```
The Inngest Dev Server runs at `http://127.0.0.1:8288` providing a visual dashboard to inspect event payloads, view step execution timelines, and trigger manual event replays.
