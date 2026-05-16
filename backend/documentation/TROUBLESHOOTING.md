# Troubleshooting Common Startup Errors

## Error: "error parsing value for field BACKEND_CORS_ORIGINS"

**Problem**: This occurs when the `.env` file has CORS origins in the wrong format.

**Solution**:
In your `.env` file, make sure `BACKEND_CORS_ORIGINS` is formatted as comma-separated values without quotes:

```env
# ✅ CORRECT - comma-separated, no quotes
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# ❌ WRONG - don't use brackets or quotes
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]

# ✅ ALSO CORRECT - leave empty if no CORS needed
BACKEND_CORS_ORIGINS=

# ✅ ALSO CORRECT - comment out if not needed
# BACKEND_CORS_ORIGINS=http://localhost:3000
```

---

## Error: "No module named 'app'"

**Problem**: Python can't find the app module.

**Solution**:
```powershell
# Make sure you're in the project root
cd C:\External-projects\FastAPI

# Make sure virtual environment is activated
.\venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```

---

## Error: PostgreSQL Connection Refused

**Problem**: Can't connect to PostgreSQL database.

**Solutions**:

1. **Check PostgreSQL is running**:
```powershell
Get-Service -Name postgresql*
```

2. **Start PostgreSQL if stopped**:
```powershell
Start-Service postgresql-x64-15  # Adjust version number
```

3. **Verify credentials in `.env`**:
```env
POSTGRES_SERVER=localhost
POSTGRES_USER=fastapi_user
POSTGRES_PASSWORD=your_actual_password
POSTGRES_DB=fastapi_db
POSTGRES_PORT=5432
```

4. **Test connection manually**:
```powershell
psql -U fastapi_user -d fastapi_db -h localhost
```

---

## Error: "SECRET_KEY is required"

**Problem**: SECRET_KEY not set in `.env` file.

**Solution**:
Generate a secure secret key:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add to `.env`:
```env
SECRET_KEY=your_generated_secret_key_here
```

---

## Error: "alembic.util.exc.CommandError: Can't locate revision identified by"

**Problem**: Database migration issues.

**Solutions**:

1. **Drop and recreate database** (DEVELOPMENT ONLY):
```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql:
DROP DATABASE fastapi_db;
CREATE DATABASE fastapi_db;
GRANT ALL PRIVILEGES ON DATABASE fastapi_db TO fastapi_user;
\q
```

2. **Recreate migrations**:
```powershell
# Delete old migrations
Remove-Item -Recurse -Force alembic\versions\*

# Create new migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

---

## Error: Port 8000 Already in Use

**Problem**: Another process is using port 8000.

**Solutions**:

1. **Find and kill the process**:
```powershell
# Find process using port 8000
Get-NetTCPConnection -LocalPort 8000 | Select-Object -Property OwningProcess

# Kill the process (replace PID with actual process ID)
Stop-Process -Id PID -Force
```

2. **Or use a different port**:
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

---

## Error: "ImportError: cannot import name 'X'"

**Problem**: Missing or incompatible dependencies.

**Solution**:
```powershell
# Activate virtual environment
.\venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Reinstall all dependencies
pip install -r requirements.txt --force-reinstall
```

---

## Server Starts But Shows Errors in Logs

**Check the logs**:
```powershell
# View logs
Get-Content logs\app.log -Tail 50

# Or monitor in real-time
Get-Content logs\app.log -Wait
```

---

## Application Won't Reload on File Changes

**Problem**: Auto-reload not working in Windows.

**Solutions**:

1. **Use polling instead of watchfiles**:
```powershell
uvicorn app.main:app --reload --reload-dir app --host 127.0.0.1 --port 8000
```

2. **Or specify watch directories**:
```powershell
uvicorn app.main:app --reload --reload-include '*.py' --host 127.0.0.1 --port 8000
```

---

## Testing After Fixes

Once you've fixed the issue, test with:

```powershell
# 1. Test health endpoint
Invoke-RestMethod -Uri http://localhost:8000/health

# 2. Check API docs
Start-Process http://localhost:8000/docs

# 3. Test user registration
$body = @{
    email = "test@example.com"
    username = "testuser"
    password = "TestPass123"
    full_name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8000/api/v1/auth/register -Method Post -Body $body -ContentType "application/json"
```

---

## Still Having Issues?

1. **Check Python version**: Must be 3.11+
   ```powershell
   python --version
   ```

2. **Check virtual environment**:
   ```powershell
   # Should show venv path
   Get-Command python | Select-Object Source
   ```

3. **Check all environment variables are set**:
   ```powershell
   Get-Content .env
   ```

4. **Try running without reload**:
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

5. **Check for syntax errors**:
   ```powershell
   python -m py_compile app\main.py
   ```

---

## Quick Reset (Development Only)

If all else fails, complete reset:

```powershell
# 1. Deactivate venv
deactivate

# 2. Delete virtual environment
Remove-Item -Recurse -Force venv

# 3. Recreate from scratch
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# 4. Reset database
psql -U postgres -c "DROP DATABASE IF EXISTS fastapi_db;"
psql -U postgres -c "CREATE DATABASE fastapi_db;"

# 5. Run migrations
alembic upgrade head

# 6. Start server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## Need More Help?

- Check the main [README.md](README.md)
- See [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for detailed setup
- Review API documentation at http://localhost:8000/docs (when running)
