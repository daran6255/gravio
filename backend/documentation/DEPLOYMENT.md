# Ubuntu/Linux Deployment Guide

This guide covers deploying the FastAPI application on Ubuntu (AWS EC2 or any Linux server).

## Prerequisites

- Ubuntu 20.04+ (or Debian-based Linux)
- SSH access to server
- Domain name (optional, for production)

---

## Quick Deployment with Docker

### Step 1: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Logout and login again for group changes to take effect
```

### Step 2: Clone Repository

```bash
# Install git if not present
sudo apt install git -y

# Clone your repository
git clone <your-repo-url>
cd FastAPI
```

### Step 3: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with your production settings
nano .env
```

**Important production settings:**
```env
# Change these for production!
DEBUG=False
ENVIRONMENT=production
SECRET_KEY=<generate-a-long-random-string>
POSTGRES_PASSWORD=<strong-password>

# For production CORS
BACKEND_CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Step 4: Start Services

```bash
# Start all services (app, postgres, redis, nginx)
docker-compose up -d

# Check if all containers are running
docker-compose ps

# View logs
docker-compose logs -f app
```

### Step 5: Run Migrations

```bash
# Run migrations inside the app container
docker-compose exec app alembic upgrade head
```

### Step 6: Access Your Application

- **With Domain**: http://yourdomain.com
- **With IP**: http://your-server-ip
- **API Docs**: http://your-server-ip/docs

---

## Manual Deployment (Without Docker)

### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y
```

### Step 2: Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE fastapi_db;
CREATE USER fastapi_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE fastapi_db TO fastapi_user;
\q
```

### Step 3: Clone and Setup Application

```bash
# Clone repository
git clone <your-repo-url>
cd FastAPI

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env
```

### Step 4: Run Migrations

```bash
source venv/bin/activate
alembic upgrade head
```

### Step 5: Setup Systemd Service

Create service file:

```bash
sudo nano /etc/systemd/system/fastapi.service
```

Add this content:

```ini
[Unit]
Description=FastAPI Application
After=network.target

[Service]
Type=notify
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/FastAPI
Environment="PATH=/home/ubuntu/FastAPI/venv/bin"
ExecStart=/home/ubuntu/FastAPI/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

[Install]
WantedBy=multi-user.target
```

Enable and start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable fastapi
sudo systemctl start fastapi
sudo systemctl status fastapi
```

### Step 6: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/fastapi
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/fastapi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## AWS EC2 Specific Setup

### Step 1: Launch EC2 Instance

1. Go to AWS EC2 Console
2. Launch Instance:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.micro (free tier) or t2.small
   - **Storage**: 20 GB minimum
   - **Security Group**: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

### Step 2: Connect to Instance

```bash
# From your local machine
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

### Step 3: Follow Docker or Manual Deployment

Choose either Docker (recommended) or Manual deployment from above.

### Step 4: Point Domain to EC2

1. Get your EC2 public IP
2. In your domain registrar (GoDaddy, Namecheap, etc.):
   - Create an **A record** pointing to your EC2 IP
   - Example: `api.yourdomain.com` → `3.15.XX.XXX`

### Step 5: Setup SSL (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (with Nginx)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot will automatically update your Nginx config to use HTTPS.

---

## Production Best Practices

### 1. Environment Variables

Never commit `.env` to git. Use AWS Secrets Manager or environment variables:

```bash
# Set environment variables
export SECRET_KEY="your-secret-key"
export DATABASE_URL="postgresql://..."
```

### 2. Database Backups

```bash
# Backup PostgreSQL
sudo -u postgres pg_dump fastapi_db > backup_$(date +%Y%m%d).sql

# Restore
sudo -u postgres psql fastapi_db < backup_20231208.sql
```

Setup automated backups with cron:

```bash
crontab -e

# Add this line (backup daily at 2 AM)
0 2 * * * sudo -u postgres pg_dump fastapi_db > /home/ubuntu/backups/backup_$(date +\%Y\%m\%d).sql
```

### 3. Log Rotation

Logs are already configured with rotation in the app. For system logs:

```bash
sudo nano /etc/logrotate.d/fastapi
```

Add:

```
/var/log/fastapi/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
```

### 4. Monitoring

```bash
# Check app status
sudo systemctl status fastapi

# View logs
sudo journalctl -u fastapi -f

# Check resource usage
htop

# With Docker
docker stats
docker-compose logs -f app
```

### 5. Security

```bash
# Update packages regularly
sudo apt update && sudo apt upgrade -y

# Setup firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

---

## Updating the Application

### With Docker

```bash
cd FastAPI
git pull
docker-compose down
docker-compose up -d --build
docker-compose exec app alembic upgrade head
```

### Manual Deployment

```bash
cd FastAPI
git pull
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart fastapi
```

---

## Scaling

### Horizontal Scaling (Multiple Instances)

1. **Use Load Balancer**: AWS ALB or Nginx
2. **Shared Database**: Single PostgreSQL instance
3. **Enable Redis**: For shared rate limiting
4. **Session Storage**: Use Redis or database

### Vertical Scaling

Upgrade EC2 instance type:
- t2.micro → t2.small → t2.medium
- Or use t3/t3a instances for better performance

---

## CI/CD Setup (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        env:
          PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
          HOST: ${{ secrets.EC2_HOST }}
          USER: ubuntu
        run: |
          echo "$PRIVATE_KEY" > private_key && chmod 600 private_key
          ssh -o StrictHostKeyChecking=no -i private_key ${USER}@${HOST} '
            cd /home/ubuntu/FastAPI &&
            git pull &&
            docker-compose down &&
            docker-compose up -d --build &&
            docker-compose exec -T app alembic upgrade head
          '
```

---

## Troubleshooting

### Application won't start

```bash
# Check logs
sudo journalctl -u fastapi -n 50
docker-compose logs app

# Check if port is in use
sudo lsof -i :8000

# Restart services
sudo systemctl restart fastapi
docker-compose restart app
```

### Database connection issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U fastapi_user -d fastapi_db

# Check firewall
sudo ufw status
```

### Nginx errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

---

## Cost Optimization (AWS)

1. **Use Reserved Instances** for long-term savings
2. **Stop instances** when not needed (dev/staging)
3. **Use t3/t4g (ARM)** instances for better cost/performance
4. **Setup Auto Scaling** based on CPU usage
5. **Use RDS** for managed database (no backup management)

---

## Summary Checklist

- [ ] Server setup (EC2 or Ubuntu)
- [ ] Docker installed (or Python + PostgreSQL)
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] Database created
- [ ] Migrations applied
- [ ] Application running
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Domain pointing to server
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Firewall enabled

---

**Your application is now production-ready on Ubuntu! 🚀**
