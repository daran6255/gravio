"""Training Project Sync Service"""

from datetime import datetime, date
from typing import List, Dict, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.dsr_activity import DSRActivity, DSRActivityStatus
from app.models.dsr_project import DSRProject, DSRProjectType
from app.models.training_batch_plan import TrainingBatchPlan
from app.models.user import User
from app.repositories.dsr_activity_repository import DSRActivityRepository
from app.repositories.dsr_project_repository import DSRProjectRepository
from app.repositories.training_batch_plan_repository import TrainingBatchPlanRepository


class TrainingProjectSyncService:
    """
    Service to synchronize Training Batch Plans with DSR Activities.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.activity_repo = DSRActivityRepository(db)
        self.project_repo = DSRProjectRepository(db)
        self.plan_repo = TrainingBatchPlanRepository(db)

    async def sync_batch_to_projects(self, batch_id: int) -> None:
        """
        Find all DSR projects linked to this batch and sync their activities.
        Called whenever the batch lesson plan changes.
        """
        from app.models.dsr_project import dsr_project_batches
        from sqlalchemy import or_

        # Find all projects linked to this batch (Many-to-Many OR Legacy Single Link)
        # We need to join with association table
        query = (
            select(DSRProject)
            .outerjoin(dsr_project_batches, DSRProject.id == dsr_project_batches.c.project_id)
            .where(
                or_(
                    dsr_project_batches.c.batch_id == batch_id,
                    DSRProject.linked_batch_id == batch_id
                )
            )
            .where(DSRProject.project_type == DSRProjectType.TRAINING)
            .where(DSRProject.is_deleted == False)
        )
        
        result = await self.db.execute(query)
        projects = result.scalars().all()
        
        for project in projects:
            await self.sync_activities_for_project(project.id)

    async def sync_activities_for_project(self, project_id: int) -> None:
        """
        Synchronize activities for a specific training project based on its linked batch plan.
        """
        project = await self.project_repo.get_with_batches(project_id)
        if not project or project.project_type != DSRProjectType.TRAINING:
            return

        # 1. Load all plan entries for ALL linked batches, remembering their batch name
        batches = project.linked_batches
        plans_with_batch = [] # List of tuples: (plan, batch_name)
        
        for batch in batches:
            batch_plans = await self.plan_repo.get_all_by_batch_id(batch.id)
            for bp in batch_plans:
                plans_with_batch.append((bp, batch.batch_name))
        
        # Legacy support for single batch link if any
        if project.linked_batch_id and not any(b.id == project.linked_batch_id for b in batches):
            legacy_batch = await self.db.get(User, project.linked_batch_id) # This is wrong, it should be TrainingBatch
            from app.models.training_batch import TrainingBatch
            legacy_batch = await self.db.get(TrainingBatch, project.linked_batch_id)
            if legacy_batch:
                legacy_plans = await self.plan_repo.get_all_by_batch_id(legacy_batch.id)
                for lp in legacy_plans:
                    plans_with_batch.append((lp, legacy_batch.batch_name))
        # 2. Group by (batch_name, activity_name)
        # key: (batch_name, activity_name)
        # value: {estimated_hours: float, start_date: date, end_date: date, trainer_ids: set[int]}
        groups: Dict[Tuple[str, str], dict] = {}
        
        for plan, batch_name in plans_with_batch:
            # Calculate duration
            start_dt = datetime.combine(plan.date, plan.start_time)
            end_dt = datetime.combine(plan.date, plan.end_time)
            duration = (end_dt - start_dt).total_seconds() / 3600.0
            
            clean_name = plan.activity_name.strip()
            if not clean_name or plan.activity_type in ['break', 'holiday', 'other']:
                continue

            key = (batch_name, clean_name)
            if key not in groups:
                groups[key] = {
                    "batch_name": batch_name,
                    "activity_name": clean_name,
                    "trainer_ids": set(),
                    "estimated_hours": 0.0,
                    "start_date": plan.date,
                    "end_date": plan.date
                }
            
            if plan.trainer_user_id:
                groups[key]["trainer_ids"].add(plan.trainer_user_id)
                
            groups[key]["estimated_hours"] += duration
            groups[key]["start_date"] = min(groups[key]["start_date"], plan.date)
            groups[key]["end_date"] = max(groups[key]["end_date"], plan.date)

        # 3. Load existing activities for this project
        existing_activities = await self.activity_repo.get_activities_for_project(project.id)
        
        # Map existing activities by name for matching (DSR table name)
        activity_map: Dict[str, DSRActivity] = {act.name: act for act in existing_activities}

        # 4. Sync: Update or Create
        seen_dsr_names = set()
        for key, data in groups.items():
            batch_name, activity_name = key
            dsr_name = f"{batch_name} - {activity_name}"
            seen_dsr_names.add(dsr_name)
            
            if dsr_name in activity_map:
                # UPDATE
                act = activity_map[dsr_name]
                act.estimated_hours = round(data["estimated_hours"], 2)
                act.start_date = data["start_date"]
                act.end_date = data["end_date"]
                
                # Check for new trainers to assign
                current_trainer_ids = {u.id for u in act.assigned_users}
                for t_id in data["trainer_ids"]:
                    if t_id not in current_trainer_ids:
                        trainer = await self.db.get(User, t_id)
                        if trainer:
                            act.assigned_users.append(trainer)
            else:
                # CREATE
                # Get all trainers for this activity
                trainers = []
                for t_id in data["trainer_ids"]:
                    trainer = await self.db.get(User, t_id)
                    if trainer:
                        trainers.append(trainer)
                
                if not trainers and not data.get("estimated_hours"):
                    continue

                new_act = DSRActivity(
                    project_id=project.id,
                    name=dsr_name,
                    description=f"Automated activity for {activity_name} in {batch_name}",
                    start_date=data["start_date"],
                    end_date=data["end_date"],
                    estimated_hours=round(data["estimated_hours"], 2),
                    status=DSRActivityStatus.PLANNED,
                    is_active=True,
                    assigned_users=trainers
                )
                self.db.add(new_act)

        # 5. REMOVE activities that are no longer in the plan
        # BUT only if they haven't been used in any DSR entries (to prevent data loss)
        for name, act in activity_map.items():
            if name not in seen_dsr_names:
                # Check if it has actual hours logged
                if act.total_actual_hours == 0:
                    # Soft delete or hard delete based on repo preference. 
                    # BaseRepository.delete does soft delete by default if supported.
                    await self.activity_repo.delete(act.id)
                else:
                    # Keep it but maybe mark as inactive?
                    act.is_active = False

        await self.db.flush()
        await self.db.commit()
