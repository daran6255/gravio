"""Candidate Allocation Repository"""

from typing import Optional, List
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.training_candidate_allocation import TrainingCandidateAllocation
from app.models.candidate import Candidate
from app.repositories.base import BaseRepository


class TrainingCandidateAllocationRepository(BaseRepository[TrainingCandidateAllocation]):
    """Repository for TrainingCandidateAllocation CRUD operations"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(TrainingCandidateAllocation, db)
    
    async def get_by_public_id(self, public_id: str) -> Optional[TrainingCandidateAllocation]:
        """Get an allocation by its public UUID"""
        query = select(self.model).where(
            self.model.public_id == public_id,
            self.model.is_deleted == False
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_batch(self, batch_id: int) -> List[TrainingCandidateAllocation]:
        """Get all allocations for a specific batch with expert eager loading"""
        from sqlalchemy.orm import selectinload, joinedload
        query = select(self.model).where(
            self.model.batch_id == batch_id,
            self.model.is_deleted == False
        ).options(
            selectinload(self.model.candidate).selectinload(Candidate.documents),
            joinedload(self.model.batch)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_by_candidate(self, candidate_id: int) -> List[TrainingCandidateAllocation]:
        """Get all allocations for a specific candidate with batch info"""
        from sqlalchemy.orm import joinedload
        query = select(self.model).options(
            joinedload(self.model.batch)
        ).where(
            self.model.candidate_id == candidate_id,
            self.model.is_deleted == False
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_active_allocations_by_candidate(self, candidate_id: int) -> List[TrainingCandidateAllocation]:
        """Get allocations where batch is truly active (not closed/completed)"""
        from app.models.training_batch import TrainingBatch
        from sqlalchemy.orm import joinedload
        
        query = select(self.model).join(TrainingBatch).options(
            joinedload(self.model.batch)
        ).where(
            self.model.candidate_id == candidate_id,
            self.model.is_deleted == False,
            self.model.is_dropout == False,  # Exclude dropouts
            TrainingBatch.status.in_(["planned", "running", "ongoing"])  # Only truly active batches
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def check_candidate_availability(self, candidate_id: int, start_date, end_date) -> bool:
        """Expert-level check if candidate is already in an active batch during these dates"""
        from app.models.training_batch import TrainingBatch
        
        query = select(self.model).join(TrainingBatch).where(
            self.model.candidate_id == candidate_id,
            self.model.is_deleted == False,
            TrainingBatch.is_deleted == False,
            TrainingBatch.status != "closed",
            or_(
                TrainingBatch.start_date.between(start_date, end_date),
                TrainingBatch.end_date.between(start_date, end_date)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is None

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
        from sqlalchemy import func, desc, asc, and_, cast, Numeric, Float
        from sqlalchemy.orm import selectinload, joinedload
        from app.models.training_attendance import TrainingAttendance

        
        # 1. Metrics Subqueries (Correlated)
        # Attendance Percentage: (present / total) * 100
        attn_present = select(func.count(TrainingAttendance.id)).where(
            and_(
                TrainingAttendance.candidate_id == self.model.candidate_id,
                TrainingAttendance.batch_id == self.model.batch_id,
                TrainingAttendance.status == 'present'
            )
        ).correlate(self.model).scalar_subquery()

        attn_total = select(func.count(TrainingAttendance.id)).where(
            and_(
                TrainingAttendance.candidate_id == self.model.candidate_id,
                TrainingAttendance.batch_id == self.model.batch_id
            )
        ).correlate(self.model).scalar_subquery()

        # Postgres round(numeric, int) requires Numeric type
        attendance_percentage = func.round(
            cast(
                cast(attn_present, Float) / cast(func.nullif(attn_total, 0), Float) * 100,
                Numeric
            ),
            2
        )



        # 2. Build main query
        query = select(
            self.model, 
            attendance_percentage.label("attendance_percentage")
        ).join(Candidate).where(self.model.is_deleted == False)

        count_query = select(func.count(self.model.id)).where(self.model.is_deleted == False)

        # Apply filters
        if batch_id:
            query = query.where(self.model.batch_id == batch_id)
            count_query = count_query.where(self.model.batch_id == batch_id)
        
        if status:
            query = query.where(self.model.status == status)
            count_query = count_query.where(self.model.status == status)
        
        if is_dropout is not None:
            query = query.where(self.model.is_dropout == is_dropout)
            count_query = count_query.where(self.model.is_dropout == is_dropout)

        if gender:
            query = query.where(Candidate.gender == gender)
            # count_query might not have joined Candidate yet
            if not search:
                count_query = count_query.join(Candidate)
            count_query = count_query.where(Candidate.gender == gender)

        if disability_types:
            dt_list = disability_types.split(',') if isinstance(disability_types, str) else disability_types
            disability_filters = [
                Candidate.disability_details['disability_type'].as_string() == d_type 
                for d_type in dt_list if d_type
            ]
            if disability_filters:
                query = query.where(or_(*disability_filters))
                if not (search or gender):
                    count_query = count_query.join(Candidate)
                count_query = count_query.where(or_(*disability_filters))

        if search:
            search_filter = or_(
                Candidate.name.ilike(f"%{search}%"),
                Candidate.email.ilike(f"%{search}%"),
                Candidate.phone.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
            count_query = count_query.join(Candidate).where(search_filter)

        # Apply sorting
        if hasattr(self.model, sort_by):
            sort_attr = getattr(self.model, sort_by)
        else:
            sort_attr = getattr(Candidate, sort_by) if hasattr(Candidate, sort_by) else self.model.created_at
            
        if sort_order.lower() == "desc":
            query = query.order_by(desc(sort_attr))
        else:
            query = query.order_by(asc(sort_attr))

        # Pagination and Eager Loading
        query = query.offset(skip).limit(limit).options(
            selectinload(self.model.candidate).selectinload(Candidate.documents),
            joinedload(self.model.batch)
        )

        # Execute
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0
        
        result = await self.db.execute(query)
        rows = result.all()
        
        items = []
        for row in rows:
            item = row[0]
            # Attach metrics to the model instance for pydantic serialization
            item.attendance_percentage = row[1]
            items.append(item)
        
        return items, total
