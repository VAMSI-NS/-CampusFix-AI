import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Mic,
  MicOff,
  Paperclip,
  Image as ImageIcon,
  X,
  Wifi,
  KeyRound,
  CheckCircle2,
  Wrench,
  Laptop,
  Ticket as TicketIcon,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { Message, ChatApiResponse, DiagnosticStage, Ticket, TicketCategory, TicketPriority } from '../types/chat';

interface ChatInterfaceProps {
  backendConnected: boolean;
  modelName?: string;
  activeTicketNumber?: string;
  activeDiagnosticStage?: DiagnosticStage;
  initialQuery?: string;
  onSuggestedAction?: (action: string, result: string) => void;
  onStageChange?: (stage: DiagnosticStage) => void;
  onCloseModal?: () => void;
  onTicketCreated?: (ticket: Ticket) => void;
  onViewTicket?: (ticketId: string) => void;
}

// 3 Compact Suggestions
const QUICK_SUGGESTIONS = [
  {
    id: 'wifi-problem',
    icon: Wifi,
    label: 'Wi-Fi problem',
    prompt: 'My laptop connects to Eduroam Wi-Fi but has no internet and keeps asking for my password.',
  },
  {
    id: 'login-issue',
    icon: KeyRound,
    label: 'Login issue',
    prompt: 'I got a new phone and cannot complete Duo 2FA push verification to log into my university portal.',
  },
  {
    id: 'software-problem',
    icon: Laptop,
    label: 'Software problem',
    prompt: 'I am unable to submit my assignment on Canvas and the page is throwing an access authorization error.',
  },
];

const INITIAL_GREETING: Message = {
  id: 'welcome-it-specialist',
  role: 'assistant',
  content: `**How can I help you today?**\n\nDescribe your campus IT issue and I'll help diagnose and resolve it.`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  model: 'nvidia/nemotron-3-ultra-550b-a55b',
};

