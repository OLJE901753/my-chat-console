import os
import sys
from datetime import datetime


def main() -> int:
    # Ensure repo src is importable
    repo_root = os.path.dirname(os.path.abspath(__file__))
    src_path = os.path.join(repo_root, 'src')
    if src_path not in sys.path:
        sys.path.append(src_path)

    # Disable Chroma to force JSON fallback
    os.environ.setdefault('FARM_AI_DISABLE_CHROMA', '1')
    # Ensure memory dirs are set if not already
    if 'FARM_AI_MEMORY_DIR' not in os.environ:
        local_app = os.getenv('LOCALAPPDATA', os.path.expanduser('~'))
        os.environ['FARM_AI_MEMORY_DIR'] = os.path.join(local_app, 'farm_ai_memory', 'agents')

    try:
        from farm_ai_crew.crew import FarmAiCrew
    except Exception as e:
        print(f"Import error: {e}")
        return 1

    crew = FarmAiCrew()
    inputs = {
        'current_date': datetime.now().strftime('%Y-%m-%d'),
        'farm_location': 'Apple Orchard Farm',
        'current_season': 'Fall',
        'priority_focus': 'Harvest preparation and disease monitoring',
    }

    result = crew.run_daily_operations_with_memory(inputs=inputs)
    print(result)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())


