from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class KPIStats(BaseModel):
    open_tickets: int
    resolved_today: int
    avg_resolution_time_mins: int
    ai_resolution_rate_percent: int
    escalations_count: int
    ai_confidence_percent: int
    total_tickets_handled: int
    active_students_served: int


class LineDataPoint(BaseModel):
    label: str  # e.g., "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    value: float  # e.g. 72.5, 84.0, etc.
    volume: int


class DonutDataPoint(BaseModel):
    name: str  # "Critical", "High", "Medium", "Low"
    count: int
    percentage: float
    color: str


class DepartmentDataPoint(BaseModel):
    department: str  # "Network & Wi-Fi", "Canvas / LMS", "Printing", "Identity & Duo", "Labs"
    ticket_count: int
    resolved_count: int
    avg_turnaround_hours: float


class TechnicianWorkloadItem(BaseModel):
    id: str
    name: str
    avatar: str
    specialty: str
    active_tickets: int
    resolved_today: int
    efficiency_rating: float


class AnalyticsGraphsResponse(BaseModel):
    kpis: KPIStats
    resolution_rate_trend: List[LineDataPoint]
    priority_distribution: List[DonutDataPoint]
    department_breakdown: List[DepartmentDataPoint]
    technician_workloads: List[TechnicianWorkloadItem]
    ai_confidence_trend: List[LineDataPoint]
    recent_escalations_summary: List[Dict[str, Any]]


class ReportSummaryResponse(BaseModel):
    date_range: str
    generated_at: str
    kpis: KPIStats
    total_incidents: int
    resolved_by_ai: int
    resolved_by_staff: int
    escalated_to_tier2: int
    avg_response_time_secs: float
    avg_diagnostic_turns: float
    top_issue_categories: List[Dict[str, Any]]
    department_summary: List[DepartmentDataPoint]
