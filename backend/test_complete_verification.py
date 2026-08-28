import httpx
import json
import sys

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_PROXY = "http://localhost:5173"

def run_complete_verification():
    print("====================================================================")
    print("      CAMPUSFIX-AI FULL END-TO-END VERIFICATION & READINESS CHECK   ")
    print("====================================================================")

    with httpx.Client(timeout=10.0) as client:
        # --- 1. Basic Health & Services Check ---
        print("\n[CHECK 1] Server Health & Proxy Route Verification")
        r_backend = client.get(f"{BASE_URL}/api/health")
        assert r_backend.status_code == 200, f"Backend health failed: {r_backend.status_code}"
        print(f"  [OK] FastAPI Backend Direct (/api/health): 200 OK - {r_backend.json()['message']}")

        r_frontend = client.get(f"{FRONTEND_PROXY}/api/health")
        assert r_frontend.status_code == 200, f"Vite proxy health failed: {r_frontend.status_code}"
        print(f"  [OK] Vite Proxy Forwarding (/api/health): 200 OK")

        # --- 2. Test Existing Student Signup / Login ---
        print("\n[CHECK 2] Student Authentication (Sign Up & Login Flow)")
        test_roll = "211FA04999"
        test_pwd = "StudentPassword123"
        
        # Register/Signup
        signup_payload = {
            "name": "Harshitha Rao",
            "roll_number": test_roll,
            "password": test_pwd,
            "confirm_password": test_pwd
        }
        r_signup = client.post(f"{BASE_URL}/api/auth/student/signup", json=signup_payload)
        if r_signup.status_code in [200, 201]:
            print(f"  [OK] Student Signup ({test_roll}): HTTP {r_signup.status_code} - Token Generated")
            student_token = r_signup.json().get("token")
        else:
            # If already registered, log in
            r_login = client.post(f"{BASE_URL}/api/auth/student/login", json={"roll_number": test_roll, "password": test_pwd})
            assert r_login.status_code == 200, f"Student login failed: {r_login.text}"
            print(f"  [OK] Student Login ({test_roll}): HTTP 200 - Token Generated")
            student_token = r_login.json().get("token")

        # Verify student identity
        r_me = client.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {student_token}"})
        assert r_me.status_code == 200, f"Student profile lookup failed: {r_me.text}"
        print(f"  [OK] Validated Student Identity: {r_me.json()['name']} ({r_me.json()['role']})")

        # --- 3. Test Staff / Technician & Host Authentication ---
        print("\n[CHECK 3] Technician & Admin/Host Authentication")
        # Technician Anand
        r_tech = client.post(f"{BASE_URL}/api/auth/login", json={
            "username": "anand",
            "password": "anand@123",
            "role": "technician"
        })
        assert r_tech.status_code == 200, f"Technician login failed: {r_tech.text}"
        tech_token = r_tech.json()["token"]
        print(f"  [OK] Technician Auth (Anand Sen): HTTP 200 - Token Generated")

        # Host Vamsi
        r_host = client.post(f"{BASE_URL}/api/auth/login", json={
            "username": "vamsi",
            "password": "vamsi@123",
            "role": "host"
        })
        assert r_host.status_code == 200, f"Host login failed: {r_host.text}"
        host_token = r_host.json()["token"]
        print(f"  [OK] Host / Admin Auth (Vamsi): HTTP 200 - Token Generated")

        # --- 4. Test Incident Reporting (Ticket Creation & Diagnostic Progression) ---
        print("\n[CHECK 4] Incident Reporting & Workflow Lifecycle")
        t_payload1 = {
            "title": "Wi-Fi Authentication Loop in U-Block Lab 201",
            "category": "Eduroam Wi-Fi",
            "priority": "High",
            "location": "U-Block (CSE/IT)",
            "device": "MacBook Pro M2",
            "netid": test_roll,
            "email": f"{test_roll}@campusfix.edu",
            "description": "Continuous PEAP handshake timeout error when attempting to connect to Eduroam SSID.",
        }
        r_t1 = client.post(f"{BASE_URL}/api/tickets", json=t_payload1, headers={"Authorization": f"Bearer {student_token}"})
        assert r_t1.status_code == 201, f"Ticket creation failed: {r_t1.text}"
        ticket1 = r_t1.json()
        print(f"  [OK] Incident 1 Created: {ticket1['ticket_number']} ({ticket1['title']})")

        t_payload2 = {
            "title": "Eduroam Wi-Fi drops connection in U-Block 2nd Floor",
            "category": "Eduroam Wi-Fi",
            "priority": "High",
            "location": "U-Block (CSE/IT)",
            "device": "Dell Latitude Windows 11",
            "netid": "211FA04112",
            "email": "student2@campusfix.edu",
            "description": "Wi-Fi connects for 30 seconds then drops with RADIUS certificate timeout.",
        }
        r_t2 = client.post(f"{BASE_URL}/api/tickets", json=t_payload2)
        assert r_t2.status_code == 201
        ticket2 = r_t2.json()
        print(f"  [OK] Incident 2 Created: {ticket2['ticket_number']} ({ticket2['title']})")

        t_payload3 = {
            "title": "PaperCut Printer Station Offline in NTR Library",
            "category": "PaperCut Printing",
            "priority": "Medium",
            "location": "NTR-Vignan Library",
            "device": "HP LaserJet M608",
            "netid": "211FA04333",
            "email": "student3@campusfix.edu",
            "description": "Paper tray jam error code 13.00.00 prevents printing jobs from releasing.",
        }
        r_t3 = client.post(f"{BASE_URL}/api/tickets", json=t_payload3)
        assert r_t3.status_code == 201
        ticket3 = r_t3.json()
        print(f"  [OK] Incident 3 Created: {ticket3['ticket_number']} ({ticket3['title']})")

        # --- 5. Test AI Incident Clustering Feature ---
        print("\n[CHECK 5] AI Incident Clustering Verification")
        r_clusters = client.get(f"{FRONTEND_PROXY}/api/intelligence/clusters", headers={"Authorization": f"Bearer {tech_token}"})
        assert r_clusters.status_code == 200, f"Clusters query failed: {r_clusters.text}"
        clusters_data = r_clusters.json()
        print(f"  [OK] Total Analyzed Incidents: {clusters_data['total_incidents_analyzed']}")
        print(f"  [OK] Total Clusters Identified: {clusters_data['total_clusters_found']}")
        print(f"  [OK] Potential Shared Outages Detected: {clusters_data['potential_outages_detected']}")
        assert clusters_data['total_clusters_found'] >= 2, "Expected at least 2 clusters"

        # Find the Eduroam cluster
        eduroam_cluster = next((c for c in clusters_data['clusters'] if c['primary_category'] == 'Eduroam Wi-Fi'), None)
        assert eduroam_cluster is not None, "Eduroam Wi-Fi cluster must be detected"
        print(f"  [OK] AI Generated Cluster Title: '{eduroam_cluster['title']}'")
        print(f"  [OK] Cluster Size: {eduroam_cluster['incident_count']} incidents | Severity: {eduroam_cluster['severity']}")
        print(f"  [OK] Outage Pattern Flag: {eduroam_cluster['is_single_outage_pattern']}")
        print(f"  [OK] Affected Locations: {eduroam_cluster['affected_locations']}")
        print(f"  [OK] Representative Incident: {eduroam_cluster['representative_incident']['ticket_number']} - {eduroam_cluster['representative_incident']['title']}")
        print(f"  [OK] Recommended Action: {eduroam_cluster['recommended_action']}")

        # --- 6. Test AI Campus Anomaly Detective Feature ---
        print("\n[CHECK 6] AI Campus Anomaly Detective Verification")
        r_anomalies = client.get(f"{FRONTEND_PROXY}/api/intelligence/anomalies", headers={"Authorization": f"Bearer {tech_token}"})
        assert r_anomalies.status_code == 200, f"Anomalies query failed: {r_anomalies.text}"
        anomalies_data = r_anomalies.json()
        print(f"  [OK] Total Detected Anomalies: {anomalies_data['total_anomalies_detected']}")
        print(f"  [OK] Campus Risk Score: {anomalies_data['campus_risk_score']}/100")
        print(f"  [OK] Highest Severity: {anomalies_data['highest_severity']}")
        assert anomalies_data['total_anomalies_detected'] >= 1, "Expected at least 1 anomaly"

        top_anomaly = anomalies_data['anomalies'][0]
        print(f"  [OK] Anomaly Title: '{top_anomaly['title']}' (Score: {top_anomaly['anomaly_score']}/100, Type: {top_anomaly['anomaly_type']})")
        print(f"  [OK] Real Evidence Breakdown ({len(top_anomaly['real_evidence'])} data points):")
        for ev in top_anomaly['real_evidence']:
            print(f"      - {ev}")
        print(f"  [OK] AI Diagnostic Inference: '{top_anomaly['ai_inference']}'")
        print(f"  [OK] Baseline Comparison: '{top_anomaly['baseline_comparison']}'")
        print(f"  [OK] Recommended Action: '{top_anomaly['recommended_action']}'")

        # --- 7. Test Technician Batch Assignment ---
        print("\n[CHECK 7] Technician Batch Assignment Verification")
        assign_payload = {"technician_name": "Anand Sen"}
        r_batch = client.post(
            f"{BASE_URL}/api/intelligence/clusters/{eduroam_cluster['id']}/batch-assign",
            headers={"Authorization": f"Bearer {tech_token}"},
            json=assign_payload
        )
        assert r_batch.status_code == 200, f"Batch assignment failed: {r_batch.text}"
        batch_res = r_batch.json()
        print(f"  [OK] Batch Assign Result: {batch_res['message']}")
        print(f"  [OK] Updated Ticket Numbers: {batch_res['updated_ticket_numbers']}")
        assert len(batch_res['updated_ticket_numbers']) >= 2

        # Verify individual ticket now reflects the assigned technician
        r_t_check = client.get(f"{BASE_URL}/api/tickets/{ticket1['id']}")
        assert r_t_check.json()['assigned_technician'] == "Anand Sen"
        print(f"  [OK] Validated {ticket1['ticket_number']} Assigned Technician: {r_t_check.json()['assigned_technician']}")

        # --- 8. Test Overview & Telemetry Hotspots ---
        print("\n[CHECK 8] Aggregated Hotspots & Telemetry Overview")
        r_overview = client.get(f"{FRONTEND_PROXY}/api/intelligence/overview", headers={"Authorization": f"Bearer {tech_token}"})
        assert r_overview.status_code == 200
        ov_data = r_overview.json()
        print(f"  [OK] Active Incident Count: {ov_data['active_incidents']}")
        print(f"  [OK] Top Campus Hotspot: {ov_data['top_hotspots'][0]['location']} ({ov_data['top_hotspots'][0]['active_incidents']} cases)")
        print(f"  [OK] Top Impacted Service: {ov_data['top_impacted_services'][0]['service']} ({ov_data['top_impacted_services'][0]['active_incidents']} cases)")

        # --- 9. Test Technician & Admin Dashboards Data Consistency ---
        print("\n[CHECK 9] Technician & Admin Dashboard Endpoints")
        # Technicians list (Host/Tech role protected)
        r_techs = client.get(f"{BASE_URL}/api/technicians", headers={"Authorization": f"Bearer {host_token}"})
        assert r_techs.status_code == 200
        print(f"  [OK] Technician Roster Directory: {len(r_techs.json())} technicians registered")

        # Campus map data
        r_map = client.get(f"{BASE_URL}/api/campus/map")
        assert r_map.status_code == 200
        print(f"  [OK] Verified Interactive Campus Map: {len(r_map.json()['locations'])} Vignan Vadlamudi locations loaded")

        # Service Status Panel
        r_status = client.get(f"{BASE_URL}/api/status")
        assert r_status.status_code == 200
        print(f"  [OK] Campus Infrastructure Health: Overall status is '{r_status.json()['overall_status']}'")

        # --- 10. Test AI Chat & Helpdesk Operational Agent ---
        print("\n[CHECK 10] AI Chat Support & Helpdesk Agent")
        chat_payload = {
            "messages": [
                {"role": "user", "content": "How do I connect to Eduroam Wi-Fi in U-Block?"}
            ]
        }
        r_chat = client.post(f"{BASE_URL}/api/chat", json=chat_payload)
        assert r_chat.status_code == 200
        chat_res = r_chat.json()
        clean_reply = chat_res['reply'].encode('ascii', 'ignore').decode('ascii')[:100]
        print(f"  [OK] AI Support Agent Reply: '{clean_reply}...' (Model: {chat_res['model']})")

    print("\n====================================================================")
    print("      ALL 10 VERIFICATION & READINESS CHECKS PASSED (100% OK)       ")
    print("====================================================================")

if __name__ == "__main__":
    try:
        run_complete_verification()
    except Exception as e:
        print(f"\n[ERROR] Verification Error: {e}", file=sys.stderr)
        sys.exit(1)
