import os
import json
import random
import logging
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone
from app.models.users import (
    CampusUser,
    UserInDB,
    UserRole,
    TechnicianCreateRequest,
    TechnicianUpdateRequest,
    ALL_SPECIALIZATIONS,
    CORE_SPECIALIZATIONS,
    normalize_specialization,
)
from app.services.auth_service import auth_service
from app.database import db

logger = logging.getLogger("campusfix.users")


class UsersService:
    def __init__(self):
        self._users_db: Dict[str, UserInDB] = {}
        self._initialize_seed_users()

    def _initialize_seed_users(self):
        now_iso = datetime.now(timezone.utc).isoformat()

        # Configurable initial Host credentials from environment with fallback
        host_username = os.getenv("INITIAL_HOST_USERNAME", "VAMSI")
        host_password = os.getenv("INITIAL_HOST_PASSWORD", "vamsi@123")

        # 1. Host / Admin Account
        h_hash, h_salt = auth_service.hash_password(host_password)
        host_user = UserInDB(
            id="user-host-vamsi",
            technician_id="HOST-001",
            name="VAMSI",
            username=host_username.lower(),
            email="vamsi@campusfix.edu",
            netid="vamsi",
            role="host",
            specialization=None,
            department="Office of the University CIO & Campus Governance",
            status="active",
            is_active=True,
            phone="+1 (555) 019-9000",
            active_assignments_count=0,
            avatar_initials="VA",
            skills=["Platform Administrator", "System Governance", "SLA Auditing", "Infrastructure Ops"],
            created_at=now_iso,
            password_hash=h_hash,
            password_salt=h_salt,
        )
        self._users_db[host_user.id] = host_user

        # 2. Seed Technicians
        tech_seeds = [
            {
                "id": "user-tech-1",
                "technician_id": "TECH-001",
                "name": "Ramu Kumar",
                "username": "ramu",
                "email": "ramu@university.edu",
                "netid": "ramu",
                "role": "technician",
                "specialization": "Network",
                "department": "Network & Wireless Engineering",
                "password": "ramu@123",
                "phone": "+1 (555) 014-4112",
                "avatar_initials": "RK",
                "skills": ["Eduroam 802.1X", "RADIUS", "Cisco Catalyst", "DNS/DHCP", "Wi-Fi 6E"],
                "active_assignments_count": 2,
            },
            {
                "id": "user-tech-2",
                "technician_id": "TECH-002",
                "name": "Sarah Jenkins",
                "username": "sarah",
                "email": "s.jenkins@university.edu",
                "netid": "s.jenkins",
                "role": "technician",
                "specialization": "IAM / Access",
                "department": "Identity & Access Management",
                "password": "sarah@123",
                "phone": "+1 (555) 018-7721",
                "avatar_initials": "SJ",
                "skills": ["Active Directory", "Duo 2FA", "Shibboleth SSO", "SAML 2.0", "LDAP"],
                "active_assignments_count": 1,
            },
            {
                "id": "user-tech-3",
                "technician_id": "TECH-003",
                "name": "Dave Miller",
                "username": "dave",
                "email": "d.miller@university.edu",
                "netid": "d.miller",
                "role": "technician",
                "specialization": "Hardware",
                "department": "Campus Hardware & Printing Infrastructure",
                "password": "dave@123",
                "phone": "+1 (555) 019-3384",
                "avatar_initials": "DM",
                "skills": ["PaperCut MF", "Kyocera / HP Spoolers", "Lab Workstations", "Peripherals"],
                "active_assignments_count": 1,
            },
            {
                "id": "user-tech-4",
                "technician_id": "TECH-004",
                "name": "Alex Wong",
                "username": "alex",
                "email": "a.wong@university.edu",
                "netid": "a.wong",
                "role": "technician",
                "specialization": "Software",
                "department": "Academic Software & Licensing",
                "password": "alex@123",
                "phone": "+1 (555) 012-9901",
                "avatar_initials": "AW",
                "skills": ["Canvas LMS", "MATLAB", "Adobe Creative Cloud", "VMware Horizon"],
                "active_assignments_count": 1,
            },
            {
                "id": "user-tech-5",
                "technician_id": "TECH-005",
                "name": "Priya Sharma",
                "username": "priya",
                "email": "p.sharma@university.edu",
                "netid": "p.sharma",
                "role": "technician",
                "specialization": "Support",
                "department": "Student IT Help Bar & Walkup Center",
                "password": "priya@123",
                "phone": "+1 (555) 017-6644",
                "avatar_initials": "PS",
                "skills": ["First Contact Resolution", "Device Onboarding", "OS Diagnostics", "VPN"],
                "active_assignments_count": 1,
            },
        ]

        for ts in tech_seeds:
            p_hash, p_salt = auth_service.hash_password(ts["password"])
            tech_user = UserInDB(
                id=ts["id"],
                technician_id=ts["technician_id"],
                name=ts["name"],
                username=ts["username"],
                email=ts["email"],
                netid=ts["netid"],
                role="technician",
                specialization=ts["specialization"],
                department=ts["department"],
                status="active",
                is_active=True,
                phone=ts.get("phone"),
                active_assignments_count=ts.get("active_assignments_count", 0),
                avatar_initials=ts["avatar_initials"],
                skills=ts["skills"],
                created_at=now_iso,
                password_hash=p_hash,
                password_salt=p_salt,
            )
            self._users_db[tech_user.id] = tech_user

        # 3. Seed Students
        student_seeds = [
            {
                "id": "user-student-1",
                "name": "Marcus Chen",
                "username": "student",
                "email": "m.chen@university.edu",
                "netid": "m.chen",
                "role": "student",
                "department": "Computer Science & Engineering",
                "password": "student@123",
                "avatar_initials": "MC",
            },
            {
                "id": "user-student-2",
                "name": "Priya Patel",
                "username": "k.patel",
                "email": "k.patel@university.edu",
                "netid": "k.patel",
                "role": "student",
                "department": "School of Business",
                "password": "student@123",
                "avatar_initials": "PP",
            },
        ]

        for st in student_seeds:
            s_hash, s_salt = auth_service.hash_password(st["password"])
            stu_user = UserInDB(
                id=st["id"],
                technician_id=None,
                name=st["name"],
                username=st["username"],
                email=st["email"],
                netid=st["netid"],
                role="student",
                specialization=None,
                department=st["department"],
                status="active",
                is_active=True,
                phone=None,
                active_assignments_count=0,
                avatar_initials=st["avatar_initials"],
                skills=["Student User"],
                created_at=now_iso,
                password_hash=s_hash,
                password_salt=s_salt,
            )
            self._users_db[stu_user.id] = stu_user

    def sync_to_db(self):
        """Seeds initial memory users into PostgreSQL if users table is empty."""
        if not db.is_connected():
            return
        try:
            with db.get_cursor(commit=True) as cur:
                cur.execute("SELECT COUNT(*) AS count FROM users;")
                count = cur.fetchone()["count"]
                if count == 0:
                    logger.info("Seeding initial users into PostgreSQL users table...")
                    for u in self._users_db.values():
                        cur.execute(
                            """
                            INSERT INTO users (
                                id, technician_id, name, username, email, netid, role,
                                specialization, department, status, is_active, phone,
                                active_assignments_count, avatar_initials, skills,
                                password_hash, password_salt, created_at
                            ) VALUES (
                                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                            ) ON CONFLICT (id) DO NOTHING;
                            """,
                            (
                                u.id,
                                u.technician_id,
                                u.name,
                                u.username.lower(),
                                u.email.lower(),
                                u.netid.lower(),
                                u.role,
                                u.specialization,
                                u.department,
                                u.status,
                                u.is_active,
                                u.phone,
                                u.active_assignments_count,
                                u.avatar_initials,
                                json.dumps(u.skills),
                                u.password_hash,
                                u.password_salt,
                                u.created_at or datetime.now(timezone.utc).isoformat(),
                            ),
                        )
                    logger.info(f"Seeded {len(self._users_db)} users into Neon PostgreSQL.")
        except Exception as e:
            logger.error(f"Error syncing users to DB: {e}")

    def _row_to_user_in_db(self, row: Dict[str, Any]) -> UserInDB:
        skills = row.get("skills")
        if isinstance(skills, str):
            try:
                skills = json.loads(skills)
            except Exception:
                skills = []
        elif not isinstance(skills, list):
            skills = []

        return UserInDB(
            id=row["id"],
            technician_id=row.get("technician_id"),
            name=row["name"],
            username=row["username"],
            email=row["email"],
            netid=row.get("netid", row["username"]),
            roll_number=row.get("roll_number"),
            role=row["role"],
            specialization=row.get("specialization"),
            department=row["department"],
            status=row.get("status", "active"),
            is_active=row.get("is_active", True),
            phone=row.get("phone"),
            active_assignments_count=row.get("active_assignments_count", 0),
            avatar_initials=row.get("avatar_initials", "U"),
            skills=skills,
            created_at=str(row.get("created_at") or datetime.now(timezone.utc).isoformat()),
            password_hash=row.get("password_hash"),
            password_salt=row.get("password_salt"),
        )

    def _to_campus_user(self, user_in_db: UserInDB) -> CampusUser:
        return CampusUser(
            id=user_in_db.id,
            technician_id=user_in_db.technician_id,
            name=user_in_db.name,
            username=user_in_db.username,
            email=user_in_db.email,
            netid=user_in_db.netid,
            roll_number=user_in_db.roll_number,
            role=user_in_db.role,
            specialization=user_in_db.specialization,
            department=user_in_db.department,
            status=user_in_db.status,
            is_active=user_in_db.is_active,
            phone=user_in_db.phone,
            active_assignments_count=user_in_db.active_assignments_count,
            avatar_initials=user_in_db.avatar_initials,
            skills=user_in_db.skills,
            created_at=user_in_db.created_at,
            authenticated=True,
        )

    def find_user_by_username_or_id(self, identifier: str) -> Optional[UserInDB]:
        clean_id = identifier.strip().lower()

        if db.is_connected():
            try:
                with db.get_cursor(commit=False) as cur:
                    cur.execute(
                        """
                        SELECT * FROM users
                        WHERE LOWER(id) = %s
                           OR LOWER(username) = %s
                           OR LOWER(netid) = %s
                           OR LOWER(email) = %s
                           OR LOWER(COALESCE(technician_id, '')) = %s
                        LIMIT 1;
                        """,
                        (clean_id, clean_id, clean_id, clean_id, clean_id),
                    )
                    row = cur.fetchone()
                    if row:
                        user = self._row_to_user_in_db(row)
                        self._users_db[user.id] = user
                        return user
            except Exception as e:
                logger.error(f"Error querying user from DB: {e}")

        # In-memory fallback
        for u in self._users_db.values():
            if (
                u.id.lower() == clean_id
                or u.username.lower() == clean_id
                or u.netid.lower() == clean_id
                or (u.roll_number and u.roll_number.lower() == clean_id)
                or u.email.lower() == clean_id
                or (u.technician_id and u.technician_id.lower() == clean_id)
            ):
                return u
        return None

    def get_or_create_student(self, name: str, roll_number: str, phone: str) -> CampusUser:
        """Retrieves or registers an authenticated student account by roll number."""
        clean_roll = roll_number.strip().upper()
        clean_name = name.strip()
        clean_phone = phone.strip()

        # Check existing by roll number or username
        for u in self._users_db.values():
            if u.role == "student" and (
                (u.roll_number and u.roll_number.upper() == clean_roll)
                or u.username.upper() == clean_roll
                or (u.phone and u.phone == clean_phone)
            ):
                # Update name/phone if changed
                u.name = clean_name
                u.roll_number = clean_roll
                u.phone = clean_phone
                return self._to_campus_user(u)

        now_iso = datetime.now(timezone.utc).isoformat()
        initials = "".join([part[0].upper() for part in clean_name.split() if part])[:2] or "ST"
        new_id = f"user-stu-{clean_roll.lower().replace(' ', '-')}"
        email = f"{clean_roll.lower()}@university.edu"

        stu_user = UserInDB(
            id=new_id,
            technician_id=None,
            name=clean_name,
            username=clean_roll.lower(),
            email=email,
            netid=clean_roll.lower(),
            roll_number=clean_roll,
            role="student",
            specialization=None,
            department="Student Computing & Campus IT Services",
            status="active",
            is_active=True,
            phone=clean_phone,
            active_assignments_count=0,
            avatar_initials=initials,
            skills=["Student User"],
            created_at=now_iso,
            password_hash=None,
            password_salt=None,
        )
        self._users_db[new_id] = stu_user
        return self._to_campus_user(stu_user)

    def authenticate(
        self,
        username: str,
        password: str,
        specialization: Optional[str] = None,
        role: Optional[str] = None,
    ) -> Tuple[Optional[CampusUser], Optional[str]]:
        user_in_db = self.find_user_by_username_or_id(username)
        if not user_in_db:
            return None, "Invalid credentials. Account not found."

        if not user_in_db.is_active:
            return None, "This account is inactive. Please contact the Host / Administrator."

        # Verify password
        if not auth_service.verify_password(password, user_in_db.password_hash, user_in_db.password_salt):
            return None, "Invalid credentials. Incorrect password."

        # Validate Role consistency if requested
        if role:
            req_role = role.lower()
            if req_role == "host" and user_in_db.role not in ["host", "admin"]:
                return None, "Access denied. This account does not possess Host / Administrator authority."
            if req_role == "technician" and user_in_db.role not in ["technician", "admin", "host"]:
                return None, "Access denied. This account is not registered as a technician."

        # Validate Technician Specialization if technician
        if user_in_db.role == "technician" and specialization:
            norm_req = normalize_specialization(specialization)
            norm_db = normalize_specialization(user_in_db.specialization)
            if norm_db and norm_req and norm_db.lower() != norm_req.lower():
                return None, (
                    f"Specialization mismatch: Account '{user_in_db.name}' is assigned to "
                    f"'{user_in_db.specialization}', but '{specialization}' was selected."
                )

        return self._to_campus_user(user_in_db), None

    def list_users(self, role: Optional[str] = None) -> List[CampusUser]:
        if db.is_connected():
            try:
                with db.get_cursor(commit=False) as cur:
                    if role and role.lower() != "all":
                        req_role = role.lower()
                        if req_role == "admin":
                            cur.execute("SELECT * FROM users WHERE role IN ('admin', 'host') ORDER BY created_at ASC;")
                        else:
                            cur.execute("SELECT * FROM users WHERE LOWER(role) = %s ORDER BY created_at ASC;", (req_role,))
                    else:
                        cur.execute("SELECT * FROM users ORDER BY created_at ASC;")
                    rows = cur.fetchall()
                    return [self._to_campus_user(self._row_to_user_in_db(r)) for r in rows]
            except Exception as e:
                logger.error(f"Error listing users from DB: {e}")

        # In-memory fallback
        users = [self._to_campus_user(u) for u in self._users_db.values()]
        if role and role.lower() != "all":
            req_role = role.lower()
            if req_role == "admin":
                return [u for u in users if u.role in ["admin", "host"]]
            return [u for u in users if u.role.lower() == req_role]
        return users

    def get_user(self, user_id: str) -> Optional[CampusUser]:
        u = self.find_user_by_username_or_id(user_id)
        return self._to_campus_user(u) if u else None

    def list_technicians(self) -> List[CampusUser]:
        return self.list_users(role="technician")

    def get_technicians(self) -> List[CampusUser]:
        return self.list_technicians()

    def get_technician(self, tech_id: str) -> Optional[CampusUser]:
        u = self.find_user_by_username_or_id(tech_id)
        if u and u.role in ["technician", "admin", "host"]:
            return self._to_campus_user(u)
        return None

    def create_technician(self, data: TechnicianCreateRequest) -> Tuple[Optional[CampusUser], Optional[str]]:
        if self.find_user_by_username_or_id(data.username):
            return None, f"Username '{data.username}' is already taken."
        if self.find_user_by_username_or_id(data.email):
            return None, f"Email '{data.email}' is already registered."

        now_iso = datetime.now(timezone.utc).isoformat()

        # Generate technician ID if not provided (e.g. TECH-006)
        if data.technician_id:
            tech_id = data.technician_id
        else:
            existing_users = self.list_users()
            existing_nums = []
            for u in existing_users:
                if u.technician_id and u.technician_id.startswith("TECH-"):
                    try:
                        num = int(u.technician_id.split("-")[1])
                        existing_nums.append(num)
                    except ValueError:
                        pass
            next_num = (max(existing_nums) + 1) if existing_nums else 1
            tech_id = f"TECH-{next_num:03d}"

        initials = "".join([part[0].upper() for part in data.name.strip().split() if part])[:2] or "TC"
        pwd_hash, pwd_salt = auth_service.hash_password(data.password)
        new_id = f"user-tech-{random.randint(1000, 9999)}"

        new_user = UserInDB(
            id=new_id,
            technician_id=tech_id,
            name=data.name.strip(),
            username=data.username.strip().lower(),
            email=data.email.strip().lower(),
            netid=data.username.strip().lower(),
            role="technician",
            specialization=data.specialization,
            department=data.department or f"{data.specialization} Operations",
            status="active",
            is_active=data.is_active,
            phone=data.phone,
            active_assignments_count=0,
            avatar_initials=initials,
            skills=data.skills or [f"{data.specialization} Support"],
            created_at=now_iso,
            password_hash=pwd_hash,
            password_salt=pwd_salt,
        )

        self._users_db[new_id] = new_user

        if db.is_connected():
            try:
                with db.get_cursor(commit=True) as cur:
                    cur.execute(
                        """
                        INSERT INTO users (
                            id, technician_id, name, username, email, netid, role,
                            specialization, department, status, is_active, phone,
                            active_assignments_count, avatar_initials, skills,
                            password_hash, password_salt, created_at
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        );
                        """,
                        (
                            new_user.id,
                            new_user.technician_id,
                            new_user.name,
                            new_user.username,
                            new_user.email,
                            new_user.netid,
                            new_user.role,
                            new_user.specialization,
                            new_user.department,
                            new_user.status,
                            new_user.is_active,
                            new_user.phone,
                            new_user.active_assignments_count,
                            new_user.avatar_initials,
                            json.dumps(new_user.skills),
                            new_user.password_hash,
                            new_user.password_salt,
                            new_user.created_at,
                        ),
                    )
            except Exception as e:
                logger.error(f"Error creating technician in DB: {e}")

        return self._to_campus_user(new_user), None

    def update_technician(
        self,
        tech_id: str,
        data: TechnicianUpdateRequest,
    ) -> Tuple[Optional[CampusUser], Optional[str]]:
        user_in_db = self.find_user_by_username_or_id(tech_id)
        if not user_in_db or user_in_db.role not in ["technician", "admin", "host"]:
            return None, f"Technician '{tech_id}' not found."

        if data.name is not None:
            user_in_db.name = data.name.strip()
            initials = "".join([part[0].upper() for part in user_in_db.name.split() if part])[:2]
            user_in_db.avatar_initials = initials or user_in_db.avatar_initials

        if data.username is not None:
            new_un = data.username.strip().lower()
            existing = self.find_user_by_username_or_id(new_un)
            if existing and existing.id != user_in_db.id:
                return None, f"Username '{new_un}' is already in use."
            user_in_db.username = new_un
            user_in_db.netid = new_un

        if data.email is not None:
            new_em = data.email.strip().lower()
            existing = self.find_user_by_username_or_id(new_em)
            if existing and existing.id != user_in_db.id:
                return None, f"Email '{new_em}' is already in use."
            user_in_db.email = new_em

        if data.specialization is not None:
            user_in_db.specialization = data.specialization

        if data.department is not None:
            user_in_db.department = data.department

        if data.phone is not None:
            user_in_db.phone = data.phone

        if data.status is not None:
            user_in_db.status = data.status

        if data.is_active is not None:
            user_in_db.is_active = data.is_active

        if data.skills is not None:
            user_in_db.skills = data.skills

        if data.password:
            p_hash, p_salt = auth_service.hash_password(data.password)
            user_in_db.password_hash = p_hash
            user_in_db.password_salt = p_salt

        self._users_db[user_in_db.id] = user_in_db

        if db.is_connected():
            try:
                with db.get_cursor(commit=True) as cur:
                    cur.execute(
                        """
                        UPDATE users SET
                            name = %s,
                            username = %s,
                            email = %s,
                            netid = %s,
                            specialization = %s,
                            department = %s,
                            phone = %s,
                            status = %s,
                            is_active = %s,
                            skills = %s,
                            avatar_initials = %s,
                            password_hash = %s,
                            password_salt = %s,
                            updated_at = NOW()
                        WHERE id = %s;
                        """,
                        (
                            user_in_db.name,
                            user_in_db.username,
                            user_in_db.email,
                            user_in_db.netid,
                            user_in_db.specialization,
                            user_in_db.department,
                            user_in_db.phone,
                            user_in_db.status,
                            user_in_db.is_active,
                            json.dumps(user_in_db.skills),
                            user_in_db.avatar_initials,
                            user_in_db.password_hash,
                            user_in_db.password_salt,
                            user_in_db.id,
                        ),
                    )
            except Exception as e:
                logger.error(f"Error updating technician in DB: {e}")

        return self._to_campus_user(user_in_db), None

    def reset_technician_password(self, tech_id: str, new_password: str) -> Tuple[bool, Optional[str]]:
        user_in_db = self.find_user_by_username_or_id(tech_id)
        if not user_in_db:
            return False, f"User '{tech_id}' not found."

        p_hash, p_salt = auth_service.hash_password(new_password)
        user_in_db.password_hash = p_hash
        user_in_db.password_salt = p_salt
        self._users_db[user_in_db.id] = user_in_db

        if db.is_connected():
            try:
                with db.get_cursor(commit=True) as cur:
                    cur.execute(
                        "UPDATE users SET password_hash = %s, password_salt = %s, updated_at = NOW() WHERE id = %s;",
                        (p_hash, p_salt, user_in_db.id),
                    )
            except Exception as e:
                logger.error(f"Error resetting password in DB: {e}")

        return True, None

    def change_user_password(
        self,
        user_id: str,
        current_password: str,
        new_password: str,
    ) -> Tuple[bool, Optional[str]]:
        user_in_db = self.find_user_by_username_or_id(user_id)
        if not user_in_db:
            return False, "User account not found."

        if not auth_service.verify_password(current_password, user_in_db.password_hash, user_in_db.password_salt):
            return False, "Current password is incorrect."

        p_hash, p_salt = auth_service.hash_password(new_password)
        user_in_db.password_hash = p_hash
        user_in_db.password_salt = p_salt
        self._users_db[user_in_db.id] = user_in_db

        if db.is_connected():
            try:
                with db.get_cursor(commit=True) as cur:
                    cur.execute(
                        "UPDATE users SET password_hash = %s, password_salt = %s, updated_at = NOW() WHERE id = %s;",
                        (p_hash, p_salt, user_in_db.id),
                    )
            except Exception as e:
                logger.error(f"Error changing user password in DB: {e}")

        return True, None

    def update_user_status(self, user_id: str, status_val: str) -> Optional[CampusUser]:
        user_in_db = self.find_user_by_username_or_id(user_id)
        if user_in_db and status_val in ["active", "away", "offline"]:
            user_in_db.status = status_val  # type: ignore
            self._users_db[user_in_db.id] = user_in_db

            if db.is_connected():
                try:
                    with db.get_cursor(commit=True) as cur:
                        cur.execute("UPDATE users SET status = %s, updated_at = NOW() WHERE id = %s;", (status_val, user_in_db.id))
                except Exception as e:
                    logger.error(f"Error updating user status in DB: {e}")

            return self._to_campus_user(user_in_db)
        return None

    def reset_data(self) -> Dict[str, Any]:
        """Resets users/technicians to clean initial state."""
        self.__init__()
        if db.is_connected():
            try:
                with db.get_cursor(commit=True) as cur:
                    cur.execute("DELETE FROM users;")
                    for u in self._users_db.values():
                        self._save_user_to_db(u, cur=cur)
            except Exception as e:
                logger.error(f"Error resetting users in DB: {e}")
        return {"status": "success", "message": "All users reset to clean state."}


users_service = UsersService()
