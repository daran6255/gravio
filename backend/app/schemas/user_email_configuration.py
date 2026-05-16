from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserEmailConfigurationBase(BaseModel):
    smtp_server: str = Field(..., description="SMTP server address")
    smtp_port: int = Field(..., description="SMTP port number")
    smtp_username: str = Field(..., description="SMTP authentication username")
    sender_email: EmailStr = Field(..., description="The email address used as the sender")
    sender_name: Optional[str] = Field(None, description="Sender display name")
    encryption: str = Field("tls", description="Encryption type (ssl, tls, none)")
    is_active: bool = Field(True, description="Whether this email configuration is active")


class UserEmailConfigurationCreate(UserEmailConfigurationBase):
    smtp_password: str = Field(..., description="SMTP authentication password")


class UserEmailConfigurationUpdate(BaseModel):
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    sender_email: Optional[EmailStr] = None
    sender_name: Optional[str] = None
    encryption: Optional[str] = None
    is_active: Optional[bool] = None


class UserEmailConfigurationResponse(UserEmailConfigurationBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class EmailTestRequest(UserEmailConfigurationCreate):
    """Schema for testing email connection before saving"""
    pass
