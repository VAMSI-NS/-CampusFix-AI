import {
  Ticket,
  SystemStatusResponse,
  KBArticle,
  CampusUser,
  TechnicianSpecialization,
  AnalyticsGraphsResponse,
  ReportSummaryResponse,
  DiagnosticProbeResult,
  TicketAIAnalysisResponse,
  CampusLocation,
  CampusMapDataResponse,
  MapAuditEntry,
  HostAITask,
} from '../types/chat';

export const INITIAL_MOCK_TICKETS: Ticket[] = [
  {
    "id": "t-seed-1042",
    "ticket_number": "INC-2026-1042",
    "title": "U-Block Eduroam 802.1X handshake timeout in CSE Lab 3",
    "category": "Eduroam Wi-Fi",
    "priority": "High",
    "status": "In Progress",
    "location": "U-Block (CSE/IT Labs)",
    "device": "macOS Sonoma (M2 MacBook Pro)",
    "netid": "st2024cse101",
    "email": "st2024cse101@vignan.ac.in",
    "description": "Students in the main academic block are unable to connect to Eduroam. Several students report authentication failures and 802.1X handshake timeouts when roaming between AP-UB301 and AP-UB302 in Lab 3.",
    "issue_summary": "Eduroam 802.1X authentication failures in U-Block CSE Lab 3 affecting multiple student laptops.",
    "assigned_technician": "Alex Rivera",
    "ai_confidence": 94,
    "diagnostic_stage": "Troubleshooting",
    "diagnostic_progress": 65,
    "actions_taken": [
      {
        "id": "act-1042-1",
        "timestamp": "2026-08-29T08:30:00Z",
        "action": "Analyzed RADIUS authentication logs for AP-UB301/302",
        "actor": "ai_specialist",
        "result": "Discovered frequent EAP-TLS packet drop during 802.1X key exchange"
      },
      {
        "id": "act-1042-2",
        "timestamp": "2026-08-29T08:45:00Z",
        "action": "Assigned to Network Specialist Alex Rivera",
        "actor": "system",
        "result": "Dispatched for access point channel audit"
      }
    ],
    "resolution_details": null,
    "escalation_info": null,
    "chat_transcript": null,
    "notes": [
      {
        "id": "note-1042-1",
        "author": "Alex Rivera",
        "author_role": "technician",
        "text": "Rebooted access point AP-UB301. Monitoring client association rates.",
        "created_at": "2026-08-29T09:00:00Z"
      }
    ],
    "created_at": "2026-08-29T08:15:00Z",
    "updated_at": "2026-08-29T09:00:00Z"
  },
  {
    "id": "t-seed-1043",
    "ticket_number": "INC-2026-1043",
    "title": "Intermittent Wi-Fi disconnections on 2nd Floor Reading Room",
    "category": "Eduroam Wi-Fi",
    "priority": "Medium",
    "status": "Diagnosing",
    "location": "NTR Library (Digital Resource Center)",
    "device": "Windows 11 Dell Inspiron",
    "netid": "st2023ece045",
    "email": "st2023ece045@vignan.ac.in",
    "description": "Library users are experiencing intermittent Wi-Fi disconnections. The issue started this morning on the 2nd Floor Quiet Study and Reading Room.",
    "issue_summary": "Intermittent Wi-Fi client disconnects and low RSSI reported in NTR Library 2nd Floor.",
    "assigned_technician": "Alex Rivera",
    "ai_confidence": 88,
    "diagnostic_stage": "Environment & Device",
    "diagnostic_progress": 40,
    "actions_taken": [
      {
        "id": "act-1043-1",
        "timestamp": "2026-08-29T08:50:00Z",
        "action": "Gathered RSSI signal heatmaps from NTR Library AP-LIB201",
        "actor": "ai_specialist",
        "result": "Identified co-channel interference on 5GHz Band 1"
      }
    ],
    "resolution_details": null,
    "escalation_info": null,
    "chat_transcript": null,
    "notes": [],
    "created_at": "2026-08-29T08:40:00Z",
    "updated_at": "2026-08-29T08:50:00Z"
  },
  {
    "id": "t-seed-1044",
    "ticket_number": "INC-2026-1044",
    "title": "Duo 2FA push notifications not arriving on staff mobile devices",
    "category": "Duo MFA",
    "priority": "High",
    "status": "In Progress",
    "location": "A-Block (Admin & Central Offices)",
    "device": "iPhone 15 (iOS 17.5) & Pixel 8",
    "netid": "staff_dean_acad",
    "email": "dean_acad@vignan.ac.in",
    "description": "Duo 2FA push notifications are not arriving for several staff members in the Registrar and Dean offices. Mobile passcodes and SMS fallback still work but push is timing out.",
    "issue_summary": "Duo Mobile Push timeout affecting administrative staff during SSO authentication.",
    "assigned_technician": "Marcus Vance",
    "ai_confidence": 92,
    "diagnostic_stage": "Troubleshooting",
    "diagnostic_progress": 55,
    "actions_taken": [
      {
        "id": "act-1044-1",
        "timestamp": "2026-08-29T08:20:00Z",
        "action": "Inspected Duo Cloud Gateway webhook latency",
        "actor": "ai_specialist",
        "result": "APNs push delivery queue delayed; instructed users to use 6-digit passcode"
      }
    ],
    "resolution_details": null,
    "escalation_info": null,
    "chat_transcript": null,
    "notes": [],
    "created_at": "2026-08-29T08:10:00Z",
    "updated_at": "2026-08-29T08:20:00Z"
  },
  {
    "id": "t-seed-1045",
    "ticket_number": "INC-2026-1045",
    "title": "Canvas assignment submission portal HTTP 504 Gateway Timeout",
    "category": "Canvas / SSO",
    "priority": "Critical",
    "status": "Escalated",
    "location": "A-Block (Admin & Central Offices)",
    "device": "Google Chrome 124 / All Browsers",
    "netid": "fac_cse_raghav",
    "email": "raghav_cse@vignan.ac.in",
    "description": "Canvas assignment submission portal is throwing HTTP 504 gateway timeout errors during midterm submission deadline. Multiple classes cannot submit PDF assignments.",
    "issue_summary": "Canvas LMS file upload backend 504 gateway timeout under peak midterm submission traffic.",
    "assigned_technician": "Jordan Smith",
    "ai_confidence": 96,
    "diagnostic_stage": "Troubleshooting",
    "diagnostic_progress": 70,
    "actions_taken": [
      {
        "id": "act-1045-1",
        "timestamp": "2026-08-29T09:10:00Z",
        "action": "Correlated high-concurrency upload traffic spike in reverse proxy",
        "actor": "ai_specialist",
        "result": "Proxy buffer overflow on multipart file ingest"
      }
    ],
    "resolution_details": null,
    "escalation_info": {
      "tier": "Tier-2 Technical Escalation",
      "department": "Campus IT Systems Engineering",
      "reason": "Affects university-wide midterm submissions with imminent deadline",
      "notes": "Scaled backend container pool and notified academic deans",
      "tech_bar_location": "Main Library, 1st Floor Tech Bar (Mon-Fri 8:00 AM - 7:00 PM)",
      "student_id_required": true,
      "escalated_at": "2026-08-29T09:15:00Z"
    },
    "chat_transcript": null,
    "notes": [],
    "created_at": "2026-08-29T09:05:00Z",
    "updated_at": "2026-08-29T09:15:00Z"
  },
  {
    "id": "t-seed-1046",
    "ticket_number": "INC-2026-1046",
    "title": "PaperCut print queue holding jobs with 'Server Offline' banner",
    "category": "PaperCut Printing",
    "priority": "Medium",
    "status": "Diagnosing",
    "location": "NTR Library (Digital Resource Center)",
    "device": "Windows 10 Workstation / HP LaserJet Enterprise",
    "netid": "st2024mec012",
    "email": "st2024mec012@vignan.ac.in",
    "description": "Students cannot release print jobs from the 1st Floor Digital Printing Kiosk in NTR Library. The PaperCut client displays 'Print Server Communication Lost'.",
    "issue_summary": "PaperCut print release station communication failure at NTR Library kiosk.",
    "assigned_technician": "Sam Chen",
    "ai_confidence": 89,
    "diagnostic_stage": "Environment & Device",
    "diagnostic_progress": 35,
    "actions_taken": [],
    "resolution_details": null,
    "escalation_info": null,
    "chat_transcript": null,
    "notes": [],
    "created_at": "2026-08-29T08:55:00Z",
    "updated_at": "2026-08-29T08:55:00Z"
  },
  {
    "id": "t-seed-1047",
    "ticket_number": "INC-2026-1047",
    "title": "CAD/SolidWorks license checkout failed (Error -96: Server down)",
    "category": "Lab / Computer Access",
    "priority": "High",
    "status": "In Progress",
    "location": "Visvesvaraya Block (Mechanical/Civil)",
    "device": "Dell Precision 3660 CAD Workstations",
    "netid": "st2023mec088",
    "email": "st2023mec088@vignan.ac.in",
    "description": "FLEXlm license manager is rejecting CAD workstation checkouts in Visvesvaraya CAD Lab 204 with Error -96 (Cannot connect to license server system).",
    "issue_summary": "SolidWorks & ANSYS FLEXlm floating license manager service unreachable from CAD Lab.",
    "assigned_technician": "Priya Patel",
    "ai_confidence": 93,
    "diagnostic_stage": "Troubleshooting",
    "diagnostic_progress": 50,
    "actions_taken": [
      {
        "id": "act-1047-1",
        "timestamp": "2026-08-29T08:45:00Z",
        "action": "Pinged LMTOOLS license host on port 27000",
        "actor": "ai_specialist",
        "result": "TCP connection refused on port 27000; daemon service stopped"
      }
    ],
    "resolution_details": null,
    "escalation_info": null,
    "chat_transcript": null,
    "notes": [],
    "created_at": "2026-08-29T08:35:00Z",
    "updated_at": "2026-08-29T08:45:00Z"
  },
  {
    "id": "t-seed-1048",
    "ticket_number": "INC-2026-1048",
    "title": "NetID account locked after 5 password attempts on portal",
    "category": "NetID / Password",
    "priority": "Medium",
    "status": "Resolved",
    "location": "Pharmacy College",
    "device": "Android 14 Chrome",
    "netid": "st2024pha031",
    "email": "st2024pha031@vignan.ac.in",
    "description": "Student forgot university portal password and locked account. Automated self-service unlock link is expired.",
    "issue_summary": "NetID identity lock reset and self-service credential renewal.",
    "assigned_technician": "Casey Torres",
    "ai_confidence": 98,
    "diagnostic_stage": "Completed",
    "diagnostic_progress": 100,
    "actions_taken": [
      {
        "id": "act-1048-1",
        "timestamp": "2026-08-29T07:45:00Z",
        "action": "Verified student ID through institutional biometric verification record",
        "actor": "ai_specialist",
        "result": "Identity confirmed"
      },
      {
        "id": "act-1048-2",
        "timestamp": "2026-08-29T07:50:00Z",
        "action": "Dispatched secure password reset token via SMS",
        "actor": "technician",
        "result": "NetID unlocked and password successfully updated"
      }
    ],
    "resolution_details": "NetID account unlocked after student identity verification. Temporary password issued and registered with Duo MFA.",
    "escalation_info": null,
    "chat_transcript": null,
    "notes": [],
    "created_at": "2026-08-29T07:30:00Z",
    "updated_at": "2026-08-29T07:52:00Z"
  },
  {
    "id": "t-seed-1049",
    "ticket_number": "INC-2026-1049",
    "title": "Overheated Cisco Catalyst switch powering IoT lab sensors",
    "category": "Software",
    "priority": "Low",
    "status": "New",
    "location": "Textile Department",
    "device": "Cisco Catalyst 2960X Switch",
    "netid": "fac_txt_mohan",
    "email": "mohan_txt@vignan.ac.in",
    "description": "Network rack fan unit in Textile Lab 102 is making loud humming noise and temperature alarm amber LED is blinking.",
    "issue_summary": "Lab switch rack cooling fan anomaly requiring physical maintenance.",
    "assigned_technician": "Jordan Smith",
    "ai_confidence": 85,
    "diagnostic_stage": "Triage",
    "diagnostic_progress": 15,
    "actions_taken": [],
    "resolution_details": null,
    "escalation_info": null,
    "chat_transcript": null,
    "notes": [],
    "created_at": "2026-08-29T09:12:00Z",
    "updated_at": "2026-08-29T09:12:00Z"
  },
  {
    "id": "t-seed-1050",
    "ticket_number": "INC-2026-1050",
    "title": "MATLAB Distributed Computing server node unresponsive",
    "category": "Software",
    "priority": "Medium",
    "status": "Diagnosing",
    "location": "Visvesvaraya Block (Mechanical/Civil)",
    "device": "Ubuntu 22.04 LTS Compute Cluster",
    "netid": "res2023civ004",
    "email": "res2023civ004@vignan.ac.in",
    "description": "Research compute node in Visvesvaraya cluster is dropping parallel computing jobs with connection reset errors.",
    "issue_summary": "MATLAB MDCS compute worker daemon crash on node-04.",
    "assigned_technician": "Priya Patel",
    "ai_confidence": 91,
    "diagnostic_stage": "Environment & Device",
    "diagnostic_progress": 30,
    "actions_taken": [],
    "resolution_details": null,
    "escalation_info": null,
    "chat_transcript": null,
    "notes": [],
    "created_at": "2026-08-29T08:50:00Z",
    "updated_at": "2026-08-29T08:50:00Z"
  },
  {
    "id": "t-seed-1051",
    "ticket_number": "INC-2026-1051",
    "title": "Multiple students reporting 'Authentication Failed' on Eduroam in U-Block",
    "category": "Eduroam Wi-Fi",
    "priority": "High",
    "status": "New",
    "location": "U-Block (CSE/IT Labs)",
    "device": "Android 14 & iOS 17 Student Phones",
    "netid": "st2024it056",
    "email": "st2024it056@vignan.ac.in",
    "description": "Second floor hallway in U-Block has no Eduroam access. Phone prompts for certificate again and fails with handshake timeout.",
    "issue_summary": "Correlated Eduroam 802.1X certificate handshake outage in U-Block (clusters with INC-2026-1042).",
    "assigned_technician": "Alex Rivera",
    "ai_confidence": 95,
    "diagnostic_stage": "Triage",
    "diagnostic_progress": 20,
    "actions_taken": [
      {
        "id": "act-1051-1",
        "timestamp": "2026-08-29T09:22:00Z",
        "action": "AI Incident Intelligence correlated incident with INC-2026-1042",
        "actor": "ai_specialist",
        "result": "Detected U-Block Wi-Fi Cluster with 94% similarity"
      }
    ],
    "resolution_details": null,
    "escalation_info": null,
    "chat_transcript": null,
    "notes": [],
    "created_at": "2026-08-29T09:20:00Z",
    "updated_at": "2026-08-29T09:22:00Z"
  }
];

