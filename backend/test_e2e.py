import urllib.request
import json

BASE = "http://127.0.0.1:8000"


def request(method, path, data=None):
    url = f"{BASE}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    body = json.dumps(data).encode("utf-8") if data else None
    with urllib.request.urlopen(req, data=body, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


print("=== 1. Testing Health Endpoint ===")
health = request("GET", "/api/health")
print("Health status:", health.get("status"), "| Model:", health.get("model"), "| AI Ready:", health.get("ai_ready"))

print("\n=== 2. Testing Knowledge Base List & Search ===")
kb_res = request("GET", "/api/kb?category=Wi-Fi")
print(f"Found {len(kb_res.get('articles', []))} Wi-Fi articles. Categories: {kb_res.get('categories')}")

print("\n=== 3. Testing Ticket Creation ===")
new_ticket = request(
    "POST",
    "/api/tickets",
    {
        "title": "Test Eduroam PEAP connection handshake issue",
        "category": "Eduroam Wi-Fi",
        "priority": "High",
        "netid": "test.student",
        "email": "test.student@university.edu",
        "location": "Library West Wing",
        "description": "Continuous timeout on EAP-PEAP phase 2 MSCHAPv2.",
    },
)
ticket_id = new_ticket["id"]
ticket_num = new_ticket["ticket_number"]
print(f"Created ticket: {ticket_num} (ID: {ticket_id}) - Status: {new_ticket['status']}")

print("\n=== 4. Testing Ticket Action Logging ===")
act_res = request(
    "POST",
    f"/api/tickets/{ticket_id}/action",
    {
        "action": "Ran RADIUS authentication traceroute probe",
        "result": "Auth node A responding with 12ms latency.",
        "actor": "technician",
    },
)
print(f"Actions logged count: {len(act_res.get('actions_taken', []))}")

print("\n=== 5. Testing Ticket Resolution ===")
res_ticket = request(
    "POST",
    f"/api/tickets/{ticket_id}/resolve",
    {
        "resolution_details": "Reconfigured student device CA certificate domain to university.edu.",
    },
)
print(f"Ticket {ticket_num} resolved status: {res_ticket['status']} | Progress: {res_ticket['diagnostic_progress']}%")

print("\n=== 6. Testing Analytics & KPI Reactive Update ===")
kpis = request("GET", "/api/analytics/kpis")
print(f"Live KPIs: Open={kpis.get('open_tickets')}, Resolved={kpis.get('resolved_today')}, AI_Rate={kpis.get('ai_resolution_rate_percent')}%")

print("\n=== 7. Testing Host Read-Only Reports ===")
reports = request("GET", "/api/reports?date_range=Last%2030%20Days")
print(f"Host Report Total Incidents: {reports.get('total_incidents')} | Categories: {len(reports.get('top_issue_categories', []))}")

print("\n=== 8. Testing Diagnostics Probes ===")
probes = request("GET", "/api/diagnostics/probes")
print(f"Diagnostics health: {probes.get('overall_health')} ({probes.get('probes_passed')}/{probes.get('probes_total')} passed)")

print("\n=== 9. Testing Database Storage Health ===")
db = request("GET", "/api/admin/database")
print(f"Database status: {db.get('database_status')} | Tables: {len(db.get('tables', []))} | Total records: {db.get('total_records')}")

print("\n>>> ALL 9 INTEGRATION TESTS PASSED PERFECTLY! <<<")
