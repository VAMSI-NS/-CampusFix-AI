from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime, timezone


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: Optional[str] = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class AIActionButton(BaseModel):
    id: str
    action_type: str  # "open_ticket", "view_map", "assign_technician", "escalate_tier2", "mark_resolved", "report_to_host"
    label: str
    target_id: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    stream: Optional[bool] = False
    context_ticket_id: Optional[str] = None
    context_location: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    model: str
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    status: str = "success"
    actions: List[AIActionButton] = Field(default_factory=list)


class AIActionExecutionRequest(BaseModel):
    action_type: str
    ticket_id: str
    parameters: Optional[Dict[str, Any]] = None


class AIActionExecutionResponse(BaseModel):
    status: str
    message: str
    updated_ticket: Optional[Dict[str, Any]] = None


class AIInsightItem(BaseModel):
    id: str
    category: str
    title: str
    description: str
    severity: str  # "info", "warning", "critical", "success"
    recommended_action: Optional[str] = None
    action_target_id: Optional[str] = None


class IncidentCluster(BaseModel):
    location: str
    code: str
    active_count: int
    primary_category: str
    severity: str
    recommended_technician: str


class TechnicianWorkloadItem(BaseModel):
    name: str
    role: str
    specialization: str
    active_tickets: int
    status: str  # "Optimal", "High Workload", "Available"
    recommended_queue: List[str]


class AICommandCenterResponse(BaseModel):
    overall_health: str
    autonomous_resolution_rate: float
    avg_triage_seconds: float
    total_active_incidents: int
    insights: List[AIInsightItem]
    incident_clusters: List[IncidentCluster]
    technician_workload: List[TechnicianWorkloadItem]
    sla_risk_tickets: List[Dict[str, Any]]
    system_recommendations: List[str]
    generated_at: str
