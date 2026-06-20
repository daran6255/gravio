from contextvars import ContextVar

# Store the current tenant (organization_id) for the request lifecycle
tenant_context: ContextVar[int | None] = ContextVar("tenant_context", default=None)

# Store the superuser status for the request lifecycle to allow bypassing tenant checks
superuser_context: ContextVar[bool] = ContextVar("superuser_context", default=False)
