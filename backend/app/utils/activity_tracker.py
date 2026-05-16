"""Activity tracking utilities for logging API operations"""

import uuid
from typing import Optional, Any, Dict
from datetime import datetime, date, time
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.activity_log import ActionType
from app.services.activity_log_service import ActivityLogService


def get_client_ip(request: Request) -> Optional[str]:
    """Extract client IP address from request"""
    # Check for X-Forwarded-For header (if behind proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    # Check for X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fall back to client host
    if request.client:
        return request.client.host
    
    return None


def get_user_agent(request: Request) -> Optional[str]:
    """Extract user agent from request"""
    return request.headers.get("User-Agent")


def get_changes(before: Any, after: Any) -> Optional[Dict[str, Any]]:
    """
    Compute changes between before and after objects
    
    Args:
        before: Object before changes (can be dict or Pydantic model)
        after: Object after changes (can be dict or Pydantic model)
        
    Returns:
        Dictionary with 'before' and 'after' keys containing changed fields only
    """
    if before is None and after is None:
        return None
    
    # Convert to dict if needed
    if hasattr(before, 'dict'):
        before_dict = before.dict()
    elif hasattr(before, '__dict__'):
        before_dict = {k: v for k, v in before.__dict__.items() if not k.startswith('_')}
    else:
        before_dict = before or {}
    
    if hasattr(after, 'dict'):
        after_dict = after.dict()
    elif hasattr(after, '__dict__'):
        after_dict = {k: v for k, v in after.__dict__.items() if not k.startswith('_')}
    else:
        after_dict = after or {}
    
    # Filter out sensitive fields
    sensitive_fields = {'password', 'hashed_password', 'token', 'secret', 'api_key'}
    
    before_filtered = {}
    after_filtered = {}
    
    # Find changed fields
    all_keys = set(before_dict.keys()) | set(after_dict.keys())
    for key in all_keys:
        if key in sensitive_fields:
            continue
        
        before_val = before_dict.get(key)
        after_val = after_dict.get(key)
        
        # Only include if values are different
        if before_val != after_val:
            # Convert non-serializable types to strings
            if isinstance(before_val, (uuid.UUID, datetime, date, time)):
                before_val = before_val.isoformat() if hasattr(before_val, 'isoformat') else str(before_val)
            if isinstance(after_val, (uuid.UUID, datetime, date, time)):
                after_val = after_val.isoformat() if hasattr(after_val, 'isoformat') else str(after_val)
                
            before_filtered[key] = before_val
            after_filtered[key] = after_val
    
    if not before_filtered and not after_filtered:
        return None
    
    return {
        "before": before_filtered,
        "after": after_filtered
    }


def extract_safe_metadata(obj: Any) -> Optional[Dict[str, Any]]:
    """
    Extract safe metadata from an object, filtering sensitive fields
    
    Args:
        obj: Object to extract metadata from (can be dict or Pydantic model)
        
    Returns:
        Dictionary with safe fields only, or None if no safe fields exist
    """
    if obj is None:
        return None
    
    # Convert to dict if needed
    if hasattr(obj, 'dict'):
        obj_dict = obj.dict()
    elif hasattr(obj, '__dict__'):
        obj_dict = {k: v for k, v in obj.__dict__.items() if not k.startswith('_')}
    else:
        obj_dict = obj if isinstance(obj, dict) else {}
    
    # Filter out sensitive fields
    sensitive_fields = {'password', 'hashed_password', 'token', 'secret', 'api_key'}
    filtered = {}
    
    for k, v in obj_dict.items():
        if k in sensitive_fields:
            continue
        
        # Convert non-serializable types to strings for JSON serialization
        if isinstance(v, (datetime, date, time, uuid.UUID)):
            filtered[k] = v.isoformat() if hasattr(v, 'isoformat') else str(v)
        else:
            filtered[k] = v
    
    return filtered if filtered else None



async def log_create(
    db: AsyncSession,
    request: Request,
    user_id: Optional[int],
    resource_type: str,
    resource_id: int,
    created_object: Optional[Any] = None,
    status_code: int = 201
) -> None:
    """Log a CREATE action with complete object metadata"""
    activity_service = ActivityLogService(db)
    
    # Extract metadata from created object for complete audit trail
    metadata = None
    if created_object:
        metadata = extract_safe_metadata(created_object)
    
    await activity_service.log_activity(
        user_id=user_id,
        action_type=ActionType.CREATE,
        endpoint=str(request.url.path),
        method=request.method,
        resource_type=resource_type,
        resource_id=resource_id,
        changes=metadata,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        status_code=status_code,
    )


async def log_update(
    db: AsyncSession,
    request: Request,
    user_id: Optional[int],
    resource_type: str,
    resource_id: int,
    before: Any,
    after: Any,
    status_code: int = 200
) -> None:
    """Log an UPDATE action with before/after changes"""
    activity_service = ActivityLogService(db)
    changes = get_changes(before, after)
    
    await activity_service.log_activity(
        user_id=user_id,
        action_type=ActionType.UPDATE,
        endpoint=str(request.url.path),
        method=request.method,
        resource_type=resource_type,
        resource_id=resource_id,
        changes=changes,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        status_code=status_code,
    )


async def log_delete(
    db: AsyncSession,
    request: Request,
    user_id: Optional[int],
    resource_type: str,
    resource_id: int,
    status_code: int = 204
) -> None:
    """Log a DELETE action with a descriptive message"""
    activity_service = ActivityLogService(db)
    
    # Create a simple descriptive message
    metadata = {
        "message": f"{resource_type.capitalize()} deleted",
        "resource_id": resource_id
    }
    
    await activity_service.log_activity(
        user_id=user_id,
        action_type=ActionType.DELETE,
        endpoint=str(request.url.path),
        method=request.method,
        resource_type=resource_type,
        resource_id=resource_id,
        changes=metadata,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        status_code=status_code,
    )


async def log_read(
    db: AsyncSession,
    request: Request,
    user_id: Optional[int],
    resource_type: str,
    resource_id: Optional[int] = None,
    status_code: int = 200
) -> None:
    """Log a READ action (for sensitive data)"""
    activity_service = ActivityLogService(db)
    await activity_service.log_activity(
        user_id=user_id,
        action_type=ActionType.READ,
        endpoint=str(request.url.path),
        method=request.method,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        status_code=status_code,
    )


async def log_login(
    db: AsyncSession,
    request: Request,
    user_id: int,
    status_code: int = 200
) -> None:
    """Log a LOGIN action with descriptive message"""
    activity_service = ActivityLogService(db)
    
    # Create a simple descriptive message
    metadata = {
        "message": "User logged in successfully",
        "status": "success" if status_code == 200 else "failed"
    }
    
    await activity_service.log_activity(
        user_id=user_id,
        action_type=ActionType.LOGIN,
        endpoint=str(request.url.path),
        method=request.method,
        resource_type="auth",
        changes=metadata,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        status_code=status_code,
    )


async def log_logout(
    db: AsyncSession,
    request: Request,
    user_id: int,
    status_code: int = 200
) -> None:
    """Log a LOGOUT action with descriptive message"""
    activity_service = ActivityLogService(db)
    
    # Create a simple descriptive message
    metadata = {
        "message": "User logged out",
    }
    
    await activity_service.log_activity(
        user_id=user_id,
        action_type=ActionType.LOGOUT,
        endpoint=str(request.url.path),
        method=request.method,
        resource_type="auth",
        changes=metadata,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        status_code=status_code,
    )
