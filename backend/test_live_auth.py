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
print("   CAMPUSFIX AI - AUTHENTICATION & RBAC TEST SUITE ")
print("==================================================")

# 1. Live Health Check
status, data = req("GET", "/api/health")
assert status == 200, f"Health check failed: {status}"
print("[PASS] 1. Live Health Check: 200 OK")

# 2. Student Authentication (Name + Roll Number + Password)
# 2a. Student Login with valid Name + Roll Number + Password
status, data = req("POST", "/api/auth/student/login", {
    "name": "Aarav Sharma",
    "roll_number": "211FA04001",
    "password": "aarav@password123"
})
assert status == 200, f"Student login failed: {data}"
assert data.get("authenticated") is True
assert data["user"]["name"] == "Aarav Sharma"
assert data["user"]["roll_number"] == "211FA04001"
assert data["user"]["role"] == "student"
student_token = data["token"]
print(f"[PASS] 2. Student Login Success: {data['user']['name']} (Roll: {data['user']['roll_number']}, Role: {data['user']['role']})")

# 2b. Student Login with WRONG Password (Must reject with 401)
status, data = req("POST", "/api/auth/student/login", {
    "name": "Aarav Sharma",
    "roll_number": "211FA04001",
    "password": "WrongPassword999!"
})
assert status == 401, f"Expected 401 for wrong password, got {status}"
print(f"[PASS] 3. Student Wrong Password Rejected: 401 Unauthorized ({data.get('detail')})")

# 2c. Student /api/auth/me Profile Verification
status, data = req("GET", "/api/auth/me", token=student_token)
assert status == 200, f"Failed /api/auth/me for student: {data}"
assert data["name"] == "Aarav Sharma"
assert data["roll_number"] == "211FA04001"
print(f"[PASS] 4. /api/auth/me Validated for Student: {data['name']} (Roll: {data['roll_number']})")

# 3. Staff / Technician Logins (Demonstrating Multi-User Staff Identity without Ramu default)
# 3a. Staff Login: Sarah Jenkins (IAM / Access)
status, data = req("POST", "/api/auth/login", {
    "username": "sarah",
    "password": "sarah@123",
    "specialization": "IAM / Access",
    "role": "technician"
})
assert status == 200, f"Sarah login failed: {data}"
assert data["user"]["name"] == "Sarah Jenkins"
assert data["user"]["specialization"] == "IAM / Access"
sarah_token = data["token"]
print(f"[PASS] 5. Staff Login (Sarah): {data['user']['name']} (Spec: {data['user']['specialization']}) — Confirmed NOT Ramu")

# 3b. Staff Login: Dave Miller (Hardware)
status, data = req("POST", "/api/auth/login", {
    "username": "dave",
    "password": "dave@123",
    "specialization": "Hardware",
    "role": "technician"
})
assert status == 200, f"Dave login failed: {data}"
assert data["user"]["name"] == "Dave Miller"
assert data["user"]["specialization"] == "Hardware"
print(f"[PASS] 6. Staff Login (Dave): {data['user']['name']} (Spec: {data['user']['specialization']}) — Confirmed NOT Ramu")

# 3c. Staff Login: Ramu Kumar (Network)
status, data = req("POST", "/api/auth/login", {
    "username": "ramu",
    "password": "ramu@123",
    "specialization": "Network",
    "role": "technician"
})
assert status == 200, f"Ramu login failed: {data}"
assert data["user"]["name"] == "Ramu Kumar"
tech_token = data["token"]
print(f"[PASS] 7. Staff Login (Ramu): {data['user']['name']} (Spec: {data['user']['specialization']})")

# 4. Host Login (vamsi / vamsi@123)
status, data = req("POST", "/api/auth/login", {
    "username": "vamsi",
    "password": "vamsi@123",
    "role": "host"
})
assert status == 200, f"Host login failed: {data}"
assert data["user"]["name"].lower() == "vamsi"
assert data["user"]["role"] == "host"
host_token = data["token"]
print(f"[PASS] 8. Host Login: {data['user']['name']} ({data['user']['role']})")

# 5. Role-Based Access Control (RBAC) Protections
# 5a. Student blocked from Host endpoints
status, data = req(
    "POST",
    "/api/technicians",
    {"name": "Fake Tech", "username": "fake", "email": "f@test.com", "password": "pwd", "specialization": "Network"},
    token=student_token,
)
assert status == 403, f"Expected 403, got {status}"
print(f"[PASS] 9. Student Blocked from Host Endpoint: 403 Forbidden")

# 5b. Technician blocked from Host-only endpoints
status, data = req(
    "POST",
    "/api/technicians",
    {"name": "Fake Tech 2", "username": "fake2", "email": "f2@test.com", "password": "pwd", "specialization": "Network"},
    token=sarah_token,
)
assert status == 403, f"Expected 403, got {status}"
print(f"[PASS] 10. Technician Blocked from Host Provisioning: 403 Forbidden")

# 5c. Unauthenticated request rejected
status, data = req("GET", "/api/auth/me")
assert status == 401, f"Expected 401, got {status}"
print(f"[PASS] 11. Unauthenticated Request Rejected: 401 Unauthorized")

# 6. Host Operations: Provision New Tech
status, data = req(
    "POST",
    "/api/technicians",
    {
        "name": "Karthik Varma",
        "technician_id": "TECH-009",
        "username": "karthik_v9",
        "email": "karthik.v9@campusfix.edu",
        "password": "securePass@2026",
        "specialization": "Software",
        "department": "Academic Software Services",
    },
    token=host_token,
)
assert status == 201, f"Host provision tech failed: {data}"
karthik_tech = data
print(f"[PASS] 12. Host Provisioned Tech: {karthik_tech['name']} ({karthik_tech['technician_id']})")

# 7. Logout Endpoint
status, data = req("POST", "/api/auth/logout", token=student_token)
assert status == 200, f"Logout failed: {data}"
assert data.get("authenticated") is False
print(f"[PASS] 13. Logout Successful: {data.get('message')}")

print("\n==================================================")
print(">>> ALL 13 AUTH & RBAC TESTS PASSED SUCCESSFULLY! <<<")
print("==================================================")
