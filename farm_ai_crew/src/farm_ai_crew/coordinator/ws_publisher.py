from __future__ import annotations

import json
import urllib.request
from typing import Any, Dict

from .settings import get_settings


class BackendPublisher:
    def __init__(self) -> None:
        settings = get_settings()
        self.ws_url = settings.backend_ws_url

    def publish(self, event: Dict[str, Any]) -> None:
        # Placeholder: call backend HTTP hook to broadcast via SSE/WS until WS gateway is available
        # POST to /api/supabase/forward-event or similar if implemented; else no-op.
        try:
            if not self.ws_url:
                return
            req = urllib.request.Request(self.ws_url, data=json.dumps(event).encode("utf-8"), headers={"Content-Type": "application/json"})
            urllib.request.urlopen(req, timeout=2)
        except Exception:
            pass

