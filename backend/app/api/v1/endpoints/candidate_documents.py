"""Candidate Document Endpoints"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, Request, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rate_limiter import rate_limit_medium
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.candidate_document import (
    CandidateDocumentCreate,
    CandidateDocumentUpdate,
    CandidateDocumentResponse
)
from app.services.candidate_document_service import CandidateDocumentService
from app.services.file_storage_service import FileStorageService
from app.utils.activity_tracker import log_create, log_update, log_delete


router = APIRouter(tags=["Candidate Documents"])


@router.post(
    "/candidates/{public_id}/documents/upload",
    response_model=CandidateDocumentResponse,
    status_code=status.HTTP_201_CREATED
)
@rate_limit_medium()
async def upload_candidate_document(
    request: Request,
    public_id: UUID,
    document_type: str = Form(..., description="resume, disability_certificate, or other"),
    file: UploadFile = File(...),
    description: str = Form(None),
    document_source: str = Form("candidate"),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a document file for a candidate (Trainer only)
    - Automatically saves file with structured folder management
    - Validates file type and size
    - Creates database record
    """
    service = CandidateDocumentService(db)
    document = await service.upload_document(
        candidate_public_id=public_id,
        document_type=document_type,
        file=file,
        description=description,
        document_source=document_source,
        uploaded_by_id=current_user.id
    )
    
    # Log the upload
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate_document",
        resource_id=document.id,
        created_object=document
    )
    
    return document


@router.get(
    "/candidates/documents/{document_id}/download",
    response_class=FileResponse
)
@rate_limit_medium()
async def download_candidate_document(
    request: Request,
    document_id: int,
    disposition: str = "attachment",
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Download or preview a candidate document file.
    - disposition: 'attachment' (default, download) or 'inline' (preview)
    """
    service = CandidateDocumentService(db)
    document = await service.get_document(document_id)
    
    # Get file path
    file_path = FileStorageService.get_file_path(document.file_path)
    if not file_path:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File not found on server")
    
    # Return file
    return FileResponse(
        path=str(file_path),
        filename=document.document_name,
        media_type=document.mime_type or "application/octet-stream",
        content_disposition_type=disposition
    )


@router.post(
    "/candidates/{public_id}/documents",
    response_model=CandidateDocumentResponse,
    status_code=status.HTTP_201_CREATED
)
@rate_limit_medium()
async def create_candidate_document(
    request: Request,
    public_id: UUID,
    document_in: CandidateDocumentCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a document for a candidate with manual file path (Trainer only)
    Use /upload endpoint for automatic file upload instead
    """
    service = CandidateDocumentService(db)
    document = await service.create_document(public_id, document_in)
    
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate_document",
        resource_id=document.id,
        created_object=document
    )
    
    return document


@router.get(
    "/candidates/{public_id}/documents",
    response_model=List[CandidateDocumentResponse]
)
@rate_limit_medium()
async def get_candidate_documents(
    request: Request,
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all documents for a candidate (Trainer only)
    """
    service = CandidateDocumentService(db)
    return await service.get_documents(public_id)


@router.put(
    "/candidates/documents/{document_id}",
    response_model=CandidateDocumentResponse
)
@rate_limit_medium()
async def update_candidate_document(
    request: Request,
    document_id: int,
    document_in: CandidateDocumentUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a candidate document metadata (Trainer only)
    """
    service = CandidateDocumentService(db)
    
    # Get before state
    existing_document = await service.get_document(document_id)
    
    updated_document = await service.update_document(document_id, document_in)
    
    # Log the update
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate_document",
        resource_id=updated_document.id,
        before=existing_document,
        after=updated_document
    )
    
    return updated_document


@router.delete(
    "/candidates/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
@rate_limit_medium()
async def delete_candidate_document(
    request: Request,
    document_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a candidate document and its file (Admin/Manager only)
    """
    service = CandidateDocumentService(db)
    # Get document info before deletion
    document = await service.get_document(document_id)
    
    await service.delete_document(document_id)
    
    # Log the deletion
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate_document",
        resource_id=document.id
    )
    
    return None

