# Production Deployment & Operations Guide

This guide details the steps to deploy Profili to production across [Vercel](https://vercel.com), [Supabase](https://supabase.com), [Inngest](https://www.inngest.com), [AssemblyAI](https://www.assemblyai.com), and [Google AI Studio (Gemini)](https://aistudio.google.com).

---

## 1. Production Architecture Overview

```mermaid
flowchart LR
    VercelEdge["Vercel Edge & Serverless Runtime (Next.js 16 App Router)"]
    SupabaseDB["Supabase Managed PostgreSQL (RLS & Triggers)"]
    SupabaseStore["Supabase Storage (resumes bucket)"]
    InngestCloud["Inngest Cloud (Event Orchestration)"]
    AssemblyAI["AssemblyAI (Realtime Agents API)"]
    GeminiAPI["Google Gemini 3 Flash API"]
    ResendAPI["Resend Email API"]

    VercelEdge <--> SupabaseDB
    VercelEdge <--> SupabaseStore
    VercelEdge <--> InngestCloud
    VercelEdge <--> AssemblyAI
    InngestCloud <--> GeminiAPI
    InngestCloud <--> ResendAPI
```

---

## 2. Environment Variables Specification

Configure the following environment variables in your deployment dashboard (e.g., Vercel Project Settings $\to$ Environment Variables):

| Key | Scope | Purpose & Description | Example Format |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Server | Runtime connection string for queries via Drizzle ORM. Use transaction pooler (port 6543) or direct connection. | `postgres://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres` |
| `DATABASE_URL_MIGRATE` | CI/CD | Direct PostgreSQL connection string for Drizzle Kit schema migrations (bypassing pooler). | `postgres://postgres:[pass]@db.[ref].supabase.co:5432/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | Shared | Public URL of your Supabase project. | `https://[project-ref].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Shared | Public anon key for client-side Supabase SSR session initialization. | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Admin secret key for server-side elevated operations (storage PDF downloading in background jobs). | `eyJhbGciOi...` |
| `ASSEMBLYAI_API_KEY` | Server | API key used to mint short-lived WebSocket tokens and fetch timeline audio data. | `3b8f4...` |
| `GEMINI_API_KEY` | Server | Google AI Studio key powering resume extraction and post-call evaluation scorecards. | `AIzaSy...` |
| `GEMINI_PARSE_MODEL` | Server *(Opt)* | Override model hierarchy (defaults to `gemini-3.8-flash`, fallback to `3.7-flash`). | `gemini-3.8-flash` |
| `INNGEST_EVENT_KEY` | Server | Secret key used by `lib/inngest/emit.ts` to dispatch events to Inngest Cloud. | `ingest_...` |
| `INNGEST_SIGNING_KEY` | Server | Signing key verifying incoming webhook requests to `POST /api/inngest`. | `signkey-prod-...` |
| `RESEND_API_KEY` | Server | Transactional email key for delivering visitor messages to candidate inboxes. | `re_123456789...` |
| `NEXT_PUBLIC_SITE_URL` | Shared | Canonical production URL used for cookie flags, sitemaps, and OpenGraph images. | `https://profili.fyi` |

---

## 3. Database Setup & Migration Pipeline

Profili uses Drizzle ORM with versioned SQL migrations stored in [`drizzle/`](drizzle/).

### 3.1 Executing Database Migrations
Run migrations from your terminal or deployment pipeline:
```bash
# Apply all pending migrations (0000 - 0006)
pnpm db:migrate
```
*Note: Ensure `DATABASE_URL_MIGRATE` or `DATABASE_URL` points directly to PostgreSQL port 5432 (direct connection), as migration commands perform schema locking.*

### 3.2 Verifying Supabase Storage Buckets
The initial migration [`drizzle/0001_rls_auth_storage.sql`](drizzle/0001_rls_auth_storage.sql) automatically provisions the `resumes` bucket. Confirm bucket settings in the Supabase Dashboard:
- Bucket Name: `resumes`
- Public: `No`
- Allowed MIME Types: `application/pdf`
- Maximum file size: `5 MB` (`5242880` bytes)

---

## 4. Inngest Cloud Webhook Configuration

1. Log into your [Inngest Cloud Dashboard](https://app.inngest.com).
2. Create an Environment (e.g., `Production`).
3. Under **Apps**, select **Create App** and configure your webhook synchronization endpoint:
   - **URL:** `https://your-domain.com/api/inngest`
4. Copy the generated **Signing Key** into your deployment environment variables as `INNGEST_SIGNING_KEY`.
5. Trigger an initial sync. Inngest will register the 4 core workflows:
   - `parse-resume`
   - `finalize-call`
   - `close-open-call`
   - `notify-owner-message`

---

## 5. Vercel Deployment Walkthrough

### 5.1 Repository Connection & Framework Preset
1. Import the repository into Vercel.
2. Verify **Framework Preset** is set to `Next.js`.
3. Set **Root Directory** to `./`.

### 5.2 Build Command & Output Settings
- **Build Command:** `pnpm build`
- **Install Command:** `pnpm install`
- **Output Directory:** Default (`.next`)

### 5.3 Function Timeout Settings
Route handlers executing Inngest jobs or large PDF transformations declare serverless duration overrides:
- [`app/api/inngest/route.ts`](app/api/inngest/route.ts) declares `export const maxDuration = 60`.
- In Vercel Pro/Enterprise accounts, this allows background execution steps to run up to 60 seconds.

---

## 6. Post-Deployment Verification Checklist

- [ ] **Auth Flow:** Visit `/signup`, register a test user, confirm account via email, and verify successful redirect to `/app/create`.
- [ ] **Resume Upload & Ingestion:** Upload a sample PDF resume; verify Inngest executes `parse-resume` and populates the `/app/review` screen within 10 seconds.
- [ ] **Voice Token Handshake:** Visit `/participant/[slug]`, fill out the registration form, and verify that `POST /api/voice/token` returns 200 with an AssemblyAI bearer token.
- [ ] **Bidirectional Speech:** Speak into the microphone; confirm the `VoiceOrb` pulses and the agent responds audibly.
- [ ] **In-Call Messaging:** Speak `"I'd like to leave a message"`, confirm the agent invokes `leave_message_for_owner`, and verify email receipt via Resend.
- [ ] **Post-Call Intelligence:** Hang up the call; verify that `finalize-call` executes and the recruiter scorecard appears in `/app/dashboard`.
- [ ] **Widget Embed:** Test an HTML snippet containing `<script src="https://your-domain.com/embed.js"></script><div data-profili-slug="your-slug"></div>` on an external page.
