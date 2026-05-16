import uuid
import enum
from datetime import date, datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, Date, DateTime, ForeignKey, Enum, Uuid, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User

class DSRPermissionStatus(str, enum.Enum):
    PENDING = "pending"
    GRANTED = "granted"
    REJECTED = "rejected"

class DSRPermissionRequest(BaseModel):
    """
    Tracks requests from users to submit DSRs for past dates.
    """
    __tablename__ = "dsr_permission_requests"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    report_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[DSRPermissionStatus] = mapped_column(
        Enum(DSRPermissionStatus, values_callable=lambda x: [e.value for e in x]),
        default=DSRPermissionStatus.PENDING,
        nullable=False,
        index=True,
    )

    handled_by: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    handled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    admin_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        backref="dsr_permission_requests",
    )

    admin: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[handled_by],
    )

    def __repr__(self) -> str:
        return (
            f"<DSRPermissionRequest(id={self.id}, user_id={self.user_id}, "
            f"report_date={self.report_date}, status={self.status})>"
        )
