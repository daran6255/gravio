"""FastAPI endpoint routers for Gravit CRM"""

import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_roles, get_current_active_user
from app.models.user import User, UserRole
from app.services.crm import CRMService
from app.services.reminder import ReminderService
from app.services.currency import CurrencyConversionService
from app.services.plan_access import require_paid_plan
from app.services.project import ProjectService
from app.utils.file_validation import validate_upload
from app.schemas.common import PaginatedResponse
from app.schemas.project import DealConvertToProjectRequest, ProjectResponse, DealProjectConversionPreview
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
    CRMLeadCreateResponse,
    CRMLeadConvertRequest,
    CRMDealCreate,
    CRMDealUpdate,
    CRMDealResponse,
    CRMDealTaskCreate,
    CRMDealTaskUpdate,
    CRMDealTaskResponse,
    CRMLeadTaskCreate,
    CRMLeadTaskUpdate,
    CRMLeadTaskResponse,
    CRMReminderCreate,
    CRMReminderUpdate,
    CRMReminderResponse,
    CRMPipelineCreate,
    CRMPipelineResponse,
    CRMPipelineStagesUpdateRequest,
    CRMActivityCreate,
    CRMActivityUpdate,
    CRMActivityResponse,
    CRMFileResponse,
    CRMStatsResponse,
    CRMLeadStatsResponse,
    CRMCompanyStatsResponse,
    CRMOwnerOption,
    CRMBulkLeadUpdateRequest,
    CRMBulkLeadDeleteRequest,
    CRMBulkCompanyUpdateRequest,
    CRMBulkCompanyDeleteRequest,
    CRMLeadImportResponse,
    AuditLogResponse,
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

# Reminders are a cross-cutting feature (leads/deals for CRM roles, but also
# project_task for Project Management roles -- see REMINDER_ENTITY_TYPES), so
# they get their own, broader permission instead of the CRM-only one above.
require_reminder_access = require_roles([
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.MARKETING,
    UserRole.PLACEMENT,
    UserRole.PROJECT_COORDINATOR,
    UserRole.DEVELOPER,
])

# Pipeline/stage configuration is an admin/manager-only capability
require_pipeline_management = require_roles([UserRole.ADMIN, UserRole.MANAGER])

