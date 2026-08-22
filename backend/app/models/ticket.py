from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal
from datetime import datetime, timezone

TicketPriority = Literal["Critical", "High", "Medium", "Low", "Urgent"]
TicketStatus = Literal[
    "New",
    "Open",
    "Escalated",
    "Assigned",
    "Acknowledged",
    "Diagnosing",
    "In Progress",
    "Fix in Progress",
    "Waiting for Student",
    "On Hold",
    "Resolved",
    "Closed",
]
TicketCategory = Literal[
    "Eduroam Wi-Fi",
    "Canvas / SSO",
    "Duo MFA",
    "PaperCut Printing",
    "Dorm ResNet",
    "NetID / Password",
    "Lab / Computer Access",
    "Software",
    "VPN",
    "Email",
    "Other",
]
DiagnosticStage = Literal["Triage", "Environment & Device", "Troubleshooting", "Verification", "Completed"]


class TicketNote(BaseModel):
    id: str
    author: str
    author_role: Literal["student", "technician", "system", "host", "admin"]
    text: str
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class ActionLogItem(BaseModel):
    id: str
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    action: str
    result: str
    actor: Literal["ai_specialist", "student", "technician", "system", "host", "admin"] = "system"


class ActionLogCreate(BaseModel):
    action: str
    result: str
    actor: Optional[Literal["ai_specialist", "student", "technician", "system", "host", "admin"]] = "technician"


class EscalationDetails(BaseModel):
    tier: str = "Tier-2 Technical Escalation"
    department: str = "Campus IT Systems Engineering"
    reason: str
    original_technician: Optional[str] = None
    target_specialization: Optional[str] = None
    target_role: Optional[str] = None
    assigned_to: Optional[str] = "Tier-2 On-Call Specialist"
    tech_bar_location: str = "Main Library, 1st Floor Tech Bar (Mon–Fri 8:00 AM – 7:00 PM)"
    student_id_required: bool = True
    notes: Optional[str] = None
    escalated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class TicketResolveRequest(BaseModel):
    resolution_details: str


class TicketReassignRequest(BaseModel):
    new_technician: str
    reassignment_notes: Optional[str] = None


def normalize_priority_str(v: str) -> str:
    if not v:
        return "Medium"
    s = str(v).strip().replace(" Priority", "").replace(" priority", "").capitalize()
    if s in ["Critical", "High", "Medium", "Low", "Urgent"]:
        return s
    if "crit" in s.lower():
        return "Critical"
    if "urg" in s.lower():
        return "Urgent"
    if "high" in s.lower():
        return "High"
    if "low" in s.lower():
        return "Low"
    return "Medium"


class TicketCreate(BaseModel):
    title: str
    category: str = "Eduroam Wi-Fi"
    priority: str = "Medium"
    location: Optional[str] = "Main Campus"
    device: Optional[str] = "Windows 11"
    netid: str = "student.user"
    email: str = "student@university.edu"
    description: str
    issue_summary: Optional[str] = None
    assigned_technician: Optional[str] = "CampusFix AI"
    ai_confidence: Optional[int] = 92
    chat_transcript: Optional[str] = None

    @field_validator("priority", mode="before")
    @classmethod
    def clean_priority(cls, v):
        return normalize_priority_str(v)


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    device: Optional[str] = None
    issue_summary: Optional[str] = None
    assigned_technician: Optional[str] = None
    ai_confidence: Optional[int] = None
    diagnostic_stage: Optional[str] = None
    diagnostic_progress: Optional[int] = None
    technician_note: Optional[str] = None
    resolution_details: Optional[str] = None
    escalation_info: Optional[EscalationDetails] = None

    @field_validator("priority", mode="before")
    @classmethod
    def clean_priority(cls, v):
        if v is None:
            return v
        return normalize_priority_str(v)


class TicketResponse(BaseModel):
    id: str
    ticket_number: str
    title: str
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    location: str
    device: str = "Windows 11"
    netid: str
    email: str
    description: str
    issue_summary: str = ""
    assigned_technician: str = "Jordan Smith"
    ai_confidence: int = 91
    diagnostic_stage: DiagnosticStage = "Triage"
    diagnostic_progress: int = 15
    actions_taken: List[ActionLogItem] = Field(default_factory=list)
    resolution_details: Optional[str] = None
    escalation_info: Optional[EscalationDetails] = None
    chat_transcript: Optional[str] = None
    notes: List[TicketNote] = Field(default_factory=list)
    created_at: str
    updated_at: str
