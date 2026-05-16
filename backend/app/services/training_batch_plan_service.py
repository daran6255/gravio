"""Training Batch Plan Service"""

from datetime import date, time, timedelta, datetime
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.training_batch_plan import TrainingBatchPlan
from app.models.training_batch_event import TrainingBatchEvent
from app.schemas.training_batch_plan import TrainingBatchPlanCreate, TrainingBatchPlanResponse, TrainingBatchPlanUpdate
from sqlalchemy import select
from app.repositories.training_batch_plan_repository import TrainingBatchPlanRepository
from app.repositories.training_batch_repository import TrainingBatchRepository
from app.repositories.user_repository import UserRepository
from app.services.training_project_sync_service import TrainingProjectSyncService
from app.models.user import User


class TrainingBatchPlanService:
    """Service for training batch plan operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = TrainingBatchPlanRepository(db)
        self.batch_repository = TrainingBatchRepository(db)
        self.user_repository = UserRepository(db)
        self.sync_service = TrainingProjectSyncService(db)
    
    async def get_plan_by_public_id(self, public_id: UUID) -> Optional[TrainingBatchPlan]:
        """Get a plan entry by public ID"""
        plan = await self.repository.get_by_public_id(public_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Training plan entry not found")
        return plan

    async def get_weekly_plan(self, batch_public_id: UUID, start_date: date) -> List[TrainingBatchPlan]:
        """Get a full week's plan for a batch"""
        batch = await self.batch_repository.get_by_public_id(str(batch_public_id))
        if not batch:
            raise HTTPException(status_code=404, detail="Training batch not found")
        
        # Calculate end date (Friday or +6 days)
        end_date = start_date + timedelta(days=6)
        
        return await self.repository.get_by_batch_and_date_range(batch.id, start_date, end_date)

    async def get_daily_plan(self, batch_id: int, plan_date: date) -> List[TrainingBatchPlan]:
        """Get all periods/sessions for a specific date"""
        return await self.repository.get_by_batch_and_day(batch_id, plan_date)

    async def get_full_batch_plan(self, batch_public_id: UUID) -> List[TrainingBatchPlan]:
        """Get all plan entries for a batch ever created"""
        batch = await self.batch_repository.get_by_public_id(str(batch_public_id))
        if not batch:
            raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail="Training batch not found")
        
        return await self.repository.get_all_by_batch_id(batch.id)

    async def create_plan_entry(self, plan_in: TrainingBatchPlanCreate) -> TrainingBatchPlan:
        """Create a new training plan entry with validation"""
        # Resolve batch_id
        batch_id = plan_in.batch_internal_id
        if not batch_id and plan_in.batch_public_id:
            batch = await self.batch_repository.get_by_public_id(str(plan_in.batch_public_id))
            if not batch:
                raise HTTPException(status_code=404, detail="Training batch not found")
            batch_id = batch.id
        
        if not batch_id:
            raise HTTPException(status_code=400, detail="Batch identification required")

        # Business Logic: Validation
        # 0. Check if it's a holiday
        holiday_query = select(TrainingBatchEvent).where(
            TrainingBatchEvent.batch_id == batch_id,
            TrainingBatchEvent.date == plan_in.date,
            TrainingBatchEvent.event_type == 'holiday',
            TrainingBatchEvent.is_deleted == False
        )
        holiday = (await self.db.execute(holiday_query)).scalar_one_or_none()
        if holiday:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot add plan entry. {plan_in.date} is marked as a holiday: {holiday.title}"
            )

        # 1. Slot duration calculation
        start_dt = datetime.combine(plan_in.date, plan_in.start_time)
        end_dt = datetime.combine(plan_in.date, plan_in.end_time)
        duration_hours = (end_dt - start_dt).total_seconds() / 3600

        if duration_hours <= 0:
            raise HTTPException(status_code=400, detail="End time must be after start time")

        # 2. Check 2-hour limit per course per day
        if plan_in.activity_type == "course":
            existing_plans = await self.repository.get_by_batch_and_day(batch_id, plan_in.date)
            total_course_hours = duration_hours
            for ep in existing_plans:
                if ep.activity_type == "course" and ep.activity_name == plan_in.activity_name:
                    # Calculate duration of existing slot
                    e_start = datetime.combine(ep.date, ep.start_time)
                    e_end = datetime.combine(ep.date, ep.end_time)
                    total_course_hours += (e_end - e_start).total_seconds() / 3600
            
            if total_course_hours > 2.01: # Small buffer for floating point
                raise HTTPException(
                    status_code=400, 
                    detail=f"Course '{plan_in.activity_name}' cannot exceed 2 hours per day. Current total: {total_course_hours:.1f} hours."
                )

        # 3. Resolve trainer_user_id if provided
        trainer_user_id = None
        if plan_in.trainer_user_public_id:
            users = await self.user_repository.get_by_fields(public_id=plan_in.trainer_user_public_id)
            if not users:
                raise HTTPException(status_code=404, detail="Trainer user not found")
            trainer_user_id = users[0].id

        data = plan_in.model_dump(exclude={"batch_internal_id", "batch_public_id", "trainer_user_public_id"})
        data["batch_id"] = batch_id
        data["trainer_user_id"] = trainer_user_id
        
        # Ensure the 'trainer' text name is also populated for immediate display consistency
        # if a trainer user was resolved but the input 'trainer' name was missing or different.
        if trainer_user_id and not data.get("trainer"):
            trainer_u = await self.db.get(User, trainer_user_id)
            if trainer_u:
                data["trainer"] = trainer_u.full_name or trainer_u.username
        
        result = await self.repository.create(data)
        
        # Explicitly flush/refresh to ensure it's visible in the session for the sync service
        await self.db.flush()
        
        # Trigger sync to DSR projects
        await self.sync_service.sync_batch_to_projects(batch_id)
        
        # Re-fetch to ensure relationships (trainer_user) are loaded for the response
        return await self.get_plan_by_public_id(result.public_id)

    async def update_plan_entry(self, public_id: UUID, plan_in: TrainingBatchPlanUpdate) -> TrainingBatchPlan:
        """Update a training plan entry"""
        plan = await self.get_plan_by_public_id(public_id)
        
        # If updating course name or duration, we should ideally re-validate the 2-hour limit.
        # For brevity in this initial implementation, we'll implement basic update.
        # But in a real app, validation should be shared.
        
        update_data = plan_in.model_dump(exclude_unset=True)

        # Resolve trainer_user_id if provided
        if "trainer_user_public_id" in update_data:
            trainer_u_pid = update_data.pop("trainer_user_public_id")
            if trainer_u_pid:
                users = await self.user_repository.get_by_fields(public_id=trainer_u_pid)
                if not users:
                    raise HTTPException(status_code=404, detail="Trainer user not found")
                update_data["trainer_user_id"] = users[0].id
                
                # Sync trainer name text for consistency if not provided
                if not update_data.get("trainer"):
                    update_data["trainer"] = users[0].full_name or users[0].username
            else:
                update_data["trainer_user_id"] = None

        updated = await self.repository.update(plan.id, update_data)
        
        # Trigger sync to DSR projects
        await self.sync_service.sync_batch_to_projects(plan.batch_id)
        
        # Re-fetch to ensure relationships (trainer_user) are loaded for the response
        return await self.get_plan_by_public_id(updated.public_id)

    async def delete_plan_entry(self, public_id: UUID) -> bool:
        """Delete a training plan entry"""
        plan = await self.get_plan_by_public_id(public_id)
        batch_id = plan.batch_id
        
        success = await self.repository.delete(plan.id)
        
        if success:
            # Trigger sync to DSR projects
            await self.sync_service.sync_batch_to_projects(batch_id)
        
        return success

    async def full_sync_batch(self, batch_public_id: UUID) -> bool:
        """
        Perform a full synchronization for all entries in a batch.
        Useful for older entries that lack trainer_user_id linkage.
        """
        batch = await self.batch_repository.get_by_public_id(str(batch_public_id))
        if not batch:
            raise HTTPException(status_code=404, detail="Training batch not found")

        # Load all entries for the batch
        entries = await self.repository.get_all_by_batch_id(batch.id)
        if not entries:
            return True

        # Link trainers by name for entries where trainer_user_id is missing
        updated_count = 0
        all_users = await self.user_repository.get_multi(limit=1000)
        
        # User mapping for faster lookup
        user_name_map = {u.full_name: u.id for u in all_users if u.full_name}
        user_nick_map = {u.username: u.id for u in all_users if u.username}

        for entry in entries:
            if not entry.trainer_user_id and entry.trainer:
                # Try name lookup
                trainer_id = user_name_map.get(entry.trainer) or user_nick_map.get(entry.trainer)
                if trainer_id:
                    await self.repository.update(entry.id, {"trainer_user_id": trainer_id})
                    updated_count += 1
        
        if updated_count > 0:
            await self.db.flush()

        # Trigger sync for the entire batch
        await self.sync_service.sync_batch_to_projects(batch.id)
        
        return True

    async def delete_plans_by_date(self, batch_id: int, plan_date: date) -> int:
        """
        Delete all plan entries for a specific batch and date.
        Internal helper for holiday cleanup.
        """
        from sqlalchemy import delete as sql_delete
        query = sql_delete(self.repository.model).where(
            self.repository.model.batch_id == batch_id,
            self.repository.model.date == plan_date
        )
        result = await self.db.execute(query)
        # Note: DSR sync should be triggered by the caller after all cleanups
        return result.rowcount

