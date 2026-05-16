from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str
    link: Optional[str] = None

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)
    
    public_id: UUID
    is_read: bool
    created_at: datetime

class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    unread_count: int
