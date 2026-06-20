"""Password strength validation utilities"""

import re
from app.middleware.exceptions import BadRequestError


def validate_password_strength(password: str) -> None:
    """Validate that a password meets Gravit's minimum security requirements.

    Rules:
    - At least 8 characters
    - At least one uppercase letter  (A-Z)
    - At least one lowercase letter  (a-z)
    - At least one digit             (0-9)
    - At least one special character (!@#$%^&*...)

    Raises:
        BadRequestError: With a descriptive message listing all unmet requirements.
    """
    errors: list[str] = []

    if len(password) < 8:
        errors.append("at least 8 characters")

    if not re.search(r"[A-Z]", password):
        errors.append("at least one uppercase letter (A-Z)")

    if not re.search(r"[a-z]", password):
        errors.append("at least one lowercase letter (a-z)")

    if not re.search(r"\d", password):
        errors.append("at least one digit (0-9)")

    if not re.search(r"[!@#$%^&*()\-_=+\[\]{};:'\",.<>?/\\|`~]", password):
        errors.append("at least one special character (!@#$%^&* etc.)")

    if errors:
        raise BadRequestError(
            f"Password does not meet requirements: {'; '.join(errors)}."
        )
