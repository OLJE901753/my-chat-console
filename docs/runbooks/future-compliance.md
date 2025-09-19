# Future Compliance

## RLS (Supabase)
- Add policies per role (owner, worker, viewer) and enable per table in production.
- Keep RLS off in dev for velocity.

## GDPR
- Data access exports and deletion endpoints.
- Audit logs for access to personal data.
- Minimize PII in telemetry and logs; redact where possible.

## Security
- Dependency review in CI (enabled).
- CodeQL scanning (enabled).
- Vaulted secrets; avoid committing secrets.
