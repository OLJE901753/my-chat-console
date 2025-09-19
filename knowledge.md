# My Chat Console - Farm Management System

## Project Overview
A real-time farm management system with drone control, weather monitoring, and AI agents for agricultural operations.

## Architecture
- **Frontend**: React with TypeScript, Vite dev server (port 8081)
- **Backend**: Express.js server (port 3001) 
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Server-Sent Events (SSE)

## Key Components

### Dashboard
- `RealtimeDashboard.tsx`: Main dashboard with tabs for overview, drone, sensors, weather, agents, missions
- `WeatherDashboard.tsx`: Weather data display (previously Norwegian, now English)
- Real-time data updates via SSE

### Backend Services
- `SupabaseService`: Database operations with null safety guards
- SSE routes: Real-time data streaming
- Health checks and performance monitoring

## Development Setup
1. Install dependencies: `npm install`
2. Start backend: `npm start` (in server directory)
3. Start frontend: `npm run dev` (port 8081)

## Important Notes
- Frontend proxies API calls to backend via Vite config
- Supabase service has graceful degradation when not configured
- SSE routes are exempt from timeout and rate limiting
- All Norwegian text has been translated to English

## Environment Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for backend
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:8080)
- `PORT`: Backend port (default: 3001)

## Recent Changes
- **CRITICAL SECURITY FIX**: Removed dangerous GRANT ALL permissions, implemented proper RLS with least privilege
- **CORS Configuration**: Fixed default FRONTEND_URL from 8080 to 8081 to match development server
- **Real-time System**: Re-enabled telemetry routes and properly initialized SSE service
- **SSE Client Tracking**: Fixed heartbeat bug by replacing Set with Map for proper client management
- Translated dashboard from Norwegian to English
- Added proper null guards to SupabaseService methods
- Improved CORS handling for multiple origins
