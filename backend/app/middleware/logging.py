"""Request/Response logging middleware"""

import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests and responses"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Log request and response details"""
        
        # Generate request ID
        request_id = request.headers.get("X-Request-ID", f"{int(time.time() * 1000)}")
        
        # Log request
        logger.bind(
            request_id=request_id,
            method=request.method,
            url=str(request.url),
            client_ip=request.client.host if request.client else None,
        ).info("Incoming request")
        
        # Process request and measure time
        start_time = time.time()
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Log response
            logger.bind(
                request_id=request_id,
                method=request.method,
                url=str(request.url),
                status_code=response.status_code,
                duration=f"{process_time:.3f}s",
            ).info("Request completed")
            
            # Add custom headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{process_time:.3f}"
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            
            # Log error
            logger.bind(
                request_id=request_id,
                method=request.method,
                url=str(request.url),
                duration=f"{process_time:.3f}s",
                error=str(e),
            ).error("Request failed")
            
            raise
