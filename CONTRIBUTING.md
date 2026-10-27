# Contributing to Profili & Engineering Guide

Thank you for your interest in contributing to Profili. This document outlines the local engineering setup, coding standards, test suite execution, and pull request procedures.

---

## 1. Prerequisites & Toolchain

Ensure your development environment meets the following specifications:
- **Node.js:** `v20.x` or `v22.x` (LTS recommended).
- **Package Manager:** `pnpm` (v9+ or v10+). Install globally via `npm install -g pnpm` or `corepack enable`.
- **Database:** Local PostgreSQL instance or a remote Supabase project.

---

## 2. Local Environment Setup

### 2.1 Clone Repository & Install Dependencies
```bash
git clone https://github.com/your-org/profili.git
cd profili

# Install dependencies (respecting pnpm lockfile)
pnpm install
```

### 2.2 Configure Local Environment Variables
Create a `.env.local` file in the project root:
```env
# Database Connections
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:54322/postgres"
DATABASE_URL_MIGRATE="postgres://postgres:postgres@127.0.0.1:54322/postgres"

# Supabase Auth & Storage
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# AI & Speech Services
ASSEMBLYAI_API_KEY="your-assemblyai-key"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_PARSE_MODEL="gemini-3.8-flash"

# Inngest Background Workflows
INNGEST_EVENT_KEY="local"
INNGEST_SIGNING_KEY="local"

# Notifications & Base URL
RESEND_API_KEY="your-resend-key"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 2.3 Run Database Migrations
Apply the schema migrations to your local or staging PostgreSQL database:
```bash
pnpm db:migrate
```

To launch the visual Drizzle database studio:
```bash
pnpm db:studio
```

---

## 3. Local Development Workflows

Profili requires two background processes during active local development: the Next.js development server and the Inngest local CLI.

```bash
# Terminal 1: Launch Next.js dev server on port 3000
pnpm dev

# Terminal 2: Launch Inngest local event dev server
pnpm inngest:dev
```
- Next.js Web App: `http://localhost:3000`
- Inngest Dashboard: `http://localhost:8288`

---

## 4. Test Suite Execution

Profili uses the native Node.js test runner with experimental type-stripping for fast, zero-dependency unit testing across voice tools, Supabase cookie rules, and auth utilities.

Run the full test suite:
```bash
pnpm test
```

Target individual test suites during development:
```bash
# Test AssemblyAI voice mapping & fallbacks
node --experimental-strip-types --test lib/voice/assembly-voices.test.ts

# Test Voice tool argument parsing & schemas
node --experimental-strip-types --test lib/voice/tools.test.ts

# Test Tool execution results and payload builder
node --experimental-strip-types --test lib/voice/tool-result.test.ts

# Test Open redirect and URL sanitization
node --experimental-strip-types --test lib/auth/safe-next.test.ts

# Test Account OAuth provider classification
node --experimental-strip-types --test lib/auth/account-providers.test.ts

# Test Supabase cookie security on localhost vs prod
node --experimental-strip-types --test lib/supabase/cookie-options.test.ts
```

---

## 5. Coding Standards & Conventions

### 5.1 Architecture & Boundaries
- **Route Handlers:** Every endpoint under `app/api/` must validate incoming JSON using Zod schemas (`safeParse`). Never cast raw request bodies directly with `as Type`.
- **Database Access:** Use Drizzle ORM (`getDb()`) for custom serverless logic and the authenticated Supabase Client (`auth.supabase`) when executing user-scoped queries protected by RLS.
- **Audio Worklets:** Audio processing code inside [`public/pcm-processor.js`](public/pcm-processor.js) must remain dependency-free standard ECMAScript that runs natively in the browser audio thread.

### 5.2 Linting & Formatting
Ensure all files pass ESLint inspection before submitting changes:
```bash
pnpm lint
```

### 5.3 Modifying the Database Schema
1. Update table definitions in [`lib/db/schema.ts`](lib/db/schema.ts).
2. Generate migration SQL files:
   ```bash
   pnpm db:generate --name your_migration_name
   ```
3. If writing custom PostgreSQL policies, triggers, or views, inspect the generated file in `drizzle/` or use:
   ```bash
   pnpm db:generate:custom --name your_custom_sql
   ```
4. Test migration execution locally using `pnpm db:migrate`.

---

## 6. Pull Request Guidelines

1. **Branch Naming:** Use descriptive branch names:
   - `feat/voice-ducking-improvement`
   - `fix/safari-audio-worklet-sample-rate`
   - `docs/api-reference-update`
2. **Commit Hygiene:** Follow conventional commit standards (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`).
3. **Automated Verification:** Pull requests must pass:
   - Clean ESLint check (`pnpm lint`)
   - 100% test pass rate (`pnpm test`)
   - Clean Next.js production build (`pnpm build`)
4. **Documentation Sync:** If modifying API routes, database schemas, or voice parameters, update the corresponding documentation files ([`API_REFERENCE.md`](API_REFERENCE.md), [`DATABASE.md`](DATABASE.md), [`VOICE_PIPELINE.md`](VOICE_PIPELINE.md)).
