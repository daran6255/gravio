"""Global error handling middleware"""

from typing import Callable
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
from loguru import logger


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware to handle errors globally"""
    
    async def dispatch(self, request: Request, call_next: Callable):
        """Handle all exceptions and return standardized error responses"""
        
        try:
            return await call_next(request)
            
        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "error": "Validation Error",
                    "detail": e.errors(),
                    "message": "Invalid input data"
                }
            )
            
        except SQLAlchemyError as e:
            logger.error(f"Database error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "Database Error",
                    "message": "A database error occurred. Please try again later."
                }
            )
            
        except ValueError as e:
            logger.error(f"Value error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "error": "Bad Request",
                    "message": str(e)
                }
            )
            
        except Exception as e:
            logger.exception(f"Unhandled exception: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "Internal Server Error",
                    "message": "An unexpected error occurred. Please try again later."
                }
            )
