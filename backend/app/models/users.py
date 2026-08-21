from pydantic import BaseModel
from typing import List, Optional, Literal

UserRole = Literal["student", "technician", "admin", "host"]


class CampusUser(BaseModel):
    id: str
    name: str
    email: str
    netid: str
    role: UserRole
    department: str
    status: Literal["active", "away", "offline"]
    active_assignments_count: int = 0
    avatar_initials: str
    skills: List[str] = []
