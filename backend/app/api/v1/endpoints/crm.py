"""FastAPI endpoint routers for Gravit CRM"""

import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_roles, get_current_active_user
from app.models.user import User, UserRole
from app.services.crm import CRMService
from app.schemas.common import PaginatedResponse
from app.schemas.crm import (
    CRMCompanyCreate,
    CRMCompanyUpdate,
    CRMCompanyResponse,
    CRMContactCreate,
    CRMContactUpdate,
    CRMContactResponse,
    CRMLeadCreate,
    CRMLeadUpdate,
    CRMLeadResponse,
    CRMLeadConvertRequest,
    CRMDealCreate,
    CRMDealUpdate,
    CRMDealResponse,
    CRMPipelineCreate,
    CRMPipelineResponse,
    CRMPipelineStagesUpdateRequest,
    CRMActivityCreate,
    CRMActivityUpdate,
    CRMActivityResponse,
    CRMStatsResponse,
    CRMOwnerOption,
    CRMBulkLeadUpdateRequest,
    CRMSearchResponse,
)

router = APIRouter(prefix="/crm", tags=["CRM"])

# Restrict CRM access to roles: admin, manager, marketing, placement
require_crm_access = require_roles([
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.MARKETING,
    UserRole.PLACEMENT,
])

# Pipeline/stage configuration is an admin/manager-only capability
require_pipeline_management = require_roles([UserRole.ADMIN, UserRole.MANAGER])


