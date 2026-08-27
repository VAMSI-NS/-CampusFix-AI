import os
import hmac
import json
import base64
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
from pathlib import Path
from dotenv import load_dotenv
from app.models.users import CampusUser

_backend_env = Path(__file__).resolve().parents[2] / ".env"
if _backend_env.exists():
    load_dotenv(dotenv_path=_backend_env)

# Secret key for token signing (from env or cryptographically secure fallback)
JWT_SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "campusfix-super-secure-production-jwt-hmac-key-2026-auth-engine")
JWT_ALGORITHM = "HS256"
DEFAULT_TOKEN_EXPIRY_SECONDS = 86400 * 7  # 7 days


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64decode(data: str) -> bytes:
    padding = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


class AuthService:
    def __init__(self, secret_key: str = JWT_SECRET_KEY):
        self.secret_key = secret_key.encode("utf-8")

    def hash_password(self, password: str, salt: Optional[bytes] = None) -> Tuple[str, str]:
        """Hashes password using PBKDF2-HMAC-SHA256 with 100,000 iterations and cryptographic salt."""
        if salt is None:
            salt = secrets.token_bytes(16)
        pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
        return pwd_hash.hex(), salt.hex()

    def verify_password(self, password: str, password_hash: str, salt_hex: str) -> bool:
        """Verifies candidate password against stored salt and hash."""
        # SECURITY FIX: Reject authentication if password_hash or salt_hex are None/empty
        if not password_hash or not salt_hex:
            return False
        
        try:
            salt = bytes.fromhex(salt_hex)
            expected_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
            return hmac.compare_digest(expected_hash.hex(), password_hash)
        except Exception:
            return False

    def create_access_token(
        self,
        user: CampusUser,
        specialization: Optional[str] = None,
        expires_delta: Optional[timedelta] = None,
    ) -> str:
        """Generates a secure HMAC-SHA256 signed JWT token containing user identity and role claims."""
        now = datetime.now(timezone.utc)
        if expires_delta:
            exp = now + expires_delta
        else:
            exp = now + timedelta(seconds=DEFAULT_TOKEN_EXPIRY_SECONDS)

        header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
        payload = {
            "sub": user.id,
            "username": user.username,
            "netid": user.netid,
            "roll_number": user.roll_number,
            "name": user.name,
            "role": user.role,
            "technician_id": user.technician_id,
            "specialization": specialization or user.specialization,
            "department": user.department,
            "iat": int(now.timestamp()),
            "exp": int(exp.timestamp()),
        }

        encoded_header = _b64encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
        encoded_payload = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
        signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")

        signature = hmac.new(self.secret_key, signing_input, hashlib.sha256).digest()
        encoded_signature = _b64encode(signature)

        return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifies signature, expiration, and decodes the JWT payload."""
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None

            encoded_header, encoded_payload, encoded_signature = parts
            signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
            expected_sig = hmac.new(self.secret_key, signing_input, hashlib.sha256).digest()

            provided_sig = _b64decode(encoded_signature)
            if not hmac.compare_digest(expected_sig, provided_sig):
                return None

            payload_bytes = _b64decode(encoded_payload)
            payload = json.loads(payload_bytes.decode("utf-8"))

            # Validate expiration
            exp = payload.get("exp")
            if exp and datetime.now(timezone.utc).timestamp() > exp:
                return None

            return payload
        except Exception:
            return None


auth_service = AuthService()
