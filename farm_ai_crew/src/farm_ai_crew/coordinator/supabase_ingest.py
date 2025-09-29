from __future__ import annotations

import asyncio
import json
from typing import Awaitable, Callable

from supabase import create_client, Client

from .models import CoordinatorTask
from .settings import get_settings


class SupabaseIngest:
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_service_role_key:
            print("WARNING: Supabase credentials missing for coordinator - using mock ingest")
            self.client = None
        else:
            self.client: Client = create_client(str(settings.supabase_url), settings.supabase_service_role_key)

    async def subscribe(self, on_task: Callable[[CoordinatorTask], Awaitable[None]]) -> None:
        if self.client is None:
            print("WARNING: Supabase ingest disabled - coordinator will not receive tasks")
            return
        
        settings = get_settings()
        channel_name = settings.supabase_channel
        channel = self.client.channel(channel_name)

        def _handler(payload: dict) -> None:
            try:
                record = payload.get("new") or payload.get("record") or payload
                task = CoordinatorTask(**record)
                asyncio.create_task(on_task(task))
            except Exception:
                # Best-effort; coordinator logs will capture errors
                pass

        channel.on(
            "postgres_changes",
            {
                "event": "INSERT",
                "schema": settings.supabase_realtime_schema,
                "table": "ai_tasks",
            },
            _handler,
        )

        channel.subscribe()

        # Hold the loop open
        while True:
            await asyncio.sleep(60)

