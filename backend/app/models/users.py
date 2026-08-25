from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime, timezone

UserRole = Literal["student", "technician", "host", "admin"]
TechnicianSpecialization = Literal[
    "Network",
    "Hardware",
    "Software",
    "Support",
    "IAM / Access",
    "Network Technician",
    "Hardware Technician",
    "Software Technician",
    "Support Technician",
    "IAM/Access Technician",
    "Other",
]

CORE_SPECIALIZATIONS: List[str] = [
    "Network Technician",
    "Hardware Technician",
    "Software Technician",
    "Support Technician",
    "IAM/Access Technician",
]

ALL_SPECIALIZATIONS: List[str] = [
    "Network",
    "Hardware",
    "Software",
    "Support",
    "IAM / Access",
    "Network Technician",
    "Hardware Technician",
    "Software Technician",
    "Support Technician",
    "IAM/Access Technician",
    "Other",
]

def normalize_specialization(spec: Optional[str]) -> Optional[str]:
    """Normalizes specialization names to standard form for cross-compatibility."""
    if not spec:
        return None
    s = spec.strip().lower()
    if "network" in s:
        return "Network"
    if "hardware" in s:
        return "Hardware"
    if "software" in s:
        return "Software"
    if "iam" in s or "access" in s or "identity" in s:
        return "IAM / Access"
    if "support" in s:
        return "Support"
    return spec.strip()


class CampusUser(BaseModel):
    id: str
    technician_id: Optional[str] = None
    name: str
    username: str
    email: str
    netid: str
    roll_number: Optional[str] = None
    role: UserRole
    specialization: Optional[str] = None
    department: str
    status: Literal["active", "away", "offline"] = "active"
    is_active: bool = True
    phone: Optional[str] = None
    active_assignments_count: int = 0
    avatar_initials: str
    skills: List[str] = []
    created_at: Optional[str] = None
    authenticated: bool = True


class UserInDB(CampusUser):
    password_hash: Optional[str] = None
    password_salt: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    specialization: Optional[str] = None
    role: Optional[str] = None


class LoginResponse(BaseModel):
    authenticated: bool = True
    token: str
    token_type: str = "Bearer"
    user: CampusUser
    expires_in: int = 604800  # 7 days in seconds


# --- Student OTP Authentication Models ---


class StudentSendOTPRequest(BaseModel):
    name: str
    roll_number: str
    phone: str


class StudentSendOTPResponse(BaseModel):
    status: str = "success"
    message: str
    phone: str
    roll_number: str
    expires_in_seconds: int = 300
    cooldown_seconds: int = 30
    dev_mode: bool = True
    dev_otp: Optional[str] = None


class StudentVerifyOTPRequest(BaseModel):
    phone: str
    roll_number: str
    otp: str


class StudentResendOTPRequest(BaseModel):
    phone: str
    roll_number: Optional[str] = None


# --- Admin & Technician Models ---


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[Literal["active", "away", "offline"]] = None
    specialization: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[List[str]] = None
    is_active: Optional[bool] = None


class TechnicianCreateRequest(BaseModel):
    name: str
    technician_id: Optional[str] = None
    username: str
    email: str
    password: str
    specialization: str
    department: Optional[str] = "Campus IT Services"
    phone: Optional[str] = None
    is_active: bool = True
    skills: List[str] = []


class TechnicianUpdateRequest(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    specialization: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[Literal["active", "away", "offline"]] = None
    is_active: Optional[bool] = None
    skills: Optional[List[str]] = None


class ResetPasswordRequest(BaseModel):
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
