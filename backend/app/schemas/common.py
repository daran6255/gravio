"""Shared pagination schemas, used by any list endpoint"""

from typing import Generic, TypeVar
from pydantic import BaseModel, Field
from app.core.config import settings

T = TypeVar("T")


class PageParams(BaseModel):
    """Query parameters for paginated list endpoints"""
    page: int = Field(1, ge=1, description="1-indexed page number")
    page_size: int = Field(
        settings.DEFAULT_PAGE_SIZE,
        ge=1,
        le=settings.MAX_PAGE_SIZE,
        description=f"Items per page (max {settings.MAX_PAGE_SIZE})",
    )


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated list envelope"""
    items: list[T]
    total: int
    page: int
    page_size: int
