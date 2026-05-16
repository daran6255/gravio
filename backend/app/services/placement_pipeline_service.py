from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.placement_mapping import PlacementMapping, PlacementStatus
from app.models.placement_pipeline_history import PlacementPipelineHistory
from app.repositories.placement_pipeline_history_repository import PlacementPipelineHistoryRepository
from app.repositories.placement_mapping_repository import PlacementMappingRepository
from app.models.placement_offer import PlacementOffer, JoiningStatus, OfferResponse


class PlacementPipelineService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.history_repo = PlacementPipelineHistoryRepository(db)
        self.mapping_repo = PlacementMappingRepository(db)

    async def update_status(
        self,
        mapping_id: int,
        to_status: str,  # Accepts PlacementStatus values AND dynamic 'interview_lN' strings
        changed_by_id: int,
        remarks: Optional[str] = None
    ) -> Optional[PlacementMapping]:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        
        # Fetch mapping with necessary relationships for serialization
        stmt = (
            select(PlacementMapping)
            .where(PlacementMapping.id == mapping_id)
            .options(
                selectinload(PlacementMapping.candidate),
                selectinload(PlacementMapping.job_role),
                selectinload(PlacementMapping.mapped_by)
            )
        )
        result = await self.db.execute(stmt)
        mapping = result.scalars().first()
        
        if not mapping:
            return None

        from_status = mapping.status
        
        # Record update intent
        mapping.status = to_status
        mapping.updated_at = datetime.utcnow()
        
        # Create history record
        history = PlacementPipelineHistory(
            mapping_id=mapping_id,
            candidate_id=mapping.candidate_id,
            job_role_id=mapping.job_role_id,
            from_status=from_status,
            to_status=to_status,
            changed_by_id=changed_by_id,
            remarks=remarks,
            changed_at=datetime.utcnow()
        )
        
        self.db.add(history)
        
        # Synchronize with PlacementOffer if it exists
        offer_stmt = select(PlacementOffer).where(PlacementOffer.mapping_id == mapping_id)
        offer_result = await self.db.execute(offer_stmt)
        offer = offer_result.scalars().first()
        
        if offer:
            if to_status == 'joined':
                offer.joining_status = JoiningStatus.JOINED
                offer.candidate_response = OfferResponse.ACCEPTED
                if not offer.actual_joining_date:
                    offer.actual_joining_date = datetime.utcnow().date()
            elif to_status == 'rejected' or to_status == 'not_joined':
                offer.joining_status = JoiningStatus.NOT_JOINED
                # If moving to rejected, also update response if it was pending
                if to_status == 'rejected' and offer.candidate_response == OfferResponse.PENDING:
                    offer.candidate_response = OfferResponse.REJECTED
            elif to_status == 'offer_accepted':
                offer.candidate_response = OfferResponse.ACCEPTED
            elif to_status == 'offer_rejected':
                offer.candidate_response = OfferResponse.REJECTED
                offer.joining_status = JoiningStatus.NOT_JOINED
            
            offer.updated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(mapping)
        return mapping

    async def get_history(self, mapping_id: int) -> List[PlacementPipelineHistory]:
        return await self.history_repo.get_by_mapping(mapping_id)

    async def get_candidate_history(self, candidate_id: int) -> List[PlacementPipelineHistory]:
        return await self.history_repo.get_by_candidate(candidate_id)
