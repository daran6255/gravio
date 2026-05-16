from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.models.placement_note import NoteType


class PlacementNoteBase(BaseModel):
    mapping_id: int
    candidate_id: Optional[int] = None
    job_role_id: Optional[int] = None
    note_type: NoteType = NoteType.GENERAL
    content: str
    is_pinned: bool = False


class PlacementNoteCreate(PlacementNoteBase):
    created_by_id: Optional[int] = None


class PlacementNoteUpdate(BaseModel):
    note_type: Optional[NoteType] = None
    content: Optional[str] = None
    is_pinned: Optional[bool] = None


class PlacementNoteResponse(PlacementNoteBase):
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    
    # Optional detailed info
    created_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
