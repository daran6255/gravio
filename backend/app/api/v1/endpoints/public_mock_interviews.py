"""Public Mock Interview Endpoints"""

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.training_extension_service import TrainingExtensionService
from app.schemas.training_mock_interview import TrainingMockInterviewResponse, QuestionSchema
from typing import List

router = APIRouter(prefix="/public/mock-interviews", tags=["Public Interviews"])

@router.get("/{token}", response_model=TrainingMockInterviewResponse)
async def get_public_interview(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get mock interview details using a secure token (for candidates).
    Only allowed if the interview is still in progress.
    """
    service = TrainingExtensionService(db)
    mock = await service.get_mock_interview_by_token(token)
    if not mock:
        raise HTTPException(status_code=404, detail="Interview link invalid or expired")
    
    # Deactivate link if session is completed or cancelled
    if mock.status in ["completed", "cancelled"]:
        raise HTTPException(
            status_code=403, 
            detail="This evaluation session has been finalized and the link is now deactivated."
        )
        
    return mock

@router.post("/{token}/submit", response_model=TrainingMockInterviewResponse)
async def submit_public_answers(
    token: str,
    answers: List[QuestionSchema],
    db: AsyncSession = Depends(get_db)
):
    """
    Submit candidate answers for the mock interview.
    """
    service = TrainingExtensionService(db)
    mock = await service.get_mock_interview_by_token(token)
    if not mock or mock.status in ["completed", "cancelled"]:
        raise HTTPException(status_code=403, detail="This evaluation is no longer active.")
    
    # Update questions and set submission timestamp
    from datetime import datetime
    updated_mock = await service.update_mock_interview(
        mock.id, 
        {
            "questions": [a.model_dump() for a in answers],
            "candidate_submitted_at": datetime.utcnow()
        }
    )
    
    await db.commit()
    return updated_mock
