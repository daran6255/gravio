from __future__ import annotations

from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User

class Organization(BaseModel):
    """Organization model for multi-tenancy"""
    
    __tablename__ = "organizations"
    
    name: Mapped[str] = mapped_column(
        String(255), 
        nullable=False, 
        unique=True, 
        index=True
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean, 
        default=True, 
        nullable=False
    )
    
    # Relationships
    users: Mapped[list[User]] = relationship(
        "User", 
        back_populates="organization"
    )
    
    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name={self.name})>"