# --- Dashboard Stats ---
@router.get(
    "/dashboard/stats",
    response_model=CRMStatsResponse,
    summary="Get CRM dashboard stats",
)
async def get_crm_stats(
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMStatsResponse:
    return await CRMService.get_stats(db, current_user.id)


# --- Owner Options ---
@router.get(
    "/owners",
    response_model=list[CRMOwnerOption],
    summary="List org users assignable as a lead/deal owner",
)
async def list_owners_endpoint(
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> list[CRMOwnerOption]:
    owners = await CRMService.list_assignable_owners(db, current_user.organization_id)
    return [CRMOwnerOption.model_validate(o) for o in owners]


# --- Cross-Entity Search ---
@router.get(
    "/search",
    response_model=CRMSearchResponse,
    summary="Search companies, contacts, leads, and deals by a single query",
)
async def search_crm_endpoint(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMSearchResponse:
    results = await CRMService.search(db, q)
    return CRMSearchResponse(
        companies=[CRMCompanyResponse.model_validate(c) for c in results["companies"]],
        contacts=[CRMContactResponse.model_validate(c) for c in results["contacts"]],
        leads=[CRMLeadResponse.model_validate(l) for l in results["leads"]],
        deals=[CRMDealResponse.model_validate(d) for d in results["deals"]],
    )


# --- Pipelines ---
@router.get(
    "/pipelines",
    response_model=list[CRMPipelineResponse],
    summary="List sales pipelines and stages",
)
async def list_pipelines_endpoint(
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> list[CRMPipelineResponse]:
    pipelines = await CRMService.list_pipelines(db)
    return [CRMPipelineResponse.model_validate(p) for p in pipelines]


@router.post(
    "/pipelines",
    response_model=CRMPipelineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a sales pipeline with its initial stages",
)
async def create_pipeline_endpoint(
    payload: CRMPipelineCreate,
    current_user: User = Depends(require_pipeline_management),
    db: AsyncSession = Depends(get_db),
) -> CRMPipelineResponse:
    pipeline = await CRMService.create_pipeline(db, payload)
    return CRMPipelineResponse.model_validate(pipeline)


@router.patch(
    "/pipelines/{pipeline_id}/stages",
    response_model=CRMPipelineResponse,
    summary="Create, update, reorder, and delete a pipeline's stages",
)
async def update_pipeline_stages_endpoint(
    pipeline_id: int,
    payload: CRMPipelineStagesUpdateRequest,
    current_user: User = Depends(require_pipeline_management),
    db: AsyncSession = Depends(get_db),
) -> CRMPipelineResponse:
    pipeline = await CRMService.update_pipeline_stages(db, pipeline_id, payload.stages)
    return CRMPipelineResponse.model_validate(pipeline)


# --- Companies ---
@router.post(
    "/companies",
    response_model=CRMCompanyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a company",
)
async def create_company_endpoint(
    payload: CRMCompanyCreate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMCompanyResponse:
    company = await CRMService.create_company(db, payload, current_user.id)
    return CRMCompanyResponse.model_validate(company)


@router.get(
    "/companies/{public_id}",
    response_model=CRMCompanyResponse,
    summary="Get company details",
)
async def get_company_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMCompanyResponse:
    company = await CRMService.get_company(db, public_id)
    return CRMCompanyResponse.model_validate(company)


@router.patch(
    "/companies/{public_id}",
    response_model=CRMCompanyResponse,
    summary="Update company details",
)
async def update_company_endpoint(
    public_id: uuid.UUID,
    payload: CRMCompanyUpdate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMCompanyResponse:
    company = await CRMService.update_company(db, public_id, payload)
    return CRMCompanyResponse.model_validate(company)


@router.delete(
    "/companies/{public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a company",
)
async def delete_company_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
):
    await CRMService.delete_company(db, public_id)


@router.get(
    "/companies",
    response_model=PaginatedResponse[CRMCompanyResponse],
    summary="List companies",
)
async def list_companies_endpoint(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[CRMCompanyResponse]:
    items, total = await CRMService.list_companies(db, page, page_size, search)
    return PaginatedResponse[CRMCompanyResponse](
        items=[CRMCompanyResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# --- Contacts ---
@router.post(
    "/contacts",
    response_model=CRMContactResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a contact",
)
async def create_contact_endpoint(
    payload: CRMContactCreate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMContactResponse:
    contact = await CRMService.create_contact(db, payload, current_user.id)
    return CRMContactResponse.model_validate(contact)


@router.get(
    "/contacts/{public_id}",
    response_model=CRMContactResponse,
    summary="Get contact details",
)
async def get_contact_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMContactResponse:
    contact = await CRMService.get_contact(db, public_id)
    return CRMContactResponse.model_validate(contact)


@router.patch(
    "/contacts/{public_id}",
    response_model=CRMContactResponse,
    summary="Update contact details",
)
async def update_contact_endpoint(
    public_id: uuid.UUID,
    payload: CRMContactUpdate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMContactResponse:
    contact = await CRMService.update_contact(db, public_id, payload)
    return CRMContactResponse.model_validate(contact)


@router.delete(
    "/contacts/{public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a contact",
)
async def delete_contact_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
):
    await CRMService.delete_contact(db, public_id)


@router.get(
    "/contacts",
    response_model=PaginatedResponse[CRMContactResponse],
    summary="List contacts",
)
async def list_contacts_endpoint(
    company_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[CRMContactResponse]:
    items, total = await CRMService.list_contacts(db, company_id, page, page_size, search)
    return PaginatedResponse[CRMContactResponse](
        items=[CRMContactResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# --- Leads ---
@router.post(
    "/leads",
    response_model=CRMLeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a lead",
)
async def create_lead_endpoint(
    payload: CRMLeadCreate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMLeadResponse:
    lead = await CRMService.create_lead(db, payload, current_user.id)
    return CRMLeadResponse.model_validate(lead)


@router.patch(
    "/leads/bulk",
    response_model=list[CRMLeadResponse],
    summary="Bulk reassign owner and/or change status on multiple leads",
)
async def bulk_update_leads_endpoint(
    payload: CRMBulkLeadUpdateRequest,
    current_user: User = Depends(require_pipeline_management),
    db: AsyncSession = Depends(get_db),
) -> list[CRMLeadResponse]:
    leads = await CRMService.bulk_update_leads(db, payload.public_ids, payload.owner_id, payload.status)
    return [CRMLeadResponse.model_validate(l) for l in leads]


@router.get(
    "/leads/{public_id}",
    response_model=CRMLeadResponse,
    summary="Get lead details",
)
async def get_lead_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMLeadResponse:
    lead = await CRMService.get_lead(db, public_id)
    return CRMLeadResponse.model_validate(lead)


@router.patch(
    "/leads/{public_id}",
    response_model=CRMLeadResponse,
    summary="Update lead details",
)
async def update_lead_endpoint(
    public_id: uuid.UUID,
    payload: CRMLeadUpdate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMLeadResponse:
    lead = await CRMService.update_lead(db, public_id, payload)
    return CRMLeadResponse.model_validate(lead)


@router.delete(
    "/leads/{public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a lead",
)
async def delete_lead_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
):
    await CRMService.delete_lead(db, public_id)


@router.get(
    "/leads",
    response_model=PaginatedResponse[CRMLeadResponse],
    summary="List leads",
)
async def list_leads_endpoint(
    status: Optional[str] = Query(None),
    owner_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[CRMLeadResponse]:
    items, total = await CRMService.list_leads(db, status, owner_id, page, page_size, search)
    return PaginatedResponse[CRMLeadResponse](
        items=[CRMLeadResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/leads/{public_id}/convert",
    response_model=CRMDealResponse,
    summary="Convert a qualified lead into a deal",
)
async def convert_lead_endpoint(
    public_id: uuid.UUID,
    payload: CRMLeadConvertRequest,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMDealResponse:
    deal = await CRMService.convert_lead(db, public_id, payload, current_user.id)
    return CRMDealResponse.model_validate(deal)


# --- Deals ---
@router.post(
    "/deals",
    response_model=CRMDealResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a deal",
)
async def create_deal_endpoint(
    payload: CRMDealCreate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMDealResponse:
    deal = await CRMService.create_deal(db, payload, current_user.id)
    return CRMDealResponse.model_validate(deal)


@router.get(
    "/deals/{public_id}",
    response_model=CRMDealResponse,
    summary="Get deal details",
)
async def get_deal_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMDealResponse:
    deal = await CRMService.get_deal(db, public_id)
    return CRMDealResponse.model_validate(deal)


@router.patch(
    "/deals/{public_id}",
    response_model=CRMDealResponse,
    summary="Update deal details",
)
async def update_deal_endpoint(
    public_id: uuid.UUID,
    payload: CRMDealUpdate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMDealResponse:
    deal = await CRMService.update_deal(db, public_id, payload)
    return CRMDealResponse.model_validate(deal)


@router.delete(
    "/deals/{public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a deal",
)
async def delete_deal_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
):
    await CRMService.delete_deal(db, public_id)


@router.get(
    "/deals",
    response_model=PaginatedResponse[CRMDealResponse],
    summary="List deals",
)
async def list_deals_endpoint(
    pipeline_id: Optional[int] = Query(None),
    stage_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    owner_id: Optional[int] = Query(None),
    company_id: Optional[int] = Query(None),
    contact_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[CRMDealResponse]:
    items, total = await CRMService.list_deals(
        db, pipeline_id, stage_id, status, owner_id, page, page_size, search,
        company_id=company_id, contact_id=contact_id,
    )
    return PaginatedResponse[CRMDealResponse](
        items=[CRMDealResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# --- Activities ---
@router.post(
    "/activities",
    response_model=CRMActivityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an activity (note, call, task, WhatsApp)",
)
async def create_activity_endpoint(
    payload: CRMActivityCreate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMActivityResponse:
    activity = await CRMService.create_activity(db, payload, current_user.id)
    return CRMActivityResponse.model_validate(activity)


@router.get(
    "/activities/{public_id}",
    response_model=CRMActivityResponse,
    summary="Get activity details",
)
async def get_activity_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMActivityResponse:
    activity = await CRMService.get_activity(db, public_id)
    return CRMActivityResponse.model_validate(activity)


@router.patch(
    "/activities/{public_id}",
    response_model=CRMActivityResponse,
    summary="Update activity details",
)
async def update_activity_endpoint(
    public_id: uuid.UUID,
    payload: CRMActivityUpdate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMActivityResponse:
    activity = await CRMService.update_activity(db, public_id, payload)
    return CRMActivityResponse.model_validate(activity)


@router.delete(
    "/activities/{public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an activity",
)
async def delete_activity_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
):
    await CRMService.delete_activity(db, public_id)


@router.get(
    "/activities",
    response_model=PaginatedResponse[CRMActivityResponse],
    summary="List activities",
)
async def list_activities_endpoint(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
    owner_id: Optional[int] = Query(None),
    is_completed: Optional[bool] = Query(None),
    type: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[CRMActivityResponse]:
    items, total = await CRMService.list_activities(
        db, entity_type, entity_id, owner_id, is_completed, page, page_size,
        type=type, date_from=date_from, date_to=date_to,
    )
    return PaginatedResponse[CRMActivityResponse](
        items=[CRMActivityResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )
