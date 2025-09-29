# Nessa Farm AI

AI-powered farm management system for apple and pear orchards in Nessa, Norway. A learning platform combining modern AI techniques with instrumentation engineering expertise for precision agriculture.

## 🍎 Nessa Orchard Overview
**Location**: Nessa, Rogaland County, Norway (58.9°N, 5.7°E)  
**Crops**: Apple and pear varieties adapted to Norwegian fjord climate  
**Climate**: Mild coastal weather influenced by Gulf Stream  
**Growing Season**: March planting → July-October harvest  

## 🛠️ Technology Stack
- **Frontend**: React + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend**: Node.js (Express API + WebSocket) under `server/`
- **AI Platform**: Python 3.11 (CrewAI agents) under `farm_ai_crew/`
- **Database**: Supabase (Auth, PostgreSQL, Storage)
- **Real-time**: WebSocket for live data streaming
- **State Management**: TanStack Query for data fetching
- **Weather Data**: Norwegian Meteorological Institute (yr.no)
- **Location Services**: Norwegian coordinate system (UTM Zone 32N)
- **Drone Control**: Ryzr Tello Drone integration with real-time telemetry
- **Content Generation**: AI-powered video processing and social media posting
- **Social Media**: YouTube, Instagram, TikTok API integration

See `WORLD_CLASS_CONTEXT.md` and `docs/ARCHITECTURE.md` for context & diagrams.

## 🚁 MVP Farm System Features

### **Real-time Drone Control**
- **Ryzr Tello Drone Integration**: Direct control and telemetry
- **Mission Management**: Automated flight planning and execution
- **Live Video Streaming**: Real-time camera feeds and recording
- **Safety Systems**: Automated emergency procedures and geofencing

### **AI Content Generation**
- **Video Processing**: Automated clip extraction and optimization
- **Social Media Content**: Platform-specific captions and hashtags
- **Multi-platform Posting**: YouTube, Instagram, TikTok integration
- **Content Analytics**: Engagement scoring and optimal posting times

### **Sensor Network**
- **Real-time Data**: Temperature, humidity, soil moisture, pH monitoring
- **Weather Integration**: Netatmo weather station data
- **Data Persistence**: Complete Supabase integration
- **Historical Analytics**: Trend analysis and reporting

### **Camera Management**
- **Multi-camera Support**: IP camera integration
- **Live Feeds**: Real-time monitoring and recording
- **Event Logging**: Status changes and media events
- **Content Integration**: Direct feed to content generation

## Quickstart (Frontend)
```sh
pnpm i   # or npm i
pnpm dev # or npm run dev
```

## Quickstart (Backend)
```sh
cd server
npm i
npm start
```

## Quickstart (Content Agent)
```sh
cd services/agents/content-agent
pip install -r requirements.txt
python -m uvicorn content_agent.app:app --host 0.0.0.0 --port 8030
```

## Quickstart (Drone-Content Integration)
```sh
cd services/agents/drone-content-integration
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8031
```

## Quickstart (Python AI)
```powershell
py -3.11 -m venv .venv311
.\.venv311\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r farm_ai_crew/requirements_basic.txt
python -m farm_ai_crew.main --help
```

## 📱 Social Media Setup

The Content Agent can automatically post generated content to social media platforms. See `SOCIAL_MEDIA_SETUP.md` for detailed configuration instructions.

**Supported Platforms:**
- **YouTube**: Long-form videos and shorts
- **Instagram**: Photos and reels  
- **TikTok**: Short-form videos

**Quick Setup:**
1. Configure API credentials (see `SOCIAL_MEDIA_SETUP.md`)
2. Set environment variables
3. Test posting status: `curl http://localhost:8030/v1/content/posting-status`

## CI / Quality
- GitHub Actions CI: Node (typecheck/lint/build) and Python (ruff/mypy/pytest)
- Formatting: Prettier, `.editorconfig`
- Python lint/type: Ruff, mypy

## Prompts
Prompts for Manager/Frontend/DB live in `prompts/`.

## Supabase quickstart
```sh
# Install Supabase CLI
npm i -g supabase

# Start local stack (optional)
supabase start

# Apply migrations
supabase migration up --db-url "$SUPABASE_DB_URL" --dir infra/supabase/migrations

# Seed data
psql "$SUPABASE_DB_URL" -f infra/supabase/seeds/0001_seed.sql

# Storage: ensure private bucket exists (migration attempts to create)
# RLS is disabled for MVP; policies placeholders in infra/supabase/policies
```

## Architecture (Mermaid)
```mermaid
flowchart LR
  User[Owner/Worker]-->FE[React+Vite Dashboard]
  FE<-->BE[Node API / WebSocket]
  FE<-->Supabase[(Auth/DB/Storage)]
  BE<-->AI[AI Manager (FastAPI)]
  BE<-->Drone[Drone Agent]
  AI<-->Supabase
  Drone-->Media[Media Uploads]
```

## Scripts
| Script | Description |
|---|---|
| `pnpm dev` | Start frontend (Vite) |
| `pnpm build` | Build frontend |
| `pnpm preview` | Preview build |
| `pnpm typecheck` | TypeScript typecheck |
| `pnpm lint` | ESLint check |
| `pnpm test` | Vitest unit tests |

## Environment Variables (selected)
| Key | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase URL (frontend) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (frontend) |
| `VITE_API_BASE_URL` | Backend base URL |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN |
| `SENTRY_DSN` | AI Manager Sentry DSN |
| `OPENAI_API_KEY` | LLM provider key |
| `ANTHROPIC_API_KEY` | LLM provider key |
| `AI_PROVIDER_PRIMARY` | openai|anthropic |
| `AI_PROVIDER_FALLBACK` | openai|anthropic |

## FAQs
- Q: Why private routes only?  
  A: Dashboard is private for owner/workers per project scope.
- Q: Why WebSockets and not SSE?  
  A: WebSockets provide bidirectional communication for real-time drone control and data streaming.
- Q: Windows dev and Chroma issues?  
  A: JSON memory fallback included; enable Chroma later when toolchain is ready.