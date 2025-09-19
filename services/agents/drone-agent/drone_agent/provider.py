from __future__ import annotations

from typing import Protocol, Any, Optional
import uuid


class DroneProvider(Protocol):
    def schedule_flight(self, plan: dict[str, Any], *, scheduled_at: Optional[str] = None) -> str: ...
    def execute(self, command: str) -> bool: ...


class MockDroneProvider:
    def schedule_flight(self, plan: dict[str, Any], *, scheduled_at: Optional[str] = None) -> str:
        return str(uuid.uuid4())

    def execute(self, command: str) -> bool:
        return command in {"manual", "auto", "pause", "resume", "land"}


def get_provider() -> DroneProvider:
    # Later: swap via env to actual DJI/Open provider
    return MockDroneProvider()