const DIAGNOSTIC_STEPS = [
  { id: 'Diagnosing', label: 'Diagnosing' },
  { id: 'Troubleshooting', label: 'Troubleshooting' },
  { id: 'Resolution', label: 'Resolution' },
];

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
  backendConnected,
  modelName,
  activeTicketNumber,
  activeDiagnosticStage = 'Triage',
  initialQuery,
  onSuggestedAction,
  onStageChange,
  onCloseModal,
  onTicketCreated,
  onViewTicket,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loggedActionId, setLoggedActionId] = useState<string | null>(null);

  // Escalation & Support Ticket Flow State
  const [showTicketOffer, setShowTicketOffer] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [createdTicketInfo, setCreatedTicketInfo] = useState<Ticket | null>(null);

  // Ticket Form Fields
  const [formIssueTitle, setFormIssueTitle] = useState('');
  const [formCategory, setFormCategory] = useState<TicketCategory>('Eduroam Wi-Fi');
  const [formLocation, setFormLocation] = useState('Main Campus / Library');
  const [formPriority, setFormPriority] = useState<TicketPriority>('High');
  const [formDescription, setFormDescription] = useState('');

  // Voice recording & screenshot upload state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
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

  // Handle incoming initial query
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      sendMessage(initialQuery.trim());
    }
  }, [initialQuery]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Voice recording simulation timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRecordingVoice) {
      timer = setInterval(() => {
        setVoiceSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setVoiceSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  const handleToggleVoice = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setTimeout(() => {
        setIsRecordingVoice(false);
        setInputValue('My laptop cannot authenticate to the campus wireless network.');
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

  // Detect category from prompt
  const detectCategoryFromText = (text: string): TicketCategory => {
    const t = text.toLowerCase();
    if (t.includes('wifi') || t.includes('wi-fi') || t.includes('eduroam')) return 'Eduroam Wi-Fi';
    if (t.includes('duo') || t.includes('2fa') || t.includes('mfa')) return 'Duo MFA';
    if (t.includes('canvas') || t.includes('sso') || t.includes('login') || t.includes('portal')) return 'Canvas / SSO';
    if (t.includes('print') || t.includes('papercut')) return 'PaperCut Printing';
    if (t.includes('resnet') || t.includes('dorm')) return 'Dorm ResNet';
    if (t.includes('password') || t.includes('netid')) return 'NetID / Password';
    if (t.includes('lab') || t.includes('workstation')) return 'Lab / Computer Access';
    if (t.includes('vpn')) return 'VPN';
    if (t.includes('email') || t.includes('outlook')) return 'Email';
    return 'Other';
  };

  // Contextual quick chips
  const getContextualChips = () => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant' || messages.length === 1) return [];

    const content = lastMsg.content.toLowerCase();

    if (content.includes('device') || content.includes('operating system') || content.includes('windows or mac')) {
      return [
        { id: 'os-win', label: 'Windows 11', response: 'I am using Windows 11.' },
        { id: 'os-mac', label: 'macOS Sonoma / Sequoia', response: 'I am on macOS.' },
        { id: 'os-ios', label: 'iPhone / iOS', response: 'I am on an iPhone.' },
        { id: 'os-android', label: 'Android Phone', response: 'I am on an Android device.' },
      ];
    }

    if (
      content.includes('did that work') ||
      content.includes('try') ||
      content.includes('verify') ||
      content.includes('reconnect') ||
      content.includes('step') ||
      content.includes('troubleshoot')
    ) {
      return [
        { id: 'res-yes', label: 'Yes, it works now!', response: 'That worked! My issue is resolved now.' },
        {
          id: 'res-no',
          label: 'No, problem is still not fixed',
          response: 'I tried the suggested steps, but the problem is still not fixed.',
        },
        {
          id: 'res-ticket',
          label: 'Create Support Ticket',
          response: 'I would like to create a support ticket for a campus IT technician.',
        },
      ];
    }

    return [];
  };

  const contextualChips = getContextualChips();

  // Trigger Ticket Form
  const handleOpenTicketForm = () => {
    // Derive initial form fields from user messages
    const userMsgs = messages.filter((m) => m.role === 'user');
    const firstUserQuery = userMsgs[0]?.content || 'Campus IT Technical Support Incident';
    const detectedCat = detectCategoryFromText(firstUserQuery);

    setFormIssueTitle(firstUserQuery.replace(/\[Attached File:.*?\]/g, '').trim().slice(0, 70));
    setFormCategory(detectedCat);
    setFormPriority('High');
    setFormLocation('Main Campus / Library');

    const descSummary = userMsgs.map((m) => `- ${m.content}`).join('\n');
    setFormDescription(`Problem Statement:\n${descSummary}\n\nTroubleshooting Attempted: Automated diagnostic steps applied via CampusFix AI specialist, but issue persists.`);

    setShowTicketOffer(false);
    setShowTicketForm(true);
  };

  // Submit Ticket to Backend API
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIssueTitle.trim() || isSubmittingTicket) return;

    setIsSubmittingTicket(true);
    setErrorMessage(null);

    const transcript = messages.map((m) => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n');

    const payload = {
      title: formIssueTitle.trim(),
      category: formCategory,
      priority: formPriority,
      location: formLocation.trim() || 'Campus Help Desk Walkup',
      device: 'Student Laptop / Mobile',
      netid: 'student_user',
      email: 'student@campus.edu',
      description: formDescription.trim() || formIssueTitle.trim(),
      issue_summary: formIssueTitle.trim(),
      chat_transcript: transcript,
    };

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to create ticket: Server returned status ${res.status}`);
      }

      const createdTicket: Ticket = await res.json();
      setCreatedTicketInfo(createdTicket);
      setShowTicketForm(false);

      // Advance stepper to Resolution
      if (onStageChange) onStageChange('Verification');

      // Append confirmation assistant message
      const confirmMessage: Message = {
        id: `assistant-ticket-${Date.now()}`,
        role: 'assistant',
        content: `### ✅ Support Ticket Created: ${createdTicket.ticket_number}\n\nYour incident has been officially logged into the **Campus IT Incident Resolver** queue.\n\n- **Ticket ID:** \`${createdTicket.ticket_number}\`\n- **Category:** ${createdTicket.category}\n- **Priority:** **${createdTicket.priority}**\n- **Location:** ${createdTicket.location}\n- **Status:** **New / Queued for Technician**\n\nA technician will review your diagnostic audit trail. You can track this ticket in real time on the **Ticket Board** or **Incident History**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'campusfix-incident-dispatcher',
      };

      setMessages((prev) => [...prev, confirmMessage]);

      if (onTicketCreated) {
        onTicketCreated(createdTicket);
      }
    } catch (err) {
      console.error('Error submitting support ticket:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create support ticket.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const messageText = textToSend !== undefined ? textToSend : inputValue.trim();
    if ((!messageText && !attachedImageName) || isLoading) return;

    setErrorMessage(null);

    let fullUserContent = messageText;
    if (attachedImageName) {
      fullUserContent += `\n\n[Attached File: ${attachedImageName}]`;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: fullUserContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setAttachedImageName(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Check if user is indicating troubleshooting failed or requesting a ticket
    const lowerInput = messageText.toLowerCase();
    const isUnresolvedTrigger =
      lowerInput.includes('still not fixed') ||
      lowerInput.includes('not fixed') ||
      lowerInput.includes('tried the suggested steps') ||
      lowerInput.includes('did not work') ||
      lowerInput.includes("didn't work") ||
      lowerInput.includes("doesn't work") ||
      lowerInput.includes('same error') ||
      lowerInput.includes('still broken') ||
      lowerInput.includes('still persisting') ||
      lowerInput.includes('create ticket') ||
      lowerInput.includes('support ticket') ||
      lowerInput.includes('escalate');

    // Advance diagnostic stepper
    if (messages.length === 1 && onStageChange) {
      onStageChange('Troubleshooting');
    }

    setIsLoading(true);

    try {
      const historyPayload = updatedMessages
        .filter((msg) => msg.id !== 'welcome-it-specialist')
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          message: messageText || 'Investigating attached technical error screenshot.',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data: ChatApiResponse = await response.json();

      let replyContent = data.reply;

      // If user indicated failure, ensure the AI explicitly offers ticket escalation
      if (isUnresolvedTrigger && !replyContent.toLowerCase().includes('ticket')) {
        replyContent += `\n\n---\n**Troubleshooting Unsuccessful:** Since the suggested steps did not resolve your issue, would you like me to create an official **Campus IT Support Ticket** to escalate this to human technicians?`;
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: data.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If unresolved trigger detected, show ticket offer card
      if (isUnresolvedTrigger) {
        setShowTicketOffer(true);
      }

      if (data.reply.toLowerCase().includes('resolved') || data.reply.toLowerCase().includes('successfully configured')) {
        if (onStageChange) onStageChange('Verification');
      }
    } catch (err) {
      console.error('Failed to get AI response:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to connect to the AI diagnostic service.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_GREETING]);
    setErrorMessage(null);
    setInputValue('');
    setAttachedImageName(null);
    setShowTicketOffer(false);
    setShowTicketForm(false);
    setCreatedTicketInfo(null);
    if (onStageChange) onStageChange('Triage');
  };

  const copyMessageContent = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogAction = (msgId: string, content: string) => {
    if (onSuggestedAction) {
      onSuggestedAction('Applied AI Diagnostic Recommendation', content.slice(0, 140));
      setLoggedActionId(msgId);
      setTimeout(() => setLoggedActionId(null), 2500);
    }
  };

  return (
    <div className="chat-container">
      {/* Top Diagnostic Progress Stepper Strip */}
      <div className="chat-diagnostic-stepper-bar">
        {DIAGNOSTIC_STEPS.map((stg, index) => {
          const isCompleted =
            (activeDiagnosticStage === 'Troubleshooting' && index === 0) ||
            (activeDiagnosticStage === 'Verification' && index <= 1) ||
            (activeDiagnosticStage === 'Completed') ||
            (createdTicketInfo !== null && index <= 2);
          const isActive =
            (activeDiagnosticStage === 'Triage' && index === 0) ||
            (activeDiagnosticStage === 'Environment & Device' && index === 0) ||
            (activeDiagnosticStage === 'Troubleshooting' && index === 1) ||
            (activeDiagnosticStage === 'Verification' && index === 2);

          return (
            <div
              key={stg.id}
              className={`diagnostic-stage-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
            >
              <div className="stage-num">{isCompleted ? '✓' : index + 1}</div>
              <span className="stage-label">{stg.label}</span>
              {index < DIAGNOSTIC_STEPS.length - 1 && <span className="stage-arrow">›</span>}
            </div>
          );
        })}
      </div>

      {/* Header Bar */}
      <div className="chat-header-bar">
        <div className="chat-header-info">
          <div className="specialist-avatar">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="chat-title-wrap">
              <h3>CampusFix AI Assistant</h3>
              <span className="model-chip">
                <span className="model-chip-dot" />
                <span>{modelName || 'Nemotron 3 Ultra'}</span>
              </span>
              {(createdTicketInfo?.ticket_number || activeTicketNumber) && (
                <span className="active-ticket-tag">
                  Incident: {createdTicketInfo?.ticket_number || activeTicketNumber}
                </span>
              )}
            </div>
            <p className="chat-subtitle">
              Automated Problem Triage & Technical Step-by-Step Resolution
            </p>
          </div>
        </div>

        <div className="chat-header-actions">
          <button
            onClick={handleResetChat}
            className="chat-action-btn"
            title="Start new troubleshooting session"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          {onCloseModal && (
            <button
              onClick={onCloseModal}
              className="chat-close-modal-btn"
              title="Close Assistant"
              aria-label="Close Assistant"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="messages-scroll-area">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-row ${message.role === 'user' ? 'user-row' : 'assistant-row'} message-animate`}
          >
            {message.role === 'assistant' && (
              <div className="assistant-msg-avatar">
                <Sparkles size={14} />
              </div>
            )}

            <div className={`message-bubble ${message.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
              <div className="message-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>

              {/* 3 Compact Quick Suggestions on initial empty welcome message */}
              {message.id === 'welcome-it-specialist' && messages.length === 1 && (
                <div className="welcome-compact-suggestions">
                  {QUICK_SUGGESTIONS.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        className="welcome-suggestion-chip"
                        onClick={() => sendMessage(item.prompt)}
                        disabled={isLoading || !backendConnected}
                      >
                        <IconComp size={14} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="message-meta-row">
                <span className="msg-timestamp">
                  <Clock size={11} />
                  <span>{message.timestamp}</span>
                </span>

                {message.role === 'assistant' && message.id !== 'welcome-it-specialist' && (
                  <div className="message-actions-group">
                    <button
                      className="msg-action-btn"
                      onClick={() => copyMessageContent(message.id, message.content)}
                      title="Copy response"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check size={12} className="text-success" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {onSuggestedAction && (
                      <button
                        className="msg-action-btn"
                        onClick={() => handleLogAction(message.id, message.content)}
                        title="Record this diagnostic step into the active ticket audit trail"
                      >
                        {loggedActionId === message.id ? (
                          <>
                            <CheckCircle2 size={12} className="text-success" />
                            <span>Action Logged</span>
                          </>
                        ) : (
                          <>
                            <Wrench size={12} />
                            <span>Log Action</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing / Reasoning Indicator */}
        {isLoading && (
          <div className="message-row assistant-row message-animate">
            <div className="assistant-msg-avatar">
              <Sparkles size={14} />
            </div>
            <div className="message-bubble assistant-bubble typing-bubble">
              <div className="typing-indicator-container">
                <div className="typing-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
                <span className="typing-text">AI is diagnosing your issue...</span>
              </div>
            </div>
          </div>
        )}

        {/* Escalation Offer Card (When troubleshooting did not resolve issue) */}
        {showTicketOffer && !showTicketForm && !createdTicketInfo && (
          <div className="escalation-offer-card message-animate">
            <div className="offer-header">
              <ShieldAlert size={20} style={{ color: 'var(--warning-600)' }} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Troubleshooting Unsuccessful</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Would you like me to create an official IT support ticket for campus technicians?
                </p>
              </div>
            </div>

            <div className="offer-actions">
              <button
                className="btn-primary-sm"
                onClick={handleOpenTicketForm}
              >
                <TicketIcon size={14} />
                <span>Yes, Create Support Ticket</span>
              </button>
              <button
                className="btn-secondary-sm"
                onClick={() => setShowTicketOffer(false)}
              >
                <span>Continue Troubleshooting</span>
              </button>
            </div>
          </div>
        )}

        {/* Embedded Support Ticket Confirmation Form */}
        {showTicketForm && !createdTicketInfo && (
          <div className="embedded-ticket-form-card message-animate">
            <div className="form-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TicketIcon size={18} style={{ color: 'var(--primary-600)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>Confirm Support Ticket Details</h4>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowTicketForm(false)}
                title="Cancel ticket creation"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Issue Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={formIssueTitle}
                  onChange={(e) => setFormIssueTitle(e.target.value)}
                  placeholder="e.g. Eduroam Wi-Fi authentication handshake failure"
                  required
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
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
              </div>

              <div className="form-group">
                <label className="form-label">Location / Building</label>
                <input
                  type="text"
                  className="form-input"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. Main Library 2nd Floor"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description & Troubleshooting Summary</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  required
                />
              </div>

              <div className="ticket-form-footer">
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => setShowTicketForm(false)}
                  disabled={isSubmittingTicket}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-sm"
                  disabled={isSubmittingTicket || !formIssueTitle.trim()}
                >
                  {isSubmittingTicket ? (
                    <>
                      <RefreshCw size={13} className="spin" />
                      <span>Creating Ticket...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Submit Support Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Live Ticket Created Banner Card */}
        {createdTicketInfo && (
          <div className="ticket-created-confirmation-card message-animate">
            <div className="conf-top">
              <CheckCircle2 size={22} style={{ color: 'var(--success-600)', flexShrink: 0 }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="ticket-badge-mono" style={{ fontSize: '0.95rem' }}>
                    {createdTicketInfo.ticket_number}
                  </span>
                  <span className="status-tag status-new">Queued for Dispatch</span>
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {createdTicketInfo.title}
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Location: {createdTicketInfo.location} • Priority: {createdTicketInfo.priority}
                </p>
              </div>
            </div>

            {onViewTicket && (
              <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-primary-sm"
                  onClick={() => onViewTicket(createdTicketInfo.id)}
                >
                  <span>View on Ticket Board</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="chat-error-banner">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Contextual Quick Reply Chips */}
      {contextualChips.length > 0 && !isLoading && !showTicketForm && (
        <div className="contextual-chips-bar">
          <span className="contextual-chips-title">Quick Responses:</span>
          <div className="contextual-chips-scroll">
            {contextualChips.map((chip) => (
              <button
                key={chip.id}
                className="contextual-chip"
                onClick={() => sendMessage(chip.response)}
                disabled={isLoading || !backendConnected}
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Composer Area */}
      <div className="chat-input-wrapper">
        {!backendConnected && (
          <div className="backend-offline-banner">
            <AlertCircle size={15} />
            <span>API Server Offline. Ensure backend is running on port 8000.</span>
          </div>
        )}

        {/* Attached file chip */}
        {attachedImageName && (
          <div className="attached-file-preview">
            <ImageIcon size={14} />
            <span>{attachedImageName}</span>
            <button className="remove-attach-btn" onClick={() => setAttachedImageName(null)}>
              <X size={12} />
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,.png,.jpg,.jpeg,.log,.txt"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <form
          className="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          {/* Upload / Attachment button */}
          <button
            type="button"
            className="chat-media-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach screenshot or error log"
          >
            <Paperclip size={18} />
          </button>

          {/* Composer Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={isRecordingVoice ? 'Listening to speech...' : 'Describe your IT issue...'}
            className="chat-textarea"
            disabled={isLoading || !backendConnected}
          />

          {/* Voice Input Button */}
          <button
            type="button"
            className={`chat-media-btn ${isRecordingVoice ? 'recording' : ''}`}
            onClick={handleToggleVoice}
            title={isRecordingVoice ? 'Stop recording voice' : 'Speak your issue (Voice Input)'}
          >
            {isRecordingVoice ? <MicOff size={18} /> : <Mic size={18} />}
            {isRecordingVoice && <span className="rec-time">{voiceSeconds}s</span>}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputValue.trim() && !attachedImageName) || isLoading || !backendConnected}
            className="chat-send-btn"
            title="Send message (Enter)"
            aria-label="Send message"
          >
            {isLoading ? <RefreshCw size={18} className="spin" /> : <Send size={18} />}
          </button>
        </form>

        <div className="chat-hint-bar">
          <span>Press <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for a new line</span>
          <span>• Powered by <strong>NVIDIA Nemotron 3 Ultra</strong></span>
        </div>
      </div>
    </div>
  );
}
