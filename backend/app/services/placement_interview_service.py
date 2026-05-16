from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.placement_interview import PlacementInterview, InterviewResult
from app.repositories.placement_interview_repository import PlacementInterviewRepository
from app.schemas.placement_interview import PlacementInterviewCreate, PlacementInterviewUpdate


class PlacementInterviewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = PlacementInterviewRepository(db)

    async def schedule(self, interview_in: PlacementInterviewCreate) -> PlacementInterview:
        interview = PlacementInterview(**interview_in.model_dump())
        self.db.add(interview)
        await self.db.commit()
        await self.db.refresh(interview)
        return interview

    async def update(self, id: int, interview_in: PlacementInterviewUpdate) -> Optional[PlacementInterview]:
        interview = await self.repository.get(id)
        if not interview:
            return None
        
        update_data = interview_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(interview, key, value)
        
        interview.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(interview)
        return interview

    async def get_by_mapping(self, mapping_id: int) -> List[PlacementInterview]:
        return await self.repository.get_by_mapping(mapping_id)

    async def get_by_candidate(self, candidate_id: int) -> List[PlacementInterview]:
        return await self.repository.get_by_candidate(candidate_id)

    async def record_result(self, id: int, result: InterviewResult, feedback: str) -> Optional[PlacementInterview]:
        interview_update = PlacementInterviewUpdate(
            result=result,
            feedback=feedback,
            conducted_at=datetime.utcnow()
        )
        return await self.update(id, interview_update)
