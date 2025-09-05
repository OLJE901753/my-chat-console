# ADR 0001: Baseline Architecture Decisions

Date: <today>

## Context
Private farm dashboard with AI agents. Requirements emphasize cost control, low-latency drone control, privacy, and future-proofing (RLS/GDPR).

## Decision
- Frontend: React+TS+Vite+Tailwind+shadcn, deployed on Vercel.
- Backend: Node (Express) for API/SSE on Fly.io; Python AI services (CrewAI) on Fly.io.
- Data platform: Supabase (Auth/DB/Storage). RLS in production; light in dev.
- Memory: ChromaDB when available; JSON fallback to ensure persistence on Windows.
- Messaging: SSE for simple real-time; WebSocket optional later for manual control loop.
- Package managers: pnpm preferred; CI supports npm fallback.
- Standards: ESLint/Prettier (TS), Ruff/mypy (Py), MIT license, Changesets later.

## Consequences
- Clear separation of concerns; scalable independently.
- Works offline/edge-friendly for drone ops.
- CI enforceable quality gates; predictable costs.
- Windows dev friction reduced via JSON memory fallback.

## Alternatives Considered
- Monolith in Next.js: faster initial velocity, but poorer isolation for drone/AI services.
- Pure WebSockets everywhere: higher complexity; SSE sufficient for dashboard events now.
