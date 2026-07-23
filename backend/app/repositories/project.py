"""Project Management data access layer repositories"""

import uuid
from datetime import date
from typing import Optional
from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.project import Project, ProjectStatus, ProjectTask, ProjectTaskStatus, ProjectTaskFile


class ProjectTaskStatusRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, status_id: int) -> Optional[ProjectTaskStatus]:
        return await db.get(ProjectTaskStatus, status_id)

    @staticmethod
    async def get_initial(db: AsyncSession, *, project_id: int) -> Optional[ProjectTaskStatus]:
        result = await db.execute(
            select(ProjectTaskStatus)
            .where(
                ProjectTaskStatus.project_id == project_id,
                ProjectTaskStatus.is_initial_status.is_(True),
                ProjectTaskStatus.is_deleted.is_(False),
            )
            .order_by(ProjectTaskStatus.order.asc())
        )
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, name: str, **kwargs) -> ProjectTaskStatus:
        status = ProjectTaskStatus(name=name, **kwargs)
        db.add(status)
        await db.flush()
        return status

    @staticmethod
    async def update(db: AsyncSession, status: ProjectTaskStatus, **kwargs) -> ProjectTaskStatus:
        for key, val in kwargs.items():
            setattr(status, key, val)
        await db.flush()
        return status

    @staticmethod
    async def delete(db: AsyncSession, status: ProjectTaskStatus) -> None:
        await db.delete(status)
        await db.flush()

    @staticmethod
    async def list_by_project(db: AsyncSession, *, project_id: int) -> list[ProjectTaskStatus]:
        result = await db.execute(
            select(ProjectTaskStatus)
            .where(ProjectTaskStatus.project_id == project_id, ProjectTaskStatus.is_deleted.is_(False))
            .order_by(ProjectTaskStatus.order.asc())
        )
        return list(result.scalars().all())


class ProjectRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, project_id: int) -> Optional[Project]:
        return await db.get(Project, project_id)

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[Project]:
        result = await db.execute(
            select(Project)
            .options(
                selectinload(Project.tasks),
                selectinload(Project.owner),
                selectinload(Project.company),
                selectinload(Project.deal),
            )
            .where(Project.public_id == public_id)
        )
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, name: str, **kwargs) -> Project:
        project = Project(name=name, **kwargs)
        db.add(project)
        await db.flush()
        return project

    @staticmethod
    async def update(db: AsyncSession, project: Project, **kwargs) -> Project:
        for key, val in kwargs.items():
            setattr(project, key, val)
        await db.flush()
        await db.refresh(project)
        return project

    @staticmethod
    async def delete(db: AsyncSession, project: Project) -> None:
        """Soft-deletes the project and every task/sub-task under it.

        ORM cascade="all, delete-orphan" only fires on a real session.delete(),
        never on a flag flip -- so child tasks must be walked and soft-deleted
        explicitly here (the same gap CRMDeal -> CRMDealTask silently has today).
        """
        result = await db.execute(
            select(ProjectTask).where(ProjectTask.project_id == project.id, ProjectTask.is_deleted.is_(False))
        )
        for task in result.scalars().all():
            task.soft_delete()
        project.soft_delete()
        await db.flush()

    @staticmethod
    async def list_all(
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
        conditions = [Project.is_deleted.is_(False)]
        if status:
            conditions.append(Project.status == status)
        if owner_id:
            conditions.append(Project.owner_id == owner_id)
        if company_id:
            conditions.append(Project.company_id == company_id)
        if search:
            conditions.append(Project.name.ilike(f"%{search}%"))
        if assigned_to_me_user_id is not None:
            # "Associated with" this user = they own the project, or they're the
            # assignee on at least one (non-deleted) task inside it.
            has_assigned_task = (
                select(ProjectTask.id)
                .where(
                    ProjectTask.project_id == Project.id,
                    ProjectTask.assignee_id == assigned_to_me_user_id,
                    ProjectTask.is_deleted.is_(False),
                )
                .exists()
            )
            conditions.append(or_(Project.owner_id == assigned_to_me_user_id, has_assigned_task))
        if exclude_completed:
            conditions.append(Project.status.in_(ProjectRepository.OPEN_STATUSES))

        count_result = await db.execute(
            select(func.count()).select_from(Project).where(*conditions)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(Project)
            .options(selectinload(Project.tasks))
            .where(*conditions)
            .order_by(Project.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def bulk_update(db: AsyncSession, project_ids: list[int], **kwargs) -> list[Project]:
        result = await db.execute(
            select(Project).where(Project.id.in_(project_ids), Project.is_deleted.is_(False))
        )
        projects = list(result.scalars().all())
        for project in projects:
            for key, val in kwargs.items():
                setattr(project, key, val)
        await db.flush()
        for project in projects:
            await db.refresh(project)
        return projects

    # Statuses still considered "in flight" -- eligible for overdue/upcoming-deadline
    # tracking. COMPLETED/APPROVED/INVOICED/CANCELED are terminal and excluded.
    OPEN_STATUSES = (
        ProjectStatus.PLANNING, ProjectStatus.ACTIVE, ProjectStatus.IN_PROGRESS,
        ProjectStatus.DELAYED, ProjectStatus.IN_TESTING, ProjectStatus.ON_HOLD,
    )

    @staticmethod
    async def get_stats(db: AsyncSession) -> dict:
        not_deleted = Project.is_deleted.is_(False)
        open_statuses = ProjectRepository.OPEN_STATUSES
        today = date.today()

        status_counts_result = await db.execute(
            select(Project.status, func.count(Project.id)).where(not_deleted).group_by(Project.status)
        )
        status_counts = {row[0]: row[1] for row in status_counts_result.all()}
        total_projects = sum(status_counts.values())

        overdue_count_result = await db.execute(
            select(func.count(Project.id)).where(
                not_deleted, Project.status.in_(open_statuses), Project.end_date < today
            )
        )
        overdue_count = overdue_count_result.scalar_one()

        task_totals_result = await db.execute(
            select(func.count(ProjectTask.id), func.count(ProjectTask.completed_at))
            .join(Project, Project.id == ProjectTask.project_id)
            .where(not_deleted, ProjectTask.is_deleted.is_(False))
        )
        total_tasks, completed_tasks = task_totals_result.one()

        budget_result = await db.execute(
            select(Project.currency, func.sum(Project.budget))
            .where(not_deleted, Project.budget.is_not(None))
            .group_by(Project.currency)
            .order_by(func.sum(Project.budget).desc())
        )
        budget_by_currency = [
            {"currency": row[0], "total": float(row[1])} for row in budget_result.all()
        ]

        upcoming_result = await db.execute(
            select(Project.public_id, Project.name, Project.end_date)
            .where(
                not_deleted, Project.status.in_(open_statuses),
                Project.end_date.is_not(None), Project.end_date >= today,
            )
            .order_by(Project.end_date.asc())
            .limit(5)
        )
        upcoming_deadlines = [
            {"public_id": row[0], "name": row[1], "end_date": row[2]} for row in upcoming_result.all()
        ]

        overdue_result = await db.execute(
            select(Project.public_id, Project.name, Project.end_date)
            .where(not_deleted, Project.status.in_(open_statuses), Project.end_date < today)
            .order_by(Project.end_date.asc())
            .limit(5)
        )
        overdue_projects = [
            {"public_id": row[0], "name": row[1], "end_date": row[2]} for row in overdue_result.all()
        ]

        return {
            "total_projects": total_projects,
            "status_counts": [{"status": status, "count": count} for status, count in status_counts.items()],
            "overdue_count": overdue_count,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "budget_by_currency": budget_by_currency,
            "upcoming_deadlines": upcoming_deadlines,
            "overdue_projects": overdue_projects,
        }

    @staticmethod
    async def get_budget_actuals(db: AsyncSession, *, project_id: int) -> dict:
        """Estimated effort (from tasks) vs hours actually logged against this project
        (from timesheets, by billing type). Rejected time entries don't count as real work."""
        from app.models.timesheet import ProjectTimeLog, TimesheetBillingType, TimesheetStatus

        estimated_result = await db.execute(
            select(func.sum(ProjectTask.estimated_hours)).where(
                ProjectTask.project_id == project_id, ProjectTask.is_deleted.is_(False),
            )
        )
        estimated_hours_total = float(estimated_result.scalar_one() or 0)

        logged_result = await db.execute(
            select(ProjectTimeLog.billing_type, func.sum(ProjectTimeLog.hours))
            .where(
                ProjectTimeLog.project_id == project_id,
                ProjectTimeLog.is_deleted.is_(False),
                ProjectTimeLog.status != TimesheetStatus.REJECTED,
            )
            .group_by(ProjectTimeLog.billing_type)
        )
        hours_by_billing_type = {row[0]: float(row[1]) for row in logged_result.all()}

        return {
            "estimated_hours_total": estimated_hours_total,
            "billable_hours_logged": hours_by_billing_type.get(TimesheetBillingType.BILLABLE, 0.0),
            "non_billable_hours_logged": hours_by_billing_type.get(TimesheetBillingType.NON_BILLABLE, 0.0),
        }


class ProjectTaskRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, task_id: int) -> Optional[ProjectTask]:
        return await db.get(ProjectTask, task_id)

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[ProjectTask]:
        result = await db.execute(select(ProjectTask).where(ProjectTask.public_id == public_id))
        return result.scalars().first()

    @staticmethod
    async def list_by_project(
        db: AsyncSession,
        *,
        project_id: int,
        assignee_id: Optional[int] = None,
        exclude_done: bool = False,
    ) -> list[ProjectTask]:
        """Flat list of every task and sub-task in the project, all depths -- the
        frontend derives the parent -> children tree client-side. Optionally scoped
        to a single assignee and/or restricted to non-done-status tasks."""
        conditions = [ProjectTask.project_id == project_id, ProjectTask.is_deleted.is_(False)]
        if assignee_id is not None:
            conditions.append(ProjectTask.assignee_id == assignee_id)

        query = select(ProjectTask).where(*conditions)
        if exclude_done:
            query = query.join(ProjectTaskStatus, ProjectTaskStatus.id == ProjectTask.status_id).where(
                ProjectTaskStatus.is_done_status.is_(False)
            )
        query = query.order_by(ProjectTask.order.asc(), ProjectTask.created_at.asc())

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def list_recent_completed_with_hours(
        db: AsyncSession, *, project_id: int, limit: int = 10, exclude_task_id: Optional[int] = None,
    ) -> list[ProjectTask]:
        """Grounds IRIS's hour estimates in real history instead of a pure guess -- the most
        recently completed tasks in the same project that actually recorded hours."""
        conditions = [
            ProjectTask.project_id == project_id,
            ProjectTask.is_deleted.is_(False),
            ProjectTask.completed_at.isnot(None),
            ProjectTask.actual_hours.isnot(None),
        ]
        if exclude_task_id is not None:
            conditions.append(ProjectTask.id != exclude_task_id)

        result = await db.execute(
            select(ProjectTask)
            .where(*conditions)
            .order_by(ProjectTask.completed_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        project_id: int,
        title: str,
        status_id: int,
        parent_task_id: Optional[int] = None,
        **kwargs,
    ) -> ProjectTask:
        task = ProjectTask(
            project_id=project_id,
            title=title,
            status_id=status_id,
            parent_task_id=parent_task_id,
            **kwargs,
        )
        db.add(task)
        await db.flush()
        await db.refresh(task)
        return task

    @staticmethod
    async def update(db: AsyncSession, task: ProjectTask, **kwargs) -> ProjectTask:
        for key, val in kwargs.items():
            setattr(task, key, val)
        await db.flush()
        await db.refresh(task)
        return task

    @staticmethod
    async def reassign_status(db: AsyncSession, *, from_status_id: int, to_status_id: int) -> int:
        """Move every task off a status that's about to be deleted, onto a fallback
        status. Returns the number of tasks moved."""
        result = await db.execute(
            select(ProjectTask).where(ProjectTask.status_id == from_status_id, ProjectTask.is_deleted.is_(False))
        )
        tasks = list(result.scalars().all())
        for task in tasks:
            task.status_id = to_status_id
        await db.flush()
        return len(tasks)

    @staticmethod
    async def _list_descendants(db: AsyncSession, task_id: int) -> list[ProjectTask]:
        """Breadth-first walk of every (non-deleted) descendant of a task."""
        descendants: list[ProjectTask] = []
        frontier = [task_id]
        while frontier:
            result = await db.execute(
                select(ProjectTask).where(
                    ProjectTask.parent_task_id.in_(frontier), ProjectTask.is_deleted.is_(False)
                )
            )
            children = list(result.scalars().all())
            descendants.extend(children)
            frontier = [child.id for child in children]
        return descendants

    @staticmethod
    async def delete(db: AsyncSession, task: ProjectTask) -> None:
        """Soft-deletes the task and recursively every sub-task under it."""
        for descendant in await ProjectTaskRepository._list_descendants(db, task.id):
            descendant.soft_delete()
        task.soft_delete()
        await db.flush()


class ProjectTaskFileRepository:
    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[ProjectTaskFile]:
        result = await db.execute(
            select(ProjectTaskFile)
            .options(selectinload(ProjectTaskFile.owner))
            .where(ProjectTaskFile.public_id == public_id)
        )
        return result.scalars().first()

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        task_id: int,
        file_name: str,
        file_path: str,
        file_size: int,
        mime_type: str,
        owner_id: Optional[int] = None,
    ) -> ProjectTaskFile:
        task_file = ProjectTaskFile(
            task_id=task_id,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            owner_id=owner_id,
        )
        db.add(task_file)
        await db.flush()
        # Re-fetch with `owner` eagerly loaded (selectinload) so the response schema's
        # owner_name can safely read it without triggering a lazy load.
        return await ProjectTaskFileRepository.get_by_public_id(db, task_file.public_id)

    @staticmethod
    async def list_by_task(db: AsyncSession, *, task_id: int) -> list[ProjectTaskFile]:
        result = await db.execute(
            select(ProjectTaskFile)
            .options(selectinload(ProjectTaskFile.owner))
            .where(ProjectTaskFile.task_id == task_id, ProjectTaskFile.is_deleted.is_(False))
            .order_by(ProjectTaskFile.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def delete(db: AsyncSession, task_file: ProjectTaskFile) -> None:
        task_file.soft_delete()
        await db.flush()
