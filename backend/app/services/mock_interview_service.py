from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.training_mock_interview import TrainingMockInterview
from app.schemas.mock_interview import MockInterviewCreate, MockInterviewUpdate
from app.repositories.training_mock_interview_repository import TrainingMockInterviewRepository

class MockInterviewService:
    """Service for mock interview operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = TrainingMockInterviewRepository(db)
    
    async def get_mock_interviews(self, skip: int = 0, limit: int = 100) -> List[TrainingMockInterview]:
        """Get all mock interviews"""
        return await self.repository.get_multi(skip=skip, limit=limit)
    
    async def get_mock_interviews_by_batch(self, batch_id: int, skip: int = 0, limit: int = 100) -> List[TrainingMockInterview]:
        """Get mock interviews for a specific batch"""
        return await self.repository.get_by_batch_id(batch_id, skip=skip, limit=limit)
    
    async def get_mock_interview(self, id: int) -> TrainingMockInterview:
        """Get a mock interview by ID"""
        interview = await self.repository.get(id)
        if not interview:
            raise HTTPException(status_code=404, detail="Mock interview not found")
        return interview
    
    async def create_mock_interview(self, interview_in: MockInterviewCreate) -> TrainingMockInterview:
        """Create a new mock interview"""
        return await self.repository.create(interview_in.dict())
    
    async def update_mock_interview(self, id: int, interview_in: MockInterviewUpdate) -> TrainingMockInterview:
        """Update a mock interview"""
        interview = await self.get_mock_interview(id)
        update_data = interview_in.dict(exclude_unset=True)
        return await self.repository.update(id, update_data)
    
    async def delete_mock_interview(self, id: int) -> bool:
        """Delete a mock interview"""
        await self.get_mock_interview(id) # Ensure it exists
        return await self.repository.delete(id)