# GDPR anonymization is admin-only - more sensitive than general pipeline management
require_admin_only = require_roles([UserRole.ADMIN])


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
    results = await CRMService.search(db, q, current_user)
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
    "/companies/stats",
    response_model=CRMCompanyStatsResponse,
    summary="Get company counts by status/industry and open pipeline value, for the companies list page",
)
async def get_company_stats_endpoint(
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMCompanyStatsResponse:
    return await CRMService.get_company_stats(db)


@router.patch(
    "/companies/bulk",
    response_model=list[CRMCompanyResponse],
    summary="Bulk reassign owner and/or change status on multiple companies",
)
async def bulk_update_companies_endpoint(
    payload: CRMBulkCompanyUpdateRequest,
    current_user: User = Depends(require_pipeline_management),
    db: AsyncSession = Depends(get_db),
) -> list[CRMCompanyResponse]:
    companies = await CRMService.bulk_update_companies(db, payload.public_ids, payload.owner_id, payload.status)
    return [CRMCompanyResponse.model_validate(c) for c in companies]


@router.post(
    "/companies/bulk-delete",
    summary="Bulk delete multiple companies",
)
async def bulk_delete_companies_endpoint(
    payload: CRMBulkCompanyDeleteRequest,
    current_user: User = Depends(require_pipeline_management),
    db: AsyncSession = Depends(get_db),
) -> dict:
    deleted_count = await CRMService.bulk_delete_companies(db, payload.public_ids)
    return {"deleted_count": deleted_count}


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
    status: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    owner_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[CRMCompanyResponse]:
    items, total = await CRMService.list_companies(
        db, page, page_size, search,
        status=status, industry=industry, size=size, owner_id=owner_id,
    )
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
    response_model=CRMLeadCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a lead",
)
async def create_lead_endpoint(
    payload: CRMLeadCreate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMLeadCreateResponse:
    lead, duplicate_warning = await CRMService.create_lead(db, payload, current_user)
    await CurrencyConversionService.attach_display_value(
        db, lead, value_field="estimated_value", currency_field="currency", user_currency=current_user.currency,
    )
    return CRMLeadCreateResponse(**CRMLeadResponse.model_validate(lead).model_dump(), duplicate_warning=duplicate_warning)


@router.get(
    "/leads/stats",
    response_model=CRMLeadStatsResponse,
    summary="Get lead counts by status and conversion rate, for the leads list page",
)
async def get_lead_stats_endpoint(
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMLeadStatsResponse:
    return await CRMService.get_lead_stats(db, current_user)


@router.get(
    "/leads/export",
    summary="Export the current filtered list of leads as CSV",
)
async def export_leads_endpoint(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    owner_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_crm_access),
    _: User = Depends(require_paid_plan()),
    db: AsyncSession = Depends(get_db),
):
    from fastapi.responses import StreamingResponse
    import io

    csv_text = await CRMService.export_leads_csv(
        db, current_user, status=status, priority=priority, source=source, owner_id=owner_id, search=search
    )
    return StreamingResponse(
        io.StringIO(csv_text),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads_export.csv"},
    )


@router.post(
    "/leads/import",
    response_model=CRMLeadImportResponse,
    summary="Bulk-import leads from a CSV file",
)
async def import_leads_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(require_crm_access),
    _: User = Depends(require_paid_plan()),
    db: AsyncSession = Depends(get_db),
) -> CRMLeadImportResponse:
    content = await file.read()
    validate_upload(file, content)
    result = await CRMService.import_leads_csv(db, current_user, content)
    return CRMLeadImportResponse(**result)


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
    leads = await CRMService.bulk_update_leads(db, payload.public_ids, payload.owner_id, payload.status, current_user)
    return [CRMLeadResponse.model_validate(l) for l in leads]


@router.post(
    "/leads/bulk-delete",
    summary="Bulk delete multiple leads",
)
async def bulk_delete_leads_endpoint(
    payload: CRMBulkLeadDeleteRequest,
    current_user: User = Depends(require_pipeline_management),
    db: AsyncSession = Depends(get_db),
) -> dict:
    deleted_count = await CRMService.bulk_delete_leads(db, payload.public_ids, current_user)
    return {"deleted_count": deleted_count}


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
    lead = await CRMService.get_lead(db, public_id, current_user)
    await CurrencyConversionService.attach_display_value(
        db, lead, value_field="estimated_value", currency_field="currency", user_currency=current_user.currency,
    )
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
    lead = await CRMService.update_lead(db, public_id, payload, current_user)
    await CurrencyConversionService.attach_display_value(
        db, lead, value_field="estimated_value", currency_field="currency", user_currency=current_user.currency,
    )
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
    await CRMService.delete_lead(db, public_id, current_user)


@router.get(
    "/leads/{public_id}/history",
    response_model=PaginatedResponse[AuditLogResponse],
    summary="Get a lead's field-level change history",
)
async def get_lead_history_endpoint(
    public_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AuditLogResponse]:
    items, total = await CRMService.get_lead_history(db, public_id, current_user, page, page_size)
    return PaginatedResponse[AuditLogResponse](
        items=[AuditLogResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/leads/{public_id}/anonymize",
    response_model=CRMLeadResponse,
    summary="GDPR: anonymize a lead's PII (admin only, irreversible)",
)
async def anonymize_lead_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_admin_only),
    db: AsyncSession = Depends(get_db),
) -> CRMLeadResponse:
    lead = await CRMService.anonymize_lead(db, public_id, current_user)
    return CRMLeadResponse.model_validate(lead)


