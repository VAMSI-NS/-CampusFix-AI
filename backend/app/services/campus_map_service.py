import logging
from typing import List, Optional, Dict, Any
from app.models.campus_map import CampusLocation, CampusMapDataResponse
from app.services.ticket_service import ticket_service
from app.services.status_service import status_service
from app.models.users import CampusUser

logger = logging.getLogger("campusfix.campus_map")

# Verified Vignan University (VFSTR), Vadlamudi, Guntur, Andhra Pradesh (16.2334° N, 80.5508° E)
VIGNAN_CAMPUS_LOCATIONS: List[Dict[str, Any]] = [
    {
        "id": "loc-a-block",
        "name": "A-Block (Main Administrative & Convocation)",
        "code": "A-BLK",
        "category": "Administrative",
        "latitude": 16.2338,
        "longitude": 80.5505,
        "description": "Central Administrative Building, Vice Chancellor Secretariat, Registrar, Admissions, and Convocation Hall.",
        "facilities": [
            "Executive Offices",
            "Main Convocation Auditorium",
            "Administrative Wi-Fi Core",
            "Campus Security Command"
        ],
        "wifi_network": "Eduroam / Vignan-Admin-5G",
        "active_tech_bar": False,
        "building_floor_count": 5,
        "service_status": "operational"
    },
    {
        "id": "loc-u-block",
        "name": "U-Block / Mahaveer Block (CSE & IT Labs)",
        "code": "U-BLK",
        "category": "Academic",
        "latitude": 16.2345,
        "longitude": 80.5512,
        "description": "Department of Computer Science & Engineering, IT labs, AI/ML research computing cluster, and software project labs.",
        "facilities": [
            "CSE High-Performance Computing Lab",
            "AI & Data Science Labs",
            "Cloud Infrastructure Lab",
            "Smart Video Classrooms"
        ],
        "wifi_network": "Eduroam / Vignan-CS-Wi-Fi6",
        "active_tech_bar": False,
        "building_floor_count": 6,
        "service_status": "operational"
    },
    {
        "id": "loc-h-block",
        "name": "H-Block / Aryabhata Block (ECE & EEE Labs)",
        "code": "H-BLK",
        "category": "Academic",
        "latitude": 16.2330,
        "longitude": 80.5518,
        "description": "Electronics & Electrical Engineering block with hardware robotics, VLSI, and signal processing laboratories.",
        "facilities": [
            "Robotics & Embedded Systems Lab",
            "VLSI CAD Suite",
            "Power Systems Lab",
            "Department Seminar Hall"
        ],
        "wifi_network": "Eduroam / Vignan-ECE-Net",
        "active_tech_bar": False,
        "building_floor_count": 5,
        "service_status": "operational"
    },
    {
        "id": "loc-ntr-library",
        "name": "NTR Vignan Central Library & Tech Bar",
        "code": "NTR-LIB",
        "category": "Library & Tech Bar",
        "latitude": 16.2335,
        "longitude": 80.5500,
        "description": "Central Campus Library with Digital Knowledge Center, 1st Floor IT Walkup Tech Bar, and PaperCut WebPrint Release Hub.",
        "facilities": [
            "Campus IT Walkup Tech Bar (1st Floor)",
            "Digital Knowledge Resource Center",
            "PaperCut Student Print Release Hub",
            "24/7 Silent Reading Enclave"
        ],
        "wifi_network": "Eduroam / Vignan-Library-Mesh",
        "active_tech_bar": True,
        "building_floor_count": 4,
        "service_status": "operational"
    },
    {
        "id": "loc-datacenter",
        "name": "Central Computing Center & Campus Data Center",
        "code": "CCC-DC",
        "category": "Data Center",
        "latitude": 16.2340,
        "longitude": 80.5510,
        "description": "Primary Campus Data Center hosting Shibboleth SSO, Active Directory, Eduroam RADIUS servers, and Core 10Gbps fiber switches.",
        "facilities": [
            "Central 10Gbps Fiber Backbone Switch",
            "Eduroam RADIUS Authentication Server",
            "Campus SSO / IAM Server Farm",
            "Redundant N+1 UPS Battery Enclosure"
        ],
        "wifi_network": "Eduroam / Vignan-Secure-Infra",
        "active_tech_bar": False,
        "building_floor_count": 2,
        "service_status": "operational"
    },
    {
        "id": "loc-priyamvada-hostel",
        "name": "Priyamvada Boys Hostel (ResNet Hub Alpha)",
        "code": "PBH-DORM",
        "category": "Hostel / Residential",
        "latitude": 16.2355,
        "longitude": 80.5495,
        "description": "Main campus residential block for male undergraduate and research students with high-density ResNet switches.",
        "facilities": [
            "Dorm ResNet Ethernet Switch Stack",
            "Common Study Lounge Wi-Fi 6",
            "PaperCut ResNet Satellite Printer",
            "Hostel Warden Desk"
        ],
        "wifi_network": "Eduroam / Vignan-ResNet-Alpha",
        "active_tech_bar": False,
        "building_floor_count": 5,
        "service_status": "operational"
    },
    {
        "id": "loc-sarojini-hostel",
        "name": "Sarojini Girls Hostel (ResNet Hub Beta)",
        "code": "SGH-DORM",
        "category": "Hostel / Residential",
        "latitude": 16.2320,
        "longitude": 80.5525,
        "description": "Residential block for female students featuring secure biometric access and dedicated dorm ResNet access points.",
        "facilities": [
            "Dorm ResNet Access Hub",
            "Digital Study & Recreation Center",
            "Biometric Turnstile Access Network",
            "Satellite Printing Terminal"
        ],
        "wifi_network": "Eduroam / Vignan-ResNet-Beta",
        "active_tech_bar": False,
        "building_floor_count": 5,
        "service_status": "operational"
    },
    {
        "id": "loc-sac-dining",
        "name": "Sangam Dining & Student Activity Center (SAC)",
        "code": "SAC-CTR",
        "category": "Student Center",
        "latitude": 16.2325,
        "longitude": 80.5508,
        "description": "Student recreational hub, cafeteria, indoor games arena, and university cultural activity center.",
        "facilities": [
            "Campus Cafeteria & Food Court",
            "Indoor Sports Arena",
            "Student Clubs & Activity Hub",
            "Guest Wi-Fi Portal Node"
        ],
        "wifi_network": "Eduroam / Vignan-SAC-Public",
        "active_tech_bar": False,
        "building_floor_count": 3,
        "service_status": "operational"
    },
    {
        "id": "loc-innovation-hub",
        "name": "Vignan Innovation & Incubation Center (V-Hub)",
        "code": "V-HUB",
        "category": "Academic",
        "latitude": 16.2328,
        "longitude": 80.5495,
        "description": "Technology business incubator, entrepreneurship cell (E-Cell), IoT prototyping workspace, and startup co-working arena.",
        "facilities": [
            "Startup Prototyping Workshop",
            "High-Speed Low-Latency Dedicated Link",
            "Video Conference Boardrooms",
            "Hardware Maker Lab"
        ],
        "wifi_network": "Eduroam / Vignan-Innovate-Mesh",
        "active_tech_bar": False,
        "building_floor_count": 3,
        "service_status": "operational"
    },
    {
        "id": "loc-l-block",
        "name": "Biotechnology & Pharmacy Block (L-Block)",
        "code": "L-BLK",
        "category": "Academic",
        "latitude": 16.2342,
        "longitude": 80.5522,
        "description": "Departments of Biotechnology, Bioinformatics, and Pharmaceutical Sciences with environmental monitoring IoT nodes.",
        "facilities": [
            "Bioinformatics Supercomputing Terminal",
            "Microbiology Research Labs",
            "Analytical Instrumentation Lab",
            "Smart Classrooms"
        ],
        "wifi_network": "Eduroam / Vignan-Bio-Net",
        "active_tech_bar": False,
        "building_floor_count": 4,
        "service_status": "operational"
    },
    {
        "id": "loc-sports-complex",
        "name": "Vignan University Sports Complex & Athletics Stadium",
        "code": "V-SPORTS",
        "category": "Sports & Athletics",
        "latitude": 16.2312,
        "longitude": 80.5502,
        "description": "Campus outdoor athletic stadium, cricket ground, floodlit basketball/volleyball courts, and gymnasium arena.",
        "facilities": [
            "Athletic Track & Cricket Pavilion",
            "Indoor Badminton & Table Tennis Arena",
            "Outdoor High-Density Wi-Fi 6 Mesh",
            "Sports Directorate Office"
        ],
        "wifi_network": "Eduroam / Vignan-Sports-Outdoor",
        "active_tech_bar": False,
        "building_floor_count": 2,
        "service_status": "operational"
    },
    {
        "id": "loc-open-air-theatre",
        "name": "Open Air Theatre (OAT) & Cultural Quadrangle",
        "code": "OAT-QUAD",
        "category": "Student Center",
        "latitude": 16.2332,
        "longitude": 80.5510,
        "description": "Central campus amphitheater hosting university convocations, technical symposiums, hackathons, and cultural fests.",
        "facilities": [
            "Main Stage High-Capacity Event Wi-Fi APs",
            "Sound & Lighting Control Booth",
            "Open Seating Capacity (3000+)",
            "Satellite Broadcast Node"
        ],
        "wifi_network": "Eduroam / Vignan-Events-5G",
        "active_tech_bar": False,
        "building_floor_count": 1,
        "service_status": "operational"
    }
]


