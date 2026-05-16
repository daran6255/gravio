"""Training Candidate Allocation Service"""
import io
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime, date
from fastapi import HTTPException
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from openpyxl import Workbook
from openpyxl.styles import Font

from app.models.training_candidate_allocation import TrainingCandidateAllocation
from app.models.candidate import Candidate
from app.models.candidate_counseling import CandidateCounseling
from app.models.training_batch import TrainingBatch
from app.schemas.training_candidate_allocation import TrainingCandidateAllocationCreate, TrainingCandidateAllocationUpdate
from app.repositories.training_candidate_allocation_repository import TrainingCandidateAllocationRepository
from app.repositories.training_batch_repository import TrainingBatchRepository
from app.repositories.candidate_repository import CandidateRepository
from app.models.user import User
from app.utils.email import send_email, send_export_email


class TrainingCandidateAllocationService:
    """Service for training candidate allocation operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = TrainingCandidateAllocationRepository(db)
        self.batch_repo = TrainingBatchRepository(db)
        self.candidate_repo = CandidateRepository(db)
    
    async def get_allocations_by_batch(
        self, 
        batch_public_id: UUID,
        search: Optional[str] = None,
        is_dropout: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> List[TrainingCandidateAllocation]:
        """Get all allocations for a batch with search, filter, and sort"""
        # First verify the batch exists
        batch = await self.batch_repo.get_by_public_id(str(batch_public_id))
        if not batch:
            raise HTTPException(status_code=404, detail="Training batch not found")
        
        # Build query
        query = select(TrainingCandidateAllocation).join(Candidate).where(
            TrainingCandidateAllocation.batch_id == batch.id,
            TrainingCandidateAllocation.is_deleted == False
        )
        
        # Apply filters
        if search:
            search_filter = or_(
                Candidate.name.ilike(f"%{search}%"),
                Candidate.email.ilike(f"%{search}%"),
                Candidate.phone.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
            
        if is_dropout is not None:
            query = query.where(TrainingCandidateAllocation.is_dropout == is_dropout)
            
        # Apply sorting
        if hasattr(TrainingCandidateAllocation, sort_by):
            sort_attr = getattr(TrainingCandidateAllocation, sort_by)
            if sort_order.lower() == "desc":
                query = query.order_by(desc(sort_attr))
            else:
                query = query.order_by(sort_attr)
        elif hasattr(Candidate, sort_by):
            sort_attr = getattr(Candidate, sort_by)
            if sort_order.lower() == "desc":
                query = query.order_by(desc(sort_attr))
            else:
                query = query.order_by(sort_attr)
        
        # Eager load relationships
        query = query.options(
            selectinload(TrainingCandidateAllocation.candidate).selectinload(Candidate.documents),
            joinedload(TrainingCandidateAllocation.batch)
        )
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_allocations_by_candidate(self, candidate_public_id: UUID) -> List[TrainingCandidateAllocation]:
        """Get all allocations for a candidate (current and historical)"""
        # Verify the candidate exists
        candidate = await self.candidate_repo.get_by_public_id(candidate_public_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Build query to get all allocations ordered by creation date (newest first)
        query = select(TrainingCandidateAllocation).where(
            TrainingCandidateAllocation.candidate_id == candidate.id,
            TrainingCandidateAllocation.is_deleted == False
        ).options(
            joinedload(TrainingCandidateAllocation.batch),
            selectinload(TrainingCandidateAllocation.candidate).selectinload(Candidate.documents)
        ).order_by(desc(TrainingCandidateAllocation.created_at))
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def allocate_candidate(self, allocation_in: TrainingCandidateAllocationCreate) -> TrainingCandidateAllocation:
        """Allocate a candidate to a batch with disability matching logic"""
        # Resolve batch
        if allocation_in.batch_public_id:
            batch = await self.batch_repo.get_by_public_id(str(allocation_in.batch_public_id))
        else:
            batch = await self.batch_repo.get(allocation_in.batch_id)
            
        if not batch:
            raise HTTPException(status_code=404, detail="Training batch not found")

        # Resolve candidate
        if allocation_in.candidate_public_id:
            candidate = await self.candidate_repo.get_by_public_id(allocation_in.candidate_public_id)
        else:
            candidate = await self.candidate_repo.get(allocation_in.candidate_id)
            
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
            
        # 1. Business Logic: Category/Disability Type Match
        candidate_disability = candidate.disability_details.get('disability_type') if candidate.disability_details else None
        
        if batch.disability_types:
            batch_types_lower = [dt.lower() for dt in batch.disability_types]
            is_women_batch = "women" in batch_types_lower
            is_female = candidate.gender.lower() == "female" if candidate.gender else False
            
            # Extract candidate disability from JSON - handle multiple possible keys
            details = candidate.disability_details or {}
            cand_dis_val = details.get('disability_type') or details.get('type')
            
            # Normalize strings for comparison (lowercase, remove spaces and hyphens)
            def normalize(s):
                if not s: return ""
                return str(s).lower().replace(" ", "").replace("-", "")

            cand_dis_norm = normalize(cand_dis_val)
            batch_types_norm = [normalize(dt) for dt in batch.disability_types]
            
            # Match if candidate has a matching disability OR if it's a Women's batch and candidate is female
            match_found = False
            if is_women_batch and is_female:
                match_found = True
            elif cand_dis_norm and cand_dis_norm in batch_types_norm:
                match_found = True
                
            if not match_found:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Candidate does not match batch categories. Batch allows: {batch.disability_types}, Candidate: {cand_dis_val or 'No Disability'} ({candidate.gender})"
                )
        
        # Check if already allocated to this batch
        query = select(TrainingCandidateAllocation).where(
            TrainingCandidateAllocation.batch_id == batch.id,
            TrainingCandidateAllocation.candidate_id == candidate.id,
            TrainingCandidateAllocation.is_deleted == False
        )
        existing_result = await self.db.execute(query)
        if existing_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Candidate already allocated to this batch")
        
        # Check if candidate is in any other active batch
        active_allocations = await self.repository.get_active_allocations_by_candidate(candidate.id)
        if active_allocations:
            raise HTTPException(status_code=400, detail="Candidate is already in an active training batch")
            
        # Create allocation
        data = allocation_in.model_dump(exclude={"batch_public_id", "candidate_public_id"}, exclude_unset=True)
        data["batch_id"] = batch.id
        data["candidate_id"] = candidate.id
        
        # Set default status if not provided
        if "status" not in data or data["status"] is None:
            data["status"] = "allocated"
            
        allocation = await self.repository.create(data)
        
        # Update batch status if it was planned
        if batch.status == "planned":
            await self.batch_repo.update(batch.id, {"status": "running"})
            
        return await self._get_with_relations(allocation.id)

    async def get_eligible_candidates(self, batch_public_id: Optional[UUID] = None) -> List[dict]:
        """Get candidates eligible for training (selected and matching disability)"""
        # If batch_public_id is provided, filter by matching disability type
        target_disabilities = None
        if batch_public_id:
            batch = await self.batch_repo.get_by_public_id(str(batch_public_id))
            if batch:
                target_disabilities = batch.disability_types

        # Subquery for active allocations
        # Only consider allocations in active batches (planned, running, extended) as blocking
        active_allocation_exists = select(TrainingCandidateAllocation.id).join(TrainingBatch).where(
            and_(
                TrainingCandidateAllocation.candidate_id == Candidate.id,
                TrainingCandidateAllocation.is_deleted == False,
                TrainingCandidateAllocation.is_dropout == False,
                TrainingBatch.status.in_(['planned', 'running', 'extended'])
            )
        ).exists()

        query = select(Candidate).join(CandidateCounseling).where(
            Candidate.is_deleted == False,
            func.lower(CandidateCounseling.status) == "selected",
            ~active_allocation_exists
        )
        
        # Apply matching logic if batch specified
        if target_disabilities:
            batch_types_lower = [dt.lower() for dt in target_disabilities]
            is_women_batch = "women" in batch_types_lower
            other_disabilities = [dt for dt in target_disabilities if dt.lower() != "women"]
            
            matching_conditions = []
            
            # Condition 1: Match female candidates if it's a Women batch
            if is_women_batch:
                matching_conditions.append(func.lower(Candidate.gender) == "female")
            
            # Condition 2: Match candidates with specific disabilities
            if other_disabilities:
                for dt in other_disabilities:
                    # Fuzzy variation: "Low Vision" -> "%Low%Vision%"
                    fuzzy_dt = f"%{dt.replace(' ', '%').replace('-', '%')}%"
                    
                    # Check 'disability_type' key
                    matching_conditions.append(
                        Candidate.disability_details['disability_type'].as_string().ilike(fuzzy_dt)
                    )
                    # Also check 'type' key just in case
                    matching_conditions.append(
                        Candidate.disability_details['type'].as_string().ilike(fuzzy_dt)
                    )
            
            if matching_conditions:
                query = query.where(or_(*matching_conditions))
        
        result = await self.db.execute(query)
        candidates = result.scalars().all()
        
        return [
            {
                "public_id": c.public_id, 
                "name": c.name, 
                "email": c.email, 
                "phone": c.phone,
                "disability_type": c.disability_details.get('disability_type') if c.disability_details else None
            } for c in candidates
        ]
    
    async def get_allocation(self, public_id: UUID) -> TrainingCandidateAllocation:
        """Get an allocation by public ID with relations"""
        allocation = await self.repository.get_by_public_id(str(public_id))
        if not allocation:
            raise HTTPException(status_code=404, detail="Allocation not found")
        return await self._get_with_relations(allocation.id)
    
    async def update_allocation(self, public_id: UUID, allocation_in: TrainingCandidateAllocationUpdate) -> TrainingCandidateAllocation:
        """Update an allocation (handle dropout logic)"""
        allocation = await self.repository.get_by_public_id(str(public_id))
        if not allocation:
            raise HTTPException(status_code=404, detail="Allocation not found")
            
        update_data = allocation_in.model_dump(exclude_unset=True)
        
        # Status Handling
        if "status" in update_data:
            new_status = update_data["status"]
            
            if new_status == "dropped_out":
                update_data["is_dropout"] = True
                
                # Check for dropout remark
                remark = update_data.get("dropout_remark") or allocation.dropout_remark
                if not remark:
                    raise HTTPException(status_code=400, detail="Dropout remark is required when status is 'dropped_out'")
            else:
                # If moving out of dropout status, clear flags
                if allocation.is_dropout and new_status != "dropped_out":
                    update_data["is_dropout"] = False
                    # Optionally clear remark? Let's keep it for history, or clear it.
                    # User request implies strict logic. If they rejoin, they are not a dropout.
                    # update_data["dropout_remark"] = None # Optional: clear remark
        
        # If is_dropout is explicitly set to True
        elif update_data.get("is_dropout") is True:
             update_data["status"] = "dropped_out"
             remark = update_data.get("dropout_remark") or allocation.dropout_remark
             if not remark:
                  raise HTTPException(status_code=400, detail="Dropout remark is required when marking as dropout")

        await self.repository.update(allocation.id, update_data)
        return await self._get_with_relations(allocation.id)
    
    async def reallocate_candidate(self, public_id: UUID, new_batch_public_id: UUID, transfer_data: bool = False) -> TrainingCandidateAllocation:
        """Move a candidate from one batch to another"""
        # 1. Get existing allocation
        old_allocation = await self.repository.get_by_public_id(str(public_id))
        if not old_allocation:
            raise HTTPException(status_code=404, detail="Allocation not found")
        
        # 2. Get new batch
        new_batch = await self.batch_repo.get_by_public_id(str(new_batch_public_id))
        if not new_batch:
            raise HTTPException(status_code=404, detail="Target training batch not found")
            
        if old_allocation.batch_id == new_batch.id:
            raise HTTPException(status_code=400, detail="Candidate is already in this batch")

        # 3. Get candidate
        candidate = await self.candidate_repo.get(old_allocation.candidate_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # 4. Perform disability match logic (reused from allocate_candidate)
        if new_batch.disability_types:
            batch_types_lower = [dt.lower() for dt in new_batch.disability_types]
            is_women_batch = "women" in batch_types_lower
            is_female = candidate.gender.lower() == "female" if candidate.gender else False
            
            details = candidate.disability_details or {}
            cand_dis_val = details.get('disability_type') or details.get('type')
            
            def normalize(s):
                if not s: return ""
                return str(s).lower().replace(" ", "").replace("-", "")

            cand_dis_norm = normalize(cand_dis_val)
            batch_types_norm = [normalize(dt) for dt in new_batch.disability_types]
            
            match_found = False
            if is_women_batch and is_female:
                match_found = True
            elif cand_dis_norm and cand_dis_norm in batch_types_norm:
                match_found = True
                
            if not match_found:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Candidate does not match batch categories. Batch allows: {new_batch.disability_types}, Candidate: {cand_dis_val or 'No Disability'} ({candidate.gender})"
                )

        # 4.5. Data Migration (Optional)
        if transfer_data:
            from app.models.training_attendance import TrainingAttendance
            from app.models.training_assignment import TrainingAssignment
            from app.models.training_mock_interview import TrainingMockInterview
            from sqlalchemy import update

            # Update Attendance
            await self.db.execute(
                update(TrainingAttendance)
                .where(
                    TrainingAttendance.candidate_id == candidate.id,
                    TrainingAttendance.batch_id == old_allocation.batch_id
                )
                .values(batch_id=new_batch.id)
            )

            # Update Assignments
            await self.db.execute(
                update(TrainingAssignment)
                .where(
                    TrainingAssignment.candidate_id == candidate.id,
                    TrainingAssignment.batch_id == old_allocation.batch_id
                )
                .values(batch_id=new_batch.id)
            )

            # Update Mock Interviews
            await self.db.execute(
                update(TrainingMockInterview)
                .where(
                    TrainingMockInterview.candidate_id == candidate.id,
                    TrainingMockInterview.batch_id == old_allocation.batch_id
                )
                .values(batch_id=new_batch.id)
            )

        # 5. Soft-delete old allocation
        await self.repository.delete(old_allocation.id)
        
        # 6. Create new allocation
        new_data = {
            "batch_id": new_batch.id,
            "candidate_id": candidate.id,
            "status": "allocated",
            "others": {
                "moved_from_batch_id": old_allocation.batch_id,
                "moved_at": datetime.now().isoformat()
            }
        }
        new_allocation = await self.repository.create(new_data)
        
        # 7. Update new batch status if it was planned
        if new_batch.status == "planned":
            await self.batch_repo.update(new_batch.id, {"status": "running"})
            
        return await self._get_with_relations(new_allocation.id)

    async def remove_allocation(self, public_id: UUID) -> bool:
        """Soft delete an allocation"""
        allocation = await self.repository.get_by_public_id(str(public_id))
        if not allocation:
            raise HTTPException(status_code=404, detail="Allocation not found")
        return await self.repository.delete(allocation.id)

    async def _get_with_relations(self, allocation_id: int) -> TrainingCandidateAllocation:
        """Helper for loading full relations"""
        query = select(TrainingCandidateAllocation).where(
            TrainingCandidateAllocation.id == allocation_id
        ).options(
            selectinload(TrainingCandidateAllocation.candidate).selectinload(Candidate.documents),
            joinedload(TrainingCandidateAllocation.batch)
        )
        result = await self.db.execute(query)
        return result.scalar_one()

    async def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        batch_id: Optional[int] = None,
        status: Optional[str] = None,
        is_dropout: Optional[bool] = None,
        gender: Optional[str] = None,
        disability_types: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[List[TrainingCandidateAllocation], int]:
        """Global retrieval with expert filtering and metrics aggregation for reports"""
        return await self.repository.get_multi(
            skip=skip,
            limit=limit,
            search=search,
            batch_id=batch_id,
            status=status,
            is_dropout=is_dropout,
            gender=gender,
            disability_types=disability_types,
            sort_by=sort_by,
            sort_order=sort_order
        )

    async def export_allocations(
        self,
        current_user: User,
        search: Optional[str] = None,
        batch_id: Optional[int] = None,
        status: Optional[str] = None,
        is_dropout: Optional[bool] = None,
        gender: Optional[str] = None,
        disability_types: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        columns: Optional[str] = None
    ) -> bool:
        """Fetch all filtered allocations, generate Excel, and email to user"""
        import json
        
        # 1. Fetch all matching allocations (no limit)
        allocations, total = await self.get_multi(
            skip=0,
            limit=10000, # High limit for export
            search=search,
            batch_id=batch_id,
            status=status,
            is_dropout=is_dropout,
            gender=gender,
            disability_types=disability_types,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        # 2. Parse columns if provided
        column_defs = []
        if columns:
            try:
                column_defs = json.loads(columns)
            except Exception:
                column_defs = []
        
        if not column_defs:
            # Default columns if none provided
            column_defs = [
                {"id": "name", "label": "Candidate Name"},
                {"id": "gender", "label": "Gender"},
                {"id": "email", "label": "Email"},
                {"id": "batch_name", "label": "Batch Name"},
                {"id": "status", "label": "Training Status"},
                {"id": "attendance_percentage", "label": "Attendance (%)"},
                {"id": "assessment_score", "label": "Assessment Mark"},
                {"id": "created_at", "label": "Allocation Date"}
            ]

        # 3. Generate Excel
        wb = Workbook()
        ws = wb.active
        ws.title = "Training Allocations Report"
        
        # Headers
        for col_num, col_def in enumerate(column_defs, 1):
            cell = ws.cell(row=1, column=col_num, value=col_def["label"])
            cell.font = Font(bold=True)
            
        # Data Rows
        for row_num, a in enumerate(allocations, 2):
            for col_num, col_def in enumerate(column_defs, 1):
                col_id = col_def["id"]
                val = ""
                
                try:
                    # Mapping logic similar to frontend exportUtils.ts
                    if col_id == "name": val = a.candidate.name if a.candidate else ""
                    elif col_id == "gender": val = a.candidate.gender if a.candidate else ""
                    elif col_id == "email": val = a.candidate.email if a.candidate else ""
                    elif col_id == "phone": val = a.candidate.phone if a.candidate else ""
                    elif col_id == "disability_type": val = (a.candidate.disability_details or {}).get("disability_type", "") if a.candidate else ""
                    elif col_id == "batch_name": val = a.batch.batch_name if a.batch else ""
                    elif col_id == "batch_status": val = a.batch.status if a.batch else ""
                    elif col_id == "domain": val = a.batch.domain if a.batch else ""
                    elif col_id == "training_mode": val = a.batch.training_mode if a.batch else ""
                    elif col_id == "courses":
                        courses = a.batch.courses if a.batch else []
                        if isinstance(courses, list):
                            val = ", ".join([str(c.get('name') if isinstance(c, dict) else c) for c in courses])
                        else:
                            val = str(courses)
                    elif col_id == "duration":
                        dur = a.batch.duration if a.batch else {}
                        if isinstance(dur, dict):
                            val = f"{dur.get('weeks', 0)} weeks, {dur.get('days', 0)} days"
                    elif col_id == "attendance_percentage":
                        val = f"{a.attendance_percentage}%" if a.attendance_percentage is not None else "-"
                    elif col_id == "assessment_score":
                        val = a.assessment_score if a.assessment_score is not None else "-"
                    else:
                        val = getattr(a, col_id, "")
                    
                    # Formatting
                    if isinstance(val, (datetime, date)):
                        val = val.strftime('%Y-%m-%d')
                    elif isinstance(val, bool):
                        val = "Yes" if val else "No"
                    elif val is None:
                        val = ""
                    elif isinstance(val, (dict, list)):
                        val = json.dumps(val)
                except Exception:
                    val = "Error"
                
                ws.cell(row=row_num, column=col_num, value=str(val) if val is not None else "")

        # Save to buffer
        excel_buffer = io.BytesIO()
        wb.save(excel_buffer)
        excel_buffer.seek(0)
        
        # 3. Send Email
        report_name = "Training Allocations Report"
        filename = f"Training_Allocations_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return await send_export_email(
            to_email=current_user.email,
            user_name=current_user.full_name or current_user.username,
            report_name=report_name,
            file_content=excel_buffer.getvalue(),
            filename=filename
        )
