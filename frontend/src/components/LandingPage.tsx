import { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Search,
  Zap,
  BookOpen,
  Ticket as TicketIcon,
  Wifi,
  KeyRound,
  Laptop,
  Radio,
  Clock,
  ShieldCheck,
  ChevronRight,
  Cpu,
  Layers,
  ArrowUpRight,
  Printer,
} from 'lucide-react';
import { Ticket } from '../types/chat';

interface LandingPageProps {
  onStartDiagnosis: (initialProblem?: string) => void;
  onNavigateTab: (tab: 'resolver' | 'history' | 'tickets' | 'status' | 'kb' | 'diagnostics' | 'admin' | 'reports') => void;
  tickets: Ticket[];
  onOpenChatModal: (initialProblem?: string) => void;
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

// 3-Step "How It Works" Flow
const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Describe the Symptom',
    description: 'Enter your issue in plain language or attach a screenshot. No technical jargon required.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Autonomous Diagnosis',
    description: 'NVIDIA Nemotron 3 Ultra analyzes device configuration, SSO logs, and campus network telemetry.',
    icon: Cpu,
  },
  {
    step: '03',
    title: 'Verified Fix or Escalation',
    description: 'Receive verified step-by-step instructions or an instant ticket routing directly to the campus Tech Bar.',
    icon: ShieldCheck,
  },
];

// Key Capabilities
const FEATURES = [
  {
    id: 'ai-diagnosis',
    icon: Sparkles,
    title: 'AI Problem Diagnosis',
    description: 'Conversational troubleshooting powered by NVIDIA Nemotron 3 Ultra to isolate root causes in seconds.',
    tab: 'resolver' as const,
  },
  {
    id: 'incident-tracking',
    icon: TicketIcon,
    title: 'Incident Tracking & Kanban',
    description: 'Live Kanban boards and automated audit logs with seamless escalation to in-person campus Tech Bars.',
    tab: 'tickets' as const,
  },
  {
    id: 'service-status',
    icon: Radio,
    title: 'Campus Service Status',
    description: 'Real-time telemetry and student-friendly status for Wi-Fi, Canvas LMS, printing, and authentication.',
    tab: 'status' as const,
  },
  {
    id: 'help-center',
    icon: BookOpen,
    title: 'Smart Help Center',
    description: 'Instant search across step-by-step guides for Eduroam setup, MFA recovery, and campus printing.',
    tab: 'kb' as const,
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

  const handleTrackTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackTicketNumber.trim().toUpperCase();
    if (!query) return;

    const found = tickets.find(
      (t) => t.ticket_number.toUpperCase() === query || t.id.toUpperCase() === query
    );
    setTrackedTicket(found || 'not_found');
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
          1. HERO SECTION
          ========================================================================= */}
      <section className="landing-hero hero-cinematic-reveal">
        <div className="hero-badge reveal-item" style={{ animationDelay: '100ms' }}>
          <Sparkles size={14} className="hero-sparkle" />
          <span>AI-Powered University Help Desk</span>
          <span className="hero-badge-sub">Nemotron 3 Ultra</span>
        </div>

        <h1 className="hero-title reveal-item" style={{ animationDelay: '250ms' }}>
          Resolve campus IT issues <span className="hero-gradient-text">faster.</span>
        </h1>

        <p className="hero-subtitle reveal-item" style={{ animationDelay: '400ms' }}>
          CampusFix AI diagnoses common technology problems and helps students get them resolved with step-by-step guidance.
        </p>

        {/* Large Problem Search / Input Bar */}
        <div className="hero-search-wrapper reveal-item" style={{ animationDelay: '550ms' }}>
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
        <div className="hero-actions-row reveal-item" style={{ animationDelay: '700ms' }}>
          <button
            className="btn-hero-cta"
            onClick={() => onOpenChatModal()}
          >
            <Sparkles size={16} />
            <span>Start Diagnosis</span>
          </button>

          <button
            className="btn-hero-secondary"
            onClick={() => setIsTrackModalOpen(true)}
          >
            <TicketIcon size={16} />
            <span>Track Ticket</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          2. LIVE AI RESOLUTION TELEMETRY STATS
          ========================================================================= */}
      <section className="landing-stats-section reveal-item" style={{ animationDelay: '850ms' }}>
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
          3. HOW IT WORKS (3-Step Continuous Flow)
          ========================================================================= */}
      <section className="how-it-works-section">
        <div className="section-header-center">
          <div className="section-badge">
            <Layers size={13} />
            <span>Intelligent Resolution Workflow</span>
          </div>
          <h2 className="section-title">How CampusFix Works</h2>
          <p className="section-subtitle">From plain-language symptom intake to verified resolution in three simple steps</p>
        </div>

        <div className="workflow-steps-grid">
          {HOW_IT_WORKS_STEPS.map((st) => {
            const IconComp = st.icon;
            return (
              <div key={st.step} className="workflow-step-card">
                <div className="step-number-tag">{st.step}</div>
                <div className="step-icon-box">
                  <IconComp size={20} />
                </div>
                <h3 className="step-title">{st.title}</h3>
                <p className="step-desc">{st.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          4. KEY CAPABILITIES
          ========================================================================= */}
      <section className="landing-features-section">
        <div className="section-header-center">
          <h2 className="section-title">Built for University Computing</h2>
          <p className="section-subtitle">Everything you need to troubleshoot, resolve, and escalate IT incidents</p>
        </div>

        <div className="features-grid">
          {FEATURES.map((feat) => {
            const IconComp = feat.icon;
            return (
              <div
                key={feat.id}
                className="feature-card"
                onClick={() => {
                  if (feat.id === 'ai-diagnosis') {
                    onOpenChatModal();
                  } else {
                    onNavigateTab(feat.tab);
                  }
                }}
              >
                <div className="feature-icon-box">
                  <IconComp size={22} />
                </div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.description}</p>
                <span className="feature-link">
                  <span>Explore</span>
                  <ChevronRight size={14} />
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          5. LIVE CAMPUS SERVICE STATUS SNAPSHOT
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

      {/* =========================================================================
          6. BOTTOM CALL TO ACTION BANNER
          ========================================================================= */}
      <section className="landing-cta-banner">
        <div className="cta-banner-content">
          <div className="cta-sparkle-icon">
            <Sparkles size={24} />
          </div>
          <h2 className="cta-headline">Ready to fix your campus tech issue?</h2>
          <p className="cta-subtext">
            Start a diagnostic session with our AI Specialist or check ticket status in seconds.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <button className="btn-hero-cta" onClick={() => onOpenChatModal()}>
              <Sparkles size={16} />
              <span>Start Diagnosis Now</span>
            </button>
            <button className="btn-hero-secondary" onClick={() => onNavigateTab('kb')}>
              <BookOpen size={16} />
              <span>Browse Help Guides</span>
            </button>
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
