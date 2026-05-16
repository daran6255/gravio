
import asyncio
import logging
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.system_setting import SystemSetting

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_SETTINGS = [
    {
        "key": "ai_provider",
        "value": "openai",
        "description": "AI Provider (openai, anthropic, gemini, groq)",
        "is_secret": False
    },
    {
        "key": "ai_api_key",
        "value": "",
        "description": "API Key for the AI provider",
        "is_secret": True
    },
    {
        "key": "ai_provider_url",
        "value": "https://api.openai.com/v1",
        "description": "Base URL for the AI provider API",
        "is_secret": False
    },
    {
        "key": "ai_enabled",
        "value": "false",
        "description": "Enable or disable the AI chatbot feature",
        "is_secret": False
    },
    {
        "key": "ai_model",
        "value": "gpt-3.5-turbo",
        "description": "AI Model to use",
        "is_secret": False
    }
]

async def seed_settings():
    logger.info("Starting system settings seeding...")
    
    async with AsyncSessionLocal() as db:
        for setting in DEFAULT_SETTINGS:
            try:
                # Check if setting exists
                stmt = select(SystemSetting).where(SystemSetting.key == setting["key"])
                result = await db.execute(stmt)
                existing = result.scalar_one_or_none()
                
                if not existing:
                    logger.info(f"Creating missing setting: {setting['key']}")
                    new_setting = SystemSetting(
                        key=setting["key"],
                        value=setting["value"],
                        description=setting["description"],
                        is_secret=setting["is_secret"]
                    )
                    db.add(new_setting)
                else:
                    logger.info(f"Setting already exists: {setting['key']}")
            except Exception as e:
                logger.error(f"Error processing setting {setting['key']}: {e}")
                
        try:
            await db.commit()
            logger.info("Seeding completed successfully.")
        except Exception as e:
            logger.error(f"Error committing changes: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(seed_settings())
