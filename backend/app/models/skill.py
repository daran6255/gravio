"""Skill model for standardized master data management"""

from sqlalchemy import String, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel
from sqlalchemy import func


class Skill(BaseModel):
    """
    Skill database model.
    Used for standardized talent and job requirement tracking.
    """
    __tablename__ = "skills"

    name: Mapped[str] = mapped_column(
        String(100), 
        unique=True, 
        index=True, 
        nullable=False
    )
    
    is_verified: Mapped[bool] = mapped_column(
        Boolean, 
        default=False, 
        nullable=False
    )

    # Add a case-insensitive index for searching (if using Postgres)
    __table_args__ = (
        Index('ix_skills_name_lower', func.lower(name), unique=True),
    )

    def __repr__(self) -> str:
        return f"<Skill(id={self.id}, name={self.name})>"
