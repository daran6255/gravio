from __future__ import annotations
import enum
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Enum, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketCategory(str, enum.Enum):
    TECHNICAL = "technical"
    ACCOUNT = "account"
    FEATURE_REQUEST = "feature_request"
    OTHER = "other"


class Ticket(BaseModel):
    __tablename__ = "tickets"

    ticket_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, values_callable=lambda x: [e.value for e in x]),
        default=TicketStatus.OPEN,
        nullable=False,
        index=True
    )
    priority: Mapped[TicketPriority] = mapped_column(
        Enum(TicketPriority, values_callable=lambda x: [e.value for e in x]),
        default=TicketPriority.MEDIUM,
        nullable=False,
        index=True
    )
    category: Mapped[TicketCategory] = mapped_column(
        Enum(TicketCategory, values_callable=lambda x: [e.value for e in x]),
        default=TicketCategory.OTHER,
        nullable=False,
        index=True
    )
    
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    messages: Mapped[List[TicketMessage]] = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan")
    user: Mapped[User] = relationship("User")


class TicketMessage(BaseModel):
    __tablename__ = "ticket_messages"

    ticket_id: Mapped[int] = mapped_column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Relationships
    ticket: Mapped[Ticket] = relationship("Ticket", back_populates="messages")
    user: Mapped[User] = relationship("User")
