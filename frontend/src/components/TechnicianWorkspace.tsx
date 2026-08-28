import { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Send,
  ShieldAlert,
  TrendingUp,
  Sparkles,
  User,
  Clock,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { CampusUser, Ticket, TicketStatus } from '../types/chat';
import { apiUrl } from '../api';

interface TechnicianWorkspaceProps {
  currentUser?: CampusUser | null;
  tickets: Ticket[];
  onOpenTicketInResolver: (ticketId: string) => void;
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus) => void;
  onNavigateToMap: (locCode?: string) => void;
  onNavigateToIntelligence?: () => void;
  onRefreshTickets: () => void;
}

export default function TechnicianWorkspace({
  currentUser,
  tickets,
  onOpenTicketInResolver,
  onUpdateTicketStatus,
  onNavigateToMap,
  onNavigateToIntelligence,
  onRefreshTickets,
}: TechnicianWorkspaceProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [techNote, setTechNote] = useState('');
  const [isReportingToHost, setIsReportingToHost] = useState(false);
  const [requiredSpec, setRequiredSpec] = useState('Network Infrastructure');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter assigned tickets for logged in technician
  const assignedTickets = tickets.filter(
    (t) =>
      currentUser &&
      (t.assigned_technician?.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        t.assigned_technician?.toLowerCase().includes(currentUser.username?.toLowerCase() || ''))
  );

  const displayTickets = assignedTickets.length > 0 ? assignedTickets : tickets.slice(0, 8);
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId || t.ticket_number === selectedTicketId) || displayTickets[0];

  const criticalCount = displayTickets.filter((t) => t.priority === 'Critical' || t.priority === 'Urgent').length;
  const highCount = displayTickets.filter((t) => t.priority === 'High').length;

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    setIsProcessing(true);
    await onUpdateTicketStatus(selectedTicket.id, newStatus);
    setActionSuccessMsg(`Status updated to '${newStatus}' for ${selectedTicket.ticket_number}`);
    setIsProcessing(false);
    onRefreshTickets();
  };

  const handleReportBlockedToHost = async () => {
    if (!selectedTicket) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('campusfix_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl('/ai/execute-action'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action_type: 'report_to_host',
          ticket_id: selectedTicket.id,
          parameters: {
            required_specialization: requiredSpec,
            notes: techNote || 'Technician blocked; reported to Host for reassignment.',
          },
        }),
      });

      if (res.ok) {
        setActionSuccessMsg(`Blocked state reported to Host with required specialization '${requiredSpec}'.`);
        setIsReportingToHost(false);
        setTechNote('');
        onRefreshTickets();
      }
    } catch (err) {
      console.warn('Report to host error:', err);
    }
    setIsProcessing(false);
  };

  const handleEscalateTier2 = async () => {
    if (!selectedTicket) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('campusfix_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl('/ai/execute-action'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action_type: 'escalate_tier2',
          ticket_id: selectedTicket.id,
          parameters: {
            reason: 'Complex hardware/infrastructure failure exceeding Tier-1 desk scope.',
          },
        }),
      });

      if (res.ok) {
        setActionSuccessMsg(`Ticket ${selectedTicket.ticket_number} formally escalated to Tier-2.`);
        onRefreshTickets();
      }
    } catch (err) {
      console.warn('Escalate error:', err);
    }
    setIsProcessing(false);
  };

  return (
    <div style={{ padding: '0 0 3.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* SaaS Page Header */}
      <div
        className="card-saas"
        style={{
          padding: '1.5rem 2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>Technician Operations Workspace</h1>
            <span className="badge-saas badge-saas-primary">
              {currentUser?.specialization || 'Network Specialist'}
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Logged in as <strong>{currentUser?.name || 'Technician'}</strong> • {displayTickets.length} cases assigned in your active queue.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {onNavigateToIntelligence && (
            <button
              type="button"
              className="btn-saas btn-secondary"
              onClick={onNavigateToIntelligence}
              style={{ gap: '0.45rem' }}
            >
              <Sparkles size={15} style={{ color: 'var(--ai-500)' }} />
              <span>AI Clusters & Anomalies</span>
            </button>
          )}
          <button
            type="button"
            className="btn-saas btn-secondary"
            onClick={() => onNavigateToMap()}
          >
            <MapPin size={15} />
            <span>Campus Map</span>
          </button>
          <button
            type="button"
            className="btn-saas btn-primary"
            onClick={() => onOpenTicketInResolver(selectedTicket?.ticket_number || 'INC-2026-8941')}
          >
            <Wrench size={15} />
            <span>Open Diagnostic Workbench</span>
          </button>
        </div>
      </div>

      {/* "What needs my attention right now?" Triage Banner */}
      <div
        className="card-saas"
        style={{
          padding: '1.15rem 1.5rem',
          marginBottom: '1.5rem',
          background: criticalCount > 0 ? 'rgba(239, 68, 68, 0.06)' : 'var(--bg-surface-hover)',
          borderLeft: criticalCount > 0 ? '4px solid var(--danger-500)' : '4px solid var(--primary-500)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: criticalCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(79, 70, 229, 0.15)',
              color: criticalCount > 0 ? 'var(--danger-500)' : 'var(--primary-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>
              {criticalCount > 0
                ? `Immediate Attention Required: ${criticalCount} Critical Case(s)`
                : `Queue Stable: ${displayTickets.length} Active Incident(s)`}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {criticalCount > 0
                ? `${criticalCount} high-severity outage(s) or exam disruptions pending resolution.`
                : `${highCount} high-priority item(s) within standard SLA targets.`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge-saas badge-saas-secondary">SLA Target: &lt; 2h</span>
          {selectedTicket && (
            <button
              type="button"
              className="btn-saas btn-ghost"
              style={{ fontSize: '0.78rem', color: 'var(--primary-500)' }}
              onClick={() => onOpenTicketInResolver(selectedTicket.ticket_number)}
            >
              <span>Quick Diagnose #{selectedTicket.ticket_number}</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Assigned Queue</span>
            <Wrench size={16} style={{ color: 'var(--primary-400)' }} />
          </div>
          <div className="kpi-value">{displayTickets.length}</div>
          <div className="kpi-subtext">Active cases in your roster</div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Critical / High SLA</span>
            <AlertTriangle size={16} style={{ color: 'var(--danger-500)' }} />
          </div>
          <div className="kpi-value" style={{ color: criticalCount > 0 ? 'var(--danger-500)' : 'inherit' }}>
            {criticalCount + highCount}
          </div>
          <div className="kpi-subtext">Response target &lt; 2h</div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Workload Index</span>
            <TrendingUp size={16} style={{ color: 'var(--success-500)' }} />
          </div>
          <div className="kpi-value" style={{ color: 'var(--success-500)' }}>
            Optimal
          </div>
          <div className="kpi-subtext">Load balanced across team</div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Resolved (Week)</span>
            <CheckCircle2 size={16} style={{ color: 'var(--info-500)' }} />
          </div>
          <div className="kpi-value" style={{ color: 'var(--info-500)' }}>14</div>
          <div className="kpi-subtext">Avg resolution 18m</div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--success-50)',
            border: '1px solid var(--success-500)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success-700)',
            fontSize: '0.86rem',
            fontWeight: 600,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} style={{ color: 'var(--success-500)' }} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Split-Screen Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(380px, 1.6fr)', gap: '1.5rem' }}>
        {/* Left: Assigned Tickets Table */}
        <div className="card-saas" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '1.1rem 1.25rem',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-surface-hover)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>Assigned Incident Queue</h3>
            <span className="badge-saas badge-saas-secondary">{displayTickets.length} Cases</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    borderLeft: isSelected ? '3px solid var(--primary-500)' : '3px solid transparent',
                  }}
                  onClick={() => setSelectedTicketId(t.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <strong style={{ fontSize: '0.84rem', fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>
                        {t.ticket_number}
                      </strong>
                      <span
                        className={`badge-saas ${
                          t.priority === 'Critical'
                            ? 'badge-saas-danger'
                            : t.priority === 'High'
                            ? 'badge-saas-warning'
                            : 'badge-saas-primary'
                        }`}
                        style={{ fontSize: '0.66rem' }}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <span
                      className={`badge-saas ${
                        t.status === 'Resolved'
                          ? 'badge-saas-success'
                          : t.status === 'Escalated'
                          ? 'badge-saas-danger'
                          : 'badge-saas-warning'
                      }`}
                      style={{ fontSize: '0.68rem' }}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    {t.title}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} /> {t.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <User size={12} /> {t.netid}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Ticket Operations Inspector */}
        {selectedTicket && (
          <div className="card-saas" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {selectedTicket.ticket_number}
                  </h3>
                  <span className="badge-saas badge-saas-secondary">{selectedTicket.category}</span>
                </div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {selectedTicket.title}
                </h4>
              </div>

              <button
                type="button"
                className="btn-saas btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                onClick={() => onNavigateToMap(selectedTicket.location)}
              >
                <MapPin size={13} />
                <span>Locate on Map</span>
              </button>
            </div>

            {/* Meta Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Requester:</span>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, marginTop: '0.1rem' }}>
                  {selectedTicket.netid} ({selectedTicket.email})
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location:</span>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, marginTop: '0.1rem' }}>
                  {selectedTicket.location}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Status:</span>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary-400)', marginTop: '0.1rem' }}>
                  {selectedTicket.status}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SLA Target:</span>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--warning-500)', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} /> 1h 45m remaining
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Incident Description
              </span>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {selectedTicket.description}
              </p>
            </div>

            {/* AI Decision Assistance Panel */}
            <div
              className="card-saas"
              style={{
                padding: '1.15rem',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Sparkles size={15} style={{ color: 'var(--ai-500)' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ai-500)' }}>
                    AI Decision Assistance
                  </span>
                </div>
                <span className="badge-ai-inference" style={{ fontSize: '0.65rem' }}>AI ASSISTIVE INFERENCE</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem' }}>
                <div>
                  <strong>Root Cause Hypothesis:</strong> Configuration mismatch or expired RADIUS token for {selectedTicket.category}.
                </div>
                <div>
                  <strong>Diagnostic Confidence:</strong> <span style={{ color: 'var(--success-500)', fontWeight: 700 }}>88% High</span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <strong>Recommended Step:</strong> Verify AP gateway telemetry in {selectedTicket.location}, then update ticket status to Diagnosing.
                </div>
              </div>
            </div>

            {/* Operational Actions */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem', display: 'block' }}>
                Technician Execution Controls
              </span>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-saas btn-secondary"
                  disabled={isProcessing}
                  onClick={() => handleStatusChange('Diagnosing')}
                >
                  <span>Start Diagnosing</span>
                </button>
                <button
                  type="button"
                  className="btn-saas btn-primary"
                  disabled={isProcessing}
                  onClick={() => handleStatusChange('Resolved')}
                >
                  <CheckCircle2 size={14} />
                  <span>Mark Resolved</span>
                </button>
                <button
                  type="button"
                  className="btn-saas btn-danger"
                  disabled={isProcessing}
                  onClick={handleEscalateTier2}
                >
                  <ShieldAlert size={14} />
                  <span>Escalate to Tier 2</span>
                </button>
                <button
                  type="button"
                  className="btn-saas btn-secondary"
                  style={{ color: 'var(--ai-500)' }}
                  onClick={() => setIsReportingToHost(!isReportingToHost)}
                >
                  <AlertTriangle size={14} />
                  <span>Report Blocked to Host</span>
                </button>
              </div>

              {/* Report to Host Drawer */}
              {isReportingToHost && (
                <div
                  className="card-saas"
                  style={{
                    marginTop: '1rem',
                    padding: '1.25rem',
                    background: 'var(--bg-surface-hover)',
                  }}
                >
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                    Report Blocked Issue to Host for Reassignment
                  </div>
                  <div style={{ marginBottom: '0.65rem' }}>
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Required Specialization:
                    </label>
                    <select
                      className="saas-input"
                      value={requiredSpec}
                      onChange={(e) => setRequiredSpec(e.target.value)}
                    >
                      <option value="Network Infrastructure">Network Infrastructure (Wi-Fi/RADIUS)</option>
                      <option value="Identity & Access (2FA/SSO)">Identity & Access (Duo/Shibboleth)</option>
                      <option value="Hardware & Lab Computing">Hardware & Lab Computing</option>
                      <option value="Software & LMS Application">Software & LMS Application</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '0.85rem' }}>
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Blocker Reason / Diagnostic Notes:
                    </label>
                    <input
                      type="text"
                      className="saas-input"
                      placeholder="Why is this blocked? (e.g., Physical port failure on switch 4)"
                      value={techNote}
                      onChange={(e) => setTechNote(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-saas btn-ghost"
                      onClick={() => setIsReportingToHost(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-saas btn-primary"
                      disabled={isProcessing}
                      onClick={handleReportBlockedToHost}
                    >
                      <Send size={13} />
                      <span>Submit Report to Host</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
