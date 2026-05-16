"""DSR Project Request Repository"""

from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dsr_project_request import DSRProjectRequest, DSRProjectRequestStatus
from app.repositories.base import BaseRepository


class DSRProjectRequestRepository(BaseRepository[DSRProjectRequest]):

    def __init__(self, db: AsyncSession):
        super().__init__(DSRProjectRequest, db)

    async def get_by_public_id(self, public_id: UUID) -> Optional[DSRProjectRequest]:
        result = await self.db.execute(
            select(DSRProjectRequest)
            .where(DSRProjectRequest.public_id == public_id)
            .where(DSRProjectRequest.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_pending_requests(self) -> List[DSRProjectRequest]:
        result = await self.db.execute(
            select(DSRProjectRequest)
            .where(DSRProjectRequest.status == DSRProjectRequestStatus.PENDING)
            .where(DSRProjectRequest.is_deleted == False)
            .order_by(DSRProjectRequest.created_at)
        )
        return list(result.scalars().all())

    async def get_multi_paginated(
        self,
        skip: int = 0,
        limit: int = 50,
        user_id: Optional[int] = None,
        status: Optional[DSRProjectRequestStatus] = None,
    ) -> Tuple[List[DSRProjectRequest], int]:
        query = select(DSRProjectRequest).where(DSRProjectRequest.is_deleted == False)
        count_query = (
            select(func.count())
            .select_from(DSRProjectRequest)
            .where(DSRProjectRequest.is_deleted == False)
        )

        if user_id is not None:
            query = query.where(DSRProjectRequest.requested_by == user_id)
            count_query = count_query.where(DSRProjectRequest.requested_by == user_id)

        if status is not None:
            query = query.where(DSRProjectRequest.status == status)
            count_query = count_query.where(DSRProjectRequest.status == status)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        query = query.order_by(DSRProjectRequest.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total
