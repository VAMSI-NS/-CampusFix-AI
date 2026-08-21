import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Ticket,
  TicketStatus,
  AnalyticsGraphsResponse,
  CampusUser,
  DiagnosticsReportResponse,
} from '../types/chat';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Cpu,
  Wifi,
  Users,
  Database,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  Search,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface AdminDashboardProps {
  tickets: Ticket[];
  onOpenInResolver: (ticketId: string) => void;
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus) => Promise<void>;
  onNavigateToKB?: () => void;
}

type AdminTab =
  | 'overview'
  | 'tickets'
  | 'analytics'
  | 'network'
  | 'users'
  | 'database'
  | 'settings';

export default function AdminDashboard({
  tickets,
  onOpenInResolver,
  onUpdateTicketStatus,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [graphs, setGraphs] = useState<AnalyticsGraphsResponse | null>(null);
  const [users, setUsers] = useState<CampusUser[]>([]);
  const [probes, setProbes] = useState<DiagnosticsReportResponse | null>(null);
  const [databaseInfo, setDatabaseInfo] = useState<{
    database_status: string;
    schema_version: string;
    total_records: number;
    tables: { table_name: string; count: number; description: string }[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Fetch graphs and analytics
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [gRes, uRes, pRes, dRes] = await Promise.all([
        fetch('/api/analytics/graphs'),
        fetch('/api/users'),
        fetch('/api/diagnostics/probes'),
        fetch('/api/admin/database'),
      ]);

      if (gRes.ok) setGraphs(await gRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (pRes.ok) setProbes(await pRes.json());
      if (dRes.ok) setDatabaseInfo(await dRes.json());
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, tickets]);

  // Filtered ticket queue
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        searchQuery === '' ||
        t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.netid.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;

      return matchSearch && matchPriority && matchStatus;
    });
  }, [tickets, searchQuery, priorityFilter, statusFilter]);

  // Derived Technician KPIs
  const urgentCount = useMemo(
    () => tickets.filter((t) => (t.priority === 'High' || t.priority === 'Urgent' || t.priority === 'Critical') && t.status !== 'Resolved').length,
    [tickets]
  );
  const openCount = useMemo(
    () => tickets.filter((t) => t.status === 'New' || t.status === 'Diagnosing' || t.status === 'Waiting for Student').length,
    [tickets]
  );
  const escalatedCount = useMemo(
    () => tickets.filter((t) => t.status === 'Escalated').length,
    [tickets]
  );
  const resolvedCount = useMemo(
    () => tickets.filter((t) => t.status === 'Resolved').length,
    [tickets]
  );

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="specialist-avatar" style={{ width: 34, height: 34 }}>
            <LayoutDashboard size={18} />
          </div>
          <div>
            <h3>Technician Hub</h3>
            <span>Operations & Triage</span>
          </div>
        </div>

        <nav className="admin-nav-menu">
          <button
            className={`admin-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={16} />
            <span>Overview & Queue</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <TicketIcon size={16} />
            <span>All Incidents ({tickets.length})</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Cpu size={16} />
            <span>AI Reasoning SLA</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => setActiveTab('network')}
          >
            <Wifi size={16} />
            <span>Infrastructure Probes</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            <span>Staff Directory</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'database' ? 'active' : ''}`}
            onClick={() => setActiveTab('database')}
          >
            <Database size={16} />
            <span>Storage & Tables</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            <span>IT Settings</span>
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            className="btn-secondary-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={fetchAnalytics}
          >
            <RotateCcw size={13} className={isLoading ? 'spin' : ''} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </aside>

      {/* Main Dashboard Views */}
      <main className="admin-main-view">
        {/* =========================================================================
            1. OVERVIEW & TECHNICIAN INCIDENT QUEUE (Top priority view)
            ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="admin-section-content">
            {/* Top Tier: 4 Key Actionable KPIs */}
            <div className="admin-kpis-grid">
              <div
                className="admin-kpi-card"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setStatusFilter('All');
                  setPriorityFilter('All');
                }}
              >
                <div className="metric-icon-wrap" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div className="kpi-number">{openCount}</div>
                  <div className="kpi-label">Active Open Queue</div>
                  <div className="kpi-sub">Needing active triage</div>
                </div>
              </div>

              <div
                className="admin-kpi-card"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setPriorityFilter('High');
                  setStatusFilter('All');
                }}
              >
                <div className="metric-icon-wrap" style={{ background: 'var(--danger-50)', color: 'var(--danger-600)' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="kpi-number" style={{ color: 'var(--danger-600)' }}>{urgentCount}</div>
                  <div className="kpi-label">High Priority</div>
                  <div className="kpi-sub">Expedited attention</div>
                </div>
              </div>

              <div
                className="admin-kpi-card"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setStatusFilter('Escalated');
                  setPriorityFilter('All');
                }}
              >
                <div className="metric-icon-wrap" style={{ background: 'var(--warning-50)', color: 'var(--warning-600)' }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="kpi-number" style={{ color: 'var(--warning-600)' }}>{escalatedCount}</div>
                  <div className="kpi-label">Tech Bar Escalated</div>
                  <div className="kpi-sub">In-person walkup required</div>
                </div>
              </div>

              <div
                className="admin-kpi-card"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setStatusFilter('Resolved');
                  setPriorityFilter('All');
                }}
              >
                <div className="metric-icon-wrap" style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="kpi-number" style={{ color: 'var(--success-600)' }}>{resolvedCount}</div>
                  <div className="kpi-label">Resolved Today</div>
                  <div className="kpi-sub">Verified resolutions</div>
                </div>
              </div>
            </div>

            {/* Middle Tier: Live Incident Queue Table with Direct Actions */}
            <div className="admin-table-card">
              <div className="card-header-flex" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Technician Incident Queue</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Showing {filteredTickets.length} of {tickets.length} total campus incidents
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div className="search-box-sm">
                    <Search size={14} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search NetID, title, number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="form-select-sm"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="All">Priority: All</option>
                    <option value="Critical">Critical</option>
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  <select
                    className="form-select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">Status: All</option>
                    <option value="New">New</option>
                    <option value="Diagnosing">Diagnosing</option>
                    <option value="Waiting for Student">Waiting for Student</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                </div>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Issue Synopsis</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Student NetID</th>
                    <th>Primary Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <span className="ticket-badge-mono">{t.ticket_number}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{t.title}</div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {t.location} • Stage: {t.diagnostic_stage} ({t.diagnostic_progress}%)
                          </span>
                        </td>
                        <td>
                          <span className="category-tag">{t.category}</span>
                        </td>
                        <td>
                          <span className={`priority-tag priority-${t.priority.toLowerCase()}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <select
                            className={`status-select-sm status-${t.status.toLowerCase().replace(/\s+/g, '-')}`}
                            value={t.status}
                            onChange={(e) => onUpdateTicketStatus(t.id, e.target.value as TicketStatus)}
                          >
                            <option value="New">New</option>
                            <option value="Diagnosing">Diagnosing</option>
                            <option value="Waiting for Student">Waiting</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Escalated">Escalated</option>
                          </select>
                        </td>
                        <td>
                          <span className="font-mono" style={{ fontSize: '0.78rem' }}>{t.netid}</span>
                        </td>
                        <td>
                          <button
                            className="btn-primary-sm"
                            onClick={() => onOpenInResolver(t.id)}
                            title="Open in Incident Resolver Workbench"
                          >
                            <span>Resolve</span>
                            <ArrowUpRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No incidents matching current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Tier: Resolution Trend Chart & Active Staff Workload */}
            <div className="admin-charts-grid">
              {/* 7-Day Resolution Trend Line */}
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <h4>7-Day Resolution Efficiency Trend</h4>
                    <p>Daily incident throughput vs AI resolved</p>
                  </div>
                  <TrendingUp size={16} style={{ color: 'var(--success-500)' }} />
                </div>
                <div className="bar-chart-container">
                  {graphs?.resolution_rate_trend ? (
                    graphs.resolution_rate_trend.map((item) => (
                      <div key={item.label} className="bar-chart-col">
                        <span className="bar-val-text">{item.value}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ height: `${Math.min(100, item.value * 8 + 15)}%` }}
                          />
                        </div>
                        <span className="bar-label">{item.label}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Calculating resolution trends...
                    </div>
                  )}
                </div>
              </div>

              {/* Active Technician Workloads */}
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <h4>Technician Queue Workloads</h4>
                    <p>Active assigned cases per support specialist</p>
                  </div>
                  <Users size={16} style={{ color: 'var(--primary-500)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                  {graphs?.technician_workloads && graphs.technician_workloads.length > 0 ? (
                    graphs.technician_workloads.map((tech) => (
                      <div key={tech.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <span style={{ fontWeight: 600 }}>{tech.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {tech.active_tickets} active • {tech.resolved_today} resolved
                          </span>
                        </div>
                        <div className="progress-bar-bg" style={{ height: 6 }}>
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${Math.min(100, tech.active_tickets * 18 + 10)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Loading technician roster...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            2. TICKETS QUEUE TAB
            ========================================================================= */}
        {activeTab === 'tickets' && (
          <div className="admin-section-content">
            <div className="admin-table-card">
              <div className="card-header-flex" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Master Incident Directory</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Total {tickets.length} incident records stored
                  </p>
                </div>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Title & Location</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td><span className="ticket-badge-mono">{t.ticket_number}</span></td>
                      <td>
                        <strong>{t.title}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.location}</div>
                      </td>
                      <td><span className="category-tag">{t.category}</span></td>
                      <td><span className={`priority-tag priority-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                      <td>
                        <span className={`status-tag status-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="btn-primary-sm"
                          onClick={() => onOpenInResolver(t.id)}
                        >
                          Workbench ↗
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. AI ANALYTICS & REASONING SLA
            ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="admin-section-content">
            <div className="admin-kpis-grid">
              <div className="admin-kpi-card">
                <div className="metric-icon-wrap" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                  <Cpu size={20} />
                </div>
                <div>
                  <div className="kpi-number">94.2%</div>
                  <div className="kpi-label">Nemotron 3 Accuracy</div>
                  <div className="kpi-sub">Verified root-cause identification</div>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="metric-icon-wrap" style={{ background: 'var(--info-50)', color: 'var(--info-600)' }}>
                  <Zap size={20} />
                </div>
                <div>
                  <div className="kpi-number">2.4</div>
                  <div className="kpi-label">Avg Diagnostic Turns</div>
                  <div className="kpi-sub">Turns to resolution or escalation</div>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="metric-icon-wrap" style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="kpi-number">70%</div>
                  <div className="kpi-label">Autonomous Resolution</div>
                  <div className="kpi-sub">Resolved without human dispatch</div>
                </div>
              </div>
            </div>

            <div className="chart-card" style={{ marginTop: '1rem' }}>
              <div className="chart-header">
                <div>
                  <h4>Recent Escalations Summary</h4>
                  <p>Incidents routed to Tier-2 & Tech Bar</p>
                </div>
                <ShieldAlert size={16} style={{ color: 'var(--warning-500)' }} />
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                {graphs?.recent_escalations_summary && graphs.recent_escalations_summary.length > 0 ? (
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none' }}>
                    {graphs.recent_escalations_summary.map((esc) => (
                      <li key={esc.id} style={{ background: 'var(--bg-surface-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{esc.ticket_number}</span> — {esc.category} ({esc.reason})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No escalations in current cycle.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            4. NETWORK & INFRASTRUCTURE PROBES
            ========================================================================= */}
        {activeTab === 'network' && (
          <div className="admin-section-content">
            <div className="probes-grid">
              {probes?.probes.map((pr) => (
                <div key={pr.name} className="probe-card">
                  <div className="probe-top">
                    <div>
                      <div className="probe-name">{pr.name}</div>
                      <div className="probe-target">{pr.target}</div>
                    </div>
                    <span className={`status-tag status-${pr.status.toLowerCase()}`}>
                      {pr.status}
                    </span>
                  </div>
                  <div className="probe-output">{pr.output_message}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <span>Latency: {pr.latency_ms}ms</span>
                    <span>{new Date(pr.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            5. STAFF & TECHNICIAN DIRECTORY
            ========================================================================= */}
        {activeTab === 'users' && (
          <div className="admin-section-content">
            <div className="admin-table-card">
              <div className="card-header-flex" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Campus IT Staff Directory</h3>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Specialty Skills</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td><span className="category-tag">{u.role}</span></td>
                      <td>{u.department}</td>
                      <td>
                        <span className={`status-tag ${u.status === 'active' ? 'status-resolved' : 'status-waiting-for-student'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>
                        {u.skills?.join(', ') || 'General IT Support'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            6. DATABASE STORAGE & TABLES
            ========================================================================= */}
        {activeTab === 'database' && databaseInfo && (
          <div className="admin-section-content">
            <div className="admin-table-card">
              <div className="card-header-flex" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Data Storage & Schema Inspection</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Schema {databaseInfo.schema_version} • Total records: {databaseInfo.total_records}
                  </p>
                </div>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Table Name</th>
                    <th>Records Count</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {databaseInfo.tables.map((tbl) => (
                    <tr key={tbl.table_name}>
                      <td><code style={{ color: 'var(--primary-600)' }}>{tbl.table_name}</code></td>
                      <td><strong>{tbl.count}</strong> records</td>
                      <td>{tbl.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            7. IT SETTINGS
            ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="admin-section-content">
            <div className="admin-table-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Help Desk Service Parameters</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Auto-Escalation Threshold</label>
                  <input type="text" className="form-input" defaultValue="4 diagnostic turns without resolution" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tech Bar Walkup Queue Routing</label>
                  <input type="text" className="form-input" defaultValue="Main Library 1st Floor Counter" />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Tier-1 SLA</label>
                  <input type="text" className="form-input" defaultValue="< 15 minutes first resolution" />
                </div>
                <div className="form-group">
                  <label className="form-label">AI Diagnostic Reasoning Engine</label>
                  <input type="text" className="form-input" defaultValue="NVIDIA Nemotron 3 Ultra (OpenRouter)" disabled />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
