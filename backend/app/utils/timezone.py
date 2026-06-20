"""Timezone utilities for handling different user timezones"""

from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from app.core.context import timezone_context

def get_user_timezone() -> ZoneInfo:
    """Get the active user's timezone object from context"""
    tz_name = timezone_context.get()
    try:
        return ZoneInfo(tz_name)
    except Exception:
        return ZoneInfo("UTC")

def now_user_tz() -> datetime:
    """Get the current time in the user's timezone (timezone-aware)"""
    tz = get_user_timezone()
    return datetime.now(tz)

def to_user_tz(dt: datetime) -> datetime | None:
    """Convert a naive or aware datetime to the user's timezone"""
    if dt is None:
        return None
    
    tz = get_user_timezone()
    
    # If naive (no timezone info), assume it's UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
        
    return dt.astimezone(tz)

def to_utc(dt: datetime) -> datetime | None:
    """Convert a naive or aware datetime to UTC timezone-aware"""
    if dt is None:
        return None
        
    if dt.tzinfo is None:
        # If naive, assume it is in the user's current timezone
        tz = get_user_timezone()
        dt = dt.replace(tzinfo=tz)
        
    return dt.astimezone(timezone.utc)
