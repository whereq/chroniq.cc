"""Symmetric encryption for OAuth tokens stored in calendar_connections.

Uses Fernet (AES-128-CBC + HMAC) with a key from settings.token_encryption_key.
If no key is configured (dev), values pass through unchanged with a warning so
the app still works — never do this in production.
"""

import logging

from chroniq.config import get_settings

logger = logging.getLogger(__name__)

_warned = False


def _get_fernet():
    global _warned
    key = get_settings().token_encryption_key
    if not key:
        if not _warned:
            logger.warning("token_encryption_key not set — OAuth tokens stored UNENCRYPTED")
            _warned = True
        return None
    from cryptography.fernet import Fernet

    return Fernet(key.encode())


def encrypt(value: str | None) -> str | None:
    if value is None:
        return None
    f = _get_fernet()
    if f is None:
        return value
    return f.encrypt(value.encode()).decode()


def decrypt(value: str | None) -> str | None:
    if value is None:
        return None
    f = _get_fernet()
    if f is None:
        return value
    return f.decrypt(value.encode()).decode()
