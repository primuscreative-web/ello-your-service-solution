# Appointment Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce role-safe, atomic appointment workflows and deploy the database migration.

**Architecture:** Public RPC wrappers call private transactional functions that authorize the current user, mutate appointment and quote state, and write chat messages atomically. TypeScript helpers mirror permissions for UI affordances without replacing database enforcement.

**Tech Stack:** TypeScript, React, TanStack Query/Router, Supabase Postgres, RLS, PL/pgSQL, Node test runner.

---

### Task 1: Permission contract

**Files:**

- Modify: `src/lib/appointments.test.ts`
- Modify: `src/lib/appointments.ts`

- [ ] Add failing tests for client and professional proposal/transition permissions.
- [ ] Run `npm run test:appointments` and confirm the missing helpers fail.
- [ ] Implement the minimal permission helpers.
- [ ] Run `npm run test:appointments` and confirm all tests pass.

### Task 2: Atomic database workflow

**Files:**

- Modify: `supabase/migrations/20260618012913_harden_appointments_workflow.sql`

- [ ] Add private transactional proposal and transition functions.
- [ ] Add public invoker wrappers granted only to authenticated users.
- [ ] Revoke direct appointment INSERT/UPDATE privileges.
- [ ] Preserve participant SELECT RLS and realtime publication.
- [ ] Validate migration syntax against the linked project.

### Task 3: RPC client and UI

**Files:**

- Modify: `src/lib/supabase/database.types.ts`
- Modify: `src/lib/ello-repository.ts`
- Modify: `src/routes/app.messages.tsx`
- Modify: `src/routes/app.agenda.tsx`

- [ ] Add generated-compatible RPC type declarations.
- [ ] Replace multi-request mutations with RPC calls.
- [ ] Add participant perspective to quote threads.
- [ ] Hide proposal and transition controls when the current role is not allowed.
- [ ] Run focused lint and the production build.

### Task 4: Deployment and QA

**Files:**

- Verify: `supabase/migrations/20260618012913_harden_appointments_workflow.sql`

- [ ] Push pending migrations to the linked Supabase project.
- [ ] Run migration status and database advisors.
- [ ] Run unit tests, ESLint, build, and `git diff --check`.
- [ ] Verify `/app/agenda` in the browser with console and interaction checks.
