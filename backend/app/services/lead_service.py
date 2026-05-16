"""Lead Service"""

from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID
from datetime import datetime, date, timedelta
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.lead import Lead, LeadStatus, LeadSource
from app.schemas.lead import LeadCreate, LeadUpdate
from app.repositories.lead_repository import LeadRepository
from app.repositories.deal_repository import DealRepository
from app.models.crm_activity_log import CRMEntityType, CRMActivityType
from app.repositories.crm_activity_log_repository import CRMActivityLogRepository
from app.models.deal import DealStage, DealType


class LeadService:
    """Service for lead business logic"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = LeadRepository(db)
        self.deal_repository = DealRepository(db)
        self.activity_log = CRMActivityLogRepository(db)

    async def create_lead(self, lead_in: LeadCreate, user_id: int) -> Lead:
        """Create a new lead and log activity"""
        # Ensure lead_score is valid
        lead_data = lead_in.model_dump()
        lead = await self.repository.create(lead_data)
        
        # Log activity
        await self.activity_log.create({
            "entity_type": CRMEntityType.LEAD,
            "entity_id": lead.id,
            "activity_type": CRMActivityType.CREATED,
            "performed_by": user_id,
            "summary": f"Lead '{lead.title}' created"
        })
        
        return lead

    async def get_lead(self, public_id: UUID, with_details: bool = False) -> Lead:
        """Get lead by public_id"""
        if with_details:
            lead = await self.repository.get_by_public_id_with_details(public_id)
        else:
            lead = await self.repository.get_by_public_id(public_id)
            
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        return lead

    async def get_leads(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[LeadStatus] = None,
        source: Optional[LeadSource] = None,
        assigned_to: Optional[int] = None,
        min_score: Optional[int] = None,
        max_score: Optional[int] = None,
        company_id: Optional[int] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc"
    ) -> Tuple[List[Lead], int]:
        """Get paginated leads"""
        return await self.repository.get_multi(
            skip=skip,
            limit=limit,
            search=search,
            status=status,
            source=source,
            assigned_to=assigned_to,
            min_score=min_score,
            max_score=max_score,
            company_id=company_id,
            sort_by=sort_by,
            sort_order=sort_order
        )

    async def update_lead(self, public_id: UUID, lead_in: LeadUpdate, user_id: int) -> Lead:
        """Update lead and log activity"""
        lead = await self.get_lead(public_id)
        
        update_data = lead_in.model_dump(exclude_unset=True)
        updated_lead = await self.repository.update(lead.id, update_data)
        
        # Log activity
        await self.activity_log.create({
            "entity_type": CRMEntityType.LEAD,
            "entity_id": lead.id,
            "activity_type": CRMActivityType.UPDATED,
            "performed_by": user_id,
            "summary": f"Lead '{lead.title}' updated",
            "details": {"updated_fields": list(update_data.keys())}
        })
        
        return updated_lead

    async def delete_lead(self, public_id: UUID, user_id: int) -> bool:
        """Delete lead (soft delete) and log activity"""
        lead = await self.get_lead(public_id)
        success = await self.repository.delete(lead.id)
        
        if success:
            await self.activity_log.create({
                "entity_type": CRMEntityType.LEAD,
                "entity_id": lead.id,
                "activity_type": CRMActivityType.DELETED,
                "performed_by": user_id,
                "summary": f"Lead '{lead.title}' deleted"
            })
            
        return success

    async def convert_to_deal(self, public_id: UUID, user_id: int, deal_data: Dict[str, Any]) -> dict:
        """Convert a lead to a deal"""
        lead = await self.get_lead(public_id)
        
        if lead.converted_to_deal_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lead already converted to a deal"
            )
            
        # 1. Create the deal
        deal_create_data = {
            "title": deal_data.get("title", f"Deal from Lead: {lead.title}"),
            "company_id": lead.company_id,
            "contact_id": lead.contact_id,
            "lead_id": lead.id,
            "assigned_to": deal_data.get("assigned_to", lead.assigned_to),
            "deal_value": deal_data.get("deal_value", lead.estimated_value or 0),
            "currency": deal_data.get("currency", lead.currency),
            "expected_close_date": deal_data.get("expected_close_date"),
            "deal_stage": DealStage.DISCOVERY,
            "deal_type": DealType.NEW_BUSINESS
        }
        
        if not deal_create_data["expected_close_date"]:
            deal_create_data["expected_close_date"] = date.today() + timedelta(days=30)
            
        deal = await self.deal_repository.create(deal_create_data)
        
        # 2. Update the lead
        updated_lead = await self.repository.convert_to_deal(lead.id, deal.id)
        
        # 3. Log activities
        await self.activity_log.create({
            "entity_type": CRMEntityType.LEAD,
            "entity_id": lead.id,
            "activity_type": CRMActivityType.CONVERTED,
            "performed_by": user_id,
            "summary": f"Lead '{lead.title}' converted to Deal '{deal.title}'"
        })
        
        await self.activity_log.create({
            "entity_type": CRMEntityType.DEAL,
            "entity_id": deal.id,
            "activity_type": CRMActivityType.CREATED,
            "performed_by": user_id,
            "summary": f"Deal '{deal.title}' created from Lead '{lead.title}'"
        })
        
        return {"lead": updated_lead, "deal": deal}

    async def get_stats(self, user_id: Optional[int] = None) -> dict:
        """Get lead statistics"""
        return await self.repository.get_stats(user_id)
