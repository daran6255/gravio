"""AI Chat schemas — Request and response models for the chat API."""


import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AIChatMessageBase(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class AIChatMessageCreate(BaseModel):
    """Schema for sending a new message in a session."""
    role: Literal["user", "assistant", "system"] = "user"
    content: str


class AIChatMessageRead(AIChatMessageBase):
    """Schema for reading a message from the history."""
    id: int
    session_id: int
    task_log_id: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class AIChatSessionBase(BaseModel):
    title: str = "New AI Co-worker Chat"


class AIChatSessionCreate(AIChatSessionBase):
    """Schema for creating a new chat session."""
    pass


class AIChatSessionRead(AIChatSessionBase):
    """Schema for reading a chat session's metadata."""
    id: int
    public_id: uuid.UUID
    user_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AIChatSessionDetail(AIChatSessionRead):
    """Schema for a full chat session including its message history."""
    messages: list[AIChatMessageRead]


class AIChatResponse(BaseModel):
    """
    Response returned after sending a message.
    Includes the assistant's reply and any background action metadata.
    """
    session_id: uuid.UUID
    reply: AIChatMessageRead
    task_id: uuid.UUID | None = Field(
        None,
        description="If the AI performed actions (tool calls), this is the public_id of the AITaskLog"
    )
