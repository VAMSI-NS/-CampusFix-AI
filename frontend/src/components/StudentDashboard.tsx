import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Ticket as TicketIcon,
  Radio,
  ArrowRight,
  CheckCircle2,
  Plus,
  Send,
  ShieldCheck,
  RefreshCw,
  Hash,
  X,
  Check,
} from 'lucide-react';
import { CampusUser, Ticket, TicketCategory, TicketPriority } from '../types/chat';
import { apiUrl } from '../api';

interface StudentDashboardProps {
  currentUser?: CampusUser | null;
  tickets: Ticket[];
  onStartDiagnosis?: (topic?: string) => void;
  onOpenTicket?: (ticketId: string) => void;
  onNavigateToTab?: (tab: any) => void;
  onNavigateToMap?: (locCode?: string) => void;
  onTicketsUpdated?: (tickets: Ticket[]) => void;
}

const CATEGORIES: TicketCategory[] = [
  'Eduroam Wi-Fi',
  'Canvas / SSO',
  'Duo MFA',
  'PaperCut Printing',
  'Dorm ResNet',
  'NetID / Password',
  'Lab / Computer Access',
  'Other',
];

const LOCATIONS = [
  'Engineering Hall, Room 304',
  'Main Campus Library, 2nd Floor',
  'Vignan Innovation Center',
  'Dormitory Block B, Floor 3',
  'Science Complex, Computer Lab 2',
  'Student Center Tech Bar',
  'Administrative Block',
];

