from datetime import datetime, timezone
from app.models.service_status import (
    CampusServiceItem,
    SystemAnnouncement,
    SystemStatusResponse,
)


class StatusService:
    def __init__(self):
        pass

    def get_system_status(self) -> SystemStatusResponse:
        now_iso = datetime.now(timezone.utc).isoformat()

        services = [
            CampusServiceItem(
                id="eduroam",
                name="Eduroam Campus Wi-Fi",
                category="Network & Wireless",
                description="High-speed encrypted 802.1X WPA-Enterprise wireless network across all campus buildings, quads, and residence halls.",
                status="operational",
                uptime_percent=99.94,
                latency_ms=14,
                last_updated=now_iso,
                is_live_monitored=True,
                status_message="All 480+ Access Points operational. RADIUS authentication servers responding nominally.",
                details="Main Campus, West Campus, and Residence Halls all report standard load. EAP-PEAP / MSCHAPv2 auth nominal.",
            ),
            CampusServiceItem(
                id="canvas",
                name="Canvas LMS & SSO Portal",
                category="Academic & Learning",
                description="Core learning management system, assignment submissions, video lectures, and student portal SSO.",
                status="operational",
                uptime_percent=99.98,
                latency_ms=48,
                last_updated=now_iso,
                is_live_monitored=True,
                status_message="Canvas Cloud SSO and API integration fully functional.",
                details="SAML/Shibboleth Identity Provider healthy. Zero authentication bottlenecks.",
            ),
            CampusServiceItem(
                id="duo",
                name="Duo MFA & Identity Security",
                category="Security & Identity",
                description="Campus central multi-factor authentication for email, Canvas, VPN, and administrative systems.",
                status="operational",
                uptime_percent=99.99,
                latency_ms=32,
                last_updated=now_iso,
                is_live_monitored=True,
                status_message="Duo Push, Passcode, and SMS authentication operational worldwide.",
                details="Average push notification delivery response latency is 1.1 seconds.",
            ),
            CampusServiceItem(
                id="papercut",
                name="PaperCut Printing & WebPrint",
                category="Printing & Hardware",
                description="Student print quota management and 32 release stations across Main Library and computer labs.",
                status="degraded",
                uptime_percent=98.85,
                latency_ms=120,
                last_updated=now_iso,
                is_live_monitored=True,
                status_message="Main Library 2nd Floor Release Station #2 experiencing print spooler delays.",
                details="Print jobs may take up to 2-3 minutes to release at West Wing terminals while technician updates driver.",
            ),
            CampusServiceItem(
                id="resnet",
                name="Dormitory Wired ResNet",
                category="Housing & ResNet",
                description="Gigabit wired Ethernet connectivity and gaming console self-registration portal across residence halls.",
                status="operational",
                uptime_percent=99.91,
                latency_ms=8,
                last_updated=now_iso,
                is_live_monitored=False,
                status_message="ResNet portal active. All residential building edge switches online.",
                details="Console MAC address self-registration operating normally at resnet.university.edu.",
            ),
            CampusServiceItem(
                id="netid",
                name="NetID & Active Directory Password",
                category="Identity & Access",
                description="Central identity management, LDAP directory, Kerberos, and Self-Service Password Reset (SSPR).",
                status="operational",
                uptime_percent=99.96,
                latency_ms=22,
                last_updated=now_iso,
                is_live_monitored=True,
                status_message="Active Directory domain controllers and SSPR self-service portals healthy.",
                details="Self-service password resets and NetID account unlock requests processing normally.",
            ),
            CampusServiceItem(
                id="lab_access",
                name="Lab Workstation & Computer Access",
                category="Labs & Workstations",
                description="Physical desktop computer access in Engineering Hall, Main Library, and Science Lab facilities.",
                status="operational",
                uptime_percent=99.88,
                latency_ms=35,
                last_updated=now_iso,
                is_live_monitored=True,
                status_message="240/245 public lab workstations currently available and reporting healthy domain trust.",
                details="Engineering Hall CAD Labs 110 & 112 operational. Virtual lab desktop pooling available.",
            ),
            CampusServiceItem(
                id="vpn",
                name="Campus VPN (GlobalProtect)",
                category="Remote Access",
                description="Encrypted campus tunnel for off-campus library database access, licensing servers, and research clusters.",
                status="operational",
                uptime_percent=99.89,
                latency_ms=64,
                last_updated=now_iso,
                is_live_monitored=True,
                status_message="VPN gateway load: 38% capacity. Off-campus student tunnels active.",
                details="Gateway 1 (Primary) and Gateway 2 (Redundant) healthy.",
            ),
        ]

        announcements = [
            SystemAnnouncement(
                id="ann-1",
                title="PaperCut Library Spooler Maintenance",
                severity="warning",
                message="IT technicians are updating the print spooler buffer on Main Library 2nd Floor. Release stations may experience intermittent queue delays.",
                affected_services=["PaperCut Printing & WebPrint"],
                posted_at="Today, 11:30 AM",
            ),
            SystemAnnouncement(
                id="ann-2",
                title="Upcoming Weekend Network Maintenance",
                severity="info",
                message="Routine core switch firmware upgrades scheduled for Sunday 2:00 AM – 4:00 AM. Intermittent 30-second Wi-Fi failover blips expected.",
                affected_services=["Eduroam Campus Wi-Fi", "Dormitory Wired ResNet"],
                posted_at="Yesterday, 4:00 PM",
            ),
        ]

        return SystemStatusResponse(
            overall_status="operational",
            services=services,
            announcements=announcements,
            timestamp=now_iso,
            active_incidents_count=1,
        )


status_service = StatusService()
