"""Candidate Document Repository"""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.candidate_document import CandidateDocument
from app.repositories.base import BaseRepository


class CandidateDocumentRepository(BaseRepository[CandidateDocument]):
    """Repository for CandidateDocument model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(CandidateDocument, db)
    
    async def get_by_candidate_id(self, candidate_id: int) -> list[CandidateDocument]:
        """Get all documents for a candidate"""
        result = await self.db.execute(
            select(CandidateDocument)
            .where(CandidateDocument.candidate_id == candidate_id)
            .order_by(CandidateDocument.created_at.desc())
        )
        return result.scalars().all()
    
    async def get_by_type(self, candidate_id: int, document_type: str) -> list[CandidateDocument]:
        """Get documents by type for a candidate"""
        result = await self.db.execute(
            select(CandidateDocument)
            .where(
                CandidateDocument.candidate_id == candidate_id,
                CandidateDocument.document_type == document_type
            )
        )
        return result.scalars().all()
    
    async def delete_by_file_path(self, file_path: str) -> bool:
        """Delete document by file path"""
        result = await self.db.execute(
            select(CandidateDocument).where(CandidateDocument.file_path == file_path)
        )
        document = result.scalars().first()
        if document:
            return await self.delete(document.id)
        return False
