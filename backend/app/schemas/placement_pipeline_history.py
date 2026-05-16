from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class PlacementPipelineHistoryBase(BaseModel):
    mapping_id: int
    candidate_id: int
    job_role_id: int
    from_status: Optional[str] = None
    to_status: str
    remarks: Optional[str] = None


class PlacementPipelineHistoryCreate(PlacementPipelineHistoryBase):
    changed_by_id: Optional[int] = None


class PlacementPipelineHistoryResponse(PlacementPipelineHistoryBase):
    id: int
    changed_by_id: Optional[int] = None
    changed_at: datetime
    
    # Optional detailed info
    changed_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
