# API Reference & Route Handler Specifications

This document catalogs every serverless Route Handler implemented under [`app/api/`](app/api/) within the Next.js 16 App Router. All endpoints operate with strict runtime validation powered by [Zod](https://zod.dev) and adhere to standard HTTP status conventions.

---

## Table of Contents

- [Authentication Endpoints](#1-authentication-endpoints)
  - [`POST /api/auth/forgot`](#post-apiauthforgot)
  - [`POST /api/auth/complete-reset`](#post-apiauthcomplete-reset)
  - [`POST /api/auth/email-account`](#post-apiauthemail-account)
- [Resume Management Endpoints](#2-resume-management-endpoints)
  - [`POST /api/resume/parse`](#post-apiresumeparse)
  - [`GET /api/resume/profile`](#get-apiresumeprofile)
  - [`PUT /api/resume/profile`](#put-apiresumeprofile)
  - [`DELETE /api/resume/profile`](#delete-apiresumeprofile)
  - [`POST /api/resume/publish`](#post-apiresumepublish)
- [Voice Agent & Call Lifecycle Endpoints](#3-voice-agent--call-lifecycle-endpoints)
  - [`POST /api/voice/token`](#post-apivoicetoken)
  - [`POST /api/voice/session`](#post-apivoicesession)
  - [`POST /api/voice/tool`](#post-apivoicetool)
  - [`GET /api/voice/transcript`](#get-apivoicetranscript)
  - [`POST /api/voice/transcript`](#post-apivoicetranscript)
  - [`POST /api/voice/preview`](#post-apivoicepreview)
  - [`POST /api/voice/end`](#post-apivoiceend)
  - [`GET /api/voice/calls`](#get-apivoicecalls)
  - [`POST /api/voice/insights/retry`](#post-apivoiceinsightsretry)
  - [`GET /api/voice/messages`](#get-apivoicemessages)
  - [`PATCH /api/voice/messages`](#patch-apivoicemessages)
- [Inngest Webhook Endpoint](#4-inngest-webhook-endpoint)
  - [`GET / POST / PUT /api/inngest`](#get--post--put-apiinngest)

---

## 1. Authentication Endpoints

### `POST /api/auth/forgot`
Triggers a password recovery email via Supabase Auth for an unauthenticated user, checking beforehand whether the account is restricted to Google OAuth.

- **File Path:** [`app/api/auth/forgot/route.ts`](app/api/auth/forgot/route.ts)
- **Auth:** Public / Unauthenticated.
- **Rate Limit:** Upstream Supabase Auth rate limits (returns 429 on abuse).
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "candidate@example.com"
  }
  ```
- **Response Payloads:**
  - `200 OK`:
    ```json
    { "ok": true }
    ```
  - `400 Bad Request`: `{ "error": "Enter a valid email." }`
  - `429 Too Many Requests`: `{ "error": "Too many emails just now." }`
  - `503 Service Unavailable`: `{ "error": "Auth is not configured." }`
- **Side Effects:** Dispatches recovery email with PKCE redirect targeting `/auth/callback?next=/reset-password`.

---

### `POST /api/auth/complete-reset`
Clears the temporary password reset session cookie upon successful credential update.

- **File Path:** [`app/api/auth/complete-reset/route.ts`](app/api/auth/complete-reset/route.ts)
- **Auth:** Public / Cookie holder.
- **Request Body:** None.
- **Response Payloads:**
  - `200 OK`:
    ```json
    { "ok": true }
    ```
- **Side Effects:** Sets `Set-Cookie: profili-pw-reset=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`.

---

### `POST /api/auth/email-account`
Queries whether a registered email address is configured exclusively for Google OAuth, guiding the client UI on whether to render password fields.

- **File Path:** [`app/api/auth/email-account/route.ts`](app/api/auth/email-account/route.ts)
- **Auth:** Public.
- **Request Body:**
  ```json
  {
    "email": "candidate@example.com"
  }
  ```
- **Response Payloads:**
  - `200 OK`:
    ```json
    { "googleOnly": true }
    ```
  - `400 Bad Request`: `{ "error": "Invalid email." }`

---

## 2. Resume Management Endpoints

### `POST /api/resume/parse`
Queues an uploaded PDF resume stored in Supabase Storage for asynchronous extraction and Gemini JSON parsing.

- **File Path:** [`app/api/resume/parse/route.ts`](app/api/resume/parse/route.ts)
- **Auth:** Authenticated User via Supabase SSR Session Cookie (`requireUser()`).
- **Request Body Schema (`parseResumeBodySchema`):**
  ```typescript
  interface ParseResumeRequest {
    resume_path: string; // Must match uuid/uuid.pdf and begin with ${userId}/
    profile_id?: string; // Optional UUID if updating an existing profile
  }
  ```
- **Response Payloads:**
  - `202 Accepted`:
    ```json
    {
      "profileId": "8b51d542-a892-4912-870a-0e9e4be0df33",
      "parse_status": "parsing"
    }
    ```
  - `400 Bad Request`: `{ "error": "Invalid resume path." }`
  - `401 Unauthorized`: `{ "error": "Sign in required." }`
  - `403 Forbidden`: `{ "error": "Invalid resume path." }` (path does not begin with user ID)
  - `404 Not Found`: `{ "error": "Agent not found." }`
  - `503 Service Unavailable`: `{ "error": "Could not queue the parse. Retry in a moment." }`
- **Side Effects:** Updates or inserts a row into `profiles` with `parse_status = 'parsing'`; emits Inngest event `resume.uploaded`.

---

### `GET /api/resume/profile`
Fetches all agent profiles belonging to the authenticated user, or a single targeted profile if `?id=` query parameter is supplied.

- **File Path:** [`app/api/resume/profile/route.ts`](app/api/resume/profile/route.ts)
- **Auth:** Authenticated User (`requireUser()`).
- **Query Parameters:** `id` (optional UUID).
- **Response Payloads:**
  - `200 OK`:
    ```json
    {
      "profiles": [
        {
          "id": "8b51d542-a892-4912-870a-0e9e4be0df33",
          "user_id": "9d90fe07-d7e1-4543-9ce0-4c74062fa8ea",
          "slug": "jane-doe",
          "status": "published",
          "parse_status": "ready",
          "parse_error": null,
          "full_name": "Jane Doe",
          "greeting": "Hi, I'm Jane's AI. Ask me about their work.",
          "profile_json": {
            "full_name": "Jane Doe",
            "headline": "Senior Distributed Systems Engineer",
            "summary": "10+ years architecting high-throughput microservices...",
            "experience": [],
            "education": [],
            "skills": ["Go", "TypeScript", "PostgreSQL", "Kafka"],
            "projects": [],
            "voice": "alba",
            "personality": "professional",
            "formality": 0.3,
            "verbosity": 0.5
          },
          "resume_path": "9d90fe07-d7e1-4543-9ce0-4c74062fa8ea/resume.pdf"
        }
      ],
      "profile": null
    }
    ```
  - `401 Unauthorized`: `{ "error": "Sign in required." }`

---

### `PUT /api/resume/profile`
Updates draft profile metadata (headline, summary, experience, skills, slug) prior to or following publication.

- **File Path:** [`app/api/resume/profile/route.ts`](app/api/resume/profile/route.ts)
- **Auth:** Authenticated User (`requireUser()`).
- **Request Body Schema (`draftBodySchema`):**
  ```typescript
  interface UpdateProfileRequest {
    profile_id: string; // UUID
    full_name: string; // 1-120 chars
    greeting: string; // 1-280 chars
    headline: string; // max 240 chars
    summary: string; // max 4000 chars
    experience: Array<{
      company: string;
      title: string;
      dates: string;
      highlights: string[];
    }>;
    skills: string[]; // max 80 items
    slug: string; // lowercase alphanumeric + hyphens, 2-48 chars
    reviewed: true; // Literal boolean true
  }
  ```
- **Response Payloads:**
  - `200 OK`: `{ "profile": { ...OwnerProfileRow } }`
  - `400 Bad Request`: `{ "error": "Invalid profile." }`
  - `401 Unauthorized`: `{ "error": "Sign in required." }`

---

### `DELETE /api/resume/profile`
Deletes a profile agent, cascades call history and messages, and removes the associated resume PDF from Supabase Storage.

- **File Path:** [`app/api/resume/profile/route.ts`](app/api/resume/profile/route.ts)
- **Auth:** Authenticated User (`requireUser()`).
- **Request Body:** `{ "id": "profile-uuid" }`
- **Response Payloads:**
  - `200 OK`: `{ "ok": true }`
  - `404 Not Found`: `{ "error": "Agent not found." }`

---

### `POST /api/resume/publish`
Validates full profile schema, voice calibration settings, claims or generates a unique slug, transitions status to `published`, and purges Next.js tag caches.

- **File Path:** [`app/api/resume/publish/route.ts`](app/api/resume/publish/route.ts)
- **Auth:** Authenticated User (`requireUser()`).
- **Request Body Schema (`publishBodySchema`):** Merges `draftBodySchema` with `agentStyleSchema` (`voice`, `personality`, `formality`, `verbosity`).
- **Response Payloads:**
  - `200 OK`:
    ```json
    {
      "profile": {
        "id": "8b51d542-a892-4912-870a-0e9e4be0df33",
        "slug": "jane-doe",
        "status": "published",
        "full_name": "Jane Doe",
        "greeting": "Hi, I'm Jane's AI.",
        "profile_json": { ... }
      },
      "url": "https://profili.fyi/participant/jane-doe"
    }
    ```
- **Side Effects:** Updates `profiles.status = 'published'`; triggers Next.js cache revalidation via `revalidateTag("profile:jane-doe", "max")`.

---

## 3. Voice Agent & Call Lifecycle Endpoints

### `POST /api/voice/token`
Validates visitor registration, verifies published profile status, enforces hourly IP and email rate limit slots, logs an active `calls` entry, mints an AssemblyAI Agent session token, and assemblies the dynamic session configuration.

- **File Path:** [`app/api/voice/token/route.ts`](app/api/voice/token/route.ts)
- **Auth:** Public.
- **Rate Limit:** Atomic 5 calls/hour per IP (SHA-256 hashed) and 5 calls/hour per email in `call_rate_buckets`.
- **Request Body Schema (`voiceTokenBodySchema`):**
  ```typescript
  interface VoiceTokenRequest {
    slug: string;
    visitor: {
      name: string; // 1-80 chars
      purpose: string; // 1-200 chars
      email: string; // Valid email, max 120 chars
    };
  }
  ```
- **Response Payloads:**
  - `200 OK`:
    ```json
    {
      "token": "assemblyai-ephemeral-jwt-token",
      "callId": "91a2fc38-4f51-40ef-9a5c-5da2c0ec7b99",
      "transcriptToken": "d47e4b9c-293e-4fe1-ba5c-e093121542f7",
      "sessionConfig": {
        "type": "session.update",
        "session": {
          "system_prompt": "You are the AI representative of Jane Doe...",
          "greeting": "Hi, I'm Jane's AI.",
          "input": { "format": { "encoding": "audio/pcm" } },
          "output": { "voice": "alba", "format": { "encoding": "audio/pcm" } },
          "tools": [ ... ]
        }
      }
    }
    ```
  - `400 Bad Request`: Validation error.
  - `404 Not Found`: Profile does not exist or is unpublished.
  - `429 Too Many Requests`: `{ "error": "Call limit reached. Try again in an hour." }`
  - `502 Bad Gateway`: AssemblyAI token generation failure.
- **Side Effects:** Inserts row into `calls` with status `insight_status = 'idle'`; emits Inngest event `call.started`.

---

### `POST /api/voice/session`
Associates the official AssemblyAI WebSocket session ID with the database call record once the WebSocket handshake reaches `session.ready`.

- **File Path:** [`app/api/voice/session/route.ts`](app/api/voice/session/route.ts)
- **Auth:** Verified by `callId` + `transcriptToken` pair.
- **Request Body:**
  ```json
  {
    "callId": "91a2fc38-4f51-40ef-9a5c-5da2c0ec7b99",
    "transcriptToken": "d47e4b9c-293e-4fe1-ba5c-e093121542f7",
    "assemblySessionId": "session_01j9example12345"
  }
  ```
- **Response Payloads:**
  - `200 OK`: `{ "ok": true }`
  - `404 Not Found`: `{ "error": "Call not found." }`

---

### `POST /api/voice/tool`
Executes in-call client tools triggered by AssemblyAI (`leave_message_for_owner`). Verifies call status, checks tool execution rate limits, writes visitor message to the database, and schedules owner notification.

- **File Path:** [`app/api/voice/tool/route.ts`](app/api/voice/tool/route.ts)
- **Auth:** Verified by `callId` + `transcriptToken` pair.
- **Rate Limit:** 5 tool calls per hour per IP and per call ID.
- **Request Body Schema (`toolRequestSchema`):**
  ```typescript
  interface ToolRequest {
    callId: string;
    transcriptToken: string;
    name: "leave_message_for_owner";
    arguments: {
      message: string; // 1-500 chars
      intent?: "job_opportunity" | "question" | "introduction" | "other";
    };
  }
  ```
- **Response Payloads:**
  - `200 OK`:
    ```json
    {
      "ok": true,
      "message": "Saved. Jane will get it by email."
    }
    ```
  - `400 Bad Request`: Invalid arguments.
  - `429 Too Many Requests`: Tool invocation limit exceeded.
- **Side Effects:** Inserts record into `messages`; triggers Inngest event `message.left`.

---

### `GET /api/voice/transcript`
Fetches ordered conversational turns for an authenticated profile owner reviewing past calls.

- **File Path:** [`app/api/voice/transcript/route.ts`](app/api/voice/transcript/route.ts)
- **Auth:** Authenticated User (`requireUser()`). Owner profile validation enforced.
- **Query Parameters:** `callId` (UUID).
- **Response Payloads:**
  - `200 OK`:
    ```json
    {
      "turns": [
        { "seq": 0, "speaker": "agent", "text": "Hi, I'm Jane's AI." },
        { "seq": 1, "speaker": "visitor", "text": "Tell me about your distributed systems experience." }
      ]
    }
    ```

---

### `POST /api/voice/transcript`
Ingests real-time live captions streamed from the client during an active call session.

- **File Path:** [`app/api/voice/transcript/route.ts`](app/api/voice/transcript/route.ts)
- **Auth:** Verified by `callId` + `transcriptToken` pair.
- **Request Body Schema (`voiceTranscriptBodySchema`):**
  ```typescript
  interface PostTranscriptTurn {
    callId: string;
    transcriptToken: string;
    speaker: "visitor" | "agent";
    text: string; // 1-8000 chars
    seq: number; // 0-4000
  }
  ```
- **Response Payloads:**
  - `200 OK`: `{ "ok": true }`
- **Side Effects:** Executes upsert on `transcript_turns` on conflict `(call_id, seq)`.

---

### `POST /api/voice/preview`
Generates a short, single-sentence TTS audio preview session config for candidate review during voice onboarding.

- **File Path:** [`app/api/voice/preview/route.ts`](app/api/voice/preview/route.ts)
- **Auth:** Authenticated User (`requireUser()`).
- **Request Body:** `{ "voice": "alba" }`
- **Response Payloads:**
  - `200 OK`:
    ```json
    {
      "token": "ephemeral-token",
      "sessionConfig": {
        "type": "session.update",
        "session": {
          "greeting": "Hi. This is how I sound.",
          "system_prompt": "Do not speak after the greeting. Stay silent.",
          "output": { "voice": "alba", "volume": 100 }
        }
      }
    }
    ```

---

### `POST /api/voice/end`
Signals session termination, writes duration metrics, updates call status to `insight_status = 'pending'`, and dispatches background intelligence jobs. Supports both `application/json` fetch requests and text blobs from `navigator.sendBeacon`.

- **File Path:** [`app/api/voice/end/route.ts`](app/api/voice/end/route.ts)
- **Auth:** Verified by `callId` + `transcriptToken` pair.
- **Request Body:**
  ```json
  {
    "callId": "91a2fc38-4f51-40ef-9a5c-5da2c0ec7b99",
    "transcriptToken": "d47e4b9c-293e-4fe1-ba5c-e093121542f7",
    "assemblySessionId": "session_01j9example12345"
  }
  ```
- **Response Payloads:**
  - `200 OK`:
    ```json
    {
      "ok": true,
      "duration_seconds": 184
    }
    ```
- **Side Effects:** Updates `calls.ended_at` and `calls.duration_seconds`; emits Inngest event `call.ended`.

---

### `GET /api/voice/calls`
Retrieves up to 40 past completed calls for the candidate's dashboard, including duration and Gemini scorecard metrics.

- **File Path:** [`app/api/voice/calls/route.ts`](app/api/voice/calls/route.ts)
- **Auth:** Authenticated User (`requireUser()`).
- **Response Payloads:**
  - `200 OK`:
    ```json
    {
      "calls": [
        {
          "id": "91a2fc38-4f51-40ef-9a5c-5da2c0ec7b99",
          "visitor_name": "Alex Mercer",
          "visitor_purpose": "Engineering Leadership Role",
          "visitor_email": "alex@venturecorp.com",
          "started_at": "2026-10-27T10:00:00.000Z",
          "ended_at": "2026-10-27T10:04:12.000Z",
          "duration_seconds": 252,
          "insight_status": "ready",
          "insight_intent": "Hiring screen",
          "insight_query": "What experience do you have scaling distributed queues?",
          "insight_summary": "The visitor explored Jane's architectural background with Apache Kafka and RabbitMQ...",
          "insight_citation": "Staff Infrastructure Engineer at Acme Cloud",
          "insight_grounded": 98,
          "insight_tone": 92,
          "insight_fit": 95,
          "insight_tone_label": "High",
          "insight_fit_label": "Strong match",
          "assembly_session_id": "session_01j9example12345",
          "left_message": true
        }
      ]
    }
    ```

---

### `POST /api/voice/insights/retry`
Triggers an immediate re-evaluation of Gemini post-call intelligence for a failed or stuck call scorecard.

- **File Path:** [`app/api/voice/insights/retry/route.ts`](app/api/voice/insights/retry/route.ts)
- **Auth:** Authenticated User (`requireUser()`). Owner profile validation enforced.
- **Request Body:** `{ "callId": "uuid" }`
- **Response Payloads:**
  - `200 OK`: `{ "ok": true }`
- **Side Effects:** Resets `calls.insight_status = 'pending'`; re-emits `call.ended`.

---

### `GET /api/voice/messages`
Fetches all inbound visitor messages left for the authenticated user's profiles (up to 80 records).

- **File Path:** [`app/api/voice/messages/route.ts`](app/api/voice/messages/route.ts)
- **Auth:** Authenticated User (`requireUser()`).
- **Response Payloads:**
  - `200 OK`:
    ```json
    {
      "messages": [
        {
          "id": "c1f71a9e-8742-45e3-82a1-fae903bc7012",
          "call_id": "91a2fc38-4f51-40ef-9a5c-5da2c0ec7b99",
          "body": "Loved the breakdown of your high-throughput pipeline. Can we chat this Thursday at 2 PM?",
          "intent": "job_opportunity",
          "visitor_name": "Alex Mercer",
          "visitor_email": "alex@venturecorp.com",
          "created_at": "2026-10-27T10:03:45.000Z",
          "notified_at": "2026-10-27T10:03:50.000Z",
          "read_at": null
        }
      ]
    }
    ```

---

### `PATCH /api/voice/messages`
Marks a visitor message as read.

- **File Path:** [`app/api/voice/messages/route.ts`](app/api/voice/messages/route.ts)
- **Auth:** Authenticated User (`requireUser()`).
- **Request Body:** `{ "id": "message-uuid" }`
- **Response Payloads:**
  - `200 OK`: `{ "ok": true }`
- **Side Effects:** Sets `messages.read_at = now()`. Enforced by database trigger `messages_freeze_except_read_at`.

---

## 4. Inngest Webhook Endpoint

### `GET / POST / PUT /api/inngest`
Official Inngest SDK webhook handler serving registered durable functions.

- **File Path:** [`app/api/inngest/route.ts`](app/api/inngest/route.ts)
- **Auth:** Handled internally by Inngest SDK using `INNGEST_SIGNING_KEY`.
- **Registered Functions:**
  - `parse-resume` ([`lib/inngest/parse-resume.ts`](lib/inngest/parse-resume.ts))
  - `finalize-call` ([`lib/inngest/finalize-call.ts`](lib/inngest/finalize-call.ts))
  - `close-open-call` ([`lib/inngest/finalize-call.ts`](lib/inngest/finalize-call.ts))
  - `notify-owner-message` ([`lib/inngest/notify-message.ts`](lib/inngest/notify-message.ts))
- **Execution Target:** Serverless execution up to 60 seconds (`export const maxDuration = 60`).
