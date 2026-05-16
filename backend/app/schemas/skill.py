"""Skill schemas"""

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SkillBase(BaseModel):
    name: str = Field(..., max_length=100)
    is_verified: bool = False


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    is_verified: Optional[bool] = None


class SkillRead(SkillBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
