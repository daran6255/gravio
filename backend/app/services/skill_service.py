"""Skill Service"""

from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.skill import Skill
from app.schemas.skill import SkillCreate
from app.repositories.skill_repository import SkillRepository


class SkillService:
    """Service for Skill management business logic"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = SkillRepository(db)
        
    async def create_skill(self, skill_in: SkillCreate) -> Skill:
        """Create a new skill if it doesn't exist (case-insensitive check)"""
        # Normalize name (Trim)
        name = skill_in.name.strip()
        
        # Check for existing skill with same name (case-insensitive)
        existing_skill = await self.repository.get_by_name(name)
        if existing_skill:
            return existing_skill # Return existing instead of error to handle "Add new" gracefully
            
        skill_data = skill_in.model_dump()
        skill_data["name"] = name # Use normalized name
        
        return await self.repository.create(skill_data)
        
    async def get_skills(self, query: Optional[str] = None, limit: int = 100) -> List[Skill]:
        """Search or get all skills"""
        if query:
            return await self.repository.search(query, limit)
        return await self.repository.get_all_alphabetical(limit)

    async def get_skill(self, skill_id: int) -> Optional[Skill]:
        """Get skill by ID"""
        return await self.repository.get(skill_id)

    async def update_skill(self, skill_id: int, skill_in: dict) -> Optional[Skill]:
        """Update a skill"""
        return await self.repository.update(skill_id, skill_in)

    async def verify_skill(self, skill_id: int) -> Optional[Skill]:
        """Verify a skill"""
        return await self.repository.update(skill_id, {"is_verified": True})

    async def get_aggregated_skills(self) -> List[str]:
        """
        Aggregate unique skills from:
        1. Master Skill table
        2. Candidate Screening records (JSON technical/soft skills)
        3. Candidate Counseling records (JSON assessment skills)
        """
        # 1. Get skills from master table
        master_skills = await self.repository.get_all_alphabetical(limit=1000)
        master_skill_names = [s.name for s in master_skills]
        
        # 2. Get skills from screening
        screening_skills = await self.repository.get_unique_screening_skills()
        
        # 3. Get skills from counseling
        counseling_skills = await self.repository.get_unique_counseling_skills()
        
        # Combine and deduplicate
        all_skills = set(master_skill_names + screening_skills + counseling_skills)
        
        # Clean and sort
        cleaned_skills = [s.strip() for s in all_skills if s and s.strip()]
        return sorted(cleaned_skills)