export default function StudentDashboard({
  currentUser,
  tickets,
  onNavigateToTab,
  onTicketsUpdated,
}: StudentDashboardProps) {
  const [activeSection, setActiveSection] = useState<'ai_desk' | 'my_tickets' | 'status_help'>('ai_desk');

  // AI Problem Solving State
  const [aiProblemQuery, setAiProblemQuery] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ sender: 'student' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Hello ${currentUser?.name || 'Student'}! I am CampusFix AI Problem Solver. Describe any IT problem you're experiencing (e.g. Eduroam Wi-Fi dropping, Canvas login timeout, PaperCut printer error), and I will guide you through immediate fixes or generate an official IT complaint ticket.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // New Complaint Form Modal State
  const [isNewComplaintModalOpen, setIsNewComplaintModalOpen] = useState(false);
  const [complaintStep, setComplaintStep] = useState<1 | 2>(1);
  const [compTitle, setCompTitle] = useState('');
  const [compCategory, setCompCategory] = useState<TicketCategory>('Eduroam Wi-Fi');
  const [compPriority, setCompPriority] = useState<TicketPriority>('Medium');
  const [compLocation, setCompLocation] = useState(LOCATIONS[0]);
  const [compDescription, setCompDescription] = useState('');
  const [isSubmittingComp, setIsSubmittingComp] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  // Filter for Student Tickets
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchTicketQuery, setSearchTicketQuery] = useState('');

  // Selected ticket for live tracking details in slide-over drawer
  const [trackingTicket, setTrackingTicket] = useState<Ticket | null>(null);

  // Filter tickets matching this student's account
  const myTickets = tickets.filter((t) => {
    if (!currentUser) return false;
    const cleanU = (currentUser.username || '').toLowerCase();
    const cleanR = (currentUser.roll_number || '').toLowerCase();
    const cleanE = (currentUser.email || '').toLowerCase();

    return (
      (t.netid && (t.netid.toLowerCase() === cleanU || t.netid.toLowerCase() === cleanR)) ||
      (t.email && t.email.toLowerCase() === cleanE)
    );
  });

  const displayTickets = myTickets.length > 0 ? myTickets : tickets;

  const filteredTickets = displayTickets.filter((t) => {
    if (statusFilter === 'active' && t.status === 'Resolved') return false;
    if (statusFilter === 'resolved' && t.status !== 'Resolved') return false;
    if (searchTicketQuery.trim()) {
      const q = searchTicketQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.ticket_number.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeTicketsCount = displayTickets.filter((t) => t.status !== 'Resolved').length;
  const resolvedTicketsCount = displayTickets.filter((t) => t.status === 'Resolved').length;

  // Handle AI Problem Solver submission
  const handleSendAiMessage = (queryToSend?: string) => {
    const text = queryToSend || aiProblemQuery;
    if (!text.trim() || isAiResponding) return;

    const userMsg = {
      sender: 'student' as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiChatMessages((prev) => [...prev, userMsg]);
    setAiProblemQuery('');
    setIsAiResponding(true);

    setTimeout(() => {
      let reply = '';
      const q = text.toLowerCase();
      if (q.includes('wifi') || q.includes('eduroam')) {
        reply = `🔍 **Eduroam Wi-Fi Diagnostic Steps:**\n1. Forget the network 'eduroam' on your device.\n2. Reconnect and select **EAP Method: PEAP** with **Phase 2 Auth: MSCHAPv2**.\n3. Enter CA Certificate Domain: **university.edu**.\n4. Identity: Use your Roll Number (${currentUser?.roll_number || 'e.g. 211FA04001'}).\n\nIf this does not resolve the connection, click **"Generate IT Complaint"** below to dispatch a Network technician.`;
      } else if (q.includes('canvas') || q.includes('sso') || q.includes('login')) {
        reply = `🔑 **Canvas LMS Single Sign-On Guide:**\n1. Open your browser in Private/Incognito mode to clear stale SAML session tokens.\n2. Clear cache & cookies for *campus.vignan.ac.in*.\n3. Verify your 2FA push on Duo Mobile.\n\nStill locked out? Generate an IT complaint for IAM password synchronization.`;
      } else if (q.includes('print') || q.includes('papercut')) {
        reply = `🖨️ **PaperCut Printing Troubleshooting:**\n1. Verify your document is uploaded as standard PDF at *print.campus.vignan.ac.in*.\n2. Swipe student ID card at NTR Library / Lab release terminal.\n3. Ensure account quota is active. Stalled print jobs can be refunded via IT complaint.`;
      } else {
        reply = `🤖 **CampusFix Diagnostic Assessment:**\nI analyzed your query: "${text}".\n\nRecommended Action:\n1. Verify your campus identity credentials.\n2. Check service status tab to ensure cluster health.\n3. You can click **"Create Official Ticket"** below and our assigned technician will remediate the incident.`;
      }

      setAiChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai' as const,
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsAiResponding(false);
    }, 800);
  };

  // Convert AI chat to official complaint ticket
  const handleCreateTicketFromAi = () => {
    const lastUserQuery = aiChatMessages.filter((m) => m.sender === 'student').pop()?.text || 'Student reported campus IT issue';
    setCompTitle(lastUserQuery.slice(0, 60));
    setCompDescription(lastUserQuery);
    setComplaintStep(1);
    setIsNewComplaintModalOpen(true);
  };

  // Handle direct complaint creation
  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compTitle.trim() || !compDescription.trim()) return;

    setIsSubmittingComp(true);
    const newId = `ticket-${Date.now()}`;
    const newNum = `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: Ticket = {
      id: newId,
      ticket_number: newNum,
      title: compTitle.trim(),
      description: compDescription.trim(),
      issue_summary: compTitle.trim(),
      category: compCategory,
      priority: compPriority,
      status: 'New',
      diagnostic_stage: 'Triage',
      diagnostic_progress: 15,
      netid: currentUser?.roll_number || currentUser?.username || 'student',
      email: currentUser?.email || 'student@university.edu',
      location: compLocation,
      device: 'Student Laptop / Mobile',
      assigned_technician: 'Ramu Kumar (Network)',
      notes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      actions_taken: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Complaint registered by student',
          result: 'Awaiting technician assignment and initial diagnosis',
          actor: 'student',
        },
      ],
    };

    try {
      await fetch(apiUrl('/tickets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTicket.title,
          description: newTicket.description,
          category: newTicket.category,
          priority: newTicket.priority,
          netid: newTicket.netid,
          email: newTicket.email,
          location: newTicket.location,
        }),
      });
    } catch {}

    const updatedList = [newTicket, ...tickets];
    if (onTicketsUpdated) {
      onTicketsUpdated(updatedList);
    }

    setIsSubmittingComp(false);
    setIsNewComplaintModalOpen(false);
    setCompTitle('');
    setCompDescription('');
    setComplaintStep(1);
    setSubmittedNotice(`Complaint ${newNum} created successfully! Assigned to Campus IT.`);
    setActiveSection('my_tickets');
    setTrackingTicket(newTicket);

    setTimeout(() => setSubmittedNotice(null), 4500);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 0 3.5rem' }}>
      {/* =========================================================================
          1. SAAS OVERVIEW & HERO SECTION ("What can I do here?")
          ========================================================================= */}
      <div
        className="card-saas"
        style={{
          padding: '1.75rem 2rem',
          marginBottom: '1.75rem',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '1.35rem',
                boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)',
                flexShrink: 0,
              }}
            >
              {currentUser?.avatar_initials || 'ST'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>
                  {currentUser?.name ? `Welcome back, ${currentUser.name}` : 'Student IT Operations Hub'}
                </h1>
                <span className="badge-saas badge-saas-primary">STUDENT PORTAL</span>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Get instant autonomous troubleshooting, report IT disruptions, or track technician progress in real-time.
              </p>
              {currentUser?.roll_number && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                    <Hash size={13} style={{ color: 'var(--primary-500)' }} />
                    <span>Roll: {currentUser.roll_number}</span>
                  </span>
                  <span>•</span>
                  <span>{currentUser?.department || 'Student Computing Services'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Button */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-saas btn-primary"
              style={{ padding: '0.7rem 1.4rem', fontSize: '0.9rem', gap: '0.5rem' }}
              onClick={() => {
                setComplaintStep(1);
                setIsNewComplaintModalOpen(true);
              }}
            >
              <Plus size={17} />
              <span>Report Incident</span>
            </button>
          </div>
        </div>

        {/* 3 Quick SaaS Overview Metric / Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div
            className="card-saas"
            style={{
              padding: '1.1rem 1.25rem',
              cursor: 'pointer',
              background: activeSection === 'ai_desk' ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
              borderLeft: '3px solid var(--ai-500)',
            }}
            onClick={() => setActiveSection('ai_desk')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ai-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Instant AI Diagnosis
              </span>
              <Sparkles size={16} style={{ color: 'var(--ai-500)' }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              AI Problem Solver
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Step-by-step resolution for Wi-Fi, LMS & Duo
            </div>
          </div>

          <div
            className="card-saas"
            style={{
              padding: '1.1rem 1.25rem',
              cursor: 'pointer',
              background: activeSection === 'my_tickets' ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
              borderLeft: '3px solid var(--primary-500)',
            }}
            onClick={() => setActiveSection('my_tickets')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                My Incidents & Tracer
              </span>
              <TicketIcon size={16} style={{ color: 'var(--primary-500)' }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {activeTicketsCount} Active <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>({resolvedTicketsCount} resolved)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Real-time audit log & technician timeline
            </div>
          </div>

          <div
            className="card-saas"
            style={{
              padding: '1.1rem 1.25rem',
              cursor: 'pointer',
              background: activeSection === 'status_help' ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
              borderLeft: '3px solid var(--success-500)',
            }}
            onClick={() => setActiveSection('status_help')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--success-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Campus Telemetry
              </span>
              <Radio size={16} style={{ color: 'var(--success-500)' }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              All Systems Nominal
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              99.9% campus service uptime & self-help
            </div>
          </div>
        </div>
      </div>

      {submittedNotice && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--success-50)',
            border: '1px solid var(--success-500)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success-700)',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <CheckCircle2 size={18} style={{ color: 'var(--success-500)' }} />
          <span>{submittedNotice}</span>
        </div>
      )}

      {/* =========================================================================
          2. DASHBOARD NAVIGATION TABS
          ========================================================================= */}
      <div
        style={{
          display: 'flex',
          gap: '0.45rem',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: '0.65rem',
          marginBottom: '1.75rem',
        }}
      >
        <button
          type="button"
          className={`btn-saas ${activeSection === 'ai_desk' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSection('ai_desk')}
        >
          <Sparkles size={15} />
          <span>AI Problem Solver</span>
        </button>

        <button
          type="button"
          className={`btn-saas ${activeSection === 'my_tickets' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSection('my_tickets')}
        >
          <TicketIcon size={15} />
          <span>My Complaints & Tracer ({displayTickets.length})</span>
        </button>

        <button
          type="button"
          className={`btn-saas ${activeSection === 'status_help' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSection('status_help')}
        >
          <Radio size={15} />
          <span>Campus Status & Guides</span>
        </button>
      </div>

      {/* =========================================================================
          SECTION 1: AI PROBLEM SOLVER DESK
          ========================================================================= */}
      {activeSection === 'ai_desk' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.85fr) minmax(320px, 1fr)', gap: '1.5rem' }}>
          {/* Main AI Chat Container */}
          <div
            className="card-saas"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              height: '620px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--success-500)', boxShadow: '0 0 8px var(--success-500)' }} />
                <div>
                  <span style={{ fontSize: '0.94rem', fontWeight: 800 }}>
                    AI Diagnostic Specialist
                  </span>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Autonomous University IT Triage</div>
                </div>
              </div>
              <span className="badge-saas badge-saas-ai">
                Nemotron 3 Ultra
              </span>
            </div>

            {/* Chat Message List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.95rem', paddingRight: '0.5rem' }}>
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.sender === 'student' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: msg.sender === 'student' ? 'var(--primary-500)' : 'var(--bg-surface-hover)',
                    color: msg.sender === 'student' ? '#FFFFFF' : 'var(--text-primary)',
                    border: msg.sender === 'student' ? 'none' : '1px solid var(--border-default)',
                    padding: '0.85rem 1.15rem',
                    borderRadius: msg.sender === 'student' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: '0.86rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div>{msg.text}</div>
                  <div style={{ fontSize: '0.68rem', color: msg.sender === 'student' ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-muted)', textAlign: 'right', marginTop: '0.35rem' }}>
                    {msg.time}
                  </div>
                </div>
              ))}
              {isAiResponding && (
                <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)', borderRadius: '12px', fontSize: '0.82rem', color: 'var(--primary-500)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={14} className="spin-icon" />
                  <span>Analyzing campus diagnostics & knowledge base telemetry...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="saas-input"
                  placeholder="Describe your issue (e.g. 'Eduroam disconnected in U-Block 304')..."
                  value={aiProblemQuery}
                  onChange={(e) => setAiProblemQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendAiMessage();
                  }}
                />
                <button
                  type="button"
                  className="btn-saas btn-primary"
                  onClick={() => handleSendAiMessage()}
                  disabled={isAiResponding || !aiProblemQuery.trim()}
                >
                  <Send size={15} />
                  <span>Send</span>
                </button>
              </div>

              {/* 1-Click Ticket Conversion */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Need human technician dispatch?
                </span>
                <button
                  type="button"
                  className="btn-saas btn-ghost"
                  style={{ color: 'var(--primary-500)', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                  onClick={handleCreateTicketFromAi}
                >
                  <Plus size={14} />
                  <span>Generate Official IT Complaint</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Problem Triage & Self-Help Tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card-saas" style={{ padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.92rem', fontWeight: 800 }}>
                ⚡ Quick Problem Triage
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  'My Eduroam Wi-Fi keeps disconnecting in U-Block',
                  'Canvas 2FA Duo push is timing out on phone',
                  'PaperCut print job stalled at NTR Library',
                  'Cannot connect to Campus GlobalProtect VPN',
                  'Hostel Dorm ResNet LAN port registration',
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    style={{
                      textAlign: 'left',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-surface-hover)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onClick={() => handleSendAiMessage(prompt)}
                  >
                    <span>{prompt}</span>
                    <ArrowRight size={12} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="card-saas" style={{ padding: '1.25rem', background: 'var(--bg-surface-hover)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={18} style={{ color: 'var(--success-500)' }} />
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Walkup IT Tech Bar
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Visit the <strong>NTR Library Ground Floor Walkup Tech Bar</strong> for in-person hardware diagnostics, physical LAN port testing, or ID credentials reset.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: MY COMPLAINTS & TICKET TRACER
          ========================================================================= */}
      {activeSection === 'my_tickets' && (
        <div className="card-saas" style={{ padding: '1.5rem' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['all', 'active', 'resolved'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`btn-saas ${statusFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', textTransform: 'capitalize' }}
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="saas-input"
                style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.82rem', height: '36px' }}
                placeholder="Search complaints..."
                value={searchTicketQuery}
                onChange={(e) => setSearchTicketQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Complaints Table */}
          {filteredTickets.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-state-icon">
                <TicketIcon size={24} />
              </div>
              <div className="empty-state-title">No complaints found</div>
              <div className="empty-state-desc">
                {statusFilter === 'all'
                  ? "You haven't filed any IT complaints yet. Use the 'Report Incident' button to submit one."
                  : `No complaints found with status '${statusFilter}'.`}
              </div>
            </div>
          ) : (
            <div className="table-saas-wrapper">
              <table className="table-saas">
                <thead>
                  <tr>
                    <th>Incident ID</th>
                    <th>Issue Summary</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Technician</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((t) => (
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setTrackingTicket(t)}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-400)' }}>
                        {t.ticket_number}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {new Date(t.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className="badge-saas badge-saas-secondary">{t.category}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.location}</td>
                      <td>
                        <span
                          className={`badge-saas ${
                            t.priority === 'Critical'
                              ? 'badge-saas-danger'
                              : t.priority === 'High'
                              ? 'badge-saas-warning'
                              : 'badge-saas-primary'
                          }`}
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
                              : 'badge-saas-warning'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {t.assigned_technician || 'Unassigned'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-saas btn-ghost"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', color: 'var(--primary-500)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackingTicket(t);
                          }}
                        >
                          Track Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 3: SERVICE HEALTH & KNOWLEDGE BASE
          ========================================================================= */}
      {activeSection === 'status_help' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Service Status */}
          <div className="card-saas" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 800 }}>
              Campus IT Infrastructure Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { name: 'Eduroam Wi-Fi Network', status: 'Operational', uptime: '99.98%' },
                { name: 'Canvas LMS Single Sign-On', status: 'Operational', uptime: '99.99%' },
                { name: 'Duo Mobile 2FA Authentication', status: 'Operational', uptime: '100%' },
                { name: 'PaperCut WebPrint Spoolers', status: 'Operational', uptime: '99.95%' },
                { name: 'Campus ResNet LAN Ports', status: 'Operational', uptime: '99.90%' },
              ].map((svc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-500)' }} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>{svc.name}</span>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--success-500)', fontWeight: 700 }}>
                    {svc.status} ({svc.uptime})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick IT Guides */}
          <div className="card-saas" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 800 }}>
              Self-Help IT Setup Guides
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { title: 'Connecting to Eduroam on Android / iOS', category: 'Network' },
                { title: 'Configuring Duo Mobile Multi-Factor Authentication', category: 'IAM' },
                { title: 'Printing from Laptop via PaperCut WebPrint', category: 'Hardware' },
                { title: 'Registering Gaming Consoles on ResNet', category: 'Network' },
              ].map((guide, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => onNavigateToTab?.('kb')}
                >
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {guide.title}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{guide.category}</span>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--primary-500)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SLIDE-OVER DRAWER: INTERACTIVE INCIDENT DETAILS
          ========================================================================= */}
      {trackingTicket && (
        <div className="drawer-backdrop" onClick={() => setTrackingTicket(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary-400)' }}>
                    {trackingTicket.ticket_number}
                  </span>
                  <span
                    className={`badge-saas ${
                      trackingTicket.status === 'Resolved'
                        ? 'badge-saas-success'
                        : trackingTicket.status === 'Escalated'
                        ? 'badge-saas-danger'
                        : 'badge-saas-warning'
                    }`}
                  >
                    {trackingTicket.status}
                  </span>
                  <span className="badge-saas badge-saas-secondary">
                    {trackingTicket.priority} Priority
                  </span>
                </div>
                <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.15rem', fontWeight: 800 }}>
                  {trackingTicket.title}
                </h3>
              </div>
              <button
                type="button"
                className="btn-saas btn-ghost"
                style={{ padding: '0.4rem' }}
                onClick={() => setTrackingTicket(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Resolution banner if resolved */}
              {trackingTicket.status === 'Resolved' && (
                <div
                  style={{
                    padding: '0.9rem 1rem',
                    background: 'var(--success-50)',
                    border: '1px solid var(--success-500)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--success-700)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.86rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Remediated & Resolved by Campus IT</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {trackingTicket.resolution_details || 'The reported issue was remediated and confirmed functional.'}
                  </p>
                </div>
              )}

              {/* Lifecycle Diagnostic Progress Stepper */}
              <div className="card-saas" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>
                    Diagnostic Stage: <strong>{trackingTicket.diagnostic_stage}</strong>
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-500)' }}>{trackingTicket.diagnostic_progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface-hover)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${trackingTicket.diagnostic_progress}%`,
                      height: '100%',
                      background: trackingTicket.status === 'Resolved' ? 'var(--success-500)' : 'var(--primary-gradient)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="card-saas" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, marginTop: '0.15rem' }}>{trackingTicket.location}</div>
                </div>
                <div className="card-saas" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Technician</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, marginTop: '0.15rem' }}>
                    {trackingTicket.assigned_technician || 'Pending Assignment'}
                  </div>
                </div>
                <div className="card-saas" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, marginTop: '0.15rem' }}>{trackingTicket.category}</div>
                </div>
                <div className="card-saas" style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reported At</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, marginTop: '0.15rem' }}>
                    {new Date(trackingTicket.created_at).toLocaleDateString()} {new Date(trackingTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              <div className="card-saas" style={{ padding: '1.15rem' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Reported Issue Description
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                  {trackingTicket.description || trackingTicket.issue_summary}
                </div>
              </div>

              {/* Timeline & Actions Taken */}
              <div>
                <h4 style={{ margin: '0 0 0.65rem', fontSize: '0.86rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Audit Trail & Technician Updates
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {trackingTicket.actions_taken && trackingTicket.actions_taken.length > 0 ? (
                    trackingTicket.actions_taken.map((act) => (
                      <div
                        key={act.id}
                        className="card-saas"
                        style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.2rem', fontSize: '0.72rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{act.actor.toUpperCase()}</span>
                          <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.action}</div>
                        {act.result && <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{act.result}</div>}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No audit events logged yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="btn-saas btn-secondary"
                onClick={() => setTrackingTicket(null)}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STRUCTURED MULTI-STEP MODAL: FILE NEW COMPLAINT FORM
          ========================================================================= */}
      {isNewComplaintModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewComplaintModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  Report Campus IT Incident
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Step {complaintStep} of 2 — Structured Incident Intake
                </p>
              </div>
              <button
                type="button"
                className="btn-saas btn-ghost"
                style={{ padding: '0.4rem' }}
                onClick={() => setIsNewComplaintModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="drawer-body">
                {complaintStep === 1 ? (
                  <>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                        Incident Title / Short Synopsis *
                      </label>
                      <input
                        type="text"
                        className="saas-input"
                        placeholder="e.g. Eduroam Wi-Fi disconnected during lecture in U-Block"
                        value={compTitle}
                        onChange={(e) => setCompTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                          Category
                        </label>
                        <select
                          className="saas-input"
                          value={compCategory}
                          onChange={(e) => setCompCategory(e.target.value as TicketCategory)}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                          Priority / Impact
                        </label>
                        <select
                          className="saas-input"
                          value={compPriority}
                          onChange={(e) => setCompPriority(e.target.value as TicketPriority)}
                        >
                          <option value="Low">Low (General Inquiry)</option>
                          <option value="Medium">Medium (Standard)</option>
                          <option value="High">High (Impacting Class/Exam)</option>
                          <option value="Urgent">Urgent (Campus Emergency)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                        Campus Location
                      </label>
                      <select
                        className="saas-input"
                        value={compLocation}
                        onChange={(e) => setCompLocation(e.target.value)}
                      >
                        {LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                        Detailed Problem Description *
                      </label>
                      <textarea
                        rows={5}
                        className="saas-input"
                        placeholder="Describe what error occurred, error codes shown, and device specs (e.g. MacBook Pro macOS 14.2)..."
                        value={compDescription}
                        onChange={(e) => setCompDescription(e.target.value)}
                        required
                      />
                    </div>

                    <div className="card-saas" style={{ padding: '0.95rem', background: 'var(--bg-surface-hover)' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary-500)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                        Summary Confirmation
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <strong>Title:</strong> {compTitle}<br />
                        <strong>Category:</strong> {compCategory} • <strong>Priority:</strong> {compPriority}<br />
                        <strong>Location:</strong> {compLocation}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="drawer-footer">
                {complaintStep === 1 ? (
                  <>
                    <button
                      type="button"
                      className="btn-saas btn-secondary"
                      onClick={() => setIsNewComplaintModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-saas btn-primary"
                      disabled={!compTitle.trim()}
                      onClick={() => setComplaintStep(2)}
                    >
                      <span>Continue to Details</span>
                      <ArrowRight size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-saas btn-secondary"
                      onClick={() => setComplaintStep(1)}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn-saas btn-primary"
                      disabled={isSubmittingComp || !compDescription.trim()}
                    >
                      {isSubmittingComp ? <RefreshCw size={15} className="spin-icon" /> : <Check size={15} />}
                      <span>Submit Incident</span>
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
