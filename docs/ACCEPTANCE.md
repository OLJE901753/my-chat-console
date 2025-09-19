# Acceptance Criteria

## CI / Quality Gates
- CI green on every PR: typecheck + lint + tests.
- Coverage ≥ 70% line coverage across core packages.

## Security
- Dependency review clean (no criticals).
- Secrets never stored in repo.
- (Future) Supabase RLS switchable per environment with infra flag.

## Performance
- Dashboard LCP < 3s on mid-tier hardware, 3G fast network.
- Manual drone control: low-latency path documented (edge/local service), no blocking UI work.

## Documentation & Onboarding
- New contributor onboarding ≤ 30 minutes: run dev, run tests, commit PR.
- Docs include environment setup, secrets, and deployment runbooks.

## Observability
- Structured logs for FE/BE.
- Minimal traces for critical flows (auth, mission run, drone control request).

## Access & Privacy
- Dashboard private by default. Auth via Supabase, least privilege roles.
