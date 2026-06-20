"""Security utilities - password hashing, JWT tokens, etc."""

import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Data to encode in the token
        expires_delta: Token expiration time
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access",
        # Unique per-token ID. Access tokens are never checked against the DB
        # (they're short-lived and meant to stay stateless) — the jti here is
        # purely for log correlation, not revocation.
        "jti": secrets.token_urlsafe(32),
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> Tuple[str, str, datetime]:
    """
    Create a JWT refresh token.

    Unlike access tokens, refresh tokens are long-lived and must be revocable
    (logout, theft detection), so the caller is expected to persist the
    returned jti server-side via RefreshTokenRepository.

    Args:
        data: Data to encode in the token
        expires_delta: Token expiration time

    Returns:
        (encoded_token, jti, expires_at) — jti and expires_at are for the
        caller to store; they're also embedded inside the encoded token.
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
        )

    # High-entropy, unguessable token ID (256 bits) — this is what gets
    # tracked in the DB for revocation/rotation, not the token string itself.
    jti = secrets.token_urlsafe(32)

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh",
        "jti": jti,
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt, jti, expire


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT token
    
    Args:
        token: JWT token to decode
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def verify_token_type(payload: Dict[str, Any], token_type: str) -> bool:
    """
    Verify that a token is of the expected type
    
    Args:
        payload: Decoded token payload
        token_type: Expected token type ('access' or 'refresh')
        
    Returns:
        True if token type matches, False otherwise
    """
    return payload.get("type") == token_type
