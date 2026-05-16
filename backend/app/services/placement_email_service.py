import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.placement_mapping import PlacementMapping
from app.models.candidate import Candidate
from app.models.job_role import JobRole
from app.models.contact import Contact
from app.models.candidate_document import CandidateDocument
from app.services.user_email_configuration_service import UserEmailConfigurationService
from app.services.file_storage_service import FileStorageService

logger = logging.getLogger(__name__)

class PlacementEmailService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.email_config_service = UserEmailConfigurationService(db)

    async def send_candidate_to_company(
        self, 
        mapping_id: int, 
        user_id: int,
        custom_email: Optional[str] = None,
        custom_subject: Optional[str] = None,
        custom_message: Optional[str] = None,
        custom_cc: Optional[str] = None
    ) -> bool:
        """Send a single candidate profile email"""
        return await self.send_bulk_candidates_to_company(
            mapping_ids=[mapping_id],
            user_id=user_id,
            custom_email=custom_email,
            custom_subject=custom_subject,
            custom_message=custom_message,
            custom_cc=custom_cc
        )

    async def send_bulk_candidates_to_company(
        self,
        mapping_ids: List[int],
        user_id: int,
        custom_email: Optional[str] = None,
        custom_subject: Optional[str] = None,
        custom_message: Optional[str] = None,
        document_ids: Optional[List[int]] = None,
        custom_cc: Optional[str] = None
    ) -> bool:
        """
        Send multiple candidate profiles and selected documents to the company contact.
        """
        if not mapping_ids:
            raise HTTPException(status_code=400, detail="No candidates selected")

        # 1. Fetch First Mapping to get Job Role and Contact Info
        query = select(PlacementMapping).where(PlacementMapping.id == mapping_ids[0])
        result = await self.db.execute(query)
        first_mapping = result.scalar_one_or_none()
        
        if not first_mapping:
            raise HTTPException(status_code=404, detail="Placement mapping not found")

        job_role = await self.db.get(JobRole, first_mapping.job_role_id)
        if not job_role:
             raise HTTPException(status_code=404, detail="Job role not found")

        contact = await self.db.get(Contact, job_role.contact_id)
        
        if not contact or not (custom_email or contact.email):
            raise HTTPException(status_code=400, detail="Company contact email not available")

        # 2. Get User Email Configuration
        email_config = await self.email_config_service.get_config(user_id)
        if not email_config or not email_config.is_active:
            raise HTTPException(
                status_code=400, 
                detail="User email service not configured or inactive. Please setup in Settings."
            )

        # 3. Create Multipart Message
        recipient_email = custom_email or contact.email
        recipient_name = contact.full_name
        
        msg = MIMEMultipart()
        msg['From'] = f"{email_config.sender_name} <{email_config.sender_email}>"
        msg['To'] = recipient_email
        if custom_cc:
            msg['Cc'] = custom_cc

        # 4. Collect Candidate Details and Attachments
        candidates_info = []
        is_bulk = len(mapping_ids) > 1
        
        for mid in mapping_ids:
            m_query = select(PlacementMapping).where(PlacementMapping.id == mid)
            m_res = await self.db.execute(m_query)
            m = m_res.scalar_one_or_none()
            if not m: continue
            
            c = await self.db.get(Candidate, m.candidate_id)
            if not c: continue
            
            candidates_info.append(c)
            
            # Identify which documents to attach
            docs_to_attach = []
            if document_ids:
                # Use specified document IDs for this candidate
                d_query = select(CandidateDocument).where(
                    CandidateDocument.candidate_id == c.id,
                    CandidateDocument.id.in_(document_ids)
                )
                d_res = await self.db.execute(d_query)
                docs_to_attach = d_res.scalars().all()
            else:
                # Default: latest resume only
                resume_query = select(CandidateDocument).where(
                    CandidateDocument.candidate_id == c.id,
                    CandidateDocument.document_type == 'resume'
                ).order_by(CandidateDocument.created_at.desc())
                resume_result = await self.db.execute(resume_query)
                resume = resume_result.scalars().first()
                if resume:
                    docs_to_attach = [resume]

            # Attach each document
            for doc in docs_to_attach:
                full_path = FileStorageService.get_file_path(doc.file_path)
                if full_path and os.path.exists(full_path):
                    try:
                        with open(full_path, "rb") as f:
                            part = MIMEApplication(f.read(), Name=doc.document_name)
                        part['Content-Disposition'] = f'attachment; filename="{doc.document_name}"'
                        msg.attach(part)
                    except Exception as e:
                        logger.error(f"Failed to attach document {doc.document_name} for {c.name}: {str(e)}")

        if not candidates_info:
            raise HTTPException(status_code=404, detail="No valid candidates found for the selected IDs")

        # 5. Set Subject and Body
        if is_bulk:
            names = ", ".join([c.name for c in candidates_info[:2]])
            if len(candidates_info) > 2:
                names += f", and {len(candidates_info) - 2} others"
            subject = custom_subject or f"Candidate Profiles for {job_role.title} - {names}"
        else:
            subject = custom_subject or f"Profile for {job_role.title} - {candidates_info[0].name}"
        
        msg['Subject'] = subject

        if custom_message:
            message_body = custom_message
        else:
            if is_bulk:
                profiles_text = "\n".join([f"- {c.name} ({c.email})" for c in candidates_info])
                message_body = f"""
Dear {recipient_name},

I hope this email finds you well.

We are pleased to share the profiles of the following candidates for the {job_role.title} position at your organization:

{profiles_text}

Please find the attached documents for your review. We look forward to your feedback and scheduling the next steps.

Best regards,
{email_config.sender_name or 'WinVinaya Placement Team'}
                """
            else:
                c = candidates_info[0]
                message_body = f"""
Dear {recipient_name},

I hope this email finds you well.

We are pleased to share the profile of {c.name} for the {job_role.title} position at your organization. 

Candidate Summary:
- Name: {c.name}
- Email: {c.email}
- Phone: {c.phone}

Please find the attached documents for your review. We look forward to your feedback and scheduling the next steps.

Best regards,
{email_config.sender_name or 'WinVinaya Placement Team'}
                """

        msg.attach(MIMEText(message_body, 'plain'))

        # 6. Send via SMTP
        return await self._send_smtp_message(email_config, msg)

    async def _send_smtp_message(self, email_config: Any, msg: MIMEMultipart) -> bool:
        """Private helper for SMTP transmission"""
        try:
            if email_config.encryption == "ssl":
                smtp_client = smtplib.SMTP_SSL(email_config.smtp_server, email_config.smtp_port, timeout=30)
            else:
                smtp_client = smtplib.SMTP(email_config.smtp_server, email_config.smtp_port, timeout=30)
                smtp_client.ehlo()
                if email_config.encryption == "tls":
                    smtp_client.starttls()
                    smtp_client.ehlo()
            
            smtp_client.login(email_config.smtp_username, email_config.smtp_password)
            smtp_client.send_message(msg)
            smtp_client.quit()
            return True
        except Exception as e:
            logger.error(f"Failed to send placement email: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Email sending failed: {str(e)}")
