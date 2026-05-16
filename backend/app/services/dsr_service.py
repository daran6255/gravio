"""DSR Entry Service — core business logic"""

from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dsr_entry import DSREntry, DSRStatus
from app.models.dsr_permission_request import DSRPermissionRequest, DSRPermissionStatus
from app.models.user import User, UserRole
from app.schemas.dsr_entry import (
    DSREntryCreate,
    DSREntryUpdate,
    DSRBulkLeaveCreate,
    DSRGrantPreviousDayPermission,
    DSRSendReminder,
    DSRApproveEntry,
    DSRRejectEntry,
    DSRRevokeEntry,
)
from app.schemas.dsr_permission_request import (
    DSRPermissionRequestCreate,
    DSRPermissionRequestUpdate,
)
from app.repositories.dsr_entry_repository import DSREntryRepository
from app.repositories.dsr_project_repository import DSRProjectRepository
from app.repositories.dsr_activity_repository import DSRActivityRepository
from app.repositories.user_repository import UserRepository
from app.repositories.dsr_permission_request_repository import DSRPermissionRequestRepository
from app.repositories.dsr_leave_application_repository import DSRLeaveApplicationRepository
from app.repositories.dsr_activity_type_repository import DSRActivityTypeRepository
from app.services.dsr_notification_service import DSRNotificationService
from app.services.company_holiday_service import CompanyHolidayService


def _require_privileged_user(current_user: User) -> None:
    if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins and Managers can perform this action",
        )


from app.services.notification_service import NotificationService

