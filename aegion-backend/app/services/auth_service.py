import secrets
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.core.config import settings

ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)


def hash_password_argon2id(password: str) -> str:
    return ph.hash(password)


def verify_password_argon2id(password: str, stored_hash: str) -> bool:
    try:
        return ph.verify(stored_hash, password)
    except VerifyMismatchError:
        return False


def validate_strong_password(password: str) -> bool:
    if len(password) < 12:
        return False
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(not c.isalnum() for c in password)
    return has_upper and has_lower and has_digit and has_special


def generate_one_time_bootstrap_password() -> str:
    return settings.AEGION_SUPER_ADMIN_INITIAL_PASSWORD or secrets.token_urlsafe(18)