class CampusMapService:
    def __init__(self):
        self._locations = [dict(loc) for loc in VIGNAN_CAMPUS_LOCATIONS]

    def _match_location_to_ticket(self, ticket_loc: Optional[str], loc_dict: Dict[str, Any]) -> bool:
        if not ticket_loc:
            return False
        t_lower = ticket_loc.lower()
        name_lower = loc_dict["name"].lower()
        code_lower = loc_dict["code"].lower()

        if loc_dict["id"] in t_lower or code_lower in t_lower:
            return True
        if "library" in t_lower and "library" in name_lower:
            return True
        if ("u-block" in t_lower or "mahaveer" in t_lower or "engineering" in t_lower) and "u-block" in name_lower:
            return True
        if ("a-block" in t_lower or "admin" in t_lower) and "a-block" in name_lower:
            return True
        if ("h-block" in t_lower or "aryabhata" in t_lower) and "h-block" in name_lower:
            return True
        if ("priyamvada" in t_lower or "boys hostel" in t_lower or "residential hall" in t_lower or "maple" in t_lower) and "priyamvada" in name_lower:
            return True
        if ("sarojini" in t_lower or "girls hostel" in t_lower) and "sarojini" in name_lower:
            return True
        if ("data center" in t_lower or "computing center" in t_lower or "ccc" in t_lower) and "data center" in name_lower:
            return True
        if ("sac" in t_lower or "dining" in t_lower or "sangam" in t_lower) and "sangam" in name_lower:
            return True
        if ("innovation" in t_lower or "v-hub" in t_lower) and "innovation" in name_lower:
            return True
        if ("l-block" in t_lower or "bio" in t_lower or "pharmacy" in t_lower or "science" in t_lower) and "l-block" in name_lower:
            return True
        if ("sport" in t_lower or "ground" in t_lower or "stadium" in t_lower or "gym" in t_lower) and "sports" in name_lower:
            return True
        if ("oat" in t_lower or "theatre" in t_lower or "quadrangle" in t_lower or "stage" in t_lower) and "open air" in name_lower:
            return True

        return False

    def get_campus_map_data(self, user: Optional[CampusUser] = None) -> CampusMapDataResponse:
        """Enriches Vignan University campus locations with active tickets and service statuses based on role authorization."""
        all_tickets = ticket_service.list_tickets()
        system_status = status_service.get_system_status()

        # Role checks
        is_host = user and (user.role == "host" or user.role == "admin")
        is_technician = user and user.role == "technician"
        user_name = user.name if user else None

        active_incidents_total = 0
        enriched_locations: List[CampusLocation] = []

        for base_loc in self._locations:
            matched_tickets = []
            for t in all_tickets:
                if t.status in ["New", "Diagnosing", "Waiting for Student", "Escalated", "Open"]:
                    if self._match_location_to_ticket(t.location, base_loc):
                        matched_tickets.append(t)

            # Role filtering on ticket visibility
            if is_host:
                visible_tickets = matched_tickets
            elif is_technician:
                # Technician sees tickets assigned to them or unassigned matching their category/specialization
                visible_tickets = [
                    t for t in matched_tickets
                    if (t.assigned_technician and user_name and user_name.lower() in t.assigned_technician.lower())
                    or not t.assigned_technician
                    or (user and user.specialization and user.specialization in t.category)
                ]
            else:
                # Student only sees their own netid or public status summary
                if user and user.netid:
                    visible_tickets = [t for t in matched_tickets if t.netid == user.netid]
                else:
                    visible_tickets = []

            active_ticket_ids = [t.ticket_number for t in visible_tickets]
            assigned_techs = list({
                t.assigned_technician for t in matched_tickets if t.assigned_technician
            })

            # Calculate building status based on active ticket severity
            has_critical = any(t.priority in ["Critical", "Urgent"] for t in matched_tickets)
            has_high = any(t.priority == "High" for t in matched_tickets)

            if has_critical:
                loc_service_status = "outage"
            elif has_high or len(matched_tickets) >= 2:
                loc_service_status = "degraded"
            else:
                loc_service_status = base_loc.get("service_status", "operational")

            active_incidents_total += len(matched_tickets)

            enriched_locations.append(
                CampusLocation(
                    id=base_loc["id"],
                    name=base_loc["name"],
                    code=base_loc["code"],
                    category=base_loc["category"],
                    latitude=base_loc["latitude"],
                    longitude=base_loc["longitude"],
                    description=base_loc["description"],
                    facilities=base_loc["facilities"],
                    wifi_network=base_loc["wifi_network"],
                    active_tech_bar=base_loc["active_tech_bar"],
                    building_floor_count=base_loc["building_floor_count"],
                    service_status=loc_service_status,
                    active_ticket_ids=active_ticket_ids,
                    active_incident_count=len(matched_tickets),
                    assigned_technicians=assigned_techs if (is_host or is_technician) else [],
                )
            )

        operational_count = sum(1 for l in enriched_locations if l.service_status == "operational")

        return CampusMapDataResponse(
            campus_name="Vignan's Foundation for Science, Technology & Research (VFSTR)",
            location_name="Vadlamudi, Guntur District, Andhra Pradesh, India",
            postal_code="522213",
            center_coordinates={"lat": 16.2334, "lng": 80.5508},
            default_zoom=17,
            locations=enriched_locations,
            total_locations=len(enriched_locations),
            active_incidents_count=active_incidents_total,
            operational_services_count=operational_count,
        )


campus_map_service = CampusMapService()
