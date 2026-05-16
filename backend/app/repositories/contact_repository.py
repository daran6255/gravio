"""Contact Repository"""

from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, func, or_
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.contact import Contact
from app.repositories.base import BaseRepository


class ContactRepository(BaseRepository[Contact]):
    """Repository for Contact model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(Contact, db)
    
    async def get_by_public_id(self, public_id: UUID) -> Optional[Contact]:
        """Get contact by public_id (UUID)"""
        result = await self.db.execute(
            select(Contact).where(Contact.public_id == public_id)
        )
        return result.scalars().first()
    
    async def get_by_public_id_with_company(self, public_id: UUID) -> Optional[Contact]:
        """Get contact by public_id with company data"""
        result = await self.db.execute(
            select(Contact)
            .where(Contact.public_id == public_id)
            .options(joinedload(Contact.company))
        )
        return result.scalars().first()
    
    async def get_by_email(self, email: str) -> Optional[Contact]:
        """Get contact by email"""
        result = await self.db.execute(
            select(Contact).where(Contact.email == email)
        )
        return result.scalars().first()
    
    async def get_by_company_id(
        self,
        company_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Contact]:
        """Get all contacts for a specific company"""
        stmt = (
            select(Contact)
            .where(Contact.company_id == company_id)
            .where(Contact.is_deleted == False)
            .order_by(Contact.is_primary.desc(), Contact.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()
    
    async def get_primary_contact(self, company_id: int) -> Optional[Contact]:
        """Get primary contact for a company"""
        result = await self.db.execute(
            select(Contact)
            .where(Contact.company_id == company_id)
            .where(Contact.is_primary == True)
            .where(Contact.is_deleted == False)
        )
        return result.scalars().first()
    
    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
        search: Optional[str] = None,
        company_id: Optional[int] = None,
        is_decision_maker: Optional[bool] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc"
    ):
        """Get multiple contacts with filtering and pagination"""
        stmt = select(Contact).options(joinedload(Contact.company))
        
        if not include_deleted:
            stmt = stmt.where(Contact.is_deleted == False)
        
        # Search filter
        if search:
            search_filter = or_(
                Contact.first_name.ilike(f"%{search}%"),
                Contact.last_name.ilike(f"%{search}%"),
                Contact.email.ilike(f"%{search}%"),
                Contact.phone.ilike(f"%{search}%"),
                Contact.designation.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
        
        # Company filter
        if company_id:
            stmt = stmt.where(Contact.company_id == company_id)
        
        # Decision maker filter
        if is_decision_maker is not None:
            stmt = stmt.where(Contact.is_decision_maker == is_decision_maker)
        
        # Count query
        count_stmt = select(func.count(Contact.id)).select_from(Contact)
        if not include_deleted:
            count_stmt = count_stmt.where(Contact.is_deleted == False)
        if search:
            count_stmt = count_stmt.where(search_filter)
        if company_id:
            count_stmt = count_stmt.where(Contact.company_id == company_id)
        if is_decision_maker is not None:
            count_stmt = count_stmt.where(Contact.is_decision_maker == is_decision_maker)
        
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Sorting
        if sort_by and hasattr(Contact, sort_by):
            column = getattr(Contact, sort_by)
            if sort_order.lower() == "asc":
                stmt = stmt.order_by(column.asc())
            else:
                stmt = stmt.order_by(column.desc())
        else:
            stmt = stmt.order_by(Contact.created_at.desc())
        
        # Pagination
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().unique().all(), total
    
    async def set_primary_contact(self, contact_id: int, company_id: int) -> Optional[Contact]:
        """Set a contact as primary for a company (unsets others)"""
        # First, unset all primary contacts for this company
        await self.db.execute(
            select(Contact)
            .where(Contact.company_id == company_id)
            .where(Contact.is_primary == True)
        )
        
        # Update all contacts for this company to is_primary=False
        from sqlalchemy import update
        await self.db.execute(
            update(Contact)
            .where(Contact.company_id == company_id)
            .values(is_primary=False)
        )
        
        # Set the specified contact as primary
        result = await self.db.execute(
            update(Contact)
            .where(Contact.id == contact_id)
            .where(Contact.company_id == company_id)
            .values(is_primary=True)
            .returning(Contact)
        )
        await self.db.flush()
        return result.scalar_one_or_none()
