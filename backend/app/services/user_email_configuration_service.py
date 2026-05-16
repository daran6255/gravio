import logging
import smtplib
from email.mime.text import MIMEText
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_email_configuration_repository import UserEmailConfigurationRepository
from app.models.user_email_configuration import UserEmailConfiguration
from app.schemas.user_email_configuration import UserEmailConfigurationCreate, UserEmailConfigurationUpdate

logger = logging.getLogger(__name__)

class UserEmailConfigurationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserEmailConfigurationRepository(db)

    async def get_config(self, user_id: int) -> Optional[UserEmailConfiguration]:
        """Get current user's email configuration"""
        return await self.repo.get_by_user_id(user_id)

    async def create_or_update_config(
        self, user_id: int, config_in: UserEmailConfigurationCreate
    ) -> UserEmailConfiguration:
        """Create or update user's email configuration"""
        existing = await self.repo.get_by_user_id(user_id)
        config_data = config_in.model_dump()
        config_data["user_id"] = user_id

        if existing:
            return await self.repo.update(existing.id, config_data)
        else:
            return await self.repo.create(config_data)

    async def delete_config(self, user_id: int) -> bool:
        """Remove user's email configuration"""
        existing = await self.repo.get_by_user_id(user_id)
        if existing:
            return await self.repo.delete(existing.id)
        return False

    async def test_connection(self, config: UserEmailConfigurationCreate) -> tuple[bool, str]:
        """
        Test SMTP connection with provided settings.
        Returns (success, message)
        """
        smtp_client = None
        try:
            # Use 30s timeout for better reliability on slower servers
            timeout = 30
            
            if config.encryption == "ssl":
                logger.debug(f"Connecting to {config.smtp_server}:{config.smtp_port} via SSL")
                smtp_client = smtplib.SMTP_SSL(config.smtp_server, config.smtp_port, timeout=timeout)
            else:
                logger.debug(f"Connecting to {config.smtp_server}:{config.smtp_port}")
                smtp_client = smtplib.SMTP(config.smtp_server, config.smtp_port, timeout=timeout)
                
                # Explicit EHLO before upgrading to TLS
                smtp_client.ehlo()
                
                if config.encryption == "tls":
                    logger.debug("Upgrading connection to TLS")
                    smtp_client.starttls()
                    # Re-identify after TLS upgrade
                    smtp_client.ehlo()
            
            logger.debug(f"Attempting login for {config.smtp_username}")
            smtp_client.login(config.smtp_username, config.smtp_password)
            
            return True, "Connection successful!"
            
        except smtplib.SMTPAuthenticationError:
            return False, "Authentication failed. Please check your username and password."
        except smtplib.SMTPConnectError:
            return False, f"Failed to connect to {config.smtp_server}:{config.smtp_port}. Please check the server address and port."
        except Exception as e:
            logger.error(f"SMTP Connection test failed: {str(e)}")
            return False, f"Connection failed: {str(e)}"
        finally:
            if smtp_client:
                try:
                    smtp_client.quit()
                except:
                    pass
