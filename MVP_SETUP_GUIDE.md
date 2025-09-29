# MVP Farm System Setup Guide

Complete setup guide for the Nessa Farm AI MVP system with drone control, content generation, and social media posting.

## 🚀 System Overview

The MVP Farm System includes:
- **Real-time Drone Control** (Ryzr Tello)
- **AI Content Generation** (Video processing + Social media)
- **Sensor Network** (Weather, soil, environmental data)
- **Camera Management** (Multi-camera feeds)
- **Data Persistence** (Supabase integration)

## 📋 Prerequisites

### Hardware Requirements
- **Ryzr Tello Drone** (for drone functionality)
- **Soil Sensors** (for environmental monitoring)
- **IP Cameras** (for video feeds)
- **Netatmo Weather Station** (optional, for weather data)

### Software Requirements
- **Node.js** 18+ (for backend)
- **Python** 3.11+ (for AI agents)
- **Supabase Account** (for database)
- **Social Media API Access** (YouTube, Instagram, TikTok)

## 🔧 Installation Steps

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-username/my-chat-console.git
cd my-chat-console

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..

# Install Python dependencies
cd services/agents/content-agent
pip install -r requirements.txt
cd ../drone-content-integration
pip install -r requirements.txt
cd ../..
```

### 2. Configure Supabase

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key

2. **Run Database Migrations:**
   ```sql
   -- Run these SQL commands in your Supabase SQL Editor
   -- (See supabase/migrations/ for all migration files)
   ```

3. **Set Environment Variables:**
   ```bash
   # Create .env file in project root
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Configure Social Media APIs

See `SOCIAL_MEDIA_SETUP.md` for detailed instructions.

**Quick Setup:**
```bash
# YouTube
export YOUTUBE_CREDENTIALS_PATH="credentials/youtube_credentials.json"
export YOUTUBE_TOKEN_PATH="credentials/youtube_token.json"

# Instagram
export INSTAGRAM_ACCESS_TOKEN="your_instagram_token"

# TikTok
export TIKTOK_ACCESS_TOKEN="your_tiktok_token"
```

### 4. Configure Weather Data (Optional)

```bash
# Netatmo Weather Station
export NETATMO_CLIENT_ID="your_netatmo_client_id"
export NETATMO_CLIENT_SECRET="your_netatmo_client_secret"
export NETATMO_USERNAME="your_netatmo_username"
export NETATMO_PASSWORD="your_netatmo_password"
export NETATMO_DEVICE_ID="your_device_id"
```

## 🚀 Starting the System

### Start All Services

**Terminal 1 - Frontend:**
```bash
npm run dev
# Runs on http://localhost:8081
```

**Terminal 2 - Backend:**
```bash
cd server
npm start
# Runs on http://localhost:3001
```

**Terminal 3 - Content Agent:**
```bash
cd services/agents/content-agent
python -m uvicorn content_agent.app:app --host 0.0.0.0 --port 8030
# Runs on http://localhost:8030
```

**Terminal 4 - Drone-Content Integration:**
```bash
cd services/agents/drone-content-integration
python -m uvicorn app:app --host 0.0.0.0 --port 8031
# Runs on http://localhost:8031
```

### Verify System Status

```bash
# Check all services
curl http://localhost:3001/health
curl http://localhost:8030/v1/content/health
curl http://localhost:8031/health

# Check social media posting status
curl http://localhost:8030/v1/content/posting-status
```

## 🚁 Drone Setup

### 1. Connect Tello Drone

1. **Power on the Tello drone**
2. **Connect to Tello WiFi** (usually "TELLO-XXXXXX")
3. **Open the dashboard** at http://localhost:8081
4. **Go to Drone Control tab**
5. **Click "Connect"** - the system will automatically detect the drone

### 2. Test Drone Functions

- **Basic Control**: Take off, land, move
- **Mission Planning**: Create automated flight paths
- **Video Recording**: Start/stop recording
- **Telemetry**: Monitor battery, altitude, position

## 📊 Sensor Integration

### 1. Add Soil Sensors

Send sensor data via API:
```bash
curl -X POST http://localhost:3001/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_type": "soil_moisture",
    "location": "Field A",
    "moisture": 45,
    "ph": 6.8,
    "temperature": 22.5
  }'
```

### 2. Add IP Cameras

```bash
curl -X POST http://localhost:3001/api/cameras \
  -H "Content-Type: application/json" \
  -d '{
    "cameraId": "field_camera_1",
    "name": "Field Camera 1",
    "type": "ip_camera",
    "streamUrl": "rtsp://192.168.1.100:554/stream"
  }'
```

## 📱 Content Generation Workflow

### 1. Record Drone Video
- Use the drone control interface
- Plan and execute a mission
- Record video during flight

### 2. Process Video
- Video is automatically processed by the Content Agent
- Generates platform-specific clips (YouTube, Instagram, TikTok)
- Creates captions and hashtags

### 3. Post to Social Media
- Content is automatically posted to configured platforms
- Check posting status in the dashboard
- Monitor engagement metrics

## 🔍 Monitoring and Analytics

### Dashboard Features
- **Real-time Data**: Live sensor readings and drone telemetry
- **Mission Management**: Create and execute drone missions
- **Content Preview**: View generated social media content
- **Camera Feeds**: Monitor multiple camera streams
- **Analytics**: Historical data and trends

### Data Persistence
- All data is automatically saved to Supabase
- Historical analysis available
- Export capabilities for reporting

## 🛠️ Troubleshooting

### Common Issues

**Drone Not Connecting:**
- Check WiFi connection to Tello
- Ensure drone is powered on
- Try restarting the backend service

**Social Media Posting Failing:**
- Verify API credentials are set
- Check posting status: `curl http://localhost:8030/v1/content/posting-status`
- Review logs for specific errors

**Sensor Data Not Appearing:**
- Check sensor API endpoint
- Verify data format matches expected schema
- Check Supabase connection

**Camera Feeds Not Working:**
- Verify camera IP addresses and RTSP URLs
- Check network connectivity
- Ensure cameras support RTSP protocol

### Logs and Debugging

```bash
# Backend logs
cd server
npm start

# Content Agent logs
cd services/agents/content-agent
python -m uvicorn content_agent.app:app --host 0.0.0.0 --port 8030

# Check Supabase data
# Go to your Supabase dashboard → Table Editor
```

## 📈 Scaling and Production

### Production Deployment
- Use Docker containers for all services
- Set up proper environment variable management
- Configure monitoring and alerting
- Set up automated backups

### Adding More Devices
- **Multiple Drones**: The system supports up to 10 drones
- **Sensor Networks**: Add up to 100 sensors
- **Camera Arrays**: Support for up to 30 cameras
- **Weather Stations**: Up to 5 weather stations

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review service logs for error messages
3. Verify all environment variables are set correctly
4. Test individual services independently
5. Check Supabase dashboard for data persistence issues

## 📚 Additional Documentation

- `SOCIAL_MEDIA_SETUP.md` - Social media API configuration
- `supabase/migrations/` - Database schema migrations
- `services/agents/` - AI agent documentation
- `server/src/` - Backend API documentation
