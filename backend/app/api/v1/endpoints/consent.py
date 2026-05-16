from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api import deps
from app.services.consent_service import ConsentService
from app.models.candidate import Candidate
from sqlalchemy import select

router = APIRouter()

@router.post("/send/{public_id}")
async def send_consent_email(
    public_id: UUID,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user)
) -> Any:
    """Send consent email to candidate (Authenticated)"""
    # Dynamically resolve frontend base URL from request origin/referer
    # This ensures the link matches the environment (Dev, QA, Prod)
    origin = request.headers.get("origin") or request.headers.get("referer")
    
    if origin:
        # Strip trailing slash and path if it's a referer
        from urllib.parse import urlparse
        parsed = urlparse(origin)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
    else:
        # Fallback to config if headers are missing (e.g. non-browser calls)
        from app.core.config import settings
        base_url = settings.FRONTEND_URL or "http://localhost:5173"

    service = ConsentService(db)
    success = await service.send_consent_email(str(public_id), current_user.id, base_url)
    return {"success": success}

@router.get("/public/{public_id}")
async def get_public_consent_data(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Get consent form data for public landing page"""
    query = select(Candidate).where(Candidate.public_id == public_id)
    result = await db.execute(query)
    candidate = result.scalar_one_or_none()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Invalid consent link")
        
    return {
        "candidate_name": candidate.name
    }

@router.post("/public/{public_id}/submit")
async def submit_consent(
    public_id: UUID,
    request: Request,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Submit consent form (Public)"""
    service = ConsentService(db)
    # Get IP address from request
    client_host = request.client.host if request.client else "unknown"
    success = await service.submit_consent(str(public_id), client_host)
    return {"success": success}