export const INITIAL_MOCK_USERS: CampusUser[] = [
  {
    id: 'user-host-vamsi',
    technician_id: 'HOST-001',
    name: 'vamsi',
    username: 'vamsi',
    email: 'vamsi@campusfix.edu',
    netid: 'vamsi',
    role: 'host',
    department: 'Office of the University CIO & Campus Governance',
    status: 'active',
    is_active: true,
    phone: '+1 (555) 019-9000',
    active_assignments_count: 0,
    avatar_initials: 'VA',
    skills: ['Platform Administrator', 'System Governance', 'SLA Auditing', 'Infrastructure Ops'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-tech-anand',
    technician_id: 'TECH-001',
    name: 'Anand Sen',
    username: 'anand',
    email: 'anand@campusfix.edu',
    netid: 'anand',
    role: 'technician',
    specialization: 'Network',
    department: 'Campus IT Operations & Network Infrastructure',
    status: 'active',
    is_active: true,
    phone: '+1 (555) 014-4112',
    active_assignments_count: 0,
    avatar_initials: 'AS',
    skills: ['Eduroam 802.1X', 'RADIUS', 'Campus Infrastructure', 'IAM Diagnostics'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-student-1',
    technician_id: undefined,
    name: 'Student User',
    username: 'student',
    email: 'student@university.edu',
    netid: 'student',
    roll_number: 'STUDENT',
    role: 'student',
    department: 'Undergraduate Studies',
    status: 'active',
    is_active: true,
    active_assignments_count: 0,
    avatar_initials: 'SU',
    skills: ['Student'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-student-2',
    technician_id: undefined,
    name: 'Marcus Chen',
    username: '211fa04001',
    email: '211fa04001@university.edu',
    netid: '211fa04001',
    roll_number: '211FA04001',
    role: 'student',
    department: 'Computer Science & Engineering',
    status: 'active',
    is_active: true,
    active_assignments_count: 0,
    avatar_initials: 'MC',
    skills: ['Student'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-student-3',
    technician_id: undefined,
    name: 'Priya Patel',
    username: '211fa04002',
    email: '211fa04002@university.edu',
    netid: '211fa04002',
    roll_number: '211FA04002',
    role: 'student',
    department: 'School of Business',
    status: 'active',
    is_active: true,
    active_assignments_count: 0,
    avatar_initials: 'PP',
    skills: ['Student'],
    created_at: new Date().toISOString(),
  },
];

export function generateClientTicketAnalysis(
  ticket: Ticket,
  allTickets: Ticket[] = []
): TicketAIAnalysisResponse {
  const title = ticket.title || '';
  const desc = ticket.description || '';
  const cat = ticket.category || 'Other';
  const combined = `${title} ${desc}`.toLowerCase();

  let estimatedPriority = ticket.priority;
  let priorityRationale = `Calculated as ${estimatedPriority} based on campus impact, device context (${ticket.device || 'Campus Client'}), and student location.`;

  if (combined.includes('exam') || combined.includes('midterm') || combined.includes('deadline') || combined.includes('urgent')) {
    estimatedPriority = 'High';
    priorityRationale = 'Priority elevated to High due to imminent academic exam/submission deadline context.';
  }

  const specMap: Record<string, [string, string]> = {
    'Eduroam Wi-Fi': ['Network', 'Requires 802.1X wireless certificate validation and RADIUS profile configuration.'],
    'Dorm ResNet': ['Network', 'Requires switchport link-state verification and LAN MAC registration in ResNet portal.'],
    'VPN': ['Network', 'Requires GlobalProtect IPsec gateway configuration and client profile refresh.'],
    'Canvas / SSO': ['Software', 'Requires SAML authentication session flush and browser token handshake check.'],
    'Software': ['Software', 'Requires academic license key verification and local daemon driver reinstall.'],
    'Lab / Computer Access': ['Hardware', 'Requires physical terminal hardware inspection and peripheral check.'],
    'PaperCut Printing': ['Hardware', 'Requires release station buffer spooler restart and student quota verification.'],
    'Duo MFA': ['IAM / Access', 'Requires Duo Mobile device push token reactivation or Tech Bar bypass passcode.'],
    'NetID / Password': ['IAM / Access', 'Requires Active Directory password synchronization and account lockout check.'],
    'Email': ['IAM / Access', 'Requires Exchange Online mailbox routing inspection.'],
  };

  const [recommendedSpec, specRationale] = specMap[cat] || ['Support', 'General campus IT Tier-1 triage and walkup support.'];

  let rootCause = `Potential protocol mismatch or client-side caching issue affecting ${cat} services.`;
  let summary = `Student ${ticket.netid} reports persistent trouble with ${cat} at ${ticket.location}.`;

  if (combined.includes('wifi') || combined.includes('eduroam') || combined.includes('certificate')) {
    rootCause = '802.1X EAP-PEAP trust chain failure or outdated campus root CA certificate.';
    summary = 'Student device failing RADIUS authentication handshake with campus access points.';
  } else if (combined.includes('duo') || combined.includes('mfa') || combined.includes('2fa') || combined.includes('phone')) {
    rootCause = 'Device push token de-synchronization following OS upgrade or new smartphone migration.';
    summary = 'Student cannot complete Duo Push 2FA authentication prompts to access campus portal.';
  } else if (combined.includes('print') || combined.includes('papercut') || combined.includes('spooler')) {
    rootCause = 'WebPrint release spooler buffer queue stall or destination station driver lock.';
    summary = 'Print job stalled in queue buffer; release station display unresponsive.';
  } else if (combined.includes('canvas') || combined.includes('sso') || combined.includes('login')) {
    rootCause = 'Stale Shibboleth Single Sign-On session cookie causing redirect loop.';
    summary = 'Authentication token loop preventing student from reaching course materials.';
  }

  const diagnosticSteps: string[] = [
    `Verify authentication identity format (${ticket.netid}@university.edu).`,
    `Check live telemetry status for ${cat} campus cluster.`,
    'Execute diagnostic profile reset on student device.',
    'Perform verification test and confirm end-to-end connectivity.',
  ];

  if (cat === 'Eduroam Wi-Fi') {
    diagnosticSteps[0] = 'Verify EAP Method is PEAP and Phase 2 Auth is MSCHAPv2.';
    diagnosticSteps[1] = 'Ensure CA Certificate domain is explicitly set to university.edu.';
    diagnosticSteps[2] = 'Forget network profile, clear cached identity, and reconnect.';
  } else if (cat === 'PaperCut Printing') {
    diagnosticSteps[0] = 'Inspect PaperCut spooler service buffer for Library / Lab release station.';
    diagnosticSteps[1] = 'Verify student balance and refund stalled quota ($1.40).';
    diagnosticSteps[2] = 'Ensure uploaded document conforms to standard PDF format.';
  } else if (cat === 'Duo MFA') {
    diagnosticSteps[0] = 'Open Duo Mobile app directly and pull down to refresh notifications.';
    diagnosticSteps[1] = 'Check Focus / Do Not Disturb permissions on smartphone.';
    diagnosticSteps[2] = 'Issue temporary 6-digit bypass code or visit Tech Bar with photo ID.';
  }

  let nextAction = `Execute recommended diagnostic action #1 and verify ${cat} status with student.`;
  if (ticket.status === 'Escalated') {
    nextAction = `Host Operations: Dispatch incident to on-duty ${recommendedSpec} technician.`;
  } else if (ticket.diagnostic_progress >= 75) {
    nextAction = 'Confirm student fix validation and mark incident as Resolved.';
  }

  const escalationRisk =
    estimatedPriority === 'High' || estimatedPriority === 'Critical' || estimatedPriority === 'Urgent'
      ? 'High risk — requires expedited Tech Bar walkup pass or Tier-2 privileges.'
      : 'Low risk — standard Tier-1 diagnostic resolution expected within 15 minutes.';

  const similarList: string[] = [];
  allTickets.forEach((t) => {
    if (t.id !== ticket.id && (t.category === ticket.category || t.location === ticket.location)) {
      similarList.push(`${t.ticket_number}: ${t.title.slice(0, 42)}... [${t.status}]`);
    }
  });

  return {
    ticket_id: ticket.id,
    ticket_number: ticket.ticket_number,
    detected_category: cat,
    category_confidence_score: cat !== 'Other' ? 0.96 : 0.81,
    estimated_priority: estimatedPriority,
    priority_rationale: priorityRationale,
    recommended_specialization: recommendedSpec,
    specialization_rationale: specRationale,
    summary_for_technician: summary,
    root_cause_hypothesis: rootCause,
    suggested_diagnostic_steps: diagnosticSteps,
    next_best_action: nextAction,
    escalation_risk_assessment: escalationRisk,
    similar_incidents_detected: similarList.slice(0, 3),
    host_workload_advice: `${recommendedSpec} queue active. Recommended assignment: Available ${recommendedSpec} engineer.`,
    analyzed_at: new Date().toISOString(),
  };
}

export const INITIAL_MOCK_STATUS: SystemStatusResponse = {
  overall_status: 'operational',
  timestamp: new Date().toISOString(),
  active_incidents_count: 5,
  services: [
    {
      id: 'eduroam',
      name: 'Eduroam Wireless',
      category: 'Wireless Network',
      description: 'Campus-wide 802.1X WPA3 Enterprise wireless network',
      status: 'operational',
      uptime_percent: 99.98,
      latency_ms: 18,
      last_updated: new Date().toISOString(),
      is_live_monitored: true,
      status_message: 'Operating normally across 142 campus access points.',
    },
    {
      id: 'canvas',
      name: 'Canvas LMS',
      category: 'Learning Management',
      description: 'Course materials, assignment submissions and grading',
      status: 'operational',
      uptime_percent: 99.99,
      latency_ms: 42,
      last_updated: new Date().toISOString(),
      is_live_monitored: true,
      status_message: 'SAML Single Sign-On and assignments online.',
    },
    {
      id: 'duo',
      name: 'Duo Security 2FA',
      category: 'Identity & Security',
      description: 'Two-factor mobile push and hardware token authentication',
      status: 'operational',
      uptime_percent: 100.0,
      latency_ms: 65,
      last_updated: new Date().toISOString(),
      is_live_monitored: true,
      status_message: 'MFA Push notifications operational.',
    },
    {
      id: 'papercut',
      name: 'PaperCut WebPrint',
      category: 'Campus Printing',
      description: 'Student cloud printing and release station terminals',
      status: 'operational',
      uptime_percent: 99.95,
      latency_ms: 22,
      last_updated: new Date().toISOString(),
      is_live_monitored: true,
      status_message: 'Library and lab release stations active.',
    },
    {
      id: 'resnet',
      name: 'Dorm ResNet Wired',
      category: 'Residential Network',
      description: 'High-speed gigabit wired connections in dorm rooms',
      status: 'operational',
      uptime_percent: 99.99,
      latency_ms: 8,
      last_updated: new Date().toISOString(),
      is_live_monitored: true,
      status_message: 'All residential halls connected with 10 Gbps uplinks.',
    },
    {
      id: 'netid',
      name: 'NetID Password Self-Service',
      category: 'Account Management',
      description: 'Student and staff active directory credentials',
      status: 'operational',
      uptime_percent: 99.99,
      latency_ms: 29,
      last_updated: new Date().toISOString(),
      is_live_monitored: true,
      status_message: 'Active Directory sync nominal.',
    },
    {
      id: 'lab_access',
      name: 'CAD Computer Labs',
      category: 'Lab Hardware',
      description: 'Engineering CAD and specialized computing clusters',
      status: 'operational',
      uptime_percent: 99.90,
      latency_ms: 14,
      last_updated: new Date().toISOString(),
      is_live_monitored: true,
      status_message: 'Engineering & Arts computer clusters online.',
    },
    {
      id: 'vpn',
      name: 'Campus GlobalProtect VPN',
      category: 'Remote Access',
      description: 'Encrypted off-campus tunnel to university resources',
      status: 'operational',
      uptime_percent: 99.95,
      latency_ms: 35,
      last_updated: new Date().toISOString(),
      is_live_monitored: true,
      status_message: 'Gateways 1 & 2 accepting secure off-campus tunnels.',
    },
  ],
  announcements: [
    {
      id: 'ann-1',
      title: 'Eduroam Certificate Upgrade Complete',
      message: 'The annual security root certificate renewal has completed. Ensure your device CA domain is set to university.edu.',
      posted_at: new Date().toISOString(),
      severity: 'info',
      affected_services: ['eduroam'],
    },
    {
      id: 'ann-2',
      title: 'Tech Bar Extended Hours for Midterms',
      message: 'Walkup technical support in the Main Library 1st Floor will remain open until 9:00 PM during exam weeks.',
      posted_at: new Date().toISOString(),
      severity: 'info',
      affected_services: ['eduroam', 'duo'],
    },
  ],
};

export const INITIAL_MOCK_KB_ARTICLES: KBArticle[] = [
  {
    id: 'kb-1',
    slug: 'eduroam-wifi-setup',
    title: 'Connecting to Eduroam Wi-Fi (Android, iOS, Windows & Mac)',
    category: 'Wi-Fi',
    tags: ['wifi', 'eduroam', 'wireless', 'network'],
    summary: 'Step-by-step configuration for campus-wide high-speed wireless on all personal devices.',
    content_markdown: `### Eduroam Wi-Fi Setup Guide

1. **Select Network**: In your device's Wi-Fi settings, select **eduroam**.
2. **Security Settings**:
   - **EAP Method**: \`PEAP\`
   - **Phase 2 Authentication**: \`MSCHAPV2\`
   - **CA Certificate**: \`Use system certificates\` (or select *Do not validate* if legacy)
   - **Domain**: \`university.edu\`
3. **Identity**: Enter your full **NetID email** (e.g. \`username@university.edu\`).
4. **Password**: Enter your NetID password.
5. Tap **Connect** and accept the campus certificate fingerprint.`,
    helpful_count: 342,
    read_time_mins: 2,
    is_published: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'kb-2',
    slug: 'duo-mobile-reactivation',
    title: 'How to Reactivate Duo Mobile 2FA on a New Phone',
    category: 'Duo & MFA',
    tags: ['duo', '2fa', 'mfa', 'security', 'login'],
    summary: 'Steps to transfer your Duo Push multi-factor authentication when upgrading your phone.',
    content_markdown: `### Duo Mobile Device Reactivation

If you recently got a new phone or restored from backup:

1. Log in to the **Campus Identity Self-Service Portal** (\`https://identity.university.edu\`) on a computer.
2. Select **Manage Duo 2FA Devices**.
3. Choose **Add a new device** or **Reactivate Duo Mobile**.
4. Scan the on-screen QR code using the Duo Mobile app on your new device.
5. *Note:* If you no longer have your old device to authenticate the change, visit the **Tech Bar in Main Library 1st Floor** with your student photo ID for an instant bypass code.`,
    helpful_count: 218,
    read_time_mins: 3,
    is_published: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'kb-3',
    slug: 'papercut-webprint-guide',
    title: 'PaperCut WebPrint: How to Print from Laptops & Phones',
    category: 'Printing',
    tags: ['papercut', 'printing', 'library', 'webprint'],
    summary: 'Upload documents from any device to release at any campus printer terminal.',
    content_markdown: `### Student Printing with PaperCut WebPrint

1. Navigate to \`https://print.university.edu\` and sign in with your NetID.
2. Click **Web Print** in the left sidebar, then click **Submit a Job**.
3. Select your desired printer location (e.g., *Library-BlackWhite-Duplex* or *Color-Station*).
4. Upload your PDF, Word, or PowerPoint file.
5. Walk up to any release station on campus, swipe your student ID card or log in, and release your print job!`,
    helpful_count: 189,
    read_time_mins: 2,
    is_published: true,
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_MOCK_ANALYTICS_GRAPHS: AnalyticsGraphsResponse = {
  kpis: {
    open_tickets: 5,
    resolved_today: 18,
    avg_resolution_time_mins: 14.2,
    ai_resolution_rate_percent: 78.4,
    escalations_count: 2,
    ai_confidence_percent: 94.6,
    total_tickets_handled: 142,
    active_students_served: 89,
  },
  resolution_rate_trend: [
    { label: 'Mon', value: 72, volume: 24 },
    { label: 'Tue', value: 76, volume: 30 },
    { label: 'Wed', value: 81, volume: 28 },
    { label: 'Thu', value: 79, volume: 35 },
    { label: 'Fri', value: 84, volume: 32 },
    { label: 'Sat', value: 88, volume: 15 },
    { label: 'Sun', value: 85, volume: 12 },
  ],
  priority_distribution: [
    { name: 'Critical', count: 2, percentage: 10, color: '#ef4444' },
    { name: 'High', count: 5, percentage: 25, color: '#f97316' },
    { name: 'Medium', count: 9, percentage: 45, color: '#3b82f6' },
    { name: 'Low', count: 4, percentage: 20, color: '#10b981' },
  ],
  department_breakdown: [
    { department: 'Network & Wi-Fi', ticket_count: 8, resolved_count: 6, avg_turnaround_hours: 0.5 },
    { department: 'Identity & Access (IAM)', ticket_count: 6, resolved_count: 5, avg_turnaround_hours: 0.8 },
    { department: 'Hardware & Printing', ticket_count: 3, resolved_count: 3, avg_turnaround_hours: 0.4 },
    { department: 'Academic Software', ticket_count: 4, resolved_count: 4, avg_turnaround_hours: 0.6 },
  ],
  technician_workloads: [
    { id: 'TECH-001', name: 'Ramu Kumar', avatar: 'RK', specialty: 'Network', active_tickets: 2, resolved_today: 6, efficiency_rating: 98 },
    { id: 'TECH-002', name: 'Sarah Jenkins', avatar: 'SJ', specialty: 'IAM / Access', active_tickets: 1, resolved_today: 5, efficiency_rating: 95 },
    { id: 'TECH-003', name: 'Dave Miller', avatar: 'DM', specialty: 'Hardware', active_tickets: 1, resolved_today: 4, efficiency_rating: 94 },
    { id: 'TECH-004', name: 'Alex Wong', avatar: 'AW', specialty: 'Software', active_tickets: 1, resolved_today: 3, efficiency_rating: 96 },
  ],
  ai_confidence_trend: [
    { label: '08:00', value: 92, volume: 10 },
    { label: '11:00', value: 95, volume: 22 },
    { label: '14:00', value: 96, volume: 35 },
    { label: '17:00', value: 94, volume: 28 },
    { label: '20:00', value: 97, volume: 14 },
  ],
  recent_escalations_summary: [
    {
      id: 'esc-1',
      ticket_number: 'INC-2026-8920',
      title: 'Duo 2FA Push Notification Timeout after iOS Upgrade',
      category: 'Duo MFA',
      tier: 'Tier-2 Identity & Access Management',
      reason: 'Student lacks registered secondary device for push auth.',
      escalated_at: new Date().toISOString(),
    },
  ],
};

export const INITIAL_MOCK_EXECUTIVE_REPORT: ReportSummaryResponse = {
  date_range: 'Past 30 Days (Campus Real-Time)',
  generated_at: new Date().toISOString(),
  kpis: {
    open_tickets: 5,
    resolved_today: 18,
    avg_resolution_time_mins: 14.2,
    ai_resolution_rate_percent: 78.4,
    escalations_count: 2,
    ai_confidence_percent: 94.6,
    total_tickets_handled: 486,
    active_students_served: 412,
  },
  total_incidents: 486,
  resolved_by_ai: 381,
  resolved_by_staff: 87,
  escalated_to_tier2: 18,
  avg_response_time_secs: 4.8,
  avg_diagnostic_turns: 3.2,
  top_issue_categories: [
    { category: 'Eduroam Wi-Fi', count: 184, resolved_pct: 82.5 },
    { category: 'Duo MFA / SSO', count: 112, resolved_pct: 79.2 },
    { category: 'Canvas & LMS', count: 96, resolved_pct: 91.0 },
    { category: 'PaperCut Printing', count: 54, resolved_pct: 88.0 },
    { category: 'Lab & Computer Access', count: 40, resolved_pct: 75.0 },
  ],
  department_summary: [
    { department: 'Network Engineering', ticket_count: 184, resolved_count: 152, avg_turnaround_hours: 0.6 },
    { department: 'Identity & Access (IAM)', ticket_count: 112, resolved_count: 89, avg_turnaround_hours: 0.8 },
    { department: 'Academic Technology', ticket_count: 96, resolved_count: 87, avg_turnaround_hours: 0.4 },
    { department: 'Campus Hardware & Print', ticket_count: 54, resolved_count: 48, avg_turnaround_hours: 0.5 },
  ],
};

export const INITIAL_MOCK_PROBES: DiagnosticProbeResult[] = [
  {
    id: 'prb-1',
    name: 'RADIUS 802.1X Server Cluster',
    target: 'radius.auth.campus.internal:1812',
    probe_type: 'live_network',
    is_simulated: false,
    status: 'passed',
    latency_ms: 12,
    output_message: 'RADIUS Node A & B active (EAP-PEAP / MSCHAPv2 nominal).',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'prb-2',
    name: 'Nemotron AI Diagnostic Model Hub',
    target: 'api.openrouter.ai/v1/chat/completions',
    probe_type: 'live_ai',
    is_simulated: false,
    status: 'passed',
    latency_ms: 245,
    output_message: 'NVIDIA Nemotron 3 Ultra 550B inference engine ready.',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'prb-3',
    name: 'Central Shibboleth SAML IdP',
    target: 'idp.sso.university.edu',
    probe_type: 'live_network',
    is_simulated: false,
    status: 'passed',
    latency_ms: 28,
    output_message: 'Single Sign-On authentication tokens issuing nominally.',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'prb-4',
    name: 'PaperCut Primary Print Spooler',
    target: 'print.spooler.internal:9191',
    probe_type: 'simulated_campus_infra',
    is_simulated: false,
    status: 'passed',
    latency_ms: 16,
    output_message: 'Library and dormitory release queues clear.',
    timestamp: new Date().toISOString(),
  },
];

// -------------------------------------------------------------
// LOCALSTORAGE PERSISTENCE HELPERS (FOR RESILIENT OPERATION)
// -------------------------------------------------------------

export function getLocalTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem('campusfix_tickets_clean_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading tickets from localStorage:', e);
  }
  return INITIAL_MOCK_TICKETS;
}

export function saveLocalTickets(tickets: Ticket[]): void {
  try {
    localStorage.setItem('campusfix_tickets_clean_v1', JSON.stringify(tickets));
  } catch (e) {
    console.error('Error saving tickets to localStorage:', e);
  }
}

export function createClientMockTicket(data: {
  title: string;
  category: string;
  priority: string;
  location?: string;
  device?: string;
  netid?: string;
  email?: string;
  description: string;
  issue_summary?: string;
  chat_transcript?: string;
}): Ticket {
  const nowIso = new Date().toISOString();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const ticketNumber = `INC-2026-${randNum}`;
  const ticketId = `ticket-${randNum}`;

  const cleanPriority = (data.priority.replace(/ Priority$/i, '').trim() as any) || 'Medium';

  const newTicket: Ticket = {
    id: ticketId,
    ticket_number: ticketNumber,
    title: data.title.trim(),
    category: (data.category as any) || 'Eduroam Wi-Fi',
    priority: cleanPriority,
    status: 'New',
    location: data.location?.trim() || 'Main Campus Library',
    device: data.device || 'Windows 11 / Campus Laptop',
    netid: data.netid || 'student.user',
    email: data.email || 'student@university.edu',
    description: data.description.trim(),
    issue_summary: data.issue_summary || data.description.trim().slice(0, 140),
    assigned_technician: 'Anand Sen',
    ai_confidence: 94,
    diagnostic_stage: 'Triage',
    diagnostic_progress: 20,
    actions_taken: [
      {
        id: `act-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: nowIso,
        action: 'Incident ticket registered via CampusFix AI Portal',
        result: `Category: ${data.category} | Initial Priority: ${cleanPriority}`,
        actor: 'student',
      },
    ],
    notes: [
      {
        id: `note-${Math.floor(100 + Math.random() * 900)}`,
        author: 'CampusFix AI Intake System',
        author_role: 'system',
        text: `New incident logged for ${data.location || 'Main Campus'}. Preliminary classification: ${data.category}. Assigned technician: Anand Sen.`,
        created_at: nowIso,
      },
    ],
    chat_transcript: data.chat_transcript,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const existing = getLocalTickets();
  const updated = [newTicket, ...existing.filter((t) => t.id !== ticketId && t.ticket_number !== ticketNumber)];
  saveLocalTickets(updated);
  return newTicket;
}

export function getLocalTechnicians(): CampusUser[] {
  try {
    const raw = localStorage.getItem('campusfix_technicians_clean_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading technicians from localStorage:', e);
  }
  return INITIAL_MOCK_USERS;
}

export function saveLocalTechnicians(users: CampusUser[]): void {
  try {
    localStorage.setItem('campusfix_technicians_clean_v1', JSON.stringify(users));
  } catch (e) {
    console.error('Error saving technicians to localStorage:', e);
  }
}

export function createClientMockTechnician(data: {
  name: string;
  username: string;
  email: string;
  password?: string;
  specialization: TechnicianSpecialization;
  department?: string;
  phone?: string;
  skills?: string[];
}): CampusUser {
  const currentList = getLocalTechnicians();
  const existingNums: number[] = [];
  currentList.forEach((u) => {
    if (u.technician_id && u.technician_id.startsWith('TECH-')) {
      const parts = u.technician_id.split('-');
      const parsed = parseInt(parts[1], 10);
      if (!isNaN(parsed)) existingNums.push(parsed);
    }
  });

  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 2;
  const techId = `TECH-${String(nextNum).padStart(3, '0')}`;
  const initials =
    data.name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0].toUpperCase())
      .join('')
      .slice(0, 2) || 'TC';

  const newTech: CampusUser = {
    id: `user-tech-${Math.floor(1000 + Math.random() * 9000)}`,
    technician_id: techId,
    name: data.name.trim(),
    username: data.username.trim().toLowerCase(),
    email: data.email.trim().toLowerCase(),
    netid: data.username.trim().toLowerCase(),
    role: 'technician',
    specialization: data.specialization,
    department: data.department?.trim() || `${data.specialization} Operations`,
    status: 'active',
    is_active: true,
    phone: data.phone?.trim() || '+1 (555) 019-' + Math.floor(1000 + Math.random() * 9000),
    active_assignments_count: 0,
    avatar_initials: initials,
    skills: data.skills || [`${data.specialization} Operations`, 'Campus IT Support'],
    created_at: new Date().toISOString(),
  };

  const updated = [...currentList, newTech];
  saveLocalTechnicians(updated);
  return newTech;
}

export function resetLocalSystemData(): { tickets: Ticket[]; technicians: CampusUser[] } {
  try {
    localStorage.removeItem('campusfix_tickets_clean_v1');
    localStorage.removeItem('campusfix_technicians_clean_v1');
    localStorage.removeItem('campusfix_tickets');
    localStorage.removeItem('campusfix_technicians');
    localStorage.removeItem('campusfix_chat_history');
  } catch (e) {
    console.error('Error clearing localStorage on reset:', e);
  }
  return {
    tickets: INITIAL_MOCK_TICKETS,
    technicians: INITIAL_MOCK_USERS.filter((u) => u.role === 'technician' || u.role === 'host'),
  };
}

export const VIGNAN_CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: 'loc-a-block',
    name: 'A Block',
    code: 'A-BLK',
    category: 'Administrative & Academic',
    latitude: 16.2338,
    longitude: 80.5505,
    description: 'Central administrative headquarters housing the Registrar\'s Office, Finance Office, Central Instrumentation Center, Mechanical Workshop, and Vignan Health Center.',
    facilities: ['Registrar\'s Office', 'Finance Office & Admin', 'Central Instrumentation Center', 'Mechanical Workshop'],
    wifi_network: 'Eduroam / Vignan-Admin-5G',
    active_tech_bar: false,
    building_floor_count: 4,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-h-block',
    name: 'H Block',
    code: 'H-BLK',
    category: 'Academic Block',
    latitude: 16.2336,
    longitude: 80.5501,
    description: 'Engineering and sciences academic wing situated along H Block Road adjacent to the Cadence VLSI Research Facility.',
    facilities: ['Electronics Core Labs', 'Embedded Systems Wing', 'Faculty Cabins'],
    wifi_network: 'Eduroam / Vignan-HBlock-Wi-Fi6',
    active_tech_bar: false,
    building_floor_count: 4,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-n-block',
    name: 'N Block',
    code: 'N-BLK',
    category: 'Academic Block',
    latitude: 16.2333,
    longitude: 80.5513,
    description: 'Central multi-wing courtyard academic block housing core undergraduate lecture theaters, department computing suites, and administrative coordination rooms.',
    facilities: ['Undergraduate Lecture Theaters', 'Department Computer Centers', 'Seminar Rooms'],
    wifi_network: 'Eduroam / Vignan-NBlock-Wi-Fi6',
    active_tech_bar: false,
    building_floor_count: 5,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-u-block',
    name: 'U Block',
    code: 'U-BLK',
    category: 'Academic Block',
    latitude: 16.2346,
    longitude: 80.5516,
    description: 'Primary academic and research complex housing the Department of Information Technology (IT), Computer Science & Engineering labs, AI/ML computing clusters, and modern smart lecture halls.',
    facilities: ['Dept. of Information Technology (IT)', 'CSE High-Performance Computing Labs', 'AI & Data Science Labs', 'Smart Multimedia Classrooms'],
    wifi_network: 'Eduroam / Vignan-UBlock-Wi-Fi6',
    active_tech_bar: false,
    building_floor_count: 5,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-p-block',
    name: 'P Block',
    code: 'P-BLK',
    category: 'Academic Block',
    latitude: 16.2339,
    longitude: 80.5509,
    description: 'Postgraduate and applied engineering research complex with advanced robotics, computational fluid dynamics, and mechatronics laboratories.',
    facilities: ['Robotics & Automation Lab', 'PG Research Center', 'Computational Modeling Suite'],
    wifi_network: 'Eduroam / Vignan-PBlock-Wi-Fi6',
    active_tech_bar: false,
    building_floor_count: 4,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-visvesvaraya-block',
    name: 'Visvesvaraya Block',
    code: 'VISV-BLK',
    category: 'Academic Block',
    latitude: 16.2325,
    longitude: 80.5512,
    description: 'Academic building wrapping around the large tiered open-air lawn amphitheater hosting university convocations, technical hackathons, and cultural symposiums.',
    facilities: ['Visvesvaraya Engineering Halls', 'Tiered Stepped Lawn Amphitheater', 'High-Capacity Outdoor Event Wi-Fi APs'],
    wifi_network: 'Eduroam / Vignan-Visv-Amphi',
    active_tech_bar: false,
    building_floor_count: 4,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-ntr-library',
    name: 'N.T.R. Vignan Library',
    code: 'NTR-LIB',
    category: 'Library',
    latitude: 16.2335,
    longitude: 80.5498,
    description: 'Distinctive octagonal central university library featuring the 1st Floor IT Walkup Tech Bar, Digital Knowledge Center, PaperCut student print release station, and reading commons.',
    facilities: ['1st Floor IT Walkup Tech Bar', 'Digital Knowledge Resource Center', 'PaperCut Student Print Release Hub', 'Silent Research Commons'],
    wifi_network: 'Eduroam / Vignan-Library-Mesh',
    active_tech_bar: true,
    building_floor_count: 4,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-lara-library',
    name: 'Vignan\'s LARA Library',
    code: 'LARA-LIB',
    category: 'Library',
    latitude: 16.2319,
    longitude: 80.5539,
    description: 'Central library wing for the LARA Engineering complex with e-journals, collaborative study carrels, and digital catalog kiosks.',
    facilities: ['Digital Reference Desk', 'E-Journals Terminal', 'Study Lounges'],
    wifi_network: 'Eduroam / Vignan-LARA-Lib',
    active_tech_bar: false,
    building_floor_count: 3,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-lara-institute',
    name: 'Vignan\'s LARA Institute of Technology & Science',
    code: 'LARA-ITS',
    category: 'Academic Block',
    latitude: 16.2315,
    longitude: 80.5535,
    description: 'Engineering institute campus block featuring the LARA Old Block, advanced engineering workshops, and department computational facilities.',
    facilities: ['Vignan\'s LARA Old Block', 'Engineering Computing Labs', 'Electronics Workshop'],
    wifi_network: 'Eduroam / Vignan-LARA-Net',
    active_tech_bar: false,
    building_floor_count: 4,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-vfstr-main',
    name: 'Vignan Foundation for Science, Technology and Research',
    code: 'VFSTR',
    category: 'Administrative & Academic',
    latitude: 16.2342,
    longitude: 80.5514,
    description: 'University Administration and Deanery offices managing campus academic standards, governance, and institutional technology programs.',
    facilities: ['Vice Chancellor\'s Secretariat', 'Deans\' Conference Boardroom', 'IT Policy & Infrastructure Directorate'],
    wifi_network: 'Eduroam / Vignan-HQ-5G',
    active_tech_bar: false,
    building_floor_count: 4,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-health-center',
    name: 'Vignan Health Center',
    code: 'VHC',
    category: 'Administrative & Academic',
    latitude: 16.2329,
    longitude: 80.5506,
    description: 'Campus Medical and Wellness Center providing 24/7 student outpatient care, emergency triage, pharmacy dispensary, and biometric health record kiosks.',
    facilities: ['24/7 Outpatient Clinic', 'Pharmacy Dispensary', 'Emergency First Aid Station'],
    wifi_network: 'Eduroam / Vignan-Health-Net',
    active_tech_bar: false,
    building_floor_count: 2,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-pharmacy-college',
    name: 'Vignan Pharmacy College',
    code: 'VPC',
    category: 'Academic & Research',
    latitude: 16.2340,
    longitude: 80.5528,
    description: 'Specialized pharmaceutical and biotechnology education and research facility equipped with advanced pharmacology, medicinal chemistry, and drug discovery laboratories.',
    facilities: ['Pharmaceutical Analysis Lab', 'Pharmacology Research Suites', 'Medicinal Chemistry Lab'],
    wifi_network: 'Eduroam / Vignan-Pharmacy-Net',
    active_tech_bar: false,
    building_floor_count: 4,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-cadence-lab',
    name: 'Cadence Lab',
    code: 'CAD-LAB',
    category: 'Academic & Laboratory',
    latitude: 16.2334,
    longitude: 80.5503,
    description: 'Advanced VLSI and Semiconductor Design Laboratory sponsored by Cadence Design Systems with high-end EDA workstations.',
    facilities: ['Cadence EDA Workstations', 'VLSI Design Suites', 'FPGA Prototyping Benches'],
    wifi_network: 'Eduroam / Vignan-VLSI-Lab',
    active_tech_bar: false,
    building_floor_count: 2,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-convocation-hall',
    name: 'Vignan Convocation Hall',
    code: 'V-CONV',
    category: 'Administrative & Academic',
    latitude: 16.2351,
    longitude: 80.5518,
    description: 'State-of-the-art air-conditioned auditorium and convocation convention center seating 3,000 guests with ultra-high-density Wi-Fi 6E infrastructure.',
    facilities: ['3000-Seat Auditorium', 'Acoustic Soundstage', 'High-Density Wi-Fi 6E Cluster'],
    wifi_network: 'Eduroam / Vignan-Auditorium-Wi-Fi6',
    active_tech_bar: false,
    building_floor_count: 3,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-guest-house',
    name: 'VFSTR Guest House',
    code: 'VFSTR-GH',
    category: 'Guest House & Residential',
    latitude: 16.2355,
    longitude: 80.5510,
    description: 'Executive university guest house featuring faculty suites, visiting dignitary residences, and seminar conference meeting rooms situated within lush greenery.',
    facilities: ['Executive Guest Suites', 'Visiting Faculty Accommodation', 'Guest Wi-Fi High-Speed Network', 'Conference Lounge'],
    wifi_network: 'Eduroam / Vignan-Guest-Mesh',
    active_tech_bar: false,
    building_floor_count: 3,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-sports-courts',
    name: 'Tennis & Shuttle Courts Complex',
    code: 'SPORTS-CRT',
    category: 'Sports & Recreation',
    latitude: 16.2338,
    longitude: 80.5532,
    description: 'Campus outdoor recreation facility featuring standard competition tennis courts, badminton/shuttle court arena, and floodlit sports lighting.',
    facilities: ['Outdoor Hard Tennis Court', 'Covered Shuttle / Badminton Court', 'Recreational Seating Area'],
    wifi_network: 'Eduroam / Vignan-Sports-Net',
    active_tech_bar: false,
    building_floor_count: 1,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
  {
    id: 'loc-textile-dept',
    name: 'Textile Department',
    code: 'TEX-DEPT',
    category: 'Academic & Laboratory',
    latitude: 16.2328,
    longitude: 80.5492,
    description: 'Department of Textile Technology containing specialized fabric testing laboratories, weaving and knitting workshops, and material characterization equipment.',
    facilities: ['Fabric Testing & Quality Labs', 'Textile Weaving Workshop', 'Dyeing & Processing Unit'],
    wifi_network: 'Eduroam / Vignan-Textile-Lab',
    active_tech_bar: false,
    building_floor_count: 2,
    service_status: 'operational',
    active_ticket_ids: [],
    active_incident_count: 0,
    assigned_technicians: [],
    verification_status: 'verified',
  },
];

// --- Persistent Campus Map Local Storage Helpers ---

export function getLocalCampusLocations(): CampusLocation[] {
  try {
    const raw = localStorage.getItem('campusfix_locations');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading campus locations from localStorage:', e);
  }
  return VIGNAN_CAMPUS_LOCATIONS;
}

export function saveLocalCampusLocations(locations: CampusLocation[]): void {
  try {
    localStorage.setItem('campusfix_locations', JSON.stringify(locations));
  } catch (e) {
    console.error('Error saving campus locations to localStorage:', e);
  }
}

export function getLocalMapLockState(): boolean {
  try {
    const raw = localStorage.getItem('campusfix_map_locked');
    if (raw !== null) {
      return JSON.parse(raw) === true;
    }
  } catch (e) {
    console.error('Error reading map lock state:', e);
  }
  return true; // Default locked to preserve approved campus layout
}

export function saveLocalMapLockState(isLocked: boolean): void {
  try {
    localStorage.setItem('campusfix_map_locked', JSON.stringify(isLocked));
  } catch (e) {
    console.error('Error saving map lock state:', e);
  }
}

export function getLocalMapAuditLog(): MapAuditEntry[] {
  try {
    const raw = localStorage.getItem('campusfix_map_audit_log');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading map audit log:', e);
  }
  return [
    {
      id: 'audit-init',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      actor: 'system',
      action: 'lock',
      details: 'Initial verified Vignan University campus block names and satellite geodata calibrated and locked.',
    },
  ];
}

export function saveLocalMapAuditLog(logs: MapAuditEntry[]): void {
  try {
    localStorage.setItem('campusfix_map_audit_log', JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.error('Error saving map audit log:', e);
  }
}

export function addMapAuditEntry(entry: Omit<MapAuditEntry, 'id' | 'timestamp'>): MapAuditEntry {
  const newEntry: MapAuditEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };
  const logs = [newEntry, ...getLocalMapAuditLog()];
  saveLocalMapAuditLog(logs);
  return newEntry;
}

export function resetCampusMapToDefault(): CampusLocation[] {
  try {
    localStorage.removeItem('campusfix_locations');
    saveLocalMapLockState(true);
    addMapAuditEntry({
      actor: 'host',
      action: 'reset',
      details: 'Reset all campus blocks and map labels to the approved default layout.',
    });
  } catch (e) {
    console.error('Error resetting campus map:', e);
  }
  return VIGNAN_CAMPUS_LOCATIONS;
}

// --- Host Assigned AI Tasks Storage Helpers ---

export function getLocalAITasks(): HostAITask[] {
  try {
    const raw = localStorage.getItem('campusfix_host_ai_tasks');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading AI tasks from localStorage:', e);
  }
  return [
    {
      id: 'task-ai-1',
      title: 'Correct Campus Block Names & Verify Geodata Alignment',
      description: 'Audit all campus buildings against official Vignan University master plan and align satellite pin coordinates.',
      status: 'completed',
      progress_percentage: 100,
      locations_affected: ['A Block', 'H Block', 'N Block', 'U Block', 'P Block', 'Visvesvaraya Block', 'N.T.R. Vignan Library'],
      changes_made: [
        'Verified A Block, H Block, and Cadence Lab along H Block Road',
        'Aligned N Block central courtyard pin coordinates',
        'Standardized U Block and Vignan Convocation Hall along U Block Road',
        'Mapped Visvesvaraya Block and Open-Air Amphitheater',
      ],
      created_at: new Date(Date.now() - 7200000).toISOString(),
      completed_at: new Date(Date.now() - 3600000).toISOString(),
      assigned_by: 'Host (VAMSI)',
    },
  ];
}

export function saveLocalAITasks(tasks: HostAITask[]): void {
  try {
    localStorage.setItem('campusfix_host_ai_tasks', JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving AI tasks to localStorage:', e);
  }
}

export function addHostAITask(task: Omit<HostAITask, 'id' | 'created_at'>): HostAITask {
  const newTask: HostAITask = {
    ...task,
    id: `task-ai-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  const tasks = [newTask, ...getLocalAITasks()];
  saveLocalAITasks(tasks);
  return newTask;
}

export function getClientCampusMapData(
  currentUser?: CampusUser | null,
  ticketsList: Ticket[] = INITIAL_MOCK_TICKETS
): CampusMapDataResponse {
  const isHost = currentUser && (currentUser.role === 'host' || currentUser.role === 'admin');
  const isTechnician = currentUser && currentUser.role === 'technician';
  const userName = currentUser?.name?.toLowerCase();

  const currentLocations = getLocalCampusLocations();
  const isLocked = getLocalMapLockState();
  const auditLog = getLocalMapAuditLog();

  let activeTotal = 0;

  const enrichedLocations = currentLocations.map((loc) => {
    const locLower = loc.name.toLowerCase();
    const codeLower = loc.code.toLowerCase();

    const matched = ticketsList.filter((t) => {
      if (!t.location) return false;
      const tLoc = t.location.toLowerCase();
      if (t.status === 'Resolved' || t.status === 'Closed') return false;

      if (loc.id.includes(tLoc) || tLoc.includes(codeLower)) return true;
      if (tLoc.includes('library') && locLower.includes('library')) return true;
      if ((tLoc.includes('u-block') || tLoc.includes('u block') || tLoc.includes('it dept') || tLoc.includes('cse')) && locLower.includes('u-block')) return true;
      if ((tLoc.includes('a-block') || tLoc.includes('a block') || tLoc.includes('admin') || tLoc.includes('registrar') || tLoc.includes('health center')) && locLower.includes('a-block')) return true;
      if ((tLoc.includes('visvesvaraya') || tLoc.includes('amphitheater') || tLoc.includes('oat')) && locLower.includes('visvesvaraya')) return true;
      if ((tLoc.includes('guest house') || tLoc.includes('vfstr guest')) && locLower.includes('guest house')) return true;
      if ((tLoc.includes('pharmacy') || tLoc.includes('vpc')) && locLower.includes('pharmacy')) return true;
      if ((tLoc.includes('textile')) && locLower.includes('textile')) return true;
      if ((tLoc.includes('lara')) && locLower.includes('lara')) return true;
      if ((tLoc.includes('tennis') || tLoc.includes('shuttle') || tLoc.includes('court')) && locLower.includes('tennis')) return true;

      return false;
    });

    let visible = matched;
    if (!isHost) {
      if (isTechnician) {
        visible = matched.filter(
          (t) =>
            (t.assigned_technician && userName && t.assigned_technician.toLowerCase().includes(userName)) ||
            !t.assigned_technician ||
            (currentUser?.specialization && currentUser.specialization === t.category)
        );
      } else {
        visible = currentUser?.netid ? matched.filter((t) => t.netid === currentUser.netid) : [];
      }
    }

    const hasCritical = matched.some((t) => t.priority === 'Critical' || t.priority === 'Urgent');
    const hasHigh = matched.some((t) => t.priority === 'High');

    let st = loc.service_status;
    if (hasCritical) st = 'outage';
    else if (hasHigh || matched.length >= 2) st = 'degraded';

    activeTotal += matched.length;

    const assignedTechs = Array.from(
      new Set(matched.map((t) => t.assigned_technician).filter(Boolean) as string[])
    );

    return {
      ...loc,
      service_status: st,
      active_ticket_ids: visible.map((t) => t.ticket_number),
      active_incident_count: matched.length,
      assigned_technicians: isHost || isTechnician ? assignedTechs : [],
    };
  });

  const operationalCount = enrichedLocations.filter((l) => l.service_status === 'operational').length;

  return {
    campus_name: "Vignan's Foundation for Science, Technology & Research (VFSTR)",
    location_name: 'Vadlamudi, Guntur District, Andhra Pradesh, India',
    postal_code: '522213',
    center_coordinates: { lat: 16.2334, lng: 80.5508 },
    default_zoom: 17,
    locations: enrichedLocations,
    total_locations: enrichedLocations.length,
    active_incidents_count: activeTotal,
    operational_services_count: operationalCount,
    is_locked: isLocked,
    audit_log: auditLog,
  };
}

