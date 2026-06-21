import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings
from app.utils.email import create_invite_token, decode_invite_token, _INVITE_SECRET, _INVITE_ALGORITHM


@pytest.mark.anyio
async def test_invite_token_expiration_respects_settings():
    # Store original setting
    original_expire_days = settings.INVITE_TOKEN_EXPIRE_DAYS
    
    try:
        # Test default expiration (e.g. 7 days)
        settings.INVITE_TOKEN_EXPIRE_DAYS = 7
        token_7 = create_invite_token(user_id=42)
        
        # Decode manually to check the raw exp field
        payload_7 = jwt.decode(token_7, _INVITE_SECRET, algorithms=[_INVITE_ALGORITHM])
        exp_7 = payload_7.get("exp")
        
        # Calculate expected exp
        now = datetime.now(timezone.utc)
        expected_exp_7 = now + timedelta(days=7)
        # Check that the expiration is approximately 7 days from now (within a 10-second window)
        assert abs(exp_7 - int(expected_exp_7.timestamp())) < 10
        
        # Verify decoding works
        decoded_id = decode_invite_token(token_7)
        assert decoded_id == 42
        
        # Change settings dynamically to 3 days and verify it respects the change
        settings.INVITE_TOKEN_EXPIRE_DAYS = 3
        token_3 = create_invite_token(user_id=100)
        
        payload_3 = jwt.decode(token_3, _INVITE_SECRET, algorithms=[_INVITE_ALGORITHM])
        exp_3 = payload_3.get("exp")
        expected_exp_3 = now + timedelta(days=3)
        assert abs(exp_3 - int(expected_exp_3.timestamp())) < 10
        
        decoded_id_3 = decode_invite_token(token_3)
        assert decoded_id_3 == 100
        
    finally:
        # Restore original settings
        settings.INVITE_TOKEN_EXPIRE_DAYS = original_expire_days


@pytest.mark.anyio
async def test_expired_invite_token_returns_none():
    # Force expiration by creating a payload with an expired timestamp
    # and encode it manually
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=1)
    payload = {
        "sub": "42",
        "type": "invite",
        "exp": expired_time,
    }
    expired_token = jwt.encode(payload, _INVITE_SECRET, algorithm=_INVITE_ALGORITHM)
    
    # Decode should return None
    assert decode_invite_token(expired_token) is None
