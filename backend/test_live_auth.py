import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
BASE = "http://127.0.0.1:8000"


def req(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if method == "GET":
        res = client.get(path, headers=headers)
    elif method == "POST":
        res = client.post(path, json=data, headers=headers)
    elif method == "PUT":
        res = client.put(path, json=data, headers=headers)
    elif method == "PATCH":
        res = client.patch(path, json=data, headers=headers)
    elif method == "DELETE":
        res = client.delete(path, headers=headers)
    else:
        res = client.request(method, path, json=data, headers=headers)
    
    try:
        return res.status_code, res.json()
    except Exception:
        return res.status_code, {"detail": res.text}


print("==================================================")
print("   CAMPUSFIX AI - LIVE HTTP AUTHENTICATION TESTS  ")
print("==================================================")

# 1. Health
status, data = req("GET", "/api/health")
assert status == 200, f"Health check failed: {status}"
print("[PASS] 1. Live Health Check: 200 OK")

# 2. Host Login (VAMSI / vamsi@123)
status, data = req("POST", "/api/auth/login", {"username": "VAMSI", "password": "vamsi@123", "role": "host"})
assert status == 200, f"Host login failed: {data}"
host_token = data["token"]
print(f"[PASS] 2. Host Login Success: {data['user']['name']} ({data['user']['role']})")

# 3. Technician Login (ramu / ramu@123 / Network)
status, data = req("POST", "/api/auth/login", {"username": "ramu", "password": "ramu@123", "specialization": "Network"})
assert status == 200, f"Technician login failed: {data}"
tech_token = data["token"]
print(f"[PASS] 3. Technician Login Success: {data['user']['name']} ({data['user']['technician_id']}, Spec: {data['user']['specialization']})")

# 4. Technician Specialization Mismatch
status, data = req("POST", "/api/auth/login", {"username": "ramu", "password": "ramu@123", "specialization": "Software"})
assert status == 401, f"Expected 401, got {status}"
print(f"[PASS] 4. Specialization Mismatch Rejected: 401 Unauthorized ({data.get('detail')})")

# 5. Student Login (student / student@123)
status, data = req("POST", "/api/auth/login", {"username": "student", "password": "student@123"})
assert status == 200, f"Student login failed: {data}"
student_token = data["token"]
print(f"[PASS] 5. Student Login Success: {data['user']['name']} ({data['user']['role']})")

# 6. RBAC Protection: Student token trying to create technician
status, data = req(
    "POST",
    "/api/technicians",
    {"name": "Unauthorized Tech", "username": "unauth", "email": "u@test.com", "password": "pwd", "specialization": "Network"},
    token=student_token,
)
assert status == 403, f"Expected 403, got {status}"
print(f"[PASS] 6. Student Blocked from Host API: 403 Forbidden ({data.get('detail')})")

# 7. Unauthenticated request to /api/technicians
status, data = req(
    "POST",
    "/api/technicians",
    {"name": "Ghost Tech", "username": "ghost", "email": "g@test.com", "password": "pwd", "specialization": "Network"},
)
assert status == 401, f"Expected 401, got {status}"
print(f"[PASS] 7. Unauthenticated Request Blocked: 401 Unauthorized ({data.get('detail')})")

# 8. Host Provisions New Technician
status, data = req(
    "POST",
    "/api/technicians",
    {
        "name": "Karthik Varma",
        "technician_id": "TECH-007",
        "username": "karthik",
        "email": "karthik.v@university.edu",
        "password": "karthik@secure123",
        "specialization": "Network",
        "department": "Campus Network Engineering",
        "phone": "+1 (555) 018-4499",
    },
    token=host_token,
)
assert status == 201, f"Host create tech failed: {data}"
new_tech = data
print(f"[PASS] 8. Host Provisioned Technician: {new_tech['name']} ({new_tech['technician_id']})")

# 9. Host Edits Technician Specialization
status, data = req(
    "PUT",
    f"/api/technicians/{new_tech['id']}",
    {"specialization": "IAM / Access", "department": "Identity & Access Infrastructure"},
    token=host_token,
)
assert status == 200, f"Host edit tech failed: {data}"
print(f"[PASS] 9. Host Changed Specialization to: {data['specialization']}")

# 10. Host Resets Technician Password
status, data = req(
    "POST",
    f"/api/technicians/{new_tech['id']}/reset-password",
    {"new_password": "NewResetPassword2026!"},
    token=host_token,
)
assert status == 200, f"Host reset pwd failed: {data}"
print(f"[PASS] 10. Host Reset Password: {data.get('message')}")

# 11. New Technician Login with Updated Specialization & Reset Password
status, data = req(
    "POST",
    "/api/auth/login",
    {"username": "karthik", "password": "NewResetPassword2026!", "specialization": "IAM / Access"},
)
assert status == 200, f"New tech login failed: {data}"
print(f"[PASS] 11. New Tech Logged in: {data['user']['name']} (Spec: {data['user']['specialization']})")

# 12. Technician Escalation
status, data = req(
    "POST",
    "/api/tickets/ticket-101/escalate",
    {
        "tier": "Tier-2 Technical Escalation",
        "department": "Network & Wireless Engineering",
        "reason": "PEAP phase 2 handshake packet drop requires AP telemetry capture.",
        "original_technician": "Ramu Kumar (TECH-001)",
        "target_specialization": "Network",
        "assigned_to": "Tier-2 Network Queue",
        "tech_bar_location": "Main Library Tech Bar",
        "student_id_required": True,
        "notes": "Verified client configuration CA domain university.edu.",
    },
    token=tech_token,
)
assert status == 200, f"Escalation failed: {data}"
print(f"[PASS] 12. Ticket Escalated: {data['ticket_number']} -> Status: {data['status']}")

# 13. Host Changes Password and Logs In
status, data = req(
    "POST",
    "/api/auth/change-password",
    {"current_password": "vamsi@123", "new_password": "VamsiHost2026!"},
    token=host_token,
)
assert status == 200, f"Host change password failed: {data}"
print(f"[PASS] 13. Host Password Changed: {data.get('message')}")

status, data = req("POST", "/api/auth/login", {"username": "VAMSI", "password": "VamsiHost2026!"})
assert status == 200, f"Login with new host password failed: {data}"
print("[PASS] 14. Host Logged in with New Password!")

# Revert password back to vamsi@123 for demo consistency
req("POST", "/api/auth/change-password", {"current_password": "VamsiHost2026!", "new_password": "vamsi@123"}, token=data["token"])

print("\n==================================================")
print(">>> ALL 14 LIVE HTTP NETWORK TESTS PASSED! <<<")
print("==================================================")
