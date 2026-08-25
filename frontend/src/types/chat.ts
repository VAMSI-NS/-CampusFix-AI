export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  attachmentName?: string;
  actions?: AIActionButton[];
}

export interface ChatApiRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
}

export interface ChatApiResponse {
  reply: string;
  model: string;
  timestamp: string;
  status: string;
}

export interface QuickPrompt {
  id: string;
  category: string;
  icon: string;
  label: string;
  prompt: string;
  description?: string;
  ticketCategory?: TicketCategory;
}

export interface ContextualChip {
  id: string;
  label: string;
  response: string;
  iconType?: 'success' | 'failure' | 'device' | 'info' | 'action';
}

// --- Ticket & Resolver Types ---

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent' | 'Critical';

export type TicketStatus =
  | 'New'
  | 'Open'
  | 'Escalated'
  | 'Assigned'
  | 'Acknowledged'
  | 'Diagnosing'
  | 'In Progress'
  | 'Fix in Progress'
  | 'Waiting for Student'
  | 'On Hold'
  | 'Resolved'
  | 'Closed';

export type TicketCategory =
  | 'Eduroam Wi-Fi'
  | 'Canvas / SSO'
  | 'Duo MFA'
  | 'PaperCut Printing'
  | 'Dorm ResNet'
  | 'NetID / Password'
  | 'Lab / Computer Access'
  | 'Software'
  | 'VPN'
  | 'Email'
  | 'Other';

export type DiagnosticStage =
  | 'Triage'
  | 'Environment & Device'
  | 'Troubleshooting'
  | 'Verification'
  | 'Completed';

export interface ActionLogItem {
  id: string;
  timestamp: string;
  action: string;
  result: string;
  actor: 'ai_specialist' | 'student' | 'technician' | 'system';
}

export interface EscalationDetails {
  tier: string;
  department: string;
  reason: string;
  original_technician?: string;
  target_specialization?: string;
  target_role?: string;
  assigned_to?: string;
  tech_bar_location: string;
  student_id_required: boolean;
  notes?: string;
  escalated_at: string;
}

export interface TicketNote {
  id: string;
  author: string;
  author_role: 'student' | 'technician' | 'system';
  text: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  location: string;
  device?: string;
  netid: string;
  email: string;
  description: string;
  issue_summary: string;
  assigned_technician?: string;
  ai_confidence?: number;
  diagnostic_stage: DiagnosticStage;
  diagnostic_progress: number;
  actions_taken: ActionLogItem[];
  resolution_details?: string | null;
  escalation_info?: EscalationDetails | null;
  chat_transcript?: string | null;
  notes: TicketNote[];
  created_at: string;
  updated_at: string;
}

export interface TicketCreatePayload {
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  location?: string;
  device?: string;
  netid: string;
  email: string;
  description: string;
  issue_summary?: string;
  chat_transcript?: string;
}

export interface TicketAIAnalysisResponse {
  ticket_id: string;
  ticket_number: string;
  detected_category: string;
  category_confidence_score: number;
  estimated_priority: string;
  priority_rationale: string;
  recommended_specialization: string;
  specialization_rationale: string;
  summary_for_technician: string;
  root_cause_hypothesis: string;
  suggested_diagnostic_steps: string[];
  next_best_action: string;
  escalation_risk_assessment: string;
  similar_incidents_detected: string[];
  host_workload_advice?: string;
  analyzed_at: string;
}

export interface TicketUpdatePayload {
  title?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  location?: string;
  device?: string;
  issue_summary?: string;
  assigned_technician?: string;
  ai_confidence?: number;
  diagnostic_stage?: DiagnosticStage;
  diagnostic_progress?: number;
  technician_note?: string;
  resolution_details?: string;
  escalation_info?: EscalationDetails;
}

// --- Campus Infrastructure Status Types ---

export type ServiceHealthState = 'operational' | 'degraded' | 'maintenance' | 'outage';

export interface CampusServiceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ServiceHealthState;
  uptime_percent: number;
  latency_ms?: number;
  last_updated: string;
  is_live_monitored: boolean;
  status_message: string;
  details?: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  affected_services: string[];
  posted_at: string;
}

export interface SystemStatusResponse {
  overall_status: ServiceHealthState;
  services: CampusServiceItem[];
  announcements: SystemAnnouncement[];
  timestamp: string;
  active_incidents_count: number;
}

// --- Vignan University Campus Map Types ---

export interface CampusLocation {
  id: string;
  name: string;
  code: string;
  category: string;
  latitude: number;
  longitude: number;
  description: string;
  facilities: string[];
  wifi_network: string;
  active_tech_bar: boolean;
  building_floor_count: number;
  service_status: ServiceHealthState | 'operational' | 'degraded' | 'outage';
  active_ticket_ids: string[];
  active_incident_count: number;
  assigned_technicians: string[];
  verification_status?: 'verified' | 'unmapped';
}

export interface MapAuditEntry {
  id: string;
  timestamp: string;
  actor: 'host' | 'ai_assistant' | 'system';
  action: 'rename' | 'add' | 'remove' | 'move' | 'lock' | 'unlock' | 'batch_correct' | 'reset';
  target_id?: string;
  target_name?: string;
  details: string;
  previous_value?: string;
  new_value?: string;
}

export interface HostAITask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'reviewing' | 'applied' | 'completed';
  progress_percentage: number;
  locations_affected: string[];
  changes_made: string[];
  created_at: string;
  completed_at?: string;
  assigned_by: string;
  requires_confirmation?: boolean;
  confirmation_prompt?: string;
}

