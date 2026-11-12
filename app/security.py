"""Hashing delle password e token di sessione (solo standard library)."""
from __future__ import annotations

import hashlib
import hmac
import secrets

PBKDF2_ITERATIONS = 210_000
_ALGO = "pbkdf2_sha256"


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"{_ALGO}${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str | None) -> bool:
    if not stored:
        return False
    try:
        algo, iterations, salt_hex, digest_hex = stored.split("$", 3)
        if algo != _ALGO:
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def new_token() -> str:
    return secrets.token_urlsafe(32)
