from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone

ProbeStatus = Literal["passed", "warning", "failed", "running"]
ProbeType = Literal["live_network", "live_ai", "simulated_campus_infra"]


class DiagnosticProbeResult(BaseModel):
    id: str
    name: str
    target: str
    probe_type: ProbeType
    is_simulated: bool
    status: ProbeStatus
    latency_ms: Optional[int] = None
    output_message: str
    details: Optional[str] = None
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class DiagnosticsReportResponse(BaseModel):
    overall_health: Literal["healthy", "degraded", "critical"]
    probes_passed: int
    probes_total: int
    probes: List[DiagnosticProbeResult]
    run_timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    summary: str
