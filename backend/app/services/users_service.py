from typing import List, Optional
from app.models.users import CampusUser, UserRole


class UsersService:
    def __init__(self):
        self._users: List[CampusUser] = [
            CampusUser(
                id="user-1",
                name="Jordan Smith",
                email="j.smith@university.edu",
                netid="j.smith",
                role="technician",
                department="Network & Wireless Engineering",
                status="active",
                active_assignments_count=2,
                avatar_initials="JS",
                skills=["Eduroam 802.1X", "RADIUS", "Cisco Catalyst", "DNS/DHCP"],
            ),
            CampusUser(
                id="user-2",
                name="Sarah Jenkins",
                email="s.jenkins@university.edu",
                netid="s.jenkins",
                role="admin",
                department="Identity & Access Management",
                status="active",
                active_assignments_count=1,
                avatar_initials="SJ",
                skills=["Active Directory", "Duo 2FA", "Shibboleth SSO", "SAML 2.0"],
            ),
            CampusUser(
                id="user-3",
                name="Dave Miller",
                email="d.miller@university.edu",
                netid="d.miller",
                role="technician",
                department="Campus Hardware & Printing Services",
                status="active",
                active_assignments_count=1,
                avatar_initials="DM",
                skills=["PaperCut MF", "Kyocera / HP Spoolers", "Lab Workstations"],
            ),
            CampusUser(
                id="user-4",
                name="Dr. Elena Rostova",
                email="e.rostova@university.edu",
                netid="e.rostova",
                role="host",
                department="Office of University CIO & IT Governance",
                status="active",
                active_assignments_count=0,
                avatar_initials="ER",
                skills=["IT Governance", "SLA Auditing", "Executive Reporting"],
            ),
            CampusUser(
                id="user-5",
                name="Marcus Chen",
                email="m.chen@university.edu",
                netid="m.chen",
                role="student",
                department="Computer Science & Engineering",
                status="active",
                active_assignments_count=0,
                avatar_initials="MC",
                skills=["Student User"],
            ),
            CampusUser(
                id="user-6",
                name="Priya Patel",
                email="k.patel@university.edu",
                netid="k.patel",
                role="student",
                department="School of Business",
                status="active",
                active_assignments_count=0,
                avatar_initials="PP",
                skills=["Student User"],
            ),
        ]

    def list_users(self, role: Optional[str] = None) -> List[CampusUser]:
        if role and role.lower() != "all":
            return [u for u in self._users if u.role.lower() == role.lower()]
        return self._users

    def get_user(self, user_id: str) -> Optional[CampusUser]:
        for u in self._users:
            if u.id == user_id or u.netid == user_id:
                return u
        return None

    def get_technicians(self) -> List[CampusUser]:
        return [u for u in self._users if u.role in ["technician", "admin"]]

    def update_user_status(self, user_id: str, status: str) -> Optional[CampusUser]:
        user = self.get_user(user_id)
        if user and status in ["active", "away", "offline"]:
            user.status = status  # type: ignore
            return user
        return None


users_service = UsersService()
