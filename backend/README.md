# FastAPI Production Boilerplate

A production-ready FastAPI boilerplate with PostgreSQL, Redis, API versioning, rate limiting, comprehensive logging, and monitoring.

## 🚀 Features

- **FastAPI Framework**: Modern, fast (high-performance) web framework
- **Database**: PostgreSQL with async SQLAlchemy ORM
- **Migrations**: Alembic for database version control
- **Authentication**: JWT-based auth with access and refresh tokens
- **Validation**: Pydantic v2 for request/response validation
- **Rate Limiting**: In-memory rate limiting (no Redis needed for development)
- **Logging**: Structured logging with Loguru (JSON/text formats)
- **API Versioning**: Organized with `/api/v1/` prefix pattern
- **Monitoring**: Health check endpoints and request tracking
- **Load Balancing**: Nginx reverse proxy configuration
- **Docker**: Complete containerization with docker-compose
- **Documentation**: Auto-generated OpenAPI (Swagger/ReDoc)
- **Security**: Password hashing, CORS, security headers
- **Windows Compatible**: Runs natively on Windows without Docker

## 📁 Project Structure

```
FastAPI/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── v1/                 # API version 1
│   │   │   ├── endpoints/      # Route handlers
│   │   │   └── router.py       # Main v1 router
│   │   └── deps.py             # Shared dependencies
│   ├── core/                   # Core functionality
│   │   ├── config.py           # Settings & configuration
│   │   ├── database.py         # Database setup
│   │   ├── logging.py          # Logging configuration
│   │   ├── rate_limiter.py     # Rate limiting
│   │   └── security.py         # Auth & security
│   ├── models/                 # SQLAlchemy models
│   ├── schemas/                # Pydantic schemas
│   ├── services/               # Business logic
│   ├── repositories/           # Data access layer
│   ├── middleware/             # Custom middleware
│   ├── utils/                  # Utility functions
│   └── main.py                 # Application entry
├── alembic/                    # Database migrations
├── nginx/                      # Nginx configuration
├── logs/                       # Application logs
├── tests/                      # Test suite
├── .env                        # Environment variables
├── docker-compose.yml          # Docker services
├── Dockerfile                  # App container
└── requirements.txt            # Python dependencies
```

## 🛠️ Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (optional, for production deployment)

**Note**: Redis is NOT required for local development. Rate limiting uses in-memory storage by default.

### Installation

1. **Clone the repository**
```bash
cd FastAPI
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

5. **Run locally without Docker**:
```bash
# Make sure PostgreSQL is running
# Run migrations
alembic upgrade head

# Start application
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Windows Users**: See [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for detailed Windows setup guide.

Or **run with Docker** (for production-like environment):
```bash
docker-compose up --build
```

6. **Access the application**
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

## 🔧 Configuration

All configuration is managed through environment variables in `.env`:

```env
# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=fastapi_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=fastapi_db

# Security
SECRET_KEY=your-secret-key-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=60
```

## 📊 Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## 🔐 Authentication

### Register a new user
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "SecurePass123",
    "full_name": "Test User"
  }'
```

### Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Use the access token
```bash
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer <your-access-token>"
```

## 🚦 Rate Limiting

Different endpoints have different rate limits:

- **Authentication**: 5 req/min, 20 req/hour
- **Standard API**: 60 req/min, 1000 req/hour
- **Custom limits** defined per endpoint

## 📝 Adding New Endpoints

1. **Create a new endpoint file** in `app/api/v1/endpoints/`:
```python
# app/api/v1/endpoints/products.py
from fastapi import APIRouter

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/")
async def get_products():
    return {"products": []}
```

2. **Add to router** in `app/api/v1/router.py`:
```python
from app.api.v1.endpoints import products

router.include_router(products.router)
```

3. **Create model** in `app/models/product.py`
4. **Create schema** in `app/schemas/product.py`
5. **Create repository** in `app/repositories/product_repository.py`
6. **Create service** in `app/services/product_service.py`

## 🧪 Testing

```bash
# Run all tests
pytest

# With coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_users.py
```

## 🐳 Docker Deployment

### Build and run all services
```bash
docker-compose up --build
```

### Run in detached mode
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f app
```

### Stop services
```bash
docker-compose down
```

### Production deployment
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📈 Monitoring & Logging

- **Logs Location**: `logs/app.log`
- **Log Format**: JSON (configurable to text)
- **Log Rotation**: 500 MB
- **Log Retention**: 30 days
- **Health Check**: `/health` endpoint
- **Request Tracking**: X-Request-ID header

## 🔒 Security Features

- **Password Hashing**: bcrypt
- **JWT Tokens**: Access (30 min) + Refresh (7 days)
- **CORS**: Configurable origins
- **Rate Limiting**: IP-based with Redis
- **Security Headers**: X-Frame-Options, CSP, etc.
- **SQL Injection Prevention**: SQLAlchemy ORM
- **Input Validation**: Pydantic models

## 🌐 Load Balancing

Nginx is configured as a reverse proxy with:
- Load balancing (least connections)
- Rate limiting at proxy level
- Gzip compression
- Security headers
- SSL/TLS support (configure certificates)

To scale horizontally, add more app instances in docker-compose and nginx.conf.

## 📚 API Documentation

Auto-generated documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🤝 Contributing

1. Create a new branch
2. Make your changes
3. Run tests
4. Submit a pull request

## 📄 License

MIT License

## 🙋 Support

For issues and questions, please create an issue in the repository.

---

Built with ❤️ using FastAPI
