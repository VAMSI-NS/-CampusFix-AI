import { useState, useEffect, useMemo } from 'react';
import {
  Ticket,
  TicketStatus,
  TicketCategory,
} from '../types/chat';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  LifeBuoy,
  RotateCcw,
  ArrowUpRight,
} from 'lucide-react';
import { apiUrl } from '../api';

interface TicketHistoryProps {
  onSelectTicketForResolver: (ticketId: string) => void;
}

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

const STATUS_FILTERS: (TicketStatus | 'All')[] = [
  'All',
  'New',
  'Diagnosing',
  'Waiting for Student',
  'Resolved',
  'Escalated',
];

export default function TicketHistory({
  onSelectTicketForResolver,
}: TicketHistoryProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'All'>('All');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/tickets'));
      if (res.ok) {
        const data: Ticket[] = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to load ticket history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedCategory !== 'All' && t.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'All' && t.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          t.ticket_number.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.netid.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [tickets, selectedCategory, selectedStatus, searchQuery]);

  return (
    <div className="history-container">
      {/* Header & Controls Bar */}
      <div className="history-header-bar">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Incident Activity History</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Track active troubleshooting workflows, student tickets, and verified resolutions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box-sm">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by ID, title, NetID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

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

          <select
            className="form-select-sm"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as TicketStatus | 'All')}
          >
            {STATUS_FILTERS.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>

          <button
            className="btn-icon-sm"
            onClick={fetchTickets}
            title="Refresh history list"
          >
            <RotateCcw size={13} className={isLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Incident Timeline Rows */}
      <div className="history-list-view">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((t) => (
            <div
              key={t.id}
              className="history-row-card"
              onClick={() => setSelectedTicket(t)}
            >
              {/* Left Column: ID & Status */}
              <div className="history-row-lead">
                <span className="ticket-badge-mono">{t.ticket_number}</span>
                <span className={`status-tag status-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {t.status}
                </span>
                <span className={`priority-tag priority-${t.priority.toLowerCase()}`}>
                  {t.priority}
                </span>
              </div>

              {/* Middle Column: Title, Category, and Details */}
              <div className="history-row-body">
                <h4 className="history-row-title">{t.title}</h4>
                <div className="history-meta-items">
                  <span className="category-tag">{t.category}</span>
                  <span className="history-meta-text">
                    <User size={12} /> {t.netid}
                  </span>
                  <span className="history-meta-text">
                    <MapPin size={12} /> {t.location}
                  </span>
                  <span className="history-meta-text">
                    <Clock size={12} /> {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>

                {t.status === 'Resolved' && t.resolution_details && (
                  <div className="history-resolution-excerpt">
                    <CheckCircle2 size={13} style={{ color: 'var(--success-600)', flexShrink: 0 }} />
                    <span><strong>Resolution:</strong> {t.resolution_details}</span>
                  </div>
                )}

                {t.status === 'Escalated' && t.escalation_info && (
                  <div className="history-escalation-excerpt">
                    <AlertTriangle size={13} style={{ color: 'var(--warning-600)', flexShrink: 0 }} />
                    <span><strong>Escalated:</strong> {t.escalation_info.tier} — {t.escalation_info.reason}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Stage & Action */}
              <div className="history-row-action">
                <div className="history-stage-pill">
                  <span>Stage: {t.diagnostic_stage}</span>
                  <span className="stage-pct">{t.diagnostic_progress}%</span>
                </div>
                <button
                  className="btn-secondary-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTicketForResolver(t.id);
                  }}
                  title="Open in AI Help Desk Workbench"
                >
                  <span>Resolve</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="history-empty-state">
            <LifeBuoy size={36} style={{ color: 'var(--text-muted)' }} />
            <h3>No Incidents Found</h3>
            <p>No historical tickets match your search or filter criteria.</p>
            <button
              className="btn-secondary-sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedStatus('All');
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedTicket && (
        <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="ticket-badge-mono" style={{ fontSize: '1rem' }}>{selectedTicket.ticket_number}</span>
                <span className={`status-tag status-${selectedTicket.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {selectedTicket.status}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTicket(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{selectedTicket.title}</h3>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span><strong>Category:</strong> {selectedTicket.category}</span>
                <span><strong>Priority:</strong> {selectedTicket.priority}</span>
                <span><strong>Student:</strong> {selectedTicket.netid} ({selectedTicket.email})</span>
                <span><strong>Location:</strong> {selectedTicket.location}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Issue Statement</label>
                <p className="description-box">{selectedTicket.description}</p>
              </div>

              {selectedTicket.resolution_details && (
                <div className="resolved-state-banner">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>Resolution Summary:</strong>
                    <p style={{ marginTop: '0.2rem', fontSize: '0.8125rem' }}>{selectedTicket.resolution_details}</p>
                  </div>
                </div>
              )}

              {selectedTicket.escalation_info && (
                <div className="escalated-state-banner">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Escalated to: {selectedTicket.escalation_info.tier} ({selectedTicket.escalation_info.department})</strong>
                    <p style={{ marginTop: '0.2rem', fontSize: '0.8125rem' }}>{selectedTicket.escalation_info.reason}</p>
                  </div>
                </div>
              )}

              {selectedTicket.actions_taken && selectedTicket.actions_taken.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Diagnostic Audit Trail ({selectedTicket.actions_taken.length} actions)</label>
                  <div className="actions-timeline">
                    {selectedTicket.actions_taken.map((act) => (
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
              <button className="btn-secondary" onClick={() => setSelectedTicket(null)}>
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const id = selectedTicket.id;
                  setSelectedTicket(null);
                  onSelectTicketForResolver(id);
                }}
              >
                Open in Workbench
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
