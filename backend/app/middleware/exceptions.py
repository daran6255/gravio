"""Centralized application exceptions - Industry Standard"""

import re
from typing import Any

class AppError(Exception):
    """Base application exception class that maps to an HTTP status code"""
    status_code: int = 500
    message: str = "An unexpected error occurred"
    error_code: str = "INTERNAL_SERVER_ERROR"

    def __init__(self, message: str | None = None, detail: Any = None, error_code: str | None = None):
        super().__init__(message or self.message)
        if message:
            self.message = message
        self.detail = detail
        
        # Determine error_code
        if error_code:
            self.error_code = error_code
        else:
            # Generate a clean code from class name (e.g. NotFoundError -> NOT_FOUND)
            class_name = self.__class__.__name__
            decamel_name = re.sub(r'(?<!^)(?=[A-Z])', '_', class_name).upper()
            if decamel_name.endswith("_ERROR"):
                decamel_name = decamel_name[:-6]
            self.error_code = decamel_name


# --- Client Errors (4xx) ---

class BadRequestError(AppError):
    """Bad request exception (HTTP 400)"""
    status_code: int = 400
    message: str = "Bad request"


class UnauthorizedError(AppError):
    """Authentication failed exception (HTTP 401)"""
    status_code: int = 401
    message: str = "Not authenticated"


class ForbiddenError(AppError):
    """Authorization failed exception (HTTP 403)"""
    status_code: int = 403
    message: str = "Permission denied"


class NotFoundError(AppError):
    """Resource not found exception (HTTP 404)"""
    status_code: int = 404
    message: str = "Resource not found"


class MethodNotAllowedError(AppError):
    """HTTP method not allowed exception (HTTP 405)"""
    status_code: int = 405
    message: str = "Method not allowed"


class ConflictError(AppError):
    """Resource conflict/duplicate exception (HTTP 409)"""
    status_code: int = 409
    message: str = "Resource conflict"


class GoneError(AppError):
    """Resource no longer available exception (HTTP 410)"""
    status_code: int = 410
    message: str = "Resource has been permanently deleted"


class ValidationError(AppError):
    """Pydantic validation/input error wrapper (HTTP 422)"""
    status_code: int = 422
    message: str = "Validation failed for request parameters"


class RateLimitError(AppError):
    """Too many requests exception (HTTP 429)"""
    status_code: int = 429
    message: str = "Rate limit exceeded. Please try again later."


# --- Server Errors (5xx) ---

class InternalServerError(AppError):
    """Internal server error exception (HTTP 500)"""
    status_code: int = 500
    message: str = "Internal server error"


class FeatureNotImplementedError(AppError):
    """Functionality not implemented exception (HTTP 501)"""
    status_code: int = 501
    message: str = "Requested functionality is not implemented"


class ServiceUnavailableError(AppError):
    """Service temporarily unavailable exception (HTTP 503)"""
    status_code: int = 503
    message: str = "Service is temporarily unavailable"
