"""Company Service"""

from typing import List, Optional, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.company import Company, CompanyStatus
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.repositories.company_repository import CompanyRepository
from app.models.crm_activity_log import CRMEntityType, CRMActivityType
from app.repositories.crm_activity_log_repository import CRMActivityLogRepository


class CompanyService:
    """Service for company business logic"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = CompanyRepository(db)
        self.activity_log = CRMActivityLogRepository(db)

    async def create_company(self, company_in: CompanyCreate, user_id: int) -> Company:
        """Create a new company and log activity"""
        # Check if email exists
        if company_in.email and await self.repository.get_by_email(company_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company with this email already exists"
            )
            
        company = await self.repository.create(company_in.model_dump())
        
        # Log activity
        await self.activity_log.create({
            "entity_type": CRMEntityType.COMPANY,
            "entity_id": company.id,
            "activity_type": CRMActivityType.CREATED,
            "performed_by": user_id,
            "summary": f"Company '{company.name}' created"
        })
        
        return company

    async def get_company(self, public_id: UUID, with_details: bool = False) -> Company:
        """Get company by public_id"""
        if with_details:
            company = await self.repository.get_by_public_id_with_details(public_id)
        else:
            company = await self.repository.get_by_public_id(public_id)
            
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        return company

    async def get_companies(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[CompanyStatus] = None,
        industry: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc"
    ) -> Tuple[List[Company], int]:
        """Get paginated companies"""
        return await self.repository.get_multi(
            skip=skip,
            limit=limit,
            search=search,
            status=status,
            industry=industry,
            sort_by=sort_by,
            sort_order=sort_order
        )

    async def update_company(self, public_id: UUID, company_in: CompanyUpdate, user_id: int) -> Company:
        """Update company and log activity"""
        company = await self.get_company(public_id)
        
        update_data = company_in.model_dump(exclude_unset=True)
        updated_company = await self.repository.update(company.id, update_data)
        
        # Log activity
        await self.activity_log.create({
            "entity_type": CRMEntityType.COMPANY,
            "entity_id": company.id,
            "activity_type": CRMActivityType.UPDATED,
            "performed_by": user_id,
            "summary": f"Company '{company.name}' updated",
            "details": {"updated_fields": list(update_data.keys())}
        })
        
        return updated_company

    async def delete_company(self, public_id: UUID, user_id: int) -> bool:
        """Delete company (soft delete) and log activity"""
        company = await self.get_company(public_id)
        success = await self.repository.delete(company.id)
        
        if success:
            await self.activity_log.create({
                "entity_type": CRMEntityType.COMPANY,
                "entity_id": company.id,
                "activity_type": CRMActivityType.DELETED,
                "performed_by": user_id,
                "summary": f"Company '{company.name}' deleted"
            })
            
        return success

    async def get_stats(self) -> dict:
        """Get company statistics"""
        return await self.repository.get_stats()
