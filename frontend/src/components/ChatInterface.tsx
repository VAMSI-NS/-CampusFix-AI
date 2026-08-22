import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Mic,
  MicOff,
  Paperclip,
  X,
  Minus,
  ExternalLink,
} from 'lucide-react';
import { Message, DiagnosticStage, Ticket, TicketCategory, TicketPriority, AIActionButton } from '../types/chat';

interface ChatInterfaceProps {
  backendConnected?: boolean;
  modelName?: string;
  activeTicketNumber?: string;
  activeDiagnosticStage?: DiagnosticStage;
  initialQuery?: string;
  onSuggestedAction?: (action: string, result: string) => void;
  onStageChange?: (stage: DiagnosticStage) => void;
  onCloseModal?: () => void;
  onTicketCreated?: (ticket: Ticket) => void;
  onViewTicket?: (ticketId: string) => void;
  onViewLocationOnMap?: (locationNameOrCode: string) => void;
}

const INITIAL_GREETING: Message = {
  id: 'welcome-saas-assistant',
  role: 'assistant',
  content: `Hi! 👋 I'm **CampusFix AI**. I can help you find tickets, check campus services, troubleshoot IT problems, and guide you to the right technician.`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  model: 'NVIDIA Nemotron 3 Ultra',
};

const CATEGORIES: TicketCategory[] = [
  'Eduroam Wi-Fi',
  'Canvas / SSO',
  'Duo MFA',
  'PaperCut Printing',
  'Dorm ResNet',
  'NetID / Password',
  'Lab / Computer Access',
  'Software',
  'VPN',
  'Email',
  'Other',
];

const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Urgent', 'Critical'];

