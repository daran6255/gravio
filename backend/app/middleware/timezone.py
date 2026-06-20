"""Timezone middleware"""

from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.context import timezone_context

class TimezoneMiddleware(BaseHTTPMiddleware):
    """Middleware to extract user's timezone from headers and set it in contextvars"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract X-Timezone header, default to UTC
        tz = request.headers.get("X-Timezone", "UTC")
        
        token = timezone_context.set(tz)
        try:
            response = await call_next(request)
            response.headers["X-Timezone"] = tz
            return response
        finally:
            timezone_context.reset(token)
