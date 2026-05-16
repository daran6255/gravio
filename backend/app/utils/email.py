"""Email Utility for sending professional HTML emails"""

import logging
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import List, Optional, Any, Tuple
import aiosmtplib
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Jinja2 Environment
# Path is relative to the backend directory where the app runs
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
jinja_env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(['html', 'xml'])
)

async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    cc: Optional[List[str]] = None,
    attachments: Optional[List[Tuple[str, bytes]]] = None
) -> bool:
    """Generic function to send HTML emails via SMTP"""
    
    # Configuration with fallbacks
    smtp_host = settings.SMTP_HOST or "s.mail25.info"
    smtp_port = settings.SMTP_PORT or 587
    smtp_user = settings.SMTP_USER or "no-reply@winvinaya.com"
    smtp_password = settings.SMTP_PASSWORD or "Admin##2025@"
    from_email = settings.EMAILS_FROM_EMAIL or "no-reply@winvinaya.com"
    from_name = settings.EMAILS_FROM_NAME or "winvinaya"
    smtp_tls = settings.SMTP_TLS if settings.SMTP_TLS is not None else True

    message = MIMEMultipart("mixed")
    
    # Create the alternative part for HTML/Text
    alt_part = MIMEMultipart("alternative")
    alt_part.attach(MIMEText(html_content, "html"))
    message.attach(alt_part)
    
    message["From"] = f"{from_name} <{from_email}>"
    message["To"] = to_email
    message["Subject"] = subject
    
    if cc:
        message["Cc"] = ", ".join(cc)

    # Attach files if provided
    if attachments:
        for filename, content in attachments:
            part = MIMEApplication(content)
            part.add_header("Content-Disposition", f"attachment; filename=\"{filename}\"")
            message.attach(part)

    # Determine TLS strategy
    use_tls_strategy = smtp_tls and smtp_port == 465
    start_tls_strategy = smtp_tls and smtp_port != 465

    try:
        # Debug log for credentials (masked)
        pass_hint = f"{smtp_password[:2]}...{smtp_password[-1]}" if len(smtp_password) > 2 else "***"
        logger.info(f"Attempting SMTP send: {smtp_host}:{smtp_port} as {smtp_user} (Pass: {pass_hint})")
        
        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_password,
            use_tls=use_tls_strategy,
            start_tls=start_tls_strategy,
        )
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except aiosmtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication failed for {smtp_user} at {smtp_host}: {str(e)}")
        return False
    except aiosmtplib.SMTPConnectError as e:
        logger.error(f"SMTP Connection failed to {smtp_host}:{smtp_port}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending email to {to_email}: {str(e)}", exc_info=True)
        return False


async def send_registration_emails(candidate: Any):
    """Sends both candidate and sourcing team registration confirmation emails"""
    
    # Skip for bulk Excel imports
    other = getattr(candidate, 'other', {}) or {}
    if other.get('registration_type') == 'Excel':
        logger.info(f"Skipping registration email for Excel import: {candidate.name}")
        return
        
    try:
        # 1. Send to Candidate
        candidate_subject = "Welcome to WinVinaya - Registration Successful"
        template = jinja_env.get_template("candidate_registration.html")
        candidate_html = template.render(name=candidate.name)
        await send_email(candidate.email, candidate_subject, candidate_html)
        
        # 2. Send to Sourcing Team
        sourcing_team_email = settings.SOURCING_EMAIL
        team_subject = f"New Candidate Registered: {candidate.name}"
        
        # Extract disability type safely
        disability_type = "N/A"
        if hasattr(candidate, 'disability_details') and candidate.disability_details:
            disability_type = candidate.disability_details.get('disability_type') or "N/A"
        elif isinstance(candidate, dict) and 'disability_details' in candidate:
            disability_type = candidate['disability_details'].get('disability_type') or "N/A"
            
        template = jinja_env.get_template("new_candidate_alert.html")
        team_html = template.render(candidate=candidate, disability_type=disability_type)
        await send_email(sourcing_team_email, team_subject, team_html)
        
    except Exception as e:
        logger.error(f"Error in send_registration_emails: {str(e)}")


async def send_export_email(
    to_email: str,
    user_name: str,
    report_name: str,
    file_content: bytes,
    filename: str
):
    """Sends a report export email with the generated file attached"""
    logger.info(f"Preparing to send export email for {report_name} to {to_email}")
    subject = f"Your Requested Report: {report_name}"
    
    try:
        # Try to use template if it exists, otherwise use fallback
        try:
            template = jinja_env.get_template("report_export.html")
            html_content = template.render(
                user_name=user_name,
                report_name=report_name,
                date=datetime.now().strftime("%d %b %Y"),
                year=datetime.now().year,
                support_email=settings.EMAILS_FROM_EMAIL or "support@winvinaya.com"
            )
        except Exception:
            # Fallback professional HTML
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #1a73e8; padding: 20px; text-align: center; color: white;">
                            <h2 style="margin: 0;">Report Ready for Download</h2>
                        </div>
                        <div style="padding: 30px;">
                            <p>Dear <strong>{user_name}</strong>,</p>
                            <p>The <strong>{report_name}</strong> you requested has been generated successfully.</p>
                            <p>Please find the attached Excel file containing the data. This report includes the records matching your applied filters as of {datetime.now().strftime("%I:%M %p")}.</p>
                            <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
                                If you did not request this report, please contact our support team at {settings.EMAILS_FROM_EMAIL or "support@winvinaya.com"}.
                            </p>
                        </div>
                        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 0.8em; color: #888; border-top: 1px solid #e0e0e0;">
                            &copy; {datetime.now().year} WinVinaya Foundation. All rights reserved.
                        </div>
                    </div>
                </body>
            </html>
            """
        
        attachments = [(filename, file_content)]
        
        await send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            attachments=attachments
        )
        logger.info(f"Export email sent successfully to {to_email} for {report_name}")
        return True
    except Exception as e:
        logger.error(f"Failed to send export email: {str(e)}")
        return False


async def send_dsr_submission_email(user_name: str, report_date: str, items: List[dict]):
    """Sends DSR submission notification to configured recipient"""
    try:
        recipient = settings.TIMESHEET_SUBMISSION_EMAIL
        subject = f"DSR Submitted: {user_name} - {report_date}"
        
        total_hours = sum(item.get('hours', 0) for item in items)
        
        template = jinja_env.get_template("dsr_submission_alert.html")
        html_content = template.render(
            user_name=user_name,
            report_date=report_date,
            items=items,
            total_hours=total_hours
        )
        await send_email(recipient, subject, html_content)
    except Exception as e:
        logger.error(f"Error in send_dsr_submission_email: {str(e)}")


async def send_consent_form_email(candidate_name: str, candidate_email: str, consent_url: str):
    """Sends consent form link to candidate"""
    try:
        subject = "Action Required: Candidate Consent Form - WinVinaya Foundation"
        template = jinja_env.get_template("candidate_consent.html")
        html_content = template.render(
            candidate_name=candidate_name,
            consent_url=consent_url,
            current_year=datetime.now().year
        )
        return await send_email(candidate_email, subject, html_content)
    except Exception as e:
        logger.error(f"Error in send_consent_form_email: {str(e)}")
        return False
