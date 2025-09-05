from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    cases: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        cases.append(json.loads(line))
    return cases


def validate_leaf_scan(case: dict[str, Any]) -> bool:
    exp = case.get("expected", {})
    return "indicators" in exp and "confidence" in exp


def validate_tree_count(case: dict[str, Any]) -> bool:
    return "expected" in case and "count" in case["expected"]


def validate_content_suggest(case: dict[str, Any]) -> bool:
    exp = case.get("expected", {})
    caps = exp.get("captions", {})
    return "clips" in exp and all(k in caps for k in ("youtube","instagram","tiktok"))


def main() -> int:
    root = Path(__file__).parent
    suites = {
        "leaf_scan": (root / "leaf_scan.jsonl", validate_leaf_scan),
        "tree_count": (root / "tree_count.jsonl", validate_tree_count),
        "content_suggest": (root / "content_suggest.jsonl", validate_content_suggest),
    }
    failed = 0
    for name, (path, fn) in suites.items():
        cases = load_jsonl(path)
        for idx, case in enumerate(cases, 1):
            ok = fn(case)
            if not ok:
                print(f"[FAIL] {name} case #{idx}")
                failed += 1
    if failed:
        print(f"Failures: {failed}")
        return 1
    print("All eval case shapes valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
