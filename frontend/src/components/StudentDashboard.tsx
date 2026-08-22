import { useState } from 'react';
import {
  Search,
  Sparkles,
  Ticket as TicketIcon,
  MapPin,
  Radio,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { CampusUser, Ticket } from '../types/chat';

interface StudentDashboardProps {
  currentUser?: CampusUser | null;
  tickets: Ticket[];
  onStartDiagnosis: (topic?: string) => void;
  onOpenTicket: (ticketId: string) => void;
  onNavigateToTab: (tab: any) => void;
  onNavigateToMap: (locCode?: string) => void;
}

export default function StudentDashboard({
  currentUser,
  tickets,
  onStartDiagnosis,
  onOpenTicket,
  onNavigateToTab,
  onNavigateToMap,
}: StudentDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const myTickets = tickets.filter(
    (t) => currentUser && (t.netid === currentUser.netid || t.email === currentUser.email)
  );

  const activeRequests = myTickets.length > 0 ? myTickets : tickets.slice(0, 3);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onStartDiagnosis(searchQuery);
  };

  const quickQuestions = [
    'My Eduroam Wi-Fi keeps disconnecting in U-Block',
    'How do I register my PS5 on Dorm ResNet?',
    'Canvas 2FA push notification is timing out',
    'Where is the NTR Library IT Tech Bar located?',
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* SaaS Hero Section */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, var(--bg-canvas) 100%)',
          padding: '2.5rem 2rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--ai-subtle)',
              border: '1px solid var(--border-ai)',
              color: 'var(--ai-cyan)',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '1rem',
            }}
          >
            <Sparkles size={14} />
            <span>CAMPUSFIX AUTONOMOUS AI HELPDESK</span>
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            How can we help you today, {currentUser?.name?.split(' ')[0] || 'Student'}?
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            Instant AI diagnostics, ticket tracking, and verified Vignan University campus support.
          </p>

          {/* AI Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', maxWidth: '680px', margin: '0 auto' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '1.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="saas-input"
              style={{
                padding: '0.95rem 7.5rem 0.95rem 3.2rem',
                fontSize: '0.98rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-raised)',
                border: '1px solid var(--border-strong)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              }}
              placeholder="Ask CampusFix anything (e.g. 'Wi-Fi not connecting in U-Block')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="btn-saas btn-saas-primary"
              style={{
                position: 'absolute',
                right: '0.4rem',
                top: '50%',
                transform: 'translateY(-50%)',
                borderRadius: 'var(--radius-full)',
                padding: '0.6rem 1.25rem',
              }}
            >
              <span>Ask AI</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Quick Suggestion Chips */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="badge-saas badge-saas-neutral"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textTransform: 'none',
                  border: '1px solid var(--border-subtle)',
                }}
                onClick={() => onStartDiagnosis(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '1.75rem 2rem' }}>
        {/* Quick Actions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div
            className="saas-card saas-card-hover"
            style={{ cursor: 'pointer' }}
            onClick={() => onStartDiagnosis()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--ai-cyan) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Plus size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Report an Issue</h4>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem' }}>Interactive AI diagnostic triage</p>
              </div>
            </div>
          </div>

          <div
            className="saas-card saas-card-hover"
            style={{ cursor: 'pointer' }}
            onClick={() => onNavigateToTab('status')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--success)',
                }}
              >
                <Radio size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Service Status</h4>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem' }}>Eduroam, Canvas, Duo health</p>
              </div>
            </div>
          </div>

          <div
            className="saas-card saas-card-hover"
            style={{ cursor: 'pointer' }}
            onClick={() => onNavigateToMap()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--warning)',
                }}
              >
                <MapPin size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Satellite Map</h4>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem' }}>Verified Vignan campus blocks</p>
              </div>
            </div>
          </div>

          <div
            className="saas-card saas-card-hover"
            style={{ cursor: 'pointer' }}
            onClick={() => onNavigateToTab('kb')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(147, 51, 234, 0.15)',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc',
                }}
              >
                <BookOpen size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Help Center</h4>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem' }}>Step-by-step IT setup guides</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Requests Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>My Support Requests</h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Track live progress, diagnostic stages, and assigned campus technicians.
              </p>
            </div>
            <button
              type="button"
              className="btn-saas btn-saas-secondary"
              onClick={() => onNavigateToTab('history')}
            >
              <span>View All History</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
            {activeRequests.map((t) => (
              <div
                key={t.id}
                className="saas-card saas-card-hover"
                style={{ cursor: 'pointer' }}
                onClick={() => onOpenTicket(t.ticket_number)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <TicketIcon size={16} style={{ color: 'var(--primary-400)' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>{t.ticket_number}</span>
                  </div>
                  <span
                    className={`badge-saas ${
                      t.status === 'Resolved'
                        ? 'badge-saas-success'
                        : t.status === 'Escalated'
                        ? 'badge-saas-danger'
                        : 'badge-saas-primary'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                  {t.title}
                </div>

                <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {t.description.slice(0, 95)}...
                </p>

                {/* Progress Bar */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>Stage: <strong>{t.diagnostic_stage || 'Triage'}</strong></span>
                    <span>{t.diagnostic_progress || 40}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${t.diagnostic_progress || 40}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--primary-500), var(--ai-cyan))',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                </div>

                {/* Card Meta Footer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.65rem',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={12} />
                    {t.location}
                  </span>
                  <span>
                    Tech: <strong style={{ color: 'var(--text-primary)' }}>{t.assigned_technician || 'Auto-Routing'}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Service Health Summary */}
        <div className="saas-card" style={{ background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>Campus IT Services Health</h4>
            </div>
            <span className="badge-saas badge-saas-success" style={{ fontSize: '0.68rem' }}>
              All Core Systems Nominal
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {[
              { name: 'Eduroam Wi-Fi (U-Block)', status: 'Operational', ping: '12ms' },
              { name: 'Canvas LMS & SSO', status: 'Operational', ping: '24ms' },
              { name: 'Duo 2FA Authentication', status: 'Operational', ping: '18ms' },
              { name: 'PaperCut WebPrint (NTR Lib)', status: 'Operational', ping: '9ms' },
              { name: 'Vignan 10Gbps Fiber Ring', status: 'Operational', ping: '4ms' },
            ].map((svc, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{svc.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '0.1rem' }}>● {svc.status}</div>
                </div>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {svc.ping}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
