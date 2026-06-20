"""Global error handling middleware"""

from typing import Callable
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
from loguru import logger
from app.core.exceptions import AppError


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware to handle errors globally"""
    
    async def dispatch(self, request: Request, call_next: Callable):
        """Handle all exceptions and return standardized error responses"""
        
        try:
            return await call_next(request)
            
        except AppError as e:
            logger.error(f"Application error [{e.error_code}]: {e.message}")
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "success": False,
                    "error": {
                        "code": e.error_code,
                        "message": e.message,
                        "detail": e.detail
                    }
                }
            )
            
        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Validation failed for request parameters",
                        "detail": e.errors()
                    }
                }
            )
            
        except SQLAlchemyError as e:
            logger.error(f"Database error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "success": False,
                    "error": {
                        "code": "DATABASE_ERROR",
                        "message": "A database error occurred. Please try again later.",
                        "detail": None
                    }
                }
            )
            
        except ValueError as e:
            logger.error(f"Value error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "error": {
                        "code": "BAD_REQUEST",
                        "message": str(e),
                        "detail": None
                    }
                }
            )
            
        except Exception as e:
            logger.exception(f"Unhandled exception: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "success": False,
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "An unexpected error occurred. Please try again later.",
                        "detail": None
                    }
                }
            )
