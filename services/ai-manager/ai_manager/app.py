from fastapi import FastAPI
import os
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
except Exception:  # pragma: no cover
    sentry_sdk = None  # type: ignore
from .routes import router
from .otel import setup_tracing
import uvicorn

if os.getenv("SENTRY_DSN") and sentry_sdk:
    sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"), integrations=[FastApiIntegration()])

app = FastAPI(title="AI Manager")
app.include_router(router)

# OpenTelemetry (console exporter by default; enable with OTEL_ENABLED=1)
setup_tracing()


@app.get("/health")
def health():
    return {"status": "ok"}


def run():
    uvicorn.run("ai_manager.app:app", host="0.0.0.0", port=8000, reload=False)
