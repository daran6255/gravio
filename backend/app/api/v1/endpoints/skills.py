"""Skill Endpoints"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User
from app.schemas.skill import SkillCreate, SkillRead
from app.services.skill_service import SkillService


router = APIRouter()


@router.get("/", response_model=List[SkillRead])
async def get_skills(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    query: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
) -> Any:
    """Get all skills or search by query"""
    service = SkillService(db)
    return await service.get_skills(query=query, limit=limit)


@router.get("/aggregated", response_model=List[str])
async def get_aggregated_skills(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get unique skill names combined from Master data, Screening, and Counseling"""
    service = SkillService(db)
    return await service.get_aggregated_skills()


@router.post("/", response_model=SkillRead, status_code=status.HTTP_201_CREATED)
async def create_skill(
    skill_in: SkillCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Create a new skill (master data)"""
    service = SkillService(db)
    return await service.create_skill(skill_in)


@router.patch("/{skill_id}/verify", response_model=SkillRead)
async def verify_skill(
    skill_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Verify a skill"""
    service = SkillService(db)
    skill = await service.verify_skill(skill_id)
    if not skill:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill
