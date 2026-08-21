import sys
import os
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)

print("==================================================")
print("   CAMPUSFIX AI - AUTHENTICATION & RBAC TEST SUITE")
print("==================================================")

# 1. Health check
print("\n--- 1. Testing /api/health ---")
r = client.get("/api/health")
assert r.status_code == 200, f"Expected 200, got {r.status_code}"
print("Health Status:", r.json().get("status"), "| Model:", r.json().get("model"))

# 2. Host Login
print("\n--- 2. Testing Initial Host Account (VAMSI / vamsi@123) ---")
r = client.post("/api/auth/login", json={"username": "VAMSI", "password": "vamsi@123", "role": "host"})
assert r.status_code == 200, f"Host login failed: {r.text}"
host_data = r.json()
host_token = host_data["token"]
assert host_data["user"]["role"] == "host"
assert host_data["user"]["name"] == "VAMSI"
print("Host Login Success! Name:", host_data["user"]["name"], "| Role:", host_data["user"]["role"])

# 3. Host Login with wrong password
print("\n--- 3. Testing Host Login with Invalid Password ---")
r = client.post("/api/auth/login", json={"username": "VAMSI", "password": "wrongpassword"})
assert r.status_code == 401, f"Expected 401, got {r.status_code}"
print("Rejected correctly with 401 Unauthorized:", r.json()["detail"])

# 4. Technician Login (Ramu Kumar - TECH-001 - Network)
print("\n--- 4. Testing Technician Login (ramu / ramu@123 / Network) ---")
r = client.post("/api/auth/login", json={"username": "ramu", "password": "ramu@123", "specialization": "Network"})
assert r.status_code == 200, f"Tech login failed: {r.text}"
tech_data = r.json()
tech_token = tech_data["token"]
assert tech_data["user"]["specialization"] == "Network"
assert tech_data["user"]["technician_id"] == "TECH-001"
print(f"Tech Login Success! ID: {tech_data['user']['technician_id']} | Spec: {tech_data['user']['specialization']}")

# 5. Technician Specialization Validation (Mismatch check)
print("\n--- 5. Testing Technician Specialization Mismatch Protection ---")
r = client.post("/api/auth/login", json={"username": "ramu", "password": "ramu@123", "specialization": "Hardware"})
assert r.status_code == 401, f"Expected 401 on mismatch, got {r.status_code}"
print("Specialization mismatch rejected correctly:", r.json()["detail"])

# 6. Student Login (Marcus Chen / student@123)
print("\n--- 6. Testing Student Login (student / student@123) ---")
r = client.post("/api/auth/login", json={"username": "student", "password": "student@123"})
assert r.status_code == 200, f"Student login failed: {r.text}"
student_data = r.json()
student_token = student_data["token"]
assert student_data["user"]["role"] == "student"
print("Student Login Success! Name:", student_data["user"]["name"], "| Role:", student_data["user"]["role"])

# 7. Role-Based Access Control: Student cannot access Host Technician Management
print("\n--- 7. Testing RBAC Security Protection (Student accessing Host API) ---")
r = client.post(
    "/api/technicians",
    json={
        "name": "Hacker Tech",
        "username": "hacker",
        "email": "hacker@test.com",
        "password": "pass",
        "specialization": "Network",
    },
    headers={"Authorization": f"Bearer {student_token}"},
)
assert r.status_code == 403, f"Expected 403 Forbidden for student, got {r.status_code}"
print("Student rejected with 403 Forbidden:", r.json()["detail"])

# 8. Unauthenticated Access Protection
print("\n--- 8. Testing Unauthenticated Access to Protected API ---")
r = client.post(
    "/api/technicians",
    json={
        "name": "Ghost Tech",
        "username": "ghost",
        "email": "ghost@test.com",
        "password": "pass",
        "specialization": "Network",
    },
)
assert r.status_code == 401, f"Expected 401 for unauthenticated request, got {r.status_code}"
print("Unauthenticated request rejected with 401:", r.json()["detail"])

# 9. Host Full Technician Management: Create Technician
print("\n--- 9. Testing Host Creating Technician ---")
r = client.post(
    "/api/technicians",
    json={
        "name": "Deepa Rao",
        "technician_id": "TECH-006",
        "username": "deepa",
        "email": "deepa.rao@university.edu",
        "password": "deepa@password123",
        "specialization": "Software",
        "department": "Academic Software Services",
        "phone": "+1 (555) 019-8811",
        "skills": ["Canvas LMS", "MATLAB", "Adobe CC", "Python Tools"],
    },
    headers={"Authorization": f"Bearer {host_token}"},
)
assert r.status_code == 201, f"Failed to create tech: {r.text}"
new_tech = r.json()
print(f"Created Technician: {new_tech['name']} ({new_tech['technician_id']}) - Spec: {new_tech['specialization']}")

# 10. Host Updates Technician Details
print("\n--- 10. Testing Host Editing Technician Specialization & Details ---")
r = client.put(
    f"/api/technicians/{new_tech['id']}",
    json={
        "specialization": "Support",
        "department": "Enterprise IT Tier-1 & Tier-2 Support",
        "phone": "+1 (555) 019-9999",
    },
    headers={"Authorization": f"Bearer {host_token}"},
)
assert r.status_code == 200, f"Failed to update tech: {r.text}"
updated_tech = r.json()
assert updated_tech["specialization"] == "Support"
print(f"Updated Specialization to '{updated_tech['specialization']}' successfully!")

# 11. Host Resets Technician Password
print("\n--- 11. Testing Host Resetting Technician Password ---")
r = client.post(
    f"/api/technicians/{new_tech['id']}/reset-password",
    json={"new_password": "NewSecretPassword2026!"},
    headers={"Authorization": f"Bearer {host_token}"},
)
assert r.status_code == 200, f"Failed to reset tech password: {r.text}"
print("Technician Password Reset Message:", r.json()["message"])

# 12. New Technician Login with New Password
print("\n--- 12. Testing New Technician Login with Updated Password & Specialization ---")
r = client.post(
    "/api/auth/login",
    json={
        "username": "deepa",
        "password": "NewSecretPassword2026!",
        "specialization": "Support",
    },
)
assert r.status_code == 200, f"New tech login failed: {r.text}"
print("New technician logged in successfully after Host reset!")

# 13. Technician Ticket Escalation Workflow
print("\n--- 13. Testing Technician Escalation with Target Specialization ---")
r = client.post(
    "/api/tickets/ticket-101/escalate",
    json={
        "tier": "Tier-2 Technical Escalation",
        "department": "Network & Wireless Engineering",
        "reason": "802.1X Root CA certificate trust loop requires AP cluster trace and packet capture.",
        "original_technician": "Ramu Kumar (TECH-001)",
        "target_specialization": "Network",
        "assigned_to": "Sarah Jenkins (Tech Bar Lead)",
        "tech_bar_location": "Main Library, 1st Floor Tech Bar",
        "student_id_required": True,
        "notes": "Verified client device OS is Android 14. RADIUS node responding nominally.",
    },
    headers={"Authorization": f"Bearer {tech_token}"},
)
assert r.status_code == 200, f"Escalation failed: {r.text}"
esc_ticket = r.json()
assert esc_ticket["status"] == "Escalated"
assert esc_ticket["escalation_info"]["target_specialization"] == "Network"
print("Ticket successfully escalated. Status:", esc_ticket["status"], "| Reason:", esc_ticket["escalation_info"]["reason"][:60], "...")

# 14. Host Changes Own Password
print("\n--- 14. Testing Host Self Password Change ---")
r = client.post(
    "/api/auth/change-password",
    json={
        "current_password": "vamsi@123",
        "new_password": "VamsiAdmin2026!",
    },
    headers={"Authorization": f"Bearer {host_token}"},
)
assert r.status_code == 200, f"Host password change failed: {r.text}"
print("Host Password Changed:", r.json()["message"])

# Verify login with new Host password
r = client.post("/api/auth/login", json={"username": "VAMSI", "password": "VamsiAdmin2026!"})
assert r.status_code == 200, f"Login with new host password failed: {r.text}"
print("Host successfully logged in with new password!")

# Reset back to default vamsi@123 for demo consistency
client.post(
    "/api/auth/change-password",
    json={"current_password": "VamsiAdmin2026!", "new_password": "vamsi@123"},
    headers={"Authorization": f"Bearer {r.json()['token']}"},
)

# 15. Verify Existing APIs continue functioning
print("\n--- 15. Verifying All Existing Platform APIs ---")
kb_res = client.get("/api/kb")
assert kb_res.status_code == 200
status_res = client.get("/api/status")
assert status_res.status_code == 200
kpis_res = client.get("/api/analytics/kpis")
assert kpis_res.status_code == 200
reports_res = client.get("/api/reports")
assert reports_res.status_code == 200
probes_res = client.get("/api/diagnostics/probes")
assert probes_res.status_code == 200
db_res = client.get("/api/admin/database")
assert db_res.status_code == 200
specs_res = client.get("/api/auth/specializations")
assert specs_res.status_code == 200
assert len(specs_res.json()["specializations"]) >= 6

print("\n==================================================")
print(">>> ALL 15 AUTH & RBAC BACKEND TESTS PASSED! <<<")
print("==================================================")
