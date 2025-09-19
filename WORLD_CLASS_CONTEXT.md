# WORLD-CLASS CONTEXT

## Problem, Users, Outcomes, Non-goals
- Problem: Norwegian farms need modern, low-cost AI that boosts yield, maximizes legal subsidies, and cuts bureaucracy without vendor lock-in.
- Users:
  - Farm Owner/Manager: strategy, approvals, subsidy/tax optimizations.
  - Field Operator: drone ops, irrigation, disease monitoring.
  - Data/Ops Engineer: integrations, deployments, observability.
  - Stakeholders: concise reports, exportable evidence for grants/tax.
- Outcomes:
  - Reliable daily plans and crisis playbooks with agent collaboration.
  - Measurable yield improvements and cost reductions.
  - Exportable reports for subsidies, tax (Skattemelding), audits.
  - E2E privacy/control: private GitHub, no proprietary lock-in.
- Non-goals:
  - Building a social network or public portal.
  - Heavy ML training pipelines onsite (cloud-optional later).
  - Expensive SaaS reliance (> NOK budget thresholds).

## Target Platforms
- Now: Web dashboard (desktop-first), works offline-friendly where possible.
- Next: Android via PWA install (add to home screen, push, background sync).

## Non-Functional Requirements (NFRs)
- Availability: brief downtime acceptable during development; protect state.
- Latency: ultra-low-latency path for manual drone control and telemetry.
- Cost: total AI spend ≤ $2k/year; prefer OSS + cheap APIs; cache aggressively.
- Privacy: farm data is private by default; no third-party resale.
- Observability: structured logs + minimal tracing; redaction for PII.

## AI Contract
- Topology: Manager AI delegates to specialist Agents (plant health, irrigation, drone, analytics, etc.).
- Approval Gate: Any real-world action (drone flight, purchase, public post) requires explicit human approval.
- Safety Rules:
  - Never recommend illegal/unsafe actions.
  - Clearly note uncertainty and data limitations.
  - Prefer reversible/low-risk actions first; escalate with justification.
  - Keep deterministic logs for audits and rollbacks.

## Integrations
- Core: Supabase (DB/Auth/Storage), Drone SDK (flight/telemetry), OpenAI/Anthropic/Groq (LLMs), Social APIs (optional), Weather API (optional, cacheable).
- Storage: Supabase Storage for media; local disk cache for edge/offline.
- Memory: Vector DB (Chroma) with JSON fallback; persistent per-agent store.

## Operations
- Frontend: Vercel (static hosting, env-sealed preview/prod).
- Services: Fly.io for Node/FastAPI microservices and SSE.
- Data: Supabase Postgres/Storage; RLS on by default in production.
- Edge: local node(s) for drone control and high-rate sensor ingestion.
- Secrets: 1Password/Vault + environment scoped keys; no secrets in repo.

## Standards
- Tooling: pnpm, Node 20.x, Python 3.11.
- Quality: ESLint/Prettier for TS; Ruff/mypy for Python; Conventional Commits.
- Release: Changesets for versioning; CI gates on type/lint/test.
- License: MIT (code owner retains control; private by default).

## Access
- Private dashboard only. Auth via Supabase. Least privilege roles. Admin UI behind VPN/allowlist in production.


