import random
from typing import List, Optional
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
)


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
                chat_transcript="Student: 'Can't join eduroam'\nAI Specialist: 'Asked for device OS and suggested CA cert domain university.edu.'",
                notes=[
                    TicketNote(
                        id="note-1",
                        author="AI Auto-Triage",
                        author_role="system",
                        text="Identified Android 14 strict CA certificate requirement. Routed to standard PEAP troubleshooting workflow.",
                        created_at=now_iso,
                    ),
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
                description="Sent 14-page PDF via WebPrint. Station terminal displayed 'Processing' for 20 minutes without physical output.",
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
                        action="PaperCut account balance credit check",
                        result="14-page deduction refunded to student account (+$1.40).",
                        actor="system",
                    ),
                ],
                resolution_details="Cleared PaperCut queue spooler buffer and released physical output. $1.40 print quota automatically credited back to student PaperCut balance.",
                escalation_info=None,
                chat_transcript=None,
                notes=[
                    TicketNote(
                        id="note-3",
                        author="Helpdesk Staff (Dave)",
                        author_role="technician",
                        text="Printer feeder cleaned and queue cleared. Document successfully picked up by student.",
                        created_at=now_iso,
                    )
                ],
                created_at=now_iso,
                updated_at=now_iso,
            ),
            TicketResponse(
                id="ticket-103",
                ticket_number="INC-2026-8920",
                title="Duo 2FA Push Push Notification Timeout after iOS 18 Upgrade",
                category="Duo MFA",
                priority="High",
                status="Escalated",
                location="Residential Hall B, Rm 112",
                netid="j.williams",
                email="j.williams@university.edu",
                description="Upgraded to iPhone 16. Duo push requests never appear on lock screen. Unable to complete MFA for Canvas midterm submission.",
                issue_summary="Hardware token migration required following iOS device upgrade; student requires in-person ID verification for bypass code.",
                diagnostic_stage="Completed",
                diagnostic_progress=100,
                actions_taken=[
                    ActionLogItem(
                        id="act-5",
                        timestamp=now_iso,
                        action="Attempted Duo self-service device reactivation guide via SMS",
                        result="Student does not have previous device available to authorize transfer.",
                        actor="ai_specialist",
                    ),
                    ActionLogItem(
                        id="act-6",
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
                    reason="Student lacks access to registered secondary Duo device. In-person government/student photo ID required to issue permanent Duo reactivation link.",
                    assigned_to="Sarah Jenkins (Tech Bar Lead)",
                    tech_bar_location="Main Library, 1st Floor Tech Bar (Mon–Fri 8am–7pm)",
                    student_id_required=True,
                    notes="Student has urgent midterm deadline. Expedited walkup queue pass granted.",
                    escalated_at=now_iso,
                ),
                chat_transcript="Student: 'Locked out of Canvas before exam due to Duo.'",
                notes=[
                    TicketNote(
                        id="note-4",
                        author="AI Auto-Triage",
                        author_role="system",
                        text="High priority: Student mentions time-sensitive assignment deadline. Escalation dossier created.",
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
                actions_taken=[
                    ActionLogItem(
                        id="act-7",
                        timestamp=now_iso,
                        action="Ticket intake recorded from Student Portal",
                        result="Assigned category 'Dorm ResNet' and status 'New'.",
                        actor="system",
                    )
                ],
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
                actions_taken=[
                    ActionLogItem(
                        id="act-8",
                        timestamp=now_iso,
                        action="Verified Central Shibboleth / SAML IdP status",
                        result="Identity Provider operational (0 authentication errors reported).",
                        actor="system",
                    ),
                    ActionLogItem(
                        id="act-9",
                        timestamp=now_iso,
                        action="Recommended Incognito / Private window login test",
                        result="Awaiting student test result to confirm whether local browser cache is the root cause.",
                        actor="ai_specialist",
                    ),
                ],
                resolution_details=None,
                escalation_info=None,
                chat_transcript="Student: 'Canvas keeps looping back to login.'\nAI Specialist: 'Try logging in via Incognito window.'",
                notes=[],
                created_at=now_iso,
                updated_at=now_iso,
            ),
            TicketResponse(
                id="ticket-106",
                ticket_number="INC-2026-8840",
                title="Engineering CAD Computer Lab Workstation Login Lockout",
                category="Lab / Computer Access",
                priority="Medium",
                status="Resolved",
                location="Engineering Hall, Lab 110",
                netid="r.kim",
                email="r.kim@university.edu",
                description="Unable to sign into Lab 110 CAD Workstation #14 with NetID. Stated 'The trust relationship between this workstation and the primary domain failed.'",
                issue_summary="Domain trust relationship re-established by lab technician via domain rejoin.",
                diagnostic_stage="Completed",
                diagnostic_progress=100,
                actions_taken=[
                    ActionLogItem(
                        id="act-10",
                        timestamp=now_iso,
                        action="Lab technician checked machine Active Directory computer account",
                        result="Machine trust key expired; workstation rejoined to campus AD domain.",
                        actor="technician",
                    )
                ],
                resolution_details="Lab Workstation #14 securely rejoined to Active Directory domain. Student verified successful login with SolidWorks profile loaded.",
                escalation_info=None,
                chat_transcript=None,
                notes=[],
                created_at=now_iso,
                updated_at=now_iso,
            ),
        ]

    def list_tickets(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        assigned_technician: Optional[str] = None,
        specialization: Optional[str] = None,
    ) -> List[TicketResponse]:
        results = self._tickets
        if status and status.lower() != "all":
            results = [t for t in results if t.status.lower() == status.lower()]
        if category and category.lower() != "all":
            results = [t for t in results if t.category.lower() == category.lower()]
        if assigned_technician and assigned_technician.lower() != "all":
            tech_q = assigned_technician.lower()
            results = [t for t in results if tech_q in (t.assigned_technician or "").lower()]
        if specialization and specialization.lower() != "all":
            spec_q = specialization.strip().lower()
            filtered_by_spec = []
            for t in results:
                allowed_specs = [s.lower() for s in CATEGORY_TO_SPECIALIZATION.get(t.category, ["support", "other"])]
                # Check if specialization matches category or escalation target or assigned technician
                if any(spec_q in s or s in spec_q for s in allowed_specs):
                    filtered_by_spec.append(t)
                elif t.escalation_info and t.escalation_info.target_specialization and spec_q in t.escalation_info.target_specialization.lower():
                    filtered_by_spec.append(t)
                elif t.assigned_technician and spec_q in t.assigned_technician.lower():
                    filtered_by_spec.append(t)
            results = filtered_by_spec
        if search:
            q = search.lower()
            results = [
                t
                for t in results
                if q in t.title.lower()
                or q in t.ticket_number.lower()
                or q in t.description.lower()
                or q in t.netid.lower()
                or q in t.location.lower()
                or q in t.category.lower()
            ]
        # Return sorted with newest first
        return sorted(results, key=lambda x: x.created_at, reverse=True)

    def create_ticket(self, data: TicketCreate) -> TicketResponse:
        now_iso = datetime.now(timezone.utc).isoformat()
        random_suffix = random.randint(1000, 9999)
        ticket_number = f"INC-2026-{random_suffix}"
        ticket_id = f"ticket-{int(datetime.now(timezone.utc).timestamp())}"

        initial_notes = []
        initial_actions = [
            ActionLogItem(
                id=f"act-{random.randint(1000, 9999)}",
                timestamp=now_iso,
                action="Incident ticket registered in CampusFix IT Resolver",
                result="Status initialized as 'New'. Auto-triage active.",
                actor="system",
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
        return new_ticket

    def get_ticket(self, ticket_id: str) -> Optional[TicketResponse]:
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
            # Automatically adjust diagnostic stage & progress based on status
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
        return ticket


ticket_service = TicketService()
