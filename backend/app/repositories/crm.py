"""CRM data access layer repositories"""

import uuid
from datetime import datetime
from typing import Any, Optional
from sqlalchemy import func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.crm import (
    CRMCompany,
    CRMContact,
    CRMLead,
    CRMDeal,
    CRMPipeline,
    CRMPipelineStage,
    CRMActivity,
    LeadStatus,
)


class CRMCompanyRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, company_id: int) -> Optional[CRMCompany]:
        return await db.get(CRMCompany, company_id)

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[CRMCompany]:
        result = await db.execute(select(CRMCompany).where(CRMCompany.public_id == public_id))
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, name: str, **kwargs) -> CRMCompany:
        company = CRMCompany(name=name, **kwargs)
        db.add(company)
        await db.flush()
        return company

    @staticmethod
    async def update(db: AsyncSession, company: CRMCompany, **kwargs) -> CRMCompany:
        for key, val in kwargs.items():
            if val is not None or key in ["industry", "website", "phone", "email", "address", "size", "owner_id", "tags", "custom_fields"]:
                setattr(company, key, val)
        await db.flush()
        await db.refresh(company)
        return company

    @staticmethod
    async def delete(db: AsyncSession, company: CRMCompany) -> None:
        company.soft_delete()
        await db.flush()

    @staticmethod
    async def list_all(
        db: AsyncSession,
        *,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> tuple[list[CRMCompany], int]:
        conditions = [CRMCompany.is_deleted.is_(False)]
        if search:
            conditions.append(CRMCompany.name.ilike(f"%{search}%"))

        count_result = await db.execute(
            select(func.count()).select_from(CRMCompany).where(*conditions)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(CRMCompany)
            .where(*conditions)
            .order_by(CRMCompany.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total


class CRMContactRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, contact_id: int) -> Optional[CRMContact]:
        return await db.get(CRMContact, contact_id)

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[CRMContact]:
        result = await db.execute(select(CRMContact).where(CRMContact.public_id == public_id))
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, first_name: str, **kwargs) -> CRMContact:
        contact = CRMContact(first_name=first_name, **kwargs)
        db.add(contact)
        await db.flush()
        return contact

    @staticmethod
    async def update(db: AsyncSession, contact: CRMContact, **kwargs) -> CRMContact:
        for key, val in kwargs.items():
            if val is not None or key in ["last_name", "email", "phone", "mobile", "job_title", "department", "company_id", "owner_id", "tags", "social_links", "custom_fields"]:
                setattr(contact, key, val)
        await db.flush()
        await db.refresh(contact)
        return contact

    @staticmethod
    async def delete(db: AsyncSession, contact: CRMContact) -> None:
        contact.soft_delete()
        await db.flush()

    @staticmethod
    async def list_all(
        db: AsyncSession,
        *,
        company_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> tuple[list[CRMContact], int]:
        conditions = [CRMContact.is_deleted.is_(False)]
        if company_id:
            conditions.append(CRMContact.company_id == company_id)
        if search:
            conditions.append(
                or_(
                    CRMContact.first_name.ilike(f"%{search}%"),
                    CRMContact.last_name.ilike(f"%{search}%"),
                    CRMContact.email.ilike(f"%{search}%"),
                )
            )

        count_result = await db.execute(
            select(func.count()).select_from(CRMContact).where(*conditions)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(CRMContact)
            .where(*conditions)
            .order_by(CRMContact.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total


class CRMLeadRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, lead_id: int) -> Optional[CRMLead]:
        return await db.get(CRMLead, lead_id)

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[CRMLead]:
        result = await db.execute(select(CRMLead).where(CRMLead.public_id == public_id))
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, title: str, **kwargs) -> CRMLead:
        lead = CRMLead(title=title, **kwargs)
        db.add(lead)
        await db.flush()
        return lead

    @staticmethod
    async def update(db: AsyncSession, lead: CRMLead, **kwargs) -> CRMLead:
        for key, val in kwargs.items():
            if val is not None or key in ["contact_id", "company_id", "source", "status", "priority", "owner_id", "estimated_value", "currency", "description", "custom_fields"]:
                setattr(lead, key, val)
        await db.flush()
        await db.refresh(lead)
        return lead

    @staticmethod
    async def delete(db: AsyncSession, lead: CRMLead) -> None:
        lead.soft_delete()
        await db.flush()

    @staticmethod
    async def bulk_update(db: AsyncSession, lead_ids: list[int], **kwargs) -> list[CRMLead]:
        result = await db.execute(
            select(CRMLead).where(CRMLead.id.in_(lead_ids), CRMLead.is_deleted.is_(False))
        )
        leads = list(result.scalars().all())
        for lead in leads:
            for key, val in kwargs.items():
                setattr(lead, key, val)
        await db.flush()
        for lead in leads:
            await db.refresh(lead)
        return leads

    @staticmethod
    async def list_all(
        db: AsyncSession,
        *,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        source: Optional[str] = None,
        owner_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> tuple[list[CRMLead], int]:
        conditions = [CRMLead.is_deleted.is_(False)]
        if status:
            conditions.append(CRMLead.status == status)
        if priority:
            conditions.append(CRMLead.priority == priority)
        if source:
            conditions.append(CRMLead.source == source)
        if owner_id:
            conditions.append(CRMLead.owner_id == owner_id)
        if search:
            conditions.append(CRMLead.title.ilike(f"%{search}%"))

        count_result = await db.execute(
            select(func.count()).select_from(CRMLead).where(*conditions)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(CRMLead)
            .where(*conditions)
            .order_by(CRMLead.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total


class CRMDealRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, deal_id: int) -> Optional[CRMDeal]:
        return await db.get(CRMDeal, deal_id)

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[CRMDeal]:
        result = await db.execute(select(CRMDeal).where(CRMDeal.public_id == public_id))
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, title: str, pipeline_id: int, stage_id: int, **kwargs) -> CRMDeal:
        deal = CRMDeal(title=title, pipeline_id=pipeline_id, stage_id=stage_id, **kwargs)
        db.add(deal)
        await db.flush()
        return deal

    @staticmethod
    async def update(db: AsyncSession, deal: CRMDeal, **kwargs) -> CRMDeal:
        for key, val in kwargs.items():
            if val is not None or key in ["contact_id", "company_id", "pipeline_id", "stage_id", "owner_id", "value", "currency", "close_date", "probability", "status", "lost_reason", "tags", "custom_fields"]:
                setattr(deal, key, val)
        await db.flush()
        await db.refresh(deal)
        return deal

    @staticmethod
    async def delete(db: AsyncSession, deal: CRMDeal) -> None:
        deal.soft_delete()
        await db.flush()

    @staticmethod
    async def list_all(
        db: AsyncSession,
        *,
        pipeline_id: Optional[int] = None,
        stage_id: Optional[int] = None,
        status: Optional[str] = None,
        owner_id: Optional[int] = None,
        company_id: Optional[int] = None,
        contact_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> tuple[list[CRMDeal], int]:
        conditions = [CRMDeal.is_deleted.is_(False)]
        if pipeline_id:
            conditions.append(CRMDeal.pipeline_id == pipeline_id)
        if stage_id:
            conditions.append(CRMDeal.stage_id == stage_id)
        if status:
            conditions.append(CRMDeal.status == status)
        if owner_id:
            conditions.append(CRMDeal.owner_id == owner_id)
        if company_id:
            conditions.append(CRMDeal.company_id == company_id)
        if contact_id:
            conditions.append(CRMDeal.contact_id == contact_id)
        if search:
            conditions.append(CRMDeal.title.ilike(f"%{search}%"))

        count_result = await db.execute(
            select(func.count()).select_from(CRMDeal).where(*conditions)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(CRMDeal)
            .where(*conditions)
            .order_by(CRMDeal.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total


class CRMPipelineRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, pipeline_id: int, *, refresh: bool = False) -> Optional[CRMPipeline]:
        query = (
            select(CRMPipeline)
            .options(selectinload(CRMPipeline.stages))
            .where(CRMPipeline.id == pipeline_id)
        )
        if refresh:
            # Without this, selectinload won't re-populate `.stages` on a pipeline
            # instance already in the identity map (e.g. re-fetched after mutating its stages).
            query = query.execution_options(populate_existing=True)
        result = await db.execute(query)
        return result.scalars().first()

    @staticmethod
    async def get_default(db: AsyncSession) -> Optional[CRMPipeline]:
        result = await db.execute(
            select(CRMPipeline)
            .options(selectinload(CRMPipeline.stages))
            .where(CRMPipeline.is_default.is_(True))
        )
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, name: str, is_default: bool = False, **kwargs) -> CRMPipeline:
        pipeline = CRMPipeline(name=name, is_default=is_default, **kwargs)
        db.add(pipeline)
        await db.flush()
        return pipeline

    @staticmethod
    async def create_stage(db: AsyncSession, *, pipeline_id: int, name: str, **kwargs) -> CRMPipelineStage:
        stage = CRMPipelineStage(pipeline_id=pipeline_id, name=name, **kwargs)
        db.add(stage)
        await db.flush()
        return stage

    @staticmethod
    async def get_stage_by_id(db: AsyncSession, stage_id: int) -> Optional[CRMPipelineStage]:
        return await db.get(CRMPipelineStage, stage_id)

    @staticmethod
    async def update_stage(db: AsyncSession, stage: CRMPipelineStage, **kwargs) -> CRMPipelineStage:
        for key, val in kwargs.items():
            setattr(stage, key, val)
        await db.flush()
        return stage

    @staticmethod
    async def delete_stage(db: AsyncSession, stage: CRMPipelineStage) -> None:
        await db.delete(stage)
        await db.flush()

    @staticmethod
    async def update(db: AsyncSession, pipeline: CRMPipeline, **kwargs) -> CRMPipeline:
        for key, val in kwargs.items():
            setattr(pipeline, key, val)
        await db.flush()
        return pipeline

    @staticmethod
    async def list_all(db: AsyncSession) -> list[CRMPipeline]:
        result = await db.execute(
            select(CRMPipeline)
            .options(selectinload(CRMPipeline.stages))
            .order_by(CRMPipeline.id)
        )
        return list(result.scalars().all())


class CRMActivityRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, activity_id: int) -> Optional[CRMActivity]:
        return await db.get(CRMActivity, activity_id)

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[CRMActivity]:
        result = await db.execute(select(CRMActivity).where(CRMActivity.public_id == public_id))
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, type: str, subject: str, entity_type: str, entity_id: int, **kwargs) -> CRMActivity:
        activity = CRMActivity(type=type, subject=subject, entity_type=entity_type, entity_id=entity_id, **kwargs)
        db.add(activity)
        await db.flush()
        return activity

    @staticmethod
    async def update(db: AsyncSession, activity: CRMActivity, **kwargs) -> CRMActivity:
        for key, val in kwargs.items():
            if val is not None or key in ["description", "due_date", "completed_at", "is_completed", "outcome", "owner_id", "custom_fields"]:
                setattr(activity, key, val)
        await db.flush()
        await db.refresh(activity)
        return activity

    @staticmethod
    async def delete(db: AsyncSession, activity: CRMActivity) -> None:
        activity.soft_delete()
        await db.flush()

    @staticmethod
    async def list_all(
        db: AsyncSession,
        *,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        owner_id: Optional[int] = None,
        is_completed: Optional[bool] = None,
        type: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[CRMActivity], int]:
        conditions = [CRMActivity.is_deleted.is_(False)]
        if entity_type:
            conditions.append(CRMActivity.entity_type == entity_type)
        if entity_id:
            conditions.append(CRMActivity.entity_id == entity_id)
        if owner_id:
            conditions.append(CRMActivity.owner_id == owner_id)
        if is_completed is not None:
            conditions.append(CRMActivity.is_completed == is_completed)
        if type:
            conditions.append(CRMActivity.type == type)
        if date_from:
            conditions.append(CRMActivity.created_at >= date_from)
        if date_to:
            conditions.append(CRMActivity.created_at <= date_to)

        count_result = await db.execute(
            select(func.count()).select_from(CRMActivity).where(*conditions)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(CRMActivity)
            .where(*conditions)
            .order_by(CRMActivity.due_date.asc().nulls_last(), CRMActivity.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total
