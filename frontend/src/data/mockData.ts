import {
  Ticket,
  SystemStatusResponse,
  KBArticle,
  CampusUser,
  LoginResponse,
  UserRole,
  TechnicianSpecialization,
  AnalyticsGraphsResponse,
  ReportSummaryResponse,
  DiagnosticProbeResult,
} from '../types/chat';

export const INITIAL_MOCK_TICKETS: Ticket[] = [
  {
    id: 'ticket-101',
    ticket_number: 'INC-2026-8941',
    title: 'Eduroam 802.1X Certificate Trust Loop on Android 14',
    category: 'Eduroam Wi-Fi',
    priority: 'Medium',
    status: 'Diagnosing',
    location: 'Engineering Hall, Room 304',
    netid: 'm.chen',
    email: 'm.chen@university.edu',
    description: 'Unable to validate server certificate on Pixel 8. Receiving WPA-Enterprise 802.1X handshake timeout.',
    issue_summary: 'Pixel 8 Android 14 client failing RADIUS EAP-PEAP certificate handshake with campus root CA.',
    assigned_technician: 'Ramu Kumar',
    diagnostic_stage: 'Troubleshooting',
    diagnostic_progress: 60,
    actions_taken: [
      {
        id: 'act-1',
        timestamp: new Date().toISOString(),
        action: 'Verified RADIUS Auth Server status for Engineering Hall AP Cluster',
        result: 'RADIUS Node B responding nominally (latency: 14ms).',
        actor: 'system',
      },
      {
        id: 'act-2',
        timestamp: new Date().toISOString(),
        action: 'Configured CA Certificate domain to university.edu and EAP to MSCHAPv2',
        result: 'Profile verified. Awaiting student connection check.',
        actor: 'ai_specialist',
      },
    ],
    notes: [
      {
        id: 'note-1',
        author: 'CampusFix AI',
        author_role: 'system',
        text: 'Identified Android 14 strict CA certificate requirement.',
        created_at: new Date().toISOString(),
      },
    ],
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ticket-102',
    ticket_number: 'INC-2026-8935',
    title: 'PaperCut WebPrint Spooler Timeout in Library 2nd Floor',
    category: 'PaperCut Printing',
    priority: 'Low',
    status: 'Resolved',
    location: 'Main Library, 2nd Floor West Wing',
    netid: 'k.patel',
    email: 'k.patel@university.edu',
    description: 'Sent 14-page PDF via WebPrint. Station terminal displayed Processing without output.',
    issue_summary: 'Print spooler buffer queue stall resolved; release station driver restarted and student quota refunded.',
    assigned_technician: 'Dave Miller',
    diagnostic_stage: 'Completed',
    diagnostic_progress: 100,
    actions_taken: [
      {
        id: 'act-3',
        timestamp: new Date().toISOString(),
        action: 'Diagnostic probe executed on Library Terminal #2 print spooler',
        result: 'Spooler service buffer cleared; 1 stalled job released.',
        actor: 'technician',
      },
    ],
    notes: [
      {
        id: 'note-2',
        author: 'Helpdesk Staff',
        author_role: 'technician',
        text: 'Printer queue reset and test print verified.',
        created_at: new Date().toISOString(),
      },
    ],
    resolution_details: 'Cleared PaperCut queue spooler buffer and released physical output. $1.40 print quota credited back.',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ticket-103',
    ticket_number: 'INC-2026-8920',
    title: 'Duo 2FA Push Notification Timeout after iOS Upgrade',
    category: 'Duo MFA',
    priority: 'High',
    status: 'Escalated',
    location: 'Residential Hall B, Rm 112',
    netid: 'j.williams',
    email: 'j.williams@university.edu',
    description: 'Upgraded to new iPhone. Duo push requests never appear on lock screen.',
    issue_summary: 'Hardware token migration required following iOS device upgrade.',
    assigned_technician: 'Sarah Jenkins',
    diagnostic_stage: 'Completed',
    diagnostic_progress: 100,
    actions_taken: [
      {
        id: 'act-5',
        timestamp: new Date().toISOString(),
        action: 'High Priority Flag: Midterm submission deadline in 2 hours',
        result: 'Automatic escalation to Tech Bar Priority Walkup Queue.',
        actor: 'system',
      },
    ],
    notes: [
      {
        id: 'note-3',
        author: 'Security Dispatch',
        author_role: 'system',
        text: 'Walkup identity verification required.',
        created_at: new Date().toISOString(),
      },
    ],
    escalation_info: {
      tier: 'Tier-2 Identity & Access Management',
      department: 'Campus IT Tech Bar Walkup',
      reason: 'Student lacks access to registered secondary Duo device.',
      assigned_to: 'Sarah Jenkins (Tech Bar Lead)',
      tech_bar_location: 'Main Library, 1st Floor Tech Bar (Mon–Fri 8am–7pm)',
      student_id_required: true,
      notes: 'Student has urgent midterm deadline. Expedited walkup queue pass granted.',
      escalated_at: new Date().toISOString(),
    },
    created_at: new Date(Date.now() - 10800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ticket-104',
    ticket_number: 'INC-2026-8890',
    title: 'PlayStation 5 Dorm Wired ResNet Ethernet Port Inactive',
    category: 'Dorm ResNet',
    priority: 'Low',
    status: 'New',
    location: 'Maple Hall, Rm 421',
    netid: 'd.rodriguez',
    email: 'd.rodriguez@university.edu',
    description: 'Registered LAN MAC address AA:BB:CC:11:22:33 on resnet portal, but wall jack link light remains off.',
    issue_summary: 'New intake: Dorm room wall ethernet jack link state unconfirmed.',
    assigned_technician: 'Ramu Kumar',
    diagnostic_stage: 'Triage',
    diagnostic_progress: 15,
    actions_taken: [],
    notes: [],
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ticket-105',
    ticket_number: 'INC-2026-8855',
    title: 'Canvas LMS SSO Stale Session Cookie & Token Expiration',
    category: 'Canvas / SSO',
    priority: 'Medium',
    status: 'Waiting for Student',
    location: 'Science Center, Rm 102',
    netid: 'a.taylor',
    email: 'a.taylor@university.edu',
    description: 'Clicking Log in with NetID on Canvas loops back to login prompt without throwing an explicit error message.',
    issue_summary: 'SAML token handshake loop caused by cached browser SSO cookie session.',
    assigned_technician: 'Alex Wong',
    diagnostic_stage: 'Environment & Device',
    diagnostic_progress: 40,
    actions_taken: [],
    notes: [],
    created_at: new Date(Date.now() - 18000000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_MOCK_USERS: CampusUser[] = [
  {
    id: 'user-host-vamsi',
    technician_id: 'HOST-001',
    name: 'VAMSI',
    username: 'vamsi',
    email: 'vamsi@campusfix.edu',
    netid: 'vamsi',
    role: 'host',
    department: 'Office of the University CIO & Campus Governance',
    status: 'active',
    is_active: true,
    phone: '+1 (555) 019-9000',
    active_assignments_count: 5,
    avatar_initials: 'VA',
    skills: ['Platform Administrator', 'System Governance', 'SLA Auditing', 'Infrastructure Ops'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-tech-1',
    technician_id: 'TECH-001',
    name: 'Ramu Kumar',
    username: 'ramu',
    email: 'ramu@university.edu',
    netid: 'ramu',
    role: 'technician',
    specialization: 'Network',
    department: 'Network & Wireless Engineering',
    status: 'active',
    is_active: true,
    phone: '+1 (555) 014-4112',
    active_assignments_count: 2,
    avatar_initials: 'RK',
    skills: ['Eduroam 802.1X', 'RADIUS', 'Cisco Catalyst', 'DNS/DHCP', 'Wi-Fi 6E'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-tech-2',
    technician_id: 'TECH-002',
    name: 'Sarah Jenkins',
    username: 'sarah',
    email: 's.jenkins@university.edu',
    netid: 'sarah',
    role: 'technician',
    specialization: 'IAM / Access',
    department: 'Identity & Access Management',
    status: 'active',
    is_active: true,
    phone: '+1 (555) 018-7721',
    active_assignments_count: 1,
    avatar_initials: 'SJ',
    skills: ['Active Directory', 'Duo 2FA', 'Shibboleth SSO', 'SAML 2.0', 'LDAP'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-tech-3',
    technician_id: 'TECH-003',
    name: 'Dave Miller',
    username: 'dave',
    email: 'd.miller@university.edu',
    netid: 'dave',
    role: 'technician',
    specialization: 'Hardware',
    department: 'Campus Hardware & Printing Infrastructure',
    status: 'active',
    is_active: true,
    phone: '+1 (555) 019-3384',
    active_assignments_count: 1,
    avatar_initials: 'DM',
    skills: ['PaperCut MF', 'Kyocera / HP Spoolers', 'Lab Workstations', 'Peripherals'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-tech-4',
    technician_id: 'TECH-004',
    name: 'Alex Wong',
    username: 'alex',
    email: 'a.wong@university.edu',
    netid: 'alex',
    role: 'technician',
    specialization: 'Software',
    department: 'Academic Software & Licensing',
    status: 'active',
    is_active: true,
    phone: '+1 (555) 012-9901',
    active_assignments_count: 1,
    avatar_initials: 'AW',
    skills: ['Canvas LMS', 'MATLAB', 'Adobe Creative Cloud', 'VMware Horizon'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-tech-5',
    technician_id: 'TECH-005',
    name: 'Priya Sharma',
    username: 'priya',
    email: 'p.sharma@university.edu',
    netid: 'priya',
    role: 'technician',
    specialization: 'Support',
    department: 'Student IT Help Bar & Walkup Center',
    status: 'active',
    is_active: true,
    phone: '+1 (555) 017-6644',
    active_assignments_count: 1,
    avatar_initials: 'PS',
    skills: ['First Contact Resolution', 'Device Onboarding', 'OS Diagnostics', 'VPN'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-student-1',
    technician_id: undefined,
    name: 'Student User',
    username: 'student',
    email: 'student@university.edu',
    netid: 'student.user',
    role: 'student',
    department: 'Undergraduate Studies',
    status: 'active',
    is_active: true,
    active_assignments_count: 0,
    avatar_initials: 'SU',
    skills: ['Student'],
    created_at: new Date().toISOString(),
  },
];

export function authenticateClientMockUser(
  username: string,
  _password: string,
  role: UserRole,
  specialization?: TechnicianSpecialization
): LoginResponse | null {
  const cleanU = username.trim().toLowerCase();

  let user = INITIAL_MOCK_USERS.find(
    (u) => u.username?.toLowerCase() === cleanU || u.netid?.toLowerCase() === cleanU || u.name.toLowerCase() === cleanU
  );

  if (!user) {
    if (role === 'host' || cleanU.includes('vamsi') || cleanU.includes('admin')) {
      user = INITIAL_MOCK_USERS[0];
    } else if (role === 'technician') {
      user = INITIAL_MOCK_USERS.find((u) => u.specialization === specialization) || INITIAL_MOCK_USERS[1];
    } else {
      user = INITIAL_MOCK_USERS[INITIAL_MOCK_USERS.length - 1];
    }
  }

  return {
    token: `demo-jwt-token-${user.id}-${Date.now()}`,
    token_type: 'Bearer',
    user: { ...user, role: role === 'host' ? 'host' : role === 'technician' ? 'technician' : 'student' },
    expires_in: 86400,
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
    const raw = localStorage.getItem('campusfix_tickets');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
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
    localStorage.setItem('campusfix_tickets', JSON.stringify(tickets));
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
    assigned_technician: 'Jordan Smith (Dispatch Lead)',
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
        text: `New incident logged for ${data.location || 'Main Campus'}. Preliminary classification: ${data.category}.`,
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
    const raw = localStorage.getItem('campusfix_technicians');
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
    localStorage.setItem('campusfix_technicians', JSON.stringify(users));
  } catch (e) {
    console.error('Error saving technicians to localStorage:', e);
  }
}

export function createClientMockTechnician(data: {
  name: string;
  username: string;
  email: string;
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

  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 6;
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

