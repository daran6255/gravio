"""Base model class with common fields and mixins"""

from datetime import datetime
from typing import Any
from sqlalchemy import DateTime, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, declared_attr
from sqlalchemy.sql import func


class TimestampMixin:
    """Mixin to add created_at and updated_at timestamps"""
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """Mixin to add soft delete functionality"""
    
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    def soft_delete(self) -> None:
        """Mark record as deleted"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
    
    def restore(self) -> None:
        """Restore soft deleted record"""
        self.is_deleted = False
        self.deleted_at = None


class TenantAwareMixin:
    """Mixin for models that belong to an organization"""
    
    @declared_attr
    def organization_id(cls) -> Mapped[int]:
        return mapped_column(
            Integer,
            ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
            index=True
        )


# Import Base from database to avoid circular import issues
from app.core.database import Base


class BaseModel(Base, TimestampMixin, SoftDeleteMixin):
    """Base class for all database models"""
    
    __abstract__ = True  # This prevents creating a table for BaseModel itself
    
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )
    
    def dict(self) -> dict[str, Any]:
        """Convert model to dictionary"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }


# --- Auto-populate Tenant ID ---
from sqlalchemy import event
from app.core.context import tenant_context

@event.listens_for(BaseModel, "init", propagate=True)
def _auto_set_tenant_id(target, args, kwargs):
    """Automatically populate organization_id from tenant_context during object creation"""
    if hasattr(target, "organization_id"):
        if "organization_id" in kwargs:
            return
            
        org_id = tenant_context.get()
        if org_id is not None:
            target.organization_id = org_id

