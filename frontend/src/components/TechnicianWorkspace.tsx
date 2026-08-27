import { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Send,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { CampusUser, Ticket, TicketStatus } from '../types/chat';
import { apiUrl } from '../api';

interface TechnicianWorkspaceProps {
  currentUser?: CampusUser | null;
  tickets: Ticket[];
  onOpenTicketInResolver: (ticketId: string) => void;
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus) => void;
  onNavigateToMap: (locCode?: string) => void;
  onRefreshTickets: () => void;
}

export default function TechnicianWorkspace({
  currentUser,
  tickets,
  onOpenTicketInResolver,
  onUpdateTicketStatus,
  onNavigateToMap,
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

  const displayTickets = assignedTickets.length > 0 ? assignedTickets : tickets.slice(0, 6);
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId || t.ticket_number === selectedTicketId) || displayTickets[0];

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
    <div className="animate-fade-in" style={{ padding: '1.5rem 2rem 3rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* SaaS Page Header */}
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
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Your work, organized.</h1>
            <span className="badge-saas badge-saas-primary">
              {currentUser?.specialization || 'Network Specialist'}
            </span>
          </div>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Logged in as <strong>{currentUser?.name || 'Technician'}</strong> • {displayTickets.length} active cases in your queue.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn-saas btn-saas-secondary"
            onClick={() => onNavigateToMap()}
          >
            <MapPin size={14} />
            <span>Open Campus Map</span>
          </button>
          <button
            type="button"
            className="btn-saas btn-saas-primary"
            onClick={() => onOpenTicketInResolver(selectedTicket?.ticket_number || 'INC-2026-8941')}
          >
            <Wrench size={14} />
            <span>Open Diagnostic Workbench</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="saas-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
            <span>Assigned Tickets</span>
            <Wrench size={15} style={{ color: 'var(--primary-400)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem' }}>
            {displayTickets.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cases in active workflow</div>
        </div>

        <div className="saas-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
            <span>Critical / High SLA</span>
            <AlertTriangle size={15} style={{ color: 'var(--danger)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger)', marginTop: '0.35rem' }}>
            {displayTickets.filter((t) => t.priority === 'Critical' || t.priority === 'High').length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Response target &lt; 2h</div>
        </div>

        <div className="saas-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
            <span>Today's Workload Index</span>
            <TrendingUp size={15} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.35rem' }}>
            Optimal
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Equilibrium balanced</div>
        </div>

        <div className="saas-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>
            <span>Resolved This Week</span>
            <CheckCircle2 size={15} style={{ color: 'var(--info)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--info)', marginTop: '0.35rem' }}>
            14
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Avg resolution 18m</div>
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

      {/* Split-Screen Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(380px, 1.5fr)', gap: '1.5rem' }}>
        {/* Left: Assigned Tickets Table */}
        <div className="saas-card" style={{ padding: 0 }}>
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>Assigned Queue</h3>
            <span className="badge-saas badge-saas-neutral">{displayTickets.length} Cases</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--bg-surface-raised)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    borderLeft: isSelected ? '3px solid var(--primary-500)' : '3px solid transparent',
                  }}
                  onClick={() => setSelectedTicketId(t.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ color: '#ffffff', fontSize: '0.82rem' }}>{t.ticket_number}</strong>
                      <span
                        className={`badge-saas ${
                          t.priority === 'Critical'
                            ? 'badge-saas-danger'
                            : t.priority === 'High'
                            ? 'badge-saas-warning'
                            : 'badge-saas-primary'
                        }`}
                        style={{ fontSize: '0.62rem' }}
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
                          : 'badge-saas-neutral'
                      }`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.2rem' }}>
                    {t.title}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <span>📍 {t.location}</span>
                    <span>👤 {t.netid}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Ticket Operations Inspector */}
        {selectedTicket && (
          <div className="saas-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                    {selectedTicket.ticket_number}
                  </h3>
                  <span className="badge-saas badge-saas-primary">{selectedTicket.category}</span>
                </div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {selectedTicket.title}
                </h4>
              </div>

              <button
                type="button"
                className="btn-saas btn-saas-secondary"
                style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}
                onClick={() => onNavigateToMap(selectedTicket.location)}
              >
                <MapPin size={12} />
                <span>Locate on Map</span>
              </button>
            </div>

            {/* Meta Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', background: 'var(--bg-surface-raised)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Requester / Student:</span>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                  {selectedTicket.netid} ({selectedTicket.email})
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Location:</span>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                  {selectedTicket.location}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Current Status:</span>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                  {selectedTicket.status}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SLA Target:</span>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--warning)' }}>
                  ⏳ 1h 45m remaining
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Problem Description
              </span>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedTicket.description}
              </p>
            </div>

            {/* Operational Actions */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>
                Technician Actions
              </span>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-saas btn-saas-secondary"
                  disabled={isProcessing}
                  onClick={() => handleStatusChange('Diagnosing')}
                >
                  <span>Start Diagnosing</span>
                </button>
                <button
                  type="button"
                  className="btn-saas btn-saas-primary"
                  disabled={isProcessing}
                  onClick={() => handleStatusChange('Resolved')}
                >
                  <CheckCircle2 size={14} />
                  <span>Mark Resolved</span>
                </button>
                <button
                  type="button"
                  className="btn-saas btn-saas-danger"
                  disabled={isProcessing}
                  onClick={handleEscalateTier2}
                >
                  <ShieldAlert size={14} />
                  <span>Escalate to Tier 2</span>
                </button>
                <button
                  type="button"
                  className="btn-saas btn-saas-ai"
                  onClick={() => setIsReportingToHost(!isReportingToHost)}
                >
                  <AlertTriangle size={14} />
                  <span>Report Blocked to Host</span>
                </button>
              </div>

              {/* Report to Host Drawer */}
              {isReportingToHost && (
                <div
                  style={{
                    marginTop: '1rem',
                    background: 'var(--bg-surface-raised)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                  }}
                >
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                    Report Blocked Issue to Host for Reassignment
                  </div>
                  <div style={{ marginBottom: '0.6rem' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
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
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
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
                      className="btn-saas btn-saas-ghost"
                      onClick={() => setIsReportingToHost(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-saas btn-saas-primary"
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
