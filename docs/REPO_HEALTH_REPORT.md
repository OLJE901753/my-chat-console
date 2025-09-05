# Repo Health Report

Project: my-chat-console
Date: <today>

## Stack / Tooling Inventory
- **Frontend**: React + TypeScript + Vite + Tailwind + shadcn/ui
- **State**: Zustand; TanStack Query for server state
- **Real-time**: SSE client in `src/services/sseService.ts`
- **Backend**: Node (Express) under `server/` with routes and middleware
- **Python**: CrewAI-based agents under `farm_ai_crew/` (pyproject managed)
- **Build tools**:
  - Vite for FE bundling
  - Tailwind configured via `tailwind.config.ts` and PostCSS
- **Lint/format**:
  - ESLint present (`eslint.config.js`)
  - Prettier added (`.prettierrc.json`)
  - `.editorconfig` added (2-space TS/JS/MD, 4-space Py)
  - Python: Ruff+mypy config added in `farm_ai_crew/pyproject.toml`
- **TS strictness**: `tsconfig*.json` present; strict flags not clearly enabled. Recommend stricter settings.

## Dependencies Status (JS/TS)
- **Lockfiles**: `package-lock.json` (npm). Project declares `packageManager: pnpm`. Mismatch → standardize.
- **Core libs**: react 18, react-router 6, tanstack query 5, shadcn/radix; modern and OK.
- **Security hardening**: `helmet`, `express-rate-limit` in backend.
- **Pinning policy**: package.json uses ranges (caret). Consider tighter pinning for prod reproducibility.
- **Outdated/vulns**: Not scanned here. Run `pnpm audit` / `npm audit` and `pnpm outdated` in CI.

## Dependencies Status (Python)
- `farm_ai_crew/pyproject.toml` uses `crewai[tools]>=0.175.0` range.
- Additional requirement files exist (`requirements_*.txt`).
- Ruff/mypy config added; Python 3.11 targeted.
- Caveat: Chroma hnswlib builds on Windows; JSON fallback implemented in code.

## Tests / Coverage / Scripts
- **JS tests**: none detected; no vitest/jest setup.
- **Python**: a couple of scripts/tests but no pytest config or coverage in CI.
- **Scripts added**:
  - `typecheck`, `lint`, `lint:fix`, `format` in package.json
  - Backend start scripts exist
- **Coverage**: none configured (nyc/vitest for JS; pytest-cov for Py recommended).

## Supabase Usage
- SQL migrations in `supabase/` (initial schema, drone media schema, admin user setup), plus `config.toml`.
- App integrates Supabase via `src/lib/supabase.ts` and `server/src/routes/supabase.js`.
- RLS: Not clearly enforced in dev; keep light for MVP. Plan prod RLS policies.
- Storage: drone media schema present; bucket/policy details not fully verified here.

## Build / Run / CI-CD
- **FE**: `npm run dev` (or pnpm) → Vite; `vite build` for prod.
- **BE**: `server/` has separate `package.json` and start scripts.
- **Python**: `farm_ai_crew/src/farm_ai_crew/main.py` CLI; venv recommended.
- **CI/CD**: No workflows detected. Add GitHub Actions for type/lint/test.

## Frontend Quality
- **Routing**: React Router v6; lazy imports; `ErrorBoundary` present.
- **State**: Zustand stores; TanStack Query for server state and cache.
- **Error handling**: `ErrorBoundary` + `ErrorDisplay` components wired.
- **UI**: shadcn/ui primitives; Tailwind ok.
- **DX**: ReactQueryDevtools hidden per request.

## Gaps vs WORLD_CLASS_CONTEXT.md
- Cost guardrails: no cost caps/metrics for LLM calls.
- Memory: Chroma not stable on Windows; JSON fallback exists but not env-flagged per environment.
- Observability: Sentry/OTel not configured.
- CI Gates: missing (type/lint/test/coverage).
- Standards enforcement: no pre-commit hooks/Changesets.
- Supabase RLS: not toggled per env via infra flags.
- PWA: not configured yet.
- Secrets: pattern not documented; env files used locally.
- Package manager mismatch: `package-lock.json` vs declared pnpm.
- Tests: FE unit tests missing; Python pytest + coverage missing.

## Top 10 Quick Wins (Impact × Effort)
1) Add GitHub Actions CI (Node + Python): typecheck/lint/tests, upload coverage (high×low).
2) Standardize to pnpm; remove `package-lock.json`; commit `pnpm-lock.yaml` (high×low).
3) Enable TS strict mode (noImplicitAny, strictNullChecks, exactOptionalPropertyTypes) (high×low).
4) Add vitest + React Testing Library smoke tests for routes/components (high×medium).
5) Add pytest + pytest-cov; convert existing Python scripts to tests; target 70% (high×medium).
6) Add Changesets for versioning and PR previews (medium×low).
7) Add Sentry (FE/BE) and minimal OTel traces for SSE/auth (medium×medium).
8) Feature-flag memory: `FARM_AI_DISABLE_CHROMA` by env, document JSON fallback path (medium×low).
9) Supabase RLS toggle scripts (dev off, prod on) + example policies (medium×medium).
10) PWA manifest + basic SW scaffold for Android install path (medium×low).

## Suggested Next Steps
- Approve CI scaffold and pnpm standardization.
- Land TS strictness + minimal test suites to establish coverage baseline.
- Add Sentry/OTel and cost logging for LLM calls.
