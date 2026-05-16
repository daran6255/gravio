import logging
from datetime import datetime
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.candidate import Candidate
from app.models.candidate_screening import CandidateScreening
from app.utils.email import send_consent_form_email
from app.core.config import settings

logger = logging.getLogger(__name__)

class ConsentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def send_consent_email(self, candidate_public_id: str, user_id: int, base_url: str) -> bool:
        """Send consent form email to candidate"""
        
        # 1. Fetch Candidate and Screening
        query = select(Candidate).where(Candidate.public_id == candidate_public_id)
        result = await self.db.execute(query)
        candidate = result.scalar_one_or_none()
        
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
            
        screening_query = select(CandidateScreening).where(CandidateScreening.candidate_id == candidate.id)
        screening_result = await self.db.execute(screening_query)
        screening = screening_result.scalar_one_or_none()
        
        if not screening:
            raise HTTPException(status_code=404, detail="Candidate screening not found")

        # 2. Create Message and Send via Utility
        consent_url = f"{base_url}/consent/{candidate.public_id}"
        
        success = await send_consent_form_email(
            candidate_name=candidate.name,
            candidate_email=candidate.email,
            consent_url=consent_url
        )
        
        if success:
            # Update status to Pending
            screening.consent_status = "Pending"
            await self.db.commit()
            
        return success

    async def submit_consent(self, candidate_public_id: str, ip_address: str) -> bool:
        """Submit consent form"""
        query = select(Candidate).where(Candidate.public_id == candidate_public_id)
        result = await self.db.execute(query)
        candidate = result.scalar_one_or_none()
        
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
            
        screening_query = select(CandidateScreening).where(CandidateScreening.candidate_id == candidate.id)
        screening_result = await self.db.execute(screening_query)
        screening = screening_result.scalar_one_or_none()
        
        if not screening:
            raise HTTPException(status_code=404, detail="Candidate screening not found")
            
        screening.consent_status = "Accepted"
        screening.consent_at = datetime.utcnow()
        screening.consent_ip = ip_address
        
        await self.db.commit()
        return True
