from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone

ServiceHealthState = Literal["operational", "degraded", "maintenance", "outage"]


class CampusServiceItem(BaseModel):
    id: str
    name: str
    category: str
    description: str
    status: ServiceHealthState
    uptime_percent: float
    latency_ms: Optional[int] = None
    last_updated: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    is_live_monitored: bool = False
    status_message: str
    details: Optional[str] = None


class SystemAnnouncement(BaseModel):
    id: str
    title: str
    severity: Literal["info", "warning", "critical"]
    message: str
    affected_services: List[str]
    posted_at: str


class SystemStatusResponse(BaseModel):
    overall_status: ServiceHealthState
    services: List[CampusServiceItem]
    announcements: List[SystemAnnouncement]
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    active_incidents_count: int = 0
