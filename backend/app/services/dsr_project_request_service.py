"""DSR Project Request Service"""

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dsr_project_request import DSRProjectRequest, DSRProjectRequestStatus
from app.models.user import User, UserRole
from app.repositories.dsr_project_request_repository import DSRProjectRequestRepository
from app.repositories.dsr_project_repository import DSRProjectRepository
from app.repositories.user_repository import UserRepository
from app.schemas.dsr_project_request import DSRProjectRequestCreate, DSRProjectRequestHandle


class DSRProjectRequestService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DSRProjectRequestRepository(db)
        self.project_repo = DSRProjectRepository(db)
        self.user_repo = UserRepository(db)

    async def create_request(
        self,
        data: DSRProjectRequestCreate,
        current_user: User,
    ) -> DSRProjectRequest:
        """Any user can raise a request for a new project."""
        # Prevent duplicate pending requests for the same project name by the same user
        existing, _ = await self.repo.get_multi_paginated(
            user_id=current_user.id,
            status=DSRProjectRequestStatus.PENDING,
        )
        for req in existing:
            if req.project_name.lower() == data.project_name.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"You already have a pending request for project '{data.project_name}'.",
                )

        obj = DSRProjectRequest(
            requested_by=current_user.id,
            project_name=data.project_name,
            reason=data.reason,
            status=DSRProjectRequestStatus.PENDING,
        )
        self.db.add(obj)
        await self.db.flush()
        return obj

    async def handle_request(
        self,
        public_id: UUID,
        data: DSRProjectRequestHandle,
        current_user: User,
    ) -> DSRProjectRequest:
        """Admin approves or rejects a project request."""
        if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admins and Managers can handle project requests.",
            )

        req = await self.repo.get_by_public_id(public_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project request not found.")

        if req.status != DSRProjectRequestStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This request has already been {req.status.value}.",
            )

        req.status = data.status
        req.admin_notes = data.admin_notes
        req.handled_by = current_user.id
        req.handled_at = datetime.utcnow()

        if data.status == DSRProjectRequestStatus.APPROVED:
            # Determine owner: provided owner OR the requester
            owner_id = req.requested_by
            if data.owner_user_public_id:
                users = await self.user_repo.get_by_fields(public_id=data.owner_user_public_id)
                if not users:
                    raise HTTPException(status_code=404, detail="Owner user not found.")
                owner_id = users[0].id

            # Check if a project with this name already exists
            existing_project = await self.project_repo.get_by_name(req.project_name)
            if existing_project:
                # Point to the existing project instead of creating a duplicate
                req.created_project_id = existing_project.id
            else:
                # Auto-create the project
                from app.models.dsr_project import DSRProject
                new_project = DSRProject(
                    name=req.project_name,
                    owner_id=owner_id,
                    created_by=current_user.id,
                    is_active=True,
                    others={"created_via_request": str(req.public_id)},
                )
                self.db.add(new_project)
                await self.db.flush()
                req.created_project_id = new_project.id

        await self.db.flush()
        return req

    async def get_requests(
        self,
        current_user: User,
        skip: int = 0,
        limit: int = 50,
        status_filter: Optional[DSRProjectRequestStatus] = None,
    ) -> Tuple[List[DSRProjectRequest], int]:
        """Users see their own; Admins and Managers see all."""
        user_id = None
        if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            user_id = current_user.id

        return await self.repo.get_multi_paginated(
            skip=skip,
            limit=limit,
            user_id=user_id,
            status=status_filter,
        )

    async def get_request(self, public_id: UUID, current_user: User) -> DSRProjectRequest:
        req = await self.repo.get_by_public_id(public_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project request not found.")
        # Owners and privileged users can view
        if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER) and req.requested_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
        return req
