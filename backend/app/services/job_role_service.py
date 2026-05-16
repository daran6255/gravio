"""Job Role Service"""

from typing import List, Optional, Any
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.models.job_role import JobRole, JobRoleStatus
from app.models.user import User
from app.schemas.job_role import JobRoleCreate, JobRoleUpdate
from app.repositories.job_role_repository import JobRoleRepository


class JobRoleService:
    """Service for Job Role business logic"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = JobRoleRepository(db)
        
    async def create_job_role(self, job_role_in: JobRoleCreate, current_user: User) -> JobRole:
        """Create a new job role with default pipeline stages"""
        job_role_data = job_role_in.model_dump()
        job_role_data["created_by_id"] = current_user.id
        
        # Initialize default pipeline if not provided
        if not job_role_data.get("pipeline_stages"):
            job_role_data["pipeline_stages"] = [
                {"id": "mapped", "label": "Mapped", "category": "lead"},
                {"id": "shortlisted", "label": "Shortlisted", "category": "shortlisted"},
                {"id": "interview_l1", "label": "L1 Interview", "category": "interview"},
                {"id": "offer_made", "label": "Offer Made", "category": "offer"},
                {"id": "joined", "label": "Joined", "category": "hired"},
                {"id": "rejected", "label": "Rejected", "category": "rejected"},
                {"id": "not_joined", "label": "Not Joined", "category": "not_joined"}
            ]
        
        job_role = await self.repository.create(job_role_data)
        # Fetch with relationships loaded
        return await self.repository.get_by_public_id(job_role.public_id)
        
    async def get_job_role(self, public_id: UUID) -> JobRole:
        """Get job role by public_id"""
        job_role = await self.repository.get_by_public_id(public_id)
        if not job_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job Role not found"
            )
        return job_role
        
    async def get_job_roles(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status_filter: Optional[JobRoleStatus] = None,
        company_id: Optional[int] = None,
        contact_id: Optional[int] = None,
    ) -> dict:
        """Get list of job roles with total count and filters"""
        items = await self.repository.get_multi_with_filters(
            skip=skip,
            limit=limit,
            search=search,
            status=status_filter,
            company_id=company_id,
            contact_id=contact_id
        )
        total = await self.repository.count_with_filters(
            search=search,
            status=status_filter,
            company_id=company_id,
            contact_id=contact_id
        )
        return {"items": items, "total": total}
        
    async def update_job_role(self, public_id: UUID, job_role_in: JobRoleUpdate) -> JobRole:
        """Update an existing job role"""
        job_role = await self.get_job_role(public_id)
        
        update_data = job_role_in.model_dump(exclude_unset=True)
        updated_obj = await self.repository.update(job_role.id, update_data)
        # Fetch with relationships loaded
        return await self.repository.get_by_public_id(updated_obj.public_id)
        
    async def delete_job_role(self, public_id: UUID, reason: Optional[str] = None) -> bool:
        """Soft delete a job role"""
        job_role = await self.get_job_role(public_id)
        
        # Check if any candidates are mapped to this role
        if hasattr(job_role, 'mappings_count') and job_role.mappings_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete job role with {job_role.mappings_count} active candidate mappings."
            )
            
        return await self.repository.update(job_role.id, {
            "is_deleted": True, 
            "deleted_at": datetime.utcnow(),
            "deletion_reason": reason
        }) is not None

    async def change_status(self, public_id: UUID, new_status: JobRoleStatus, reason: Optional[str] = None) -> JobRole:
        """Change job role status"""
        job_role = await self.get_job_role(public_id)
        update_data = {"status": new_status}
        if reason:
            update_data["status_reason"] = reason
            
        updated_obj = await self.repository.update(job_role.id, update_data)
        # Fetch with relationships loaded
        return await self.repository.get_by_public_id(updated_obj.public_id)
