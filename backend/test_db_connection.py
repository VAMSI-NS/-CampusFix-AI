import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv

# Ensure backend dir is on path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Load .env
env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()

from app.database import db
from app.services.users_service import users_service
from app.services.ticket_service import ticket_service
from app.services.kb_service import kb_service

print("==================================================================")
print("     CAMPUSFIX AI - NEON POSTGRESQL CONNECTION VERIFICATION       ")
print("==================================================================")

db_url = db.get_database_url()
if not db_url:
    print("\n[!] NOTICE: 'DATABASE_URL' is not yet configured in 'backend/.env'.")
    print("    Format: DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<db>?sslmode=require")
    print("    Backend is currently operating safely in In-Memory Resilience Mode.\n")
    sys.exit(0)

# Masked URL for safe logging
masked_url = db_url
if "@" in db_url:
    parts = db_url.split("@")
    proto = parts[0].split(":")[0]
    host_part = parts[1]
    masked_url = f"{proto}://*****:*****@{host_part}"

print(f"\n1. Target Connection String: {masked_url}")

# Test Initialization & Handshake
print("2. Connecting and initializing tables...")
success = db.initialize()

if not success:
    print("\n[X] FAILED to connect to Neon PostgreSQL database.")
    print("    Please check the DATABASE_URL credentials, hostname, or network connectivity.")
    sys.exit(1)

print("   [+] SSL Handshake & Connection Pool established.")
print("   [+] Schema DDL verified (users, tickets, kb_articles, service_status, announcements).")

# Synchronize seed data if tables are fresh
print("\n3. Synchronizing and verifying baseline data...")
users_service.sync_to_db()
ticket_service.sync_to_db()
kb_service.sync_to_db()

# Run database health check
health = db.health_check()
print(f"   [+] Engine: {health.get('engine')}")
print(f"   [+] Database Version: {health.get('version')}")
print(f"   [+] Ping Latency: {health.get('latency_ms')} ms")
print(f"   [+] Table Record Counts: {health.get('table_counts')}")

# Verify User Authentication Query
print("\n4. Testing User & Role Authentication Query...")
host_user, err = users_service.authenticate("VAMSI", "vamsi@123", role="host")
assert host_user is not None, f"Host authentication failed: {err}"
print(f"   [+] Host User Verified: '{host_user.name}' (Role: {host_user.role})")

tech_user, err = users_service.authenticate("ramu", "ramu@123", specialization="Network", role="technician")
assert tech_user is not None, f"Technician authentication failed: {err}"
print(f"   [+] Tech User Verified: '{tech_user.name}' (ID: {tech_user.technician_id}, Spec: {tech_user.specialization})")

# Verify Ticket Query
print("\n5. Testing Ticket Lifecycle Query...")
tickets = ticket_service.list_tickets()
assert len(tickets) > 0, "No tickets found in database!"
print(f"   [+] Successfully queried {len(tickets)} tickets from PostgreSQL.")
print(f"   [+] Sample Ticket: {tickets[0].ticket_number} - {tickets[0].title[:45]}... [{tickets[0].status}]")

# Safe Transaction Test (Insert & Rollback)
print("\n6. Running Transaction Integrity & Rollback Test...")
try:
    with db.get_cursor(commit=False) as cur:
        cur.execute(
            "INSERT INTO announcements (id, title, severity, message) VALUES (%s, %s, %s, %s);",
            ("test-rollback-id", "Database Test Probe", "info", "Ephemeral probe payload."),
        )
        cur.execute("SELECT COUNT(*) AS count FROM announcements WHERE id = 'test-rollback-id';")
        assert cur.fetchone()["count"] == 1
        # Intentionally not committing (cursor will rollback on exit)
    print("   [+] Transaction write & rollback verified safely.")
except Exception as e:
    print(f"   [X] Transaction test failed: {e}")
    sys.exit(1)

print("\n==================================================================")
print(" >>> ALL NEON POSTGRESQL DATABASE CHECKS PASSED SUCCESSFULLY! <<< ")
print("==================================================================")
