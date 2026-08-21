import { useState, useMemo } from 'react';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from '../types/chat';
import {
  Search,
  User,
  PlusCircle,
  RotateCcw,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

interface TicketBoardProps {
  tickets: Ticket[];
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus) => Promise<void>;
  onOpenInResolver: (ticketId: string) => void;
  onRefresh?: () => void;
  onNewTicketClick?: () => void;
}

const COLUMNS: { status: TicketStatus; label: string; dotColor: string }[] = [
  { status: 'New', label: 'OPEN', dotColor: 'var(--info-500)' },
  { status: 'Diagnosing', label: 'IN PROGRESS', dotColor: 'var(--primary-500)' },
  { status: 'Resolved', label: 'RESOLVED', dotColor: 'var(--success-500)' },
  { status: 'Escalated', label: 'ESCALATED', dotColor: 'var(--danger-500)' },
];

const PRIORITIES: (TicketPriority | 'All')[] = ['All', 'Critical', 'Urgent', 'High', 'Medium', 'Low'];

const CATEGORIES: (TicketCategory | 'All')[] = [
  'All',
  'Eduroam Wi-Fi',
  'Canvas / SSO',
  'Duo MFA',
  'PaperCut Printing',
  'Dorm ResNet',
  'NetID / Password',
  'Lab / Computer Access',
];

export default function TicketBoard({
  tickets,
  onUpdateTicketStatus,
  onOpenInResolver,
  onRefresh,
  onNewTicketClick,
}: TicketBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | 'All'>('All');
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TicketStatus | null>(null);
  const [inspectedTicket, setInspectedTicket] = useState<Ticket | null>(null);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedPriority !== 'All' && t.priority !== selectedPriority) return false;
      if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          t.ticket_number.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.netid.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [tickets, selectedPriority, selectedCategory, searchQuery]);

  // Drag & drop handlers
  const handleDragStart = (ticketId: string) => {
    setDraggingTicketId(ticketId);
  };

  const handleDragOver = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TicketStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggingTicketId) return;

    const ticket = tickets.find((t) => t.id === draggingTicketId);
    if (ticket && ticket.status !== targetStatus) {
      await onUpdateTicketStatus(ticket.id, targetStatus);
    }
    setDraggingTicketId(null);
  };

  return (
    <div className="ticket-board-container">
      {/* Top Header & Toolbar */}
      <div className="board-header-bar">
        <div className="board-title-group">
          <h2>Incident Kanban Board</h2>
          <p>Drag cards across columns to update triage status in real time</p>
        </div>

        <div className="board-toolbar">
          <div className="search-box-sm">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter by ticket #, requester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-select-sm"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as TicketPriority | 'All')}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>

          <select
            className="form-select-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TicketCategory | 'All')}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          {onNewTicketClick && (
            <button className="btn-primary-sm" onClick={onNewTicketClick}>
              <PlusCircle size={13} />
              <span>New Ticket</span>
            </button>
          )}

          {onRefresh && (
            <button className="btn-icon-sm" onClick={onRefresh} title="Refresh board">
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 4 Kanban Columns */}
      <div className="kanban-grid">
        {COLUMNS.map((col) => {
          const colTickets = filteredTickets.filter((t) => {
            if (col.status === 'Diagnosing') {
              return t.status === 'Diagnosing' || t.status === 'Waiting for Student' || t.status === 'In Progress';
            }
            if (col.status === 'New') {
              return t.status === 'New' || t.status === 'Open';
            }
            return t.status === col.status;
          });

          return (
            <div
              key={col.status}
              className={`kanban-column ${dragOverColumn === col.status ? 'column-drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {/* Column Header */}
              <div className="kanban-column-header">
                <div className="col-title-wrap">
                  <span className="col-indicator-dot" style={{ background: col.dotColor }} />
                  <span className="col-title">{col.label}</span>
                </div>
                <span className="col-count-badge">{colTickets.length}</span>
              </div>

              {/* Cards Track */}
              <div className="kanban-cards-track">
                {colTickets.length > 0 ? (
                  colTickets.map((t) => (
                    <div
                      key={t.id}
                      className={`kanban-card ${draggingTicketId === t.id ? 'card-dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(t.id)}
                      onClick={() => setInspectedTicket(t)}
                    >
                      <div className="card-top-row">
                        <span className="ticket-badge-mono">{t.ticket_number}</span>
                        <span className={`priority-tag priority-${t.priority.toLowerCase()}`}>
                          {t.priority}
                        </span>
                      </div>

                      <h4 className="kanban-ticket-title">{t.title}</h4>
                      <p className="kanban-ticket-snippet">{t.description.slice(0, 75)}...</p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span className="category-tag">{t.category}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} /> {t.diagnostic_progress}%
                        </span>
                      </div>

                      <div className="kanban-card-footer">
                        <span className="student-chip">
                          <User size={11} /> {t.netid}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {t.assigned_technician || 'Tier-1 AI Queue'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="kanban-empty-dropzone">
                    <span>Drop tickets here</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {inspectedTicket && (
        <div className="modal-backdrop" onClick={() => setInspectedTicket(null)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="ticket-badge-mono" style={{ fontSize: '1rem' }}>
                  {inspectedTicket.ticket_number}
                </span>
                <span className={`status-tag status-${inspectedTicket.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {inspectedTicket.status}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setInspectedTicket(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{inspectedTicket.title}</h3>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span><strong>Category:</strong> {inspectedTicket.category}</span>
                <span><strong>Priority:</strong> {inspectedTicket.priority}</span>
                <span><strong>Requester:</strong> {inspectedTicket.netid} ({inspectedTicket.email})</span>
                <span><strong>Location:</strong> {inspectedTicket.location}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Full Problem Statement</label>
                <p className="description-box">{inspectedTicket.description}</p>
              </div>

              {inspectedTicket.actions_taken && inspectedTicket.actions_taken.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Audit Log ({inspectedTicket.actions_taken.length} actions)</label>
                  <div className="actions-timeline">
                    {inspectedTicket.actions_taken.map((act) => (
                      <div key={act.id} className="timeline-entry">
                        <div className="timeline-top">
                          <span>{act.action}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {act.result && <p className="action-result">{act.result}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setInspectedTicket(null)}>
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const id = inspectedTicket.id;
                  setInspectedTicket(null);
                  onOpenInResolver(id);
                }}
              >
                <span>Open in Resolver</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
