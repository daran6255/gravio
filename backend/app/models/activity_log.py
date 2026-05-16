"""Activity Log model for tracking API operations"""

import enum
from sqlalchemy import String, Integer, JSON, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class ActionType(str, enum.Enum):
    """Action type enumeration"""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"


class ActivityLog(BaseModel):
    """Activity log database model"""
    
    __tablename__ = "activity_logs"
    
    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    action_type: Mapped[ActionType] = mapped_column(
        Enum(ActionType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    
    endpoint: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    
    method: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )
    
    resource_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )
    
    resource_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    
    changes: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    
    ip_address: Mapped[str | None] = mapped_column(
        String(45),  # IPv6 max length
        nullable=True,
    )
    
    user_agent: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    
    status_code: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    
    def __repr__(self) -> str:
        return f"<ActivityLog(id={self.id}, user_id={self.user_id}, action={self.action_type}, endpoint={self.endpoint})>"
