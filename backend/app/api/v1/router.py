"""API v1 main router"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    ai,
    ai_settings,
    ai_chat,
)

# Create main v1 router
router = APIRouter()

# Include retained routers
router.include_router(auth.router)
router.include_router(users.router)

# AI Engine Routers
router.include_router(ai.router, prefix="/ai", tags=["AI Engine"])
router.include_router(ai_settings.router, prefix="/ai/settings", tags=["AI Engine Settings"])
router.include_router(ai_chat.router, prefix="/ai/chat", tags=["AI Engine Chat"])
