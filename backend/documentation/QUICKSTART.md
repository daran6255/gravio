# Quick Start Guide for Developers

This guide will help you set up the FastAPI boilerplate on your local machine **in under 10 minutes**.

> **For Production Deployment on Ubuntu/AWS**: See [DEPLOYMENT.md](DEPLOYMENT.md)

## Prerequisites

Before you start, make sure you have installed:

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/windows/)
- **Git** - [Download](https://git-scm.com/download/win)

## Step 1: Clone the Repository

```powershell
# Clone the repository
git clone <your-repo-url>
cd FastAPI

# Or if you already have the code
cd C:\External-projects\FastAPI
```

## Step 2: Automated Setup (Easiest)

Run the automated setup script:

```powershell
.\setup.ps1
```

This will:
- ✅ Create virtual environment
- ✅ Install all dependencies
- ✅ Create `.env` file from template
- ✅ Check if PostgreSQL is running

## Step 3: Configure Database

### 3.1 Create PostgreSQL Database

Open PowerShell and run:

```powershell
# Connect to PostgreSQL (will ask for postgres password)
psql -U postgres

# In the psql prompt, run these commands:
CREATE DATABASE fastapi_db;
CREATE USER fastapi_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE fastapi_db TO fastapi_user;
\q
```

**Note**: Remember the password you set - you'll need it in the next step!

### 3.2 Update Environment Variables

Edit the `.env` file (it was created by setup.ps1):

```env
# Update these lines:
POSTGRES_PASSWORD=your_password_here
SECRET_KEY=<run the command below to generate>
```

**Generate a secure SECRET_KEY:**

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and paste it as your `SECRET_KEY` in `.env`

## Step 4: Run Database Migrations

```powershell
# Activate virtual environment (if not already active)
.\venv\Scripts\activate

# Run migrations to create tables
alembic upgrade head
```

**Expected output:**
```
INFO  [alembic.runtime.migration] Running upgrade  -> eccedc755053, Create users table
```

## Step 5: Start the Application

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**You should see:**
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

## Step 6: Test the API

Open your browser and visit:
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

Or run the test script:

```powershell
.\test_app.ps1
```

---

## Manual Setup (Alternative)

If the automated script doesn't work, follow these steps:

### 1. Create Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\activate
```

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Create .env File

```powershell
copy .env.example .env
```

Then edit `.env` with your database credentials and secret key.

### 4. Run Migrations


#### Note
Now, when you change a column name (e.g., in app/models/activity_log.py), you can simply run:

```
alembic revision --autogenerate -m "renamed_column_x_to_y"
alembic upgrade head
``````

```powershell
alembic upgrade head
```

### 5. Start Server

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## Creating New Migrations

Whenever you modify database models, create a migration:

```powershell
# Generate migration automatically
alembic revision --autogenerate -m "Description of changes"

# Apply migration
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

---

## Daily Development Workflow

### Starting Work

```powershell
# Navigate to project
cd C:\External-projects\FastAPI

# Activate virtual environment
.\venv\Scripts\activate

# Pull latest changes
git pull

# Run any new migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### After Making Changes

```powershell
# If you modified models, create migration
alembic revision --autogenerate -m "Your changes description"

# Apply migration
alembic upgrade head

# Test your changes
.\test_app.ps1

# Commit changes
git add .
git commit -m "Your commit message"
git push
```

---

## Common Commands

### Database

```powershell
# Create new migration
alembic revision --autogenerate -m "message"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

# Reset to specific version
alembic downgrade <revision_id>
```

### Development

```powershell
# Run server with reload
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Run tests
pytest

# Run tests with coverage
pytest --cov=app tests/

# Format code (if you have black installed)
black app/

# Check code style
flake8 app/
```

---

## Project Structure Quick Reference

```
FastAPI/
├── app/
│   ├── api/v1/endpoints/     # Add your API endpoints here
│   ├── models/               # Add database models here
│   ├── schemas/              # Add Pydantic schemas here
│   ├── services/             # Add business logic here
│   └── repositories/         # Add data access here
├── alembic/versions/         # Database migrations
├── tests/                    # Add tests here
└── .env                      # Your local configuration
```

---

## Adding a New Feature (Example)

Let's say you want to add a "Products" feature:

### 1. Create Model

**File**: `app/models/product.py`

```python
from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel

class Product(BaseModel):
    __tablename__ = "products"
    
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
```

### 2. Create Schema

**File**: `app/schemas/product.py`

```python
from pydantic import BaseModel

class ProductCreate(BaseModel):
    name: str
    price: float
    description: str | None = None

class ProductResponse(ProductCreate):
    id: int
    
    class Config:
        from_attributes = True
```

### 3. Create Repository

**File**: `app/repositories/product_repository.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product
from app.repositories.base import BaseRepository

class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: AsyncSession):
        super().__init__(Product, db)
```

### 4. Create Service

**File**: `app/services/product_service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate

class ProductService:
    def __init__(self, db: AsyncSession):
        self.repository = ProductRepository(db)
    
    async def create_product(self, product_in: ProductCreate):
        return await self.repository.create(product_in.model_dump())
```

### 5. Create Endpoint

**File**: `app/api/v1/endpoints/products.py`

```python
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rate_limiter import rate_limit_medium
from app.schemas.product import ProductCreate, ProductResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/", response_model=ProductResponse)
@rate_limit_medium()
async def create_product(
    request: Request,
    product: ProductCreate,
    db: AsyncSession = Depends(get_db)
):
    service = ProductService(db)
    return await service.create_product(product)
```

### 6. Register Router

**File**: `app/api/v1/router.py`

```python
from app.api.v1.endpoints import auth, users, products  # Add products

router.include_router(products.router)  # Add this line
```

### 7. Create Migration

```powershell
alembic revision --autogenerate -m "Add products table"
alembic upgrade head
```

### 8. Test

Visit http://localhost:8000/docs and test your new endpoint!

---

## Troubleshooting

### Server won't start

```powershell
# Check if port 8000 is in use
Get-NetTCPConnection -LocalPort 8000

# Use different port if needed
uvicorn app.main:app --reload --port 8001
```

### Database connection errors

```powershell
# Check PostgreSQL is running
Get-Service -Name postgresql*

# Test connection manually
psql -U fastapi_user -d fastapi_db -h localhost
```

### Migration errors

```powershell
# Check current migration status
alembic current

# If migrations are out of sync, you might need to:
alembic downgrade base
alembic upgrade head
```

For more troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## Getting Help

1. **Check Documentation**:
   - [README.md](README.md) - Full documentation
   - [WINDOWS_SETUP.md](WINDOWS_SETUP.md) - Detailed Windows setup
   - [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

2. **API Documentation**: http://localhost:8000/docs (when running)

3. **Ask the Team**: Contact the lead developer if you're stuck

---

## Tips for Success

✅ Always activate virtual environment before working  
✅ Run `alembic upgrade head` after pulling changes  
✅ Create migrations after modifying models  
✅ Test your changes before committing  
✅ Follow the existing code structure  
✅ Add docstrings to your functions  
✅ Keep the API documentation up to date  

---

**Happy coding! 🚀**
