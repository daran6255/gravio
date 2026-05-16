"""Candidate Endpoints"""

from typing import List, Optional, Any
from uuid import UUID
from fastapi import APIRouter, Depends, status, Request, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rate_limiter import rate_limit_medium
from app.api.deps import require_roles, get_current_active_user
from app.models.user import User, UserRole
from app.schemas.candidate import (
    CandidateCreate,
    CandidateUpdate,
    CandidateResponse,
    CandidateListResponse,
    CandidatePaginatedResponse,
    CandidateStats,
    ScreeningStats,
    CandidateCheck
)
from app.schemas.candidate_assignment import CandidateAssignmentResponse, CandidateAssignmentCreate
from app.services.candidate_service import CandidateService
from app.utils.activity_tracker import log_create, log_update, log_delete
from app.utils.email import send_registration_emails


router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.post("/", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
@rate_limit_medium()
async def register_candidate(
    request: Request,
    candidate_in: CandidateCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new candidate (Public access)
    """
    # No auth dependency here - public self-registration
    service = CandidateService(db)
    candidate = await service.create_candidate(candidate_in)
    
    # Send registration emails in background
    background_tasks.add_task(send_registration_emails, candidate)
    
    # Log the registration
    await log_create(
        db=db,
        request=request,
        user_id=None, # Public self-registration
        resource_type="candidate",
        resource_id=candidate.id,
        created_object=candidate
    )
    
    return candidate


@router.post("/check-availability")
@rate_limit_medium()
async def check_candidate_availability(
    request: Request,
    check_in: CandidateCheck,
    db: AsyncSession = Depends(get_db)
):
    """
    Check if email/phone are available and validate pincode (Public access)
    """
    service = CandidateService(db)
    # This will raise HTTPException if invalid/duplicate
    address_details = await service.validate_personal_info(
        check_in.email, 
        check_in.phone, 
        check_in.pincode,
        country_code=check_in.country_code,
        exclude_public_id=check_in.exclude_public_id
    )
    return {"status": "available", "address": address_details}


@router.get("/", response_model=CandidatePaginatedResponse)
@rate_limit_medium()
async def get_candidates(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    sort_by: str = None,
    sort_order: str = "desc",
    disability_types: str = None,  # Comma-separated list
    education_levels: str = None,  # Comma-separated list
    cities: str = None,  # Comma-separated list
    counseling_status: str = None,
    is_experienced: bool = None,
    screening_status: str = None,
    disability_percentages: str = None, # Comma-separated list (or single range string)
    screening_reasons: str = None, # Comma-separated list
    gender: str = None,
    year_of_passing: str = None, # Comma-separated list
    year_of_experience: str = None,
    currently_employed: bool = None,
    registration_type: str = None,
    is_global: bool = False,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of candidates (Restricted)
    Returns simplified candidate list without nested relationships.
    Supports filtering by disability_types, education_levels, cities, and counseling_status.
    """
    # Parse comma-separated filters into lists
    disability_types_list = disability_types.split(',') if disability_types else None
    education_levels_list = education_levels.split(',') if education_levels else None
    cities_list = cities.split(',') if cities else None
    disability_percentages_list = disability_percentages.split(',') if disability_percentages else None
    screening_reasons_list = screening_reasons.split(',') if screening_reasons else None
    year_of_passing_list = year_of_passing.split(',') if year_of_passing else None
    
    # Collect dynamic filters from query params
    extra_filters = {}
    for key, value in request.query_params.items():
        if key.startswith(('screening_others.', 'counseling_others.')):
            extra_filters[key] = value

    service = CandidateService(db)
    return await service.get_candidates(
        skip=skip, 
        limit=limit, 
        search=search, 
        sort_by=sort_by, 
        sort_order=sort_order,
        disability_types=disability_types_list,
        education_levels=education_levels_list,
        cities=cities_list,
        counseling_status=counseling_status,
        is_experienced=is_experienced,
        screening_status=screening_status,
        disability_percentages=disability_percentages_list,
        screening_reasons=screening_reasons_list,
        gender=gender,
        year_of_passing=year_of_passing_list,
        year_of_experience=year_of_experience,
        currently_employed=currently_employed,
        extra_filters=extra_filters,
        registration_type=registration_type,
        current_user=current_user,
        is_global=is_global
    )


from app.core.database import get_db, AsyncSessionLocal


async def _run_export_candidates(
    user_id: int,
    user_email: str,
    user_name: str,
    columns: Optional[str] = None,
    **kwargs
):
    """Wrapper to run export in background with its own DB session"""
    from loguru import logger
    import sys
    print(f"DEBUG: Background task STARTING for candidate export (User: {user_email})")
    sys.stdout.flush()
    logger.info(f"Background task STARTED for candidate export (User: {user_email})")
    try:
        async with AsyncSessionLocal() as db:
            from app.models.user import User
            # Create a mock user for the service with correct attributes
            current_user = User(
                id=user_id, 
                email=user_email, 
                full_name=user_name,
                username=user_email # Fallback for username
            )
            
            service = CandidateService(db)
            await service.export_candidates(current_user=current_user, columns=columns, **kwargs)
        logger.info(f"Background task COMPLETED for candidate export (User: {user_email})")
        print(f"DEBUG: Background task COMPLETED for candidate export (User: {user_email})")
        sys.stdout.flush()
    except Exception as e:
        logger.error(f"Background task FAILED for candidate export: {str(e)}", exc_info=True)
        print(f"DEBUG: Background task FAILED for candidate export: {str(e)}")
        sys.stdout.flush()


@router.post("/export")
@rate_limit_medium()
async def export_candidates(
    request: Request,
    background_tasks: BackgroundTasks,
    search: str = None,
    sort_by: str = None,
    sort_order: str = "desc",
    disability_types: str = None,
    education_levels: str = None,
    cities: str = None,
    counseling_status: str = None,
    is_experienced: bool = None,
    screening_status: str = None,
    disability_percentages: str = None,
    screening_reasons: str = None,
    gender: str = None,
    year_of_passing: str = None,
    year_of_experience: str = None,
    currently_employed: bool = None,
    is_global: bool = False,
    columns: Optional[str] = Query(None),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Export all matching candidates and send via email.
    """
    disability_types_list = disability_types.split(',') if disability_types else None
    education_levels_list = education_levels.split(',') if education_levels else None
    cities_list = cities.split(',') if cities else None
    disability_percentages_list = disability_percentages.split(',') if disability_percentages else None
    screening_reasons_list = screening_reasons.split(',') if screening_reasons else None
    year_of_passing_list = year_of_passing.split(',') if year_of_passing else None
    
    extra_filters = {}
    for key, value in request.query_params.items():
        if key.startswith(('screening_others.', 'counseling_others.')):
            extra_filters[key] = value

    service = CandidateService(db)
    from loguru import logger
    logger.info(f"API: Export candidates requested by {current_user.email}")
    
    # Trigger export in background
    background_tasks.add_task(
        _run_export_candidates,
        user_id=current_user.id,
        user_email=current_user.email,
        user_name=current_user.full_name or current_user.username,
        columns=columns,
        search=search, 
        sort_by=sort_by, 
        sort_order=sort_order,
        disability_types=disability_types_list,
        education_levels=education_levels_list,
        cities=cities_list,
        counseling_status=counseling_status,
        is_experienced=is_experienced,
        screening_status=screening_status,
        disability_percentages=disability_percentages_list,
        screening_reasons=screening_reasons_list,
        gender=gender,
        year_of_passing=year_of_passing_list,
        year_of_experience=year_of_experience,
        currently_employed=currently_employed,
        extra_filters=extra_filters,
        is_global=is_global
    )
    
    return {"message": f"Export started. The report will be sent to {current_user.email} shortly."}





@router.get("/filter-options")
@rate_limit_medium()
async def get_filter_options(
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all unique values for filterable fields (Restricted)
    Returns disability types, education levels, cities, and counseling statuses
    from ALL candidates in the database (not just current page)
    """
    service = CandidateService(db)
    return await service.get_filter_options()


@router.get("/stats", response_model=CandidateStats)
@rate_limit_medium()
async def get_candidate_stats(
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get candidate statistics (Restricted)
    """
    service = CandidateService(db)
    return await service.get_stats()


@router.get("/screening-stats", response_model=ScreeningStats)
@rate_limit_medium()
async def get_candidate_screening_stats(
    request: Request,
    is_global: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get candidate screening statistics for tabs (Role-filtered)
    """
    service = CandidateService(db)
    return await service.get_screening_stats(current_user=current_user, is_global=is_global)


@router.get("/unscreened", response_model=CandidatePaginatedResponse)
@rate_limit_medium()
async def get_unscreened_candidates(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    sort_by: str = None,
    sort_order: str = "desc",
    disability_types: str = None,
    education_levels: str = None,
    cities: str = None,
    screening_status: str = None,
    is_experienced: bool = None,
    counseling_status: str = None,
    is_global: bool = False,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of candidates without screening records (Restricted)
    """
    disability_types_list = disability_types.split(',') if disability_types else None
    education_levels_list = education_levels.split(',') if education_levels else None
    cities_list = cities.split(',') if cities else None

    service = CandidateService(db)
    return await service.get_unscreened_candidates(
        skip=skip, 
        limit=limit, 
        search=search, 
        sort_by=sort_by, 
        sort_order=sort_order,
        disability_types=disability_types_list,
        education_levels=education_levels_list,
        cities=cities_list,
        screening_status=screening_status,
        is_experienced=is_experienced,
        counseling_status=counseling_status,
        current_user=current_user,
        is_global=is_global
    )


@router.get("/screened", response_model=CandidatePaginatedResponse)
@rate_limit_medium()
async def get_screened_candidates(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    counseling_status: str = None, # 'pending' or 'counseled'
    document_status: str = None, # 'pending' or 'collected'
    search: str = None,
    sort_by: str = None,
    sort_order: str = "desc",
    disability_types: str = None,
    education_levels: str = None,
    cities: str = None,
    screening_status: str = None,
    is_experienced: bool = None,
    is_global: bool = False,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of candidates with screening records (Restricted)
    Returns list with basic candidate info.
    """
    disability_types_list = disability_types.split(',') if disability_types else None
    education_levels_list = education_levels.split(',') if education_levels else None
    cities_list = cities.split(',') if cities else None

    service = CandidateService(db)
    return await service.get_screened_candidates(
        skip=skip, 
        limit=limit, 
        counseling_status=counseling_status, 
        search=search, 
        document_status=document_status, 
        sort_by=sort_by, 
        sort_order=sort_order,
        disability_types=disability_types_list,
        education_levels=education_levels_list,
        cities=cities_list,
        screening_status=screening_status,
        is_experienced=is_experienced,
        current_user=current_user,
        is_global=is_global
    )


@router.post("/{public_id}/assign", response_model=CandidateAssignmentResponse)
@rate_limit_medium()
async def assign_candidate(
    request: Request,
    public_id: UUID,
    assignment_in: CandidateAssignmentCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Assign a candidate to a sourcing user (Admin/Manager only)
    """
    service = CandidateService(db)
    
    # Snapshot before state for logging
    candidate = await service.get_candidate(public_id, with_details=True)
    from app.utils.activity_tracker import extract_safe_metadata
    before_snapshot = extract_safe_metadata(candidate)
    
    assignment = await service.assign_candidate(public_id, assignment_in, current_user)
    
    # Log the assignment as an update to the candidate
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate",
        resource_id=candidate.id,
        before=before_snapshot,
        after=await service.get_candidate(public_id, with_details=True)
    )
    
    return assignment




@router.get("/{public_id}", response_model=CandidateResponse)
@rate_limit_medium()
async def get_candidate(
    request: Request,
    public_id: UUID,
    with_details: bool = True,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get candidate details by public_id (UUID) (Restricted)
    Set with_details=true to include screening, documents, and counseling data.
    """
    service = CandidateService(db)
    return await service.get_candidate(public_id, with_details=with_details)


@router.put("/{public_id}", response_model=CandidateResponse)
@rate_limit_medium()
async def update_candidate(
    request: Request,
    public_id: UUID,
    candidate_in: CandidateUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update candidate by public_id (UUID) (Admin/Manager only)
    """
    service = CandidateService(db)
    
    # Snapshot the before state as a plain dict BEFORE the update to avoid
    # any session detachment issues when the logger reads the old state.
    existing_candidate = await service.get_candidate(public_id)
    from app.utils.activity_tracker import extract_safe_metadata
    before_snapshot = extract_safe_metadata(existing_candidate)
    
    # Perform the update
    await service.update_candidate(public_id, candidate_in)
    
    # CRITICAL: Always re-fetch after update. The object returned by .returning()
    # or after a db.commit() may be detached from the session.
    # Re-fetching guarantees a live, session-bound, fully-loaded object.
    updated_candidate = await service.get_candidate(public_id, with_details=True)
    
    # Log the update using the safe dict snapshot for 'before'
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate",
        resource_id=updated_candidate.id,
        before=before_snapshot,
        after=updated_candidate
    )
    
    return updated_candidate


@router.delete("/{public_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit_medium()
async def delete_candidate(
    request: Request,
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete candidate by public_id (UUID) (Admin only)
    """
    service = CandidateService(db)
    # Get candidate info before deleting for logging if needed
    candidate = await service.get_candidate(public_id)
    
    await service.delete_candidate(public_id)
    
    # Log the deletion
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate",
        resource_id=candidate.id
    )
    
    return None

