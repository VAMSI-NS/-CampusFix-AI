import { useState, useEffect, useCallback } from 'react';
import {
  SystemStatusResponse,
} from '../types/chat';
import {
  CheckCircle2,
  AlertTriangle,
  Wifi,
  KeyRound,
  Printer,
  ShieldCheck,
  Gamepad2,
  Monitor,
  Shield,
  RotateCcw,
  Radio,
  BookOpen,
  Info,
} from 'lucide-react';

export default function CampusStatusPanel() {
  const [statusData, setStatusData] = useState<SystemStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data: SystemStatusResponse = await res.json();
        setStatusData(data);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to fetch campus status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 30000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const renderServiceIcon = (id: string) => {
    switch (id) {
      case 'eduroam':
        return <Wifi size={20} />;
      case 'canvas':
        return <BookOpen size={20} />;
      case 'duo':
        return <ShieldCheck size={20} />;
      case 'papercut':
        return <Printer size={20} />;
      case 'resnet':
        return <Gamepad2 size={20} />;
      case 'netid':
        return <KeyRound size={20} />;
      case 'lab_access':
        return <Monitor size={20} />;
      case 'vpn':
        return <Shield size={20} />;
      default:
        return <Radio size={20} />;
    }
  };

  const getStudentFriendlyName = (name: string) => {
    switch (name.toLowerCase()) {
      case 'eduroam wireless':
        return 'Campus Wi-Fi (Eduroam)';
      case 'canvas lms':
        return 'Canvas & Course Portal';
      case 'duo security 2fa':
        return 'Duo 2FA Login Verification';
      case 'papercut webprint':
        return 'Campus Student Printing';
      case 'dorm resnet wired':
        return 'Residence Hall Network (ResNet)';
      case 'netid password self-service':
        return 'Password & NetID Account Services';
      case 'cad computer labs':
        return 'Computer Labs & Workstations';
      case 'campus globalprotect vpn':
        return 'Off-Campus Access (VPN)';
      default:
        return name;
    }
  };

  const getFriendlyExplanation = (service: { name: string; status: string; status_message: string }) => {
    if (service.status === 'operational') {
      switch (service.name.toLowerCase()) {
        case 'eduroam wireless':
          return 'Wi-Fi is operating normally across all campus buildings.';
        case 'canvas lms':
          return 'No known problems. Assignments and grading portals online.';
        case 'duo security 2fa':
          return 'Duo mobile push and login verification working smoothly.';
        case 'papercut webprint':
          return 'Release stations and WebPrint ready in all libraries.';
        case 'dorm resnet wired':
          return 'Dorm Ethernet and console network fully active.';
        case 'netid password self-service':
          return 'Self-service password reset portal active 24/7.';
        case 'cad computer labs':
          return 'All public workstation clusters open for student login.';
        case 'campus globalprotect vpn':
          return 'Secure remote library & lab access available.';
        default:
          return 'All systems operating within normal parameters.';
      }
    } else if (service.status === 'degraded') {
      return 'Some users may experience slow connections or intermittent delays.';
    } else if (service.status === 'maintenance') {
      return 'Scheduled maintenance currently in progress.';
    } else {
      return 'Service currently experiencing an outage. Technicians are investigating.';
    }
  };

  return (
    <div className="campus-status-wrapper">
      {/* Friendly Overall Status Banner */}
      <div className="status-overview-banner">
        <div className="status-overview-left">
          <div
            className="status-large-icon"
            style={{
              background: statusData?.overall_status === 'operational' ? 'var(--success-50)' : 'var(--warning-50)',
              color: statusData?.overall_status === 'operational' ? 'var(--success-600)' : 'var(--warning-600)',
            }}
          >
            {statusData?.overall_status === 'operational' ? (
              <CheckCircle2 size={28} />
            ) : (
              <AlertTriangle size={28} />
            )}
          </div>
          <div>
            <h2 className="status-overview-title">
              {statusData?.overall_status === 'operational'
                ? 'All Campus IT Services Operational'
                : 'Service Advisory: Partial Performance Degradation'}
            </h2>
            <p className="status-overview-sub">
              Live status for university Wi-Fi, Canvas, student printing, and login services
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Updated at {lastUpdated}
            </span>
          )}
          <button
            className="btn-icon-sm"
            onClick={fetchStatus}
            title="Refresh service status"
          >
            <RotateCcw size={14} className={isLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Services Grid (Student-Friendly) */}
      <div className="services-grid">
        {statusData?.services.map((service) => {
          const isOperational = service.status === 'operational';
          return (
            <div key={service.id} className="service-status-card">
              <div className="service-card-top">
                <div className="service-name-wrap">
                  <div
                    style={{
                      color: isOperational ? 'var(--primary-600)' : 'var(--warning-600)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {renderServiceIcon(service.id)}
                  </div>
                  <h3 className="service-name">{getStudentFriendlyName(service.name)}</h3>
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
                  <span>{isOperational ? 'Operational' : service.status}</span>
                </span>
              </div>

              <p className="service-desc">{getFriendlyExplanation(service)}</p>

              <div className="service-meta-row">
                <span>99.9% Uptime</span>
                <span>{service.latency_ms || 12}ms response</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Campus IT Maintenance & Advisory Notices */}
      {statusData?.announcements && statusData.announcements.length > 0 && (
        <div className="announcements-section">
          <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Campus IT Notices & Maintenance</h3>
          {statusData.announcements.map((ann) => (
            <div key={ann.id} className="bulletin-card">
              <Info size={20} style={{ color: 'var(--primary-600)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{ann.title}</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {ann.message}
                </p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Posted: {new Date(ann.posted_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
