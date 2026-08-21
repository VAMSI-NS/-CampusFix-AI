import urllib.request
import urllib.error
import json
import sys

BASE = "http://127.0.0.1:8000"


def make_request(method, path, data=None, token=None):
    url = f"{BASE}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    body = json.dumps(data).encode("utf-8") if data is not None else None
    try:
        with urllib.request.urlopen(req, data=body, timeout=10) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"detail": err_body}


print("================================================================")
print("     CAMPUSFIX AI - PHASE 2 RBAC & TECHNICIAN SUITE TEST        ")
print("================================================================")

# 1. Host Login
print("\n[1] Testing Host Login with existing credentials (VAMSI / vamsi@123)...")
status, host_auth = make_request("POST", "/api/auth/login", {
    "username": "VAMSI",
    "password": "vamsi@123",
    "role": "host",
})
assert status == 200, f"Host login failed: {host_auth}"
host_token = host_auth["token"]
host_user = host_auth["user"]
assert host_user["role"] == "host", "Host role mismatch"
assert "password" not in host_user and "password_hash" not in host_user, "Security violation: password exposed in host response!"
print(f"  -> SUCCESS! Logged in as Host: {host_user['name']} (Role: {host_user['role']})")

# 2. Host Provision New Technician
print("\n[2] Testing Host Provisioning of a New Technician (Anand Sen / Network Technician)...")
new_tech_data = {
    "name": "Anand Sen",
    "username": "anand",
    "email": "anand.sen@university.edu",
    "password": "anand@123",
    "specialization": "Network Technician",
    "department": "Network & Wireless Engineering",
    "phone": "+1 (555) 019-7733",
    "is_active": True,
    "skills": ["Eduroam 802.1X", "Wi-Fi 6E", "Cisco Catalyst"],
}
status, created_tech = make_request("POST", "/api/technicians", new_tech_data, token=host_token)
assert status in [200, 201], f"Failed to create technician: {created_tech}"
assert created_tech["username"] == "anand", "Technician username mismatch"
assert "password" not in created_tech and "password_hash" not in created_tech, "Security violation: password exposed in tech creation response!"
tech_id = created_tech["id"]
print(f"  -> SUCCESS! Created Tech: {created_tech['name']} (ID: {created_tech['technician_id']}, Spec: {created_tech['specialization']})")

# 3. Technician Login with Assigned Credentials & Specialization
print("\n[3] Testing Technician Login (anand / anand@123 / Network Technician)...")
status, tech_auth = make_request("POST", "/api/auth/login", {
    "username": "anand",
    "password": "anand@123",
    "specialization": "Network Technician",
    "role": "technician",
})
assert status == 200, f"Technician login failed: {tech_auth}"
tech_token = tech_auth["token"]
tech_user = tech_auth["user"]
assert tech_user["role"] == "technician", "Role mismatch"
print(f"  -> SUCCESS! Technician {tech_user['name']} authenticated with token!")

# 4. Security RBAC: Technician attempting Host Action (Must be Forbidden 403)
print("\n[4] Testing RBAC Security: Technician attempting to create another technician (Must fail with 403)...")
status, forbidden_res = make_request("POST", "/api/technicians", {
    "name": "Hacker Tech",
    "username": "hacker",
    "email": "hacker@university.edu",
    "password": "hack@123",
    "specialization": "Software",
}, token=tech_token)
assert status == 403, f"Expected 403 Forbidden, got {status}: {forbidden_res}"
print(f"  -> SUCCESS! Backend correctly rejected unauthorized technician request with HTTP 403 Forbidden: {forbidden_res.get('detail')}")

# 5. Host Edit Technician Details & Specialization
print("\n[5] Testing Host Editing Technician Specialization and Status...")
update_data = {
    "name": "Anand Sen (Senior)",
    "specialization": "Hardware Technician",
    "department": "Campus Hardware & Printing Infrastructure",
    "phone": "+1 (555) 999-8888",
    "is_active": True,
}
status, updated_tech = make_request("PUT", f"/api/technicians/{tech_id}", update_data, token=host_token)
assert status == 200, f"Failed to update technician: {updated_tech}"
assert updated_tech["name"] == "Anand Sen (Senior)"
assert updated_tech["specialization"] == "Hardware Technician"
print(f"  -> SUCCESS! Host updated technician: {updated_tech['name']} -> Spec: {updated_tech['specialization']}")

