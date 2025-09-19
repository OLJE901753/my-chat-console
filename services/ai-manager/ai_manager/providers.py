from __future__ import annotations

import os
from typing import Literal

Provider = Literal["openai", "anthropic"]


def get_primary_provider() -> Provider:
    return os.getenv("AI_PROVIDER_PRIMARY", "openai").lower()  # type: ignore[return-value]


def get_fallback_provider() -> Provider:
    return os.getenv("AI_PROVIDER_FALLBACK", "anthropic").lower()  # type: ignore[return-value]


def provider_keys_available() -> bool:
    p = get_primary_provider()
    if p == "openai":
        return bool(os.getenv("OPENAI_API_KEY"))
    if p == "anthropic":
        return bool(os.getenv("ANTHROPIC_API_KEY"))
    return False
