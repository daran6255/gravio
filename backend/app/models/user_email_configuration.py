from sqlalchemy import String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel


class UserEmailConfiguration(BaseModel):
    """
    Model for storing per-user email (SMTP) configurations.
    """
    __tablename__ = "user_email_configurations"

    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        unique=True, 
        nullable=False,
        index=True
    )
    
    smtp_server: Mapped[str] = mapped_column(String(255), nullable=False)
    smtp_port: Mapped[int] = mapped_column(Integer, nullable=False)
    smtp_username: Mapped[str] = mapped_column(String(255), nullable=False)
    smtp_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    sender_email: Mapped[str] = mapped_column(String(255), nullable=False)
    sender_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    encryption: Mapped[str] = mapped_column(String(20), default="tls", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationship back to user
    user: Mapped["User"] = relationship("User", back_populates="email_configuration")

    def __repr__(self) -> str:
        return f"<UserEmailConfiguration(user_id={self.user_id}, sender_email={self.sender_email})>"
