# FastAPI Production-Grade Boilerplate

This plan outlines the creation of a scalable, production-ready FastAPI boilerplate designed to support ~90 APIs with best practices for database management, API versioning, monitoring, and deployment.

## User Review Required

> [!IMPORTANT]
> **Project Structure**: The boilerplate will use a layered architecture with clear separation between API routes, business logic, database models, and schemas. Please review the proposed structure below.

> [!IMPORTANT]
> **Database Migrations**: We'll use Alembic for database version control. Each model change will require creating a migration file. Is this approach acceptable?

> [!NOTE]
> **API Versioning**: APIs will be organized under `/api/v1/` prefix by default. Future versions can be added as `/api/v2/`, etc.

## Proposed Changes

### Project Root Structure

```
FastAPI/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Application entry point
│   ├── core/                   # Core configurations
│   │   ├── __init__.py
│   │   ├── config.py           # Settings management
│   │   ├── database.py         # Database connection
│   │   ├── logging.py          # Logging configuration
│   │   ├── security.py         # Security utilities
│   │   └── rate_limiter.py     # Rate limiting setup
│   ├── api/                    # API routes organized by version
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py       # Main v1 router
│   │   │   └── endpoints/      # All v1 endpoints
│   │   │       ├── __init__.py
│   │   │       ├── users.py
│   │   │       ├── auth.py
│   │   │       └── ...         # Other endpoint modules
│   │   └── deps.py             # Shared dependencies
│   ├── models/                 # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── base.py             # Base model class
│   │   ├── user.py
│   │   └── ...                 # Other model files
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── ...                 # Other schema files
│   ├── services/               # Business logic layer
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   └── ...
│   ├── repositories/           # Data access layer
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user_repository.py
│   │   └── ...
│   ├── middleware/             # Custom middleware
│   │   ├── __init__.py
│   │   ├── rate_limit.py
│   │   ├── logging.py
│   │   └── error_handler.py
│   └── utils/                  # Utility functions
│       ├── __init__.py
│       └── helpers.py
├── alembic/                    # Database migrations
│   ├── versions/
│   └── env.py
├── tests/                      # Test suite
│   ├── __init__.py
│   ├── conftest.py
│   ├── api/
│   └── unit/
├── logs/                       # Application logs
├── nginx/                      # Nginx configuration
│   └── nginx.conf
├── .env.example                # Environment variables template
├── .env                        # Actual environment variables (gitignored)
├── .gitignore
├── alembic.ini                 # Alembic configuration
├── docker-compose.yml          # Docker compose for local dev
├── Dockerfile                  # Application Dockerfile
├── requirements.txt            # Python dependencies
└── README.md                   # Project documentation
```

---

### Core Configuration

#### [NEW] [config.py](file:///c:/External-projects/FastAPI/app/core/config.py)
- Pydantic Settings for environment-based configuration
- Database URL, API settings, security configs
- Support for multiple environments (dev, staging, prod)

#### [NEW] [database.py](file:///c:/External-projects/FastAPI/app/core/database.py)
- SQLAlchemy async engine setup
- Session management with context managers
- PostgreSQL connection pooling

#### [NEW] [logging.py](file:///c:/External-projects/FastAPI/app/core/logging.py)
- Structured logging with JSON format
- Log rotation and file handlers
- Different log levels for different modules

#### [NEW] [rate_limiter.py](file:///c:/External-projects/FastAPI/app/core/rate_limiter.py)
- Redis-based rate limiting
- Configurable limits per endpoint
- IP-based and user-based limiting

#### [NEW] [security.py](file:///c:/External-projects/FastAPI/app/core/security.py)
- Password hashing utilities
- JWT token generation and validation
- API key validation

---

### Database Layer

#### [NEW] [models/base.py](file:///c:/External-projects/FastAPI/app/models/base.py)
- Base model class with common fields (id, created_at, updated_at)
- Soft delete functionality
- Timestamp mixins

#### [NEW] [models/user.py](file:///c:/External-projects/FastAPI/app/models/user.py)
- Example User model
- Relationships and indexes

#### [NEW] [alembic.ini](file:///c:/External-projects/FastAPI/alembic.ini)
- Alembic configuration for migrations
- Database URL configuration

#### [NEW] [alembic/env.py](file:///c:/External-projects/FastAPI/alembic/env.py)
- Migration environment setup
- Auto-generation support

---

### API Layer

#### [NEW] [main.py](file:///c:/External-projects/FastAPI/app/main.py)
- FastAPI application factory
- Middleware registration
- Router inclusion
- OpenAPI customization
- Startup/shutdown events
- Health check endpoints

