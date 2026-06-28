"""Shared upload validation used by every CRM file-upload entry point (lead/deal/company/contact)"""

from fastapi import UploadFile

from app.core.config import settings
from app.middleware.exceptions import BadRequestError, PayloadTooLargeError


def validate_upload(file: UploadFile, content: bytes) -> str:
    """Validate size and MIME type of an uploaded file. Returns the resolved mime type."""
    if len(content) > settings.MAX_UPLOAD_FILE_SIZE_BYTES:
        max_mb = settings.MAX_UPLOAD_FILE_SIZE_BYTES / (1024 * 1024)
        raise PayloadTooLargeError(f"File exceeds the maximum allowed size of {max_mb:.0f}MB")

    mime_type = file.content_type or "application/octet-stream"
    if mime_type not in settings.ALLOWED_UPLOAD_MIME_TYPES:
        allowed = ", ".join(settings.ALLOWED_UPLOAD_MIME_TYPES)
        raise BadRequestError(f"File type '{mime_type}' is not allowed. Allowed types: {allowed}")

    return mime_type
