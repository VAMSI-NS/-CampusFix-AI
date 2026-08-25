import { useState } from 'react';
import {
  Search,
  Sparkles,
  Ticket as TicketIcon,
  MapPin,
  Radio,
  ArrowRight,
  CheckCircle2,
  Plus,
  Clock,
  Send,
  ShieldCheck,
  RefreshCw,
  User,
  Hash,
} from 'lucide-react';
import { CampusUser, Ticket, TicketCategory, TicketPriority } from '../types/chat';

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

  // Selected ticket for live tracking details in panel
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
    }, 900);
  };

  // Convert AI chat to official complaint ticket
  const handleCreateTicketFromAi = () => {
    const lastUserQuery = aiChatMessages.filter((m) => m.sender === 'student').pop()?.text || 'Student reported campus IT issue';
    setCompTitle(lastUserQuery.slice(0, 60));
    setCompDescription(lastUserQuery);
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
      diagnostic_progress: 10,
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
      await fetch('/api/tickets', {
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
    setSubmittedNotice(`Complaint ${newNum} created successfully! Assigned to Campus IT.`);
    setActiveSection('my_tickets');
    setTrackingTicket(newTicket);

    setTimeout(() => setSubmittedNotice(null), 4500);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
      {/* =========================================================================
          1. STUDENT HEADER & IDENTITY SUMMARY
          ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '20px',
          padding: '1.5rem 2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.3rem',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
            }}
          >
            {currentUser?.avatar_initials || 'ST'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary, #F8FAFC)' }}>
                {currentUser?.name || 'Student Portal'}
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                STUDENT
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.25rem', fontSize: '0.82rem', color: 'var(--text-secondary, #94a3b8)' }}>
              {currentUser?.roll_number && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                  <Hash size={13} style={{ color: '#10b981' }} />
                  <strong>Roll: {currentUser.roll_number}</strong>
                </span>
              )}
              <span>•</span>
              <span>{currentUser?.department || 'Student Computing Services'}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-saas btn-saas-primary"
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => setIsNewComplaintModalOpen(true)}
          >
            <Plus size={16} />
            <span>File New Complaint</span>
          </button>
        </div>
      </div>

      {submittedNotice && (
        <div
          style={{
            padding: '0.85rem 1.2rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            color: '#10b981',
            fontSize: '0.86rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{submittedNotice}</span>
        </div>
      )}

      {/* =========================================================================
          2. CLEAN 3-TAB DASHBOARD NAVIGATION
          ========================================================================= */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-default, #27272a)',
          paddingBottom: '0.75rem',
          marginBottom: '1.75rem',
        }}
      >
        <button
          type="button"
          style={{
            padding: '0.6rem 1.25rem',
            fontSize: '0.86rem',
            fontWeight: 700,
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            background: activeSection === 'ai_desk' ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-surface, #18181b)',
            color: activeSection === 'ai_desk' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setActiveSection('ai_desk')}
        >
          <Sparkles size={16} />
          <span>AI Problem Solver Desk</span>
        </button>

        <button
          type="button"
          style={{
            padding: '0.6rem 1.25rem',
            fontSize: '0.86rem',
            fontWeight: 700,
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            background: activeSection === 'my_tickets' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'var(--bg-surface, #18181b)',
            color: activeSection === 'my_tickets' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setActiveSection('my_tickets')}
        >
          <TicketIcon size={16} />
          <span>My Complaints & Tracer ({displayTickets.length})</span>
        </button>

        <button
          type="button"
          style={{
            padding: '0.6rem 1.25rem',
            fontSize: '0.86rem',
            fontWeight: 700,
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            background: activeSection === 'status_help' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--bg-surface, #18181b)',
            color: activeSection === 'status_help' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setActiveSection('status_help')}
        >
          <Radio size={16} />
          <span>Service Health & Help</span>
        </button>
      </div>

      {/* =========================================================================
          SECTION 1: AI PROBLEM SOLVER DESK (Dedicated AI Workbench for Students)
          ========================================================================= */}
      {activeSection === 'ai_desk' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)', gap: '1.5rem' }}>
          {/* Main AI Chat & Solution Generator */}
          <div
            style={{
              background: 'var(--bg-surface, #18181b)',
              border: '1px solid var(--border-default, #27272a)',
              borderRadius: '18px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              height: '580px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default, #27272a)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary, #F8FAFC)' }}>
                  Interactive AI Problem Diagnostic Assistant
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #71717a)' }}>
                Powered by NVIDIA Nemotron 3 Ultra
              </span>
            </div>

            {/* Chat Message List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.5rem' }}>
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.sender === 'student' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: msg.sender === 'student' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.05)',
                    border: msg.sender === 'student' ? 'none' : '1px solid var(--border-default, #27272a)',
                    color: '#ffffff',
                    padding: '0.85rem 1.1rem',
                    borderRadius: msg.sender === 'student' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: '0.86rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <div>{msg.text}</div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'right', marginTop: '0.35rem' }}>
                    {msg.time}
                  </div>
                </div>
              ))}
              {isAiResponding && (
                <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={14} className="spin-icon" />
                  <span>Diagnosing problem & analyzing Vignan campus telemetry...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-default, #27272a)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="saas-input"
                  style={{
                    flex: 1,
                    background: 'var(--bg-card, #111111)',
                    border: '1px solid var(--border-default, #27272a)',
                    color: '#ffffff',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.88rem',
                  }}
                  placeholder="Describe your issue (e.g. 'Eduroam disconnected in U-Block 304')..."
                  value={aiProblemQuery}
                  onChange={(e) => setAiProblemQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendAiMessage();
                  }}
                />
                <button
                  type="button"
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                  onClick={() => handleSendAiMessage()}
                  disabled={isAiResponding || !aiProblemQuery.trim()}
                >
                  <Send size={15} />
                  <span>Send</span>
                </button>
              </div>

              {/* 1-Click Ticket Conversion Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted, #71717a)' }}>
                  Unable to solve with AI steps?
                </span>
                <button
                  type="button"
                  style={{
                    background: 'rgba(37, 99, 235, 0.15)',
                    border: '1px solid rgba(37, 99, 235, 0.35)',
                    color: '#60a5fa',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  onClick={handleCreateTicketFromAi}
                >
                  <Plus size={14} />
                  <span>Generate Official IT Complaint</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Problem Categories & Self-Help Tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                background: 'var(--bg-surface, #18181b)',
                border: '1px solid var(--border-default, #27272a)',
                borderRadius: '18px',
                padding: '1.25rem',
              }}
            >
              <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary, #F8FAFC)' }}>
                ⚡ Quick Problem Triage
              </h4>
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
                      padding: '0.6rem 0.85rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-default, #27272a)',
                      borderRadius: '10px',
                      color: 'var(--text-secondary, #94a3b8)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onClick={() => handleSendAiMessage(prompt)}
                  >
                    <span>{prompt}</span>
                    <ArrowRight size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '18px',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={18} style={{ color: '#10b981' }} />
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#10b981' }}>
                  Walkup Support Available
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>
                Visit the <strong>NTR Library Ground Floor Tech Bar</strong> for in-person device diagnostics, laptop hardware checks, or photo ID verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: MY COMPLAINTS & TICKET TRACER
          ========================================================================= */}
      {activeSection === 'my_tickets' && (
        <div style={{ display: 'grid', gridTemplateColumns: trackingTicket ? 'minmax(0, 1.3fr) minmax(360px, 1.2fr)' : '1fr', gap: '1.5rem' }}>
          {/* Complaints Table / List */}
          <div
            style={{
              background: 'var(--bg-surface, #18181b)',
              border: '1px solid var(--border-default, #27272a)',
              borderRadius: '18px',
              padding: '1.5rem',
            }}
          >
            {/* Filter Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {(['all', 'active', 'resolved'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: statusFilter === filter ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                      color: statusFilter === filter ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                      textTransform: 'capitalize',
                    }}
                    onClick={() => setStatusFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #71717a)' }} />
                <input
                  type="text"
                  className="saas-input"
                  style={{
                    paddingLeft: '2.2rem',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                    fontSize: '0.78rem',
                    borderRadius: '8px',
                    width: '100%',
                    background: 'var(--bg-card, #111111)',
                    border: '1px solid var(--border-default, #27272a)',
                    color: '#ffffff',
                  }}
                  placeholder="Search complaints..."
                  value={searchTicketQuery}
                  onChange={(e) => setSearchTicketQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Complaints Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredTickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted, #71717a)' }}>
                  <TicketIcon size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>No complaints found matching this filter.</p>
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = trackingTicket?.id === t.id;
                  const isResolved = t.status === 'Resolved';
                  const isEscalated = t.status === 'Escalated';

                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: '1rem 1.25rem',
                        background: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? '1px solid #2563eb' : '1px solid var(--border-default, #27272a)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => setTrackingTicket(t)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                            {t.ticket_number}
                          </span>
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary, #94a3b8)' }}>
                            {t.category}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            background: isResolved
                              ? 'rgba(16, 185, 129, 0.2)'
                              : isEscalated
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                            color: isResolved ? '#10b981' : isEscalated ? '#ef4444' : '#f59e0b',
                          }}
                        >
                          {t.status}
                        </span>
                      </div>

                      <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary, #F8FAFC)' }}>
                        {t.title}
                      </h4>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', fontSize: '0.76rem', color: 'var(--text-muted, #71717a)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={12} />
                          <span>{t.location}</span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={12} />
                          <span>{new Date(t.created_at).toLocaleDateString()}</span>
                        </span>
                        {t.assigned_technician && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#93c5fd' }}>
                            <User size={12} />
                            <span>Assigned: {t.assigned_technician}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Dedicated Live Ticket Tracer Panel */}
          {trackingTicket && (
            <div
              style={{
                background: 'var(--bg-surface, #18181b)',
                border: '1px solid var(--border-default, #27272a)',
                borderRadius: '18px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default, #27272a)', paddingBottom: '0.85rem' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#60a5fa', fontWeight: 700 }}>
                    {trackingTicket.ticket_number}
                  </span>
                  <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #F8FAFC)' }}>
                    {trackingTicket.title}
                  </h3>
                </div>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted, #71717a)', cursor: 'pointer' }}
                  onClick={() => setTrackingTicket(null)}
                >
                  ✕
                </button>
              </div>

              {/* Resolution Banner (if Resolved) */}
              {trackingTicket.status === 'Resolved' && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    color: '#10b981',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.84rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Resolved by Campus IT Technician</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: '#e2e8f0' }}>
                    {trackingTicket.resolution_details || 'The reported issue was remediated and confirmed functional.'}
                  </p>
                </div>
              )}

              {/* Diagnostic Progress Stepper */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.4rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <span>Diagnostic Progress: <strong>{trackingTicket.diagnostic_stage}</strong></span>
                  <span>{trackingTicket.diagnostic_progress}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${trackingTicket.diagnostic_progress}%`,
                      height: '100%',
                      background: trackingTicket.status === 'Resolved' ? '#10b981' : '#2563eb',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Action Log History */}
              <div>
                <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase' }}>
                  Timeline & Diagnostic Log
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {trackingTicket.actions_taken && trackingTicket.actions_taken.length > 0 ? (
                    trackingTicket.actions_taken.map((act) => (
                      <div
                        key={act.id}
                        style={{
                          padding: '0.6rem 0.85rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-default, #27272a)',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted, #71717a)', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 700, color: '#93c5fd' }}>{act.actor.toUpperCase()}</span>
                          <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ color: '#ffffff', fontWeight: 600 }}>{act.action}</div>
                        {act.result && <div style={{ color: 'var(--text-secondary, #94a3b8)', marginTop: '0.15rem' }}>{act.result}</div>}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #71717a)' }}>No timeline entries yet.</div>
                  )}
                </div>
              </div>

              {/* Permission Note */}
              <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--text-muted, #71717a)' }}>
                🔒 <em>Only authorized technicians and hosts can mark tickets as resolved.</em>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 3: SERVICE HEALTH & KNOWLEDGE BASE
          ========================================================================= */}
      {activeSection === 'status_help' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Service Status */}
          <div
            style={{
              background: 'var(--bg-surface, #18181b)',
              border: '1px solid var(--border-default, #27272a)',
              borderRadius: '18px',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #F8FAFC)' }}>
              Campus IT Service Status
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
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-default, #27272a)',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>{svc.name}</span>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 700 }}>
                    {svc.status} ({svc.uptime})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick IT Guides */}
          <div
            style={{
              background: 'var(--bg-surface, #18181b)',
              border: '1px solid var(--border-default, #27272a)',
              borderRadius: '18px',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #F8FAFC)' }}>
              Step-by-Step Setup Guides
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
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-default, #27272a)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onClick={() => onNavigateToTab?.('kb')}
                >
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                      {guide.title}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #71717a)' }}>{guide.category}</span>
                  </div>
                  <ArrowRight size={14} style={{ color: '#60a5fa' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FILE NEW COMPLAINT FORM
          ========================================================================= */}
      {isNewComplaintModalOpen && (
        <div className="modal-backdrop-saas" onClick={() => setIsNewComplaintModalOpen(false)}>
          <div
            className="modal-dialog-saas"
            style={{
              maxWidth: '560px',
              background: 'var(--bg-card, #18181b)',
              border: '1px solid var(--border-default, #27272a)',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  Submit IT Complaint
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  Report a problem directly to campus technicians.
                </p>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
                onClick={() => setIsNewComplaintModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                  Incident Title / Short Summary
                </label>
                <input
                  type="text"
                  className="saas-input"
                  style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem', background: '#111111', border: '1px solid #27272a', color: '#ffffff' }}
                  placeholder="e.g. Wi-Fi disconnected during exam in U-Block"
                  value={compTitle}
                  onChange={(e) => setCompTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    className="saas-input"
                    style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem', background: '#111111', border: '1px solid #27272a', color: '#ffffff' }}
                    value={compCategory}
                    onChange={(e) => setCompCategory(e.target.value as TicketCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                    Priority / Urgency
                  </label>
                  <select
                    className="saas-input"
                    style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem', background: '#111111', border: '1px solid #27272a', color: '#ffffff' }}
                    value={compPriority}
                    onChange={(e) => setCompPriority(e.target.value as TicketPriority)}
                  >
                    <option value="Low">Low (General Inquiry)</option>
                    <option value="Medium">Medium (Standard)</option>
                    <option value="High">High (Impacting Class / Exam)</option>
                    <option value="Urgent">Urgent (Emergency)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                  Campus Location
                </label>
                <select
                  className="saas-input"
                  style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem', background: '#111111', border: '1px solid #27272a', color: '#ffffff' }}
                  value={compLocation}
                  onChange={(e) => setCompLocation(e.target.value)}
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  className="saas-input"
                  style={{ width: '100%', borderRadius: '10px', padding: '0.65rem 0.85rem', background: '#111111', border: '1px solid #27272a', color: '#ffffff' }}
                  placeholder="Describe what error you encountered and what device you are using..."
                  value={compDescription}
                  onChange={(e) => setCompDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', background: 'transparent', border: '1px solid #27272a', color: '#94a3b8', cursor: 'pointer' }}
                  onClick={() => setIsNewComplaintModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                  disabled={isSubmittingComp}
                >
                  {isSubmittingComp ? <RefreshCw size={14} className="spin-icon" /> : <Plus size={14} />}
                  <span>Submit Complaint</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
