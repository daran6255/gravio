#!/bin/bash

# Backend Deployment Script for WinVinaya CRM
# Usage: ./backend-deploy.sh {dev|qa|prod}

set -e  # Exit on error

ENV=$1

if [ -z "$ENV" ]; then
    echo "❌ Error: Environment not specified"
    echo "Usage: ./backend-deploy.sh {dev|qa|prod}"
    exit 1
fi

# Environment-specific configurations
case $ENV in
    dev)
        PORT=8000
        APP_NAME="winvinaya-backend-dev"
        ENV_FILE="/var/www/winvinaya-crm/backend/.env.dev"
        ;;
    qa)
        PORT=8001
        APP_NAME="winvinaya-backend-qa"
        ENV_FILE="/var/www/winvinaya-crm/backend/.env.qa"
        ;;
    prod)
        PORT=8002
        APP_NAME="winvinaya-backend-prod"
        ENV_FILE="/var/www/winvinaya-crm/backend/.env.prod"
        ;;
    *)
        echo "❌ Error: Invalid environment. Use dev, qa, or prod"
        exit 1
        ;;
esac

echo "================================"
echo "🚀 Deploying Backend - $ENV"
echo "App:  $APP_NAME"
echo "Port: $PORT"
echo "================================"

cd /var/www/winvinaya-crm/backend

# Stop existing PM2 process safely
echo "🛑 Stopping existing PM2 process..."
pm2 stop $APP_NAME || true
pm2 delete $APP_NAME || true

# Create virtual environment if missing
if [ ! -d "venv-$ENV" ]; then
    echo "🐍 Creating virtual environment (venv-$ENV)..."
    python3.11 -m venv venv-$ENV
fi

# Activate virtual environment
source venv-$ENV/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Verify env file
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Env file not found: $ENV_FILE"
    exit 1
fi

# Load env vars for Alembic
echo "🗄️ Running database migrations..."
set -a
source <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | sed 's/\r$//')
set +a
alembic upgrade head

# Start backend using EXACT working PM2 command
echo "▶️ Starting backend with PM2..."
pm2 start venv-$ENV/bin/uvicorn \
    --name "$APP_NAME" \
    --interpreter none \
    -- app.main:app \
    --host 0.0.0.0 \
    --port "$PORT" \
    --env-file "$ENV_FILE"

# Persist PM2 processes
pm2 save

echo "================================"
echo "✅ Backend deployed successfully!"
echo "Process: $APP_NAME"
echo "Port:    $PORT"
echo "================================"

pm2 status "$APP_NAME"
