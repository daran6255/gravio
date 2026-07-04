"""API v1 main router — registers all endpoint sub-routers"""

from fastapi import APIRouter

from app.api.v1.endpoints.onboarding import router as onboarding_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.plans import router as plans_router
from app.api.v1.endpoints.users import router as users_router

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

# Org Admin user management →  POST /api/v1/users/invite
#                             GET  /api/v1/users
#                             POST /api/v1/users/{public_id}/deactivate
#                             POST /api/v1/users/{public_id}/reactivate
router.include_router(users_router)

# Gravit CRM Management      →  /api/v1/crm/...
from app.api.v1.endpoints.crm import router as crm_router
router.include_router(crm_router)

# In-app notifications        →  /api/v1/notifications/...
from app.api.v1.endpoints.notifications import router as notifications_router
router.include_router(notifications_router)

# Project Management          →  /api/v1/projects/...
#                             /api/v1/project-tasks/...
#                             /api/v1/project-task-statuses
from app.api.v1.endpoints.projects import router as projects_router, router_tasks as project_tasks_router, router_statuses as project_task_statuses_router
router.include_router(projects_router)
router.include_router(project_tasks_router)
router.include_router(project_task_statuses_router)
