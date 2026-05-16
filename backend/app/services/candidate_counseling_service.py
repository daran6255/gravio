"""Candidate Counseling Service"""

from typing import Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.candidate_counseling import CandidateCounseling
from app.schemas.candidate_counseling import CandidateCounselingCreate, CandidateCounselingUpdate
from app.repositories.candidate_counseling_repository import CandidateCounselingRepository
from app.repositories.candidate_repository import CandidateRepository


class CandidateCounselingService:
    """Service for candidate counseling operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = CandidateCounselingRepository(db)
        self.candidate_repo = CandidateRepository(db)
    
    async def get_counseling(self, candidate_public_id: UUID) -> Optional[CandidateCounseling]:
        """Get counseling record for a candidate"""
        candidate = await self.candidate_repo.get_by_public_id_with_details(candidate_public_id)
        if not candidate or not candidate.counseling:
            return None
        
        counseling = candidate.counseling
        return counseling
    
    
    async def create_counseling(
        self,
        candidate_public_id: UUID,
        counseling_in: CandidateCounselingCreate,
        counselor_id: Optional[int] = None
    ) -> CandidateCounseling:
        """Create counseling record for a candidate"""
        # Verify candidate exists
        candidate = await self.candidate_repo.get_by_public_id_with_details(candidate_public_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Check if counseling already exists
        if candidate.counseling:
            raise HTTPException(
                status_code=400,
                detail="Counseling record already exists. Use PUT to update."
            )
        
        # Create counseling
        counseling_data = counseling_in.model_dump()
        
        # Move suitable_job_roles, assigned_to, and remarks to others
        others = counseling_data.get("others") or {}
        if "suitable_job_roles" in counseling_data:
            others["suitable_job_roles"] = counseling_data.pop("suitable_job_roles")
        if "assigned_to" in counseling_data:
            others["assigned_to"] = counseling_data.pop("assigned_to")
        if "remarks" in counseling_data:
            others["remarks"] = counseling_data.pop("remarks")
            
        counseling_data["others"] = others
            
        counseling_data["candidate_id"] = candidate.id
        
        # Set counselor_id if provided (from current user)
        if counselor_id:
            counseling_data["counselor_id"] = counselor_id
        
        return await self.repository.create(counseling_data)
    
    async def update_counseling(
        self,
        candidate_public_id: UUID,
        counseling_in: CandidateCounselingUpdate,
        counselor_id: Optional[int] = None
    ) -> CandidateCounseling:
        """Update counseling record"""
        # Get candidate with counseling
        candidate = await self.candidate_repo.get_by_public_id_with_details(candidate_public_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        if not candidate.counseling:
            raise HTTPException(
                status_code=404,
                detail="Counseling record not found. Use POST to create."
            )
        
        # Update counseling
        update_data = counseling_in.model_dump(exclude_unset=True)
        
        # Move suitable_job_roles, assigned_to, and remarks to others
        others = update_data.get("others", candidate.counseling.others or {})
        if "suitable_job_roles" in update_data:
            others["suitable_job_roles"] = update_data.pop("suitable_job_roles")
        if "assigned_to" in update_data:
            others["assigned_to"] = update_data.pop("assigned_to")
        if "remarks" in update_data:
            others["remarks"] = update_data.pop("remarks")
            
        update_data["others"] = others
        
        # Protect original counselor info: 
        # Only set counselor_id and counseling_date if they don't already exist
        if counselor_id and (candidate.counseling.counselor_id is None):
            update_data["counselor_id"] = counselor_id
            
        if "counseling_date" in update_data and candidate.counseling.counseling_date is not None:
             # Don't overwrite existing date unless explicitly allowed (for now we protect it)
             del update_data["counseling_date"]
        elif "counseling_date" not in update_data and candidate.counseling.counseling_date is None and counselor_id:
             # If no date provided but we are setting a new counselor, use current time
             from datetime import datetime
             update_data["counseling_date"] = datetime.now()
        
        counseling = await self.repository.update(candidate.counseling.id, update_data)
        
        return counseling
    
    async def delete_counseling(self, candidate_public_id: UUID) -> bool:
        """Delete counseling record"""
        candidate = await self.candidate_repo.get_by_public_id_with_details(candidate_public_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        if not candidate.counseling:
            raise HTTPException(status_code=404, detail="Counseling record not found")
        
        return await self.repository.delete(candidate.counseling.id)
