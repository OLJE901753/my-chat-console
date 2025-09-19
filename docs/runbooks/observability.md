# Observability

## Frontend (Sentry)
- Set `VITE_SENTRY_DSN` to enable Sentry in the frontend.
- Errors and traces (sampled) will be sent when enabled.

## AI Manager (Sentry + OpenTelemetry)
- Set `SENTRY_DSN` to enable Sentry integration.
- Set `OTEL_ENABLED=1` to enable console span export.
- Extend `otel.py` to export to OTLP if desired.

## Logs
- Drone Agent logs `manual_control_boundary` events for execute commands.
- Server logs under `server/logs/` (existing).
