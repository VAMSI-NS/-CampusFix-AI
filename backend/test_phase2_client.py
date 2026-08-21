from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_phase2_suite():
    print("================================================================")
    print("     CAMPUSFIX AI - PHASE 2 RBAC & TECHNICIAN SUITE TEST        ")
    print("================================================================")

    # 1. Host Login
    print("\n[1] Testing Host Login with existing credentials (VAMSI / vamsi@123)...")
    res = client.post("/api/auth/login", json={
        "username": "VAMSI",
        "password": "vamsi@123",
        "role": "host",
    })
    assert res.status_code == 200, f"Host login failed: {res.text}"
    host_auth = res.json()
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
    res = client.post("/api/technicians", json=new_tech_data, headers={"Authorization": f"Bearer {host_token}"})
    assert res.status_code in [200, 201], f"Failed to create technician: {res.text}"
    created_tech = res.json()
    assert created_tech["username"] == "anand", "Technician username mismatch"
    assert "password" not in created_tech and "password_hash" not in created_tech, "Security violation: password exposed in tech creation response!"
    tech_id = created_tech["id"]
    print(f"  -> SUCCESS! Created Tech: {created_tech['name']} (ID: {created_tech['technician_id']}, Spec: {created_tech['specialization']})")

    # 3. Technician Login with Assigned Credentials & Specialization
    print("\n[3] Testing Technician Login (anand / anand@123 / Network Technician)...")
    res = client.post("/api/auth/login", json={
        "username": "anand",
        "password": "anand@123",
        "specialization": "Network Technician",
        "role": "technician",
    })
    assert res.status_code == 200, f"Technician login failed: {res.text}"
    tech_auth = res.json()
    tech_token = tech_auth["token"]
    tech_user = tech_auth["user"]
    assert tech_user["role"] == "technician", "Role mismatch"
    print(f"  -> SUCCESS! Technician {tech_user['name']} authenticated with token!")

    # 4. Security RBAC: Technician attempting Host Action (Must be Forbidden 403)
    print("\n[4] Testing RBAC Security: Technician attempting to create another technician (Must fail with 403)...")
    res = client.post("/api/technicians", json={
        "name": "Hacker Tech",
        "username": "hacker",
        "email": "hacker@university.edu",
        "password": "hack@123",
        "specialization": "Software",
    }, headers={"Authorization": f"Bearer {tech_token}"})
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"
    print(f"  -> SUCCESS! Backend correctly rejected unauthorized technician request with HTTP 403 Forbidden: {res.json().get('detail')}")

    # 5. Host Edit Technician Details & Specialization
    print("\n[5] Testing Host Editing Technician Specialization and Status...")
    update_data = {
        "name": "Anand Sen (Senior)",
        "specialization": "Hardware Technician",
        "department": "Campus Hardware & Printing Infrastructure",
        "phone": "+1 (555) 999-8888",
        "is_active": True,
    }
    res = client.put(f"/api/technicians/{tech_id}", json=update_data, headers={"Authorization": f"Bearer {host_token}"})
    assert res.status_code == 200, f"Failed to update technician: {res.text}"
    updated_tech = res.json()
    assert updated_tech["name"] == "Anand Sen (Senior)"
    assert updated_tech["specialization"] == "Hardware Technician"
    print(f"  -> SUCCESS! Host updated technician: {updated_tech['name']} -> Spec: {updated_tech['specialization']}")

    # 6. Host Reset Technician Password
    print("\n[6] Testing Host Resetting Technician Password...")
    res = client.post(f"/api/technicians/{tech_id}/reset-password", json={
        "new_password": "NewSecretPass@123",
    }, headers={"Authorization": f"Bearer {host_token}"})
    assert res.status_code == 200, f"Password reset failed: {res.text}"
    print(f"  -> SUCCESS! Host reset technician password: {res.json().get('message')}")

    # 7. Technician Login with New Password & Updated Specialization
    print("\n[7] Testing Technician Login with New Reset Password (anand / NewSecretPass@123 / Hardware Technician)...")
    res = client.post("/api/auth/login", json={
        "username": "anand",
        "password": "NewSecretPass@123",
        "specialization": "Hardware Technician",
        "role": "technician",
    })
    assert res.status_code == 200, f"Login with new password failed: {res.text}"
    print("  -> SUCCESS! Logged in with new reset password!")

    # 8. Host Deactivate Technician Account
    print("\n[8] Testing Host Deactivating Technician Account...")
    res = client.put(f"/api/technicians/{tech_id}", json={"is_active": False}, headers={"Authorization": f"Bearer {host_token}"})
    assert res.status_code == 200 and res.json()["is_active"] is False

    # Attempt login while deactivated (Must fail with 401)
    res = client.post("/api/auth/login", json={
        "username": "anand",
        "password": "NewSecretPass@123",
        "specialization": "Hardware Technician",
    })
    assert res.status_code == 401, f"Expected 401 for inactive account, got {res.status_code}: {res.text}"
    print(f"  -> SUCCESS! Inactive technician blocked from login with 401: {res.json().get('detail')}")

    # 9. Host Reactivate Technician Account
    print("\n[9] Testing Host Reactivating Technician Account...")
    res = client.put(f"/api/technicians/{tech_id}", json={"is_active": True}, headers={"Authorization": f"Bearer {host_token}"})
    assert res.status_code == 200 and res.json()["is_active"] is True
    res = client.post("/api/auth/login", json={
        "username": "anand",
        "password": "NewSecretPass@123",
        "specialization": "Hardware Technician",
    })
    assert res.status_code == 200, f"Reactivated login failed: {res.text}"
    print("  -> SUCCESS! Reactivated technician successfully logged back in!")

    # 10. Specialization-Scoped Ticket Querying & Cross-Specialization Escalation
    print("\n[10] Testing Specialization Ticket Querying & Escalation...")
    res = client.get("/api/tickets?specialization=Network")
    assert res.status_code == 200, "Failed to query network tickets"
    net_tickets = res.json()
    print(f"  -> Found {len(net_tickets)} tickets for Network specialization.")

    if len(net_tickets) > 0:
        t_id = net_tickets[0]["id"]
        res = client.post(f"/api/tickets/{t_id}/escalate", json={
            "tier": "Tier-2 Specialized Escalation",
            "department": "Identity & Access Management",
            "reason": "Requires MFA token reset for multi-domain trust.",
            "target_specialization": "IAM / Access",
            "original_technician": "Anand Sen (TECH-006)",
            "tech_bar_location": "Main Library Tech Bar",
            "student_id_required": True,
        }, headers={"Authorization": f"Bearer {tech_token}"})
        assert res.status_code == 200, f"Failed to escalate ticket: {res.text}"
        esc_ticket = res.json()
        assert esc_ticket["status"] == "Escalated"
        print(f"  -> SUCCESS! Escalated ticket {esc_ticket['ticket_number']} to target specialization: IAM / Access")

    print("\n================================================================")
    print("   >>> ALL 10 PHASE 2 RBAC & MANAGEMENT TESTS PASSED 100%! <<<   ")
    print("================================================================")

if __name__ == "__main__":
    test_phase2_suite()
