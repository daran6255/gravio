"""Symmetric encryption for secrets stored at rest (e.g. Google OAuth refresh tokens).

No separate encryption key is provisioned/rotated out-of-band — the Fernet key is
derived deterministically from settings.SECRET_KEY via HKDF, so there's exactly one
secret to manage in production (the same one JWTs already depend on).
"""

import base64
import hashlib
import hmac

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings

_HKDF_INFO = b"gravit-booking-token-encryption-v1"


def _derive_fernet_key() -> bytes:
    """HKDF-SHA256 (single-step, since SECRET_KEY is already high-entropy) derivation
    of a 32-byte key from SECRET_KEY, base64url-encoded as Fernet requires."""
    digest = hmac.new(settings.SECRET_KEY.encode("utf-8"), _HKDF_INFO, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest)


_fernet = Fernet(_derive_fernet_key())


def encrypt_secret(plaintext: str) -> str:
    """Encrypt a secret string (e.g. a Google refresh token) for storage."""
    return _fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_secret(ciphertext: str) -> str:
    """Decrypt a value produced by encrypt_secret.

    Raises ValueError if the ciphertext is invalid/tampered/encrypted under a
    different SECRET_KEY (e.g. after a key rotation) — callers must treat this
    the same as "connection broken" and fall back accordingly, never crash the
    booking flow.
    """
    try:
        return _fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("Unable to decrypt stored secret — it may be corrupt or SECRET_KEY changed") from exc
