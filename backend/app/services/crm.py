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
    CRMDealTask,
    CRMPipeline,
    CRMPipelineStage,
    CRMActivity,
    CRMFile,
    LeadStatus,
    LeadPriority,
    CompanyStatus,
    DealStatus,
    DealTaskStatus,
    ActivityType,
)
from app.repositories.crm import (
    CRMCompanyRepository,
    CRMContactRepository,
    CRMLeadRepository,
    CRMDealRepository,
    CRMPipelineRepository,
    CRMActivityRepository,
    CRMFileRepository,
    CRMDealTaskRepository,
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
    CRMDealTaskCreate,
    CRMDealTaskUpdate,
    CRMActivityCreate,
    CRMActivityUpdate,
    CRMActivityResponse,
    CRMFileResponse,
    CRMPipelineCreate,
    CRMPipelineStageUpsert,
    CRMStatsResponse,
    CRMLeadStatsResponse,
    CRMCompanyStatsResponse,
    StageStats,
    SourceStats,
    IndustryStats,
)
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.notification import NotificationType
from app.services.audit import AuditService
from app.services.notification import NotificationService
from app.middleware.exceptions import NotFoundError, BadRequestError, ConflictError, ForbiddenError
from app.core.config import settings


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
        db: AsyncSession,
        page: int,
        page_size: int,
        search: Optional[str] = None,
        *,
        status: Optional[str] = None,
        industry: Optional[str] = None,
        size: Optional[str] = None,
        owner_id: Optional[int] = None,
    ) -> tuple[list[CRMCompany], int]:
        return await CRMCompanyRepository.list_all(
            db, page=page, page_size=page_size, search=search,
            status=status, industry=industry, size=size, owner_id=owner_id,
        )

    @staticmethod
    async def get_company_stats(db: AsyncSession) -> CRMCompanyStatsResponse:
        status_counts_result = await db.execute(
            select(CRMCompany.status, func.count(CRMCompany.id))
            .where(CRMCompany.is_deleted.is_(False))
            .group_by(CRMCompany.status)
        )
        counts = {row[0]: row[1] for row in status_counts_result.all()}
        total_companies = sum(counts.values())

        industry_result = await db.execute(
            select(CRMCompany.industry, func.count(CRMCompany.id))
            .where(CRMCompany.is_deleted.is_(False), CRMCompany.industry.is_not(None))
            .group_by(CRMCompany.industry)
            .order_by(func.count(CRMCompany.id).desc())
            .limit(8)
        )
        by_industry = [IndustryStats(industry=row[0], count=row[1]) for row in industry_result.all()]

        open_deals_result = await db.execute(
            select(func.count(func.distinct(CRMDeal.company_id)), func.coalesce(func.sum(CRMDeal.value), 0))
            .where(
                CRMDeal.is_deleted.is_(False),
                CRMDeal.status == DealStatus.OPEN,
                CRMDeal.company_id.is_not(None),
            )
        )
        companies_with_open_deals, total_open_pipeline_value = open_deals_result.one()

        return CRMCompanyStatsResponse(
            total_companies=total_companies,
            prospect_count=counts.get(CompanyStatus.PROSPECT, 0),
            customer_count=counts.get(CompanyStatus.CUSTOMER, 0),
            churned_count=counts.get(CompanyStatus.CHURNED, 0),
            partner_count=counts.get(CompanyStatus.PARTNER, 0),
            by_industry=by_industry,
            companies_with_open_deals=companies_with_open_deals,
            total_open_pipeline_value=float(total_open_pipeline_value),
        )

    @staticmethod
    async def bulk_update_companies(
        db: AsyncSession, public_ids: list[uuid.UUID], owner_id: Optional[int], status: Optional[str],
    ) -> list[CRMCompany]:
        if owner_id is None and status is None:
            raise BadRequestError("Provide at least one of owner_id or status to update")

        result = await db.execute(
            select(CRMCompany.id).where(CRMCompany.public_id.in_(public_ids), CRMCompany.is_deleted.is_(False))
        )
        company_ids = [row[0] for row in result.all()]
        if len(company_ids) != len(set(public_ids)):
            raise NotFoundError("One or more companies not found")

        updates: dict[str, Any] = {}
        if owner_id is not None:
            updates["owner_id"] = owner_id
        if status is not None:
            updates["status"] = status

        return await CRMCompanyRepository.bulk_update(db, company_ids, **updates)

    @staticmethod
    async def bulk_delete_companies(db: AsyncSession, public_ids: list[uuid.UUID]) -> int:
        result = await db.execute(
            select(CRMCompany.id).where(CRMCompany.public_id.in_(public_ids), CRMCompany.is_deleted.is_(False))
        )
        company_ids = [row[0] for row in result.all()]
        if len(company_ids) != len(set(public_ids)):
            raise NotFoundError("One or more companies not found")

        return await CRMCompanyRepository.bulk_delete(db, company_ids)

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
    def _lead_owner_scope(current_user: User) -> Optional[int]:
        """Return current_user.id if this user's lead visibility must be restricted to
        leads they own, else None (unrestricted). MARKETING/PLACEMENT reps only see leads
        they own, so they can't see or poach a teammate's pipeline; ADMIN/MANAGER see all."""
        if current_user.is_superuser:
            return None
        if current_user.role in (UserRole.MARKETING, UserRole.PLACEMENT):
            return current_user.id
        return None

    @staticmethod
    async def _resolve_lead_currency(db: AsyncSession, currency: Optional[str], organization_id: Optional[int]) -> str:
        if currency:
            return currency
        if organization_id:
            org = await db.get(Organization, organization_id)
            if org and org.default_currency:
                return org.default_currency
        return "USD"

    @staticmethod
    async def create_lead(db: AsyncSession, payload: CRMLeadCreate, current_user: User) -> tuple[CRMLead, Optional[str]]:
        data = payload.model_dump()
        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = current_user.id
        if data.get("company_id"):
            company = await CRMCompanyRepository.get_by_id(db, data["company_id"])
            if not company or company.is_deleted:
                raise NotFoundError("Linked company not found")
        if data.get("contact_id"):
            contact = await CRMContactRepository.get_by_id(db, data["contact_id"])
            if not contact or contact.is_deleted:
                raise NotFoundError("Linked contact not found")

        data["currency"] = await CRMService._resolve_lead_currency(
            db, data.get("currency"), current_user.organization_id
        )

        # Duplicate detection: warn (don't block) if the linked contact already has an open lead.
        duplicate_warning: Optional[str] = None
        if data.get("contact_id"):
            existing_leads, _ = await CRMLeadRepository.list_all(
                db, contact_id=data["contact_id"], page=1, page_size=50
            )
            open_existing = [l for l in existing_leads if l.status != LeadStatus.CONVERTED]
            if open_existing:
                duplicate_warning = (
                    f"This contact already has {len(open_existing)} open lead(s) on file."
                )

        lead = await CRMLeadRepository.create(db, **data)
        await AuditService.record(
            db, entity_type="lead", entity_id=lead.id, action="create",
            changed_by_user_id=current_user.id,
        )
        return lead, duplicate_warning

    @staticmethod
    async def get_lead(db: AsyncSession, public_id: uuid.UUID, current_user: User) -> CRMLead:
        lead = await CRMLeadRepository.get_by_public_id(db, public_id)
        if not lead or lead.is_deleted:
            raise NotFoundError("Lead not found")
        scope_owner_id = CRMService._lead_owner_scope(current_user)
        if scope_owner_id is not None and lead.owner_id != scope_owner_id:
            # 404, not 403 - a restricted-visibility user must not learn that a lead they
            # don't own exists at all.
            raise NotFoundError("Lead not found")
        return lead

    @staticmethod
    async def update_lead(db: AsyncSession, public_id: uuid.UUID, payload: CRMLeadUpdate, current_user: User) -> CRMLead:
        lead = await CRMService.get_lead(db, public_id, current_user)
        data = payload.model_dump(exclude_unset=True)

        client_version = data.pop("version", None)
        if client_version is not None and lead.version != client_version:
            raise ConflictError("This lead was changed by someone else. Please refresh and try again.")

        if data.get("company_id"):
            company = await CRMCompanyRepository.get_by_id(db, data["company_id"])
            if not company or company.is_deleted:
                raise NotFoundError("Linked company not found")
        if data.get("contact_id"):
            contact = await CRMContactRepository.get_by_id(db, data["contact_id"])
            if not contact or contact.is_deleted:
                raise NotFoundError("Linked contact not found")

        # Snapshot old values for the fields being changed, for audit + notification purposes.
        old_owner_id = lead.owner_id
        old_status = lead.status
        changes = {
            field: (getattr(lead, field), new_val)
            for field, new_val in data.items()
            if hasattr(lead, field) and getattr(lead, field) != new_val
        }

        data["version"] = lead.version + 1
        updated = await CRMLeadRepository.update(db, lead, **data)

        await AuditService.record_field_changes(
            db, entity_type="lead", entity_id=updated.id, action="update",
            changed_by_user_id=current_user.id, changes=changes,
        )

        new_owner_id = updated.owner_id
        if "owner_id" in data and new_owner_id != old_owner_id:
            await AuditService.record(
                db, entity_type="lead", entity_id=updated.id, action="reassign",
                changed_by_user_id=current_user.id, field_name="owner_id",
                old_value=old_owner_id, new_value=new_owner_id,
            )
            if new_owner_id and new_owner_id != current_user.id:
                await NotificationService.notify(
                    db, user_id=new_owner_id, type=NotificationType.LEAD_ASSIGNED,
                    title="A lead was assigned to you",
                    message=f'"{updated.title}" was assigned to you.',
                    entity_type="lead", entity_id=updated.id,
                )
            if old_owner_id and old_owner_id != new_owner_id and old_owner_id != current_user.id:
                await NotificationService.notify(
                    db, user_id=old_owner_id, type=NotificationType.LEAD_REASSIGNED_AWAY,
                    title="A lead was reassigned away from you",
                    message=f'"{updated.title}" was reassigned to someone else.',
                    entity_type="lead", entity_id=updated.id,
                )

        if "status" in data and updated.status != old_status and updated.owner_id and updated.owner_id != current_user.id:
            await NotificationService.notify(
                db, user_id=updated.owner_id, type=NotificationType.LEAD_STATUS_CHANGED,
                title="A lead's status changed",
                message=f'"{updated.title}" is now {updated.status.value}.',
                entity_type="lead", entity_id=updated.id,
            )

        return updated

    @staticmethod
    async def delete_lead(db: AsyncSession, public_id: uuid.UUID, current_user: User) -> None:
        lead = await CRMService.get_lead(db, public_id, current_user)
        await AuditService.record(
            db, entity_type="lead", entity_id=lead.id, action="delete",
            changed_by_user_id=current_user.id,
        )
        await CRMLeadRepository.delete(db, lead)

    @staticmethod
    async def list_leads(
        db: AsyncSession,
        status: Optional[str],
        owner_id: Optional[int],
        page: int,
        page_size: int,
        search: Optional[str] = None,
        *,
        priority: Optional[str] = None,
        source: Optional[str] = None,
        stale: Optional[bool] = None,
        current_user: User,
    ) -> tuple[list[CRMLead], int]:
        scope_owner_id = CRMService._lead_owner_scope(current_user)
        effective_owner_id = scope_owner_id if scope_owner_id is not None else owner_id
        return await CRMLeadRepository.list_all(
            db,
            status=status,
            priority=priority,
            source=source,
            owner_id=effective_owner_id,
            stale_only=bool(stale),
            page=page,
            page_size=page_size,
            search=search,
        )

    @staticmethod
    async def bulk_update_leads(
        db: AsyncSession, public_ids: list[uuid.UUID], owner_id: Optional[int], status: Optional[str],
        current_user: User,
    ) -> list[CRMLead]:
        if owner_id is None and status is None:
            raise BadRequestError("Provide at least one of owner_id or status to update")

        result = await db.execute(
            select(CRMLead.id).where(CRMLead.public_id.in_(public_ids), CRMLead.is_deleted.is_(False))
        )
        lead_ids = [row[0] for row in result.all()]
        if len(lead_ids) != len(set(public_ids)):
            raise NotFoundError("One or more leads not found")

        updates: dict[str, Any] = {}
        if owner_id is not None:
            updates["owner_id"] = owner_id
        if status is not None:
            updates["status"] = status

        leads = await CRMLeadRepository.bulk_update(db, lead_ids, **updates)
        for lead in leads:
            await AuditService.record_field_changes(
                db, entity_type="lead", entity_id=lead.id, action="bulk_update",
                changed_by_user_id=current_user.id, changes={k: (None, v) for k, v in updates.items()},
            )
            if owner_id and owner_id != current_user.id:
                await NotificationService.notify(
                    db, user_id=owner_id, type=NotificationType.LEAD_ASSIGNED,
                    title="A lead was assigned to you",
                    message=f'"{lead.title}" was assigned to you.',
                    entity_type="lead", entity_id=lead.id,
                )
        return leads

    @staticmethod
    async def bulk_delete_leads(db: AsyncSession, public_ids: list[uuid.UUID], current_user: User) -> int:
        result = await db.execute(
            select(CRMLead.id).where(CRMLead.public_id.in_(public_ids), CRMLead.is_deleted.is_(False))
        )
        lead_ids = [row[0] for row in result.all()]
        if len(lead_ids) != len(set(public_ids)):
            raise NotFoundError("One or more leads not found")

        for lead_id in lead_ids:
            await AuditService.record(
                db, entity_type="lead", entity_id=lead_id, action="bulk_delete",
                changed_by_user_id=current_user.id,
            )
        return await CRMLeadRepository.bulk_delete(db, lead_ids)

    @staticmethod
    async def list_stale_leads(db: AsyncSession, current_user: User, page: int, page_size: int) -> tuple[list[CRMLead], int]:
        scope_owner_id = CRMService._lead_owner_scope(current_user)
        return await CRMLeadRepository.list_all(
            db, owner_id=scope_owner_id, stale_only=True,
            stale_days=settings.LEAD_STALE_DAYS, page=page, page_size=page_size,
        )

    # --- CSV Export/Import ---
    LEAD_EXPORT_MAX_ROWS = 50_000
    LEAD_EXPORT_COLUMNS = [
        "title", "status", "priority", "source", "estimated_value", "currency",
        "description", "owner_id", "contact_id", "company_id", "tags", "created_at",
    ]

    @staticmethod
    async def export_leads_csv(
        db: AsyncSession, current_user: User, *,
        status: Optional[str] = None, priority: Optional[str] = None,
        source: Optional[str] = None, owner_id: Optional[int] = None, search: Optional[str] = None,
    ) -> str:
        import csv
        import io

        scope_owner_id = CRMService._lead_owner_scope(current_user)
        effective_owner_id = scope_owner_id if scope_owner_id is not None else owner_id

        leads, _ = await CRMLeadRepository.list_all(
            db, status=status, priority=priority, source=source, owner_id=effective_owner_id,
            search=search, page=1, page_size=CRMService.LEAD_EXPORT_MAX_ROWS,
        )

        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=CRMService.LEAD_EXPORT_COLUMNS)
        writer.writeheader()
        for lead in leads:
            writer.writerow({
                "title": lead.title,
                "status": lead.status.value if lead.status else "",
                "priority": lead.priority.value if lead.priority else "",
                "source": lead.source.value if lead.source else "",
                "estimated_value": lead.estimated_value if lead.estimated_value is not None else "",
                "currency": lead.currency,
                "description": lead.description or "",
                "owner_id": lead.owner_id or "",
                "contact_id": lead.contact_id or "",
                "company_id": lead.company_id or "",
                "tags": ",".join(lead.tags or []),
                "created_at": lead.created_at.isoformat() if lead.created_at else "",
            })
        return buffer.getvalue()

    @staticmethod
    async def import_leads_csv(db: AsyncSession, current_user: User, content: bytes) -> dict[str, Any]:
        import csv
        import io
        from pydantic import ValidationError

        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise BadRequestError("CSV file must be UTF-8 encoded")

        reader = csv.DictReader(io.StringIO(text))
        if reader.fieldnames is None:
            raise BadRequestError("CSV file is empty or missing a header row")

        results: list[dict[str, Any]] = []
        success_count = 0
        for row_number, row in enumerate(reader, start=2):  # row 1 is the header
            row_result: dict[str, Any] = {"row_number": row_number, "success": False, "lead_public_id": None, "error": None, "duplicate_warning": None}
            try:
                contact_id = None
                if row.get("contact_email"):
                    contacts, _ = await CRMContactRepository.list_all(db, page=1, page_size=1, search=row["contact_email"])
                    contact_id = contacts[0].id if contacts else None

                company_id = None
                if row.get("company_name"):
                    companies, _ = await CRMCompanyRepository.list_all(db, page=1, page_size=1, search=row["company_name"])
                    company_id = companies[0].id if companies else None

                payload = CRMLeadCreate(
                    title=row.get("title", "").strip(),
                    source=row.get("source") or None,
                    priority=row.get("priority") or LeadPriority.MEDIUM,
                    estimated_value=float(row["estimated_value"]) if row.get("estimated_value") else None,
                    currency=row.get("currency") or None,
                    description=row.get("description") or None,
                    contact_id=contact_id,
                    company_id=company_id,
                )
                lead, duplicate_warning = await CRMService.create_lead(db, payload, current_user)
                row_result.update(success=True, lead_public_id=str(lead.public_id), duplicate_warning=duplicate_warning)
                success_count += 1
            except (ValidationError, ValueError) as e:
                row_result["error"] = str(e)
            except (NotFoundError, BadRequestError) as e:
                row_result["error"] = e.message
            results.append(row_result)

        return {
            "total_rows": len(results),
            "success_count": success_count,
            "failure_count": len(results) - success_count,
            "results": results,
        }

    @staticmethod
    async def anonymize_lead(db: AsyncSession, public_id: uuid.UUID, current_user: User) -> CRMLead:
        """GDPR/right-to-be-forgotten: scrub PII while keeping aggregate-stat fields intact."""
        lead = await CRMService.get_lead(db, public_id, current_user)

        old_title, old_description = lead.title, lead.description
        await CRMLeadRepository.update(
            db, lead,
            title="[Anonymized Lead]",
            description=None,
            custom_fields=None,
            tags=None,
            is_anonymized=True,
        )

        # Cascade-delete file attachments (disk + DB) via the existing file-deletion logic.
        files, _ = await CRMFileRepository.list_by_entity(db, entity_type="lead", entity_id=lead.id, page=1, page_size=1000)
        for f in files:
            await CRMService.delete_file(db, f.public_id)

        await AuditService.record(
            db, entity_type="lead", entity_id=lead.id, action="anonymize",
            changed_by_user_id=current_user.id, field_name="title",
            old_value=old_title, new_value="[Anonymized Lead]",
        )
        return lead

    @staticmethod
    async def get_lead_history(db: AsyncSession, public_id: uuid.UUID, current_user: User, page: int, page_size: int):
        lead = await CRMService.get_lead(db, public_id, current_user)
        return await AuditService.list_for_entity(db, entity_type="lead", entity_id=lead.id, page=page, page_size=page_size)

    # --- Lead Conversion logic ---
    @staticmethod
    async def convert_lead(db: AsyncSession, public_id: uuid.UUID, payload: CRMLeadConvertRequest, current_user: User) -> CRMDeal:
        user_id = current_user.id
        lead = await CRMService.get_lead(db, public_id, current_user)
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
        await AuditService.record(
            db, entity_type="lead", entity_id=lead.id, action="convert",
            changed_by_user_id=user_id, field_name="status",
            old_value=LeadStatus.NEW if lead.status == LeadStatus.NEW else lead.status,
            new_value=LeadStatus.CONVERTED,
        )

        # Clone lead attachments to Deal and Contact
        lead_files, _ = await CRMFileRepository.list_by_entity(
            db, entity_type="lead", entity_id=lead.id, page=1, page_size=100
        )
        for f in lead_files:
            # Clone to deal
            await CRMFileRepository.create(
                db,
                file_name=f.file_name,
                file_path=f.file_path,
                mime_type=f.mime_type,
                file_size=f.file_size,
                entity_type="deal",
                entity_id=deal.id,
                owner_id=f.owner_id,
            )
            # Clone to contact
            if lead.contact_id:
                await CRMFileRepository.create(
                    db,
                    file_name=f.file_name,
                    file_path=f.file_path,
                    mime_type=f.mime_type,
                    file_size=f.file_size,
                    entity_type="contact",
                    entity_id=lead.contact_id,
                    owner_id=f.owner_id,
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
        company_id: Optional[int] = None,
        contact_id: Optional[int] = None,
    ) -> tuple[list[CRMDeal], int]:
        return await CRMDealRepository.list_all(
            db,
            pipeline_id=pipeline_id,
            stage_id=stage_id,
            status=status,
            owner_id=owner_id,
            company_id=company_id,
            contact_id=contact_id,
            page=page,
            page_size=page_size,
            search=search,
        )

    # --- Pipeline CRUD ---
    @staticmethod
    async def list_pipelines(db: AsyncSession) -> list[CRMPipeline]:
        pipelines = await CRMPipelineRepository.list_all(db)
        if not pipelines:
            from app.core.context import tenant_context
            org_id = tenant_context.get()
            if org_id is not None:
                await CRMService.seed_default_pipeline(db, org_id)
                pipelines = await CRMPipelineRepository.list_all(db)
        return pipelines

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

        activity = await CRMActivityRepository.create(db, **data)

        # Denormalized last_activity_at on the lead - powers stale-lead detection without
        # an expensive correlated subquery on every list call.
        if etype == "lead":
            await CRMLeadRepository.update(db, ent, last_activity_at=datetime.now(timezone.utc))

        return activity

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
        type: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> tuple[list[CRMActivity], int]:
        return await CRMActivityRepository.list_all(
            db,
            entity_type=entity_type,
            entity_id=entity_id,
            owner_id=owner_id,
            is_completed=is_completed,
            type=type,
            date_from=date_from,
            date_to=date_to,
            page=page,
            page_size=page_size,
        )

    # --- Dashboard Summary ---
    @staticmethod
    async def get_stats(db: AsyncSession, current_user_id: int) -> CRMStatsResponse:
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

        # Conversion rate — converted leads as a share of all leads ever created
        all_leads_result = await db.execute(
            select(func.count(CRMLead.id)).where(CRMLead.is_deleted.is_(False))
        )
        all_leads_count = all_leads_result.scalar_one()

        converted_result = await db.execute(
            select(func.count(CRMLead.id)).where(
                and_(CRMLead.is_deleted.is_(False), CRMLead.status == LeadStatus.CONVERTED)
            )
        )
        converted_count = converted_result.scalar_one()
        conversion_rate = round((converted_count / all_leads_count) * 100, 1) if all_leads_count else 0.0

        # My tasks — this user's open tasks, soonest due date first
        my_tasks_result = await db.execute(
            select(CRMActivity)
            .where(
                and_(
                    CRMActivity.is_deleted.is_(False),
                    CRMActivity.type == ActivityType.TASK,
                    CRMActivity.is_completed.is_(False),
                    CRMActivity.owner_id == current_user_id,
                )
            )
            .order_by(CRMActivity.due_date.asc().nulls_last())
            .limit(10)
        )
        my_tasks = list(my_tasks_result.scalars().all())

        return CRMStatsResponse(
            total_active_leads=total_leads,
            total_deal_value=float(total_deal_val),
            deal_value_by_stage=deal_stage_stats,
            leads_by_source=leads_by_source,
            overdue_tasks_count=overdue_tasks,
            conversion_rate=conversion_rate,
            my_tasks=[CRMActivityResponse.model_validate(t) for t in my_tasks],
        )

    # --- Lead Stats (for the Leads list page) ---
    @staticmethod
    async def get_lead_stats(db: AsyncSession, current_user: User) -> CRMLeadStatsResponse:
        conditions = [CRMLead.is_deleted.is_(False)]
        scope_owner_id = CRMService._lead_owner_scope(current_user)
        if scope_owner_id is not None:
            conditions.append(CRMLead.owner_id == scope_owner_id)

        status_counts_result = await db.execute(
            select(CRMLead.status, func.count(CRMLead.id))
            .where(*conditions)
            .group_by(CRMLead.status)
        )
        counts = {row[0]: row[1] for row in status_counts_result.all()}
        total_leads = sum(counts.values())
        converted_count = counts.get(LeadStatus.CONVERTED, 0)
        conversion_rate = round((converted_count / total_leads) * 100, 1) if total_leads else 0.0

        return CRMLeadStatsResponse(
            total_leads=total_leads,
            new_count=counts.get(LeadStatus.NEW, 0),
            contacted_count=counts.get(LeadStatus.CONTACTED, 0),
            qualified_count=counts.get(LeadStatus.QUALIFIED, 0),
            unqualified_count=counts.get(LeadStatus.UNQUALIFIED, 0),
            converted_count=converted_count,
            conversion_rate=conversion_rate,
        )

    # --- Owner Options (for owner-reassignment pickers) ---
    @staticmethod
    async def list_assignable_owners(db: AsyncSession, organization_id: int) -> list[User]:
        result = await db.execute(
            select(User)
            .where(User.organization_id == organization_id, User.is_active.is_(True))
            .order_by(User.full_name, User.email)
        )
        return list(result.scalars().all())

    # --- Cross-Entity Search ---
    @staticmethod
    async def search(db: AsyncSession, query: str, current_user: User) -> dict[str, list]:
        companies, _ = await CRMCompanyRepository.list_all(db, page=1, page_size=5, search=query)
        contacts, _ = await CRMContactRepository.list_all(db, company_id=None, page=1, page_size=5, search=query)
        leads, _ = await CRMLeadRepository.list_all(
            db, owner_id=CRMService._lead_owner_scope(current_user), page=1, page_size=5, search=query
        )
        deals, _ = await CRMDealRepository.list_all(db, page=1, page_size=5, search=query)
        return {
            "companies": companies,
            "contacts": contacts,
            "leads": leads,
            "deals": deals,
        }

    # --- File Management ---
    @staticmethod
    async def create_file(
        db: AsyncSession,
        *,
        file_name: str,
        file_path: str,
        file_size: int,
        mime_type: str,
        entity_type: str,
        entity_id: int,
        owner_id: Optional[int] = None,
    ) -> CRMFile:
        # First check that the target entity exists
        if entity_type == "lead":
            entity = await CRMLeadRepository.get_by_id(db, entity_id)
        elif entity_type == "deal":
            entity = await CRMDealRepository.get_by_id(db, entity_id)
        elif entity_type == "company":
            entity = await CRMCompanyRepository.get_by_id(db, entity_id)
        elif entity_type == "contact":
            entity = await CRMContactRepository.get_by_id(db, entity_id)
        else:
            raise BadRequestError(f"Invalid entity type: {entity_type}")

        if not entity:
            raise NotFoundError(f"{entity_type.capitalize()} with ID {entity_id} not found")

        return await CRMFileRepository.create(
            db,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            entity_type=entity_type,
            entity_id=entity_id,
            owner_id=owner_id,
        )

    @staticmethod
    async def get_file(db: AsyncSession, public_id: uuid.UUID) -> CRMFile:
        crm_file = await CRMFileRepository.get_by_public_id(db, public_id)
        if not crm_file:
            raise NotFoundError("File not found")
        return crm_file

    @staticmethod
    async def delete_file(db: AsyncSession, public_id: uuid.UUID) -> None:
        crm_file = await CRMFileRepository.get_by_public_id(db, public_id)
        if not crm_file:
            raise NotFoundError("File not found")
        
        # Hard delete / remove from disk if required
        import os
        if os.path.exists(crm_file.file_path):
            try:
                os.remove(crm_file.file_path)
            except Exception as e:
                # Log error but proceed with database deletion
                from loguru import logger
                logger.error(f"Failed to remove file from disk: {e}")
                
        await CRMFileRepository.delete(db, crm_file)

    @staticmethod
    async def list_files(
        db: AsyncSession,
        *,
        entity_type: str,
        entity_id: int,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[CRMFile], int]:
        return await CRMFileRepository.list_by_entity(
            db,
            entity_type=entity_type,
            entity_id=entity_id,
            page=page,
            page_size=page_size,
        )

    # -------------------------------------------------------------------------
    # Deal Tasks
    # -------------------------------------------------------------------------

    @staticmethod
    async def list_deal_tasks(db: AsyncSession, deal_public_id: uuid.UUID) -> list[CRMDealTask]:
        deal = await CRMDealRepository.get_by_public_id(db, deal_public_id)
        if not deal:
            raise NotFoundError("Deal not found")
        return await CRMDealTaskRepository.list_by_deal(db, deal_id=deal.id)

    @staticmethod
    async def create_deal_task(
        db: AsyncSession,
        deal_public_id: uuid.UUID,
        payload: CRMDealTaskCreate,
        created_by_user_id: int,
    ) -> CRMDealTask:
        deal = await CRMDealRepository.get_by_public_id(db, deal_public_id)
        if not deal:
            raise NotFoundError("Deal not found")

        task = await CRMDealTaskRepository.create(
            db,
            deal_id=deal.id,
            title=payload.title,
            task_type=payload.task_type,
            due_date=payload.due_date,
            notes=payload.notes,
            assignee_id=payload.assignee_id,
            order=payload.order,
        )

        # Notify assignee if different from creator
        if payload.assignee_id and payload.assignee_id != created_by_user_id:
            try:
                await NotificationService.notify(
                    db,
                    user_id=payload.assignee_id,
                    type=NotificationType.DEAL_TASK_ASSIGNED,
                    title="You've been assigned a deal task",
                    message=f"Task \"{payload.title}\" has been assigned to you for deal \"{deal.title}\".",
                    entity_type="deal_task",
                    entity_id=task.id,
                )
            except Exception:
                pass  # Non-blocking

        await db.commit()
        await db.refresh(task)
        return task

    @staticmethod
    async def update_deal_task(
        db: AsyncSession,
        task_public_id: uuid.UUID,
        payload: CRMDealTaskUpdate,
        updated_by_user_id: int,
    ) -> CRMDealTask:
        task = await CRMDealTaskRepository.get_by_public_id(db, task_public_id)
        if not task or task.is_deleted:
            raise NotFoundError("Task not found")

        update_data = payload.model_dump(exclude_unset=True)

        # Auto-set completed_at when status flips to completed
        if update_data.get("status") == DealTaskStatus.COMPLETED and task.status != DealTaskStatus.COMPLETED:
            update_data["completed_at"] = datetime.now(timezone.utc)
        elif update_data.get("status") and update_data["status"] != DealTaskStatus.COMPLETED:
            update_data["completed_at"] = None

        task = await CRMDealTaskRepository.update(db, task, **update_data)

        # Notifications
        try:
            if update_data.get("status") == DealTaskStatus.COMPLETED and task.assignee_id and task.assignee_id != updated_by_user_id:
                await NotificationService.notify(
                    db,
                    user_id=task.assignee_id,
                    type=NotificationType.DEAL_TASK_COMPLETED,
                    title="Deal task completed",
                    message=f"Task \"{task.title}\" has been marked as completed.",
                    entity_type="deal_task",
                    entity_id=task.id,
                )
            elif update_data.get("assignee_id") and update_data["assignee_id"] != updated_by_user_id:
                await NotificationService.notify(
                    db,
                    user_id=update_data["assignee_id"],
                    type=NotificationType.DEAL_TASK_ASSIGNED,
                    title="You've been assigned a deal task",
                    message=f"Task \"{task.title}\" has been assigned to you.",
                    entity_type="deal_task",
                    entity_id=task.id,
                )
        except Exception:
            pass  # Non-blocking

        await db.commit()
        await db.refresh(task)
        return task

    @staticmethod
    async def delete_deal_task(db: AsyncSession, task_public_id: uuid.UUID) -> None:
        task = await CRMDealTaskRepository.get_by_public_id(db, task_public_id)
        if not task or task.is_deleted:
            raise NotFoundError("Task not found")
        await CRMDealTaskRepository.delete(db, task)
        await db.commit()
