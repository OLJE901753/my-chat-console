# Frontend Prompt

- Build a private dashboard (English) with clear routes: `/` (Index), `/dashboard`, `/media`, `/ai`, `/settings`.
- Use React+TS, Tailwind, shadcn/ui. Keep components small and composable.
- State:
  - Local UI via component state.
  - Global via Zustand stores for drones/sensors.
  - Server state via TanStack Query (cache, retries off for control flows).
- Error handling: wrap routes with `ErrorBoundary` and display `ErrorDisplay`.
- Real-time: use SSE client for telemetry; avoid blocking UI for control.
- Accessibility: not required now; keep semantic HTML where easy.
- Performance: lazy-load heavy tabs; prefetch critical data.
- Security: dashboard is private; assume authenticated Supabase session.
- Do not expose secrets; use environment variables.
