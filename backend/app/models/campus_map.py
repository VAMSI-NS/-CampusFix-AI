from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class CampusLocation(BaseModel):
    id: str
    name: str
    code: str
    category: str  # "Academic Block", "Administrative & Academic", "Library", "Guest House & Residential", "Academic & Research", "Academic & Laboratory", "Sports & Recreation"
    latitude: float
    longitude: float
    description: str
    facilities: List[str] = Field(default_factory=list)
    wifi_network: str = "Eduroam / Vignan-Enterprise"
    active_tech_bar: bool = False
    building_floor_count: int = 4
    service_status: str = "operational"  # "operational", "degraded", "outage"
    active_ticket_ids: List[str] = Field(default_factory=list)
    active_incident_count: int = 0
    assigned_technicians: List[str] = Field(default_factory=list)
    verification_status: str = "verified"  # "verified", "unmapped"

class CampusMapDataResponse(BaseModel):
    campus_name: str = "Vignan's Foundation for Science, Technology & Research (VFSTR)"
    location_name: str = "Vadlamudi, Guntur District, Andhra Pradesh, India"
    postal_code: str = "522213"
    center_coordinates: Dict[str, float] = {"lat": 16.2335, "lng": 80.5510}
    default_zoom: int = 17
    locations: List[CampusLocation]
    total_locations: int
    active_incidents_count: int
    operational_services_count: int
