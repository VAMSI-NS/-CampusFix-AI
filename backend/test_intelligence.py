import sys
import os
from pathlib import Path
from starlette.testclient import TestClient

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.services.ticket_service import ticket_service
from app.services.intelligence_service import intelligence_service
from app.models.ticket import TicketCreate

client = TestClient(app)

def run_tests():
    print("=====================================================")
    print("   CAMPUSFIX-AI INTELLIGENCE & ANOMALY UNIT TESTS    ")
    print("=====================================================")

    # 1. Test empty state handling (0 tickets or fresh start)
    print("\n--- Test 1: Empty / Baseline Intelligence Response ---")
    resp = client.get("/api/intelligence/overview")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    print(f"Total Incidents: {data['total_incidents']}, Total Clusters: {data['total_clusters']}, Anomalies: {data['total_anomalies']}, Confidence: {data['data_confidence']}")
    assert data["total_clusters"] >= 0
    assert data["total_anomalies"] >= 0

    # 2. Create simulated correlated incident tickets to test clustering & anomalies
    print("\n--- Test 2: Ingest Incidents for Clustering & Anomaly Detection ---")
    t1 = ticket_service.create_ticket(TicketCreate(
        title="Eduroam 802.1X handshake timeout in U-Block 3rd Floor",
        category="Eduroam Wi-Fi",
        priority="High",
        location="U-Block (CSE/IT Labs)",
        netid="student.cse1",
        description="Laptop repeatedly disconnects during PEAP authentication handshake.",
    ))
    t2 = ticket_service.create_ticket(TicketCreate(
        title="Wi-Fi disconnecting continuously in U-Block Lab 302",
        category="Eduroam Wi-Fi",
        priority="High",
        location="U-Block (CSE/IT Labs)",
        netid="student.cse2",
        description="Eduroam Wi-Fi drops connection with certificate verification error.",
    ))
    t3 = ticket_service.create_ticket(TicketCreate(
        title="PaperCut print release jammed at NTR Library 1st Floor",
        category="PaperCut Printing",
        priority="Medium",
        location="NTR-Vignan Library",
        netid="student.lib1",
        description="Paper tray 2 is reporting paper jam and queue is backing up.",
    ))

    print(f"Created tickets: {t1.ticket_number}, {t2.ticket_number}, {t3.ticket_number}")

    # 3. Test Clustering API
    print("\n--- Test 3: Validate Incident Clustering API ---")
    c_resp = client.get("/api/intelligence/clusters")
    assert c_resp.status_code == 200
    c_data = c_resp.json()
    print(f"Clusters found: {c_data['total_clusters_found']}, Analyzed: {c_data['total_incidents_analyzed']}")
    assert c_data["total_clusters_found"] >= 2
    
    # Check if U-Block Eduroam tickets got clustered together
    eduroam_cluster = next((c for c in c_data["clusters"] if c["primary_category"] == "Eduroam Wi-Fi"), None)
    assert eduroam_cluster is not None, "Eduroam cluster should be detected"
    print(f"Eduroam Cluster Title: '{eduroam_cluster['title']}'")
    print(f"Incident Count: {eduroam_cluster['incident_count']}, Single Outage: {eduroam_cluster['is_single_outage_pattern']}")
    print(f"Locations: {eduroam_cluster['affected_locations']}, Action: '{eduroam_cluster['recommended_action']}'")
    assert eduroam_cluster["incident_count"] >= 2
    assert t1.ticket_number in eduroam_cluster["ticket_numbers"]
    assert t2.ticket_number in eduroam_cluster["ticket_numbers"]

    # 4. Test Campus Anomaly Detective API
    print("\n--- Test 4: Validate Campus Anomaly Detective API ---")
    a_resp = client.get("/api/intelligence/anomalies")
    assert a_resp.status_code == 200
    a_data = a_resp.json()
    print(f"Anomalies detected: {a_data['total_anomalies_detected']}, Campus Risk Score: {a_data['campus_risk_score']}/100")
    assert a_data["total_anomalies_detected"] >= 1
    
    top_anomaly = a_data["anomalies"][0]
    print(f"Top Anomaly: '{top_anomaly['title']}' (Score: {top_anomaly['anomaly_score']}, Severity: {top_anomaly['severity']})")
    print(f"Real Evidence items: {len(top_anomaly['real_evidence'])}")
    for ev in top_anomaly['real_evidence']:
        print(f"  - [Real Evidence] {ev}")
    print(f"AI Inference: {top_anomaly['ai_inference']}")
    print(f"Recommended Action: {top_anomaly['recommended_action']}")
    assert len(top_anomaly["real_evidence"]) > 0
    assert len(top_anomaly["ai_inference"]) > 0

    # 5. Test Batch Assign Endpoint (Authentication check)
    print("\n--- Test 5: Batch Assignment Endpoint ---")
    # Log in as technician
    auth_resp = client.post("/api/auth/login", json={
        "username": "anand",
        "password": "anand@123",
        "role": "technician"
    })
    assert auth_resp.status_code == 200
    token = auth_resp.json()["token"]

    batch_resp = client.post(
        f"/api/intelligence/clusters/{eduroam_cluster['id']}/batch-assign",
        headers={"Authorization": f"Bearer {token}"},
        json={"technician_name": "Anand Sen"}
    )
    assert batch_resp.status_code == 200
    batch_data = batch_resp.json()
    print(f"Batch assign result: {batch_data['message']}")
    print(f"Updated tickets: {batch_data['updated_ticket_numbers']}")
    assert len(batch_data["updated_ticket_numbers"]) >= 2

    # Verify updated ticket status
    updated_t1 = ticket_service.get_ticket(t1.id)
    assert updated_t1.assigned_technician == "Anand Sen"

    print("\n=====================================================")
    print("   ALL INTELLIGENCE TESTS COMPLETED SUCCESSFULLY!    ")
    print("=====================================================")

if __name__ == "__main__":
    run_tests()
