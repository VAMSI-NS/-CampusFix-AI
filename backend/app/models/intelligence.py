from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime, timezone
from app.models.ticket import TicketResponse, TicketCategory, TicketPriority

ClusterSeverity = Literal["Critical", "High", "Medium", "Low"]
AnomalySeverity = Literal["critical", "warning", "info"]
AnomalyType = Literal["incident_spike", "repeated_failure", "unusual_location", "service_degradation"]


class RepresentativeIncident(BaseModel):
    ticket_id: str
    ticket_number: str
    title: str
    category: str
    location: str
    priority: str
    status: str
    description: str
    created_at: str


class IncidentClusterItem(BaseModel):
    id: str
    title: str
    summary: str
    primary_category: str
    severity: ClusterSeverity
    incident_count: int
    affected_locations: List[str]
    affected_services: List[str]
    ticket_ids: List[str]
    ticket_numbers: List[str]
    representative_incident: Optional[RepresentativeIncident] = None
    is_single_outage_pattern: bool = False
    duplicate_risk: bool = False
    duplicate_ratio: float = 0.0
    recent_trend: Literal["Spike", "Steady", "Decreasing", "Resolved"] = "Steady"
    recommended_action: str
    recommended_specialization: str
    first_incident_at: Optional[str] = None
    last_incident_at: Optional[str] = None
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class IncidentClusteringResponse(BaseModel):
    total_incidents_analyzed: int
    total_clusters_found: int
    potential_outages_detected: int
    duplicate_reports_identified: int
    clusters: List[IncidentClusterItem]
    analyzed_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    data_confidence: Literal["high", "moderate", "insufficient_data"] = "high"
    notes: Optional[str] = None


class CampusAnomalyItem(BaseModel):
    id: str
    title: str
    anomaly_type: AnomalyType
    severity: AnomalySeverity
    anomaly_score: int  # 0 to 100
    location: str
    affected_service: str
    category: str
    detected_pattern: str
    explanation: str
    real_evidence: List[str]
    ai_inference: str
    affected_ticket_ids: List[str] = Field(default_factory=list)
    affected_ticket_numbers: List[str] = Field(default_factory=list)
    baseline_comparison: Optional[str] = None
    recommended_action: str
    recommended_specialization: str
    detected_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class CampusAnomalyResponse(BaseModel):
    total_anomalies_detected: int
    highest_severity: Optional[AnomalySeverity] = None
    campus_risk_score: int  # 0 to 100
    anomalies: List[CampusAnomalyItem]
    analyzed_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    data_confidence: Literal["high", "moderate", "insufficient_data"] = "high"
    notes: Optional[str] = None


class IntelligenceOverviewResponse(BaseModel):
    total_incidents: int
    active_incidents: int
    total_clusters: int
    total_anomalies: int
    campus_risk_score: int
    clusters: List[IncidentClusterItem]
    anomalies: List[CampusAnomalyItem]
    top_hotspots: List[Dict[str, Any]]
    top_impacted_services: List[Dict[str, Any]]
    analyzed_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    data_confidence: Literal["high", "moderate", "insufficient_data"] = "high"
