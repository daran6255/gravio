"""Contact Service"""

from typing import List, Optional, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactUpdate
from app.repositories.contact_repository import ContactRepository
from app.models.crm_activity_log import CRMEntityType, CRMActivityType
from app.repositories.crm_activity_log_repository import CRMActivityLogRepository


class ContactService:
    """Service for contact business logic"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ContactRepository(db)
        self.activity_log = CRMActivityLogRepository(db)

    async def create_contact(self, contact_in: ContactCreate, user_id: int) -> Contact:
        """Create a new contact and log activity"""
        # Check if email exists (only if provided)
        if contact_in.email and await self.repository.get_by_email(contact_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact with this email already exists"
            )
            
        contact = await self.repository.create(contact_in.model_dump())
        
        # Log activity
        await self.activity_log.create({
            "entity_type": CRMEntityType.CONTACT,
            "entity_id": contact.id,
            "activity_type": CRMActivityType.CREATED,
            "performed_by": user_id,
            "summary": f"Contact '{contact.first_name} {contact.last_name}' created"
        })
        
        # Re-fetch with company details for the response
        return await self.get_contact(contact.public_id, with_company=True)

    async def get_contact(self, public_id: UUID, with_company: bool = False) -> Contact:
        """Get contact by public_id"""
        if with_company:
            contact = await self.repository.get_by_public_id_with_company(public_id)
        else:
            contact = await self.repository.get_by_public_id(public_id)
            
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        return contact

    async def get_contacts(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        company_id: Optional[int] = None,
        is_decision_maker: Optional[bool] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc"
    ) -> Tuple[List[Contact], int]:
        """Get paginated contacts"""
        return await self.repository.get_multi(
            skip=skip,
            limit=limit,
            search=search,
            company_id=company_id,
            is_decision_maker=is_decision_maker,
            sort_by=sort_by,
            sort_order=sort_order
        )

    async def update_contact(self, public_id: UUID, contact_in: ContactUpdate, user_id: int) -> Contact:
        """Update contact and log activity"""
        contact = await self.get_contact(public_id)
        
        update_data = contact_in.model_dump(exclude_unset=True)
        updated_contact = await self.repository.update(contact.id, update_data)
        
        # Log activity
        await self.activity_log.create({
            "entity_type": CRMEntityType.CONTACT,
            "entity_id": contact.id,
            "activity_type": CRMActivityType.UPDATED,
            "performed_by": user_id,
            "summary": f"Contact '{contact.first_name} {contact.last_name}' updated",
            "details": {"updated_fields": list(update_data.keys())}
        })
        
        # Re-fetch with company details for the response
        return await self.get_contact(public_id, with_company=True)

    async def delete_contact(self, public_id: UUID, user_id: int) -> bool:
        """Delete contact (soft delete) and log activity"""
        contact = await self.get_contact(public_id)
        success = await self.repository.delete(contact.id)
        
        if success:
            await self.activity_log.create({
                "entity_type": CRMEntityType.CONTACT,
                "entity_id": contact.id,
                "activity_type": CRMActivityType.DELETED,
                "performed_by": user_id,
                "summary": f"Contact '{contact.first_name} {contact.last_name}' deleted"
            })
            
        return success

    async def set_primary_contact(self, public_id: UUID, user_id: int) -> Contact:
        """Set contact as primary for its company"""
        contact = await self.get_contact(public_id)
        if not contact.company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact is not associated with any company"
            )
            
        updated_contact = await self.repository.set_primary_contact(contact.id, contact.company_id)
        
        # Log activity
        await self.activity_log.create({
            "entity_type": CRMEntityType.CONTACT,
            "entity_id": contact.id,
            "activity_type": CRMActivityType.STATUS_CHANGED,
            "performed_by": user_id,
            "summary": f"Contact '{contact.first_name} {contact.last_name}' set as primary contact"
        })
        
        # Re-fetch with company details for the response
        return await self.get_contact(public_id, with_company=True)
