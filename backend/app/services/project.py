"""Project Management business logic services layer"""

import uuid
from datetime import datetime, timezone, date as date_type
from decimal import Decimal
from typing import Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy.future import select

from app.models.project import Project, ProjectTask, ProjectTaskStatus, ProjectTaskFile
from app.models.crm import CRMDeal, DealStatus
from app.models.organization import Organization
from app.repositories.project import (
    ProjectRepository,
    ProjectTaskRepository,
    ProjectTaskStatusRepository,
    ProjectTaskFileRepository,
)
from app.repositories.crm import CRMDealRepository
from app.repositories.audit import AuditLogRepository
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectTaskCreate,
    ProjectTaskUpdate,
    ProjectTaskStatusUpsert,
    DealConvertToProjectRequest,
    DealProjectConversionPreview,
)
from app.models.user import User
from app.services.audit import AuditService
from app.services.currency import CurrencyConversionService
from app.middleware.exceptions import NotFoundError, BadRequestError, ConflictError
from app.core.context import tenant_context
from app.services.project_templates import PROJECT_TEMPLATES


class ProjectService:
    # --- Task status seeding & configuration ---
    @staticmethod
    async def seed_default_task_statuses(db: AsyncSession, org_id: int) -> list[ProjectTaskStatus]:
        """Seed a default task-status workflow for a new organization.
        Mirrors CRMService.seed_default_pipeline exactly."""
        prev_context = tenant_context.get()
        tenant_context.set(org_id)

        try:
            existing = await ProjectTaskStatusRepository.list_all(db)
            if existing:
                return existing

            statuses_data = [
                {"name": "Planning", "order": 0, "color": "#9E9E9E", "is_initial_status": True},
                {"name": "Active", "order": 1, "color": "#2196F3"},
                {"name": "In Progress", "order": 2, "color": "#FF9800"},
                {"name": "Delayed", "order": 3, "color": "#F44336"},
                {"name": "In Testing", "order": 4, "color": "#00BCD4"},
                {"name": "On Hold", "order": 5, "color": "#E91E63"},
                {"name": "Completed", "order": 6, "color": "#4CAF50", "is_done_status": True},
                {"name": "Approved", "order": 7, "color": "#009688", "is_done_status": True},
                {"name": "Invoiced", "order": 8, "color": "#3F51B5", "is_done_status": True},
                {"name": "Canceled", "order": 9, "color": "#757575", "is_done_status": True},
            ]

            created = []
            for s in statuses_data:
                created.append(
                    await ProjectTaskStatusRepository.create(
                        db,
                        name=s["name"],
                        order=s["order"],
                        color=s["color"],
                        is_initial_status=s.get("is_initial_status", False),
                        is_done_status=s.get("is_done_status", False),
                        organization_id=org_id,
                    )
                )
            return created
        finally:
            tenant_context.set(prev_context)

    @staticmethod
    async def update_task_statuses(db: AsyncSession, statuses: list[ProjectTaskStatusUpsert]) -> list[ProjectTaskStatus]:
        """Create, update, reorder, and delete an org's task statuses in one call.
        Any existing status whose id is not present in `statuses` is deleted.
        Mirrors CRMService.update_pipeline_stages exactly."""
        existing = await ProjectTaskStatusRepository.list_all(db)
        existing_by_id = {status.id: status for status in existing}
        keep_ids = {s.id for s in statuses if s.id is not None}

        for status_id, status in existing_by_id.items():
            if status_id not in keep_ids:
                status_name = status.name
                try:
                    await ProjectTaskStatusRepository.delete(db, status)
                except IntegrityError:
                    await db.rollback()
                    raise ConflictError(
                        f"Cannot delete status '{status_name}' — it still has tasks assigned to it."
                    )

        for s in statuses:
            data = s.model_dump(exclude={"id"})
            if s.id is not None and s.id in existing_by_id:
                await ProjectTaskStatusRepository.update(db, existing_by_id[s.id], **data)
            else:
                await ProjectTaskStatusRepository.create(db, **data)

        return await ProjectTaskStatusRepository.list_all(db)

    @staticmethod
    async def check_project_limit(db: AsyncSession, organization_id: int) -> None:
        from app.repositories.organization import OrganizationRepository
        from app.models.plan import PlanTier

        org = await OrganizationRepository.get_by_id(db, organization_id)
        if not org:
            return

        account_type = org.others.get("account_type", "individual") if org.others else "individual"
        tier = org.plan.tier if org.plan else PlanTier.FREE

        # Define limits:
        # individual: free=2, basic=5, pro=unlimited, enterprise=unlimited
        # organization: free=5, basic=20, pro=unlimited, enterprise=unlimited
        limits = {
            "individual": {
                PlanTier.FREE: 2,
                PlanTier.BASIC: 5,
            },
            "organization": {
                PlanTier.FREE: 5,
                PlanTier.BASIC: 20,
            }
        }

        limit = limits.get(account_type, {}).get(tier)
        if limit is not None:
            _, total_active_projects = await ProjectRepository.list_all(db, page=1, page_size=1)
            if total_active_projects >= limit:
                plan_names = {
                    "individual": {PlanTier.FREE: "Solo Trial", PlanTier.BASIC: "Solo Standard"},
                    "organization": {PlanTier.FREE: "Team Trial", PlanTier.BASIC: "Starter Plan"}
                }
                plan_name = plan_names.get(account_type, {}).get(tier, "your plan")
                raise BadRequestError(
                    f"You have reached the maximum project limit of {limit} projects on your {plan_name}. "
                    f"Please upgrade to create more projects."
                )

    # --- Project CRUD ---
    @staticmethod
    async def get_project(db: AsyncSession, public_id: uuid.UUID) -> Project:
        project = await ProjectRepository.get_by_public_id(db, public_id)
        if not project or project.is_deleted:
            raise NotFoundError("Project not found")
        return project

    @staticmethod
    async def create_project(db: AsyncSession, payload: ProjectCreate) -> Project:
        org_id = tenant_context.get()
        if org_id is not None:
            await ProjectService.check_project_limit(db, org_id)

        data = payload.model_dump()
        template_key = data.pop("template_key", None)
        
        project = await ProjectRepository.create(db, **data)
        
        if template_key:
            await ProjectService.seed_project_tasks_from_template(db, project, template_key)
        return project

    @staticmethod
    async def update_project(db: AsyncSession, public_id: uuid.UUID, payload: ProjectUpdate) -> Project:
        project = await ProjectService.get_project(db, public_id)
        data = payload.model_dump(exclude_unset=True)
        return await ProjectRepository.update(db, project, **data)

    @staticmethod
    async def delete_project(db: AsyncSession, public_id: uuid.UUID) -> None:
        project = await ProjectService.get_project(db, public_id)
        await ProjectRepository.delete(db, project)

    @staticmethod
    async def list_projects(
        db: AsyncSession,
        *,
        status: Optional[str] = None,
        owner_id: Optional[int] = None,
        company_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        assigned_to_me_user_id: Optional[int] = None,
        exclude_completed: bool = False,
    ) -> tuple[list[Project], int]:
        return await ProjectRepository.list_all(
            db,
            status=status,
            owner_id=owner_id,
            company_id=company_id,
            page=page,
            page_size=page_size,
            search=search,
            assigned_to_me_user_id=assigned_to_me_user_id,
            exclude_completed=exclude_completed,
        )

    @staticmethod
    async def get_stats(db: AsyncSession) -> dict:
        return await ProjectRepository.get_stats(db)

    @staticmethod
    async def bulk_update_projects(
        db: AsyncSession, public_ids: list[uuid.UUID], owner_id: Optional[int], status: Optional[str],
    ) -> list[Project]:
        if owner_id is None and status is None:
            raise BadRequestError("Provide at least one of owner_id or status to update")

        result = await db.execute(
            select(Project.id).where(Project.public_id.in_(public_ids), Project.is_deleted.is_(False))
        )
        project_ids = [row[0] for row in result.all()]
        if len(project_ids) != len(set(public_ids)):
            raise NotFoundError("One or more projects not found")

        updates: dict[str, Any] = {}
        if owner_id is not None:
            updates["owner_id"] = owner_id
        if status is not None:
            updates["status"] = status

        return await ProjectRepository.bulk_update(db, project_ids, **updates)

    # --- Project Task CRUD (also used for sub-tasks) ---
    @staticmethod
    async def get_task(db: AsyncSession, public_id: uuid.UUID) -> ProjectTask:
        task = await ProjectTaskRepository.get_by_public_id(db, public_id)
        if not task or task.is_deleted:
            raise NotFoundError("Task not found")
        return task

    @staticmethod
    async def list_project_tasks(
        db: AsyncSession,
        project_public_id: uuid.UUID,
        *,
        assignee_id: Optional[int] = None,
        exclude_done: bool = False,
    ) -> list[ProjectTask]:
        project = await ProjectService.get_project(db, project_public_id)
        return await ProjectTaskRepository.list_by_project(
            db, project_id=project.id, assignee_id=assignee_id, exclude_done=exclude_done
        )

    @staticmethod
    async def _resolve_status_id(db: AsyncSession, status_id: Optional[int]) -> int:
        if status_id is not None:
            status = await ProjectTaskStatusRepository.get_by_id(db, status_id)
            if not status or status.is_deleted:
                raise NotFoundError("Task status not found")
            return status.id
        initial = await ProjectTaskStatusRepository.get_initial(db)
        if not initial:
            raise BadRequestError("This organization has no task statuses configured yet.")
        return initial.id

    @staticmethod
    async def create_task(db: AsyncSession, project_public_id: uuid.UUID, payload: ProjectTaskCreate) -> ProjectTask:
        """Creates a top-level task (parent_task_id is always None here)."""
        project = await ProjectService.get_project(db, project_public_id)
        data = payload.model_dump()
        data["status_id"] = await ProjectService._resolve_status_id(db, data.pop("status_id"))
        return await ProjectTaskRepository.create(db, project_id=project.id, parent_task_id=None, **data)

    @staticmethod
    async def create_subtask(db: AsyncSession, parent_public_id: uuid.UUID, payload: ProjectTaskCreate) -> ProjectTask:
        """Creates a sub-task under an existing task -- forces project_id/parent_task_id
        from the parent regardless of what's in the payload."""
        parent = await ProjectService.get_task(db, parent_public_id)
        data = payload.model_dump()
        data["status_id"] = await ProjectService._resolve_status_id(db, data.pop("status_id"))
        return await ProjectTaskRepository.create(
            db, project_id=parent.project_id, parent_task_id=parent.id, **data
        )

    @staticmethod
    async def update_task(db: AsyncSession, public_id: uuid.UUID, payload: ProjectTaskUpdate) -> ProjectTask:
        task = await ProjectService.get_task(db, public_id)
        data = payload.model_dump(exclude_unset=True)

        # Auto-set completed_at when the task moves into/out of a "done" status,
        # mirroring CRMService.update_deal_task's status/completed_at handling.
        if "status_id" in data and data["status_id"] != task.status_id:
            new_status = await ProjectTaskStatusRepository.get_by_id(db, data["status_id"])
            if not new_status:
                raise NotFoundError("Task status not found")
            if new_status.is_done_status:
                data["completed_at"] = datetime.now(timezone.utc)
            else:
                data["completed_at"] = None

        return await ProjectTaskRepository.update(db, task, **data)

    @staticmethod
    async def delete_task(db: AsyncSession, public_id: uuid.UUID) -> None:
        task = await ProjectService.get_task(db, public_id)
        await ProjectTaskRepository.delete(db, task)

    # --- Task file attachments ---
    @staticmethod
    async def list_task_files(db: AsyncSession, task_public_id: uuid.UUID) -> list[ProjectTaskFile]:
        task = await ProjectService.get_task(db, task_public_id)
        return await ProjectTaskFileRepository.list_by_task(db, task_id=task.id)

    @staticmethod
    async def create_task_file(
        db: AsyncSession,
        task_public_id: uuid.UUID,
        *,
        file_name: str,
        file_path: str,
        file_size: int,
        mime_type: str,
        owner_id: Optional[int] = None,
    ) -> ProjectTaskFile:
        task = await ProjectService.get_task(db, task_public_id)
        return await ProjectTaskFileRepository.create(
            db,
            task_id=task.id,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            owner_id=owner_id,
        )

    @staticmethod
    async def get_task_file(db: AsyncSession, task_public_id: uuid.UUID, file_public_id: uuid.UUID) -> ProjectTaskFile:
        task = await ProjectService.get_task(db, task_public_id)
        task_file = await ProjectTaskFileRepository.get_by_public_id(db, file_public_id)
        if not task_file or task_file.is_deleted or task_file.task_id != task.id:
            raise NotFoundError("File not found")
        return task_file

    @staticmethod
    async def delete_task_file(db: AsyncSession, task_public_id: uuid.UUID, file_public_id: uuid.UUID) -> None:
        task_file = await ProjectService.get_task_file(db, task_public_id, file_public_id)

        import os
        if os.path.exists(task_file.file_path):
            try:
                os.remove(task_file.file_path)
            except Exception as e:
                from loguru import logger
                logger.error(f"Failed to remove file from disk: {e}")

        await ProjectTaskFileRepository.delete(db, task_file)

    # --- Deal -> Project conversion ---
    @staticmethod
    async def _resolve_conversion_target_currency(db: AsyncSession, deal: CRMDeal, current_user: User) -> str:
        """The currency a converted budget should be shown/stored in -- the user's own
        preferred currency (same field CurrencyConversionService uses for display elsewhere),
        falling back to the org's default, falling back to the deal's own currency."""
        if current_user.currency:
            return current_user.currency
        if deal.organization_id:
            org = await db.get(Organization, deal.organization_id)
            if org and org.default_currency:
                return org.default_currency
        return deal.currency

    @staticmethod
    async def _resolve_deal_value_rate_date(db: AsyncSession, deal: CRMDeal) -> date_type:
        """The exchange rate to use is the one in effect when the deal's value was last set --
        the day it was created, or the day it was last edited if the value has changed since."""
        latest_change = await AuditLogRepository.get_latest_field_change(
            db, entity_type="deal", entity_id=deal.id, field_name="value",
        )
        if latest_change:
            return latest_change.changed_at.date()
        return deal.created_at.date()

    @staticmethod
    async def _convert_deal_value(db: AsyncSession, deal: CRMDeal, current_user: User) -> DealProjectConversionPreview:
        target_currency = await ProjectService._resolve_conversion_target_currency(db, deal, current_user)

        preview = DealProjectConversionPreview(
            original_value=float(deal.value) if deal.value is not None else None,
            original_currency=deal.currency,
            target_currency=target_currency,
            converted=False,
        )

        if not target_currency or target_currency == deal.currency or deal.value is None:
            return preview

        rate_date = await ProjectService._resolve_deal_value_rate_date(db, deal)
        rate = await CurrencyConversionService.get_rate(
            db, from_currency=deal.currency, to_currency=target_currency, on_date=rate_date,
        )
        if rate is None:
            return preview

        preview.converted_value = round(float(Decimal(str(deal.value)) * rate), 2)
        preview.rate = float(rate)
        preview.rate_date = rate_date
        preview.converted = True
        return preview

    @staticmethod
    async def _get_deal_or_404(db: AsyncSession, deal_public_id: uuid.UUID) -> CRMDeal:
        result = await db.execute(select(CRMDeal).where(CRMDeal.public_id == deal_public_id))
        deal = result.scalars().first()
        if not deal or deal.is_deleted:
            raise NotFoundError("Deal not found")
        return deal

    @staticmethod
    async def preview_deal_conversion(
        db: AsyncSession, deal_public_id: uuid.UUID, current_user: User
    ) -> DealProjectConversionPreview:
        deal = await ProjectService._get_deal_or_404(db, deal_public_id)
        return await ProjectService._convert_deal_value(db, deal, current_user)

    @staticmethod
    async def convert_deal_to_project(
        db: AsyncSession, deal_public_id: uuid.UUID, payload: DealConvertToProjectRequest, current_user: User
    ) -> Project:
        deal = await ProjectService._get_deal_or_404(db, deal_public_id)
        if deal.status != DealStatus.WON:
            raise BadRequestError("Only a Won deal can be converted to a project")
        if deal.project_id is not None:
            raise BadRequestError("This deal has already been converted to a project")

        conversion = await ProjectService._convert_deal_value(db, deal, current_user)
        budget = payload.budget if payload.budget is not None else (
            conversion.converted_value if conversion.converted else deal.value
        )
        currency = conversion.target_currency if conversion.converted else deal.currency

        org_id = tenant_context.get() or current_user.organization_id
        if org_id is not None:
            await ProjectService.check_project_limit(db, org_id)

        project = await ProjectRepository.create(
            db,
            name=payload.name or deal.title,
            company_id=deal.company_id,
            owner_id=payload.owner_id or deal.owner_id or current_user.id,
            deal_id=deal.id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            budget=budget,
            currency=currency,
        )

        # Seed tasks if template selected
        template_key = payload.template_key
        if template_key:
            await ProjectService.seed_project_tasks_from_template(db, project, template_key)

        await CRMDealRepository.update(db, deal, project_id=project.id)

        await AuditService.record(
            db, entity_type="deal", entity_id=deal.id, action="convert_to_project",
            changed_by_user_id=current_user.id, field_name="project_id",
            old_value=None, new_value=project.id,
        )

        return project

    @staticmethod
    async def seed_project_tasks_from_template(db: AsyncSession, project: Project, template_key: str) -> None:
        if not template_key or template_key not in PROJECT_TEMPLATES:
            return

        template = PROJECT_TEMPLATES[template_key]
        initial_status = await ProjectTaskStatusRepository.get_initial(db)
        if not initial_status:
            return

        from datetime import date, timedelta
        ref_date = project.start_date or date.today()

        for idx, t in enumerate(template["tasks"]):
            start_offset = t.get("start_offset_days", 0)
            due_offset = t.get("due_offset_days", 5)
            task_start = ref_date + timedelta(days=start_offset)
            task_due = ref_date + timedelta(days=due_offset)

            custom_fields = {}
            if "milestone" in t:
                custom_fields["milestone"] = t["milestone"]

            priority_val = t.get("priority", "medium")

            parent_task = await ProjectTaskRepository.create(
                db,
                project_id=project.id,
                parent_task_id=None,
                title=t["title"],
                description=t["description"],
                status_id=initial_status.id,
                order=idx,
                start_date=task_start,
                due_date=task_due,
                priority=priority_val,
                tags=t.get("tags", []),
                custom_fields=custom_fields,
            )

            if "subtasks" in t:
                for s_idx, s in enumerate(t["subtasks"]):
                    s_start_offset = s.get("start_offset_days", start_offset)
                    s_due_offset = s.get("due_offset_days", due_offset)
                    s_start = ref_date + timedelta(days=s_start_offset)
                    s_due = ref_date + timedelta(days=s_due_offset)

                    s_priority_val = s.get("priority", "medium")

                    await ProjectTaskRepository.create(
                        db,
                        project_id=project.id,
                        parent_task_id=parent_task.id,
                        title=s["title"],
                        description=s["description"],
                        status_id=initial_status.id,
                        order=s_idx,
                        start_date=s_start,
                        due_date=s_due,
                        priority=s_priority_val,
                        tags=s.get("tags", []),
                    )
