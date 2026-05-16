"""Rate limiting configuration using slowapi with in-memory storage"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings


# Create rate limiter instance with in-memory storage
# No Redis dependency - suitable for development and single-instance deployments
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[
        f"{settings.RATE_LIMIT_PER_MINUTE}/minute",
        f"{settings.RATE_LIMIT_PER_HOUR}/hour"
    ],
    enabled=settings.RATE_LIMIT_ENABLED,
    storage_uri="memory://",  # In-memory storage - no Redis needed
)


# Custom rate limit decorators for different use cases
def rate_limit_low():
    """Low rate limit for expensive operations (10/min, 100/hour)"""
    return limiter.limit("10/minute;100/hour")


def rate_limit_medium():
    """Medium rate limit for normal operations (30/min, 500/hour)"""
    return limiter.limit("30/minute;500/hour")


def rate_limit_high():
    """High rate limit for cheap operations (60/min, 1000/hour)"""
    return limiter.limit("60/minute;1000/hour")


def rate_limit_auth():
    """Strict rate limit for authentication endpoints (5/min, 20/hour)"""
    return limiter.limit("5/minute;20/hour")
