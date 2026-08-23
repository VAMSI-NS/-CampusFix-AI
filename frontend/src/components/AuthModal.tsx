import { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Sparkles,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  MapPin,
  Radio,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { CampusUser, LoginResponse, TechnicianSpecialization, UserRole } from '../types/chat';
import { authenticateClientMockUser } from '../data/mockData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, user: CampusUser) => void;
  initialRole?: UserRole;
}

const SPECIALIZATIONS: { id: TechnicianSpecialization; label: string }[] = [
  { id: 'Network', label: 'Network Specialist (Wi-Fi 6E, RADIUS, VLANs)' },
  { id: 'Hardware', label: 'Hardware Specialist (PaperCut, Lab Stations)' },
  { id: 'Software', label: 'Software Specialist (Canvas LMS, Academic Apps)' },
  { id: 'Support', label: 'Support Specialist (Tech Bar Walkup Triage)' },
  { id: 'IAM / Access', label: 'IAM / Access (Duo 2FA, Shibboleth SSO)' },
];

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'student',
}: AuthModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [username, setUsername] = useState('student');
  const [password, setPassword] = useState('student@123');
  const [specialization, setSpecialization] = useState<TechnicianSpecialization>('Network');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    if (role === 'host' || role === 'admin') {
      setUsername('VAMSI');
      setPassword('vamsi@123');
    } else if (role === 'technician') {
      setUsername('ramu');
      setPassword('ramu@123');
      setSpecialization('Network');
    } else {
      setUsername('student');
      setPassword('student@123');
    }
  };

  // Sync initial role
  useEffect(() => {
    if (initialRole) {
      handleRoleTabChange(initialRole);
    }
  }, [initialRole]);

  // Lock background scroll and support Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please provide both username/NetID and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role: selectedRole === 'admin' ? 'host' : selectedRole,
          specialization: selectedRole === 'technician' ? specialization : undefined,
        }),
      });

      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data: LoginResponse = await res.json();
          localStorage.setItem('campusfix_token', data.token);
          localStorage.setItem('campusfix_user', JSON.stringify(data.user));
          onLoginSuccess(data.token, data.user);
          onClose();
          return;
        }
      } else {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json') && res.status !== 404) {
          const errJson = await res.json().catch(() => ({}));
          setErrorMsg(errJson.detail || 'Authentication failed. Please verify your credentials.');
          return;
        }
      }
    } catch {
      // Backend unavailable, fallback to client authentication
    }

    // Client-side authentication fallback (for GitHub Pages / Offline mode)
    const mockResult = authenticateClientMockUser(
      username.trim(),
      password.trim(),
      selectedRole === 'admin' ? 'host' : selectedRole,
      selectedRole === 'technician' ? specialization : undefined
    );

    if (mockResult) {
      localStorage.setItem('campusfix_token', mockResult.token);
      localStorage.setItem('campusfix_user', JSON.stringify(mockResult.user));
      onLoginSuccess(mockResult.token, mockResult.user);
      onClose();
      return;
    } else {
      setErrorMsg('Invalid credentials. Please click one of the quick 1-click profiles below.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-saas" onClick={onClose}>
      <div
        className="modal-dialog-saas"
        style={{
          width: '100%',
          maxWidth: '820px',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.35fr)',
          background: 'var(--bg-card, #18181B)',
          border: '1px solid var(--border-default, #27272A)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 30px rgba(74, 222, 128, 0.08)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left SaaS Brand Panel */}
        <div
          style={{
            background: 'var(--bg-surface-subtle, #141416)',
            padding: '2.25rem 2rem',
            borderRight: '1px solid var(--border-default, #27272A)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0B0B0C',
                  boxShadow: '0 0 16px rgba(74, 222, 128, 0.35)',
                }}
              >
                <Sparkles size={20} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #F8FAFC)', fontFamily: 'var(--font-heading)' }}>
                CampusFix.AI
              </span>
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary, #F8FAFC)', lineHeight: 1.3, marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
              Enterprise Campus IT Operations & Incident Intelligence
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary, #A1A1AA)', lineHeight: 1.55 }}>
              Powered by NVIDIA Nemotron 3 Ultra & verified Vignan University geospatial telemetry.
            </p>

            {/* Feature Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary, #A1A1AA)' }}>
                <CheckCircle2 size={16} style={{ color: '#4ADE80', flexShrink: 0 }} />
                <span>Real-time autonomous diagnostic triage</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary, #A1A1AA)' }}>
                <MapPin size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
                <span>9 Verified Vignan University blocks</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary, #A1A1AA)' }}>
                <Radio size={16} style={{ color: '#4ADE80', flexShrink: 0 }} />
                <span>Live RADIUS, Canvas & Duo telemetry</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #71717A)', marginTop: '1.5rem', fontFamily: 'var(--font-mono)' }}>
            Vignan's Foundation for Science, Technology & Research (VFSTR)
          </div>
        </div>

        {/* Right Authentication Form Panel */}
        <div style={{ padding: '2.25rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg-card, #18181B)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #F8FAFC)', fontFamily: 'var(--font-heading)' }}>
                  Sign in to CampusFix
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #A1A1AA)' }}>
                  Select your role to access authorized tools.
                </p>
              </div>
              <button
                type="button"
                className="btn-saas-ghost"
                style={{ padding: '0.4rem', color: 'var(--text-muted, #71717A)', borderRadius: '8px' }}
                onClick={onClose}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Role Tab Switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.35rem',
                background: 'var(--bg-surface, #111111)',
                border: '1px solid var(--border-default, #27272A)',
                padding: '0.25rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
              }}
            >
              <button
                type="button"
                style={{
                  padding: '0.55rem 0.25rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedRole === 'student' ? '#4ADE80' : 'transparent',
                  color: selectedRole === 'student' ? '#0B0B0C' : 'var(--text-secondary, #A1A1AA)',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => handleRoleTabChange('student')}
              >
                🎓 Student
              </button>
              <button
                type="button"
                style={{
                  padding: '0.55rem 0.25rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedRole === 'technician' ? '#4ADE80' : 'transparent',
                  color: selectedRole === 'technician' ? '#0B0B0C' : 'var(--text-secondary, #A1A1AA)',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => handleRoleTabChange('technician')}
              >
                🛠️ Staff
              </button>
              <button
                type="button"
                style={{
                  padding: '0.55rem 0.25rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedRole === 'host' || selectedRole === 'admin' ? '#4ADE80' : 'transparent',
                  color: selectedRole === 'host' || selectedRole === 'admin' ? '#0B0B0C' : 'var(--text-secondary, #A1A1AA)',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => handleRoleTabChange('host')}
              >
                👑 Host
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '0.75rem 0.9rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  color: '#EF4444',
                  fontSize: '0.78rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #A1A1AA)', display: 'block', marginBottom: '0.35rem' }}>
                  NetID / University Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #71717A)' }} />
                  <input
                    type="text"
                    className="saas-input"
                    style={{
                      paddingLeft: '2.5rem',
                      background: 'var(--bg-surface, #111111)',
                      border: '1px solid var(--border-default, #27272A)',
                      color: 'var(--text-primary, #F8FAFC)',
                      borderRadius: '12px',
                    }}
                    placeholder="Enter your university username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #A1A1AA)', display: 'block', marginBottom: '0.35rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #71717A)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="saas-input"
                    style={{
                      paddingLeft: '2.5rem',
                      paddingRight: '2.5rem',
                      background: 'var(--bg-surface, #111111)',
                      border: '1px solid var(--border-default, #27272A)',
                      color: 'var(--text-primary, #F8FAFC)',
                      borderRadius: '12px',
                    }}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted, #71717A)', cursor: 'pointer' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {selectedRole === 'technician' && (
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #A1A1AA)', display: 'block', marginBottom: '0.35rem' }}>
                    Specialization Domain
                  </label>
                  <select
                    className="saas-input"
                    style={{
                      background: 'var(--bg-surface, #111111)',
                      border: '1px solid var(--border-default, #27272A)',
                      color: 'var(--text-primary, #F8FAFC)',
                      borderRadius: '12px',
                    }}
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value as TechnicianSpecialization)}
                  >
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  marginTop: '0.4rem',
                  borderRadius: '12px',
                  background: '#4ADE80',
                  color: '#0B0B0C',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 0 16px rgba(74, 222, 128, 0.35)',
                  transition: 'all var(--transition-fast)',
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {selectedRole.toUpperCase()}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 1-Click Fast Access Chips */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-default, #27272A)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #71717A)', display: 'block', marginBottom: '0.45rem', fontWeight: 600 }}>
              ⚡ 1-Click Demo Profiles:
            </span>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'var(--bg-surface, #111111)',
                  border: '1px solid var(--border-default, #27272A)',
                  color: 'var(--text-secondary, #A1A1AA)',
                  cursor: 'pointer',
                }}
                onClick={() => handleRoleTabChange('student')}
              >
                Student (Marcus)
              </button>
              <button
                type="button"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'var(--bg-surface, #111111)',
                  border: '1px solid var(--border-default, #27272A)',
                  color: '#4ADE80',
                  cursor: 'pointer',
                }}
                onClick={() => handleRoleTabChange('technician')}
              >
                Tech (Ramu)
              </button>
              <button
                type="button"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'var(--bg-surface, #111111)',
                  border: '1px solid var(--border-default, #27272A)',
                  color: '#F59E0B',
                  cursor: 'pointer',
                }}
                onClick={() => handleRoleTabChange('host')}
              >
                Host (VAMSI)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
