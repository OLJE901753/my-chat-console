#!/bin/bash

# Nordic Farm AI - Production Deployment Script
# This script deploys the entire Nordic Farm AI system to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE="config/production.env"

echo -e "${BLUE}🚀 Nordic Farm AI - Production Deployment${NC}"
echo -e "${BLUE}==========================================${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please do not run this script as root${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file $ENV_FILE not found${NC}"
    echo -e "${YELLOW}📝 Please create the environment file with your production settings${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-deployment checks...${NC}"

# Create necessary directories
echo -e "${BLUE}📁 Creating necessary directories...${NC}"
mkdir -p logs uploads temp monitoring/grafana/dashboards monitoring/grafana/datasources nginx/ssl

# Set proper permissions
echo -e "${BLUE}🔐 Setting permissions...${NC}"
chmod 755 logs uploads temp
chmod 600 config/production.env

# Backup existing data (if any)
if [ -d "backups" ]; then
    echo -e "${YELLOW}💾 Creating backup of existing data...${NC}"
    tar -czf "backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz" logs uploads temp
fi

# Pull latest images
echo -e "${BLUE}📥 Pulling latest Docker images...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE pull

# Build custom images
echo -e "${BLUE}🔨 Building custom Docker images...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache

# Stop existing services
echo -e "${YELLOW}🛑 Stopping existing services...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE down

# Start services
echo -e "${BLUE}🚀 Starting Nordic Farm AI services...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 30

# Health checks
echo -e "${BLUE}🏥 Performing health checks...${NC}"

# Check backend
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend service is healthy${NC}"
else
    echo -e "${RED}❌ Backend service is not responding${NC}"
fi

# Check content agent
if curl -f http://localhost:8030/v1/content/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Content Agent service is healthy${NC}"
else
    echo -e "${RED}❌ Content Agent service is not responding${NC}"
fi

# Check integration service
if curl -f http://localhost:8031/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Integration service is healthy${NC}"
else
    echo -e "${RED}❌ Integration service is not responding${NC}"
fi

# Check frontend
if curl -f http://localhost:8081 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend service is healthy${NC}"
else
    echo -e "${RED}❌ Frontend service is not responding${NC}"
fi

# Show running containers
echo -e "${BLUE}📊 Running containers:${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE ps

# Show logs
echo -e "${BLUE}📋 Recent logs:${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=20

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Access your application at: http://localhost${NC}"
echo -e "${BLUE}📊 Monitoring dashboard: http://localhost:3000${NC}"
echo -e "${BLUE}📈 Metrics: http://localhost:9090${NC}"

echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "1. Configure your domain name in nginx/nginx.conf"
echo -e "2. Set up SSL certificates in nginx/ssl/"
echo -e "3. Update environment variables in config/production.env"
echo -e "4. Set up monitoring alerts in Grafana"
echo -e "5. Configure backup schedules"

echo -e "${GREEN}🚀 Nordic Farm AI is now running in production!${NC}"
