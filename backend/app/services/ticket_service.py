import os
import json
import random
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from app.models.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketResponse,
    TicketNote,
    ActionLogItem,
    EscalationDetails,
    TicketStatus,
    TicketCategory,
    TicketPriority,
    DiagnosticStage,
    TicketAIAnalysisResponse,
)
from app.database import db

logger = logging.getLogger("campusfix.tickets")

CATEGORY_TO_SPECIALIZATION = {
    "Eduroam Wi-Fi": ["Network", "Network Technician"],
    "Dorm ResNet": ["Network", "Network Technician"],
    "VPN": ["Network", "Network Technician"],
    "Canvas / SSO": ["Software", "Software Technician", "IAM / Access", "IAM/Access Technician"],
    "Software": ["Software", "Software Technician"],
    "Lab / Computer Access": ["Hardware", "Hardware Technician", "Software", "Software Technician"],
    "PaperCut Printing": ["Hardware", "Hardware Technician"],
    "Duo MFA": ["IAM / Access", "IAM/Access Technician"],
    "NetID / Password": ["IAM / Access", "IAM/Access Technician"],
    "Email": ["IAM / Access", "IAM/Access Technician", "Software", "Software Technician"],
    "Other": ["Support", "Support Technician", "Other"],
}


class TicketService:
    def __init__(self):
        now_iso = datetime.now(timezone.utc).isoformat()
        # Seed realistic initial tickets for immediate university IT demonstration
        self._tickets: List[TicketResponse] = [
            TicketResponse(
                id="ticket-101",
                ticket_number="INC-2026-8941",
                title="Eduroam 802.1X Certificate Trust Loop on Android 14",
                category="Eduroam Wi-Fi",
                priority="Medium",
                status="Diagnosing",
                location="Engineering Hall, Room 304",
                netid="m.chen",
                email="m.chen@university.edu",
                description="Unable to validate server certificate on Pixel 8. Tried MSCHAPv2 but continually receiving WPA-Enterprise 802.1X handshake timeout.",
                issue_summary="Pixel 8 Android 14 client failing RADIUS EAP-PEAP certificate handshake with campus root CA.",
                diagnostic_stage="Troubleshooting",
                diagnostic_progress=60,
                actions_taken=[
                    ActionLogItem(
                        id="act-1",
                        timestamp=now_iso,
                        action="Verified RADIUS Auth Server status for Engineering Hall AP Cluster",
                        result="RADIUS Node B responding nominally (latency: 14ms).",
                        actor="system",
                    ),
                    ActionLogItem(
                        id="act-2",
                        timestamp=now_iso,
                        action="Student instructed to configure CA Certificate domain to 'university.edu' and EAP phase 2 to 'MSCHAPV2'",
                        result="Awaiting student confirmation after saving Wi-Fi profile.",
                        actor="ai_specialist",
                    ),
                ],
                resolution_details=None,
                escalation_info=None,
                chat_transcript=None,
                notes=[
                    TicketNote(
                        id="note-1",
                        author="CampusFix AI Diagnostic Engine",
                        author_role="system",
                        text="Identified Android 14 strict CA domain validation requirement. Student provided direct setup guide.",
                        created_at=now_iso,
                    )
                ],
                created_at=now_iso,
                updated_at=now_iso,
            ),
            TicketResponse(
                id="ticket-102",
                ticket_number="INC-2026-8935",
                title="PaperCut WebPrint Spooler Timeout in Library 2nd Floor",
                category="PaperCut Printing",
                priority="Low",
                status="Resolved",
                location="Main Library, 2nd Floor West Wing",
                netid="k.patel",
                email="k.patel@university.edu",
                description="Sent 14-page PDF via WebPrint. Station terminal displayed 'Processing...' for 10 minutes without physical printout.",
                issue_summary="Print spooler buffer queue stall resolved; release station driver restarted and student quota refunded.",
                diagnostic_stage="Completed",
                diagnostic_progress=100,
                actions_taken=[
                    ActionLogItem(
                        id="act-3",
                        timestamp=now_iso,
                        action="Diagnostic probe executed on Library Terminal #2 print spooler",
                        result="Spooler service buffer cleared; 1 stalled job released.",
                        actor="technician",
                    ),
                    ActionLogItem(
                        id="act-4",
                        timestamp=now_iso,
                        action="Refund request processed for unprinted balance ($1.40)",
                        result="PaperCut balance credited back to student account.",
                        actor="system",
                    ),
                ],
                resolution_details="Cleared PaperCut queue spooler buffer and released physical output. $1.40 print quota credited back to account.",
                escalation_info=None,
                chat_transcript=None,
                notes=[
                    TicketNote(
                        id="note-2",
                        author="Dave Miller (Hardware Tech)",
                        author_role="technician",
                        text="Reset local printer spooler service and verified clean print cycle.",
                        created_at=now_iso,
                    )
                ],
                created_at=now_iso,
                updated_at=now_iso,
            ),
            TicketResponse(
                id="ticket-103",
                ticket_number="INC-2026-8920",
                title="Duo 2FA Push Notification Timeout after iOS Device Upgrade",
                category="Duo MFA",
                priority="High",
                status="Escalated",
                location="Residential Hall B, Rm 112",
                netid="j.williams",
                email="j.williams@university.edu",
                description="Upgraded from iPhone 13 to iPhone 15. Duo push requests never appear on lock screen; manual passcode generator fails.",
                issue_summary="Hardware token migration required following iOS device restore; automated enrollment link sent.",
                diagnostic_stage="Completed",
                diagnostic_progress=100,
                actions_taken=[
                    ActionLogItem(
                        id="act-5",
                        timestamp=now_iso,
                        action="High Priority Flag: Midterm submission deadline in 2 hours",
                        result="Automatic escalation to Tech Bar Priority Walkup Queue.",
                        actor="system",
                    ),
                ],
                resolution_details=None,
                escalation_info=EscalationDetails(
                    tier="Tier-2 Identity & Access Management",
                    department="Campus IT Tech Bar Walkup",
                    reason="Student lacks access to registered secondary Duo device and has an urgent midterm submission deadline.",
                    assigned_to="Sarah Jenkins (Tech Bar Lead)",
                    tech_bar_location="Main Library, 1st Floor Tech Bar (Mon–Fri 8am–7pm)",
                    student_id_required=True,
                    notes="Student has urgent midterm deadline. Expedited walkup queue pass granted.",
                    escalated_at=now_iso,
                ),
                chat_transcript=None,
                notes=[
                    TicketNote(
                        id="note-3",
                        author="Security Operations Center",
                        author_role="system",
                        text="Escalated due to multi-factor device mismatch. Student instructed to bring government or campus photo ID to Tech Bar.",
                        created_at=now_iso,
                    )
                ],
                created_at=now_iso,
                updated_at=now_iso,
            ),
            TicketResponse(
                id="ticket-104",
                ticket_number="INC-2026-8890",
                title="PlayStation 5 Dorm Wired ResNet Ethernet Port Inactive",
                category="Dorm ResNet",
                priority="Low",
                status="New",
                location="Maple Hall, Rm 421",
                netid="d.rodriguez",
                email="d.rodriguez@university.edu",
                description="Registered LAN MAC address AA:BB:CC:11:22:33 on resnet portal, but wall jack link light remains off.",
                issue_summary="New intake: Dorm room wall ethernet jack link state unconfirmed.",
                diagnostic_stage="Triage",
                diagnostic_progress=15,
                actions_taken=[],
                resolution_details=None,
                escalation_info=None,
                chat_transcript=None,
                notes=[],
                created_at=now_iso,
                updated_at=now_iso,
            ),
            TicketResponse(
                id="ticket-105",
                ticket_number="INC-2026-8855",
                title="Canvas LMS SSO Stale Session Cookie & Token Expiration",
                category="Canvas / SSO",
                priority="Medium",
                status="Waiting for Student",
                location="Science Center, Rm 102",
                netid="a.taylor",
                email="a.taylor@university.edu",
                description="Clicking 'Log in with NetID' on Canvas loops back to login prompt without throwing an explicit error message.",
                issue_summary="SAML token handshake loop caused by cached browser SSO cookie session.",
                diagnostic_stage="Environment & Device",
                diagnostic_progress=40,
                actions_taken=[],
                resolution_details=None,
                escalation_info=None,
                chat_transcript=None,
                notes=[],
                created_at=now_iso,
                updated_at=now_iso,
            ),
        ]

    def sync_to_db(self):
        """Seeds initial memory tickets into PostgreSQL if tickets table is empty."""
        if not db.is_connected():
            return
        try:
            with db.get_cursor(commit=True) as cur:
                cur.execute("SELECT COUNT(*) AS count FROM tickets;")
                count = cur.fetchone()["count"]
                if count == 0:
                    logger.info("Seeding initial tickets into PostgreSQL tickets table...")
                    for t in self._tickets:
                        self._save_ticket_to_db(t, cur=cur)
                    logger.info(f"Seeded {len(self._tickets)} tickets into Neon PostgreSQL.")
        except Exception as e:
            logger.error(f"Error syncing tickets to DB: {e}")

    def _row_to_ticket(self, row: Dict[str, Any]) -> TicketResponse:
        actions_raw = row.get("actions_taken")
        if isinstance(actions_raw, str):
            try:
                actions_raw = json.loads(actions_raw)
            except Exception:
                actions_raw = []
        elif not isinstance(actions_raw, list):
            actions_raw = []

        actions_taken = [
            ActionLogItem(
                id=a.get("id", f"act-{random.randint(100, 999)}"),
                timestamp=str(a.get("timestamp", datetime.now(timezone.utc).isoformat())),
                action=a.get("action", ""),
                result=a.get("result", ""),
                actor=a.get("actor", "system"),
            )
            for a in actions_raw
            if isinstance(a, dict)
        ]

        notes_raw = row.get("notes")
        if isinstance(notes_raw, str):
            try:
                notes_raw = json.loads(notes_raw)
            except Exception:
                notes_raw = []
        elif not isinstance(notes_raw, list):
            notes_raw = []

        notes = [
            TicketNote(
                id=n.get("id", f"note-{random.randint(100, 999)}"),
                author=n.get("author", "IT Staff"),
                author_role=n.get("author_role", "technician"),
                text=n.get("text", ""),
                created_at=str(n.get("created_at", datetime.now(timezone.utc).isoformat())),
            )
            for n in notes_raw
            if isinstance(n, dict)
        ]

        escalation_raw = row.get("escalation_info")
        escalation_info = None
        if escalation_raw:
            if isinstance(escalation_raw, str):
                try:
                    escalation_raw = json.loads(escalation_raw)
                except Exception:
                    escalation_raw = None
            if isinstance(escalation_raw, dict):
                escalation_info = EscalationDetails(**escalation_raw)

        return TicketResponse(
            id=row["id"],
            ticket_number=row["ticket_number"],
            title=row["title"],
            category=row["category"],
            priority=row["priority"],
            status=row["status"],
            location=row["location"],
            device=row.get("device"),
            netid=row["netid"],
            email=row["email"],
            description=row["description"],
            issue_summary=row.get("issue_summary"),
            assigned_technician=row.get("assigned_technician"),
            ai_confidence=float(row.get("ai_confidence") or 0.85),
            diagnostic_stage=row["diagnostic_stage"],
            diagnostic_progress=int(row.get("diagnostic_progress") or 0),
            actions_taken=actions_taken,
            resolution_details=row.get("resolution_details"),
            escalation_info=escalation_info,
            chat_transcript=row.get("chat_transcript"),
            notes=notes,
            created_at=str(row.get("created_at") or datetime.now(timezone.utc).isoformat()),
            updated_at=str(row.get("updated_at") or datetime.now(timezone.utc).isoformat()),
        )

    def _save_ticket_to_db(self, ticket: TicketResponse, cur=None):
        sql = """
        INSERT INTO tickets (
            id, ticket_number, title, category, priority, status, location, device,
            netid, email, description, issue_summary, assigned_technician,
            ai_confidence, diagnostic_stage, diagnostic_progress, actions_taken,
            resolution_details, escalation_info, chat_transcript, notes,
            created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        ) ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            priority = EXCLUDED.priority,
            status = EXCLUDED.status,
            location = EXCLUDED.location,
            device = EXCLUDED.device,
            issue_summary = EXCLUDED.issue_summary,
            assigned_technician = EXCLUDED.assigned_technician,
            ai_confidence = EXCLUDED.ai_confidence,
            diagnostic_stage = EXCLUDED.diagnostic_stage,
            diagnostic_progress = EXCLUDED.diagnostic_progress,
            actions_taken = EXCLUDED.actions_taken,
            resolution_details = EXCLUDED.resolution_details,
            escalation_info = EXCLUDED.escalation_info,
            chat_transcript = EXCLUDED.chat_transcript,
            notes = EXCLUDED.notes,
            updated_at = NOW();
        """
        actions_json = json.dumps([a.model_dump() for a in ticket.actions_taken])
        notes_json = json.dumps([n.model_dump() for n in ticket.notes])
        esc_json = json.dumps(ticket.escalation_info.model_dump()) if ticket.escalation_info else None

        params = (
            ticket.id,
            ticket.ticket_number,
            ticket.title,
            ticket.category,
            ticket.priority,
            ticket.status,
            ticket.location,
            ticket.device,
            ticket.netid,
            ticket.email,
            ticket.description,
            ticket.issue_summary,
            ticket.assigned_technician,
            ticket.ai_confidence,
            ticket.diagnostic_stage,
            ticket.diagnostic_progress,
            actions_json,
            ticket.resolution_details,
            esc_json,
            ticket.chat_transcript,
            notes_json,
            ticket.created_at or datetime.now(timezone.utc).isoformat(),
            ticket.updated_at or datetime.now(timezone.utc).isoformat(),
        )

        if cur is not None:
            cur.execute(sql, params)
        else:
            with db.get_cursor(commit=True) as cursor:
                cursor.execute(sql, params)

    def list_tickets(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        specialization: Optional[str] = None,
        netid: Optional[str] = None,
        search: Optional[str] = None,
        assigned_technician: Optional[str] = None,
    ) -> List[TicketResponse]:
        if db.is_connected():
            try:
                with db.get_cursor(commit=False) as cur:
                    query = "SELECT * FROM tickets WHERE 1=1"
                    params: List[Any] = []

                    if category:
                        query += " AND category = %s"
                        params.append(category)
                    if status:
                        query += " AND status = %s"
                        params.append(status)
                    if priority:
                        query += " AND priority = %s"
                        params.append(priority)
                    if netid:
                        query += " AND LOWER(netid) = %s"
                        params.append(netid.lower())
                    if assigned_technician:
                        query += " AND LOWER(assigned_technician) = %s"
                        params.append(assigned_technician.lower())
                    if search:
                        search_term = f"%{search.lower()}%"
                        query += " AND (LOWER(title) LIKE %s OR LOWER(description) LIKE %s OR LOWER(ticket_number) LIKE %s OR LOWER(netid) LIKE %s)"
                        params.extend([search_term, search_term, search_term, search_term])

                    query += " ORDER BY created_at DESC;"
                    cur.execute(query, tuple(params))
                    rows = cur.fetchall()
                    tickets = [self._row_to_ticket(r) for r in rows]

                    if specialization:
                        norm_spec = specialization.lower().replace("technician", "").strip()
                        filtered = []
                        for t in tickets:
                            cats = CATEGORY_TO_SPECIALIZATION.get(t.category, ["Support", "Other"])
                            if any(norm_spec in c.lower() for c in cats):
                                filtered.append(t)
                        return filtered

                    return tickets
            except Exception as e:
                logger.error(f"Error querying tickets from DB: {e}")

        # In-memory fallback
        results = self._tickets
        if category:
            results = [t for t in results if t.category == category]
        if status:
            results = [t for t in results if t.status == status]
        if priority:
            results = [t for t in results if t.priority == priority]
        if netid:
            results = [t for t in results if t.netid.lower() == netid.lower()]
        if assigned_technician:
            results = [t for t in results if t.assigned_technician and t.assigned_technician.lower() == assigned_technician.lower()]
        if search:
            q = search.lower()
            results = [
                t for t in results
                if q in t.title.lower()
                or q in t.description.lower()
                or q in t.ticket_number.lower()
                or q in t.netid.lower()
            ]
        if specialization:
            norm_spec = specialization.lower().replace("technician", "").strip()
            filtered = []
            for t in results:
                cats = CATEGORY_TO_SPECIALIZATION.get(t.category, ["Support", "Other"])
                if any(norm_spec in c.lower() for c in cats):
                    filtered.append(t)
            return filtered
        return results

    def create_ticket(self, data: TicketCreate) -> TicketResponse:
        now_iso = datetime.now(timezone.utc).isoformat()
        ticket_id = f"ticket-{random.randint(1000, 9999)}"
        ticket_number = f"INC-2026-{random.randint(1000, 9999)}"

        initial_actions = [
            ActionLogItem(
                id=f"act-{random.randint(1000, 9999)}",
                timestamp=now_iso,
                action="Incident ticket registered via CampusFix AI Portal",
                result=f"Category: {data.category} | Initial Priority: {data.priority}",
                actor="student",
            )
        ]

        initial_notes = [
            TicketNote(
                id=f"note-{random.randint(100, 999)}",
                author="CampusFix AI Intake System",
                author_role="system",
                text=f"New incident submitted for {data.location or 'Campus'}. Initial classification: {data.category}.",
                created_at=now_iso,
            )
        ]

        if data.chat_transcript:
            initial_notes.append(
                TicketNote(
                    id=f"note-{random.randint(100, 999)}",
                    author="CampusFix AI Specialist",
                    author_role="system",
                    text="Linked from live AI diagnostic troubleshooting session.",
                    created_at=now_iso,
                )
            )
            initial_actions.append(
                ActionLogItem(
                    id=f"act-{random.randint(1000, 9999)}",
                    timestamp=now_iso,
                    action="AI Diagnostic Session linked to incident",
                    result="Preliminary problem statements ingested from student conversation.",
                    actor="ai_specialist",
                )
            )

        new_ticket = TicketResponse(
            id=ticket_id,
            ticket_number=ticket_number,
            title=data.title.strip(),
            category=data.category,
            priority=data.priority,
            status="New",
            location=data.location.strip() if data.location else "Main Campus",
            netid=data.netid.strip() if data.netid else "student.user",
            email=data.email.strip() if data.email else "student@university.edu",
            description=data.description.strip(),
            issue_summary=data.issue_summary or data.description.strip()[:140],
            diagnostic_stage="Triage",
            diagnostic_progress=20,
            actions_taken=initial_actions,
            resolution_details=None,
            escalation_info=None,
            chat_transcript=data.chat_transcript,
            notes=initial_notes,
            created_at=now_iso,
            updated_at=now_iso,
        )

        self._tickets.insert(0, new_ticket)

        if db.is_connected():
            try:
                self._save_ticket_to_db(new_ticket)
            except Exception as e:
                logger.error(f"Error saving new ticket to DB: {e}")

        return new_ticket

    def get_ticket(self, ticket_id: str) -> Optional[TicketResponse]:
        if db.is_connected():
            try:
                with db.get_cursor(commit=False) as cur:
                    cur.execute(
                        "SELECT * FROM tickets WHERE id = %s OR ticket_number = %s LIMIT 1;",
                        (ticket_id, ticket_id),
                    )
                    row = cur.fetchone()
                    if row:
                        t = self._row_to_ticket(row)
                        # sync in-memory
                        for idx, existing in enumerate(self._tickets):
                            if existing.id == t.id:
                                self._tickets[idx] = t
                                break
                        return t
            except Exception as e:
                logger.error(f"Error getting ticket from DB: {e}")

        for t in self._tickets:
            if t.id == ticket_id or t.ticket_number == ticket_id:
                return t
        return None

    def update_ticket(self, ticket_id: str, data: TicketUpdate) -> Optional[TicketResponse]:
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        prev_status = ticket.status

        if data.title:
            ticket.title = data.title.strip()

        if data.assigned_technician is not None and data.assigned_technician != ticket.assigned_technician:
            old_tech = ticket.assigned_technician
            ticket.assigned_technician = data.assigned_technician.strip()
            ticket.actions_taken.append(
                ActionLogItem(
                    id=f"act-{random.randint(1000, 9999)}",
                    timestamp=now_iso,
                    action=f"Ticket assigned to technician '{ticket.assigned_technician}'",
                    result=f"Reassigned from '{old_tech}' to '{ticket.assigned_technician}'.",
                    actor="technician",
                )
            )

        if data.status:
            ticket.status = data.status
            if data.status == "Closed":
                ticket.diagnostic_stage = "Completed"
                ticket.diagnostic_progress = 100
                if prev_status != "Closed":
                    ticket.actions_taken.append(
                        ActionLogItem(
                            id=f"act-{random.randint(1000, 9999)}",
                            timestamp=now_iso,
                            action="Incident ticket closed and archived",
                            result="Verification complete. Ticket lifecycle finalized.",
                            actor="technician",
                        )
                    )
            elif data.status == "Resolved":
                ticket.diagnostic_stage = "Completed"
                ticket.diagnostic_progress = 100
                if prev_status != "Resolved":
                    ticket.actions_taken.append(
                        ActionLogItem(
                            id=f"act-{random.randint(1000, 9999)}",
                            timestamp=now_iso,
                            action="Incident status updated to Resolved",
                            result="Technician verified fix and recorded resolution.",
                            actor="technician",
                        )
                    )
            elif data.status == "Escalated":
                ticket.diagnostic_stage = "Completed"
                ticket.diagnostic_progress = 100
            elif data.status == "Assigned":
                ticket.diagnostic_stage = "Triage"
                ticket.diagnostic_progress = max(ticket.diagnostic_progress, 25)
                if prev_status != "Assigned":
                    ticket.actions_taken.append(
                        ActionLogItem(
                            id=f"act-{random.randint(1000, 9999)}",
                            timestamp=now_iso,
                            action=f"Ticket status set to Assigned ({ticket.assigned_technician})",
                            result="Technician assigned to case queue.",
                            actor="technician",
                        )
                    )
            elif data.status == "Acknowledged":
                ticket.diagnostic_stage = "Environment & Device"
                ticket.diagnostic_progress = max(ticket.diagnostic_progress, 35)
                if prev_status != "Acknowledged":
                    ticket.actions_taken.append(
                        ActionLogItem(
                            id=f"act-{random.randint(1000, 9999)}",
                            timestamp=now_iso,
                            action="Ticket acknowledged by technician",
                            result="Reviewing initial telemetry and client symptoms.",
                            actor="technician",
                        )
                    )
            elif data.status in ["Diagnosing"]:
                ticket.diagnostic_stage = "Troubleshooting"
                ticket.diagnostic_progress = max(ticket.diagnostic_progress, 50)
                if prev_status != "Diagnosing":
                    ticket.actions_taken.append(
                        ActionLogItem(
                            id=f"act-{random.randint(1000, 9999)}",
                            timestamp=now_iso,
                            action="Technician started active diagnostic work",
                            result="Running network probes, checking logs, and diagnosing root cause.",
                            actor="technician",
                        )
                    )
            elif data.status in ["In Progress", "Fix in Progress"]:
                ticket.diagnostic_stage = "Troubleshooting"
                ticket.diagnostic_progress = max(ticket.diagnostic_progress, 65)
                if prev_status not in ["In Progress", "Fix in Progress"]:
                    ticket.actions_taken.append(
                        ActionLogItem(
                            id=f"act-{random.randint(1000, 9999)}",
                            timestamp=now_iso,
                            action="Remediation / Fix in progress",
                            result="Applying technical workaround or configuration fix.",
                            actor="technician",
                        )
                    )
            elif data.status in ["Waiting for Student", "On Hold"]:
                ticket.diagnostic_stage = "Verification"
                ticket.diagnostic_progress = max(ticket.diagnostic_progress, 75)
                if prev_status not in ["Waiting for Student", "On Hold"]:
                    ticket.actions_taken.append(
                        ActionLogItem(
                            id=f"act-{random.randint(1000, 9999)}",
                            timestamp=now_iso,
                            action=f"Ticket placed on {data.status}",
                            result="Awaiting response from student or external dependency.",
                            actor="technician",
                        )
                    )
            elif data.status in ["New", "Open"] and ticket.diagnostic_progress > 30:
                ticket.diagnostic_stage = "Triage"
                ticket.diagnostic_progress = 20

        if data.priority:
            ticket.priority = data.priority
        if data.category:
            ticket.category = data.category
        if data.location:
            ticket.location = data.location
        if data.device:
            ticket.device = data.device
        if data.issue_summary:
            ticket.issue_summary = data.issue_summary
        if data.ai_confidence is not None:
            ticket.ai_confidence = data.ai_confidence
        if data.diagnostic_stage:
            ticket.diagnostic_stage = data.diagnostic_stage
        if data.diagnostic_progress is not None:
            ticket.diagnostic_progress = max(0, min(100, data.diagnostic_progress))
        if data.resolution_details is not None:
            ticket.resolution_details = data.resolution_details
        if data.escalation_info is not None:
            ticket.escalation_info = data.escalation_info

        if data.technician_note:
            note = TicketNote(
                id=f"note-{random.randint(1000, 9999)}",
                author=ticket.assigned_technician or "IT Support Specialist",
                author_role="technician",
                text=data.technician_note.strip(),
                created_at=now_iso,
            )
            ticket.notes.append(note)
            ticket.actions_taken.append(
                ActionLogItem(
                    id=f"act-{random.randint(1000, 9999)}",
                    timestamp=now_iso,
                    action="Work Note added by technician",
                    result=data.technician_note.strip()[:100] + ("..." if len(data.technician_note.strip()) > 100 else ""),
                    actor="technician",
                )
            )

        ticket.updated_at = now_iso

        if db.is_connected():
            try:
                self._save_ticket_to_db(ticket)
            except Exception as e:
                logger.error(f"Error updating ticket in DB: {e}")

        return ticket

    def add_action_log(
        self,
        ticket_id: str,
        action: str,
        result: str,
        actor: str = "technician",
    ) -> Optional[TicketResponse]:
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        item = ActionLogItem(
            id=f"act-{random.randint(1000, 9999)}",
            timestamp=now_iso,
            action=action.strip(),
            result=result.strip(),
            actor=actor if actor in ["ai_specialist", "student", "technician", "system"] else "system",
        )
        ticket.actions_taken.append(item)
        ticket.updated_at = now_iso

        if db.is_connected():
            try:
                self._save_ticket_to_db(ticket)
            except Exception as e:
                logger.error(f"Error saving action log to DB: {e}")

        return ticket

    def resolve_ticket(self, ticket_id: str, resolution_details: str) -> Optional[TicketResponse]:
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        ticket.status = "Resolved"
        ticket.diagnostic_stage = "Completed"
        ticket.diagnostic_progress = 100
        ticket.resolution_details = resolution_details.strip()
        ticket.updated_at = now_iso

        ticket.actions_taken.append(
            ActionLogItem(
                id=f"act-{random.randint(1000, 9999)}",
                timestamp=now_iso,
                action="Incident marked as Resolved by Helpdesk",
                result=f"Resolution recorded: {resolution_details.strip()[:100]}...",
                actor="technician",
            )
        )

        if db.is_connected():
            try:
                self._save_ticket_to_db(ticket)
            except Exception as e:
                logger.error(f"Error saving resolved ticket to DB: {e}")

        return ticket

    def close_ticket(self, ticket_id: str, notes: Optional[str] = None) -> Optional[TicketResponse]:
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        ticket.status = "Closed"
        ticket.diagnostic_stage = "Completed"
        ticket.diagnostic_progress = 100
        ticket.updated_at = now_iso

        if notes:
            ticket.notes.append(
                TicketNote(
                    id=f"note-{random.randint(1000, 9999)}",
                    author=ticket.assigned_technician or "IT Support Specialist",
                    author_role="technician",
                    text=f"Closing Note: {notes.strip()}",
                    created_at=now_iso,
                )
            )

        ticket.actions_taken.append(
            ActionLogItem(
                id=f"act-{random.randint(1000, 9999)}",
                timestamp=now_iso,
                action="Incident officially closed and archived",
                result=f"Closed with verification. {notes.strip()[:80] if notes else 'All requirements satisfied.'}",
                actor="technician",
            )
        )

        if db.is_connected():
            try:
                self._save_ticket_to_db(ticket)
            except Exception as e:
                logger.error(f"Error closing ticket in DB: {e}")

        return ticket

    def escalate_ticket(self, ticket_id: str, escalation_info: EscalationDetails) -> Optional[TicketResponse]:
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        ticket.status = "Escalated"
        ticket.diagnostic_stage = "Completed"
        ticket.diagnostic_progress = 100
        ticket.escalation_info = escalation_info
        ticket.updated_at = now_iso

        ticket.actions_taken.append(
            ActionLogItem(
                id=f"act-{random.randint(1000, 9999)}",
                timestamp=now_iso,
                action=f"Incident escalated to {escalation_info.tier} ({escalation_info.department})",
                result=f"Reason: {escalation_info.reason[:100]}...",
                actor="technician",
            )
        )

        if db.is_connected():
            try:
                self._save_ticket_to_db(ticket)
            except Exception as e:
                logger.error(f"Error escalating ticket in DB: {e}")

        return ticket

    def reassign_technician(
        self,
        ticket_id: str,
        new_technician: str,
        reassignment_notes: Optional[str] = None,
        actor: str = "Host / Admin",
    ) -> Optional[TicketResponse]:
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        prev_technician = ticket.assigned_technician or "Unassigned"
        ticket.assigned_technician = new_technician
        ticket.status = "Diagnosing"
        ticket.updated_at = now_iso

        note_text = f"Technician reassigned from '{prev_technician}' to '{new_technician}' by {actor}."
        if reassignment_notes:
            note_text += f" Notes: {reassignment_notes.strip()}"

        ticket.notes.append(
            TicketNote(
                id=f"note-{random.randint(1000, 9999)}",
                author=actor,
                author_role="admin" if "host" in actor.lower() or "admin" in actor.lower() else "technician",
                text=note_text,
                created_at=now_iso,
            )
        )

        ticket.actions_taken.append(
            ActionLogItem(
                id=f"act-{random.randint(1000, 9999)}",
                timestamp=now_iso,
                action=f"Incident reassigned to {new_technician}",
                result=f"Reassigned by {actor}. Status reset to Diagnosing. {reassignment_notes or ''}".strip(),
                actor="technician",
            )
        )

        if db.is_connected():
            try:
                self._save_ticket_to_db(ticket)
            except Exception as e:
                logger.error(f"Error reassigning ticket in DB: {e}")

        return ticket

    def analyze_ticket(self, ticket_id: str) -> Optional[TicketAIAnalysisResponse]:
        """Generates real-time AI diagnostic reasoning, root cause analysis, and technician dispatch recommendations."""
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return None

        title = ticket.title or ""
        desc = ticket.description or ""
        cat = ticket.category or "Other"
        combined_text = f"{title} {desc}".lower()

        # 1. Detected category and confidence
        cat_confidence = 0.95 if cat != "Other" else 0.78
        detected_category = cat

        # 2. Priority estimation and rationale
        estimated_priority = ticket.priority
        priority_rationale = f"Classified as {estimated_priority} based on campus impact, device context ({ticket.device or 'Standard Client'}), and location ({ticket.location or 'Campus'})."
        if "exam" in combined_text or "midterm" in combined_text or "deadline" in combined_text:
            estimated_priority = "High" if estimated_priority != "Critical" else "Critical"
            priority_rationale = "Elevated to High/Urgent priority due to imminent academic submission or exam deadline."

        # 3. Recommended Specialization
        spec_map = {
            "Eduroam Wi-Fi": ("Network", "Requires wireless 802.1X RADIUS profile verification and AP telemetry check."),
            "Dorm ResNet": ("Network", "Requires physical Ethernet port link-state check and switchport VLAN validation."),
            "VPN": ("Network", "Requires GlobalProtect gateway routing and IPsec tunnel diagnostic."),
            "Canvas / SSO": ("Software", "Requires LMS SAML token inspection and browser session cookie clearing."),
            "Software": ("Software", "Requires license server handshake and application package verification."),
            "Lab / Computer Access": ("Hardware", "Requires physical computer lab terminal inspection and peripheral check."),
            "PaperCut Printing": ("Hardware", "Requires print queue spooler service buffer inspection and badge reader verification."),
            "Duo MFA": ("IAM / Access", "Requires Identity & Access Management hardware token migration or bypass passcode issuance."),
            "NetID / Password": ("IAM / Access", "Requires Active Directory credential sync and lockout status reset."),
            "Email": ("IAM / Access", "Requires Exchange Online / IMAP routing audit."),
        }
        recommended_spec, spec_rationale = spec_map.get(cat, ("Support", "General campus IT helpdesk and first-contact diagnostic triage."))

        # 4. Root Cause Hypothesis & Summary for Technician
        root_cause = f"Potential protocol mismatch or client-side caching issue affecting {cat} services."
        summary = f"Student {ticket.netid} reports persistent trouble with {cat} at {ticket.location}. Device: {ticket.device or 'Not specified'}."

        if "wifi" in combined_text or "eduroam" in combined_text or "802.1x" in combined_text:
            root_cause = "802.1X EAP-PEAP trust chain failure or cached outdated campus root certificate."
            summary = "Student client device failing RADIUS authentication handshake on campus access points."
        elif "duo" in combined_text or "mfa" in combined_text or "2fa" in combined_text:
            root_cause = "Device migration token de-synchronization or missing push notification push token."
            summary = "Student cannot receive Duo Push authorization prompts following device update."
        elif "papercut" in combined_text or "print" in combined_text or "spooler" in combined_text:
            root_cause = "WebPrint spooler buffer queue stall or paper jam at destination release station."
            summary = "Submitted print job stalled in queue buffer; requires release station service refresh."
        elif "canvas" in combined_text or "sso" in combined_text or "login" in combined_text:
            root_cause = "Stale Shibboleth/SAML session cookie loop preventing identity assertion."
            summary = "Single Sign-On redirect loop on academic learning portal."

        # 5. Suggested Diagnostic Steps
        diagnostic_steps = [
            f"Verify client authentication identity format ({ticket.netid}@university.edu).",
            f"Inspect live service telemetry on {cat} infrastructure cluster.",
            "Review diagnostic logs and clear client-side security profiles/cookies.",
            "Perform live test handshake and validate end-to-end functionality.",
        ]
        if cat == "Eduroam Wi-Fi":
            diagnostic_steps = [
                "Verify EAP Method is PEAP and Phase 2 Auth is MSCHAPv2.",
                "Ensure CA Certificate domain is explicitly set to 'university.edu'.",
                "Forget network and re-enter full NetID email address.",
                "Run AP probe test for nearest campus access point.",
            ]
        elif cat == "PaperCut Printing":
            diagnostic_steps = [
                "Inspect print server spooler status for Library / Lab release station.",
                "Check student balance and refund unreleased quota ($1.40).",
                "Ensure document format conforms to standard PDF specifications.",
                "Restart release station local daemon if display is stalled.",
            ]
        elif cat == "Duo MFA":
            diagnostic_steps = [
                "Instruct student to open Duo Mobile directly and pull down to refresh.",
                "Verify student photo ID for Tech Bar physical walkup security clearance.",
                "Generate a 6-digit emergency bypass code in IAM management console.",
                "Re-enroll primary smartphone device token.",
            ]

        # 6. Next Best Action
        next_action = f"Execute first diagnostic step with student and verify status on {cat} cluster."
        if ticket.status == "Escalated":
            next_action = f"Host dispatcher: Assign incident to active {recommended_spec} technician from roster."
        elif ticket.diagnostic_progress >= 75:
            next_action = "Validate resolution with student and finalize ticket closure."

        # 7. Escalation Risk Assessment
        escalation_risk = "Low risk — routine self-service or Tier-1 diagnostic resolution expected within 15 minutes."
        if estimated_priority in ["High", "Critical", "Urgent"] or "midterm" in combined_text:
            escalation_risk = "High risk — requires expedited Tech Bar walkup clearance or Tier-2 senior engineer intervention."

        # 8. Similar Incidents
        similar = []
        for other in self._tickets:
            if other.id != ticket.id and (other.category == ticket.category or (other.location and other.location == ticket.location)):
                similar.append(f"{other.ticket_number}: {other.title[:45]}... [{other.status}]")
                if len(similar) >= 3:
                    break

        host_advice = f"{recommended_spec} queue currently optimal. Recommended assignee: Available on-duty {recommended_spec} engineer."

        return TicketAIAnalysisResponse(
            ticket_id=ticket.id,
            ticket_number=ticket.ticket_number,
            detected_category=detected_category,
            category_confidence_score=cat_confidence,
            estimated_priority=estimated_priority,
            priority_rationale=priority_rationale,
            recommended_specialization=recommended_spec,
            specialization_rationale=spec_rationale,
            summary_for_technician=summary,
            root_cause_hypothesis=root_cause,
            suggested_diagnostic_steps=diagnostic_steps,
            next_best_action=next_action,
            escalation_risk_assessment=escalation_risk,
            similar_incidents_detected=similar,
            host_workload_advice=host_advice,
        )

    def reset_data(self) -> Dict[str, Any]:
        """Resets ticket database to clean default initial state."""
        self.__init__()
        if db.is_connected():
            try:
                with db.get_cursor(commit=True) as cur:
                    cur.execute("DELETE FROM tickets;")
                    for t in self._tickets:
                        self._save_ticket_to_db(t, cur=cur)
            except Exception as e:
                logger.error(f"Error resetting tickets in DB: {e}")
        return {"status": "success", "message": "All tickets reset to clean state.", "total_tickets": len(self._tickets)}


ticket_service = TicketService()
