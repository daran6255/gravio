from __future__ import annotations
import enum
import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, Enum, ForeignKey, Integer, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.organization import Organization

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    SOURCING = "sourcing"
    PLACEMENT = "placement"
    TRAINER = "trainer"
    COUNSELOR = "counselor"
    PROJECT_COORDINATOR = "project_coordinator"
    DEVELOPER = "developer"
    MARKETING = "marketing"

class User(BaseModel):
    __tablename__ = "users"
    
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda x: [e.value for e in x]),
        default=UserRole.DEVELOPER,
        nullable=False,
        index=True,
    )
    organization_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("organizations.id"),
        nullable=True,
        index=True,
    )
    others: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    
    organization: Mapped[Organization] = relationship("Organization", back_populates="users")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