# 6. Host Reset Technician Password
print("\n[6] Testing Host Resetting Technician Password...")
status, reset_res = make_request("POST", f"/api/technicians/{tech_id}/reset-password", {
    "new_password": "NewSecretPass@123",
}, token=host_token)
assert status == 200, f"Password reset failed: {reset_res}"
print(f"  -> SUCCESS! Host reset technician password: {reset_res.get('message')}")

# 7. Technician Login with New Password & Updated Specialization
print("\n[7] Testing Technician Login with New Reset Password (anand / NewSecretPass@123 / Hardware Technician)...")
status, new_auth = make_request("POST", "/api/auth/login", {
    "username": "anand",
    "password": "NewSecretPass@123",
    "specialization": "Hardware Technician",
    "role": "technician",
})
assert status == 200, f"Login with new password failed: {new_auth}"
print("  -> SUCCESS! Logged in with new reset password!")

# 8. Host Deactivate Technician Account
print("\n[8] Testing Host Deactivating Technician Account...")
status, deact_tech = make_request("PUT", f"/api/technicians/{tech_id}", {"is_active": False}, token=host_token)
assert status == 200, f"Deactivation failed: {deact_tech}"
assert deact_tech["is_active"] is False

# Attempt login while deactivated (Must fail with 401)
status, deact_login = make_request("POST", "/api/auth/login", {
    "username": "anand",
    "password": "NewSecretPass@123",
    "specialization": "Hardware Technician",
})
assert status == 401, f"Expected 401 for inactive account, got {status}: {deact_login}"
print(f"  -> SUCCESS! Inactive technician blocked from login with 401: {deact_login.get('detail')}")

# 9. Host Reactivate Technician Account
print("\n[9] Testing Host Reactivating Technician Account...")
status, react_tech = make_request("PUT", f"/api/technicians/{tech_id}", {"is_active": True}, token=host_token)
assert status == 200 and react_tech["is_active"] is True
status, react_login = make_request("POST", "/api/auth/login", {
    "username": "anand",
    "password": "NewSecretPass@123",
    "specialization": "Hardware Technician",
})
assert status == 200, f"Reactivated login failed: {react_login}"
print("  -> SUCCESS! Reactivated technician successfully logged back in!")

# 10. Specialization-Scoped Ticket Querying & Cross-Specialization Escalation
print("\n[10] Testing Specialization Ticket Querying & Escalation...")
status, net_tickets = make_request("GET", "/api/tickets?specialization=Network")
assert status == 200, "Failed to query network tickets"
print(f"  -> Found {len(net_tickets)} tickets for Network specialization.")

# Escalate a ticket to IAM / Access
if len(net_tickets) > 0:
    t_id = net_tickets[0]["id"]
    status, esc_ticket = make_request("POST", f"/api/tickets/{t_id}/escalate", {
        "tier": "Tier-2 Specialized Escalation",
        "department": "Identity & Access Management",
        "reason": "Requires MFA token reset for multi-domain trust.",
        "target_specialization": "IAM / Access",
        "original_technician": "Anand Sen (TECH-006)",
        "tech_bar_location": "Main Library Tech Bar",
        "student_id_required": True,
    }, token=tech_token)
    assert status == 200, f"Failed to escalate ticket: {esc_ticket}"
    assert esc_ticket["status"] == "Escalated"
    print(f"  -> SUCCESS! Escalated ticket {esc_ticket['ticket_number']} to target specialization: IAM / Access")

print("\n================================================================")
print("   >>> ALL 10 PHASE 2 RBAC & MANAGEMENT TESTS PASSED 100%! <<<   ")
print("================================================================")
