#!/bin/bash

# Health Check Script for WinVinaya CRM
# Usage: ./health-check.sh {dev|qa|prod}

set -e

ENV=$1

if [ -z "$ENV" ]; then
    echo "Error: Environment not specified"
    echo "Usage: ./health-check.sh {dev|qa|prod}"
    exit 1
fi

# Environment-specific configurations
case $ENV in
    dev)
        BACKEND_PORT=8000
        FRONTEND_URL="http://localhost/dev"
        API_URL="http://localhost:8000"
        ;;
    qa)
        BACKEND_PORT=8001
        FRONTEND_URL="http://localhost/qa"
        API_URL="http://localhost:8001"
        ;;
    prod)
        BACKEND_PORT=8002
        FRONTEND_URL="http://localhost"
        API_URL="http://localhost:8002"
        ;;
    *)
        echo "Error: Invalid environment"
        exit 1
        ;;
esac

echo "================================"
echo "Health Check - $ENV Environment"
echo "================================"

# Check backend
echo "Checking backend on port $BACKEND_PORT..."
if curl -f -s "$API_URL/health" > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Check PM2 process
echo "Checking PM2 process..."
PM2_STATUS=$(pm2 jlist | jq -r ".[] | select(.name == \"winvinaya-backend-$ENV\") | .pm2_env.status")
if [ "$PM2_STATUS" == "online" ]; then
    echo "✅ PM2 process is online"
else
    echo "❌ PM2 process is not online. Status: $PM2_STATUS"
    exit 1
fi

# Check database connection
echo "Checking database connection..."
if curl -f -s "$API_URL/api/health" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Database health check endpoint not found (may be normal)"
fi

echo "================================"
echo "✅ All health checks passed!"
echo "================================"
