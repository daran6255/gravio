"""Server-side record of issued refresh tokens — enables revocation and rotation.

Access tokens stay fully stateless (short-lived, never checked against the DB).
Refresh tokens are long-lived, so each one is tracked here to support:
  - immediate revocation on logout
  - one-time-use rotation (each refresh issues a new token and retires the old one)
  - reuse detection (presenting an already-rotated token signals theft)
"""

from __future__ import annotations

import datetime
from sqlalchemy import String, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class RefreshToken(BaseModel):
    __tablename__ = "refresh_tokens"

    jti: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    expires_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    revoked_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # If this token was rotated (used to mint a new one), the new token's jti.
    # Lets us trace the rotation chain when investigating reuse-detection events.
    replaced_by_jti: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    def __repr__(self) -> str:
        return f"<RefreshToken(jti={self.jti[:8]}..., user_id={self.user_id}, revoked={self.revoked_at is not None})>"
