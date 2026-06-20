"""API v1 main router — registers all endpoint sub-routers"""

from fastapi import APIRouter

from app.api.v1.endpoints.onboarding import router as onboarding_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.plans import router as plans_router

# Create main v1 router
router = APIRouter()

# Self-service onboarding  →  POST /api/v1/onboard
router.include_router(onboarding_router)

# Authentication           →  POST /api/v1/auth/login
#                             POST /api/v1/auth/refresh
#                             POST /api/v1/auth/logout
#                             GET  /api/v1/auth/verify-email
#                             GET  /api/v1/auth/me
router.include_router(auth_router)

# Admin operations         →  POST /api/v1/admin/organizations/{public_id}/extend-trial
router.include_router(admin_router)

# Pricing plans             →  GET  /api/v1/plans
router.include_router(plans_router)
