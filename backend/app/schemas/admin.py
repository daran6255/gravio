import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class TrialExtensionRequest(BaseModel):
    """Schema for trial extension request"""
    extend_days: int = Field(..., ge=1, le=365, description="Number of days to extend the trial (between 1 and 365)")


class TrialExtensionResponse(BaseModel):
    """Schema for trial extension response"""
    public_id: uuid.UUID
    subscription_status: str
    trial_expires_at: datetime

    class Config:
        from_attributes = True
