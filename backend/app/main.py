"""FastAPI Application - Main Entry Point"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.middleware.logging import setup_logging, LoggingMiddleware
from app.core.database import init_db, close_db, get_db
from app.core.rate_limiter import limiter
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.timezone import TimezoneMiddleware
from app.middleware.garbage_collector import GarbageCollectorMiddleware, memory_monitor_task
from app.services.reminder_scheduler import reminder_check_task
from app.api.v1.router import router as v1_router
from loguru import logger
from fastapi.exceptions import RequestValidationError

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting up application...")
    setup_logging()
    
    # Start memory monitoring background task
    import asyncio
    monitor_task = asyncio.create_task(memory_monitor_task(interval_seconds=60))

    # Start the CRM reminder scheduler background task
    reminder_task = asyncio.create_task(reminder_check_task(interval_seconds=60))

    # You can uncomment this to create tables on startup (not recommended for production)
    # await init_db()
    # logger.info("Database initialized")
    
    logger.info(f"Application started - Environment: {settings.ENVIRONMENT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    
    # Cancel memory monitor task
    monitor_task.cancel()
    try:
        await monitor_task
    except asyncio.CancelledError:
        pass

    # Cancel reminder scheduler task
    reminder_task.cancel()
    try:
        await reminder_task
    except asyncio.CancelledError:
        pass

    await close_db()
    logger.info("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Gravit backend engine with multi-tenancy, rate limiting, and integrated AI Brain.",
    docs_url="/docs",
    redoc_url=None,  # Disable default ReDoc, we'll create custom one
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation Error for {request.url}: {exc.errors()}")
    # Re-raise to let default handler return 422, or return JSON response
    # We just want to log here
    return await request_validation_exception_handler(request, exc)

from fastapi.exception_handlers import request_validation_exception_handler


# Middleware order matters: Starlette wraps middleware in the *reverse* of the
# order they're added here, so the middleware added LAST ends up OUTERMOST.
# ErrorHandlerMiddleware converts raised AppErrors (UnauthorizedError,
# BadRequestError, etc.) into a fresh JSONResponse — any middleware still
# INSIDE it (i.e. added before it) never sees that response, since it wasn't
# produced via a normal call_next() return, it came from ErrorHandler's own
# except block. Concretely: if CORSMiddleware/LoggingMiddleware were added
# before ErrorHandlerMiddleware (as they used to be), a request that fails
# auth (e.g. wrong login password) got a proper 401 body on the wire but with
# no Access-Control-Allow-Origin header — the browser blocks reading it and
# axios reports it as a bare "Network Error" instead of the real message.
# Registering CORS/Logging *after* (i.e. outside) ErrorHandler guarantees they
# run on every response, success or error alike.
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(TimezoneMiddleware)
app.add_middleware(GarbageCollectorMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    #allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers with versioning
app.include_router(
    v1_router,
    prefix=settings.API_V1_PREFIX,
)

# Add more API versions here as needed
# app.include_router(v2_router, prefix="/api/v2")


# Health check endpoints
@app.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint verifying database connectivity
    """
    from sqlalchemy import text
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "detail": "Database connection failed"}
        )


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint
    
    Returns API information
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }


@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    """
    Custom-branded ReDoc documentation page, rendered from
    app/templates/docs/redoc.html
    """
    from fastapi.responses import HTMLResponse
    from app.templates import render_template

    html_content = render_template(
        "docs/redoc.html",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        openapi_url="/openapi.json",
        docs_url="/docs",
    )
    return HTMLResponse(content=html_content)


# Custom OpenAPI schema customization
def custom_openapi():
    """Customize OpenAPI schema"""
    if app.openapi_schema:
        return app.openapi_schema
    
    from fastapi.openapi.utils import get_openapi
    
    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="""
        ## Gravit Backend API
        
        This API provides the complete production-ready backend engine for Gravit, featuring:
        
        - **Multi-Tenancy**: Data isolation mapped dynamically to request context
        - **Integrated AI Brain**: Advanced planning, reasoning, and tool executions
        - **Rate Limiting**: Custom limits per endpoint to prevent abuse
        - **Database**: PostgreSQL with SQLAlchemy ORM, Alembic migrations, and transparent query filters
        - **Validation**: Pydantic models for request/response validation
        - **Logging & Monitoring**: Consolidated request logging, error handling, and health metrics
        
        ### Authentication
        
        Most endpoints require authentication. To authenticate:
        
        1. Register a new account at `/api/v1/auth/register`
        2. Login at `/api/v1/auth/login` to receive tokens
        3. Use the access token in the `Authorization` header: `Bearer <token>`
        4. Refresh tokens when they expire using `/api/v1/auth/refresh`
        
        ### Rate Limiting
        
        API endpoints have different rate limits based on their resource intensity:
        
        - **Authentication**: 5 requests/minute, 20 requests/hour
        - **Standard**: 30-60 requests/minute, 500-1000 requests/hour
        
        """,
        routes=app.routes,
    )
    
    # Add security scheme
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}
    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else settings.WORKERS,
        log_level=settings.LOG_LEVEL.lower(),
    )
