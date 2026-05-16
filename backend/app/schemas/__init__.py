from app.schemas.ticket import Ticket, TicketCreate, TicketUpdate, TicketMessage, TicketMessageCreate
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyRead, CompanyStats
from app.schemas.contact import ContactCreate, ContactUpdate, ContactRead
from app.schemas.lead import LeadCreate, LeadUpdate, LeadRead
from app.schemas.deal import DealCreate, DealUpdate, DealRead
from app.schemas.crm_task import CRMTaskCreate, CRMTaskUpdate, CRMTaskRead
from app.schemas.crm_activity_log import CRMActivityLogCreate, CRMActivityLogRead

__all__ = [
    "Ticket",
    "TicketCreate",
    "TicketUpdate",
    "TicketMessage",
    "TicketMessageCreate",
    "CompanyCreate",
    "CompanyUpdate",
    "CompanyRead",
    "CompanyStats",
    "ContactCreate",
    "ContactUpdate",
    "ContactRead",
    "LeadCreate",
    "LeadUpdate",
    "LeadRead",
    "DealCreate",
    "DealUpdate",
    "DealRead",
    "CRMTaskCreate",
    "CRMTaskUpdate",
    "CRMTaskRead",
    "CRMActivityLogCreate",
    "CRMActivityLogRead",
]
