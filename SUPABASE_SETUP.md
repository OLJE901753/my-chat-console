# Farm Management System - Supabase Setup Guide

## Overview
This system provides a secure, scalable database for managing farm operations including:
- **Sensors**: Soil moisture, temperature, humidity, wind, rainfall, solar radiation, air quality
- **Drones**: Autonomous flight control, mission management, GPS tracking
- **Weather Stations**: Real-time weather data collection and monitoring
- **Satellite Data**: NDVI, soil moisture, temperature, precipitation data
- **GPS Fencing**: Geofencing for drones and autonomous vehicles
- **Irrigation Systems**: Automated irrigation control and monitoring
- **Access Control**: Role-based user management (admin, manager, worker, viewer)

## Security Features
- **Row Level Security (RLS)**: Data access controlled by user roles
- **Role-based Access Control**: Different permissions for different user types
- **Audit Logging**: All access attempts are logged with IP addresses and user agents
- **PostGIS Integration**: Geographic data validation and spatial queries
- **JWT Authentication**: Secure token-based authentication

## Database Schema

### Core Tables
1. **users** - User management with role-based access
2. **farm_zones** - Geographic farm areas with crop information
3. **sensors** - IoT sensor devices and their locations
4. **sensor_readings** - Time-series sensor data
5. **drones** - Drone fleet management
6. **drone_missions** - Flight mission planning and execution
7. **weather_stations** - Weather monitoring stations
8. **weather_data** - Meteorological data collection
9. **satellite_data** - Satellite imagery and analysis data
10. **gps_fences** - Geographic boundaries and restrictions
11. **irrigation_zones** - Automated irrigation control
12. **access_logs** - Security audit trail

## Setup Instructions

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Initialize Supabase Project
```bash
supabase init
```

### 3. Start Local Development
```bash
supabase start
```

### 4. Apply Database Schema
```bash
supabase db reset
```

### 5. Environment Variables
Create a `.env` file in your project root:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

### 6. Production Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key
3. Update environment variables with production values
4. Run migrations: `supabase db push`

## User Roles & Permissions

### Admin
- Full access to all data and systems
- User management
- System configuration
- Access to audit logs

### Manager
- Farm zone management
- Weather station configuration
- GPS fence management
- Satellite data management
- View all sensor and drone data

### Worker
- Sensor data collection
- Drone operation
- Irrigation control
- View relevant farm data

### Viewer
- Read-only access to farm data
- No modification capabilities

## Geographic Data Management

### PostGIS Integration
- All location data stored as WGS84 coordinates
- Spatial queries for proximity and containment
- Automatic validation of geographic boundaries
- Efficient spatial indexing for performance

### GPS Fencing
- Define no-fly zones for drones
- Restrict autonomous vehicle access
- Monitor equipment location compliance
- Real-time boundary violation detection

## Data Collection & Integration

### IoT Sensors
- Real-time data streaming
- Quality scoring for data validation
- Battery level monitoring
- Automatic status updates

### Drone Operations
- Mission planning and execution
- Flight path tracking
- Battery management
- Safety zone enforcement

### Weather Integration
- Multi-station data aggregation
- Historical trend analysis
- Predictive modeling support
- Crop-specific weather alerts

## API Endpoints

The system provides RESTful API endpoints for:
- User authentication and management
- Sensor data retrieval and submission
- Drone mission control
- Weather data access
- Geographic boundary management
- Irrigation system control

## Monitoring & Alerts

### System Health
- Sensor status monitoring
- Drone fleet health
- Weather station connectivity
- Database performance metrics

### Security Monitoring
- Failed authentication attempts
- Unauthorized access attempts
- Suspicious IP addresses
- User activity patterns

## Performance Optimization

### Database Indexes
- Spatial indexes for geographic queries
- Time-series indexes for sensor data
- Composite indexes for complex queries
- Automatic query optimization

### Data Retention
- Configurable data retention policies
- Automatic archiving of historical data
- Efficient storage of time-series data
- Compression for long-term storage

## Backup & Recovery

### Automated Backups
- Daily database backups
- Point-in-time recovery capability
- Geographic redundancy
- Disaster recovery procedures

### Data Export
- CSV/JSON export capabilities
- API-based data access
- Real-time data streaming
- Batch processing support

## Compliance & Privacy

### Data Protection
- GDPR compliance considerations
- Data encryption at rest and in transit
- Access control and audit trails
- Privacy-by-design architecture

### Regulatory Compliance
- Agricultural data standards
- Environmental monitoring requirements
- Safety and security regulations
- Industry best practices

## Support & Maintenance

### Documentation
- API reference documentation
- User guides and tutorials
- System architecture diagrams
- Troubleshooting guides

### Updates & Patches
- Regular security updates
- Feature enhancements
- Performance improvements
- Bug fixes and stability updates

## Next Steps

1. **Set up your Supabase project** using the provided schema
2. **Configure your environment variables** with your project credentials
3. **Test the authentication system** with different user roles
4. **Integrate your IoT devices** using the sensor APIs
5. **Set up your drone fleet** with GPS fencing and mission control
6. **Configure weather stations** for environmental monitoring
7. **Implement real-time alerts** for critical conditions
8. **Set up automated reporting** for farm operations

## Contact & Support

For technical support or questions about the system architecture, please refer to the project documentation or contact the development team.
