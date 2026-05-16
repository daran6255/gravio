"""Candidate Document Service"""

from typing import List
from uuid import UUID
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.candidate_document import CandidateDocument
from app.schemas.candidate_document import CandidateDocumentCreate, CandidateDocumentUpdate
from app.repositories.candidate_document_repository import CandidateDocumentRepository
from app.repositories.candidate_repository import CandidateRepository
from app.services.file_storage_service import FileStorageService


class CandidateDocumentService:
    """Service for candidate document operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = CandidateDocumentRepository(db)
        self.candidate_repo = CandidateRepository(db)
    
    async def upload_document(
        self,
        candidate_public_id: UUID,
        document_type: str,
        file: UploadFile,
        description: str = None,
        document_source: str = "candidate",
        uploaded_by_id: int = None
    ) -> CandidateDocument:
        """Upload and save document file for a candidate"""
        # Verify candidate exists
        candidate = await self.candidate_repo.get_by_public_id(candidate_public_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Logic: If it's a resume and source is trainer, deactivate other active resumes
        if document_type in ['resume', 'trainer_resume']:
            existing_docs = await self.repository.get_by_candidate_id(candidate.id)
            for doc in existing_docs:
                if doc.document_type in ['resume', 'trainer_resume'] and doc.is_active:
                    await self.repository.update(doc.id, {"is_active": False})

        # Save file to storage
        file_info = await FileStorageService.save_file(
            file=file,
            candidate_public_id=str(candidate.public_id),
            document_type=document_type,
            candidate_name=candidate.name,
            candidate_id=candidate.id
        )
        
        # Create document record
        document_data = {
            "candidate_id": candidate.id,
            "document_type": document_type,
            "document_name": file_info["file_name"],
            "file_path": file_info["file_path"],
            "file_size": file_info["file_size"],
            "mime_type": file_info["mime_type"],
            "description": description,
            "document_source": document_source,
            "is_active": True, # New upload is active by default
            "uploaded_by_id": uploaded_by_id
        }
        
        return await self.repository.create(document_data)
    
    async def create_document(
        self,
        candidate_public_id: UUID,
        document_in: CandidateDocumentCreate
    ) -> CandidateDocument:
        """Add document for a candidate (manual file path)"""
        # Verify candidate exists
        candidate = await self.candidate_repo.get_by_public_id(candidate_public_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Create document
        document_data = document_in.model_dump()
        document_data["candidate_id"] = candidate.id
        
        # Deactivate others if this is a resume
        if document_data.get("document_type") in ['resume', 'trainer_resume'] and document_data.get("is_active"):
            existing_docs = await self.repository.get_by_candidate_id(candidate.id)
            for doc in existing_docs:
                if doc.document_type in ['resume', 'trainer_resume'] and doc.id != document_data.get("id"):
                    await self.repository.update(doc.id, {"is_active": False})
        
        return await self.repository.create(document_data)
    
    async def get_documents(self, candidate_public_id: UUID) -> List[CandidateDocument]:
        """Get all documents for a candidate"""
        candidate = await self.candidate_repo.get_by_public_id(candidate_public_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        return await self.repository.get_by_candidate_id(candidate.id)
    
    async def get_document(self, document_id: int) -> CandidateDocument:
        """Get a specific document by id"""
        document = await self.repository.get(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    
    async def update_document(
        self,
        document_id: int,
        document_in: CandidateDocumentUpdate
    ) -> CandidateDocument:
        """Update a document"""
        document = await self.get_document(document_id)
        update_data = document_in.model_dump(exclude_unset=True)
        return await self.repository.update(document.id, update_data)
    
    async def delete_document(self, document_id: int) -> bool:
        """Delete a document and its file"""
        document = await self.get_document(document_id)
        
        # Delete file from storage
        FileStorageService.delete_file(document.file_path)
        
        # Delete database record
        return await self.repository.delete(document.id)

