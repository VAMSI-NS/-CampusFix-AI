import {
  Bell,
  Clock,
  CheckCircle2,
  ExternalLink,
  Trash2,
} from 'lucide-react';

export interface SaaSNotification {
  id: string;
  category: 'sla' | 'incident' | 'ai' | 'assignment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetId?: string;
  targetTab?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SaaSNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNotificationClick: (notif: SaaSNotification) => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onNotificationClick,
}: NotificationCenterProps) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(var(--topbar-height) + 8px)',
        right: '1.5rem',
        width: '380px',
        maxHeight: '520px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface-raised)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={16} style={{ color: 'var(--primary-400)' }} />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Notifications</h4>
          {unreadCount > 0 && (
            <span className="badge-saas badge-saas-danger" style={{ fontSize: '0.65rem' }}>
              {unreadCount} New
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn-saas-ghost"
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
            onClick={onMarkAllAsRead}
            title="Mark all as read"
          >
            Mark Read
          </button>
          <button
            type="button"
            className="btn-saas-ghost"
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem', color: 'var(--text-muted)' }}
            onClick={onClearAll}
            title="Clear notifications"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4, color: 'var(--success)' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>All clear</div>
            <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>No pending alerts or notifications.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: n.read ? 'transparent' : 'rgba(59, 130, 246, 0.06)',
                  border: `1px solid ${n.read ? 'var(--border-subtle)' : 'rgba(59, 130, 246, 0.25)'}`,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => onNotificationClick(n)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span
                    className={`badge-saas ${
                      n.category === 'sla'
                        ? 'badge-saas-danger'
                        : n.category === 'ai'
                        ? 'badge-saas-ai'
                        : n.category === 'incident'
                        ? 'badge-saas-warning'
                        : 'badge-saas-primary'
                    }`}
                    style={{ fontSize: '0.62rem' }}
                  >
                    {n.category.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={11} />
                    {n.timestamp}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.15rem' }}>
                  {n.title}
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  {n.message}
                </p>
                {n.targetId && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Inspect {n.targetId} <ExternalLink size={11} />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '0.65rem 1rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface-raised)',
          textAlign: 'center',
        }}
      >
        <button
          type="button"
          className="btn-saas-ghost"
          style={{ width: '100%', fontSize: '0.76rem', color: 'var(--text-secondary)' }}
          onClick={onClose}
        >
          Close Notifications
        </button>
      </div>
    </div>
  );
}
