"""Database configuration and session management"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from app.core.config import settings


# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    poolclass=NullPool if settings.ENVIRONMENT == "testing" else None,
    # Disable SSL for local connections (avoids SSLKEYLOGFILE env var issues)
    # connect_args={"ssl": False},  
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function that yields database sessions.
    
    Usage:
        @app.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database - create all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections"""
    await engine.dispose()


# --- Multi-Tenancy Auto Filtering ---
from sqlalchemy import event
from sqlalchemy.orm import Session, with_loader_criteria
from app.core.context import tenant_context, superuser_context
from app.models.base import TenantAwareMixin

@event.listens_for(Session, "do_orm_execute")
def _add_tenant_filter(execute_state):
    """
    SQLAlchemy 2.0 event hook to automatically apply tenant filters.
    If tenant_context is set and superuser_context is False, it adds
    loader criteria to filter all models inheriting from TenantAwareMixin by organization_id.
    """
    if execute_state.is_select:
        org_id = tenant_context.get()
        is_superuser = superuser_context.get()
        
        # Apply filter only if organization is set and user is not superuser
        if org_id is not None and not is_superuser:
            execute_state.statement = execute_state.statement.options(
                with_loader_criteria(
                    TenantAwareMixin,
                    lambda cls: cls.organization_id == org_id,
                    include_aliases=True
                )
            )

