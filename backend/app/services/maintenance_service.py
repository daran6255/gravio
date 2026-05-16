from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from fastapi import HTTPException, status
from app.models.user import User, UserRole

class MaintenanceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def clear_dsr_data(self, current_user: User) -> dict:
        """
        Truncates all DSR-related transaction tables.
        Only accessible by Admin.
        """
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admins can perform database maintenance."
            )

        tables = [
            "dsr_entries",
            "dsr_leave_applications",
            "dsr_permission_requests",
            "dsr_project_requests",
            "dsr_activity_assignments",
            "dsr_activities",
            "dsr_projects"
        ]

        try:
            # We use TRUNCATE with RESTART IDENTITY to clear the data and reset serial IDs
            # We use CASCADE to handle any unexpected foreign key constraints safely
            for table in tables:
                await self.db.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE"))
            
            await self.db.commit()
            return {"message": "DSR data cleared successfully", "tables_affected": tables}
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to clear DSR data: {str(e)}"
            )