export interface CampusMapDataResponse {
  campus_name: string;
  location_name: string;
  postal_code: string;
  center_coordinates: { lat: number; lng: number };
  default_zoom: number;
  locations: CampusLocation[];
  total_locations: number;
  active_incidents_count: number;
  operational_services_count: number;
  is_locked?: boolean;
  audit_log?: MapAuditEntry[];
}

// --- Knowledge Base Types ---

export interface KBArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  tags: string[];
  read_time_mins: number;
  updated_at: string;
  summary: string;
  content_markdown: string;
  helpful_count: number;
  icon?: string;
  is_published: boolean;
}

export interface KBSearchResponse {
  articles: KBArticle[];
  total_count: number;
  categories: string[];
}

export interface KBArticleCreatePayload {
  title: string;
  category: string;
  tags: string[];
  summary: string;
  content_markdown: string;
  icon?: string;
  is_published: boolean;
}

// --- Analytics & Reports Types ---

export interface KPIStats {
  open_tickets: number;
  resolved_today: number;
  avg_resolution_time_mins: number;
  ai_resolution_rate_percent: number;
  escalations_count: number;
  ai_confidence_percent: number;
  total_tickets_handled: number;
  active_students_served: number;
}

export interface LineDataPoint {
  label: string;
  value: number;
  volume: number;
}

export interface DonutDataPoint {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DepartmentDataPoint {
  department: string;
  ticket_count: number;
  resolved_count: number;
  avg_turnaround_hours: number;
}

export interface TechnicianWorkloadItem {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  active_tickets: number;
  resolved_today: number;
  efficiency_rating: number;
}

export interface AnalyticsGraphsResponse {
  kpis: KPIStats;
  resolution_rate_trend: LineDataPoint[];
  priority_distribution: DonutDataPoint[];
  department_breakdown: DepartmentDataPoint[];
  technician_workloads: TechnicianWorkloadItem[];
  ai_confidence_trend: LineDataPoint[];
  recent_escalations_summary: Array<{
    id: string;
    ticket_number: string;
    title: string;
    category: string;
    tier: string;
    reason: string;
    escalated_at: string;
  }>;
}

export interface ReportSummaryResponse {
  date_range: string;
  generated_at: string;
  kpis: KPIStats;
  total_incidents: number;
  resolved_by_ai: number;
  resolved_by_staff: number;
  escalated_to_tier2: number;
  avg_response_time_secs: number;
  avg_diagnostic_turns: number;
  top_issue_categories: Array<{
    category: string;
    count: number;
    resolved_pct: number;
  }>;
  department_summary: DepartmentDataPoint[];
}

// --- User Types ---

export type UserRole = 'student' | 'technician' | 'admin' | 'host';

export type TechnicianSpecialization =
  | 'Network'
  | 'Hardware'
  | 'Software'
  | 'Support'
  | 'IAM / Access'
  | 'Network Technician'
  | 'Hardware Technician'
  | 'Software Technician'
  | 'Support Technician'
  | 'IAM/Access Technician'
  | 'Other';

export interface CampusUser {
  id: string;
  technician_id?: string;
  name: string;
  username?: string;
  email: string;
  netid: string;
  roll_number?: string;
  role: UserRole;
  specialization?: string;
  department: string;
  status: 'active' | 'away' | 'offline';
  is_active?: boolean;
  phone?: string;
  active_assignments_count: number;
  avatar_initials: string;
  skills: string[];
  created_at?: string;
  authenticated?: boolean;
}

export interface LoginResponse {
  authenticated?: boolean;
  token: string;
  token_type: string;
  user: CampusUser;
  expires_in: number;
}

export interface StudentSendOTPResponse {
  status: string;
  message: string;
  phone: string;
  roll_number: string;
  expires_in_seconds: number;
  cooldown_seconds: number;
  dev_mode: boolean;
  dev_otp?: string;
}

// --- Diagnostics & Probes Types ---

export type ProbeStatus = 'passed' | 'warning' | 'failed' | 'running';

export interface DiagnosticProbeResult {
  id: string;
  name: string;
  target: string;
  probe_type: 'live_network' | 'live_ai' | 'simulated_campus_infra';
  is_simulated: boolean;
  status: ProbeStatus;
  latency_ms?: number;
  output_message: string;
  details?: string;
  timestamp: string;
}

export interface DiagnosticsReportResponse {
  overall_health: 'healthy' | 'degraded' | 'critical';
  probes_passed: number;
  probes_total: number;
  probes: DiagnosticProbeResult[];
  run_timestamp: string;
  summary: string;
}

// --- AI Agent & Command Center Types ---

export interface AIActionButton {
  id: string;
  action_type: 'open_ticket' | 'view_map' | 'assign_technician' | 'escalate_tier2' | 'mark_resolved' | 'report_to_host' | string;
  label: string;
  target_id?: string;
  payload?: Record<string, unknown>;
}

export interface AIInsightItem {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  recommended_action?: string;
  action_target_id?: string;
}

export interface IncidentCluster {
  location: string;
  code: string;
  active_count: number;
  primary_category: string;
  severity: string;
  recommended_technician: string;
}

export interface AITechnicianWorkloadItem {
  name: string;
  role: string;
  specialization: string;
  active_tickets: number;
  status: 'Optimal' | 'High Workload' | 'Available' | string;
  recommended_queue: string[];
}

export interface AICommandCenterResponse {
  overall_health: string;
  autonomous_resolution_rate: number;
  avg_triage_seconds: number;
  total_active_incidents: number;
  insights: AIInsightItem[];
  incident_clusters: IncidentCluster[];
  technician_workload: AITechnicianWorkloadItem[];
  sla_risk_tickets: Array<{
    ticket_number: string;
    title: string;
    priority: string;
    location: string;
    assigned_technician: string;
    time_remaining: string;
  }>;
  system_recommendations: string[];
  generated_at: string;
}