#### [NEW] [api/v1/router.py](file:///c:/External-projects/FastAPI/app/api/v1/router.py)
- Main API v1 router
- Includes all v1 endpoint routers

#### [NEW] [api/v1/endpoints/users.py](file:///c:/External-projects/FastAPI/app/api/v1/endpoints/users.py)
- Example CRUD endpoints for users
- Demonstrates Pydantic validation
- Rate limiting applied

#### [NEW] [api/v1/endpoints/auth.py](file:///c:/External-projects/FastAPI/app/api/v1/endpoints/auth.py)
- Authentication endpoints (login, register, refresh token)
- JWT token handling

#### [NEW] [api/deps.py](file:///c:/External-projects/FastAPI/app/api/deps.py)
- Shared dependencies (database session, current user, etc.)

---

### Schemas & Validation

#### [NEW] [schemas/user.py](file:///c:/External-projects/FastAPI/app/schemas/user.py)
- Pydantic models for request/response validation
- UserCreate, UserUpdate, UserResponse schemas
- Custom validators

---

### Business Logic & Data Access

#### [NEW] [services/user_service.py](file:///c:/External-projects/FastAPI/app/services/user_service.py)
- Business logic for user operations
- Orchestrates repository calls

#### [NEW] [repositories/base.py](file:///c:/External-projects/FastAPI/app/repositories/base.py)
- Generic repository with CRUD operations
- Async database operations

#### [NEW] [repositories/user_repository.py](file:///c:/External-projects/FastAPI/app/repositories/user_repository.py)
- User-specific database queries
- Extends base repository

---

### Middleware

#### [NEW] [middleware/rate_limit.py](file:///c:/External-projects/FastAPI/app/middleware/rate_limit.py)
- Rate limiting middleware using slowapi
- Per-endpoint configuration

#### [NEW] [middleware/logging.py](file:///c:/External-projects/FastAPI/app/middleware/logging.py)
- Request/response logging
- Performance metrics

#### [NEW] [middleware/error_handler.py](file:///c:/External-projects/FastAPI/app/middleware/error_handler.py)
- Global exception handling
- Standardized error responses

---

### DevOps

#### [NEW] [Dockerfile](file:///c:/External-projects/FastAPI/Dockerfile)
- Multi-stage build for optimization
- Production-ready container

#### [NEW] [docker-compose.yml](file:///c:/External-projects/FastAPI/docker-compose.yml)
- FastAPI application
- PostgreSQL database
- Redis for rate limiting
- Nginx for load balancing

#### [NEW] [nginx/nginx.conf](file:///c:/External-projects/FastAPI/nginx/nginx.conf)
- Load balancing configuration
- SSL/TLS termination
- Gzip compression
- Rate limiting at nginx level

#### [NEW] [requirements.txt](file:///c:/External-projects/FastAPI/requirements.txt)
- Core dependencies:
  - fastapi
  - uvicorn[standard]
  - sqlalchemy[asyncio]
  - alembic
  - asyncpg (PostgreSQL driver)
  - pydantic[email]
  - python-jose[cryptography] (JWT)
  - passlib[bcrypt]
  - slowapi (rate limiting)
  - redis
  - python-multipart
  - aiofiles

---

### Documentation

#### [NEW] [README.md](file:///c:/External-projects/FastAPI/README.md)
- Project overview
- Quick start guide
- Environment setup
- API documentation link
- Development workflow
- Deployment instructions

#### [NEW] [.env.example](file:///c:/External-projects/FastAPI/.env.example)
- Template for environment variables
- Documentation for each variable

## Verification Plan

### Local Development Testing
1. **Environment Setup**:
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Setup database
   docker-compose up -d postgres redis
   
   # Run migrations
   alembic upgrade head
   ```

2. **Run Application**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Verify Features**:
   - Access OpenAPI docs at `http://localhost:8000/docs`
   - Test health check endpoint at `http://localhost:8000/health`
   - Verify API versioning with `/api/v1/` prefix
   - Test rate limiting by making multiple requests
   - Check logs are being written correctly

### Docker Deployment Testing
```bash
# Build and run with docker-compose
docker-compose up --build

# Verify all services are running
docker-compose ps

# Test load balancing through nginx
curl http://localhost/api/v1/health
```

### Database Migration Testing
```bash
# Create a new migration
alembic revision --autogenerate -m "test migration"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

### OpenAPI Documentation
- Verify Swagger UI at `/docs`
- Verify ReDoc at `/redoc`
- Check all endpoints are properly documented
- Ensure request/response schemas are visible
