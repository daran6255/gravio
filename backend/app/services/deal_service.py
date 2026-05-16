"""Deal Service"""

from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.deal import Deal, DealStage, DealType
from app.schemas.deal import DealCreate, DealUpdate
from app.repositories.deal_repository import DealRepository
from app.models.crm_activity_log import CRMEntityType, CRMActivityType
from app.repositories.crm_activity_log_repository import CRMActivityLogRepository


class DealService:
    """Service for deal business logic"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = DealRepository(db)
        self.activity_log = CRMActivityLogRepository(db)

    async def create_deal(self, deal_in: DealCreate, user_id: int) -> Deal:
        """Create a new deal and log activity"""
        deal = await self.repository.create(deal_in.model_dump())
        
        # Log activity
        await self.activity_log.create({
            "entity_type": CRMEntityType.DEAL,
            "entity_id": deal.id,
            "activity_type": CRMActivityType.CREATED,
            "performed_by": user_id,
            "summary": f"Deal '{deal.title}' created"
        })
        
        return deal

    async def get_deal(self, public_id: UUID, with_details: bool = False) -> Deal:
        """Get deal by public_id"""
        if with_details:
            deal = await self.repository.get_by_public_id_with_details(public_id)
        else:
            deal = await self.repository.get_by_public_id(public_id)
            
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")
        return deal

    async def get_deals(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        stage: Optional[DealStage] = None,
        deal_type: Optional[DealType] = None,
        assigned_to: Optional[int] = None,
        company_id: Optional[int] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc"
    ) -> Tuple[List[Deal], int]:
        """Get paginated deals"""
        return await self.repository.get_multi(
            skip=skip,
            limit=limit,
            search=search,
            stage=stage,
            deal_type=deal_type,
            assigned_to=assigned_to,
            company_id=company_id,
            sort_by=sort_by,
            sort_order=sort_order
        )

    async def update_deal(self, public_id: UUID, deal_in: DealUpdate, user_id: int) -> Deal:
        """Update deal and log activity"""
        deal = await self.get_deal(public_id)
        
        update_data = deal_in.model_dump(exclude_unset=True)
        
        # Track stage change
        old_stage = deal.deal_stage
        new_stage = update_data.get("deal_stage")
        
        updated_deal = await self.repository.update(deal.id, update_data)
        
        # Log activity
        summary = f"Deal '{deal.title}' updated"
        activity_type = CRMActivityType.UPDATED
        
        if new_stage and new_stage != old_stage:
            summary = f"Deal '{deal.title}' stage moved from {old_stage.value} to {new_stage.value}"
            activity_type = CRMActivityType.STAGE_CHANGED
            
        await self.activity_log.create({
            "entity_type": CRMEntityType.DEAL,
            "entity_id": deal.id,
            "activity_type": activity_type,
            "performed_by": user_id,
            "summary": summary,
            "details": {
                "updated_fields": list(update_data.keys()),
                "old_stage": old_stage.value if new_stage else None,
                "new_stage": new_stage.value if new_stage else None
            }
        })
        
        return updated_deal

    async def delete_deal(self, public_id: UUID, user_id: int) -> bool:
        """Delete deal (soft delete) and log activity"""
        deal = await self.get_deal(public_id)
        success = await self.repository.delete(deal.id)
        
        if success:
            await self.activity_log.create({
                "entity_type": CRMEntityType.DEAL,
                "entity_id": deal.id,
                "activity_type": CRMActivityType.DELETED,
                "performed_by": user_id,
                "summary": f"Deal '{deal.title}' deleted"
            })
            
        return success

    async def get_pipeline_summary(self, user_id: Optional[int] = None) -> dict:
        """Get pipeline summary"""
        return await self.repository.get_pipeline_summary(user_id)