class DSRService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DSREntryRepository(db)
        self.project_repo = DSRProjectRepository(db)
        self.activity_repo = DSRActivityRepository(db)
        self.user_repo = UserRepository(db)
        self.permission_repo = DSRPermissionRequestRepository(db)
        self.leave_repo = DSRLeaveApplicationRepository(db)
        self.type_repo = DSRActivityTypeRepository(db)
        self.notifier = DSRNotificationService(db)
        self.notif_service = NotificationService(db)
        self.holiday_service = CompanyHolidayService(db)

    # ------------------------------------------------------------------
    # Item validation helpers
    # ------------------------------------------------------------------

    async def _validate_and_build_items(self, raw_items: list) -> list:
        """
        Validate each line item:
        - Project must exist and be active
        - Activity must exist, be active, and belong to the referenced project
        - activity_type_name is stored as-is (validated by schema normaliser)
        Returns the resolved items list (with internal IDs stripped out for JSON storage).
        """
        project_cache: dict = {}
        activity_cache: dict = {}
        resolved = []

        for idx, item in enumerate(raw_items):
            is_dict = isinstance(item, dict)
            p_uid = item.get("project_public_id") if is_dict else item.project_public_id
            a_uid = item.get("activity_public_id") if is_dict else item.activity_public_id
            p_name_other = item.get("project_name_other") if is_dict else getattr(item, 'project_name_other', None)
            a_name_other = item.get("activity_name_other") if is_dict else getattr(item, 'activity_name_other', None)
            activity_type_name = item.get("activity_type_name") if is_dict else getattr(item, 'activity_type_name', None)

            resolved_item = {
                "description": item.get("description") if is_dict else item.description,
                "start_time": item.get("start_time") if is_dict else item.start_time,
                "end_time": item.get("end_time") if is_dict else item.end_time,
                "hours": item.get("hours") if is_dict else item.hours,
                "activity_type_name": activity_type_name,
            }

            # Resolve project
            if p_uid:
                p_key = str(p_uid)
                if p_key not in project_cache:
                    project = await self.project_repo.get_by_public_id(p_uid)
                    if not project or not project.is_active:
                        raise HTTPException(
                            status_code=422,
                            detail=f"Item {idx + 1}: Project not found or inactive",
                        )
                    project_cache[p_key] = project
                project = project_cache[p_key]
                resolved_item["project_public_id"] = str(p_uid)
                resolved_item["project_name"] = project.name
            else:
                resolved_item["project_public_id"] = None
                # Resolve category title from activity type if possible
                category_title = None
                if activity_type_name:
                    type_rec = await self.type_repo.get_by_name(activity_type_name)
                    if type_rec and type_rec.category:
                        category_title = type_rec.category
                
                resolved_item["project_name"] = category_title or p_name_other or "General / Internal Work"
                resolved_item["project_name_other"] = p_name_other

            # Resolve activity
            if a_uid:
                a_key = str(a_uid)
                if a_key not in activity_cache:
                    activity = await self.activity_repo.get_by_public_id(a_uid)
                    if not activity or not activity.is_active:
                        raise HTTPException(
                            status_code=422,
                            detail=f"Item {idx + 1}: Activity not found or inactive",
                        )
                    # If we had a resolved project, check ownership
                    if p_uid:
                        project = project_cache[str(p_uid)]
                        if activity.project_id != project.id:
                            raise HTTPException(
                                status_code=422,
                                detail=(
                                    f"Item {idx + 1}: Activity '{activity.name}' does not "
                                    f"belong to project '{project.name}'"
                                ),
                            )
                    activity_cache[a_key] = activity

                activity = activity_cache[a_key]
                resolved_item["activity_public_id"] = str(a_uid)
                resolved_item["activity_name"] = activity.name
            else:
                resolved_item["activity_public_id"] = None
                # Use activity type name if no custom name provided for category items
                resolved_item["activity_name"] = a_name_other or activity_type_name
                resolved_item["activity_name_other"] = a_name_other

            resolved.append(resolved_item)

        return resolved


    def _can_submit_for_past_date(self, entry: DSREntry, current_user: User) -> bool:
        """True if the user is allowed to submit for a past date."""
        if current_user.role in (UserRole.ADMIN, UserRole.MANAGER):
            return True
        return bool(entry and entry.previous_day_permission_granted_by)

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    async def create_entry(self, data: DSREntryCreate, current_user: User) -> DSREntry:
        today = date.today()

        # Future dates not allowed
        if data.report_date > today:
            raise HTTPException(status_code=422, detail="Cannot create a DSR for a future date")

        # Holiday check
        if await self.holiday_service.is_holiday(data.report_date):
            permission_request = await self.permission_repo.get_granted_permission(current_user.id, data.report_date)
            if not permission_request and current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Cannot submit DSR for {data.report_date} as it is a company holiday. Please request permission if you worked on this day."
                )

        # Previous-day guard
        if data.report_date < today:
            if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
                # Check for explicit permission (legacy flag or new request)
                existing = await self.repo.get_by_user_and_date(current_user.id, data.report_date)
                
                has_permission = False
                if existing and existing.previous_day_permission_granted_by:
                    has_permission = True
                else:
                    permission_request = await self.permission_repo.get_granted_permission(current_user.id, data.report_date)
                    if permission_request:
                        has_permission = True

                if not has_permission:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=(
                            f"Submission for {data.report_date} is not allowed. "
                            "Please raise a request for past-day submission."
                        ),
                    )

        # Duplicate check — only one non-deleted entry per user per date
        existing = await self.repo.get_by_user_and_date(current_user.id, data.report_date)
        if existing and existing.status in (DSRStatus.SUBMITTED, DSRStatus.APPROVED):
            raise HTTPException(
                status_code=422,
                detail=f"A DSR for {data.report_date} has already been submitted",
            )

        # If there's already a draft (e.g. permission entry), update it instead of creating new
        items = []
        if not data.is_leave:
            items = await self._validate_and_build_items(data.items)

        is_past = data.report_date < today
        if existing and existing.status == DSRStatus.DRAFT:
            update_data = {
                "items": items,
                "others": data.others,
                "is_leave": data.is_leave,
                "leave_type": data.leave_type
            }
            updated = await self.repo.update(existing.id, update_data)
            return await self.repo.get_by_public_id(existing.public_id)

        entry_data = {
            "user_id": current_user.id,
            "report_date": data.report_date,
            "status": DSRStatus.DRAFT,
            "is_previous_day_submission": is_past,
            "items": items,
            "others": data.others,
            "is_leave": data.is_leave,
            "leave_type": data.leave_type,
        }
        return await self.repo.create(entry_data)

    async def update_entry(
        self, public_id: UUID, data: DSREntryUpdate, current_user: User
    ) -> DSREntry:
        entry = await self._get_or_404(public_id)
        self._assert_owner_or_privileged_user(entry, current_user)

        if entry.status != DSRStatus.DRAFT:
            raise HTTPException(
                status_code=400,
                detail="Only DRAFT entries can be updated",
            )

        update_data: dict = {}
        if data.is_leave is not None:
            update_data["is_leave"] = data.is_leave
        if data.leave_type is not None:
            update_data["leave_type"] = data.leave_type

        # Use current state of is_leave if not being updated
        effective_is_leave = data.is_leave if data.is_leave is not None else entry.is_leave

        if effective_is_leave:
            update_data["items"] = []
        elif data.items is not None:
            update_data["items"] = await self._validate_and_build_items(data.items)

        if data.others is not None:
            update_data["others"] = data.others

        await self.repo.update(entry.id, update_data)
        return await self._get_or_404(public_id)

    async def submit_entry(self, public_id: UUID, current_user: User) -> DSREntry:
        entry = await self._get_or_404(public_id)
        self._assert_owner_or_privileged_user(entry, current_user)

        if entry.status != DSRStatus.DRAFT:
            raise HTTPException(status_code=400, detail="Only DRAFT entries can be submitted")

        if not entry.is_leave and not entry.items:
            raise HTTPException(status_code=422, detail="Cannot submit an empty DSR. Add at least one work item or mark as Leave.")

        # Transition directly to APPROVED as per new requirement, UNLESS it's a leave
        status_val = DSRStatus.APPROVED
        admin_notes = "Auto-approved upon submission"
        reviewed_by = current_user.id
        reviewed_at = datetime.utcnow()

        if entry.is_leave:
            status_val = DSRStatus.SUBMITTED
            admin_notes = None
            reviewed_by = None
            reviewed_at = None

        await self.repo.update(entry.id, {
            "status": status_val,
            "submitted_at": datetime.utcnow(),
            "reviewed_by": reviewed_by,
            "reviewed_at": reviewed_at,
            "admin_notes": admin_notes
        })

        # Update Activity Actuals
        if not entry.is_leave and entry.items:
            for item in entry.items:
                a_uid = item.get("activity_public_id")
                if a_uid:
                    activity = await self.activity_repo.get_by_public_id(a_uid)
                    if activity:
                        update_act = {}
                        # Set actual start date if not set or if this report is earlier
                        if not activity.actual_start_date or entry.report_date < activity.actual_start_date:
                            update_act["actual_start_date"] = entry.report_date
                        
                        # Increment total actual hours
                        update_act["total_actual_hours"] = activity.total_actual_hours + (item.get("hours") or 0.0)
                        
                        if update_act:
                            # We update the activity object directly and let the session handle it
                            for k, v in update_act.items():
                                setattr(activity, k, v)
        
        await self.db.flush()

        # Send Email Alert
        try:
            from app.utils.email import send_dsr_submission_email
            await send_dsr_submission_email(
                user_name=current_user.full_name or current_user.username,
                report_date=str(entry.report_date),
                items=entry.items
            )
        except Exception as e:
            # Don't fail the submission if email fails, just log it
            import logging
            logging.getLogger(__name__).error(f"Failed to send DSR submission email: {str(e)}")

        # Trigger Approval Notification
        updated_entry = await self._get_or_404(public_id)
        await self.notif_service.notify_dsr_approved(
            user_id=updated_entry.user_id,
            report_date=str(updated_entry.report_date),
            dsr_public_id=updated_entry.public_id
        )

        return updated_entry

    async def get_my_entries(
        self,
        current_user: User,
        skip: int = 0,
        limit: int = 50,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        status: Optional[DSRStatus] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[DSREntry], int]:
        return await self.repo.get_entries_by_user(
            current_user.id, skip=skip, limit=limit,
            date_from=date_from, date_to=date_to, status=status,
            search=search,
        )

    async def get_all_entries(
        self,
        current_user: User,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        status: Optional[DSRStatus] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[DSREntry], int]:
        _require_privileged_user(current_user)
        return await self.repo.get_all_entries(
            skip=skip, limit=limit, user_id=user_id,
            date_from=date_from, date_to=date_to, status=status,
            search=search,
        )

    async def get_entry(self, public_id: UUID, current_user: User) -> DSREntry:
        entry = await self._get_or_404(public_id)
        self._assert_owner_or_privileged_user(entry, current_user)
        return entry

    async def delete_entry(self, public_id: UUID, current_user: User) -> bool:
        entry = await self._get_or_404(public_id)
        if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            if entry.user_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized")
            if entry.status != DSRStatus.DRAFT:
                raise HTTPException(status_code=400, detail="Only DRAFT entries can be deleted by the owner")
        return await self.repo.delete(entry.id)

    # ------------------------------------------------------------------
    # Admin actions
    # ------------------------------------------------------------------

    async def grant_previous_day_permission(
        self, data: DSRGrantPreviousDayPermission, current_user: User
    ) -> DSREntry:
        """
        Admin allows a specific user to submit a DSR for a past date.
        This effectively acts as an administrative override to ensure a DRAFT exists.
        """
        _require_privileged_user(current_user)

        target_users = await self.user_repo.get_by_fields(public_id=data.user_public_id)
        if not target_users:
            raise HTTPException(status_code=404, detail="Target user not found")
        target_user = target_users[0]

        existing = await self.repo.get_by_user_and_date(target_user.id, data.report_date)
        
        # If already submitted or approved, we can't "grant permission" to re-submit
        # unless we were to reject it first, which is a different flow.
        if existing and existing.status in (DSRStatus.SUBMITTED, DSRStatus.APPROVED):
            raise HTTPException(
                status_code=422,
                detail=f"User has already {existing.status.value} a DSR for {data.report_date}",
            )

        is_past_date = data.report_date < date.today()

        if existing:
            # If it's a past date, ensure the permission flag is set.
            # If it's today, we just return the existing draft.
            update_data = {}
            if is_past_date:
                update_data["is_previous_day_submission"] = True
                update_data["previous_day_permission_granted_by"] = current_user.id
            
            if update_data:
                await self.repo.update(existing.id, update_data)
                return await self.repo.get_by_public_id(existing.public_id)
            return existing
        else:
            # Create a DRAFT entry.
            # If it's a past date, set the permission flag.
            entry_data = {
                "user_id": target_user.id,
                "report_date": data.report_date,
                "status": DSRStatus.DRAFT,
                "is_previous_day_submission": is_past_date,
                "items": [],
                "others": {"admin_override": True, "granted_by": current_user.username},
            }
            if is_past_date:
                entry_data["previous_day_permission_granted_by"] = current_user.id
                
            return await self.repo.create(entry_data)

    async def get_missing_dsr_users(
        self, report_date: date, current_user: User
    ) -> List[User]:
        """Admin: returns active users who have NOT submitted a DSR for the given date."""
        _require_privileged_user(current_user)

        submitted_ids = set(await self.repo.get_submitted_user_ids_for_date(report_date))

        # Get all active users
        from sqlalchemy import select
        from app.models.user import User as UserModel
        result = await self.db.execute(
            select(UserModel)
            .where(UserModel.is_active == True)
            .where(UserModel.is_deleted == False)
        )
        all_users = result.scalars().all()
        return [u for u in all_users if u.id not in submitted_ids]

    async def send_reminders(
        self, data: DSRSendReminder, current_user: User
    ) -> dict:
        """Admin: send DSR reminders to specified users or all missing users if not specified."""
        _require_privileged_user(current_user)

        # Resolve public_ids → user_ids
        user_ids = []
        if data.user_public_ids:
            for uid in data.user_public_ids:
                users = await self.user_repo.get_by_fields(public_id=uid)
                if users:
                    user_ids.append(users[0].id)
        else:
            # Recompute missing users for this date
            missing_users = await self.get_missing_dsr_users(data.report_date, current_user)
            user_ids = [u.id for u in missing_users]

        if not user_ids:
            return {"message": "No users to remind", "count": 0}

        return await self.notifier.send_dsr_reminder(
            user_ids=user_ids,
            report_date=data.report_date,
            message=data.message,
        )

    # ------------------------------------------------------------------
    # DSR Review Actions (Admin)
    # ------------------------------------------------------------------

    async def approve_entry(
        self, public_id: UUID, data: DSRApproveEntry, current_user: User
    ) -> DSREntry:
        """Admin approves a SUBMITTED DSR entry."""
        _require_privileged_user(current_user)
        entry = await self._get_or_404(public_id)

        if entry.status != DSRStatus.SUBMITTED:
            raise HTTPException(
                status_code=400,
                detail=f"Only SUBMITTED entries can be approved. Current status: {entry.status}",
            )

        await self.repo.update(entry.id, {
            "status": DSRStatus.APPROVED,
            "admin_notes": data.admin_notes,
            "reviewed_by": current_user.id,
            "reviewed_at": datetime.utcnow(),
        })
        
        # Trigger Notification
        updated_entry = await self._get_or_404(public_id)
        await self.notif_service.notify_dsr_approved(
            user_id=updated_entry.user_id,
            report_date=str(updated_entry.report_date),
            dsr_public_id=updated_entry.public_id
        )
        return updated_entry

    async def reject_entry(
        self, public_id: UUID, data: DSRRejectEntry, current_user: User
    ) -> DSREntry:
        """
        Admin rejects a SUBMITTED DSR entry.
        - Reverts status back to DRAFT so the user can fix and re-submit.
        - Rejection reason is mandatory (enforced by schema min_length=10).
        """
        _require_privileged_user(current_user)
        entry = await self._get_or_404(public_id)

        if entry.status != DSRStatus.SUBMITTED:
            raise HTTPException(
                status_code=400,
                detail=f"Only SUBMITTED entries can be rejected. Current status: {entry.status}",
            )

        await self.repo.update(entry.id, {
            "status": DSRStatus.DRAFT,   # Reverts so user can re-edit
            "admin_notes": data.reason,  # Rejection reason shown to user
            "reviewed_by": current_user.id,
            "reviewed_at": datetime.utcnow(),
        })
        
        # Trigger Notification
        updated_entry = await self._get_or_404(public_id)
        await self.notif_service.notify_dsr_rejected(
            user_id=updated_entry.user_id,
            report_date=str(updated_entry.report_date),
            reason=data.reason,
            dsr_public_id=updated_entry.public_id
        )
        return updated_entry

    async def revoke_entry(
        self, public_id: UUID, data: DSRRevokeEntry, current_user: User
    ) -> DSREntry:
        """
        Admin revokes an APPROVED or SUBMITTED DSR entry.
        - Reverts status back to DRAFT so the user can fix and re-submit.
        - If the entry was APPROVED, we must subtract the hours from the activity actuals.
        """
        _require_privileged_user(current_user)
        entry = await self._get_or_404(public_id)

        if entry.status not in (DSRStatus.SUBMITTED, DSRStatus.APPROVED):
            raise HTTPException(
                status_code=400,
                detail=f"Only SUBMITTED or APPROVED entries can be revoked. Current status: {entry.status}",
            )

        # Reverse Activity Actuals updates if it was APPROVED
        if entry.status == DSRStatus.APPROVED and not entry.is_leave and entry.items:
            for item in entry.items:
                a_uid = item.get("activity_public_id")
                if a_uid:
                    activity = await self.activity_repo.get_by_public_id(a_uid)
                    if activity:
                        # Subtract hours
                        activity.total_actual_hours = max(0.0, activity.total_actual_hours - (item.get("hours") or 0.0))

        admin_note = f"Revoked by {current_user.username}"
        if data.reason:
            admin_note += f": {data.reason}"

        update_data = {
            "status": DSRStatus.DRAFT,
            "admin_notes": admin_note,
            "submitted_at": None,
            "reviewed_by": None,
            "reviewed_at": None,
        }

        # If it's a past date, grant permission implicitly
        if entry.report_date < date.today():
            update_data["is_previous_day_submission"] = True
            update_data["previous_day_permission_granted_by"] = current_user.id

        await self.repo.update(entry.id, update_data)
        
        await self.db.flush()

        # Trigger Notification
        updated_entry = await self._get_or_404(public_id)
        await self.notif_service.notify_dsr_rejected(
            user_id=updated_entry.user_id,
            report_date=str(updated_entry.report_date),
            reason=f"Timesheet Revoked: {data.reason or 'No reason provided'}",
            dsr_public_id=updated_entry.public_id
        )
        return updated_entry

    async def get_pending_approval(
        self,
        current_user: User,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[DSREntry], int]:
        """Admin: list all SUBMITTED entries awaiting admin review, oldest first."""
        _require_privileged_user(current_user)
        return await self.repo.get_entries_by_status(
            status=DSRStatus.SUBMITTED,
            skip=skip,
            limit=limit,
        )

    async def get_pending_submissions(self, current_user: User) -> List[dict]:
        """
        Admin: list users who have a GRANTED permission but have NOT yet submitted a DSR.
        These are 'abandoned' DRAFT entries created when permission was granted.
        """
        _require_privileged_user(current_user)

        from sqlalchemy import select, and_
        from app.models.dsr_permission_request import (
            DSRPermissionRequest as PRModel,
            DSRPermissionStatus,
        )

        # Find all GRANTED permission requests
        granted_result = await self.db.execute(
            select(PRModel)
            .where(PRModel.status == DSRPermissionStatus.GRANTED)
            .where(PRModel.is_deleted == False)
        )
        granted = granted_result.scalars().all()

        pending_submissions = []
        for perm in granted:
            # Check if the user has a SUBMITTED or APPROVED entry for this date
            entry = await self.repo.get_by_user_and_date(perm.user_id, perm.report_date)
            if not entry or entry.status == DSRStatus.DRAFT:
                # Load user info
                from app.models.user import User as UserModel
                user_result = await self.db.execute(
                    select(UserModel).where(UserModel.id == perm.user_id)
                )
                user = user_result.scalar_one_or_none()
                if user:
                    pending_submissions.append({
                        "permission_request_id": str(perm.public_id),
                        "user_id": perm.user_id,
                        "user_public_id": str(user.public_id),
                        "full_name": user.full_name,
                        "username": user.username,
                        "email": user.email,
                        "report_date": str(perm.report_date),
                        "granted_at": perm.handled_at.isoformat() if perm.handled_at else None,
                        "entry_status": entry.status if entry else None,
                    })
        return pending_submissions

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _get_or_404(self, public_id: UUID) -> DSREntry:
        entry = await self.repo.get_by_public_id(public_id)
        if not entry:
            raise HTTPException(status_code=404, detail="DSR entry not found")
        return entry

    def _assert_owner_or_privileged_user(self, entry: DSREntry, current_user: User) -> None:
        if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER) and entry.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this DSR entry")

    # ------------------------------------------------------------------
    # Permission Requests
    # ------------------------------------------------------------------

    async def create_permission_request(
        self, data: DSRPermissionRequestCreate, current_user: User
    ) -> DSRPermissionRequest:
        """User requests permission to submit a DSR for a past date."""
        today = date.today()
        is_holiday = await self.holiday_service.is_holiday(data.report_date)
        
        if data.report_date >= today and not is_holiday:
            raise HTTPException(status_code=422, detail="Permission is only needed for past dates or holidays")

        # Check for existing request
        existing = await self.permission_repo.get_by_user_and_date(current_user.id, data.report_date)
        if existing:
            if existing.status == DSRPermissionStatus.PENDING:
                raise HTTPException(status_code=422, detail="You already have a pending request for this date")
            if existing.status == DSRPermissionStatus.GRANTED:
                raise HTTPException(status_code=422, detail="Permission already granted for this date")

        request_data = {
            "user_id": current_user.id,
            "report_date": data.report_date,
            "reason": data.reason,
            "status": DSRPermissionStatus.PENDING,
        }
        return await self.permission_repo.create(request_data)

    async def get_permission_requests(
        self, current_user: User, skip: int = 0, limit: int = 100, user_id: Optional[int] = None, 
        status: Optional[DSRPermissionStatus] = None, search: Optional[str] = None
    ) -> Tuple[List[DSRPermissionRequest], int]:
        """List permission requests (Users see their own; Admins see all)."""
        target_user_id = user_id
        if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            target_user_id = current_user.id
            
        return await self.permission_repo.get_requests(
            user_id=target_user_id, status=status, search=search, skip=skip, limit=limit
        )

    async def get_permission_request(self, public_id: UUID) -> DSRPermissionRequest:
        """Get a single permission request by its public ID."""
        request = await self.permission_repo.get_by_public_id(public_id)
        if not request:
            raise HTTPException(status_code=404, detail="Permission request not found")
        return request

    async def handle_permission_request(
        self, public_id: UUID, data: DSRPermissionRequestUpdate, current_user: User
    ) -> DSRPermissionRequest:
        """Admin grants or rejects a permission request."""
        _require_privileged_user(current_user)

        request = await self.permission_repo.get_by_public_id(public_id)
        if not request:
            raise HTTPException(status_code=404, detail="Permission request not found")

        update_data = {
            "status": data.status,
            "admin_notes": data.admin_notes,
            "handled_by": current_user.id,
            "handled_at": datetime.utcnow(),
        }
        updated_request = await self.permission_repo.update(request.id, update_data)
        
        # Determine associated DSR public_id if granted (placeholder entry was created during grant)
        dsr_public_id = None
        if data.status == DSRPermissionStatus.GRANTED:
            # When we grant, we usually create a draft entry. Let's find it.
            entry = await self.repo.get_by_user_and_date(updated_request.user_id, updated_request.report_date)
            if entry:
                dsr_public_id = entry.public_id
        
        # Trigger Notification
        if data.status == DSRPermissionStatus.GRANTED:
             await self.notif_service.notify_permission_granted(
                 user_id=updated_request.user_id,
                 target_date=str(updated_request.report_date),
                 dsr_public_id=dsr_public_id or public_id # fallback to request id if entry not found (shouldn't happen)
             )
        elif data.status == DSRPermissionStatus.REJECTED:
             await self.notif_service.notify_permission_rejected(
                 user_id=updated_request.user_id,
                 target_date=str(updated_request.report_date),
                 reason=data.admin_notes or "No reason provided."
             )
             
        return updated_request

    async def get_permission_stats(self, current_user: User, user_id: Optional[int] = None) -> dict:
        """Get summary stats of permission requests (raised vs approved)."""
        # Define statuses to count
        # PENDING = Raised
        # GRANTED = Approved
        # REJECTED = Rejected
        target_user_id = user_id
        if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            target_user_id = current_user.id
        
        from sqlalchemy import func, select
        from app.models.dsr_permission_request import DSRPermissionRequest as PRModel
        
        stats = {
            "raised": 0,
            "approved": 0,
            "rejected": 0
        }
        
        query = select(PRModel.status, func.count(PRModel.id)).group_by(PRModel.status)
        if target_user_id:
            query = query.where(PRModel.user_id == target_user_id)
            
        result = await self.db.execute(query)
        for status_val, count in result.all():
            if status_val == DSRPermissionStatus.PENDING:
                stats["raised"] = count
            elif status_val == DSRPermissionStatus.GRANTED:
                stats["approved"] = count
            elif status_val == DSRPermissionStatus.REJECTED:
                stats["rejected"] = count
                
        return stats

    async def get_calendar_leave_data(self, user_id: int, start_date: date, end_date: date) -> List[dict]:
        """Fetch approved leaves for a user and date range, formatted for the calendar."""
        leaves = await self.leave_repo.get_leaves_for_calendar(user_id, start_date, end_date)
        return [
            {
                "start_date": l.start_date,
                "end_date": l.end_date,
                "leave_type": l.leave_type,
                "status": l.status,
            }
            for l in leaves
        ]

        return stats
    async def get_user_stats_summary(self, current_user: User) -> dict:
        """Get summary metrics for the current user's dashboard header"""
        return await self.repo.get_user_stats_summary(current_user.id)
