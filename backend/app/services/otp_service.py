import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Tuple
from app.models.users import CampusUser, UserInDB
from app.services.users_service import users_service
from app.services.auth_service import auth_service

logger = logging.getLogger("campusfix.otp")

OTP_EXPIRY_MINUTES = 5
MAX_OTP_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 30


class OTPRecord:
    def __init__(self, name: str, roll_number: str, phone: str, otp: str):
        now = datetime.now(timezone.utc)
        self.name = name.strip()
        self.roll_number = roll_number.strip().upper()
        self.phone = phone.strip()
        self.otp = otp
        self.created_at = now
        self.expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)
        self.last_sent_at = now
        self.attempts = 0
        self.is_verified = False


class OTPService:
    def __init__(self):
        # Keyed by normalized phone number
        self._otp_store: Dict[str, OTPRecord] = {}

    def _normalize_phone(self, phone: str) -> str:
        clean = "".join(ch for ch in phone if ch.isalnum() or ch == "+")
        return clean

    def _generate_otp(self) -> str:
        """Generates a secure 6-digit numeric OTP."""
        return "".join(secrets.choice("0123456789") for _ in range(6))

    def send_student_otp(
        self,
        name: str,
        roll_number: str,
        phone: str,
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Validates student inputs, generates a one-time 6-digit OTP,
        and logs it safely for development mode.
        """
        clean_name = name.strip()
        clean_roll = roll_number.strip().upper()
        clean_phone = self._normalize_phone(phone)

        if not clean_name:
            return False, None, "Student name is required."
        if len(clean_roll) < 3:
            return False, None, "A valid student roll number / registration ID is required."
        if len(clean_phone) < 7:
            return False, None, "A valid contact phone number is required."

        # Check existing record for resend cooldown
        existing = self._otp_store.get(clean_phone)
        now = datetime.now(timezone.utc)
        if existing:
            elapsed = (now - existing.last_sent_at).total_seconds()
            if elapsed < RESEND_COOLDOWN_SECONDS:
                remaining = int(RESEND_COOLDOWN_SECONDS - elapsed)
                return (
                    False,
                    None,
                    f"Please wait {remaining} seconds before requesting a new OTP.",
                )

        otp = self._generate_otp()
        record = OTPRecord(name=clean_name, roll_number=clean_roll, phone=clean_phone, otp=otp)
        self._otp_store[clean_phone] = record

        # Log OTP to server console for development mode
        logger.info(
            f"[DEVELOPMENT OTP MODE] Generated OTP '{otp}' for Student: {clean_name} (Roll: {clean_roll}, Phone: {clean_phone}). Expires in {OTP_EXPIRY_MINUTES} minutes."
        )

        response_data = {
            "status": "success",
            "message": f"Verification OTP generated for {clean_phone}. (Development Mode: Check development banner or server logs)",
            "phone": clean_phone,
            "roll_number": clean_roll,
            "expires_in_seconds": OTP_EXPIRY_MINUTES * 60,
            "cooldown_seconds": RESEND_COOLDOWN_SECONDS,
            "dev_mode": True,
            "dev_otp": otp,  # Clearly marked development OTP
        }
        return True, response_data, None

    def resend_student_otp(
        self,
        phone: str,
        roll_number: Optional[str] = None,
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        clean_phone = self._normalize_phone(phone)
        existing = self._otp_store.get(clean_phone)

        if not existing:
            return False, None, "No active OTP request found for this phone number. Please start login again."

        now = datetime.now(timezone.utc)
        elapsed = (now - existing.last_sent_at).total_seconds()
        if elapsed < RESEND_COOLDOWN_SECONDS:
            remaining = int(RESEND_COOLDOWN_SECONDS - elapsed)
            return (
                False,
                None,
                f"Please wait {remaining} seconds before requesting a new OTP.",
            )

        new_otp = self._generate_otp()
        existing.otp = new_otp
        existing.created_at = now
        existing.expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)
        existing.last_sent_at = now
        existing.attempts = 0
        if roll_number:
            existing.roll_number = roll_number.strip().upper()

        logger.info(
            f"[DEVELOPMENT OTP MODE] Resent OTP '{new_otp}' for Student: {existing.name} (Roll: {existing.roll_number}, Phone: {clean_phone})."
        )

        response_data = {
            "status": "success",
            "message": f"New verification OTP sent to {clean_phone}.",
            "phone": clean_phone,
            "roll_number": existing.roll_number,
            "expires_in_seconds": OTP_EXPIRY_MINUTES * 60,
            "cooldown_seconds": RESEND_COOLDOWN_SECONDS,
            "dev_mode": True,
            "dev_otp": new_otp,
        }
        return True, response_data, None

    def verify_student_otp(
        self,
        phone: str,
        roll_number: str,
        otp: str,
    ) -> Tuple[Optional[CampusUser], Optional[str], Optional[str]]:
        """
        Validates OTP, enforces attempt limits and expiration,
        and creates/retrieves authenticated Student session.
        """
        clean_phone = self._normalize_phone(phone)
        clean_roll = roll_number.strip().upper()
        clean_otp = otp.strip()

        record = self._otp_store.get(clean_phone)
        if not record:
            return None, None, "No OTP request found for this phone number. Please request a new OTP."

        now = datetime.now(timezone.utc)

        # Check expiration
        if now > record.expires_at:
            self._otp_store.pop(clean_phone, None)
            return None, None, "The verification OTP has expired. Please request a new OTP."

        # Check max attempts
        if record.attempts >= MAX_OTP_ATTEMPTS:
            self._otp_store.pop(clean_phone, None)
            return (
                None,
                None,
                "Too many incorrect OTP attempts. For security, please request a new OTP.",
            )

        # Verify OTP
        if record.otp != clean_otp:
            record.attempts += 1
            remaining = MAX_OTP_ATTEMPTS - record.attempts
            if remaining <= 0:
                self._otp_store.pop(clean_phone, None)
                return (
                    None,
                    None,
                    "Too many incorrect attempts. Please request a new OTP.",
                )
            return (
                None,
                None,
                f"Invalid OTP code. {remaining} attempt{'s' if remaining > 1 else ''} remaining.",
            )

        # Successful verification -> clean up OTP record
        student_name = record.name
        self._otp_store.pop(clean_phone, None)

        # Create or fetch persistent student user
        student_user = users_service.get_or_create_student(
            name=student_name,
            roll_number=clean_roll,
            phone=clean_phone,
        )

        # Generate JWT Bearer Token
        token = auth_service.create_access_token(user=student_user)

        logger.info(
            f"Student authentication successful: {student_user.name} (Roll: {clean_roll}, ID: {student_user.id})"
        )
        return student_user, token, None


otp_service = OTPService()
