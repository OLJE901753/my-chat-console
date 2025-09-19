# SESSION START

Paste Prompt 0 once per Cursor session, then run Phases in order.

## Quick Glossary
- Manager AI: The delegator that assigns work to specialist agents.
- Agents: Focused AIs (crop health, irrigation, drone ops, analytics, content).
- Edge: Local services for low-latency (drone control, sensors, SSE).
- Supabase: Auth, Postgres, Storage, RLS for the private dashboard.

## Common Commands
- Frontend dev: `pnpm dev` (or `npm run dev`)
- Typecheck (TS): `pnpm typecheck` (or `tsc -p tsconfig.json --noEmit`)
- Lint (TS): `pnpm lint`
- Backend (server): `node server/src/index.js` (or provided start scripts)
- Python env: `py -3.11 -m venv .venv311 && .\.venv311\Scripts\Activate.ps1`
- Python checks: `ruff check`, `mypy`, `pytest -q`

Keep changes small, commit often, and pass CI gates before merge.
