import { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Ticket as TicketIcon,
  Sparkles,
  Radio,
  BookOpen,
  ArrowRight,
  X,
  Bot,
} from 'lucide-react';
import { Ticket } from '../types/chat';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  onNavigateToTab: (tab: any) => void;
  onOpenTicket: (ticketId: string) => void;
  onNavigateToMap: (locCode?: string) => void;
  onAskAi: (query: string) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  tickets,
  onNavigateToTab,
  onOpenTicket,
  onNavigateToMap,
  onAskAi,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTickets = tickets.filter(
    (t) =>
      t.ticket_number.toLowerCase().includes(query.toLowerCase()) ||
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.location?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const campusBuildings = [
    { name: 'U-Block (Main Academic Block)', code: 'U-BLK', id: 'loc-u-block' },
    { name: 'NTR-Vignan Library & Tech Bar', code: 'NTR-LIB', id: 'loc-ntr-library' },
    { name: 'A-Block (Admin & Health Center)', code: 'A-BLK', id: 'loc-a-block' },
    { name: 'Visvesvaraya Block & Amphitheater', code: 'VISV-BLK', id: 'loc-visv-block' },
    { name: 'VFSTR Guest House', code: 'VFSTR-GH', id: 'loc-guest-house' },
  ].filter(
    (b) =>
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="modal-backdrop-saas" onClick={onClose}>
      <div
        className="modal-dialog-saas"
        style={{ width: '100%', maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--bg-surface)',
          }}
        >
          <Search size={18} style={{ color: 'var(--primary-400)' }} />
          <input
            type="text"
            autoFocus
            className="saas-input"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: '1rem',
              color: '#ffffff',
            }}
            placeholder="Search tickets, buildings, services, or ask AI..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="btn-saas-ghost"
              style={{ padding: '0.2rem' }}
              onClick={() => setQuery('')}
            >
              <X size={16} />
            </button>
          )}
          <span className="search-shortcut-key">ESC</span>
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.75rem' }}>
          {/* Ask AI Command */}
          {query.trim() && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="nav-section-title">AI Action</div>
              <button
                type="button"
                className="sidebar-nav-item"
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
                  borderColor: 'var(--border-ai)',
                }}
                onClick={() => {
                  onAskAi(query);
                  onClose();
                }}
              >
                <Bot size={16} style={{ color: 'var(--ai-cyan)' }} />
                <span>Ask CampusFix AI: "<strong>{query}</strong>"</span>
                <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--ai-cyan)' }} />
              </button>
            </div>
          )}

          {/* Matching Tickets */}
          {filteredTickets.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="nav-section-title">Tickets</div>
              {filteredTickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="sidebar-nav-item"
                  onClick={() => {
                    onOpenTicket(t.ticket_number);
                    onClose();
                  }}
                >
                  <TicketIcon size={16} />
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <strong style={{ color: '#ffffff', fontSize: '0.82rem' }}>{t.ticket_number}</strong>
                      <span className="badge-saas badge-saas-primary" style={{ fontSize: '0.65rem' }}>
                        {t.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title} • {t.location}
                    </span>
                  </div>
                  <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          )}

          {/* Campus Buildings */}
          {campusBuildings.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="nav-section-title">Vignan Campus Locations</div>
              {campusBuildings.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="sidebar-nav-item"
                  onClick={() => {
                    onNavigateToMap(b.id);
                    onClose();
                  }}
                >
                  <MapPin size={16} style={{ color: '#fb923c' }} />
                  <span>{b.name}</span>
                  <span className="badge-saas badge-saas-neutral" style={{ marginLeft: 'auto' }}>
                    {b.code}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Navigations */}
          <div>
            <div className="nav-section-title">Quick Jump</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
              <button
                type="button"
                className="sidebar-nav-item"
                onClick={() => {
                  onNavigateToTab('command-center');
                  onClose();
                }}
              >
                <Sparkles size={16} style={{ color: 'var(--ai-cyan)' }} />
                <span>AI Command Center</span>
              </button>
              <button
                type="button"
                className="sidebar-nav-item"
                onClick={() => {
                  onNavigateToTab('map');
                  onClose();
                }}
              >
                <MapPin size={16} style={{ color: '#38bdf8' }} />
                <span>Satellite Campus Map</span>
              </button>
              <button
                type="button"
                className="sidebar-nav-item"
                onClick={() => {
                  onNavigateToTab('status');
                  onClose();
                }}
              >
                <Radio size={16} style={{ color: '#34d399' }} />
                <span>Service Health</span>
              </button>
              <button
                type="button"
                className="sidebar-nav-item"
                onClick={() => {
                  onNavigateToTab('kb');
                  onClose();
                }}
              >
                <BookOpen size={16} style={{ color: '#a78bfa' }} />
                <span>Knowledge Base</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.65rem 1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-raised)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>Use <strong>↑</strong> <strong>↓</strong> to navigate</span>
          <span>Press <strong>ESC</strong> to dismiss</span>
        </div>
      </div>
    </div>
  );
}
