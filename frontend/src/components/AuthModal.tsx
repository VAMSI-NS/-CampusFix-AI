import { useState } from 'react';
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

  if (!isOpen) return null;

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    if (role === 'host') {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please provide both username and password.');
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
          role: selectedRole,
          specialization: selectedRole === 'technician' ? specialization : undefined,
        }),
      });

      if (res.ok) {
        const data: LoginResponse = await res.json();
        localStorage.setItem('campusfix_token', data.token);
        localStorage.setItem('campusfix_user', JSON.stringify(data.user));
        onLoginSuccess(data.token, data.user);
        onClose();
        return;
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMsg(errJson.detail || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      // Offline fallback
      const mockResult = authenticateClientMockUser(
        username.trim(),
        password.trim(),
        selectedRole,
        selectedRole === 'technician' ? specialization : undefined
      );

      if (mockResult) {
        localStorage.setItem('campusfix_token', mockResult.token);
        localStorage.setItem('campusfix_user', JSON.stringify(mockResult.user));
        onLoginSuccess(mockResult.token, mockResult.user);
        onClose();
        return;
      } else {
        setErrorMsg('Invalid NetID or password. Use one of the fast 1-click accounts below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop-saas" onClick={onClose}>
      <div
        className="modal-dialog-saas"
        style={{
          width: '100%',
          maxWidth: '820px',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.3fr)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left SaaS Brand Panel */}
        <div
          style={{
            background: 'linear-gradient(145deg, #090e1a 0%, #111d33 100%)',
            padding: '2rem',
            borderRight: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--ai-cyan) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 0 14px var(--primary-glow)',
                }}
              >
                <Sparkles size={20} />
              </div>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                CAMPUSFIX.AI
              </span>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.3, marginBottom: '0.75rem' }}>
              Enterprise Campus IT Operations & Incident Intelligence
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Powered by NVIDIA Nemotron & verified Vignan University geospatial telemetry.
            </p>

            {/* Feature Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />
                <span>Real-time autonomous diagnostic triage</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                <MapPin size={15} style={{ color: '#fb923c' }} />
                <span>9 Verified Vignan University blocks</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                <Radio size={15} style={{ color: 'var(--ai-cyan)' }} />
                <span>Live RADIUS, LMS & 2FA telemetry</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Vignan's Foundation for Science, Technology & Research (VFSTR) • Vadlamudi
          </div>
        </div>

        {/* Right Authentication Form Panel */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  Sign in to CampusFix
                </h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Select your role to access authorized tools.
                </p>
              </div>
              <button
                type="button"
                className="btn-saas-ghost"
                style={{ padding: '0.35rem' }}
                onClick={onClose}
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
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                padding: '0.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
              }}
            >
              <button
                type="button"
                style={{
                  padding: '0.5rem 0.25rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: selectedRole === 'student' ? 'var(--primary-600)' : 'transparent',
                  color: selectedRole === 'student' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => handleRoleTabChange('student')}
              >
                🎓 Student
              </button>
              <button
                type="button"
                style={{
                  padding: '0.5rem 0.25rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: selectedRole === 'technician' ? 'var(--primary-600)' : 'transparent',
                  color: selectedRole === 'technician' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => handleRoleTabChange('technician')}
              >
                🛠️ Staff
              </button>
              <button
                type="button"
                style={{
                  padding: '0.5rem 0.25rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: selectedRole === 'host' ? '#f59e0b' : 'transparent',
                  color: selectedRole === 'host' ? '#000000' : 'var(--text-secondary)',
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
                  padding: '0.65rem 0.85rem',
                  background: 'var(--danger-subtle)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fca5a5',
                  fontSize: '0.76rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  NetID / University Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="saas-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Enter your university username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="saas-input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {selectedRole === 'technician' && (
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    Technician Specialization Domain
                  </label>
                  <select
                    className="saas-input"
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
                className="btn-saas btn-saas-primary"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In as {selectedRole.toUpperCase()}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 1-Click Fast Access Chips */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              ⚡ 1-Click Demo Profiles:
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="badge-saas badge-saas-neutral"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  handleRoleTabChange('student');
                }}
              >
                Marcus (Student)
              </button>
              <button
                type="button"
                className="badge-saas badge-saas-primary"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  handleRoleTabChange('technician');
                }}
              >
                Ramu (Network Tech)
              </button>
              <button
                type="button"
                className="badge-saas badge-saas-warning"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  handleRoleTabChange('host');
                }}
              >
                VAMSI (Host)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
