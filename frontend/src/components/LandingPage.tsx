import { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Search,
  Zap,
  Ticket as TicketIcon,
  Wifi,
  KeyRound,
  Laptop,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  Printer,
  GraduationCap,
  Wrench,
  ShieldAlert,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { Ticket, UserRole } from '../types/chat';
import { getLocalTickets } from '../data/mockData';

interface LandingPageProps {
  onStartDiagnosis: (initialProblem?: string) => void;
  onNavigateTab: (tab: 'resolver' | 'history' | 'tickets' | 'status' | 'kb' | 'diagnostics' | 'admin' | 'reports') => void;
  tickets: Ticket[];
  onOpenChatModal: (initialProblem?: string) => void;
  onPromptLogin?: (role: UserRole) => void;
}

// 3 Core Quick Suggestions
const POPULAR_ISSUES = [
  {
    label: 'Campus Wi-Fi / Eduroam Connection',
    query: 'My laptop connects to Eduroam Wi-Fi but has no internet and keeps asking for my password.',
    icon: Wifi,
  },
  {
    label: 'SSO & Duo 2FA Login Recovery',
    query: 'I got a new phone and cannot complete Duo 2FA push verification to log into my university account.',
    icon: KeyRound,
  },
  {
    label: 'Canvas & Course Software Access',
    query: 'I am unable to submit my assignment on Canvas and the page is throwing an access authorization error.',
    icon: Laptop,
  },
];

// Live Campus Status Preview Items
const STATUS_PREVIEW = [
  { name: 'Campus Wi-Fi (Eduroam)', status: 'Operational', desc: 'Wi-Fi active across all campus buildings', icon: Wifi },
  { name: 'Canvas LMS & Courses', status: 'Operational', desc: 'Assignment portals & grading active', icon: Laptop },
  { name: 'Duo 2FA Login', status: 'Operational', desc: 'Authentication push working normally', icon: KeyRound },
  { name: 'Campus Printing', status: 'Operational', desc: 'Release stations available across libraries', icon: Printer },
];

export default function LandingPage({
  onNavigateTab,
  tickets,
  onOpenChatModal,
  onPromptLogin,
}: LandingPageProps) {
  const [searchProblem, setSearchProblem] = useState('');
  const [trackTicketNumber, setTrackTicketNumber] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<Ticket | null | 'not_found'>(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  // Animated stat counters
  const [statResolutionRate, setStatResolutionRate] = useState(0);
  const [statAvgTime, setStatAvgTime] = useState(0);
  const [statUptime, setStatUptime] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatResolutionRate(94);
      setStatAvgTime(2);
      setStatUptime(99.9);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchProblem.trim()) {
      onOpenChatModal(searchProblem.trim());
    } else {
      onOpenChatModal();
    }
  };

  const handleTrackTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackTicketNumber.trim().toLowerCase();
    if (!query) return;

    // Search prop tickets and localStorage tickets
    const localList = getLocalTickets();
    const allKnown = [...tickets, ...localList.filter((lt) => !tickets.some((t) => t.id === lt.id))];

    const found = allKnown.find(
      (t) =>
        t.ticket_number.toLowerCase() === query ||
        t.id.toLowerCase() === query ||
        t.ticket_number.toLowerCase().replace(/[^a-z0-9]/g, '') === query.replace(/[^a-z0-9]/g, '') ||
        t.ticket_number.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query)
    );

    if (found) {
      setTrackedTicket(found);
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(query)}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const apiTicket: Ticket = await res.json();
          if (apiTicket && apiTicket.ticket_number) {
            setTrackedTicket(apiTicket);
            return;
          }
        }
      }
    } catch {
      // Quiet fallback
    }

    setTrackedTicket('not_found');
  };

  const handleRoleSignIn = (role: UserRole) => {
    if (onPromptLogin) {
      onPromptLogin(role);
    }
  };

  return (
    <div className="landing-page-container">
      {/* Background ambient lighting effects */}
      <div className="landing-ambient-bg">
        <div className="ambient-glow glow-1" />
        <div className="ambient-glow glow-2" />
        <div className="ambient-glow glow-3" />
      </div>

      {/* =========================================================================
          1. HERO HEADER: WELCOME TO CAMPUSFIX.AI PORTAL
          ========================================================================= */}
      <section className="landing-hero hero-cinematic-reveal">
        <div className="hero-badge reveal-item" style={{ animationDelay: '100ms' }}>
          <ShieldAlert size={14} className="hero-sparkle" />
          <span>CampusFix.AI Portal</span>
          <span className="hero-badge-sub">Nemotron 3 Ultra</span>
        </div>

        <h1 className="hero-title reveal-item" style={{ animationDelay: '250ms' }}>
          Welcome to <span className="hero-gradient-text">CampusFix.AI Portal</span>
        </h1>

        <p className="hero-subtitle reveal-item" style={{ animationDelay: '400ms', fontSize: '1.15rem', maxWidth: '780px' }}>
          Enterprise Campus IT Operations & Incident Intelligence
        </p>

        <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem', marginTop: '-0.5rem', marginBottom: '2.5rem' }}>
          Select your portal below to sign in or access authorized campus diagnostic services.
        </p>

        {/* =========================================================================
            2. THREE PORTAL CARDS: STUDENT, STAFF, HOST
            ========================================================================= */}
        <div
          className="portal-roles-grid reveal-item"
          style={{
            animationDelay: '550ms',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            width: '100%',
            maxWidth: '1120px',
            margin: '0 auto 3rem',
            textAlign: 'left',
          }}
        >
          {/* Card 1: Student Portal */}
          <div
            className="portal-role-card student-card"
            style={{
              background: 'var(--bg-surface, #18181b)',
              border: '1px solid var(--border-default, #27272a)',
              borderRadius: '20px',
              padding: '2rem 1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                  }}
                >
                  <GraduationCap size={24} />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  Student Portal
                </span>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)', marginBottom: '0.5rem' }}>
                Student Help Desk
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                Instant AI problem diagnosis, ticket tracking, Eduroam/Canvas recovery, and mobile OTP authentication.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Name + Roll Number + OTP sign-in</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Interactive AI diagnostic workbench</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Live ticket status & Tech Bar dispatch</span>
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => handleRoleSignIn('student')}
              style={{
                width: '100%',
                padding: '0.85rem',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                cursor: 'pointer',
              }}
            >
              <LogIn size={16} />
              <span>Student Sign In / Login</span>
            </button>
          </div>

          {/* Card 2: Staff / Technician Hub */}
          <div
            className="portal-role-card staff-card"
            style={{
              background: 'var(--bg-surface, #18181b)',
              border: '1px solid var(--border-default, #27272a)',
              borderRadius: '20px',
              padding: '2rem 1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa',
                  }}
                >
                  <Wrench size={24} />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  Staff Portal
                </span>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)', marginBottom: '0.5rem' }}>
                Staff / Technician Hub
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                Assigned incident queues, telemetry health probes, specialization triage, and Tier-2 engineering escalations.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <CheckCircle2 size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
                  <span>Username + Password + Domain Specialization</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <CheckCircle2 size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
                  <span>Specialization-scoped incident queue</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <CheckCircle2 size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
                  <span>Audit action logging & resolution sign-off</span>
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => handleRoleSignIn('technician')}
              style={{
                width: '100%',
                padding: '0.85rem',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                cursor: 'pointer',
              }}
            >
              <LogIn size={16} />
              <span>Staff Sign In / Login</span>
            </button>
          </div>

          {/* Card 3: Host / Administrator */}
          <div
            className="portal-role-card host-card"
            style={{
              background: 'var(--bg-surface, #18181b)',
              border: '1px solid var(--border-default, #27272a)',
              borderRadius: '20px',
              padding: '2rem 1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24',
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                  }}
                >
                  Host Portal
                </span>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)', marginBottom: '0.5rem' }}>
                Host Operations Hub
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                Executive IT governance, SLA audit reports, technician workload allocation, and campus satellite telemetry.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <CheckCircle2 size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                  <span>Executive Host / Admin credentials</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <CheckCircle2 size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                  <span>SLA compliance & capacity analytics</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <CheckCircle2 size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                  <span>Technician roster provisioning & role control</span>
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => handleRoleSignIn('host')}
              style={{
                width: '100%',
                padding: '0.85rem',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                cursor: 'pointer',
              }}
            >
              <LogIn size={16} />
              <span>Host Sign In / Login</span>
            </button>
          </div>
        </div>

        {/* Quick Problem Search / Input Bar */}
        <div className="hero-search-wrapper reveal-item" style={{ animationDelay: '700ms' }}>
          <form className="hero-search-form" onSubmit={handleSearchSubmit}>
            <div className="search-icon-wrap">
              <Search size={18} />
            </div>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Describe your IT issue (e.g. 'Eduroam password loop' or 'Duo push not working')..."
              value={searchProblem}
              onChange={(e) => setSearchProblem(e.target.value)}
            />
            <div className="hero-search-actions">
              <button
                type="submit"
                className="hero-btn-primary"
              >
                <span>Start Diagnosis</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>

          {/* 3 Clear Universal Example Chips */}
          <div className="hero-popular-chips">
            <span className="chips-label">Popular topics:</span>
            <div className="chips-list">
              {POPULAR_ISSUES.map((issue) => {
                const IconComponent = issue.icon;
                return (
                  <button
                    key={issue.label}
                    className="popular-chip-btn"
                    onClick={() => onOpenChatModal(issue.query)}
                  >
                    <IconComponent size={13} />
                    <span>{issue.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Primary & Secondary Action Buttons */}
        <div className="hero-actions-row reveal-item" style={{ animationDelay: '850ms' }}>
          <button
            className="btn-hero-cta"
            onClick={() => onOpenChatModal()}
          >
            <Sparkles size={16} />
            <span>Start AI Diagnosis</span>
          </button>

          <button
            className="btn-hero-secondary"
            onClick={() => setIsTrackModalOpen(true)}
          >
            <TicketIcon size={16} />
            <span>Track Incident Ticket</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          3. LIVE AI RESOLUTION TELEMETRY STATS
          ========================================================================= */}
      <section className="landing-stats-section reveal-item" style={{ animationDelay: '950ms' }}>
        <div className="stat-card">
          <div className="stat-value-row">
            <span className="stat-number">{statResolutionRate}%</span>
            <Zap size={18} style={{ color: 'var(--primary-600)' }} />
          </div>
          <span className="stat-label">AI Diagnostic Accuracy</span>
          <span className="stat-desc">Root causes identified autonomously</span>
        </div>

        <div className="stat-card">
          <div className="stat-value-row">
            <span className="stat-number">&lt; {statAvgTime}m</span>
            <Clock size={18} style={{ color: 'var(--success-600)' }} />
          </div>
          <span className="stat-label">Average Resolution Time</span>
          <span className="stat-desc">From symptom input to verified fix</span>
        </div>

        <div className="stat-card">
          <div className="stat-value-row">
            <span className="stat-number">{statUptime}%</span>
            <ShieldCheck size={18} style={{ color: 'var(--info-600)' }} />
          </div>
          <span className="stat-label">Core IT Uptime</span>
          <span className="stat-desc">Continuous telemetry across campus</span>
        </div>
      </section>

      {/* =========================================================================
          4. LIVE CAMPUS SERVICE STATUS SNAPSHOT
          ========================================================================= */}
      <section className="campus-status-snapshot-section">
        <div className="snapshot-card">
          <div className="snapshot-header">
            <div>
              <div className="section-badge" style={{ marginBottom: '0.35rem' }}>
                <span className="status-live-dot" />
                <span>Live Campus Infrastructure</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Campus IT Service Health</h3>
            </div>
            <button
              className="btn-secondary-sm"
              onClick={() => onNavigateTab('status')}
            >
              <span>View Full Status Panel</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="snapshot-grid">
            {STATUS_PREVIEW.map((item) => {
              const IconComp = item.icon;
              return (
                <div key={item.name} className="snapshot-item">
                  <div className="snapshot-icon-wrap">
                    <IconComp size={16} />
                  </div>
                  <div className="snapshot-item-text">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span className="snapshot-name">{item.name}</span>
                      <span className="status-tag status-resolved" style={{ fontSize: '0.6875rem', padding: '0.15rem 0.45rem' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success-500)' }} />
                        {item.status}
                      </span>
                    </div>
                    <span className="snapshot-desc">{item.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ticket Tracking Modal */}
      {isTrackModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsTrackModalOpen(false)}>
          <div className="modal-card modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <TicketIcon size={18} style={{ color: 'var(--primary-600)' }} />
                <h3>Track Campus Incident Status</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsTrackModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleTrackTicket}>
                <div className="form-group">
                  <label className="form-label">Ticket ID / Incident Number</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. INC-2026-4821"
                      value={trackTicketNumber}
                      onChange={(e) => setTrackTicketNumber(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="btn-primary" disabled={!trackTicketNumber.trim()}>
                      Search
                    </button>
                  </div>
                </div>
              </form>

              {trackedTicket && trackedTicket !== 'not_found' && (
                <div className="tracked-ticket-result" style={{ marginTop: '1rem', background: 'var(--bg-surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="ticket-badge-mono">{trackedTicket.ticket_number}</span>
                    <span className={`status-tag status-${trackedTicket.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {trackedTicket.status}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{trackedTicket.title}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.35rem 0' }}>
                    Category: {trackedTicket.category} • Priority: {trackedTicket.priority}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Diagnostic Stage: {trackedTicket.diagnostic_stage} ({trackedTicket.diagnostic_progress}%)
                  </p>
                </div>
              )}

              {trackedTicket === 'not_found' && (
                <div className="chat-error-banner" style={{ marginTop: '1rem' }}>
                  <span>No ticket found with ID &quot;{trackTicketNumber}&quot;. Please check the number and try again.</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsTrackModalOpen(false)}>
                Close
              </button>
              {trackedTicket && trackedTicket !== 'not_found' && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    setIsTrackModalOpen(false);
                    onNavigateTab('tickets');
                  }}
                >
                  View on Ticket Board
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
