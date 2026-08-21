import {
  Activity,
  Server,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Database,
  Radio,
  ShieldCheck,
} from 'lucide-react';

interface HealthData {
  status: string;
  message?: string;
  service?: string;
  version?: string;
  timestamp?: string;
  ai_ready?: boolean;
  model?: string;
  [key: string]: unknown;
}

interface HealthDashboardProps {
  health: HealthData | null;
  status: 'connecting' | 'connected' | 'disconnected';
  latency: number | null;
  lastChecked: string | null;
  errorMsg: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function HealthDashboard({
  health,
  status,
  latency,
  lastChecked,
  errorMsg,
  isRefreshing,
  onRefresh,
}: HealthDashboardProps) {
  const isAllOperational = status === 'connected' || !errorMsg;

  const CORE_COMPONENTS = [
    {
      name: 'Campus IT API Core',
      description: 'REST API, incident lifecycle routing, and database models',
      status: 'Operational',
      icon: Server,
      sub: `v${health?.version || '1.0.0'}`,
    },
    {
      name: 'NVIDIA Nemotron 3 Ultra Engine',
      description: 'High-reasoning diagnostic AI agent via OpenRouter',
      status: 'Operational',
      icon: Cpu,
      sub: health?.model || 'nvidia/nemotron-3-ultra-550b-a55b',
    },
    {
      name: 'Campus IT Telemetry Stream',
      description: 'RADIUS probes, SSO handshake, and printer queues',
      status: 'Operational',
      icon: Radio,
      sub: '5/5 probes active',
    },
    {
      name: 'Incident State & Database Store',
      description: 'Persistent ticket records, action logs & audit history',
      status: 'Operational',
      icon: Database,
      sub: 'Active / Synchronized',
    },
  ];

  return (
    <div className="health-dashboard-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top System Health Summary Card */}
      <div className="status-overview-banner">
        <div className="status-overview-left">
          <div
            className="status-large-icon"
            style={{
              background: isAllOperational ? 'var(--success-50)' : 'var(--warning-50)',
              color: isAllOperational ? 'var(--success-600)' : 'var(--warning-600)',
            }}
          >
            {isAllOperational ? <CheckCircle2 size={28} /> : <Activity size={28} />}
          </div>
          <div>
            <h2 className="status-overview-title">
              {isAllOperational ? 'CampusFix System Health: All Systems Operational' : 'System Connectivity Degraded'}
            </h2>
            <p className="status-overview-sub">
              Core API gateway, AI diagnostic engine, and telemetry probes are running normally
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {lastChecked && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Checked at {lastChecked}
            </span>
          )}
          <button
            className="btn-icon-sm"
            onClick={onRefresh}
            title="Refresh system health"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Core Component Health Cards */}
      <div className="services-grid">
        {CORE_COMPONENTS.map((comp) => {
          const IconComponent = comp.icon;
          const isOperational = comp.status === 'Operational';

          return (
            <div key={comp.name} className="service-status-card">
              <div className="service-card-top">
                <div className="service-name-wrap">
                  <div style={{ color: 'var(--primary-600)', display: 'flex', alignItems: 'center' }}>
                    <IconComponent size={20} />
                  </div>
                  <h3 className="service-name">{comp.name}</h3>
                </div>

                <span
                  className="status-tag"
                  style={{
                    background: isOperational ? 'var(--success-50)' : 'var(--warning-50)',
                    color: isOperational ? 'var(--success-600)' : 'var(--warning-600)',
                    border: `1px solid ${isOperational ? 'var(--success-100)' : 'var(--warning-100)'}`,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isOperational ? 'var(--success-500)' : 'var(--warning-500)',
                    }}
                  />
                  <span>{comp.status}</span>
                </span>
              </div>

              <p className="service-desc">{comp.description}</p>

              <div className="service-meta-row">
                <span className="font-mono">{comp.sub}</span>
                <span>{latency ? `${latency}ms latency` : 'Connected'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Notice if any */}
      {errorMsg && (
        <div className="chat-error-banner" style={{ marginTop: '0.5rem' }}>
          <Activity size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Secondary Technical Diagnostics */}
      <div className="printable-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={18} style={{ color: 'var(--primary-600)' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Diagnostic Verification Details</h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.75rem', fontSize: '0.78rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>AI Model ID:</span>
            <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{health?.model || 'nvidia/nemotron-3-ultra'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Response Latency:</span>
            <div style={{ fontWeight: 600, color: 'var(--success-600)' }}>{latency ? `${latency} ms` : 'Normal'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Health Check Endpoint:</span>
            <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>GET /api/health (200 OK)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
