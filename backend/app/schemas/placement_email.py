from typing import Optional, List
from pydantic import BaseModel, EmailStr

class CandidateEmailSendRequest(BaseModel):
    """Schema for sending candidate profile email (handles single or bulk)"""
    mapping_ids: Optional[List[int]] = None # For bulk sending
    document_ids: Optional[List[int]] = None # Specific documents to attach
    custom_email: Optional[str] = None # Support multiple comma-separated emails
    custom_cc: Optional[str] = None # Added support for CC recipients
    custom_subject: Optional[str] = None
    custom_message: Optional[str] = None
