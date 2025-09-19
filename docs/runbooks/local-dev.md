# Local Development

## Prerequisites
- Node 20, pnpm 9
- Python 3.11
- (Optional) Supabase CLI

## Frontend
```sh
pnpm i
pnpm dev
```

## Backend server (Node)
```sh
cd server
npm i
npm start
```

## AI Manager
```sh
cd services/ai-manager
py -3.11 -m venv .venv && .\.venv\Scripts\Activate.ps1
pip install -e . ruff mypy pytest
uvicorn ai_manager.app:app --host 0.0.0.0 --port 8000
```

## Drone Agent (stub)
```sh
cd services/agents/drone-agent
py -3.11 -m venv .venv && .\.venv\Scripts\Activate.ps1
pip install -e . ruff mypy pytest
uvicorn drone_agent.app:app --host 0.0.0.0 --port 8010
```

## Supabase
See README Supabase quickstart. Apply migrations, then seeds.
