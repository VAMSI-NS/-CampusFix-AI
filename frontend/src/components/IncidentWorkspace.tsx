import { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  DiagnosticStage,
  EscalationDetails,
  TicketCreatePayload,
  TicketUpdatePayload,
  CampusUser,
  TicketAIAnalysisResponse,
} from '../types/chat';
import { createClientMockTicket, saveLocalTickets, generateClientTicketAnalysis } from '../data/mockData';
import ChatInterface from './ChatInterface';
import {
  CheckCircle2,
  AlertTriangle,
  User,
  MapPin,
  Mail,
  Shield,
  Activity,
  PlusCircle,
  Check,
  Copy,
  Send,
  LifeBuoy,
  Wifi,
  KeyRound,
  Printer,
  ShieldCheck,
  Gamepad2,
  Monitor,
  RotateCcw,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';

interface IncidentWorkspaceProps {
  backendConnected: boolean;
  modelName?: string;
  selectedTicketId?: string | null;
  initialQuery?: string;
  tickets?: Ticket[];
  currentUser?: CampusUser | null;
  onTicketsUpdated?: (tickets: Ticket[]) => void;
  onTicketChanged?: (ticket: Ticket) => void;
  onSwitchToHistory?: () => void;
  onNavigateToMap?: (locationNameOrCode?: string) => void;
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

const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Urgent', 'Critical'];

const STATUSES: TicketStatus[] = [
  'New',
  'Diagnosing',
  'Waiting for Student',
  'Resolved',
  'Escalated',
];

const STAGES: { stage: DiagnosticStage; step: number; label: string; desc: string }[] = [
  { stage: 'Triage', step: 1, label: 'Triage & Intake', desc: 'Identify issue category & urgency' },
  { stage: 'Environment & Device', step: 2, label: 'Environment & Device', desc: 'Check OS, location & auth tokens' },
  { stage: 'Troubleshooting', step: 3, label: 'Active Diagnosis', desc: 'Step-by-step troubleshooting' },
  { stage: 'Verification', step: 4, label: 'Verification / Fix', desc: 'Confirm fix or prepare escalation' },
];

export default function IncidentWorkspace({
  backendConnected,
  modelName,
  selectedTicketId,
  initialQuery,
  tickets: parentTickets,
  currentUser,
  onTicketsUpdated,
  onTicketChanged,
  onSwitchToHistory,
  onNavigateToMap,
}: IncidentWorkspaceProps) {
  const [localTickets, setLocalTickets] = useState<Ticket[]>(parentTickets || []);
  const tickets = parentTickets && parentTickets.length > 0 ? parentTickets : localTickets;

  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Modals / forms state
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalationDepartment, setEscalationDepartment] = useState('Campus IT Tech Bar Walkup');
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationNotes, setEscalationNotes] = useState('');
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  // Report to Host Modal State
  const [isReportHostModalOpen, setIsReportHostModalOpen] = useState(false);
  const [reportHostReason, setReportHostReason] = useState('');
  const [reportHostNotes, setReportHostNotes] = useState('');
  const [reportHostSuggestedSpec, setReportHostSuggestedSpec] = useState<string>('Network');

  // Action log feedback state
  const [actionSuccessFeedback, setActionSuccessFeedback] = useState(false);
  const [claimSuccessFeedback, setClaimSuccessFeedback] = useState(false);

  // AI Diagnostic Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<TicketAIAnalysisResponse | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);

  // New ticket form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('Eduroam Wi-Fi');
  const [newPriority, setNewPriority] = useState<TicketPriority>('Medium');
  const [newNetId, setNewNetId] = useState('student.user');
  const [newEmail, setNewEmail] = useState('student@university.edu');
  const [newLocation, setNewLocation] = useState('Main Campus Library');
  const [newDescription, setNewDescription] = useState('');

  // Action log input
  const [actionInput, setActionInput] = useState('');
  const [actionResult, setActionResult] = useState('');
  const [isAddingAction, setIsAddingAction] = useState(false);

  // Technician note input
  const [techNoteInput, setTechNoteInput] = useState('');

  // Fetch AI Analysis for active ticket
  const fetchAiAnalysis = useCallback(async (ticket: Ticket) => {
    setIsLoadingAnalysis(true);
    let analysis: TicketAIAnalysisResponse | null = null;
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          analysis = await res.json();
        }
      }
    } catch {
      // client fallback below
    }

    if (!analysis) {
      analysis = generateClientTicketAnalysis(ticket, tickets);
    }

    setAiAnalysis(analysis);
    setIsLoadingAnalysis(false);
  }, [tickets]);

  useEffect(() => {
    if (activeTicket) {
      fetchAiAnalysis(activeTicket);
    } else {
      setAiAnalysis(null);
    }
  }, [activeTicket?.id, fetchAiAnalysis]);

  // Fetch tickets if not loaded
  const fetchTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data: Ticket[] = await res.json();
        setLocalTickets(data);
        if (onTicketsUpdated) onTicketsUpdated(data);

        if (data.length > 0) {
          if (selectedTicketId) {
            const match = data.find((t) => t.id === selectedTicketId || t.ticket_number === selectedTicketId);
            if (match) {
              setActiveTicket(match);
              return;
            }
          }
          setActiveTicket((prev) => {
            if (prev) {
              const stillExists = data.find((t) => t.id === prev.id);
              return stillExists || data[0];
            }
            return data[0];
          });
        }
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [selectedTicketId, onTicketsUpdated]);

  useEffect(() => {
    if (!parentTickets || parentTickets.length === 0) {
      fetchTickets();
    } else {
      if (selectedTicketId) {
        const match = parentTickets.find((t) => t.id === selectedTicketId || t.ticket_number === selectedTicketId);
        if (match) setActiveTicket(match);
      } else if (!activeTicket && parentTickets.length > 0) {
        setActiveTicket(parentTickets[0]);
      }
    }
  }, [parentTickets, selectedTicketId, fetchTickets, activeTicket]);

  const handleUpdateTicket = async (patch: TicketUpdatePayload) => {
    if (!activeTicket) return;
    let updated: Ticket | null = null;
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          updated = await res.json();
        }
      }
    } catch (err) {
      console.warn('Backend ticket update unreachable, updating client state:', err);
    }

    if (!updated) {
      updated = {
        ...activeTicket,
        ...patch,
        updated_at: new Date().toISOString(),
      };
    }

    setActiveTicket(updated);
    const updatedList = tickets.map((t) => (t.id === updated!.id ? updated! : t));
    setLocalTickets(updatedList);
    saveLocalTickets(updatedList);
    if (onTicketsUpdated) onTicketsUpdated(updatedList);
    if (onTicketChanged) onTicketChanged(updated);
  };

  const handleAddAction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeTicket || !actionInput.trim()) return;

    setIsAddingAction(true);
    const actText = actionInput.trim();
    const actResult = actionResult.trim() || 'Diagnosis executed and recorded.';
    let updated: Ticket | null = null;

    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actText,
          result: actResult,
          actor: 'technician',
        }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          updated = await res.json();
        }
      }
    } catch (err) {
      console.warn('Backend action log unreachable, applying client update:', err);
    }

    if (!updated) {
      const newAction = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: actText,
        result: actResult,
        actor: 'technician' as const,
      };
      const nextProgress = Math.min(100, Math.max(activeTicket.diagnostic_progress || 0, 35) + 20);
      updated = {
        ...activeTicket,
        actions_taken: [...(activeTicket.actions_taken || []), newAction],
        diagnostic_progress: nextProgress,
        updated_at: new Date().toISOString(),
      };
    }

    setActiveTicket(updated);
    const updatedList = tickets.map((t) => (t.id === updated!.id ? updated! : t));
    setLocalTickets(updatedList);
    saveLocalTickets(updatedList);
    if (onTicketsUpdated) onTicketsUpdated(updatedList);
    if (onTicketChanged) onTicketChanged(updated);

    setActionInput('');
    setActionResult('');
    setIsAddingAction(false);
    setActionSuccessFeedback(true);
    setTimeout(() => setActionSuccessFeedback(false), 2500);
  };

  const handleAddTechNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !techNoteInput.trim()) return;
    const authorName = currentUser?.name || 'Assigned Technician';
    const noteText = techNoteInput.trim();
    const nowIso = new Date().toISOString();

    const newNote = {
      id: `note-${Date.now()}`,
      author: authorName,
      author_role: (currentUser?.role === 'host' ? 'system' : 'technician') as 'technician' | 'system' | 'student',
      text: noteText,
      created_at: nowIso,
    };

    const updated: Ticket = {
      ...activeTicket,
      notes: [...(activeTicket.notes || []), newNote],
      updated_at: nowIso,
    };

    setActiveTicket(updated);
    const updatedList = tickets.map((t) => (t.id === updated.id ? updated : t));
    setLocalTickets(updatedList);
    saveLocalTickets(updatedList);
    if (onTicketsUpdated) onTicketsUpdated(updatedList);
    if (onTicketChanged) onTicketChanged(updated);

    fetch(`/api/tickets/${activeTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technician_note: noteText }),
    }).catch(() => {});

    setTechNoteInput('');
  };

  const handleClaimTicket = async () => {
    if (!activeTicket || !currentUser) return;
    const claimTechName = `${currentUser.name} (${currentUser.specialization || 'Tech'})`;
    const nowIso = new Date().toISOString();

    const newAct = {
      id: `act-${Date.now()}`,
      timestamp: nowIso,
      action: `Incident claimed by ${claimTechName}`,
      result: `Assigned technician updated to ${claimTechName}. Status set to Diagnosing.`,
      actor: 'technician' as const,
    };

    const updated: Ticket = {
      ...activeTicket,
      assigned_technician: claimTechName,
      status: 'Diagnosing',
      actions_taken: [...(activeTicket.actions_taken || []), newAct],
      updated_at: nowIso,
    };

    setActiveTicket(updated);
    const updatedList = tickets.map((t) => (t.id === updated.id ? updated : t));
    setLocalTickets(updatedList);
    saveLocalTickets(updatedList);
    if (onTicketsUpdated) onTicketsUpdated(updatedList);
    if (onTicketChanged) onTicketChanged(updated);

    fetch(`/api/tickets/${activeTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_technician: claimTechName, status: 'Diagnosing' }),
    }).catch(() => {});

    setClaimSuccessFeedback(true);
    setTimeout(() => setClaimSuccessFeedback(false), 2500);
  };

  const handleExecuteAiStep = (stepText: string) => {
    if (!activeTicket) return;
    const actText = stepText;
    const actResult = 'Diagnostic recommendation executed and verified with student.';
    const nowIso = new Date().toISOString();

    const newAction = {
      id: `act-${Date.now()}`,
      timestamp: nowIso,
      action: actText,
      result: actResult,
      actor: 'technician' as const,
    };
    const nextProgress = Math.min(100, Math.max(activeTicket.diagnostic_progress || 0, 30) + 20);

    const updated: Ticket = {
      ...activeTicket,
      actions_taken: [...(activeTicket.actions_taken || []), newAction],
      diagnostic_progress: nextProgress,
      updated_at: nowIso,
    };

    setActiveTicket(updated);
    const updatedList = tickets.map((t) => (t.id === updated.id ? updated : t));
    setLocalTickets(updatedList);
    saveLocalTickets(updatedList);
    if (onTicketsUpdated) onTicketsUpdated(updatedList);
    if (onTicketChanged) onTicketChanged(updated);

    fetch(`/api/tickets/${activeTicket.id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actText, result: actResult, actor: 'technician' }),
    }).catch(() => {});

    setActionSuccessFeedback(true);
    setTimeout(() => setActionSuccessFeedback(false), 2500);
  };

  const handleResolveTicket = async () => {
    if (!activeTicket || !resolutionText.trim()) return;
    let updated: Ticket | null = null;
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_details: resolutionText.trim() }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          updated = await res.json();
        }
      }
    } catch (err) {
      console.warn('Backend resolve unreachable, applying client update:', err);
    }

    if (!updated) {
      const nowIso = new Date().toISOString();
      updated = {
        ...activeTicket,
        status: 'Resolved',
        diagnostic_stage: 'Completed',
        diagnostic_progress: 100,
        resolution_details: resolutionText.trim(),
        actions_taken: [
          ...(activeTicket.actions_taken || []),
          {
            id: `act-${Date.now()}`,
            timestamp: nowIso,
            action: 'Incident resolved with verified remediation',
            result: resolutionText.trim(),
            actor: 'technician',
          },
        ],
        updated_at: nowIso,
      };
    }

    setActiveTicket(updated);
    const updatedList = tickets.map((t) => (t.id === updated!.id ? updated! : t));
    setLocalTickets(updatedList);
    saveLocalTickets(updatedList);
    if (onTicketsUpdated) onTicketsUpdated(updatedList);
    if (onTicketChanged) onTicketChanged(updated);
    setIsResolveModalOpen(false);
    setResolutionText('');
  };

  const handleEscalateTicket = async () => {
    if (!activeTicket || !escalationReason.trim()) return;
    const token = localStorage.getItem('campusfix_token');
    const originalTech = currentUser
      ? `${currentUser.name} (${currentUser.specialization || 'Tech'})`
      : (activeTicket.assigned_technician || 'CampusFix Support');

    const escalationPayload: EscalationDetails = {
      tier: 'Tier-2 Specialist Escalation',
      department: escalationDepartment,
      reason: escalationReason.trim(),
      original_technician: originalTech,
      target_specialization: escalationDepartment,
      assigned_to: `${escalationDepartment} Queue`,
      tech_bar_location: 'Main Library, 1st Floor Tech Bar (Mon–Fri 8:00 AM – 7:00 PM)',
      student_id_required: true,
      notes: escalationNotes.trim() || undefined,
      escalated_at: new Date().toISOString(),
    };

    let updated: Ticket | null = null;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/tickets/${activeTicket.id}/escalate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(escalationPayload),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          updated = await res.json();
        }
      }
    } catch (err) {
      console.warn('Backend escalation unreachable, updating client state:', err);
    }

    if (!updated) {
      const nowIso = new Date().toISOString();
      updated = {
        ...activeTicket,
        status: 'Escalated',
        diagnostic_stage: 'Verification',
        diagnostic_progress: 100,
        escalation_info: escalationPayload,
        actions_taken: [
          ...(activeTicket.actions_taken || []),
          {
            id: `act-${Date.now()}`,
            timestamp: nowIso,
            action: `Incident escalated to ${escalationDepartment}`,
            result: `Reason: ${escalationReason.trim()}`,
            actor: 'technician',
          },
        ],
        updated_at: nowIso,
      };
    }

    setActiveTicket(updated);
    const updatedList = tickets.map((t) => (t.id === updated!.id ? updated! : t));
    setLocalTickets(updatedList);
    saveLocalTickets(updatedList);
    if (onTicketsUpdated) onTicketsUpdated(updatedList);
    if (onTicketChanged) onTicketChanged(updated);
    setIsEscalateModalOpen(false);
    setEscalationReason('');
    setEscalationNotes('');
  };

  const handleReportToHost = async () => {
    if (!activeTicket) return;
    const token = localStorage.getItem('campusfix_token');
    const originalTech = currentUser
      ? `${currentUser.name} (${currentUser.specialization || 'Tech'})`
      : (activeTicket.assigned_technician || 'CampusFix Technician');

    const escalationPayload: EscalationDetails = {
      tier: 'Host Reassignment Queue',
      department: 'Host / Admin',
      reason: reportHostReason.trim() || 'Technician reported unable to resolve. Requesting Host reassignment.',
      original_technician: originalTech,
      target_specialization: reportHostSuggestedSpec,
      assigned_to: 'Host Dispatcher',
      tech_bar_location: 'Campus IT Host Operations Command Center',
      student_id_required: false,
      notes: reportHostNotes.trim() || `Reported by ${originalTech}. Suggested Specialization: ${reportHostSuggestedSpec}.`,
      escalated_at: new Date().toISOString(),
    };

    let updatedTicket: Ticket | null = null;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/tickets/${activeTicket.id}/escalate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(escalationPayload),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          updatedTicket = await res.json();
        }
      }
    } catch (err) {
      console.warn('Backend escalation unreachable, using client state:', err);
    }

    if (!updatedTicket) {
      const nowIso = new Date().toISOString();
      updatedTicket = {
        ...activeTicket,
        status: 'Escalated',
        diagnostic_stage: 'Verification',
        diagnostic_progress: 100,
        escalation_info: escalationPayload,
        actions_taken: [
          ...(activeTicket.actions_taken || []),
          {
            id: `act-${Date.now()}`,
            timestamp: nowIso,
            action: `Reported to Host for Reassignment to ${reportHostSuggestedSpec} by ${originalTech}`,
            result: `Reason: ${escalationPayload.reason}`,
            actor: 'technician',
          },
        ],
        notes: [
          ...(activeTicket.notes || []),
          {
            id: `note-${Date.now()}`,
            author: originalTech,
            author_role: 'technician',
            text: `[Report to Host] Suggested Specialization: ${reportHostSuggestedSpec}. Reason: ${escalationPayload.reason}. ${reportHostNotes.trim()}`,
            created_at: nowIso,
          },
        ],
        updated_at: nowIso,
      };
    }

    setActiveTicket(updatedTicket);
    const updatedList = tickets.map((t) => (t.id === updatedTicket!.id ? updatedTicket! : t));
    setLocalTickets(updatedList);
    saveLocalTickets(updatedList);
    if (onTicketsUpdated) onTicketsUpdated(updatedList);
    if (onTicketChanged) onTicketChanged(updatedTicket);
    setIsReportHostModalOpen(false);
    setReportHostReason('');
    setReportHostNotes('');
  };

  const handleCreateNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const payload: TicketCreatePayload = {
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      location: newLocation.trim(),
      netid: newNetId.trim(),
      email: newEmail.trim(),
      description: newDescription.trim(),
      issue_summary: newDescription.trim().slice(0, 120),
    };

    let created: Ticket | null = null;
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          created = await res.json();
        }
      }
    } catch (err) {
      console.warn('Backend ticket creation unreachable, using client creator:', err);
    }

    if (!created) {
      created = createClientMockTicket(payload);
    }

    const updatedList = [created, ...tickets.filter((t) => t.id !== created!.id)];
    setLocalTickets(updatedList);
    if (onTicketsUpdated) onTicketsUpdated(updatedList);
    setActiveTicket(created);
    setIsNewTicketModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  const copyTicketNumber = () => {
    if (!activeTicket) return;
    navigator.clipboard.writeText(activeTicket.ticket_number);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const renderCategoryIcon = (category: TicketCategory) => {
    switch (category) {
      case 'Eduroam Wi-Fi':
        return <Wifi size={14} />;
      case 'Canvas / SSO':
        return <KeyRound size={14} />;
      case 'Duo MFA':
        return <ShieldCheck size={14} />;
      case 'PaperCut Printing':
        return <Printer size={14} />;
      case 'Dorm ResNet':
        return <Gamepad2 size={14} />;
      case 'Lab / Computer Access':
        return <Monitor size={14} />;
      default:
        return <LifeBuoy size={14} />;
    }
  };

  return (
    <div className="resolver-workbench-container">
      {/* Top Incident Control Bar */}
      <div className="incident-control-bar">
        <div className="incident-selector-wrap">
          <span className="control-label">Active IT Incident:</span>
          <select
            className="incident-dropdown"
            value={activeTicket?.id || ''}
            onChange={(e) => {
              const selected = tickets.find((t) => t.id === e.target.value);
              if (selected) setActiveTicket(selected);
            }}
          >
            {tickets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.ticket_number} — [{t.status}] {t.title.slice(0, 48)}...
              </option>
            ))}
          </select>
        </div>

        <div className="incident-control-actions">
          <button
            className="btn-secondary-sm"
            onClick={() => setIsNewTicketModalOpen(true)}
            title="Create a new formal IT incident ticket"
          >
            <PlusCircle size={15} />
            <span>New Incident</span>
          </button>

          {onSwitchToHistory && (
            <button
              className="btn-secondary-sm"
              onClick={onSwitchToHistory}
              title="View all past and active incidents"
            >
              <span>Incident Directory ({tickets.length})</span>
            </button>
          )}

          <button
            className="btn-icon-sm"
            onClick={fetchTickets}
            title="Refresh incident list"
          >
            <RotateCcw size={14} className={isLoadingTickets ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Workbench */}
      <div className="workbench-grid">
        {/* Left Pane: Interactive AI Support Specialist */}
        <div className="workbench-left-pane">
          <div className="pane-header">
            <div className="pane-title-group">
              <div className="specialist-status-pill">
                <Sparkles size={14} style={{ color: 'var(--primary-600)' }} />
                <span>AI Technical Specialist</span>
                <span className="model-subtag">{modelName || 'Nemotron 3 Ultra'}</span>
              </div>
            </div>
            {activeTicket && (
              <div className="active-ticket-chip">
                <span className="ticket-chip-id">{activeTicket.ticket_number}</span>
                <span className={`status-tag status-${activeTicket.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {activeTicket.status}
                </span>
              </div>
            )}
          </div>

          {/* Embedded AI Chat Interface */}
          <div className="embedded-chat-wrap">
            <ChatInterface
              backendConnected={backendConnected}
              modelName={modelName}
              activeTicketNumber={activeTicket?.ticket_number}
              activeDiagnosticStage={activeTicket?.diagnostic_stage || 'Troubleshooting'}
              initialQuery={initialQuery}
              onStageChange={(stg) => {
                if (activeTicket) {
                  handleUpdateTicket({ diagnostic_stage: stg });
                }
              }}
              onSuggestedAction={(action, result) => {
                if (!activeTicket) return;
                const actResult = result || 'Diagnosis executed and recorded.';
                fetch(`/api/tickets/${activeTicket.id}/action`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action, result: actResult, actor: 'ai_specialist' }),
                })
                  .then((res) => (res.ok ? res.json() : null))
                  .then((updated) => {
                    let next = updated;
                    if (!next) {
                      const newAct = {
                        id: `act-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        action,
                        result: actResult,
                        actor: 'ai_specialist' as const,
                      };
                      next = {
                        ...activeTicket,
                        actions_taken: [...(activeTicket.actions_taken || []), newAct],
                        diagnostic_progress: Math.min(100, (activeTicket.diagnostic_progress || 40) + 15),
                        updated_at: new Date().toISOString(),
                      };
                    }
                    setActiveTicket(next);
                    const updatedList = tickets.map((t) => (t.id === next.id ? next : t));
                    setLocalTickets(updatedList);
                    saveLocalTickets(updatedList);
                    if (onTicketsUpdated) onTicketsUpdated(updatedList);
                  })
                  .catch(() => {
                    const newAct = {
                      id: `act-${Date.now()}`,
                      timestamp: new Date().toISOString(),
                      action,
                      result: actResult,
                      actor: 'ai_specialist' as const,
                    };
                    const next = {
                      ...activeTicket,
                      actions_taken: [...(activeTicket.actions_taken || []), newAct],
                      diagnostic_progress: Math.min(100, (activeTicket.diagnostic_progress || 40) + 15),
                      updated_at: new Date().toISOString(),
                    };
                    setActiveTicket(next);
                    const updatedList = tickets.map((t) => (t.id === next.id ? next : t));
                    setLocalTickets(updatedList);
                    saveLocalTickets(updatedList);
                    if (onTicketsUpdated) onTicketsUpdated(updatedList);
                  });
              }}
              onTicketCreated={(newTicket) => {
                const updatedList = [newTicket, ...tickets.filter((t) => t.id !== newTicket.id)];
                setLocalTickets(updatedList);
                saveLocalTickets(updatedList);
                setActiveTicket(newTicket);
                if (onTicketsUpdated) onTicketsUpdated(updatedList);
                if (onTicketChanged) onTicketChanged(newTicket);
              }}
              onViewTicket={(ticketId) => {
                const match = tickets.find((t) => t.id === ticketId || t.ticket_number === ticketId);
                if (match) setActiveTicket(match);
              }}
              onViewLocationOnMap={(locName) => {
                if (onNavigateToMap) onNavigateToMap(locName);
              }}
            />
          </div>
        </div>

        {/* Right Pane: Incident Resolver Dossier & Diagnostic Engine */}
        <div className="workbench-right-pane">
          {activeTicket ? (
            <div className="resolver-dossier-card">
              {/* Dossier Header */}
              <div className="dossier-header">
                <div className="dossier-id-row">
                  <div className="ticket-id-large" onClick={copyTicketNumber} title="Click to copy ticket number">
                    <span>{activeTicket.ticket_number}</span>
                    {copiedId ? <Check size={14} className="copied-icon" /> : <Copy size={14} />}
                  </div>

                  <div className="status-badge-wrapper">
                    <select
                      className={`status-select status-${activeTicket.status.toLowerCase().replace(/\s+/g, '-')}`}
                      value={activeTicket.status}
                      onChange={(e) => handleUpdateTicket({ status: e.target.value as TicketStatus })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <h2 className="dossier-title">{activeTicket.title}</h2>

                {/* Logged-in Technician Identity & Claim Action */}
                {currentUser && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.75rem',
                      margin: '0.65rem 0',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <UserCheck size={14} style={{ color: '#60a5fa' }} />
                      <span>
                        Operator: <strong>{currentUser.name}</strong> ({currentUser.specialization || currentUser.role})
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span>
                        Assigned: <strong>{activeTicket.assigned_technician || 'Unassigned'}</strong>
                      </span>
                    </div>

                    {currentUser.role === 'technician' && activeTicket.assigned_technician !== currentUser.name && (
                      <button
                        type="button"
                        className="btn-secondary-sm"
                        style={{
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.72rem',
                          borderColor: 'rgba(59, 130, 246, 0.4)',
                          color: '#60a5fa',
                          cursor: 'pointer',
                        }}
                        onClick={handleClaimTicket}
                        disabled={claimSuccessFeedback}
                      >
                        {claimSuccessFeedback ? '✓ Claimed!' : '⚡ Claim Ticket'}
                      </button>
                    )}
                  </div>
                )}

                {/* Priority & Category Dropdowns */}
                <div className="dossier-meta-bar">
                  <div className="meta-dropdown-item">
                    <span className="meta-label">Category:</span>
                    <span style={{ color: 'var(--primary-600)', display: 'inline-flex', alignItems: 'center' }}>
                      {renderCategoryIcon(activeTicket.category)}
                    </span>
                    <select
                      className="meta-select"
                      value={activeTicket.category}
                      onChange={(e) => handleUpdateTicket({ category: e.target.value as TicketCategory })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="meta-dropdown-item">
                    <span className="meta-label">Priority:</span>
                    <select
                      className={`meta-select priority-${activeTicket.priority.toLowerCase()}`}
                      value={activeTicket.priority}
                      onChange={(e) => handleUpdateTicket({ priority: e.target.value as TicketPriority })}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Diagnostic Stage Stepper */}
              <div className="diagnostic-stepper-section">
                <div className="stepper-header-row">
                  <div className="stepper-title-wrap">
                    <Activity size={16} style={{ color: 'var(--primary-600)' }} />
                    <span className="stepper-title">Diagnostic Progress</span>
                  </div>
                  <span className="stepper-percent">{activeTicket.diagnostic_progress}%</span>
                </div>

                <div className="stepper-progress-track">
                  <div
                    className="stepper-progress-fill"
                    style={{ width: `${activeTicket.diagnostic_progress}%` }}
                  />
                </div>

                <div className="stepper-stages-grid">
                  {STAGES.map((stg) => {
                    const isCompleted = activeTicket.diagnostic_progress >= stg.step * 25;
                    const isCurrent = activeTicket.diagnostic_stage === stg.stage;

                    return (
                      <div
                        key={stg.stage}
                        className={`stepper-step-tile ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                        onClick={() =>
                          handleUpdateTicket({
                            diagnostic_stage: stg.stage,
                            diagnostic_progress: Math.max(activeTicket.diagnostic_progress, stg.step * 25),
                          })
                        }
                      >
                        <div className="step-number">{isCompleted ? '✓' : stg.step}</div>
                        <div className="step-info">
                          <span className="step-name">{stg.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resolution Details Banner (if Resolved) */}
              {activeTicket.status === 'Resolved' && (
                <div className="resolved-state-banner">
                  <div className="banner-icon">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="banner-content">
                    <h4>Incident Formally Resolved</h4>
                    <p className="resolution-text">
                      {activeTicket.resolution_details || 'Issue resolved successfully. Student validated fix.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Escalation Details Banner (if Escalated) */}
              {activeTicket.status === 'Escalated' && activeTicket.escalation_info && (
                <div className="escalated-state-banner">
                  <div className="banner-icon">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="banner-content">
                    <div className="escalate-header-row">
                      <h4>Escalated: {activeTicket.escalation_info.tier}</h4>
                      <span className="dept-tag">{activeTicket.escalation_info.department}</span>
                    </div>
                    <p className="escalate-reason">
                      <strong>Escalation Reason:</strong> {activeTicket.escalation_info.reason}
                    </p>
                    <div className="tech-bar-notice">
                      <LifeBuoy size={14} />
                      <span>{activeTicket.escalation_info.tech_bar_location}</span>
                    </div>
                    {activeTicket.escalation_info.student_id_required && (
                      <div className="student-id-pill">
                        <Shield size={13} />
                        <span>Student Photo ID Required for In-Person Recovery</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Student & Location Details */}
              <div className="student-details-card">
                <div className="detail-item">
                  <User size={14} className="detail-icon" />
                  <span className="detail-key">NetID:</span>
                  <span className="detail-val font-mono">{activeTicket.netid}</span>
                </div>
                <div className="detail-item">
                  <Mail size={14} className="detail-icon" />
                  <span className="detail-key">Email:</span>
                  <span className="detail-val">{activeTicket.email}</span>
                </div>
                <div className="detail-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <MapPin size={14} className="detail-icon" />
                    <span className="detail-key">Location:</span>
                    <span className="detail-val">{activeTicket.location}</span>
                  </div>
                  {onNavigateToMap && activeTicket.location && (
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => onNavigateToMap(activeTicket.location)}
                      title="View this incident location on Satellite Campus Map"
                    >
                      <MapPin size={11} />
                      <span>Map</span>
                    </button>
                  )}
                </div>
              </div>

              {/* AI Autonomous Diagnostic Assistant & Reasoning Section */}
              <div
                className="dossier-section"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} style={{ color: 'var(--primary-400, #818cf8)' }} />
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#e0e7ff' }}>
                      CampusFix AI Diagnostic Assistant & Incident Analysis
                    </h3>
                    {aiAnalysis && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '999px',
                          background: 'rgba(99, 102, 241, 0.25)',
                          color: '#a5b4fc',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          fontWeight: 700,
                        }}
                      >
                        {Math.round(aiAnalysis.category_confidence_score * 100)}% Confidence
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {isAnalysisExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isAnalysisExpanded && (
                  <div style={{ marginTop: '0.85rem' }}>
                    {isLoadingAnalysis && !aiAnalysis ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.5rem 0' }}>
                        Generating real-time diagnostic reasoning and technician dispatch recommendations...
                      </div>
                    ) : aiAnalysis ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Metadata Badges */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Detected: </span>
                            <strong>{aiAnalysis.detected_category}</strong>
                          </div>

                          <div style={{ fontSize: '0.78rem', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <span>Recommended Specialization: </span>
                            <strong>{aiAnalysis.recommended_specialization}</strong>
                          </div>

                          <div style={{ fontSize: '0.78rem', background: 'rgba(245, 158, 11, 0.12)', color: '#fde68a', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            <span>Severity: </span>
                            <strong>{aiAnalysis.estimated_priority}</strong>
                          </div>
                        </div>

                        {/* Root-Cause Hypothesis */}
                        <div style={{ padding: '0.55rem 0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid var(--primary-500)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)', textTransform: 'uppercase' }}>
                            Root-Cause Hypothesis
                          </div>
                          <p style={{ fontSize: '0.82rem', margin: '0.2rem 0 0', color: 'var(--text-primary)' }}>
                            {aiAnalysis.root_cause_hypothesis}
                          </p>
                        </div>

                        {/* Next Best Action Banner */}
                        <div style={{ padding: '0.55rem 0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>
                            <Zap size={13} />
                            <span>Next Best Action:</span>
                          </div>
                          <p style={{ fontSize: '0.82rem', margin: '0.15rem 0 0', color: '#e2e8f0' }}>
                            {aiAnalysis.next_best_action}
                          </p>
                        </div>

                        {/* Suggested Step-by-Step Diagnostic Actions */}
                        <div>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                            Recommended Diagnostic Actions ({aiAnalysis.suggested_diagnostic_steps.length}):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {aiAnalysis.suggested_diagnostic_steps.map((step, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-subtle)',
                                  fontSize: '0.8rem',
                                }}
                              >
                                <span>
                                  <strong style={{ color: 'var(--primary-400)', marginRight: '0.35rem' }}>#{idx + 1}</strong>
                                  {step}
                                </span>
                                <button
                                  type="button"
                                  className="btn-secondary-sm"
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '0.2rem 0.45rem',
                                    color: '#38bdf8',
                                    borderColor: 'rgba(56, 189, 248, 0.3)',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleExecuteAiStep(step)}
                                  title="Log this step into the ticket action log"
                                >
                                  <Zap size={11} />
                                  <span>Quick Execute</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Escalation Risk & Similar Tickets */}
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Risk Profile: </span>
                            {aiAnalysis.escalation_risk_assessment}
                          </div>
                          {aiAnalysis.similar_incidents_detected.length > 0 && (
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Similar Incidents: </span>
                              {aiAnalysis.similar_incidents_detected.length} related tickets
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Issue Description & Synopsis */}
              <div className="dossier-section">
                <h3 className="section-label">Incident Synopsis & Report</h3>
                <p className="description-box">{activeTicket.description}</p>
              </div>

              {/* Diagnostic Action Log Timeline */}
              <div className="dossier-section">
                <div className="section-header-flex">
                  <h3 className="section-label">
                    Actions Taken & Diagnostic Audit Trail ({activeTicket.actions_taken?.length || 0})
                  </h3>
                </div>

                <div className="actions-timeline">
                  {activeTicket.actions_taken && activeTicket.actions_taken.length > 0 ? (
                    activeTicket.actions_taken.map((act) => (
                      <div key={act.id} className={`timeline-entry actor-${act.actor}`}>
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="timeline-top">
                            <span className="action-text">{act.action}</span>
                            <span className="action-time">
                              {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {act.result && <p className="action-result">{act.result}</p>}
                          <span className="actor-badge">Actor: {act.actor.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-actions-note">No actions logged yet. Start diagnosis below.</div>
                  )}
                </div>

                {/* Inline Add Action Form */}
                <form className="add-action-form" onSubmit={handleAddAction}>
                  <div className="action-inputs-row">
                    <input
                      type="text"
                      className="form-input-sm"
                      placeholder="Executed Action (e.g. 'Reset RADIUS profile')..."
                      value={actionInput}
                      onChange={(e) => setActionInput(e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input-sm"
                      placeholder="Observed Result (e.g. 'Auth handshake OK')..."
                      value={actionResult}
                      onChange={(e) => setActionResult(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn-primary-sm"
                      disabled={!actionInput.trim() || isAddingAction}
                      style={{
                        background: actionSuccessFeedback ? 'var(--success-600, #16a34a)' : undefined,
                        borderColor: actionSuccessFeedback ? 'var(--success-600, #16a34a)' : undefined,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {actionSuccessFeedback ? (
                        <>
                          <Check size={13} />
                          <span>Action Logged!</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Log Action</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Technician Notes */}
              <div className="dossier-section">
                <h3 className="section-label">Internal Support Notes</h3>
                <div className="notes-list">
                  {activeTicket.notes && activeTicket.notes.length > 0 ? (
                    activeTicket.notes.map((note) => (
                      <div key={note.id} className="note-card">
                        <div className="note-meta">
                          <span className="note-author">{note.author}</span>
                          <span className="note-time">
                            {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="note-text">{note.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="empty-notes-hint">No technician notes attached.</p>
                  )}
                </div>

                <form className="add-note-form" onSubmit={handleAddTechNote}>
                  <div className="note-input-row">
                    <input
                      type="text"
                      className="form-input-sm"
                      placeholder="Add an internal technician note..."
                      value={techNoteInput}
                      onChange={(e) => setTechNoteInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn-secondary-sm"
                      disabled={!techNoteInput.trim()}
                    >
                      Add Note
                    </button>
                  </div>
                </form>
              </div>

              {/* Resolution, Escalation, and Report to Host Action Buttons (Restricted to Technicians & Host) */}
              <div className="dossier-action-footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                {(currentUser?.role === 'technician' || currentUser?.role === 'admin' || currentUser?.role === 'host') ? (
                  <>
                    {activeTicket.status !== 'Resolved' && (
                      <button
                        className="btn-resolve"
                        onClick={() => {
                          setResolutionText(
                            `Applied fix for ${activeTicket.category}. Diagnostic tests verified normal operation.`
                          );
                          setIsResolveModalOpen(true);
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Mark as Resolved</span>
                      </button>
                    )}

                    {activeTicket.status !== 'Escalated' && (
                      <button
                        className="btn-escalate"
                        onClick={() => {
                          setEscalationReason(
                            `Requires physical hardware inspection or Tier-2 directory privileges for ${activeTicket.category}.`
                          );
                          setIsEscalateModalOpen(true);
                        }}
                      >
                        <AlertTriangle size={16} />
                        <span>Escalate to Tier-2 / Tech Bar</span>
                      </button>
                    )}

                    {/* Report to Host (Reassignment) Button */}
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        borderColor: 'var(--warning-600, #d97706)',
                        color: 'var(--warning-500, #f59e0b)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                      onClick={() => {
                        setReportHostReason(
                          `Technician unable to resolve ${activeTicket.category} incident — Requesting Host reassignment to specialized engineer.`
                        );
                        setIsReportHostModalOpen(true);
                      }}
                      title="Report this incident to Host/Admin if unable to solve or outside current domain"
                    >
                      <ShieldCheck size={15} />
                      <span>Report to Host (Reassign)</span>
                    </button>
                  </>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.65rem 1rem',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: '10px',
                      color: '#93c5fd',
                      fontSize: '0.82rem',
                      width: '100%',
                    }}
                  >
                    <ShieldCheck size={16} style={{ color: '#60a5fa', flexShrink: 0 }} />
                    <span>
                      {activeTicket.status === 'Resolved'
                        ? '✅ This complaint has been formally resolved by authorized Campus IT Technicians.'
                        : '🔒 Incident under active diagnostic review. Only authorized technicians and host administrators have permission to mark incidents as resolved.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-ticket-selected">
              <LifeBuoy size={36} style={{ color: 'var(--primary-400)' }} />
              <h3>No Active Incident Selected</h3>
              <p>Select an existing ticket above or create a new incident.</p>
              <button
                className="btn-primary"
                onClick={() => setIsNewTicketModalOpen(true)}
              >
                <PlusCircle size={16} /> Create Incident
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- Report to Host (Reassign Request) Modal --- */}
      {isReportHostModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <ShieldCheck size={20} style={{ color: 'var(--warning-500)' }} />
                <h3>Report to Host: {activeTicket?.ticket_number}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsReportHostModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-desc">
                If you are unable to resolve this incident or lack the necessary system permissions / hardware replacement tools, report this to the <strong>Host Operations Command Center</strong> so the host administrator can reassign this incident to another available technician.
              </p>

              <div className="form-group">
                <label className="form-label">Suggested Specialization for Host Reassignment</label>
                <select
                  className="form-input"
                  value={reportHostSuggestedSpec}
                  onChange={(e) => setReportHostSuggestedSpec(e.target.value)}
                  style={{ background: 'var(--bg-input, #0f172a)', color: '#fff', cursor: 'pointer' }}
                >
                  <option value="Network">🌐 Network (Wi-Fi, ResNet, VPN, Switches, RADIUS)</option>
                  <option value="Hardware">🖨️ Hardware (Workstations, PaperCut Printers, Terminals)</option>
                  <option value="Software">💻 Software (LMS / Canvas, MATLAB, Academic Licenses)</option>
                  <option value="IAM / Access">🔑 IAM / Access (Duo MFA, Active Directory, NetID)</option>
                  <option value="Database">🗄️ Database (Campus DB, Student Records, SQL)</option>
                  <option value="Security">🛡️ Security (Threats, Account Compromise, SSL/Certs)</option>
                  <option value="Support">🎧 Support (General Tier-1 Helpdesk & Tech Bar)</option>
                  <option value="Other">📦 Other Specialization</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Reporting to Host</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  value={reportHostReason}
                  onChange={(e) => setReportHostReason(e.target.value)}
                  placeholder="Describe why this cannot be completed by current technician..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Additional Dispatch & Handover Notes (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={reportHostNotes}
                  onChange={(e) => setReportHostNotes(e.target.value)}
                  placeholder="e.g. 'Tried driver reinstallation. Requires Tier-2 server admin credentials.'"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsReportHostModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ background: 'var(--warning-600, #d97706)', borderColor: 'var(--warning-600, #d97706)' }}
                onClick={handleReportToHost}
                disabled={!reportHostReason.trim()}
              >
                Confirm Report to Host
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Resolve Modal --- */}
      {isResolveModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <CheckCircle2 size={20} style={{ color: 'var(--success-600)' }} />
                <h3>Resolve Incident: {activeTicket?.ticket_number}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsResolveModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-desc">
                Provide a clear summary of the solution applied so the student and IT team have a record of the resolution.
              </p>
              <label className="form-label">Resolution Details & Actions Performed:</label>
              <textarea
                rows={4}
                className="form-textarea"
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="e.g., 'Cleared PaperCut print buffer and released job. Quota refunded to student account.'"
              />
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsResolveModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleResolveTicket}
                disabled={!resolutionText.trim()}
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Escalate Modal --- */}
      {isEscalateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <AlertTriangle size={20} style={{ color: 'var(--warning-600)' }} />
                <h3>Escalate Incident: {activeTicket?.ticket_number}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsEscalateModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-desc">
                Escalate this incident to Tier-2 specialized engineering teams or dispatch to the Tech Bar.
              </p>

              <div className="form-group">
                <label className="form-label">Escalation Target / Specialization</label>
                <select
                  className="form-select"
                  value={escalationDepartment}
                  onChange={(e) => setEscalationDepartment(e.target.value)}
                >
                  <option value="Network">Network & Wireless Engineering</option>
                  <option value="IAM / Access">Identity & Access Management (IAM / Duo / MFA)</option>
                  <option value="Hardware">Campus Hardware & Printing Support</option>
                  <option value="Software">Academic Software & LMS Engineering</option>
                  <option value="Support">Student IT Help Bar Walkup</option>
                  <option value="Host / Admin">Senior Administrator / Host Escalation</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Escalation</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="e.g., 'Student lacks secondary device for Duo push; physical ID required for bypass code.'"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Technician Dispatch Notes (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={escalationNotes}
                  onChange={(e) => setEscalationNotes(e.target.value)}
                  placeholder="e.g. 'Student has midterm exam in 2 hours. Expedited walkup priority pass granted.'"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsEscalateModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-primary danger-btn"
                onClick={handleEscalateTicket}
                disabled={!escalationReason.trim()}
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- New Incident Ticket Modal --- */}
      {isNewTicketModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <div className="modal-title-group">
                <PlusCircle size={20} style={{ color: 'var(--primary-600)' }} />
                <h3>Open Formal IT Incident Ticket</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsNewTicketModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewTicket}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Incident Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Eduroam connection failing on iPhone 16 in Engineering Hall"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Student NetID</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newNetId}
                      onChange={(e) => setNewNetId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Student Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Campus Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Science Building, Room 204"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Problem Statement</label>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    placeholder="Describe the issue, device type, error messages, and troubleshooting attempted..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsNewTicketModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!newTitle.trim() || !newDescription.trim()}
                >
                  Submit Incident Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
