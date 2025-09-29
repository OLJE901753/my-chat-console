from __future__ import annotations

import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def run() -> None:
    uvicorn.run("farm_ai_crew.coordinator.app:app", host="0.0.0.0", port=8001, reload=False)


if __name__ == "__main__":
    run()

