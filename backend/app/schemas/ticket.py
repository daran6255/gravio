from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.ticket import TicketStatus, TicketPriority, TicketCategory


class TicketMessageBase(BaseModel):
    message: str


class TicketMessageCreate(TicketMessageBase):
    pass


class TicketMessage(TicketMessageBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    ticket_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class TicketBase(BaseModel):
    title: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM
    category: TicketCategory = TicketCategory.OTHER


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    category: Optional[TicketCategory] = None


class Ticket(TicketBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    ticket_number: str
    status: TicketStatus
    user_id: int
    created_at: datetime
    updated_at: datetime
    messages: List[TicketMessage] = []
