"""
AI Engine — CRM Tools
====================

Standardized tools for AI-driven CRM operations.
Includes: search_contacts, get_lead_details, create_lead, create_contact, create_company.
"""

from __future__ import annotations

import logging
from typing import Any, TYPE_CHECKING

from sqlalchemy import select, func
from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.api.deps import get_current_user
from app.models.lead import LeadSource, LeadStatus
from app.repositories.contact_repository import ContactRepository
from app.repositories.lead_repository import LeadRepository
from app.repositories.company_repository import CompanyRepository
from app.schemas.lead import LeadCreate
from app.schemas.contact import ContactCreate
from app.schemas.company import CompanyCreate

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User

logger = logging.getLogger(__name__)


# ── Search Contacts ───────────────────────────────────────────────────────────

class SearchContactsTool(BaseTool):
    """
    Finds existing contacts in the CRM.
    Used to check if a person (from WhatsApp/JD) is already known.
    """
    definition = ToolDefinition(
        name="search_contacts",
        description="Search for existing contacts by name, email, or phone number.",
        category="crm",
        is_read_only=True,
        parameters={
            "query": ToolParameterSchema(
                type="string",
                description="Search term (name, email, or phone)"
            )
        },
        required_parameters=["query"]
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        query = params["query"]
        repo = ContactRepository(db)
        contacts = await repo.get_contacts(search=query, limit=5)

        if not contacts:
            return ToolResult(
                success=True,
                message=f"No contacts found matching '{query}'.",
                data={"contacts": []}
            )

        data = [
            {
                "id": c.id,
                "full_name": c.full_name,
                "email": c.email,
                "mobile": c.mobile,
                "company": c.company.name if c.company else None
            }
            for c in contacts
        ]

        return ToolResult(
            success=True,
            message=f"Found {len(contacts)} contact(s).",
            data={"contacts": data}
        )


# ── Create Lead ───────────────────────────────────────────────────────────────

class CreateLeadTool(BaseTool):
    """
    Creates a new high-intent lead in the CRM.
    Used for WhatsApp enquiries or JD parsing results.
    """
    definition = ToolDefinition(
        name="create_lead",
        description="Create a new CRM lead record with contact and company details.",
        category="crm",
        requires_approval=True,  # Safety first for writes
        parameters={
            "title": ToolParameterSchema(type="string", description="Lead title (e.g., 'React Developer Enquiry')"),
            "contact_id": ToolParameterSchema(type="integer", description="ID of an existing contact (optional)"),
            "company_name": ToolParameterSchema(type="string", description="Name of the company/employer"),
            "contact_name": ToolParameterSchema(type="string", description="Full name of the person"),
            "email": ToolParameterSchema(type="string", description="Email address"),
            "phone": ToolParameterSchema(type="string", description="Phone number"),
            "source": ToolParameterSchema(
                type="string",
                description="Where this lead came from",
                enum=["whatsapp", "email", "website", "referral", "event"],
                default="whatsapp"
            ),
            "notes": ToolParameterSchema(type="string", description="Contextual notes about the lead")
        },
        required_parameters=["title", "company_name", "contact_name"]
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            # 1. Handle Company
            comp_repo = CompanyRepository(db)
            companies = await comp_repo.get_companies(search=params["company_name"], limit=1)
            company = companies[0] if companies else None

            if not company:
                company = await comp_repo.create_company(CompanyCreate(
                    name=params["company_name"],
                    company_status="active"
                ))

            # 2. Handle Contact
            contact_id = params.get("contact_id")
            cont_repo = ContactRepository(db)
            contact = None

            if contact_id:
                contact = await cont_repo.get(contact_id)

            if not contact:
                contact = await cont_repo.create_contact(ContactCreate(
                    full_name=params["contact_name"],
                    email=params.get("email"),
                    mobile=params.get("phone"),
                    company_id=company.id
                ))

            # 3. Create Lead
            lead_repo = LeadRepository(db)
            lead = await lead_repo.create_lead(LeadCreate(
                title=params["title"],
                company_id=company.id,
                contact_id=contact.id,
                lead_source=params.get("source", "whatsapp"),
                lead_status=LeadStatus.NEW.value,
                description=params.get("notes")
            ))

            return ToolResult(
                success=True,
                message=f"Lead '{lead.title}' created successfully for {contact.full_name} ({company.name}).",
                data={"lead_id": lead.id, "public_id": str(lead.public_id)},
                records_affected=3  # Lead, Contact, Company (potentially)
            )

        except Exception as e:
            logger.exception("Error in create_lead tool")
            return ToolResult(success=False, message=f"Failed to create lead: {str(e)}", error=str(e))


# ── CRM Metrics ───────────────────────────────────────────────────────────────

class GetDealStatsTool(BaseTool):
    """
    Retrieves global deal metrics using optimized SQL aggregation.
    """
    definition = ToolDefinition(
        name="get_deal_stats",
        description="Get current CRM deal statistics: total volume, stage-wise breakdown, and pipeline value.",
        category="crm",
        is_read_only=True,
        parameters={}
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            from app.models.deal import Deal
            # Aggregate by stage
            query = select(
                Deal.deal_stage,
                func.count(Deal.id).label("count"),
                func.sum(Deal.deal_value).label("total_value")
            ).group_by(Deal.deal_stage)
            
            result = await db.execute(query)
            stage_stats = []
            total_val = 0
            
            for row in result.all():
                stage_stats.append({
                    "stage": row[0],
                    "count": row[1],
                    "value": float(row[2]) if row[2] else 0
                })
                total_val += float(row[2]) if row[2] else 0

            msg = f"Retrieved pipeline stats with {len(stage_stats)} stages. Total value: INR {total_val:,.2f}."
            return ToolResult(
                success=True,
                message=msg,
                data={
                    "pipeline_stats": stage_stats,
                    "total_pipeline_value": total_val,
                    "REVEAL_DATA": f"PIPELINE_VALUE: {total_val}, STAGES: {len(stage_stats)}"
                }
            )
        except Exception as e:
            logger.exception("Error in get_deal_stats tool")
            return ToolResult(success=False, message=str(e), error=str(e))


class GetLeadStatsTool(BaseTool):
    """
    Retrieves lead status breakdown.
    """
    definition = ToolDefinition(
        name="get_lead_stats",
        description="Get lead conversion statistics: counts by status (new, qualified, lost).",
        category="crm",
        is_read_only=True,
        parameters={}
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            # Aggregate by status
            query = select(
                Lead.lead_status,
                func.count(Lead.id).label("count")
            ).group_by(Lead.lead_status)
            
            result = await db.execute(query)
            stats = {row[0]: row[1] for row in result.all()}
            
            msg = f"Lead breakdown: {stats.get('new', 0)} new, {stats.get('qualified', 0)} qualified."
            return ToolResult(
                success=True,
                message=msg,
                data={
                    "status_counts": stats,
                    "REVEAL_DATA": f"LEAD_COUNTS: {stats}"
                }
            )
        except Exception as e:
            logger.exception("Error in get_lead_stats tool")
            return ToolResult(success=False, message=str(e), error=str(e))


# ── Registration ─────────────────────────────────────────────────────────────

registry.register(SearchContactsTool())
registry.register(CreateLeadTool())
registry.register(GetDealStatsTool())
registry.register(GetLeadStatsTool())
