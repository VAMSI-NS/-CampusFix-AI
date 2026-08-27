import { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  MapPin,
  Ticket as TicketIcon,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { CampusUser, Ticket, TicketStatus } from '../types/chat';
import { getLocalTechnicians } from '../data/mockData';
import { apiUrl } from '../api';

interface HostOperationsHubProps {
  currentUser?: CampusUser | null;
  tickets: Ticket[];
  onOpenTicketInResolver: (ticketId: string) => void;
  onUpdateTicketStatus?: (ticketId: string, newStatus: TicketStatus) => void;
  onNavigateToMap: (locCode?: string) => void;
  onNavigateToTab: (tab: any) => void;
  onResetData: () => void;
  onRefreshTickets: () => void;
}

export default function HostOperationsHub({
  currentUser,
  tickets,
  onOpenTicketInResolver,
  onUpdateTicketStatus,
  onNavigateToMap,
  onNavigateToTab,
  onResetData,
  onRefreshTickets,
}: HostOperationsHubProps) {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeTickets = tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed');
  const criticalCount = activeTickets.filter((t) => t.priority === 'Critical' || t.priority === 'High').length;

  const filteredTickets = tickets.filter((t) => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  const handleStatusUpdate = async (ticketId: string, status: TicketStatus) => {
    if (onUpdateTicketStatus) {
      setIsProcessing(true);
      await onUpdateTicketStatus(ticketId, status);
      setActionSuccessMsg(`Updated status to ${status} for ticket ${ticketId}`);
      setIsProcessing(false);
    }
  };

  const handleReassignTechnician = async (ticketId: string, techName: string) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('campusfix_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl('/ai/execute-action'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action_type: 'assign_technician',
          ticket_id: ticketId,
          parameters: { technician_name: techName },
        }),
      });

      if (res.ok) {
        setActionSuccessMsg(`Assigned technician '${techName}' to ticket ${ticketId}.`);
        onRefreshTickets();
      }
    } catch (err) {
      console.warn('Reassign error:', err);
    }
    setIsProcessing(false);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem 2rem 3rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* SaaS Host Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Campus Operations Command</h1>
            <span className="badge-saas" style={{ background: '#f59e0b', color: '#000', fontWeight: 800 }}>
              HOST / ADMIN
            </span>
          </div>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Logged in as <strong>{currentUser?.name || 'Host Administrator'}</strong> • Autonomous campus infrastructure governance & SLA oversight.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn-saas btn-saas-secondary"
            onClick={onResetData}
            title="Reset to fresh clean demonstration state"
          >
            <RotateCcw size={14} />
            <span>Reset Demo Data</span>
          </button>
          <button
            type="button"
            className="btn-saas btn-saas-ai"
            onClick={() => onNavigateToTab('command-center')}
          >
            <Sparkles size={14} />
            <span>Open AI Command Center</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="saas-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
            <span>Active Incidents</span>
            <TicketIcon size={15} style={{ color: 'var(--primary-400)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem' }}>
            {activeTickets.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Across 9 verified blocks</div>
        </div>

        <div className="saas-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
            <span>Critical SLA Cases</span>
            <AlertTriangle size={15} style={{ color: 'var(--danger)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger)', marginTop: '0.35rem' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Under 2h response window</div>
        </div>

        <div className="saas-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
            <span>Active Technicians</span>
            <Wrench size={15} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.35rem' }}>
            4 / 4
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>100% Roster Availability</div>
        </div>

        <div className="saas-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
            <span>AI Autonomous Resolution</span>
            <TrendingUp size={15} style={{ color: 'var(--ai-cyan)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ai-cyan)', marginTop: '0.35rem' }}>
            78.5%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nemotron Tier-1 deflection</div>
        </div>
      </div>

      {/* AI Daily Operational Briefing */}
      <div className="ai-briefing-card" style={{ margin: '0 0 1.5rem' }}>
        <div className="ai-briefing-content">
          <div className="ai-briefing-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="ai-briefing-title">
              <span>CampusFix AI Operational Briefing</span>
              <span className="badge-saas badge-saas-ai" style={{ fontSize: '0.62rem' }}>Live Telemetry</span>
            </div>
            <p className="ai-briefing-text">
              • <strong>2 Network incidents</strong> correlated in U-Block (CSE/IT) — PEAP certificate handshake loop detected.<br />
              • <strong>1 High Priority ticket</strong> nearing SLA deadline for Duo 2FA at Priyamvada Hostel.<br />
              • Core 10Gbps fiber ring and NTR Library PaperCut systems operating nominally at 99.98% uptime.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            className="btn-saas btn-saas-ai"
            onClick={() => onNavigateToMap('loc-u-block')}
          >
            <MapPin size={13} />
            <span>Locate Hotspot on Map</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--success-subtle)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#34d399',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Advanced Ticket Operations Table */}
      <div className="saas-card" style={{ padding: 0, marginBottom: '2rem' }}>
        {/* Table Filters Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: 'var(--bg-surface-raised)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>Campus Incident Operations</h3>
            <span className="badge-saas badge-saas-neutral">{filteredTickets.length} Records</span>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <select
              className="saas-input"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              className="saas-input"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Eduroam Wi-Fi">Eduroam Wi-Fi</option>
              <option value="Duo MFA">Duo MFA</option>
              <option value="PaperCut Printing">PaperCut Printing</option>
              <option value="Canvas / SSO">Canvas / SSO</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="saas-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="saas-table">
            <thead>
              <tr>
                <th>Ticket Number</th>
                <th>Issue Synopsis</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Location</th>
                <th>Assigned Technician</th>
                <th>Host Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary-400)', cursor: 'pointer', fontWeight: 700 }}
                      onClick={() => onOpenTicketInResolver(t.ticket_number)}
                    >
                      {t.ticket_number}
                    </button>
                  </td>
                  <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                    {t.title}
                  </td>
                  <td>{t.category}</td>
                  <td>
                    <span
                      className={`badge-saas ${
                        t.priority === 'Critical'
                          ? 'badge-saas-danger'
                          : t.priority === 'High'
                          ? 'badge-saas-warning'
                          : 'badge-saas-primary'
                      }`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge-saas ${
                        t.status === 'Resolved'
                          ? 'badge-saas-success'
                          : t.status === 'Escalated'
                          ? 'badge-saas-danger'
                          : 'badge-saas-neutral'
                      }`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      onClick={() => onNavigateToMap(t.location)}
                      title="View building on satellite map"
                    >
                      <MapPin size={12} style={{ color: '#fb923c' }} />
                      <span>{t.location}</span>
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#ffffff' }}>{t.assigned_technician || 'Unassigned'}</span>
                      <select
                        className="saas-input"
                        disabled={isProcessing}
                        style={{ width: 'auto', padding: '0.15rem 0.4rem', fontSize: '0.68rem' }}
                        onChange={(e) => handleReassignTechnician(t.id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Reassign</option>
                        {getLocalTechnicians()
                          .filter((tech) => tech.role === 'technician')
                          .map((tech) => (
                            <option key={tech.id} value={tech.name}>
                              {tech.name} ({tech.specialization || 'IT'})
                            </option>
                          ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <select
                        className="saas-input"
                        disabled={isProcessing}
                        style={{ width: 'auto', padding: '0.15rem 0.4rem', fontSize: '0.68rem' }}
                        value={t.status}
                        onChange={(e) => handleStatusUpdate(t.id, e.target.value as TicketStatus)}
                      >
                        <option value="New">New</option>
                        <option value="Diagnosing">Diagnosing</option>
                        <option value="Waiting for Student">Waiting for Student</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Escalated">Escalated</option>
                      </select>
                      <button
                        type="button"
                        className="btn-saas btn-saas-ghost"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                        onClick={() => onOpenTicketInResolver(t.ticket_number)}
                      >
                        Inspect
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technician Roster & Capacity Manager */}
      <div className="saas-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={18} style={{ color: 'var(--primary-400)' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
              Campus IT Technician Roster & Capacity Balancing
            </h3>
          </div>
          <span className="badge-saas badge-saas-success">All Active</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {getLocalTechnicians()
            .filter((tech) => tech.role === 'technician')
            .map((tech) => {
              const activeCount = tickets.filter(
                (t) =>
                  t.status !== 'Resolved' &&
                  t.status !== 'Closed' &&
                  t.assigned_technician?.toLowerCase().includes(tech.name.toLowerCase())
              ).length;

              return (
                <div
                  key={tech.id}
                  style={{
                    background: 'var(--bg-surface-raised)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#ffffff' }}>👤 {tech.name}</strong>
                    <span className="badge-saas badge-saas-success" style={{ fontSize: '0.65rem' }}>
                      {tech.is_active !== false ? 'Active' : 'Offline'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Specialization: <strong>{tech.specialization || 'IT Services'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    <span>Active Cases: <strong>{activeCount}</strong></span>
                    <span>SLA Compliance: <strong style={{ color: 'var(--success)' }}>98.5%</strong></span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
