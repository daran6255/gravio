"""Activity tracking utilities for logging API operations (simplified to stdout loguru)"""

from typing import Optional, Any
from fastapi import Request
from loguru import logger


def get_client_ip(request: Request) -> Optional[str]:
    """Extract client IP address from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    if request.client:
        return request.client.host
    return None


def get_user_agent(request: Request) -> Optional[str]:
    """Extract user agent from request"""
    return request.headers.get("User-Agent")


async def log_create(
    db: Any,
    request: Request,
    user_id: Optional[int],
    resource_type: str,
    resource_id: int,
    created_object: Optional[Any] = None,
    status_code: int = 201
) -> None:
    """Log a CREATE action"""
    logger.info(
        f"CREATE | User: {user_id} | Resource: {resource_type}/{resource_id} | "
        f"IP: {get_client_ip(request)} | Status: {status_code}"
    )


async def log_update(
    db: Any,
    request: Request,
    user_id: Optional[int],
    resource_type: str,
    resource_id: int,
    before: Any,
    after: Any,
    status_code: int = 200
) -> None:
    """Log an UPDATE action"""
    logger.info(
        f"UPDATE | User: {user_id} | Resource: {resource_type}/{resource_id} | "
        f"IP: {get_client_ip(request)} | Status: {status_code}"
    )


async def log_delete(
    db: Any,
    request: Request,
    user_id: Optional[int],
    resource_type: str,
    resource_id: int,
    status_code: int = 204
) -> None:
    """Log a DELETE action"""
    logger.info(
        f"DELETE | User: {user_id} | Resource: {resource_type}/{resource_id} | "
        f"IP: {get_client_ip(request)} | Status: {status_code}"
    )


async def log_read(
    db: Any,
    request: Request,
    user_id: Optional[int],
    resource_type: str,
    resource_id: Optional[int] = None,
    status_code: int = 200
) -> None:
    """Log a READ action"""
    logger.info(
        f"READ | User: {user_id} | Resource: {resource_type}/{resource_id} | "
        f"IP: {get_client_ip(request)} | Status: {status_code}"
    )


async def log_login(
    db: Any,
    request: Request,
    user_id: int,
    status_code: int = 200
) -> None:
    """Log a LOGIN action"""
    logger.info(
        f"LOGIN | User: {user_id} | IP: {get_client_ip(request)} | Status: {status_code}"
    )


async def log_logout(
    db: Any,
    request: Request,
    user_id: int,
    status_code: int = 200
) -> None:
    """Log a LOGOUT action"""
    logger.info(
        f"LOGOUT | User: {user_id} | IP: {get_client_ip(request)} | Status: {status_code}"
    )