@router.get(
    "/leads",
    response_model=PaginatedResponse[CRMLeadResponse],
    summary="List leads",
)
async def list_leads_endpoint(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    owner_id: Optional[int] = Query(None),
    stale: Optional[bool] = Query(None, description="If true, only return stale leads with no recent activity"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[CRMLeadResponse]:
    items, total = await CRMService.list_leads(
        db, status, owner_id, page, page_size, search,
        priority=priority, source=source, stale=stale, current_user=current_user,
    )
    await CurrencyConversionService.attach_display_values(
        db, items, value_field="estimated_value", currency_field="currency", user_currency=current_user.currency,
    )
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
    deal = await CRMService.convert_lead(db, public_id, payload, current_user)
    await CurrencyConversionService.attach_display_value(
        db, deal, value_field="value", currency_field="currency", user_currency=current_user.currency,
    )
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
    await CurrencyConversionService.attach_display_value(
        db, deal, value_field="value", currency_field="currency", user_currency=current_user.currency,
    )
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
    await CurrencyConversionService.attach_display_value(
        db, deal, value_field="value", currency_field="currency", user_currency=current_user.currency,
    )
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
    deal = await CRMService.update_deal(db, public_id, payload, current_user.id)
    await CurrencyConversionService.attach_display_value(
        db, deal, value_field="value", currency_field="currency", user_currency=current_user.currency,
    )
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
    await CRMService.delete_deal(db, public_id, current_user.id)


@router.get(
    "/deals/{public_id}/history",
    response_model=PaginatedResponse[AuditLogResponse],
    summary="Get a deal's field-level change history",
)
async def get_deal_history_endpoint(
    public_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AuditLogResponse]:
    items, total = await CRMService.get_deal_history(db, public_id, page, page_size)
    return PaginatedResponse[AuditLogResponse](
        items=[AuditLogResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


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
    page_size: int = Query(20, ge=1, le=500),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[CRMDealResponse]:
    items, total = await CRMService.list_deals(
        db, pipeline_id, stage_id, status, owner_id, page, page_size, search,
        company_id=company_id, contact_id=contact_id,
    )
    await CurrencyConversionService.attach_display_values(
        db, items, value_field="value", currency_field="currency", user_currency=current_user.currency,
    )
    return PaginatedResponse[CRMDealResponse](
        items=[CRMDealResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/deals/{public_id}/project-conversion-preview",
    response_model=DealProjectConversionPreview,
    summary="Preview what converting this deal to a project would set the budget/currency to",
    description=(
        "Converts the deal's own value into the current user's preferred currency (falling "
        "back to the org default) using the exchange rate on the day the deal's value was "
        "last set, so the UI can show the converted amount before the user commits to it."
    ),
)
async def preview_deal_conversion_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> DealProjectConversionPreview:
    return await ProjectService.preview_deal_conversion(db, public_id, current_user)


@router.post(
    "/deals/{public_id}/convert-to-project",
    response_model=ProjectResponse,
    summary="Convert a Won deal into a project",
    description=(
        "Creates a Project Management project from this deal (name/owner/budget/"
        "currency default from the deal if not provided in the payload). The deal "
        "must be Won and not already converted."
    ),
)
async def convert_deal_to_project_endpoint(
    public_id: uuid.UUID,
    payload: DealConvertToProjectRequest,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = await ProjectService.convert_deal_to_project(db, public_id, payload, current_user)
    return ProjectResponse.model_validate(project)


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


# --- File Management ---
@router.post(
    "/files/upload",
    response_model=CRMFileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a file and attach it to a CRM entity",
)
async def upload_file_endpoint(
    entity_type: str = Form(...),
    entity_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMFileResponse:
    import os
    import uuid
    
    # Create parent directory with tenant and user isolation
    org_id = current_user.organization_id
    user_id = current_user.id
    
    # Base upload dir
    upload_dir = os.path.join("uploads", f"org_{org_id}", f"user_{user_id}")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate a unique local filename to avoid collisions
    file_uuid = uuid.uuid4()
    safe_filename = f"{file_uuid}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)
    
    # Read and validate file contents (size/MIME) before ever touching disk
    content = await file.read()
    mime_type = validate_upload(file, content)

    with open(file_path, "wb") as f:
        f.write(content)

    file_size = len(content)

    # Register file record in the database
    try:
        crm_file = await CRMService.create_file(
            db,
            file_name=file.filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            entity_type=entity_type,
            entity_id=entity_id,
            owner_id=current_user.id,
        )
        return CRMFileResponse.model_validate(crm_file)
    except Exception as e:
        # Clean up file on disk if db write fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise e


@router.get(
    "/files",
    response_model=PaginatedResponse[CRMFileResponse],
    summary="List files attached to a CRM entity",
)
async def list_files_endpoint(
    entity_type: str = Query(...),
    entity_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[CRMFileResponse]:
    items, total = await CRMService.list_files(
        db, entity_type=entity_type, entity_id=entity_id, page=page, page_size=page_size
    )
    return PaginatedResponse[CRMFileResponse](
        items=[CRMFileResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/files/{public_id}/download",
    summary="Download a file attachment",
)
async def download_file_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
):
    crm_file = await CRMService.get_file(db, public_id)
    
    import os
    if not os.path.exists(crm_file.file_path):
        from app.middleware.exceptions import NotFoundError
        raise NotFoundError("Physical file not found on server storage")
        
    return FileResponse(
        path=crm_file.file_path,
        filename=crm_file.file_name,
        media_type=crm_file.mime_type,
    )


@router.delete(
    "/files/{public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a file attachment",
)
async def delete_file_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
):
    await CRMService.delete_file(db, public_id)


# --- Deal Tasks ---
@router.get(
    "/deals/{public_id}/tasks",
    response_model=list[CRMDealTaskResponse],
    summary="List tasks for a deal",
)
async def list_deal_tasks_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> list[CRMDealTaskResponse]:
    tasks = await CRMService.list_deal_tasks(db, public_id)
    return [CRMDealTaskResponse.model_validate(t) for t in tasks]


@router.post(
    "/deals/{public_id}/tasks",
    response_model=CRMDealTaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a task for a deal",
)
async def create_deal_task_endpoint(
    public_id: uuid.UUID,
    payload: CRMDealTaskCreate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMDealTaskResponse:
    task = await CRMService.create_deal_task(db, public_id, payload, current_user.id)
    return CRMDealTaskResponse.model_validate(task)


@router.patch(
    "/deal-tasks/{task_public_id}",
    response_model=CRMDealTaskResponse,
    summary="Update a deal task",
)
async def update_deal_task_endpoint(
    task_public_id: uuid.UUID,
    payload: CRMDealTaskUpdate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMDealTaskResponse:
    task = await CRMService.update_deal_task(db, task_public_id, payload, current_user.id)
    return CRMDealTaskResponse.model_validate(task)


@router.delete(
    "/deal-tasks/{task_public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a deal task",
)
async def delete_deal_task_endpoint(
    task_public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
):
    await CRMService.delete_deal_task(db, task_public_id)


# --- Lead Tasks ---
@router.get(
    "/leads/{public_id}/tasks",
    response_model=list[CRMLeadTaskResponse],
    summary="List tasks for a lead",
)
async def list_lead_tasks_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> list[CRMLeadTaskResponse]:
    tasks = await CRMService.list_lead_tasks(db, public_id)
    return [CRMLeadTaskResponse.model_validate(t) for t in tasks]


@router.post(
    "/leads/{public_id}/tasks",
    response_model=CRMLeadTaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a task for a lead",
)
async def create_lead_task_endpoint(
    public_id: uuid.UUID,
    payload: CRMLeadTaskCreate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMLeadTaskResponse:
    task = await CRMService.create_lead_task(db, public_id, payload, current_user.id)
    return CRMLeadTaskResponse.model_validate(task)


@router.patch(
    "/lead-tasks/{task_public_id}",
    response_model=CRMLeadTaskResponse,
    summary="Update a lead task",
)
async def update_lead_task_endpoint(
    task_public_id: uuid.UUID,
    payload: CRMLeadTaskUpdate,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
) -> CRMLeadTaskResponse:
    task = await CRMService.update_lead_task(db, task_public_id, payload, current_user.id)
    return CRMLeadTaskResponse.model_validate(task)


@router.delete(
    "/lead-tasks/{task_public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a lead task",
)
async def delete_lead_task_endpoint(
    task_public_id: uuid.UUID,
    current_user: User = Depends(require_crm_access),
    db: AsyncSession = Depends(get_db),
):
    await CRMService.delete_lead_task(db, task_public_id)


# --- Reminders ---
@router.post(
    "/reminders",
    response_model=CRMReminderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Set a reminder for a lead, deal, deal task, or activity",
)
async def create_reminder_endpoint(
    payload: CRMReminderCreate,
    current_user: User = Depends(require_reminder_access),
    db: AsyncSession = Depends(get_db),
) -> CRMReminderResponse:
    reminder = await ReminderService.create_reminder(db, payload, current_user.id)
    return CRMReminderResponse.model_validate(reminder)


@router.get(
    "/reminders",
    response_model=list[CRMReminderResponse],
    summary="List reminders set for a specific record",
)
async def list_reminders_endpoint(
    entity_type: str = Query(...),
    entity_id: int = Query(...),
    current_user: User = Depends(require_reminder_access),
    db: AsyncSession = Depends(get_db),
) -> list[CRMReminderResponse]:
    reminders = await ReminderService.list_reminders_for_entity(db, entity_type=entity_type, entity_id=entity_id)
    return [CRMReminderResponse.model_validate(r) for r in reminders]


@router.get(
    "/reminders/for-entities",
    response_model=list[CRMReminderResponse],
    summary="List active reminders across a batch of records (powers list-view badges)",
)
async def list_reminders_for_entities_endpoint(
    entity_type: str = Query(...),
    entity_ids: str = Query(..., description="Comma-separated entity ids"),
    current_user: User = Depends(require_reminder_access),
    db: AsyncSession = Depends(get_db),
) -> list[CRMReminderResponse]:
    ids = [int(x) for x in entity_ids.split(",") if x.strip()]
    reminders = await ReminderService.list_active_reminders_for_entities(db, entity_type=entity_type, entity_ids=ids)
    return [CRMReminderResponse.model_validate(r) for r in reminders]


@router.get(
    "/reminders/mine",
    response_model=list[CRMReminderResponse],
    summary="List the current user's upcoming reminders",
)
async def list_my_reminders_endpoint(
    current_user: User = Depends(require_reminder_access),
    db: AsyncSession = Depends(get_db),
) -> list[CRMReminderResponse]:
    reminders = await ReminderService.list_my_reminders(db, user_id=current_user.id)
    return [CRMReminderResponse.model_validate(r) for r in reminders]


@router.patch(
    "/reminders/{public_id}",
    response_model=CRMReminderResponse,
    summary="Reschedule or edit a reminder",
)
async def update_reminder_endpoint(
    public_id: uuid.UUID,
    payload: CRMReminderUpdate,
    current_user: User = Depends(require_reminder_access),
    db: AsyncSession = Depends(get_db),
) -> CRMReminderResponse:
    reminder = await ReminderService.update_reminder(db, public_id, payload, current_user.id)
    return CRMReminderResponse.model_validate(reminder)


@router.delete(
    "/reminders/{public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel a reminder",
)
async def cancel_reminder_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_reminder_access),
    db: AsyncSession = Depends(get_db),
):
    await ReminderService.cancel_reminder(db, public_id, current_user.id)
