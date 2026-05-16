# Quick Start Script for Windows
# Save this as: setup.ps1

Write-Host "FastAPI Boilerplate - Windows Quick Setup" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Check Python version
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Python not found. Please install Python 3.11+ from python.org" -ForegroundColor Red
    exit 1
}

# Create virtual environment
Write-Host ""
Write-Host "Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "Virtual environment already exists" -ForegroundColor Gray
} else {
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host ""
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Create .env file if it doesn't exist
Write-Host ""
Write-Host "Setting up environment file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host ".env file already exists" -ForegroundColor Gray
} else {
    Copy-Item .env.example .env
    Write-Host "✓ .env file created from template" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Edit .env file and update:" -ForegroundColor Cyan
    Write-Host "  - POSTGRES_PASSWORD (your PostgreSQL password)" -ForegroundColor Cyan
    Write-Host "  - SECRET_KEY (generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))')" -ForegroundColor Cyan
}

# Check PostgreSQL connection
Write-Host ""
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "! PostgreSQL is installed but not running" -ForegroundColor Yellow
        Write-Host "  Start it with: Start-Service $($pgService.Name)" -ForegroundColor Cyan
    }
} else {
    Write-Host "! PostgreSQL service not found" -ForegroundColor Yellow
    Write-Host "  Install from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
}

# Display next steps
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Configure .env file with your settings" -ForegroundColor White
Write-Host "2. Create database:" -ForegroundColor White
Write-Host "   psql -U postgres -c 'CREATE DATABASE fastapi_db;'" -ForegroundColor Gray
Write-Host "3. Run migrations:" -ForegroundColor White
Write-Host "   alembic upgrade head" -ForegroundColor Gray
Write-Host "4. Start the server:" -ForegroundColor White
Write-Host "   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000" -ForegroundColor Gray
Write-Host ""
Write-Host "For detailed instructions, see: WINDOWS_SETUP.md" -ForegroundColor Yellow
Write-Host ""
