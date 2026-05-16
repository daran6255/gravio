"""Skill Repository"""

from typing import List, Optional
from sqlalchemy import select, func
from app.models.skill import Skill
from app.repositories.base import BaseRepository


class SkillRepository(BaseRepository[Skill]):
    """Repository for Skill model"""
    
    def __init__(self, db):
        super().__init__(Skill, db)
        
    async def get_by_name(self, name: str) -> Optional[Skill]:
        """Get skill by name (case-insensitive)"""
        stmt = select(self.model).where(func.lower(self.model.name) == func.lower(name))
        result = await self.db.execute(stmt)
        return result.scalars().first()
        
    async def search(self, query: str, limit: int = 10) -> List[Skill]:
        """Search skills by name (case-insensitive)"""
        stmt = select(self.model).where(
            self.model.name.ilike(f"%{query}%")
        ).order_by(self.model.name).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all_alphabetical(self, limit: int = 100) -> List[Skill]:
        """Get all skills ordered alphabetically"""
        stmt = select(self.model).order_by(self.model.name).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_unique_screening_skills(self) -> List[str]:
        """Extract unique skill names from CandidateScreening JSON fields"""
        from app.models.candidate_screening import CandidateScreening
        from sqlalchemy import text
        
        # We use raw sql for complex JSON extraction to ensure performance
        # technical_skills and soft_skills are arrays inside a JSON object
        query = text("""
            SELECT DISTINCT skill
            FROM (
                SELECT json_array_elements_text(skills->'technical_skills') as skill FROM candidate_screenings WHERE skills->'technical_skills' IS NOT NULL
                UNION
                SELECT json_array_elements_text(skills->'soft_skills') as skill FROM candidate_screenings WHERE skills->'soft_skills' IS NOT NULL
            ) s
            WHERE skill IS NOT NULL AND skill != ''
        """)
        result = await self.db.execute(query)
        return [row[0] for row in result.fetchall()]

    async def get_unique_counseling_skills(self) -> List[str]:
        """Extract unique skill names from CandidateCounseling JSON array"""
        from app.models.candidate_counseling import CandidateCounseling
        from sqlalchemy import text
        
        # skills is a JSON array of objects in CandidateCounseling
        query = text("""
            SELECT DISTINCT skill_obj->>'name' as skill
            FROM (
                SELECT json_array_elements(skills) as skill_obj FROM candidate_counseling WHERE skills IS NOT NULL
            ) s
            WHERE skill_obj->>'name' IS NOT NULL AND skill_obj->>'name' != ''
        """)
        result = await self.db.execute(query)
        return [row[0] for row in result.fetchall()]
