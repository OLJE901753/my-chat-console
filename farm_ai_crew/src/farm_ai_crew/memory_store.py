from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class JsonMemoryStore:
    """Simple JSON-based persistent memory per agent.

    Stores a list of memory entries per agent in individual JSON files.
    This is a lightweight fallback when vector DB memory is unavailable.
    """

    def __init__(self, base_dir: Optional[Path] = None) -> None:
        self.base_dir = self._resolve_base_dir(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_base_dir(self, base_dir: Optional[Path]) -> Path:
        if base_dir is not None:
            return Path(base_dir)
        env_dir = os.getenv("FARM_AI_MEMORY_DIR")
        if env_dir:
            return Path(env_dir)
        if os.name == "nt":
            local_app = Path(os.getenv("LOCALAPPDATA", str(Path.home())))
            return local_app / "farm_ai_memory" / "agents"
        return Path.home() / ".farm_ai_memory" / "agents"

    def _file_for_agent(self, agent_name: str) -> Path:
        safe_name = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in agent_name)
        return self.base_dir / f"{safe_name}.json"

    def load_agent_entries(self, agent_name: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        file_path = self._file_for_agent(agent_name)
        if not file_path.exists():
            return []
        try:
            with file_path.open("r", encoding="utf-8") as f:
                entries = json.load(f)
                if not isinstance(entries, list):
                    return []
                if limit is not None and limit > 0:
                    return entries[-limit:]
                return entries
        except Exception:
            return []

    def load_agent_memory_text(self, agent_name: str, limit: int = 10) -> str:
        entries = self.load_agent_entries(agent_name, limit=limit)
        if not entries:
            return ""
        lines: List[str] = []
        for e in entries:
            ts = e.get("timestamp")
            summary = e.get("summary") or e.get("result_excerpt") or ""
            if ts and summary:
                lines.append(f"[{ts}] {summary}")
        if not lines:
            return ""
        return (
            "\n\nPersistent memory (recent):\n" + "\n".join(lines) + "\n\nUse context above when reasoning."
        )

    def append_agent_entry(
        self,
        agent_name: str,
        *,
        inputs: Optional[Dict[str, Any]] = None,
        result: Optional[str] = None,
        summary: Optional[str] = None,
        tasks_involved: Optional[List[str]] = None,
        agents_involved: Optional[List[str]] = None,
    ) -> None:
        file_path = self._file_for_agent(agent_name)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        entries = self.load_agent_entries(agent_name)

        timestamp = datetime.utcnow().isoformat() + "Z"
        result_excerpt = (result or "")[:2000]
        new_entry: Dict[str, Any] = {
            "timestamp": timestamp,
            "inputs": inputs or {},
            "result_excerpt": result_excerpt,
            "summary": summary or (result_excerpt[:280] if result_excerpt else None),
            "tasks_involved": tasks_involved or [],
            "agents_involved": agents_involved or [],
            "version": 1,
        }

        entries.append(new_entry)
        with file_path.open("w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)


