"""CRM business logic services layer"""

from datetime import datetime, timezone
from typing import Any, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from sqlalchemy.exc import IntegrityError

from app.models.crm import (
    CRMCompany,
    CRMContact,
    CRMLead,
    CRMDeal,
    CRMPipeline,
    CRMPipelineStage,
    CRMActivity,
    LeadStatus,
    DealStatus,
    ActivityType,
)
from app.repositories.crm import (
    CRMCompanyRepository,
    CRMContactRepository,
    CRMLeadRepository,
    CRMDealRepository,
    CRMPipelineRepository,
    CRMActivityRepository,
)
from app.schemas.crm import (
    CRMCompanyCreate,
    CRMCompanyUpdate,
    CRMContactCreate,
    CRMContactUpdate,
    CRMLeadCreate,
    CRMLeadUpdate,
    CRMLeadConvertRequest,
    CRMDealCreate,
    CRMDealUpdate,
    CRMActivityCreate,
    CRMActivityUpdate,
    CRMPipelineCreate,
    CRMPipelineStageUpsert,
    CRMStatsResponse,
    StageStats,
    SourceStats,
)
from app.middleware.exceptions import NotFoundError, BadRequestError, ConflictError


class CRMService:
    @staticmethod
    async def seed_default_pipeline(db: AsyncSession, org_id: int) -> CRMPipeline:
        """Seed a default sales pipeline and stages for a new organization."""
        # Use superuser/unfiltered execution context to check since database auto-filtering
        # might be active based on tenant_context. We will just create it under the organization.
        
        # 1. Check if default pipeline already exists for this organization
        # The organization_id is auto-populated during save because of TenantAwareMixin
        from app.core.context import tenant_context
        prev_context = tenant_context.get()
        tenant_context.set(org_id)
        
        try:
            existing = await CRMPipelineRepository.get_default(db)
            if existing:
                return existing

            # 2. Create the default pipeline
            pipeline = await CRMPipelineRepository.create(
                db,
                name="Sales Pipeline",
                is_default=True,
                organization_id=org_id,
            )

            # 3. Create stages
            stages_data = [
                {"name": "New", "order": 0, "probability": 10, "color": "#2196F3"},
                {"name": "Contacted", "order": 1, "probability": 30, "color": "#00BCD4"},
                {"name": "Qualified", "order": 2, "probability": 50, "color": "#FF9800"},
                {"name": "Proposal Sent", "order": 3, "probability": 70, "color": "#9C27B0"},
                {"name": "Negotiation", "order": 4, "probability": 90, "color": "#E91E63"},
                {"name": "Closed Won", "order": 5, "probability": 100, "color": "#4CAF50", "is_won_stage": True},
                {"name": "Closed Lost", "order": 6, "probability": 0, "color": "#F44336", "is_lost_stage": True},
            ]

            for s in stages_data:
                await CRMPipelineRepository.create_stage(
                    db,
                    pipeline_id=pipeline.id,
                    name=s["name"],
                    order=s["order"],
                    probability=s["probability"],
                    color=s["color"],
                    is_won_stage=s.get("is_won_stage", False),
                    is_lost_stage=s.get("is_lost_stage", False),
                )
            
            return pipeline
        finally:
            tenant_context.set(prev_context)

    # --- Company CRUD ---
    @staticmethod
    async def create_company(db: AsyncSession, payload: CRMCompanyCreate, user_id: int) -> CRMCompany:
        data = payload.model_dump()
        data["created_by"] = user_id
        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = user_id
        return await CRMCompanyRepository.create(db, **data)

    @staticmethod
    async def get_company(db: AsyncSession, public_id: uuid.UUID) -> CRMCompany:
        company = await CRMCompanyRepository.get_by_public_id(db, public_id)
        if not company or company.is_deleted:
            raise NotFoundError("Company not found")
        return company

    @staticmethod
    async def update_company(db: AsyncSession, public_id: uuid.UUID, payload: CRMCompanyUpdate) -> CRMCompany:
        company = await CRMService.get_company(db, public_id)
        return await CRMCompanyRepository.update(db, company, **payload.model_dump(exclude_unset=True))

    @staticmethod
    async def delete_company(db: AsyncSession, public_id: uuid.UUID) -> None:
        company = await CRMService.get_company(db, public_id)
        await CRMCompanyRepository.delete(db, company)

    @staticmethod
    async def list_companies(
        db: AsyncSession, page: int, page_size: int, search: Optional[str] = None
    ) -> tuple[list[CRMCompany], int]:
        return await CRMCompanyRepository.list_all(db, page=page, page_size=page_size, search=search)

    # --- Contact CRUD ---
    @staticmethod
    async def create_contact(db: AsyncSession, payload: CRMContactCreate, user_id: int) -> CRMContact:
        data = payload.model_dump()
        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = user_id
        if data.get("company_id"):
            company = await CRMCompanyRepository.get_by_id(db, data["company_id"])
            if not company or company.is_deleted:
                raise NotFoundError("Linked company not found")
        return await CRMContactRepository.create(db, **data)

    @staticmethod
    async def get_contact(db: AsyncSession, public_id: uuid.UUID) -> CRMContact:
        contact = await CRMContactRepository.get_by_public_id(db, public_id)
        if not contact or contact.is_deleted:
            raise NotFoundError("Contact not found")
        return contact

    @staticmethod
    async def update_contact(db: AsyncSession, public_id: uuid.UUID, payload: CRMContactUpdate) -> CRMContact:
        contact = await CRMService.get_contact(db, public_id)
        data = payload.model_dump(exclude_unset=True)
        if data.get("company_id"):
            company = await CRMCompanyRepository.get_by_id(db, data["company_id"])
            if not company or company.is_deleted:
                raise NotFoundError("Linked company not found")
        return await CRMContactRepository.update(db, contact, **data)

    @staticmethod
    async def delete_contact(db: AsyncSession, public_id: uuid.UUID) -> None:
        contact = await CRMService.get_contact(db, public_id)
        await CRMContactRepository.delete(db, contact)

    @staticmethod
    async def list_contacts(
        db: AsyncSession, company_id: Optional[int], page: int, page_size: int, search: Optional[str] = None
    ) -> tuple[list[CRMContact], int]:
        return await CRMContactRepository.list_all(
            db, company_id=company_id, page=page, page_size=page_size, search=search
        )

    # --- Lead CRUD ---
    @staticmethod
    async def create_lead(db: AsyncSession, payload: CRMLeadCreate, user_id: int) -> CRMLead:
        data = payload.model_dump()
        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = user_id
        if data.get("company_id"):
            company = await CRMCompanyRepository.get_by_id(db, data["company_id"])
            if not company or company.is_deleted:
                raise NotFoundError("Linked company not found")
        if data.get("contact_id"):
            contact = await CRMContactRepository.get_by_id(db, data["contact_id"])
            if not contact or contact.is_deleted:
                raise NotFoundError("Linked contact not found")
        return await CRMLeadRepository.create(db, **data)

    @staticmethod
    async def get_lead(db: AsyncSession, public_id: uuid.UUID) -> CRMLead:
        lead = await CRMLeadRepository.get_by_public_id(db, public_id)
        if not lead or lead.is_deleted:
            raise NotFoundError("Lead not found")
        return lead

    @staticmethod
    async def update_lead(db: AsyncSession, public_id: uuid.UUID, payload: CRMLeadUpdate) -> CRMLead:
        lead = await CRMService.get_lead(db, public_id)
        data = payload.model_dump(exclude_unset=True)
        if data.get("company_id"):
            company = await CRMCompanyRepository.get_by_id(db, data["company_id"])
            if not company or company.is_deleted:
                raise NotFoundError("Linked company not found")
        if data.get("contact_id"):
            contact = await CRMContactRepository.get_by_id(db, data["contact_id"])
            if not contact or contact.is_deleted:
                raise NotFoundError("Linked contact not found")
        return await CRMLeadRepository.update(db, lead, **data)

    @staticmethod
    async def delete_lead(db: AsyncSession, public_id: uuid.UUID) -> None:
        lead = await CRMService.get_lead(db, public_id)
        await CRMLeadRepository.delete(db, lead)

    @staticmethod
    async def list_leads(
        db: AsyncSession, status: Optional[str], owner_id: Optional[int], page: int, page_size: int, search: Optional[str] = None
    ) -> tuple[list[CRMLead], int]:
        return await CRMLeadRepository.list_all(
            db, status=status, owner_id=owner_id, page=page, page_size=page_size, search=search
        )

    # --- Lead Conversion logic ---
    @staticmethod
    async def convert_lead(db: AsyncSession, public_id: uuid.UUID, payload: CRMLeadConvertRequest, user_id: int) -> CRMDeal:
        lead = await CRMService.get_lead(db, public_id)
        if lead.status == LeadStatus.CONVERTED:
            raise BadRequestError("Lead is already converted")

        # Verify pipeline & stage exist
        pipeline = await CRMPipelineRepository.get_by_id(db, payload.pipeline_id)
        if not pipeline:
            raise NotFoundError("Pipeline not found")
        
        stage = await CRMPipelineRepository.get_stage_by_id(db, payload.stage_id)
        if not stage or stage.pipeline_id != pipeline.id:
            raise NotFoundError("Stage not found inside the selected pipeline")

        # Create Deal
        deal_title = payload.deal_title or f"Deal: {lead.title}"
        deal_val = payload.value if payload.value is not None else (lead.estimated_value or 0.0)

        deal = await CRMDealRepository.create(
            db,
            title=deal_title,
            pipeline_id=pipeline.id,
            stage_id=stage.id,
            contact_id=lead.contact_id,
            company_id=lead.company_id,
            lead_id=lead.id,
            owner_id=lead.owner_id or user_id,
            value=deal_val,
            currency=lead.currency,
            close_date=payload.close_date,
            probability=stage.probability,
            status=DealStatus.OPEN,
        )

        # Update Lead status
        await CRMLeadRepository.update(
            db,
            lead,
            status=LeadStatus.CONVERTED,
            converted_at=datetime.now(timezone.utc),
            deal_id=deal.id,
        )

        return deal

    # --- Deal CRUD ---
    @staticmethod
    async def create_deal(db: AsyncSession, payload: CRMDealCreate, user_id: int) -> CRMDeal:
        data = payload.model_dump()
        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = user_id
        
        # Verify pipeline and stage
        pipeline = await CRMPipelineRepository.get_by_id(db, data["pipeline_id"])
        if not pipeline:
            raise NotFoundError("Pipeline not found")
        stage = await CRMPipelineRepository.get_stage_by_id(db, data["stage_id"])
        if not stage or stage.pipeline_id != pipeline.id:
            raise NotFoundError("Stage not found inside selected pipeline")

        if data.get("company_id"):
            company = await CRMCompanyRepository.get_by_id(db, data["company_id"])
            if not company or company.is_deleted:
                raise NotFoundError("Linked company not found")
        if data.get("contact_id"):
            contact = await CRMContactRepository.get_by_id(db, data["contact_id"])
            if not contact or contact.is_deleted:
                raise NotFoundError("Linked contact not found")

        # Force probability to stage default if not set
        if "probability" not in data or data["probability"] is None:
            data["probability"] = stage.probability

        return await CRMDealRepository.create(db, **data)

    @staticmethod
    async def get_deal(db: AsyncSession, public_id: uuid.UUID) -> CRMDeal:
        deal = await CRMDealRepository.get_by_public_id(db, public_id)
        if not deal or deal.is_deleted:
            raise NotFoundError("Deal not found")
        return deal

    @staticmethod
    async def update_deal(db: AsyncSession, public_id: uuid.UUID, payload: CRMDealUpdate) -> CRMDeal:
        deal = await CRMService.get_deal(db, public_id)
        data = payload.model_dump(exclude_unset=True)

        # Resolve the effective pipeline (possibly changing in this same update)
        effective_pipeline_id = data.get("pipeline_id", deal.pipeline_id)
        if "pipeline_id" in data:
            pipeline = await CRMPipelineRepository.get_by_id(db, effective_pipeline_id)
            if not pipeline:
                raise NotFoundError("Pipeline not found")

        # Handle stage change logic
        if "stage_id" in data:
            stage = await CRMPipelineRepository.get_stage_by_id(db, data["stage_id"])
            if not stage or stage.pipeline_id != effective_pipeline_id:
                raise NotFoundError("Stage not found inside selected pipeline")
            data["probability"] = stage.probability
            if stage.is_won_stage:
                data["status"] = DealStatus.WON
            elif stage.is_lost_stage:
                data["status"] = DealStatus.LOST

        if data.get("company_id"):
            company = await CRMCompanyRepository.get_by_id(db, data["company_id"])
            if not company or company.is_deleted:
                raise NotFoundError("Linked company not found")
        if data.get("contact_id"):
            contact = await CRMContactRepository.get_by_id(db, data["contact_id"])
            if not contact or contact.is_deleted:
                raise NotFoundError("Linked contact not found")

        return await CRMDealRepository.update(db, deal, **data)

    @staticmethod
    async def delete_deal(db: AsyncSession, public_id: uuid.UUID) -> None:
        deal = await CRMService.get_deal(db, public_id)
        await CRMDealRepository.delete(db, deal)

    @staticmethod
    async def list_deals(
        db: AsyncSession,
        pipeline_id: Optional[int],
        stage_id: Optional[int],
        status: Optional[str],
        owner_id: Optional[int],
        page: int,
        page_size: int,
        search: Optional[str] = None,
    ) -> tuple[list[CRMDeal], int]:
        return await CRMDealRepository.list_all(
            db,
            pipeline_id=pipeline_id,
            stage_id=stage_id,
            status=status,
            owner_id=owner_id,
            page=page,
            page_size=page_size,
            search=search,
        )

    # --- Pipeline CRUD ---
    @staticmethod
    async def list_pipelines(db: AsyncSession) -> list[CRMPipeline]:
        return await CRMPipelineRepository.list_all(db)

    @staticmethod
    async def create_pipeline(db: AsyncSession, payload: CRMPipelineCreate) -> CRMPipeline:
        pipeline = await CRMPipelineRepository.create(
            db,
            name=payload.name,
            is_default=payload.is_default,
            custom_fields=payload.custom_fields,
        )
        for stage in payload.stages:
            await CRMPipelineRepository.create_stage(db, pipeline_id=pipeline.id, **stage.model_dump())

        return await CRMPipelineRepository.get_by_id(db, pipeline.id)

    @staticmethod
    async def update_pipeline_stages(
        db: AsyncSession, pipeline_id: int, stages: list[CRMPipelineStageUpsert]
    ) -> CRMPipeline:
        """Create, update, reorder, and delete a pipeline's stages in one call.
        Any existing stage whose id is not present in `stages` is deleted."""
        pipeline = await CRMPipelineRepository.get_by_id(db, pipeline_id)
        if not pipeline:
            raise NotFoundError("Pipeline not found")

        existing_by_id = {stage.id: stage for stage in pipeline.stages}
        keep_ids = {s.id for s in stages if s.id is not None}

        for stage_id, stage in existing_by_id.items():
            if stage_id not in keep_ids:
                stage_name = stage.name
                try:
                    await CRMPipelineRepository.delete_stage(db, stage)
                except IntegrityError:
                    await db.rollback()
                    raise ConflictError(
                        f"Cannot delete stage '{stage_name}' — it still has deals assigned to it."
                    )

        for s in stages:
            data = s.model_dump(exclude={"id"})
            if s.id is not None and s.id in existing_by_id:
                await CRMPipelineRepository.update_stage(db, existing_by_id[s.id], **data)
            else:
                await CRMPipelineRepository.create_stage(db, pipeline_id=pipeline.id, **data)

        return await CRMPipelineRepository.get_by_id(db, pipeline.id, refresh=True)

    # --- Activity CRUD ---
    @staticmethod
    async def create_activity(db: AsyncSession, payload: CRMActivityCreate, user_id: int) -> CRMActivity:
        data = payload.model_dump()
        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = user_id
        
        # Verify target entity exists
        etype = data["entity_type"].lower()
        eid = data["entity_id"]
        if etype == "lead":
            ent = await CRMLeadRepository.get_by_id(db, eid)
        elif etype == "deal":
            ent = await CRMDealRepository.get_by_id(db, eid)
        elif etype == "company":
            ent = await CRMCompanyRepository.get_by_id(db, eid)
        elif etype == "contact":
            ent = await CRMContactRepository.get_by_id(db, eid)
        else:
            raise BadRequestError("Invalid entity_type")
            
        if not ent or ent.is_deleted:
            raise NotFoundError(f"Target {etype} not found")

        if data.get("is_completed") and not data.get("completed_at"):
            data["completed_at"] = datetime.now(timezone.utc)

        return await CRMActivityRepository.create(db, **data)

    @staticmethod
    async def get_activity(db: AsyncSession, public_id: uuid.UUID) -> CRMActivity:
        activity = await CRMActivityRepository.get_by_public_id(db, public_id)
        if not activity or activity.is_deleted:
            raise NotFoundError("Activity not found")
        return activity

    @staticmethod
    async def update_activity(db: AsyncSession, public_id: uuid.UUID, payload: CRMActivityUpdate) -> CRMActivity:
        activity = await CRMService.get_activity(db, public_id)
        data = payload.model_dump(exclude_unset=True)

        if data.get("is_completed") is True and not activity.is_completed:
            data["completed_at"] = datetime.now(timezone.utc)
        elif data.get("is_completed") is False:
            data["completed_at"] = None

        return await CRMActivityRepository.update(db, activity, **data)

    @staticmethod
    async def delete_activity(db: AsyncSession, public_id: uuid.UUID) -> None:
        activity = await CRMService.get_activity(db, public_id)
        await CRMActivityRepository.delete(db, activity)

    @staticmethod
    async def list_activities(
        db: AsyncSession,
        entity_type: Optional[str],
        entity_id: Optional[int],
        owner_id: Optional[int],
        is_completed: Optional[bool],
        page: int,
        page_size: int,
    ) -> tuple[list[CRMActivity], int]:
        return await CRMActivityRepository.list_all(
            db,
            entity_type=entity_type,
            entity_id=entity_id,
            owner_id=owner_id,
            is_completed=is_completed,
            page=page,
            page_size=page_size,
        )

    # --- Dashboard Summary ---
    @staticmethod
    async def get_stats(db: AsyncSession) -> CRMStatsResponse:
        # Leads count (excluding converted)
        lead_count_result = await db.execute(
            select(func.count(CRMLead.id)).where(
                and_(CRMLead.is_deleted.is_(False), CRMLead.status != LeadStatus.CONVERTED)
            )
        )
        total_leads = lead_count_result.scalar_one()

        # Deals value sum (excluding closed/won/lost - wait, let's include open deals)
        deal_value_result = await db.execute(
            select(func.sum(CRMDeal.value)).where(
                and_(CRMDeal.is_deleted.is_(False), CRMDeal.status == DealStatus.OPEN)
            )
        )
        total_deal_val = deal_value_result.scalar_one() or 0.0

        # Overdue tasks
        now = datetime.now(timezone.utc)
        overdue_result = await db.execute(
            select(func.count(CRMActivity.id)).where(
                and_(
                    CRMActivity.is_deleted.is_(False),
                    CRMActivity.type == ActivityType.TASK,
                    CRMActivity.is_completed.is_(False),
                    CRMActivity.due_date < now,
                )
            )
        )
        overdue_tasks = overdue_result.scalar_one()

        # Deal value by stage
        stages_res = await db.execute(
            select(CRMPipelineStage.id, CRMPipelineStage.name)
            .join(CRMPipeline, CRMPipeline.id == CRMPipelineStage.pipeline_id)
            .where(CRMPipeline.is_default.is_(True))
            .order_by(CRMPipelineStage.order)
        )
        stages = stages_res.all()
        deal_stage_stats = []
        for stage_id, stage_name in stages:
            deals_res = await db.execute(
                select(func.count(CRMDeal.id), func.sum(CRMDeal.value)).where(
                    and_(
                        CRMDeal.is_deleted.is_(False),
                        CRMDeal.stage_id == stage_id,
                        CRMDeal.status == DealStatus.OPEN,
                    )
                )
            )
            count, val_sum = deals_res.one()
            deal_stage_stats.append(
                StageStats(
                    stage_id=stage_id,
                    stage_name=stage_name,
                    count=count or 0,
                    total_value=float(val_sum or 0.0),
                )
            )

        # Leads by source
        leads_source_res = await db.execute(
            select(CRMLead.source, func.count(CRMLead.id))
            .where(CRMLead.is_deleted.is_(False))
            .group_by(CRMLead.source)
        )
        leads_by_source = [
            SourceStats(source=str(row[0].value if row[0] else "Unknown"), count=row[1])
            for row in leads_source_res.all()
        ]

        return CRMStatsResponse(
            total_active_leads=total_leads,
            total_deal_value=float(total_deal_val),
            deal_value_by_stage=deal_stage_stats,
            leads_by_source=leads_by_source,
            overdue_tasks_count=overdue_tasks,
        )