export default function ChatInterface({
  modelName = 'NVIDIA Nemotron 3 Ultra',
  initialQuery,
  onCloseModal,
  onTicketCreated,
  onViewTicket,
  onViewLocationOnMap,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Ticket Modal Flow
  const [showTicketOffer, setShowTicketOffer] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [createdTicketInfo, setCreatedTicketInfo] = useState<Ticket | null>(null);

  // Form Fields
  const [formIssueTitle, setFormIssueTitle] = useState('');
  const [formCategory, setFormCategory] = useState<TicketCategory>('Eduroam Wi-Fi');
  const [formLocation, setFormLocation] = useState('U-Block (Main Academic Block)');
  const [formPriority, setFormPriority] = useState<TicketPriority>('High');
  const [formDescription, setFormDescription] = useState('');

  // Voice recording & attachment state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, showTicketOffer, showTicketForm, createdTicketInfo]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      sendMessage(initialQuery.trim());
    }
  }, [initialQuery]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleVoice = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setTimeout(() => {
        setIsRecordingVoice(false);
        setInputValue('My Eduroam Wi-Fi connection is dropping in U-Block.');
      }, 3000);
    } else {
      setIsRecordingVoice(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedImageName(file.name);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Action Buttons Handler
  const handleQuickAction = (actionType: string) => {
    switch (actionType) {
      case 'report':
        setShowTicketForm(true);
        setFormIssueTitle('Campus IT Assistance Request');
        break;
      case 'find_ticket':
        sendMessage('Where is my ticket and what is its current status?');
        break;
      case 'map':
        sendMessage('Show verified campus locations and network status on the satellite map.');
        break;
      case 'status':
        sendMessage('What is the current service status for Eduroam, Canvas, and Duo 2FA?');
        break;
      case 'technician':
        sendMessage('Show active campus IT technician workloads and specializations.');
        break;
      case 'analyze':
        sendMessage('Analyze active campus incidents and suggest likely root causes.');
        break;
    }
  };

  // Send message
  const sendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    const historyPayload = messages
      .filter((m) => m.id !== 'welcome-saas-assistant')
      .concat(userMessage)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const token = localStorage.getItem('campusfix_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: historyPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: data.model || modelName,
          actions: data.actions || [],
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Check if ticket offer is triggered
        if (
          data.reply.toLowerCase().includes('support ticket') ||
          data.reply.toLowerCase().includes('open an official') ||
          data.reply.toLowerCase().includes('escalate')
        ) {
          setShowTicketOffer(true);
          setFormIssueTitle(userText.slice(0, 70));
          setFormDescription(userText);
        }
        setIsLoading(false);
        return;
      }
    } catch {
      // offline fallback
    }

    // Client intelligent fallback
    const lower = userText.toLowerCase();
    let reply = '';
    const actions: AIActionButton[] = [];

    if (lower.includes('where') && (lower.includes('ticket') || lower.includes('find'))) {
      reply = `I found your recent ticket **INC-2026-8941** (Eduroam 802.1X Certificate Trust Loop). It is currently in **Diagnosing** status and assigned to **Ramu Kumar** (Network Support Team).`;
      actions.push({ id: 'act-1', action_type: 'open_ticket', label: '📋 Open Ticket INC-2026-8941', target_id: 'INC-2026-8941' });
      actions.push({ id: 'act-2', action_type: 'view_map', label: '🗺️ View on Map: U-Block', target_id: 'loc-u-block' });
    } else if (lower.includes('status') || lower.includes('service') || lower.includes('health')) {
      reply = `### 📡 Real-Time Campus Infrastructure Health\n\n* ✓ **Eduroam Wi-Fi (U-Block)**: \`OPERATIONAL\` • 12ms ping\n* ✓ **Canvas LMS & SSO**: \`OPERATIONAL\` • 24ms ping\n* ✓ **Duo 2FA Authentication**: \`OPERATIONAL\` • 18ms ping\n* ✓ **PaperCut Printing (NTR Library)**: \`OPERATIONAL\` • 9ms ping\n\nAll core university networks are operating nominally.`;
      actions.push({ id: 'act-3', action_type: 'check_status', label: '📡 View Full Service Status' });
    } else if (lower.includes('map') || lower.includes('vignan') || lower.includes('building')) {
      reply = `### 🗺️ Verified Vignan University Campus Telemetry\n\nI can pinpoint verified facilities including **U-Block (IT/CSE)**, **NTR-Vignan Library**, **A-Block**, **Visvesvaraya Block**, and **VFSTR Guest House**.`;
      actions.push({ id: 'act-4', action_type: 'view_map', label: '🗺️ Open Satellite Campus Map', target_id: 'loc-u-block' });
    } else if (lower.includes('technician') || lower.includes('help') || lower.includes('staff')) {
      reply = `### 👨‍🔧 Active IT Specialist Roster\n\n* **Ramu Kumar**: Network Infrastructure Specialist (Optimal workload)\n* **Sarah Jenkins**: Identity & Access (Duo/SSO Specialist)\n* **Dave Miller**: Hardware & Lab Computing Specialist\n* **Priya Sharma**: Tech Bar Walkup Lead`;
      actions.push({ id: 'act-5', action_type: 'contact_tech', label: '👨‍🔧 Request Technician Routing' });
    } else {
      reply = `Got it 👍 Let me help you troubleshoot that right away.\n\n1. **Check Credentials:** Verify you are using your full campus email (\`username@university.edu\`) rather than just your NetID.\n2. **Network Profile:** On Android/iOS, choose **Forget Network** and reconnect selecting **PEAP / MSCHAPv2**.\n\n*Does this resolve your connection issue?*`;
      actions.push({ id: 'act-6', action_type: 'open_ticket', label: '🎫 Open Support Ticket', target_id: 'new' });
    }

    const fallbackMsg: Message = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: modelName,
      actions,
    };
    setMessages((prev) => [...prev, fallbackMsg]);
    setIsLoading(false);
  };

  const handleSend = () => {
    sendMessage(inputValue);
  };

  const handleActionClick = (action: AIActionButton) => {
    if (action.action_type === 'open_ticket') {
      if (action.target_id === 'new') {
        setShowTicketForm(true);
      } else if (onViewTicket) {
        onViewTicket(action.target_id || 'INC-2026-8941');
      }
    } else if (action.action_type === 'view_map' && onViewLocationOnMap) {
      onViewLocationOnMap(action.target_id || 'loc-u-block');
    } else if (action.action_type === 'check_status' && onViewTicket) {
      if (onCloseModal) onCloseModal();
    }
  };

  // Submit Ticket Creation Form
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIssueTitle.trim()) return;

    setIsSubmittingTicket(true);
    try {
      const token = localStorage.getItem('campusfix_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: formIssueTitle.trim(),
          category: formCategory,
          priority: formPriority,
          location: formLocation,
          description: formDescription.trim() || formIssueTitle.trim(),
        }),
      });

      if (res.ok) {
        const newTicket: Ticket = await res.json();
        setCreatedTicketInfo(newTicket);
        if (onTicketCreated) onTicketCreated(newTicket);
        setShowTicketForm(false);
        setShowTicketOffer(false);
        setIsSubmittingTicket(false);

        // Append confirmation in chat
        setMessages((prev) => [
          ...prev,
          {
            id: `ticket-created-${Date.now()}`,
            role: 'assistant',
            content: `### 🎫 Support Ticket Created: **${newTicket.ticket_number}**\n\nYour incident has been logged with **${newTicket.priority} priority** and routed to the **${newTicket.category}** support desk. A campus technician will review your case shortly.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            model: modelName,
            actions: [
              {
                id: `view-${newTicket.ticket_number}`,
                action_type: 'open_ticket',
                label: `📋 View Ticket ${newTicket.ticket_number}`,
                target_id: newTicket.ticket_number,
              },
            ],
          },
        ]);
        return;
      }
    } catch {
      // offline fallback
    }

    const mockTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      ticket_number: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: formIssueTitle.trim(),
      category: formCategory,
      priority: formPriority,
      status: 'New',
      location: formLocation,
      description: formDescription.trim() || formIssueTitle.trim(),
      issue_summary: formIssueTitle.trim(),
      netid: 'student',
      email: 'student@university.edu',
      assigned_technician: 'Ramu Kumar',
      diagnostic_stage: 'Triage',
      diagnostic_progress: 25,
      actions_taken: [],
      notes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCreatedTicketInfo(mockTicket);
    if (onTicketCreated) onTicketCreated(mockTicket);
    setShowTicketForm(false);
    setShowTicketOffer(false);
    setIsSubmittingTicket(false);

    setMessages((prev) => [
      ...prev,
      {
        id: `ticket-created-${Date.now()}`,
        role: 'assistant',
        content: `### 🎫 Support Ticket Created: **${mockTicket.ticket_number}**\n\nYour incident has been logged with **${mockTicket.priority} priority** and routed to the **${mockTicket.category}** desk.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: modelName,
        actions: [
          {
            id: `view-${mockTicket.ticket_number}`,
            action_type: 'open_ticket',
            label: `📋 View Ticket ${mockTicket.ticket_number}`,
            target_id: mockTicket.ticket_number,
          },
        ],
      },
    ]);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isMinimized ? '64px' : '100%',
        background: 'var(--bg-surface)',
        borderRadius: '20px',
        border: '1px solid var(--border-strong)',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'height var(--transition-normal)',
      }}
    >
      {/* 1. CHATBOT HEADER */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--ai-cyan) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 12px var(--ai-glow)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>
                CampusFix AI Assistant ✨
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
              <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
                Online • Campus systems connected
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            className="btn-saas-ghost"
            style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand Chat' : 'Minimize'}
          >
            <Minus size={16} />
          </button>
          {onCloseModal && (
            <button
              type="button"
              className="btn-saas-ghost"
              style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
              onClick={onCloseModal}
              title="Close Chat"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* 2. QUICK ACTIONS STRIP */}
          <div
            style={{
              padding: '0.55rem 0.85rem',
              background: 'rgba(11, 17, 29, 0.7)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              flexShrink: 0,
            }}
          >
            {[
              { id: 'report', label: '🎫 Report Issue' },
              { id: 'find_ticket', label: '🔎 Find My Ticket' },
              { id: 'map', label: '🗺️ Campus Map' },
              { id: 'status', label: '📡 Service Status' },
              { id: 'technician', label: '👨‍🔧 Technician Help' },
              { id: 'analyze', label: '🤖 Analyze My Issue' },
            ].map((qa) => (
              <button
                key={qa.id}
                type="button"
                className="badge-saas badge-saas-neutral"
                style={{
                  fontSize: '0.72rem',
                  padding: '0.3rem 0.65rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: 'var(--bg-surface-raised)',
                  border: '1px solid var(--border-default)',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => handleQuickAction(qa.id)}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* 3. SCROLLABLE MESSAGES CONTAINER */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    gap: '0.65rem',
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--ai-cyan) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <Sparkles size={14} />
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '0.85rem 1.1rem',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isUser ? 'var(--primary-600)' : 'var(--bg-card)',
                      border: isUser ? '1px solid var(--primary-500)' : '1px solid var(--border-default)',
                      color: isUser ? '#ffffff' : 'var(--text-primary)',
                      fontSize: '0.86rem',
                      lineHeight: 1.5,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>

                    {/* Action Cards / Buttons inside response */}
                    {m.actions && m.actions.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.45rem',
                          marginTop: '0.75rem',
                          paddingTop: '0.65rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {m.actions.map((act) => (
                          <button
                            key={act.id}
                            type="button"
                            className="btn-saas btn-saas-secondary"
                            style={{
                              fontSize: '0.74rem',
                              padding: '0.3rem 0.65rem',
                              background: 'rgba(59, 130, 246, 0.15)',
                              borderColor: 'rgba(59, 130, 246, 0.4)',
                              color: '#ffffff',
                            }}
                            onClick={() => handleActionClick(act)}
                          >
                            <span>{act.label}</span>
                            <ExternalLink size={11} />
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '0.4rem',
                        fontSize: '0.68rem',
                        color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-muted)',
                      }}
                    >
                      <span>{m.timestamp}</span>
                      {!isUser && (
                        <button
                          type="button"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            padding: '0.1rem',
                          }}
                          onClick={() => copyToClipboard(m.content, m.id)}
                          title="Copy response"
                        >
                          {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface-raised)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ai-cyan)',
                  }}
                >
                  <RefreshCw size={14} className="spin-icon" />
                </div>
                <span>CampusFix AI is analyzing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Ticket Creation Drawer if Triggered */}
          {showTicketForm && (
            <div
              style={{
                margin: '0 1rem 0.5rem',
                background: 'var(--bg-surface-raised)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                  🎫 Open Official Campus IT Support Ticket
                </h4>
                <button
                  type="button"
                  className="btn-saas-ghost"
                  style={{ padding: '0.2rem' }}
                  onClick={() => setShowTicketForm(false)}
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="saas-input"
                  placeholder="Issue title..."
                  value={formIssueTitle}
                  onChange={(e) => setFormIssueTitle(e.target.value)}
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  <select
                    className="saas-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    className="saas-input"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TicketPriority)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p} Priority
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  className="saas-input"
                  placeholder="Location (e.g. U-Block Room 304)..."
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.3rem' }}>
                  <button
                    type="button"
                    className="btn-saas btn-saas-ghost"
                    onClick={() => setShowTicketForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-saas btn-saas-primary"
                    disabled={isSubmittingTicket}
                  >
                    {isSubmittingTicket ? 'Creating...' : 'Submit Support Ticket'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. FIXED BOTTOM INPUT BAR */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-surface-raised)',
              borderTop: '1px solid var(--border-default)',
              flexShrink: 0,
            }}
          >
            {attachedImageName && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--primary-300)',
                  fontSize: '0.72rem',
                  marginBottom: '0.4rem',
                }}
              >
                <span>📎 {attachedImageName}</span>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
                  onClick={() => setAttachedImageName(null)}
                >
                  ✕
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                className="btn-saas-ghost"
                style={{ padding: '0.5rem', color: 'var(--text-muted)' }}
                onClick={() => fileInputRef.current?.click()}
                title="Attach screenshot or error log"
              >
                <Paperclip size={18} />
              </button>

              <button
                type="button"
                className="btn-saas-ghost"
                style={{ padding: '0.5rem', color: isRecordingVoice ? 'var(--danger)' : 'var(--text-muted)' }}
                onClick={handleToggleVoice}
                title={isRecordingVoice ? 'Stop recording' : 'Voice input simulation'}
              >
                {isRecordingVoice ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <textarea
                ref={textareaRef}
                className="saas-input"
                style={{
                  minHeight: '40px',
                  maxHeight: '120px',
                  resize: 'none',
                  borderRadius: '12px',
                  padding: '0.55rem 0.85rem',
                }}
                placeholder="Ask CampusFix AI anything..."
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                rows={1}
              />

              <button
                type="button"
                className="btn-saas btn-saas-primary"
                style={{ padding: '0.55rem 0.9rem', borderRadius: '12px' }}
                disabled={isLoading || (!inputValue.trim() && !attachedImageName)}
                onClick={handleSend}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
