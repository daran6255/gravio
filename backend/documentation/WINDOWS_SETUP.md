# Windows Development Setup Guide

This guide will help you set up and run the FastAPI boilerplate on Windows **without Docker**.

## Prerequisites

- **Python 3.11+** - [Download from python.org](https://www.python.org/downloads/)
- **PostgreSQL 15+** - [Download from postgresql.org](https://www.postgresql.org/download/windows/)
- **Git** - [Download from git-scm.com](https://git-scm.com/download/win)

## Step-by-Step Setup

### 1. Install Python

```powershell
# Verify Python installation
python --version
# Should show Python 3.11 or higher

# Verify pip
pip --version
```

### 2. Install PostgreSQL

1. Download and install PostgreSQL from the official website
2. During installation:
   - Remember the password you set for the `postgres` user
   - Default port is `5432`
   - Install pgAdmin 4 (optional, for GUI database management)

3. Create a database for the project:

```powershell
# Open PowerShell and connect to PostgreSQL
psql -U postgres

# In psql, run:
CREATE DATABASE fastapi_db;
CREATE USER fastapi_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE fastapi_db TO fastapi_user;
\q
```

### 3. Clone and Setup Project

```powershell
# Navigate to your projects folder
cd c:\External-projects\FastAPI

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy the example environment file:

```powershell
copy .env.example .env
```

Edit `.env` with your settings (use Notepad, VS Code, or any text editor):

```env
# Database Configuration
POSTGRES_SERVER=localhost
POSTGRES_USER=fastapi_user
POSTGRES_PASSWORD=your_password_here
POSTGRES_DB=fastapi_db
POSTGRES_PORT=5432

# Security - Generate a new secret key
SECRET_KEY=your-super-secret-key-change-this-min-32-chars

# Other settings (defaults are fine for development)
DEBUG=True
ENVIRONMENT=development
```

**Generate a secure SECRET_KEY:**

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5. Run Database Migrations

```powershell
# Make sure virtual environment is activated
.\venv\Scripts\activate

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 6. Run the Application

```powershell
# Start the server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Or using Python directly
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The application will be available at:
- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### 7. Test the API

**PowerShell commands:**

```powershell
# Health check
Invoke-RestMethod -Uri http://localhost:8000/health

# Register a user
$body = @{
    email = "test@example.com"
    username = "testuser"
    password = "TestPass123"
    full_name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8000/api/v1/auth/register -Method Post -Body $body -ContentType "application/json"

# Login
$loginBody = @{
    email = "test@example.com"
    password = "TestPass123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:8000/api/v1/auth/login -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.access_token

# Get current user
$headers = @{
    Authorization = "Bearer $token"
}
Invoke-RestMethod -Uri http://localhost:8000/api/v1/users/me -Headers $headers
```

## Common Issues and Solutions

### Issue 1: Port Already in Use

If port 8000 is already in use:

```powershell
# Use a different port
uvicorn app.main:app --reload --port 8001
```

### Issue 2: PostgreSQL Connection Error

- Verify PostgreSQL service is running:
  ```powershell
  # Check services
  Get-Service -Name postgresql*
  
  # Start if not running
  Start-Service postgresql-x64-15  # Replace with your version
  ```

- Verify credentials in `.env` file
- Check if PostgreSQL is listening on port 5432

### Issue 3: Module Not Found

If you get import errors:

```powershell
# Make sure you're in the virtual environment
.\venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue 4: Alembic Migration Errors

```powershell
# Reset migrations (DEVELOPMENT ONLY)
alembic downgrade base
alembic upgrade head

# Or delete the database and recreate
# dropdb fastapi_db
# createdb fastapi_db
```

## Development Workflow

### Activating Virtual Environment

Every time you open a new terminal:

```powershell
cd c:\External-projects\FastAPI
.\venv\Scripts\activate
```

### Running Tests

```powershell
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/api/test_auth.py
```

### Creating New Migrations

After modifying models:

```powershell
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Code Formatting (Optional)

```powershell
# Install dev dependencies
pip install black isort

# Format code
black app/
isort app/
```

## IDE Setup

### VS Code

Recommended extensions:
- Python
- Pylance
- Python Test Explorer
- Python Docstring Generator

**Settings for VS Code** (`.vscode/settings.json`):

```json
{
    "python.defaultInterpreterPath": "${workspaceFolder}\\venv\\Scripts\\python.exe",
    "python.linting.enabled": true,
    "python.linting.pylintEnabled": false,
    "python.linting.flake8Enabled": true,
    "python.formatting.provider": "black",
    "python.testing.pytestEnabled": true,
    "python.testing.unittestEnabled": false,
    "editor.formatOnSave": true
}
```

### PyCharm

1. Open the project
2. File > Settings > Project > Python Interpreter
3. Add Interpreter > Existing Environment
4. Select `C:\External-projects\FastAPI\venv\Scripts\python.exe`

## Performance Tips for Windows

1. **Use SSD** - Store the project on an SSD drive for better performance
2. **Windows Defender** - Add virtual environment folder to exclusions
3. **Use PowerShell 7** - Better performance than Windows PowerShell 5

## Deployment to AWS EC2 (Ubuntu)

When you're ready to deploy to Ubuntu:

1. Use the Docker setup provided in the project
2. Redis will be available in the docker-compose setup
3. The application works the same way on Ubuntu

```bash
# On Ubuntu EC2
git clone your-repo
cd FastAPI
docker-compose up -d
```

## Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **SQLAlchemy Documentation**: https://docs.sqlalchemy.org/
- **Alembic Documentation**: https://alembic.sqlalchemy.org/
- **PostgreSQL Windows Guide**: https://www.postgresql.org/docs/current/tutorial-install.html

## Need Help?

- Check the main [README.md](README.md) for general information
- Review the API documentation at http://localhost:8000/docs
- Check the logs in the `logs/` directory

---

**Happy Development! 🚀**
